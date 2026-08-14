import os
import time
import logging
from typing import Optional, List, Dict, Any
from datetime import datetime

from fastapi import FastAPI, HTTPException, BackgroundTasks, Header, Depends, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from presidio_analyzer import AnalyzerEngine
from presidio_anonymizer import AnonymizerEngine
from presidio_anonymizer.entities import OperatorConfig
from langchain_groq import ChatGroq
from dotenv import load_dotenv
from sqlalchemy import func

from config import settings
from database import SessionLocal, engine
from models import SanitizationAuditLog
from middleware import RequestSizeLimitMiddleware, SecurityHeadersMiddleware
from circuit_breaker import circuit_breaker

# Configure Structured Logger (Zero raw PII logged)
logging.basicConfig(
    level=getattr(logging, settings.LOG_LEVEL.upper(), logging.INFO),
    format="%(asctime)s [%(levelname)s] %(message)s"
)

logger = logging.getLogger("pryvwire_security_middleware")

# Initialize Rate Limiter
limiter = Limiter(key_func=get_remote_address, default_limits=[settings.RATE_LIMIT])

app = FastAPI(
    title="PryvWire Security Gateway",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# Register Middleware
app.add_middleware(SecurityHeadersMiddleware)
app.add_middleware(RequestSizeLimitMiddleware, max_bytes=settings.MAX_REQUEST_SIZE_BYTES)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows Vercel preview & production deployments
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Custom Structured Validation Error Handler
@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    errors = exc.errors()
    error_msg = errors[0].get("msg", "Invalid payload") if errors else "Validation failed"
    return JSONResponse(
        status_code=status.HTTP_400_BAD_REQUEST,
        content={
            "error": "Bad Request",
            "detail": f"Validation Error: {error_msg}"
        }
    )

# Custom Structured HTTP Exception Handler
@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    return JSONResponse(
        status_code=exc.status_code,
        headers=exc.headers,
        content={
            "error": "Security Middleware Notice" if exc.status_code < 500 else "Internal Server Error",
            "detail": exc.detail
        }
    )

# Initialize Microsoft Presidio Engines with lightweight spaCy model (fits within Render 512MB RAM limit)
logger.info("Initializing Presidio NLP Engines...")
try:
    from presidio_analyzer.nlp_engine import NlpEngineProvider
    configuration = {
        "nlp_engine_name": "spacy",
        "models": [{"lang_code": "en", "model_name": "en_core_web_sm"}],
    }
    provider = NlpEngineProvider(nlp_configuration=configuration)
    nlp_engine = provider.create_engine()
    analyzer = AnalyzerEngine(nlp_engine=nlp_engine)
    logger.info("Presidio AnalyzerEngine initialized with lightweight 'en_core_web_sm' model.")
except Exception as nlp_err:
    logger.warning(f"Failed to load lightweight spaCy engine ({nlp_err}), falling back to default AnalyzerEngine.")
    analyzer = AnalyzerEngine()

anonymizer = AnonymizerEngine()
logger.info("Presidio NLP Engines initialized successfully.")

# Redaction Operators Setup
operators = {
    "DEFAULT": OperatorConfig("replace", {"new_value": "<REDACTED>"})
}
for entity in ["EMAIL_ADDRESS", "PHONE_NUMBER", "PERSON", "US_SSN", "CREDIT_CARD"]:
    operators[entity] = OperatorConfig("replace", {"new_value": f"[REDACTED: {entity}]"})


# --- Pydantic Schemas ---
class SecurityRequest(BaseModel):
    user_prompt: str = Field(
        ...,
        min_length=1,
        max_length=settings.MAX_REQUEST_SIZE_BYTES,
        description="Input text string to intercept and sanitize"
    )
    client_id: Optional[str] = Field(None, max_length=100, description="Optional client caller identifier")


# --- API Key Authentication Dependency ---
def verify_api_key(x_api_key: Optional[str] = Header(None)):
    """
    Validates X-API-Key header against env configuration.
    Enforced if REQUIRE_API_KEY is True or if header is explicitly provided.
    """
    if settings.REQUIRE_API_KEY:
        if not x_api_key or x_api_key != settings.API_KEY:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Unauthorized: Invalid or missing X-API-Key header."
            )
    elif x_api_key and x_api_key != settings.API_KEY:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Unauthorized: Invalid X-API-Key header provided."
        )
    return x_api_key


# --- Isolation-Wrapped Audit Logging ---
def log_audit_metrics(threats: int, entities: list, process_time: int, client: str = None):
    """
    Asynchronous audit logger.
    Wrapped in try/except so DB failures NEVER surface to the client or block responses.
    """
    try:
        db = SessionLocal()
        try:
            log_entry = SanitizationAuditLog(
                threats_intercepted=threats,
                entities_blocked=",".join(entities),
                processing_time_ms=process_time,
                client_id=client or "anonymous"
            )
            db.add(log_entry)
            db.commit()
        finally:
            db.close()
    except Exception as db_err:
        logger.error(f"Audit log write failed safely (non-blocking): {db_err}")


# --- API Routes ---

@app.get("/health")
def health_check():
    """
    Full readiness health check verifying DB connectivity and Groq configuration.
    """
    db_reachable = False
    try:
        db = SessionLocal()
        db.execute(func.now())
        db.close()
        db_reachable = True
    except Exception as err:
        logger.error(f"Database health check failed: {err}")

    groq_configured = bool(settings.GROQ_API_KEY and settings.GROQ_API_KEY != "your_actual_api_key_here")

    return {
        "status": "Secure and Operational" if db_reachable else "Degraded",
        "database_connected": db_reachable,
        "groq_configured": groq_configured,
        "presidio_nlp_ready": True,
        "circuit_breaker": circuit_breaker.get_status()
    }

@app.get("/metrics")
def get_metrics():
    """
    Exposes real-time aggregated metrics backing the frontend metrics dashboard cards.
    """
    try:
        db = SessionLocal()
        try:
            total_requests = db.query(SanitizationAuditLog).count()
            total_threats = db.query(func.sum(SanitizationAuditLog.threats_intercepted)).scalar() or 0
            avg_latency = db.query(func.avg(SanitizationAuditLog.processing_time_ms)).scalar() or 0

            # Entities breakdown
            logs = db.query(SanitizationAuditLog.entities_blocked).filter(SanitizationAuditLog.entities_blocked != "").all()
            breakdown = {}
            for (eblocks,) in logs:
                if eblocks:
                    for entity in eblocks.split(","):
                        entity = entity.strip()
                        if entity:
                            breakdown[entity] = breakdown.get(entity, 0) + 1

            return {
                "total_requests": total_requests,
                "total_threats_blocked": int(total_threats),
                "avg_processing_time_ms": round(float(avg_latency), 2),
                "entities_breakdown": breakdown,
                "circuit_breaker": circuit_breaker.get_status(),
                "active_model": settings.GROQ_MODEL
            }
        finally:
            db.close()
    except Exception as e:
        logger.error(f"Metrics query failed: {e}")
        return {
            "total_requests": 0,
            "total_threats_blocked": 0,
            "avg_processing_time_ms": 0,
            "entities_breakdown": {},
            "circuit_breaker": circuit_breaker.get_status(),
            "active_model": settings.GROQ_MODEL
        }

@app.post("/api/v1/sanitize")
@limiter.limit(settings.RATE_LIMIT)
async def process_secure_prompt(
    request: Request,
    body: SecurityRequest,
    background_tasks: BackgroundTasks,
    api_key: Optional[str] = Depends(verify_api_key)
):
    start_time = time.time()
    raw_text = body.user_prompt
    req_id = getattr(request.state, "request_id", "unknown")

    try:
        # Step 1: Intercept & Analyze PII via Presidio
        results = analyzer.analyze(
            text=raw_text,
            entities=["EMAIL_ADDRESS", "PHONE_NUMBER", "PERSON", "US_SSN", "CREDIT_CARD"],
            language='en'
        )

        # Step 2: Redact PII into clear UI tags
        anonymized = anonymizer.anonymize(
            text=raw_text,
            analyzer_results=results,
            operators=operators
        )
        safe_prompt = anonymized.text

        threats_blocked = len(results)
        entities_found = list(set([res.entity_type for res in results]))

        # Step 3: Groq Call with Timeout, Retries & Circuit Breaker
        groq_key = settings.GROQ_API_KEY
        if not groq_key or groq_key == "your_actual_api_key_here":
            llm_response_text = "SYSTEM MESSAGE: GROQ_API_KEY not configured in .env. LLM bypassed."
        elif not circuit_breaker.allow_request():
            llm_response_text = "LLM Gateway Notification: Circuit Breaker OPEN due to sustained upstream outage. Sanitized payload preserved."
        else:
            try:
                llm = ChatGroq(
                    temperature=0,
                    groq_api_key=groq_key,
                    model_name=settings.GROQ_MODEL,
                    timeout=settings.GROQ_TIMEOUT_SECONDS,
                    max_retries=settings.GROQ_MAX_RETRIES
                )
                llm_response = llm.invoke(safe_prompt)
                llm_response_text = llm_response.content
                circuit_breaker.record_success()
            except Exception as groq_err:
                circuit_breaker.record_failure()
                logger.error(f"Groq API call failed after retries: {groq_err}", extra={"request_id": req_id})
                llm_response_text = f"LLM Gateway Notification: Upstream provider temporary issue ({type(groq_err).__name__}). Sanitized payload preserved."

        processing_time_ms = int((time.time() - start_time) * 1000)

        # Step 4: Dispatch Non-Blocking Audit Logging (Zero-PII)
        background_tasks.add_task(
            log_audit_metrics,
            threats_blocked,
            entities_found,
            processing_time_ms,
            body.client_id
        )

        # Log Request (Zero PII!)
        logger.info(
            f"Sanitized request completed - threats_blocked={threats_blocked}, latency_ms={processing_time_ms}",
            extra={"request_id": req_id}
        )

        return {
            "status": "success",
            "data": {
                "original_prompt": raw_text,
                "sanitized_prompt": safe_prompt,
                "llm_response": llm_response_text,
                "metrics": {
                    "threats_intercepted": threats_blocked,
                    "entities_blocked": entities_found,
                    "processing_time_ms": processing_time_ms
                }
            }
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Fail-closed interceptor triggered: {e}", extra={"request_id": req_id})
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Security Middleware Error: Request blocked to prevent data leakage."
        )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

import os
import time
import logging
from typing import List, Optional
from datetime import datetime
from fastapi import FastAPI, HTTPException, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from presidio_analyzer import AnalyzerEngine
from presidio_anonymizer import AnonymizerEngine
from langchain_groq import ChatGroq
from dotenv import load_dotenv
from sqlalchemy.orm import Session
from sqlalchemy import func

from database import get_db, AuditLog, Base, engine

load_dotenv()

# Configure structured logging (Zero raw PII will ever be logged)
logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("pii_security_service")

# Initialize FastAPI App
app = FastAPI(
    title="Enterprise PII Security Service",
    description="Zero-PII Compliance Interceptor & Secure LLM Gateway",
    version="1.0.0"
)

# Enable CORS for frontend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize Microsoft Presidio NLP Engines
try:
    analyzer = AnalyzerEngine()
    anonymizer = AnonymizerEngine()
    logger.info("Presidio Analyzer & Anonymizer initialized successfully.")
except Exception as e:
    logger.error(f"Critical error initializing Presidio NLP: {e}")
    analyzer = None
    anonymizer = None

# Configure Supported PII Entities
SUPPORTED_ENTITIES = [
    "EMAIL_ADDRESS",
    "PHONE_NUMBER",
    "PERSON",
    "CREDIT_CARD",
    "CRYPTO",
    "US_SSN",
    "IP_ADDRESS",
    "IBAN_CODE",
    "LOCATION",
    "DATE_TIME",
]

# Initialize Groq LLM Client
groq_api_key = os.environ.get("GROQ_API_KEY", "")
model_name = os.environ.get("GROQ_MODEL", "llama-3.1-8b-instant")

llm_client = None
if groq_api_key and groq_api_key != "your_actual_api_key_here":
    try:
        llm_client = ChatGroq(
            temperature=0.2,
            groq_api_key=groq_api_key,
            model_name=model_name
        )
        logger.info(f"Groq LLM Client initialized with model: {model_name}")
    except Exception as e:
        logger.warning(f"Could not initialize ChatGroq: {e}. Fallback to simulated mode.")


# --- Pydantic Schemas ---
class SecurityRequest(BaseModel):
    user_prompt: str = Field(..., min_length=1, description="Raw input prompt to intercept and sanitize")
    simulate_failure: Optional[bool] = Field(False, description="Simulate a fail-closed exception for verification testing")

class EntityDetectionItem(BaseModel):
    entity_type: str
    start: int
    end: int
    score: float
    text_snippet: str

class SecurityResponse(BaseModel):
    status: str
    original_prompt: str
    sanitized_prompt: str
    llm_response: str
    threats_intercepted: int
    detected_entities: List[EntityDetectionItem]
    latency_ms: float
    fail_closed_guarantee: bool

class MetricsResponse(BaseModel):
    total_requests: int
    total_threats_blocked: int
    avg_latency_ms: float
    threat_types_breakdown: dict
    active_model: str
    fail_closed_active: bool


# --- API Routes ---

@app.get("/api/health")
async def health_check():
    return {
        "status": "healthy",
        "service": "Enterprise PII Security Service",
        "presidio_ready": analyzer is not None,
        "llm_provider": "Groq",
        "model": model_name,
        "zero_pii_storage_policy": "Strictly Enforced"
    }

@app.post("/api/sanitize", response_model=SecurityResponse)
async def process_secure_prompt(request: SecurityRequest, db: Session = Depends(get_db)):
    start_time = time.perf_counter()
    raw_text = request.user_prompt

    # Fail-Closed Security Policy: If NLP engine unavailable or error triggered, block request immediately
    if analyzer is None or anonymizer is None or request.simulate_failure:
        elapsed = (time.perf_counter() - start_time) * 1000
        # Telemetry logging (Zero raw PII recorded)
        log_entry = AuditLog(
            threats_intercepted=0,
            detected_entity_types="ANALYZER_UNAVAILABLE",
            sanitized_prompt_preview="[BLOCKED BY FAIL-CLOSED SECURITY POLICY]",
            latency_ms=round(elapsed, 2),
            status="FAILED_BLOCKED"
        )
        db.add(log_entry)
        db.commit()
        
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="[FAIL-CLOSED] Security policy engaged: NLP analyzer is unavailable or simulated fault triggered. Prompt execution blocked to prevent data leakage."
        )

    try:
        # Step 1: Detect PII (Emails, Phones, Names, SSNs, Cards, IPs, etc.)
        results = analyzer.analyze(
            text=raw_text,
            entities=SUPPORTED_ENTITIES,
            language='en'
        )

        # Step 2: Redact PII using mathematical replacement tokens
        anonymized = anonymizer.anonymize(
            text=raw_text,
            analyzer_results=results
        )
        safe_prompt = anonymized.text

        # Format detection items
        detected_items = []
        entity_types_found = []
        for res in results:
            detected_items.append(
                EntityDetectionItem(
                    entity_type=res.entity_type,
                    start=res.start,
                    end=res.end,
                    score=round(res.score, 3),
                    text_snippet=raw_text[res.start:res.end]
                )
            )
            entity_types_found.append(res.entity_type)

        # Step 3: Route Sanitized Prompt to LLM
        if llm_client:
            try:
                llm_res = llm_client.invoke(safe_prompt)
                llm_output = llm_res.content
            except Exception as llm_err:
                logger.error(f"LLM inference error: {llm_err}")
                llm_output = f"[LLM Error]: {str(llm_err)}"
        else:
            # High-speed deterministic fallback response
            llm_output = (
                f"I processed your request securely with all PII protected. "
                f"Sanitized query received: \"{safe_prompt}\"."
            )

        elapsed_ms = round((time.perf_counter() - start_time) * 1000, 2)

        # Step 4: Record Zero-PII Audit Telemetry
        log_entry = AuditLog(
            threats_intercepted=len(results),
            detected_entity_types=",".join(set(entity_types_found)),
            sanitized_prompt_preview=safe_prompt[:200] if safe_prompt else "",
            latency_ms=elapsed_ms,
            status="SUCCESS"
        )
        db.add(log_entry)
        db.commit()

        return SecurityResponse(
            status="success",
            original_prompt=raw_text,
            sanitized_prompt=safe_prompt,
            llm_response=llm_output,
            threats_intercepted=len(results),
            detected_entities=detected_items,
            latency_ms=elapsed_ms,
            fail_closed_guarantee=True
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Fail-closed interceptor triggered: {e}")
        elapsed_ms = round((time.perf_counter() - start_time) * 1000, 2)
        # Log blocked failure
        log_entry = AuditLog(
            threats_intercepted=0,
            detected_entity_types="SYSTEM_EXCEPTION",
            sanitized_prompt_preview="[BLOCKED - RUNTIME ERROR]",
            latency_ms=elapsed_ms,
            status="FAILED_BLOCKED"
        )
        db.add(log_entry)
        db.commit()
        raise HTTPException(
            status_code=500,
            detail=f"[FAIL-CLOSED TRIGGERED] An error occurred during redaction: {str(e)}. Prompt blocked."
        )

@app.get("/api/metrics", response_model=MetricsResponse)
async def get_metrics(db: Session = Depends(get_db)):
    total_requests = db.query(AuditLog).count()
    total_threats = db.query(func.sum(AuditLog.threats_intercepted)).scalar() or 0
    avg_latency = db.query(func.avg(AuditLog.latency_ms)).scalar() or 0.0

    # Build entity type breakdown
    logs = db.query(AuditLog.detected_entity_types).filter(AuditLog.detected_entity_types != "").all()
    breakdown = {}
    for (types_str,) in logs:
        if types_str:
            for etype in types_str.split(","):
                etype = etype.strip()
                if etype:
                    breakdown[etype] = breakdown.get(etype, 0) + 1

    return MetricsResponse(
        total_requests=total_requests,
        total_threats_blocked=int(total_threats),
        avg_latency_ms=round(float(avg_latency), 2),
        threat_types_breakdown=breakdown,
        active_model=model_name,
        fail_closed_active=True
    )

@app.get("/api/audit-logs")
async def get_audit_logs(limit: int = 50, db: Session = Depends(get_db)):
    logs = db.query(AuditLog).order_by(AuditLog.timestamp.desc()).limit(limit).all()
    return [
        {
            "id": log.id,
            "timestamp": log.timestamp.isoformat() if log.timestamp else None,
            "threats_intercepted": log.threats_intercepted,
            "detected_entity_types": log.detected_entity_types.split(",") if log.detected_entity_types else [],
            "sanitized_preview": log.sanitized_prompt_preview,
            "latency_ms": log.latency_ms,
            "status": log.status
        }
        for log in logs
    ]

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

import os
import time
from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from presidio_analyzer import AnalyzerEngine
from presidio_anonymizer import AnonymizerEngine
from langchain_groq import ChatGroq
from dotenv import load_dotenv

from database import SessionLocal
from models import SanitizationAuditLog

load_dotenv()

app = FastAPI(title="Enterprise PII Security Middleware", version="1.0.0")

# Enable CORS for the future React Frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize NLP Engines
print("Initializing Presidio NLP Engines...")
analyzer = AnalyzerEngine()
anonymizer = AnonymizerEngine()
print("NLP Engines Ready.")

class SecurityRequest(BaseModel):
    user_prompt: str
    client_id: str | None = None

def log_audit_metrics(threats: int, entities: list, process_time: int, client: str = None):
    db = SessionLocal()
    try:
        log_entry = SanitizationAuditLog(
            threats_intercepted=threats,
            entities_blocked=",".join(entities),
            processing_time_ms=process_time,
            client_id=client
        )
        db.add(log_entry)
        db.commit()
    finally:
        db.close()

@app.get("/health")
def health_check():
    return {"status": "Secure and Operational"}

@app.post("/api/v1/sanitize")
async def process_secure_prompt(request: SecurityRequest, background_tasks: BackgroundTasks):
    start_time = time.time()
    raw_text = request.user_prompt
    
    if not raw_text or len(raw_text) > 2000:
        raise HTTPException(status_code=400, detail="Prompt must be between 1 and 2000 characters.")

    try:
        # 1. Intercept & Analyze
        results = analyzer.analyze(text=raw_text, entities=["EMAIL_ADDRESS", "PHONE_NUMBER", "PERSON"], language='en')
        
        # 2. Redact
        anonymized = anonymizer.anonymize(text=raw_text, analyzer_results=results)
        safe_prompt = anonymized.text
        
        # Extract metadata for logging
        threats_blocked = len(results)
        entities_found = list(set([res.entity_type for res in results]))

        # 3. Secure LLM Routing
        load_dotenv(override=True)
        groq_key = os.environ.get("GROQ_API_KEY")
        model_name = os.environ.get("GROQ_MODEL", "llama-3.1-8b-instant")
        if not groq_key or groq_key == "your_actual_api_key_here":
             llm_response_text = "SYSTEM MESSAGE: GROQ_API_KEY not found in .env. LLM bypassed."
        else:
             try:
                 llm = ChatGroq(temperature=0, groq_api_key=groq_key, model_name=model_name)
                 llm_response = llm.invoke(safe_prompt)
                 llm_response_text = llm_response.content
             except Exception as llm_err:
                 # Fallback to llama-3.3-70b-versatile or llama3-8b-8192 if requested model is unavailable
                 try:
                     llm = ChatGroq(temperature=0, groq_api_key=groq_key, model_name="llama-3.1-8b-instant")
                     llm_response = llm.invoke(safe_prompt)
                     llm_response_text = llm_response.content
                 except Exception as fallback_err:
                     llm_response_text = f"LLM Gateway Notification: {str(fallback_err)}"
        
        processing_time_ms = int((time.time() - start_time) * 1000)

        # Asynchronously dispatch zero-PII audit logging
        background_tasks.add_task(log_audit_metrics, threats_blocked, entities_found, processing_time_ms, request.client_id)

        # 4. Return Safe Payload
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
        # Fail-closed mechanism
        raise HTTPException(status_code=500, detail="Security Middleware Error: Request blocked to prevent data leakage.")

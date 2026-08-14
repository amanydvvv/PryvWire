import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from presidio_analyzer import AnalyzerEngine
from presidio_anonymizer import AnonymizerEngine
from langchain_groq import ChatGroq
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(title="Enterprise PII Security Service")

# Enable CORS for frontend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize the NLP engines for detection and redaction
analyzer = AnalyzerEngine()
anonymizer = AnonymizerEngine()

# Initialize the LLM via Groq for high-speed inference
groq_api_key = os.environ.get("GROQ_API_KEY")
model_name = os.environ.get("GROQ_MODEL", "llama-3.1-8b-instant")

llm = ChatGroq(
    temperature=0,
    groq_api_key=groq_api_key,
    model_name=model_name
)

class SecurityRequest(BaseModel):
    user_prompt: str

@app.get("/")
async def root():
    return {
        "status": "healthy",
        "service": "Enterprise PII Security Service",
        "endpoints": ["/api/sanitize", "/docs"]
    }

@app.post("/api/sanitize")
async def process_secure_prompt(request: SecurityRequest):
    raw_text = request.user_prompt
    
    # 1. Detect PII (Emails, Phones, Names)
    results = analyzer.analyze(
        text=raw_text, 
        entities=["EMAIL_ADDRESS", "PHONE_NUMBER", "PERSON"], 
        language='en'
    )
    
    # 2. Redact PII
    anonymized = anonymizer.anonymize(text=raw_text, analyzer_results=results)
    safe_prompt = anonymized.text
    
    # 3. Route the sanitized prompt to the LLM (if API key provided, otherwise simulate/gracefully handle)
    if groq_api_key and groq_api_key != "your_actual_api_key_here":
        llm_response = llm.invoke(safe_prompt)
        llm_content = llm_response.content
    else:
        llm_content = f"[Simulated LLM response for sanitized prompt]: '{safe_prompt}'. Please set a valid GROQ_API_KEY in .env to enable live inference."
    
    # (Database logging logic will be inserted here later)
    
    return {
        "status": "success",
        "original_prompt": raw_text,
        "sanitized_prompt": safe_prompt,
        "llm_response": llm_content,
        "threats_intercepted": len(results),
        "detected_entities": [
            {
                "entity_type": res.entity_type,
                "start": res.start,
                "end": res.end,
                "score": res.score
            }
            for res in results
        ]
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

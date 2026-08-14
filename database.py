import os
from datetime import datetime
from sqlalchemy import create_engine, Column, Integer, String, Float, DateTime, Text
from sqlalchemy.orm import declarative_base, sessionmaker

DATABASE_URL = os.environ.get("DATABASE_URL", "sqlite:///./audit_telemetry.db")

# Use connect_args for SQLite to handle multi-threaded FastAPI requests
connect_args = {"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}

engine = create_engine(DATABASE_URL, connect_args=connect_args)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

class AuditLog(Base):
    """
    Zero-PII Compliance Audit Log Table.
    Strictly records metadata, latency, and sanitized outputs.
    Raw user prompts or PII data are NEVER stored.
    """
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)
    threats_intercepted = Column(Integer, default=0)
    detected_entity_types = Column(String(255), default="")  # Comma-separated list e.g. "EMAIL_ADDRESS,PERSON"
    sanitized_prompt_preview = Column(String(500), default="")  # Safe redacted preview only
    latency_ms = Column(Float, default=0.0)
    status = Column(String(50), default="SUCCESS")  # "SUCCESS", "FAILED_BLOCKED"

# Create tables automatically on startup
Base.metadata.create_all(bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

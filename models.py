from sqlalchemy import Column, Integer, String, DateTime
from sqlalchemy.sql import func
import uuid
from database import Base

class SanitizationAuditLog(Base):
    __tablename__ = "sanitization_audit_logs"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    timestamp = Column(DateTime(timezone=True), server_default=func.now())
    client_id = Column(String, nullable=True)
    threats_intercepted = Column(Integer, default=0, nullable=False)
    entities_blocked = Column(String, nullable=False)
    processing_time_ms = Column(Integer, nullable=False)

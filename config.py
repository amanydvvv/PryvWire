import os
from typing import List
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    # Groq LLM Configuration
    GROQ_API_KEY: str = ""
    GROQ_MODEL: str = "llama-3.1-8b-instant"
    GROQ_TIMEOUT_SECONDS: int = 10
    GROQ_MAX_RETRIES: int = 2

    # Authentication & Security
    API_KEY: str = "ciphergate-demo-secret-key"
    REQUIRE_API_KEY: bool = False  # Set True to enforce X-API-Key header strictly

    # Rate Limiting & Payload Limits
    RATE_LIMIT: str = "30/minute"
    MAX_REQUEST_SIZE_BYTES: int = 51200  # 50 KB

    # CORS Configuration
    CORS_ORIGINS: str = "http://localhost:5173,http://127.0.0.1:5173,http://localhost:3000"

    # Database & Observability
    DATABASE_URL: str = "sqlite:///./local_audit.db"
    LOG_LEVEL: str = "INFO"

    @property
    def cors_origins_list(self) -> List[str]:
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",") if origin.strip()]

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )

settings = Settings()

import pytest
from unittest.mock import patch, MagicMock
from fastapi.testclient import TestClient
from main import app
from config import settings

client = TestClient(app)

def test_health_endpoint():
    """Verify readiness health check endpoint."""
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert "status" in data
    assert "database_connected" in data
    assert "circuit_breaker" in data

def test_metrics_endpoint():
    """Verify metrics telemetry endpoint."""
    response = client.get("/metrics")
    assert response.status_code == 200
    data = response.json()
    assert "total_requests" in data
    assert "total_threats_blocked" in data
    assert "avg_processing_time_ms" in data
    assert "entities_breakdown" in data

def test_sanitize_happy_path():
    """Verify end-to-end prompt interception and redaction."""
    payload = {
        "user_prompt": "Please email John Doe at john.doe@cyberdyne.corp or call +1-415-555-0199.",
        "client_id": "pytest-runner"
    }
    response = client.post("/api/v1/sanitize", json=payload)
    assert response.status_code == 200
    json_data = response.json()
    assert json_data["status"] == "success"
    data = json_data["data"]
    assert "[REDACTED: EMAIL_ADDRESS]" in data["sanitized_prompt"] or "[REDACTED: PERSON]" in data["sanitized_prompt"]
    assert data["metrics"]["threats_intercepted"] >= 1

def test_input_validation_rejection():
    """Verify empty prompt is rejected with 400."""
    payload = {"user_prompt": ""}
    response = client.post("/api/v1/sanitize", json=payload)
    assert response.status_code == 400
    data = response.json()
    assert "error" in data

def test_api_key_authentication_failure():
    """Verify invalid X-API-Key header returns 401 when required."""
    with patch.object(settings, "REQUIRE_API_KEY", True):
        headers = {"X-API-Key": "invalid-secret-key"}
        payload = {"user_prompt": "Test auth prompt"}
        response = client.post("/api/v1/sanitize", json=payload, headers=headers)
        assert response.status_code == 401
        assert "Unauthorized" in response.json()["detail"]

def test_audit_log_write_failure_isolation():
    """Verify a database error in log_audit_metrics does NOT fail the HTTP response."""
    with patch("main.SessionLocal", side_effect=Exception("Database connection dropped!")):
        payload = {"user_prompt": "Send email to john@example.com immediately."}
        response = client.post("/api/v1/sanitize", json=payload)
        # Should still return 200 OK because audit logging is non-blocking best-effort
        assert response.status_code == 200
        assert "[REDACTED: EMAIL_ADDRESS]" in response.json()["data"]["sanitized_prompt"]

def test_groq_timeout_resilience():
    """Verify Groq timeout or exception fails gracefully without crashing request."""
    with patch("main.ChatGroq") as MockChatGroq:
        mock_instance = MagicMock()
        mock_instance.invoke.side_effect = Exception("Groq API Timeout")
        MockChatGroq.return_value = mock_instance

        payload = {"user_prompt": "Emergency medical query for John Doe."}
        response = client.post("/api/v1/sanitize", json=payload)
        assert response.status_code == 200
        llm_resp = response.json()["data"]["llm_response"]
        assert "LLM Gateway Notification" in llm_resp

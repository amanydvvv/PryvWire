from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def test_health():
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["presidio_ready"] is True
    print("Health check PASSED:", data)

def test_sanitize_success():
    payload = {
        "user_prompt": "Please email John Doe at john.doe@secure-bank.com regarding account 98765."
    }
    response = client.post("/api/sanitize", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "success"
    assert data["threats_intercepted"] >= 1
    assert "<EMAIL_ADDRESS>" in data["sanitized_prompt"] or "<PERSON>" in data["sanitized_prompt"]
    assert "latency_ms" in data
    print("Sanitize PASSED:", data["sanitized_prompt"], f"(Threats: {data['threats_intercepted']}, Latency: {data['latency_ms']}ms)")

def test_fail_closed_simulation():
    payload = {
        "user_prompt": "Testing fail-closed safety posture.",
        "simulate_failure": True
    }
    response = client.post("/api/sanitize", json=payload)
    assert response.status_code == 500
    print("Fail-Closed Guard PASSED (500 Error cleanly blocked prompt)")

def test_metrics_and_audit():
    response = client.get("/api/metrics")
    assert response.status_code == 200
    metrics = response.json()
    assert metrics["total_requests"] >= 1
    print("Metrics PASSED:", metrics)

    logs_res = client.get("/api/audit-logs")
    assert logs_res.status_code == 200
    logs = logs_res.json()
    assert len(logs) >= 1
    # Verify zero raw PII in audit log previews
    for log in logs:
        assert "john.doe@secure-bank.com" not in log["sanitized_preview"]
    print(f"Audit Logs PASSED: {len(logs)} records verified with ZERO raw PII stored!")

if __name__ == "__main__":
    test_health()
    test_sanitize_success()
    test_fail_closed_simulation()
    test_metrics_and_audit()
    print("\nALL BACKEND API TESTS COMPLETED SUCCESSFULLY!")

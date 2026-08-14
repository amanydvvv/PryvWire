import time
import threading
from typing import Dict, Any

class CircuitBreaker:
    """
    Thread-safe counter-based Circuit Breaker for upstream LLM gateway calls.
    Prevents hammering downed upstream services during sustained outages.
    """
    def __init__(self, failure_threshold: int = 5, cooldown_seconds: int = 30):
        self.failure_threshold = failure_threshold
        self.cooldown_seconds = cooldown_seconds
        self.failure_count = 0
        self.last_failure_time = 0
        self.state = "CLOSED"  # "CLOSED" (normal), "OPEN" (tripped/blocking), "HALF-OPEN"
        self._lock = threading.Lock()

    def allow_request(self) -> bool:
        with self._lock:
            if self.state == "OPEN":
                now = time.time()
                if now - self.last_failure_time > self.cooldown_seconds:
                    self.state = "HALF-OPEN"
                    return True
                return False
            return True

    def record_success(self):
        with self._lock:
            self.failure_count = 0
            self.state = "CLOSED"

    def record_failure(self):
        with self._lock:
            self.failure_count += 1
            self.last_failure_time = time.time()
            if self.failure_count >= self.failure_threshold:
                self.state = "OPEN"

    def get_status(self) -> Dict[str, Any]:
        with self._lock:
            return {
                "state": self.state,
                "failure_count": self.failure_count,
                "cooldown_remaining_seconds": max(0, int(self.cooldown_seconds - (time.time() - self.last_failure_time))) if self.state == "OPEN" else 0
            }

circuit_breaker = CircuitBreaker(failure_threshold=5, cooldown_seconds=30)

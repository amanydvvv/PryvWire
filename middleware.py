import uuid
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import JSONResponse, Response
from config import settings

class RequestSizeLimitMiddleware(BaseHTTPMiddleware):
    """
    ASGI-level Request Body Size Limiter Middleware.
    Rejects oversized HTTP bodies (e.g. > 50KB) before they reach Presidio NLP or route handlers.
    """
    def __init__(self, app, max_bytes: int = settings.MAX_REQUEST_SIZE_BYTES):
        super().__init__(app)
        self.max_bytes = max_bytes

    async def dispatch(self, request: Request, call_next) -> Response:
        content_length = request.headers.get("content-length")
        if content_length:
            try:
                if int(content_length) > self.max_bytes:
                    return JSONResponse(
                        status_code=413,
                        content={
                            "error": "Payload Too Large",
                            "detail": f"Request body exceeds maximum allowed size of {self.max_bytes} bytes."
                        }
                    )
            except ValueError:
                pass

        # Stream body check if content-length is missing or chunked
        body = await request.body()
        if len(body) > self.max_bytes:
            return JSONResponse(
                status_code=413,
                content={
                    "error": "Payload Too Large",
                    "detail": f"Request body exceeds maximum allowed size of {self.max_bytes} bytes."
                }
            )

        response = await call_next(request)
        return response

class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    """
    Applies standard enterprise security headers to all HTTP responses.
    """
    async def dispatch(self, request: Request, call_next) -> Response:
        request_id = str(uuid.uuid4())
        request.state.request_id = request_id

        response = await call_next(request)
        response.headers["X-Request-ID"] = request_id
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
        return response

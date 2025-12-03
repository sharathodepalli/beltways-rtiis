"""FastAPI entrypoint for Beltways RTIIS."""
from __future__ import annotations

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.base import BaseHTTPMiddleware

from .database import init_db
from .routers import incidents, readings, segments, sensors, system
from .schemas import HealthResponse


class ProxyHeadersMiddleware(BaseHTTPMiddleware):
    """Middleware to handle proxy headers and preserve HTTPS scheme."""
    
    async def dispatch(self, request: Request, call_next):
        # Trust X-Forwarded-Proto header from Railway's edge proxy
        if request.headers.get("x-forwarded-proto") == "https":
            request.scope["scheme"] = "https"
        response = await call_next(request)
        return response


app = FastAPI(
    title="Beltways RTIIS",
    # Disable redirect slashes to prevent 307 redirects
    redirect_slashes=False,
)

# Add proxy headers middleware first
app.add_middleware(ProxyHeadersMiddleware)

# CORS configuration - allow frontend origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins for demo
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
async def startup_event() -> None:
    """Initialize database schema and seed reference data."""
    init_db()


@app.get("/health", response_model=HealthResponse)
async def health() -> HealthResponse:
    """Basic health check endpoint."""
    return HealthResponse(status="ok")


app.include_router(segments.router)
app.include_router(sensors.router)
app.include_router(readings.router)
app.include_router(incidents.router)
app.include_router(system.router)

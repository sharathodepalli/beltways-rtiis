"""FastAPI entrypoint for Beltways RTIIS."""
from __future__ import annotations

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .database import init_db
from .routers import incidents, readings, segments, sensors, system
from .schemas import HealthResponse

app = FastAPI(title="Beltways RTIIS")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
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

"""Pydantic schemas for Beltways RTIIS APIs."""
from __future__ import annotations

from datetime import datetime
from typing import Any

from pydantic import BaseModel, Field

from .models import IncidentSeverity, IncidentStatus, SensorType


class HealthResponse(BaseModel):
    """Health check response payload."""

    status: str = Field(..., example="ok")


class RoadSegment(BaseModel):
    """Serialized road segment."""

    model_config = {"from_attributes": True}

    id: int
    name: str
    code: str
    direction: str
    latitude: float | None = None
    longitude: float | None = None


class Sensor(BaseModel):
    """Serialized sensor."""

    model_config = {"from_attributes": True}

    id: int
    name: str
    type: SensorType
    road_segment_id: int
    location_lat: float | None = None
    location_lng: float | None = None
    is_active: bool


class SensorReadingPayload(BaseModel):
    """Incoming sensor reading body."""

    sensor_id: int
    timestamp: datetime
    data: dict[str, Any]


class SensorReading(BaseModel):
    """Serialized sensor reading."""

    model_config = {"from_attributes": True}

    id: int
    sensor_id: int
    timestamp: datetime
    data: dict[str, Any]
    sensor_type: SensorType | None = None


class ReadingsIngestRequest(BaseModel):
    """Batch of sensor readings sent by simulator."""

    readings: list[SensorReadingPayload]


class ReadingsIngestResponse(BaseModel):
    """Response after ingesting readings."""

    status: str
    inserted_count: int
    new_incidents: list[int]


class Incident(BaseModel):
    """Serialized incident summary."""

    model_config = {"from_attributes": True}

    id: int
    road_segment_id: int
    created_at: datetime
    updated_at: datetime
    status: IncidentStatus
    severity: IncidentSeverity
    type: str
    rule_triggered: str
    ai_summary: str | None = None
    ai_cause: str | None = None
    ai_recommendation: str | None = None
    resolution_note: str | None = None


class IncidentDetail(BaseModel):
    """Detailed incident response including related info."""

    incident: Incident
    segment: RoadSegment
    recent_readings: list[SensorReading]


class ResolveIncidentRequest(BaseModel):
    """Request payload to resolve an incident."""

    resolution_note: str | None = Field(default=None, max_length=512)


class ResolveIncidentResponse(BaseModel):
    """Response confirming incident resolution."""

    status: str
    incident_id: int

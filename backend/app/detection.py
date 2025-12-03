"""Incident detection logic for Beltways RTIIS."""
from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, timedelta, timezone
from statistics import mean
from typing import Sequence

from sqlalchemy.orm import Session

from .models import (
    Incident,
    IncidentSeverity,
    IncidentStatus,
    RoadSegment,
    Sensor,
    SensorReading,
    SensorType,
)

CONGESTION_RULE = "FLOW_DROP_AND_SPEED_DROP"
STOPPED_VEHICLE_RULE = "STOPPED_VEHICLE_DETECTED"


@dataclass(slots=True)
class SegmentReadings:
    """Recent readings grouped by sensor category for a segment."""

    flow: list[SensorReading]
    speed: list[SensorReading]
    stopped: list[SensorReading]

    def as_dict(self) -> dict[str, list[SensorReading]]:
        """Return a dict representation useful for serialization or AI prompts."""
        return {"flow": self.flow, "speed": self.speed, "stopped": self.stopped}


def collect_recent_readings(db: Session, road_segment_id: int, minutes: int = 10) -> SegmentReadings:
    """Fetch readings across all sensor types for the recent window."""

    def _fetch(sensor_type: SensorType) -> list[SensorReading]:
        since = datetime.now(timezone.utc) - timedelta(minutes=minutes)
        return (
            db.query(SensorReading)
            .join(Sensor)
            .filter(
                Sensor.road_segment_id == road_segment_id,
                Sensor.type == sensor_type,
                SensorReading.timestamp >= since,
            )
            .order_by(SensorReading.timestamp.asc())
            .all()
        )

    return SegmentReadings(
        flow=_fetch(SensorType.TRAFFIC_FLOW),
        speed=_fetch(SensorType.SPEED),
        stopped=_fetch(SensorType.STOPPED_VEHICLE),
    )


def evaluate_incidents_for_segment(db: Session, road_segment_id: int) -> list[Incident]:
    """Evaluate detection rules for a segment and return newly created incidents."""

    segment = db.get(RoadSegment, road_segment_id)
    if segment is None:
        return []

    readings = collect_recent_readings(db, road_segment_id)
    new_incidents: list[Incident] = []

    congestion_incident = _maybe_create_congestion_incident(db, segment, readings)
    if congestion_incident is not None:
        new_incidents.append(congestion_incident)

    stopped_incident = _maybe_create_stopped_vehicle_incident(db, segment, readings)
    if stopped_incident is not None:
        new_incidents.append(stopped_incident)

    if new_incidents:
        db.flush()
    return new_incidents


def _maybe_create_congestion_incident(
    db: Session, segment: RoadSegment, readings: SegmentReadings
) -> Incident | None:
    """Create a congestion incident if sustained flow and speed drops are detected."""

    flow_values = _extract_numeric_series(readings.flow, "vehicles_per_minute")
    speed_values = _extract_numeric_series(readings.speed, "avg_speed_kmh")

    if len(flow_values) < 2 or len(speed_values) < 2:
        return None

    baseline_flow = _window_average(
        readings.flow, "vehicles_per_minute", minutes=5, exclude_recent_seconds=30
    )
    baseline_speed = _window_average(
        readings.speed, "avg_speed_kmh", minutes=5, exclude_recent_seconds=30
    )

    if baseline_flow is None or baseline_speed is None:
        return None

    if baseline_flow < 30 or baseline_speed < 60:
        return None

    last_flow = flow_values[-2:]
    last_speed = speed_values[-2:]

    flow_threshold = baseline_flow * 0.4
    speed_threshold = 25.0

    flow_sustained = all(value <= flow_threshold for value in last_flow)
    speed_sustained = all(value <= speed_threshold for value in last_speed)

    if not (flow_sustained and speed_sustained):
        return None

    return _upsert_incident(
        db=db,
        road_segment_id=segment.id,
        incident_type="CONGESTION",
        severity=IncidentSeverity.HIGH,
        rule_name=CONGESTION_RULE,
    )


def _maybe_create_stopped_vehicle_incident(
    db: Session, segment: RoadSegment, readings: SegmentReadings
) -> Incident | None:
    """Create a stopped vehicle incident when blockage persists for two cycles."""

    if len(readings.stopped) < 2:
        return None

    last_two = readings.stopped[-2:]

    def _is_blocked(reading: SensorReading) -> bool:
        data = reading.data or {}
        return bool(data.get("stopped_count", 0) >= 1 and data.get("lane_blocked") is True)

    if not all(_is_blocked(reading) for reading in last_two):
        return None

    return _upsert_incident(
        db=db,
        road_segment_id=segment.id,
        incident_type="STOPPED_VEHICLE",
        severity=IncidentSeverity.MEDIUM,
        rule_name=STOPPED_VEHICLE_RULE,
    )


def _extract_numeric_series(readings: Sequence[SensorReading], key: str) -> list[float]:
    """Extract numeric values for a given key from ordered readings."""

    values: list[float] = []
    for reading in readings:
        value = reading.data.get(key) if reading.data else None
        if value is None:
            continue
        try:
            values.append(float(value))
        except (TypeError, ValueError):
            continue
    return values


def _window_average(
    readings: Sequence[SensorReading], key: str, minutes: int, exclude_recent_seconds: int = 0
) -> float | None:
    """Average values for a key within the trailing window length."""

    cutoff = datetime.now(timezone.utc) - timedelta(minutes=minutes)
    exclude_after = datetime.now(timezone.utc) - timedelta(seconds=exclude_recent_seconds)
    window_values = [
        float(reading.data.get(key))
        for reading in readings
        if _timestamp_utc(reading) >= cutoff
        and _timestamp_utc(reading) <= exclude_after
        and reading.data.get(key) is not None
    ]

    return mean(window_values) if window_values else None


def _upsert_incident(
    db: Session,
    road_segment_id: int,
    incident_type: str,
    severity: IncidentSeverity,
    rule_name: str,
) -> Incident | None:
    """Insert a new incident unless an open one already exists for the same type."""

    existing = (
        db.query(Incident)
        .filter(
            Incident.road_segment_id == road_segment_id,
            Incident.type == incident_type,
            Incident.status == IncidentStatus.OPEN,
        )
        .order_by(Incident.created_at.desc())
        .first()
    )

    now = datetime.now(timezone.utc)

    if existing is not None:
        existing.updated_at = now
        return None

    incident = Incident(
        road_segment_id=road_segment_id,
        status=IncidentStatus.OPEN,
        severity=severity,
        type=incident_type,
        rule_triggered=rule_name,
        created_at=now,
        updated_at=now,
    )
    db.add(incident)
    db.flush()
    return incident


def _timestamp_utc(reading: SensorReading) -> datetime:
    """Return a timezone-aware UTC timestamp for a reading."""

    timestamp = reading.timestamp
    if timestamp.tzinfo is None:
        return timestamp.replace(tzinfo=timezone.utc)
    return timestamp.astimezone(timezone.utc)

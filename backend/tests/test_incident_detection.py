"""Unit tests for incident detection logic."""
from __future__ import annotations

import sys
from datetime import datetime, timedelta, timezone
from pathlib import Path

from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker

PROJECT_ROOT = Path(__file__).resolve().parents[1]
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from app.detection import evaluate_incidents_for_segment  # noqa: E402
from app.models import (  # noqa: E402
    Base,
    IncidentSeverity,
    IncidentStatus,
    RoadSegment,
    Sensor,
    SensorReading,
    SensorType,
)


def _build_session() -> Session:
    engine = create_engine("sqlite:///:memory:", future=True)
    Base.metadata.create_all(bind=engine)
    return sessionmaker(bind=engine, autoflush=False, autocommit=False)()


def test_congestion_incident_created_after_flow_and_speed_drop() -> None:
    db = _build_session()
    now = datetime.now(timezone.utc)

    segment = RoadSegment(name="Test Segment", code="SEG_A", direction="NORTH")
    db.add(segment)
    db.flush()

    flow_sensor = Sensor(id=1, name="Flow", type=SensorType.TRAFFIC_FLOW, road_segment_id=segment.id)
    speed_sensor = Sensor(id=2, name="Speed", type=SensorType.SPEED, road_segment_id=segment.id)
    db.add_all([flow_sensor, speed_sensor])
    db.flush()

    for minutes_ago, flow_value in [(5, 60), (4, 62), (3, 58), (2, 61)]:
        db.add(
            SensorReading(
                sensor_id=flow_sensor.id,
                timestamp=now - timedelta(minutes=minutes_ago),
                data={"vehicles_per_minute": flow_value},
            )
        )

    for minutes_ago, speed_value in [(5, 75), (4, 70), (3, 72), (2, 74)]:
        db.add(
            SensorReading(
                sensor_id=speed_sensor.id,
                timestamp=now - timedelta(minutes=minutes_ago),
                data={"avg_speed_kmh": speed_value},
            )
        )

    for delta in [1, 0]:
        db.add(
            SensorReading(
                sensor_id=flow_sensor.id,
                timestamp=now - timedelta(minutes=delta, seconds=30),
                data={"vehicles_per_minute": 15},
            )
        )
        db.add(
            SensorReading(
                sensor_id=speed_sensor.id,
                timestamp=now - timedelta(minutes=delta, seconds=30),
                data={"avg_speed_kmh": 20},
            )
        )

    db.commit()

    incidents = evaluate_incidents_for_segment(db, segment.id)
    db.commit()

    assert len(incidents) == 1
    incident = incidents[0]
    assert incident.type == "CONGESTION"
    assert incident.severity == IncidentSeverity.HIGH
    assert incident.status == IncidentStatus.OPEN

    duplicate = evaluate_incidents_for_segment(db, segment.id)
    db.commit()
    assert duplicate == []


def test_stopped_vehicle_incident_detected_on_consecutive_blocked_events() -> None:
    db = _build_session()
    now = datetime.now(timezone.utc)

    segment = RoadSegment(name="Test Segment B", code="SEG_B", direction="SOUTH")
    db.add(segment)
    db.flush()

    stopped_sensor = Sensor(
        id=3,
        name="Stopped",
        type=SensorType.STOPPED_VEHICLE,
        road_segment_id=segment.id,
    )
    db.add(stopped_sensor)
    db.flush()

    db.add(
        SensorReading(
            sensor_id=stopped_sensor.id,
            timestamp=now - timedelta(minutes=1, seconds=30),
            data={"stopped_count": 1, "lane_blocked": True},
        )
    )
    db.add(
        SensorReading(
            sensor_id=stopped_sensor.id,
            timestamp=now - timedelta(seconds=30),
            data={"stopped_count": 2, "lane_blocked": True},
        )
    )
    db.commit()

    incidents = evaluate_incidents_for_segment(db, segment.id)
    db.commit()

    assert len(incidents) == 1
    assert incidents[0].type == "STOPPED_VEHICLE"
    assert incidents[0].severity == IncidentSeverity.MEDIUM
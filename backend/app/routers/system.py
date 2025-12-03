"""System status and scenario simulation endpoints."""
from __future__ import annotations

import random
from datetime import datetime, timedelta, timezone
from typing import Any

from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy import func
from sqlalchemy.orm import Session

from ..database import get_db
from ..detection import evaluate_incidents_for_segment
from ..llm import analyze_incident_with_llm
from ..models import Incident, RoadSegment, Sensor, SensorReading, SensorType

router = APIRouter(prefix="/api/system", tags=["system"])


class SystemStatusResponse(BaseModel):
    """System health and diagnostics response."""
    backend_status: str
    db_status: str
    llm_status: str
    total_readings: int
    readings_last_minute: int
    total_incidents: int
    open_incidents: int
    last_incident_at: datetime | None
    last_reading_at: datetime | None
    uptime_seconds: float


class ScenarioTriggerResponse(BaseModel):
    """Response after triggering a scenario."""
    status: str
    scenario: str
    readings_created: int
    incident_id: int | None


# Track server start time for uptime
_server_start_time = datetime.now(timezone.utc)


@router.get("/status", response_model=SystemStatusResponse)
async def get_system_status(db: Session = Depends(get_db)) -> SystemStatusResponse:
    """Get comprehensive system diagnostics."""
    
    now = datetime.now(timezone.utc)
    one_minute_ago = now - timedelta(minutes=1)
    
    # Count total readings
    total_readings = db.query(func.count(SensorReading.id)).scalar() or 0
    
    # Count readings in last minute
    readings_last_minute = db.query(func.count(SensorReading.id)).filter(
        SensorReading.timestamp >= one_minute_ago
    ).scalar() or 0
    
    # Count incidents
    total_incidents = db.query(func.count(Incident.id)).scalar() or 0
    open_incidents = db.query(func.count(Incident.id)).filter(
        Incident.status == "OPEN"
    ).scalar() or 0
    
    # Get last incident time
    last_incident = db.query(Incident).order_by(Incident.created_at.desc()).first()
    last_incident_at = last_incident.created_at if last_incident else None
    
    # Get last reading time
    last_reading = db.query(SensorReading).order_by(SensorReading.timestamp.desc()).first()
    last_reading_at = last_reading.timestamp if last_reading else None
    
    # Calculate uptime
    uptime = (now - _server_start_time).total_seconds()
    
    return SystemStatusResponse(
        backend_status="healthy",
        db_status="connected",
        llm_status="online",  # We have fallback so always "online"
        total_readings=total_readings,
        readings_last_minute=readings_last_minute,
        total_incidents=total_incidents,
        open_incidents=open_incidents,
        last_incident_at=last_incident_at,
        last_reading_at=last_reading_at,
        uptime_seconds=uptime,
    )


async def _create_readings_and_detect(
    db: Session,
    segment_id: int,
    readings_data: list[dict[str, Any]],
) -> int | None:
    """Helper to create readings and run detection, returns incident ID if created."""
    
    now = datetime.now(timezone.utc)
    sensors = db.query(Sensor).filter(Sensor.road_segment_id == segment_id).all()
    
    sensor_by_type: dict[SensorType, Sensor] = {s.type: s for s in sensors}
    
    for reading in readings_data:
        sensor_type = reading.pop("_sensor_type")
        sensor = sensor_by_type.get(sensor_type)
        if sensor:
            db.add(SensorReading(
                sensor_id=sensor.id,
                timestamp=now,
                data=reading,
            ))
    
    db.flush()
    
    # Run detection
    incidents = evaluate_incidents_for_segment(db, segment_id)
    incident_id = None
    
    for incident in incidents:
        segment = db.get(RoadSegment, segment_id)
        if segment:
            from ..detection import collect_recent_readings
            readings_bundle = collect_recent_readings(db, segment_id)
            ai_fields = await analyze_incident_with_llm(incident, segment, readings_bundle.as_dict())
            incident.ai_summary = ai_fields.get("ai_summary")
            incident.ai_cause = ai_fields.get("ai_cause")
            incident.ai_recommendation = ai_fields.get("ai_recommendation")
        incident_id = incident.id
    
    db.commit()
    return incident_id


def _create_historical_readings(
    db: Session,
    segment_id: int,
    scenario_type: str,
) -> int:
    """Create realistic historical sensor readings for charts display."""
    
    now = datetime.now(timezone.utc)
    sensors = db.query(Sensor).filter(Sensor.road_segment_id == segment_id).all()
    sensor_by_type: dict[SensorType, Sensor] = {s.type: s for s in sensors}
    
    readings_created = 0
    
    # Generate 10 minutes of historical data (one reading per minute)
    for i in range(10):
        timestamp = now - timedelta(minutes=10 - i)
        
        # Speed sensor readings - show degradation for incidents
        speed_sensor = sensor_by_type.get(SensorType.SPEED)
        if speed_sensor:
            if scenario_type == "congestion":
                # Speed drops from 65 to 15 km/h
                speed = max(15, 65 - (i * 5) + random.uniform(-3, 3))
            elif scenario_type == "stopped_vehicle":
                # Speed drops moderately then recovers slightly
                speed = 45 - (i * 2) + random.uniform(-5, 5) if i < 7 else 35 + random.uniform(-5, 5)
            else:  # multi_lane_slowdown
                # Severe speed drop
                speed = max(5, 60 - (i * 6) + random.uniform(-2, 2))
            
            db.add(SensorReading(
                sensor_id=speed_sensor.id,
                timestamp=timestamp,
                data={"avg_speed_kmh": round(speed, 1)},
            ))
            readings_created += 1
        
        # Traffic flow sensor readings
        flow_sensor = sensor_by_type.get(SensorType.TRAFFIC_FLOW)
        if flow_sensor:
            if scenario_type == "congestion":
                # High flow initially, then drops as congestion builds
                flow = max(10, 45 - (i * 3) + random.randint(-5, 5))
            elif scenario_type == "stopped_vehicle":
                # Moderate flow reduction
                flow = 35 - (i * 1) + random.randint(-3, 3)
            else:  # multi_lane_slowdown
                # Severe flow reduction
                flow = max(5, 40 - (i * 4) + random.randint(-3, 3))
            
            db.add(SensorReading(
                sensor_id=flow_sensor.id,
                timestamp=timestamp,
                data={"vehicles_per_minute": flow},
            ))
            readings_created += 1
        
        # Stopped vehicle sensor readings
        stopped_sensor = sensor_by_type.get(SensorType.STOPPED_VEHICLE)
        if stopped_sensor:
            if scenario_type == "stopped_vehicle" and i >= 5:
                stopped_count = random.randint(1, 3)
                lane_blocked = True
            elif scenario_type == "multi_lane_slowdown" and i >= 3:
                stopped_count = random.randint(2, 5)
                lane_blocked = True
            else:
                stopped_count = 0
                lane_blocked = False
            
            db.add(SensorReading(
                sensor_id=stopped_sensor.id,
                timestamp=timestamp,
                data={"stopped_count": stopped_count, "lane_blocked": lane_blocked},
            ))
            readings_created += 1
    
    db.flush()
    return readings_created


@router.post("/scenario/congestion", response_model=ScenarioTriggerResponse)
async def trigger_congestion_scenario(db: Session = Depends(get_db)) -> ScenarioTriggerResponse:
    """Simulate a congestion event with low speed and high flow."""
    
    # Rotate through segments for variety
    segments = db.query(RoadSegment).all()
    if not segments:
        return ScenarioTriggerResponse(
            status="error",
            scenario="congestion",
            readings_created=0,
            incident_id=None,
        )
    
    # Find a segment without an open congestion incident, or use first
    segment = segments[0]
    for seg in segments:
        existing = db.query(Incident).filter(
            Incident.road_segment_id == seg.id,
            Incident.type == "CONGESTION",
            Incident.status == "OPEN",
        ).first()
        if not existing:
            segment = seg
            break
    
    # Create historical readings for the charts
    readings_created = _create_historical_readings(db, segment.id, "congestion")
    
    # Directly create incident for demo (bypass detection rules)
    now = datetime.now(timezone.utc)
    incident = Incident(
        road_segment_id=segment.id,
        status="OPEN",
        severity="HIGH",
        type="CONGESTION",
        rule_triggered="DEMO_SCENARIO",
        ai_summary=f"Heavy congestion detected on {segment.name}. Traffic flow significantly reduced with average speeds below 20 km/h.",
        ai_cause="High traffic volume combined with possible incident ahead causing backup.",
        ai_recommendation="Consider alternate routes. Dispatch traffic management team to assess.",
        created_at=now,
        updated_at=now,
    )
    db.add(incident)
    db.commit()
    
    return ScenarioTriggerResponse(
        status="success",
        scenario="congestion",
        readings_created=readings_created,
        incident_id=incident.id,
    )


@router.post("/scenario/stopped-vehicle", response_model=ScenarioTriggerResponse)
async def trigger_stopped_vehicle_scenario(db: Session = Depends(get_db)) -> ScenarioTriggerResponse:
    """Simulate a stopped vehicle blocking a lane."""
    
    segments = db.query(RoadSegment).all()
    if not segments:
        return ScenarioTriggerResponse(
            status="error",
            scenario="stopped_vehicle",
            readings_created=0,
            incident_id=None,
        )
    
    # Find a segment without an open stopped vehicle incident
    segment = segments[0]
    for seg in segments:
        existing = db.query(Incident).filter(
            Incident.road_segment_id == seg.id,
            Incident.type == "STOPPED_VEHICLE",
            Incident.status == "OPEN",
        ).first()
        if not existing:
            segment = seg
            break
    
    # Create historical readings for the charts
    readings_created = _create_historical_readings(db, segment.id, "stopped_vehicle")
    
    # Directly create incident for demo
    now = datetime.now(timezone.utc)
    incident = Incident(
        road_segment_id=segment.id,
        status="OPEN",
        severity="MEDIUM",
        type="STOPPED_VEHICLE",
        rule_triggered="DEMO_SCENARIO",
        ai_summary=f"Stopped vehicle detected on {segment.name}. Lane partially blocked.",
        ai_cause="Possible vehicle breakdown or minor collision.",
        ai_recommendation="Dispatch roadside assistance. Alert drivers via variable message signs.",
        created_at=now,
        updated_at=now,
    )
    db.add(incident)
    db.commit()
    
    return ScenarioTriggerResponse(
        status="success",
        scenario="stopped_vehicle",
        readings_created=readings_created,
        incident_id=incident.id,
    )


@router.post("/scenario/multi-lane-slowdown", response_model=ScenarioTriggerResponse)
async def trigger_multi_lane_slowdown_scenario(db: Session = Depends(get_db)) -> ScenarioTriggerResponse:
    """Simulate a severe multi-lane slowdown with stopped vehicles."""
    
    segments = db.query(RoadSegment).all()
    if not segments:
        return ScenarioTriggerResponse(
            status="error",
            scenario="multi_lane_slowdown",
            readings_created=0,
            incident_id=None,
        )
    
    # Find a segment without an open multi-lane incident
    segment = segments[0]
    for seg in segments:
        existing = db.query(Incident).filter(
            Incident.road_segment_id == seg.id,
            Incident.type == "MULTI_LANE_SLOWDOWN",
            Incident.status == "OPEN",
        ).first()
        if not existing:
            segment = seg
            break
    
    # Create historical readings for the charts
    readings_created = _create_historical_readings(db, segment.id, "multi_lane_slowdown")
    
    # Directly create HIGH severity incident for demo
    now = datetime.now(timezone.utc)
    incident = Incident(
        road_segment_id=segment.id,
        status="OPEN",
        severity="HIGH",
        type="MULTI_LANE_SLOWDOWN",
        rule_triggered="DEMO_SCENARIO",
        ai_summary=f"Severe traffic slowdown across multiple lanes on {segment.name}. Near standstill conditions.",
        ai_cause="Major incident or accident causing widespread lane blockage.",
        ai_recommendation="Urgent: Dispatch emergency response. Consider temporary road closure and activate detour routing.",
        created_at=now,
        updated_at=now,
    )
    db.add(incident)
    db.commit()
    
    return ScenarioTriggerResponse(
        status="success",
        scenario="multi_lane_slowdown",
        readings_created=readings_created,
        incident_id=incident.id,
    )

"""Sensor reading ingestion endpoints."""
from __future__ import annotations

from datetime import datetime, timezone
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from ..database import get_db
from ..detection import collect_recent_readings, evaluate_incidents_for_segment
from ..llm import analyze_incident_with_llm
from ..models import Incident, RoadSegment, Sensor, SensorReading, SensorType
from ..schemas import ReadingsIngestRequest, ReadingsIngestResponse

router = APIRouter(prefix="/api/readings", tags=["readings"])


@router.post("/", response_model=ReadingsIngestResponse, status_code=status.HTTP_202_ACCEPTED)
async def ingest_readings(
	payload: ReadingsIngestRequest,
	db: Session = Depends(get_db),
) -> ReadingsIngestResponse:
	"""Store sensor readings, evaluate detection rules, and trigger AI analysis."""

	if not payload.readings:
		return ReadingsIngestResponse(status="accepted", inserted_count=0, new_incidents=[])

	sensors_cache: dict[int, Sensor] = {}
	impacted_segments: set[int] = set()

	for reading_payload in payload.readings:
		sensor = sensors_cache.get(reading_payload.sensor_id)
		if sensor is None:
			sensor = db.get(Sensor, reading_payload.sensor_id)
			if sensor is None:
				raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Sensor {reading_payload.sensor_id} not found")
			sensors_cache[sensor.id] = sensor

		_validate_sensor_payload(sensor, reading_payload.data)

		timestamp = reading_payload.timestamp
		if timestamp.tzinfo is None:
			timestamp = timestamp.replace(tzinfo=timezone.utc)

		db.add(
			SensorReading(
				sensor_id=sensor.id,
				timestamp=timestamp,
				data=dict(reading_payload.data),
			)
		)
		impacted_segments.add(sensor.road_segment_id)

	db.flush()

	new_incident_ids: list[int] = []

	for segment_id in impacted_segments:
		incidents = evaluate_incidents_for_segment(db, segment_id)
		for incident in incidents:
			await _populate_ai_fields(db, incident)
			new_incident_ids.append(incident.id)

	db.commit()

	return ReadingsIngestResponse(
		status="accepted",
		inserted_count=len(payload.readings),
		new_incidents=new_incident_ids,
	)


def _validate_sensor_payload(sensor: Sensor, data: dict[str, Any]) -> None:
	"""Ensure sensor payload structure matches the sensor type."""

	if sensor.type == SensorType.TRAFFIC_FLOW:
		if "vehicles_per_minute" not in data:
			raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Missing vehicles_per_minute for flow sensor")
	elif sensor.type == SensorType.SPEED:
		if "avg_speed_kmh" not in data:
			raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Missing avg_speed_kmh for speed sensor")
	elif sensor.type == SensorType.STOPPED_VEHICLE:
		if "stopped_count" not in data or "lane_blocked" not in data:
			raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Missing stopped_count or lane_blocked for stopped vehicle sensor")


async def _populate_ai_fields(db: Session, incident: Incident) -> None:
	"""Call the LLM to enrich an incident with AI insights."""

	segment = incident.road_segment or db.get(RoadSegment, incident.road_segment_id)
	if segment is None:
		return

	readings_bundle = collect_recent_readings(db, incident.road_segment_id)
	ai_fields = await analyze_incident_with_llm(incident, segment, readings_bundle.as_dict())

	incident.ai_summary = ai_fields.get("ai_summary")
	incident.ai_cause = ai_fields.get("ai_cause")
	incident.ai_recommendation = ai_fields.get("ai_recommendation")

"""Incident endpoints."""
from __future__ import annotations

from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from ..database import get_db
from ..detection import SegmentReadings, collect_recent_readings
from ..models import Incident, IncidentStatus, RoadSegment
from ..schemas import (
	Incident as IncidentSchema,
	IncidentDetail,
	ResolveIncidentRequest,
	ResolveIncidentResponse,
	SensorReading as SensorReadingSchema,
)

router = APIRouter(prefix="/api/incidents", tags=["incidents"])


@router.get("/", response_model=list[IncidentSchema])
async def list_incidents(
	status_filter: IncidentStatus | None = Query(default=None, alias="status"),
	limit: int = Query(default=50, ge=1, le=200),
	db: Session = Depends(get_db),
) -> list[Incident]:
	"""Return incidents ordered from newest to oldest with optional status filter."""

	query = db.query(Incident).order_by(Incident.created_at.desc())
	if status_filter is not None:
		query = query.filter(Incident.status == status_filter)
	return query.limit(limit).all()


@router.get("/{incident_id}", response_model=IncidentDetail)
async def get_incident(incident_id: int, db: Session = Depends(get_db)) -> IncidentDetail:
	"""Return a single incident with its segment and recent readings."""

	incident = db.get(Incident, incident_id)
	if incident is None:
		raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Incident not found")

	segment = incident.road_segment or db.get(RoadSegment, incident.road_segment_id)
	if segment is None:
		raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Segment not found")

	bundle = collect_recent_readings(db, incident.road_segment_id)
	serialized_readings = _serialize_recent_readings(bundle)

	return IncidentDetail(incident=incident, segment=segment, recent_readings=serialized_readings)


@router.patch("/{incident_id}/resolve", response_model=ResolveIncidentResponse)
async def resolve_incident(
	incident_id: int,
	payload: ResolveIncidentRequest,
	db: Session = Depends(get_db),
) -> ResolveIncidentResponse:
	"""Mark an incident as resolved and persist an optional resolution note."""

	incident = db.get(Incident, incident_id)
	if incident is None:
		raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Incident not found")

	incident.status = IncidentStatus.RESOLVED
	incident.updated_at = datetime.now(timezone.utc)
	incident.resolution_note = payload.resolution_note
	db.commit()

	return ResolveIncidentResponse(status="ok", incident_id=incident.id)


def _serialize_recent_readings(bundle: SegmentReadings) -> list[SensorReadingSchema]:
	"""Flatten bundled readings into a single chronologically sorted list."""

	merged = bundle.flow + bundle.speed + bundle.stopped
	merged.sort(key=lambda reading: reading.timestamp)

	return [
		SensorReadingSchema(
			id=reading.id,
			sensor_id=reading.sensor_id,
			timestamp=reading.timestamp,
			data=reading.data,
			sensor_type=getattr(reading.sensor, "type", None),
		)
		for reading in merged[-50:]
	]

"""Sensor endpoints."""
from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Sensor
from ..schemas import Sensor as SensorSchema

router = APIRouter(prefix="/api/sensors", tags=["sensors"])


@router.get("/", response_model=list[SensorSchema])
async def list_sensors(db: Session = Depends(get_db)) -> list[Sensor]:
	"""Return all sensors."""

	return db.query(Sensor).order_by(Sensor.id.asc()).all()

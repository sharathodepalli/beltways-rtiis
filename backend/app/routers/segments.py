"""Road segment endpoints."""
from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import RoadSegment
from ..schemas import RoadSegment as RoadSegmentSchema

router = APIRouter(prefix="/api/segments", tags=["segments"])


@router.get("/", response_model=list[RoadSegmentSchema])
async def list_segments(db: Session = Depends(get_db)) -> list[RoadSegment]:
	"""Return all configured road segments."""

	return db.query(RoadSegment).order_by(RoadSegment.id.asc()).all()

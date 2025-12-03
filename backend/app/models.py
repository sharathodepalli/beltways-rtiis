"""SQLAlchemy models for the Beltways RTIIS backend."""
from __future__ import annotations

from datetime import datetime
from enum import Enum
from typing import Any

from sqlalchemy import (
	JSON,
	Boolean,
	DateTime,
	Enum as SqlEnum,
	Float,
	ForeignKey,
	Integer,
	String,
	Text,
	func,
)
from sqlalchemy.orm import Mapped, declarative_base, mapped_column, relationship

Base = declarative_base()


class SensorType(str, Enum):
	"""Supported sensor types."""

	TRAFFIC_FLOW = "TRAFFIC_FLOW"
	SPEED = "SPEED"
	STOPPED_VEHICLE = "STOPPED_VEHICLE"


class IncidentStatus(str, Enum):
	"""Lifecycle status for incidents."""

	OPEN = "OPEN"
	RESOLVED = "RESOLVED"


class IncidentSeverity(str, Enum):
	"""Incident severity scale."""

	LOW = "LOW"
	MEDIUM = "MEDIUM"
	HIGH = "HIGH"


class RoadSegment(Base):
	"""Represents a monitored stretch of roadway."""

	__tablename__ = "road_segments"

	id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
	name: Mapped[str] = mapped_column(String(255), nullable=False)
	code: Mapped[str] = mapped_column(String(64), unique=True, nullable=False, index=True)
	direction: Mapped[str] = mapped_column(String(32), nullable=False)
	latitude: Mapped[float | None] = mapped_column(Float, nullable=True)
	longitude: Mapped[float | None] = mapped_column(Float, nullable=True)

	sensors: Mapped[list["Sensor"]] = relationship("Sensor", back_populates="road_segment", cascade="all, delete-orphan")
	incidents: Mapped[list["Incident"]] = relationship("Incident", back_populates="road_segment", cascade="all, delete-orphan")


class Sensor(Base):
	"""Represents a physical or virtual roadside sensor device."""

	__tablename__ = "sensors"

	id: Mapped[int] = mapped_column(Integer, primary_key=True)
	name: Mapped[str] = mapped_column(String(255), nullable=False)
	type: Mapped[SensorType] = mapped_column(SqlEnum(SensorType), nullable=False)
	road_segment_id: Mapped[int] = mapped_column(ForeignKey("road_segments.id", ondelete="CASCADE"), nullable=False, index=True)
	location_lat: Mapped[float | None] = mapped_column(Float, nullable=True)
	location_lng: Mapped[float | None] = mapped_column(Float, nullable=True)
	is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

	road_segment: Mapped[RoadSegment] = relationship("RoadSegment", back_populates="sensors")
	readings: Mapped[list["SensorReading"]] = relationship("SensorReading", back_populates="sensor", cascade="all, delete-orphan")


class SensorReading(Base):
	"""Individual sensor reading captured at a given moment in time."""

	__tablename__ = "sensor_readings"

	id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
	sensor_id: Mapped[int] = mapped_column(ForeignKey("sensors.id", ondelete="CASCADE"), nullable=False, index=True)
	timestamp: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, index=True)
	data: Mapped[dict[str, Any]] = mapped_column(JSON, nullable=False)

	sensor: Mapped[Sensor] = relationship("Sensor", back_populates="readings")


class Incident(Base):
	"""Detected anomaly or event affecting a road segment."""

	__tablename__ = "incidents"

	id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
	road_segment_id: Mapped[int] = mapped_column(ForeignKey("road_segments.id", ondelete="CASCADE"), nullable=False, index=True)
	created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
	updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
	status: Mapped[IncidentStatus] = mapped_column(SqlEnum(IncidentStatus), default=IncidentStatus.OPEN, nullable=False)
	severity: Mapped[IncidentSeverity] = mapped_column(SqlEnum(IncidentSeverity), nullable=False)
	type: Mapped[str] = mapped_column(String(64), nullable=False)
	rule_triggered: Mapped[str] = mapped_column(String(64), nullable=False)
	ai_summary: Mapped[str | None] = mapped_column(Text, nullable=True)
	ai_cause: Mapped[str | None] = mapped_column(Text, nullable=True)
	ai_recommendation: Mapped[str | None] = mapped_column(Text, nullable=True)
	resolution_note: Mapped[str | None] = mapped_column(Text, nullable=True)

	road_segment: Mapped[RoadSegment] = relationship("RoadSegment", back_populates="incidents")

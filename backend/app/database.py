"""Database configuration module for Beltways RTIIS."""
from __future__ import annotations

from collections.abc import Generator

from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker

from .models import Base, RoadSegment, Sensor, SensorType
from .settings import settings


def _build_engine() -> tuple[str, dict[str, object]]:
    """Return database URL and engine kwargs compatible with SQLite or Postgres."""
    database_url = settings.database_url
    engine_kwargs: dict[str, object] = {"future": True}

    if database_url.startswith("sqlite"):
        engine_kwargs["connect_args"] = {"check_same_thread": False}

    return database_url, engine_kwargs


database_url, engine_kwargs = _build_engine()
engine = create_engine(database_url, **engine_kwargs)
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)


def get_db() -> Generator[Session, None, None]:
    """Yield a database session for FastAPI dependency injection."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db() -> None:
    """Create database tables and ensure reference data exists."""
    Base.metadata.create_all(bind=engine)
    with SessionLocal() as session:
        _seed_reference_data(session)


def _seed_reference_data(session: Session) -> None:
    """Seed Cincinnati highway segments and sensors with well-known IDs."""
    # Cincinnati area road segments
    segment_specs = [
        ("I71_N_SEG_A", "I-71 North - Downtown to Blue Ash", "NORTH", 39.123, -84.456),
        ("I75_N_SEG_A", "I-75 North - Covington to Fairfield", "NORTH", 39.15, -84.55),
        ("I275_E_SEG_A", "I-275 East - Airport to Anderson", "EAST", 39.06, -84.42),
        ("I74_W_SEG_A", "I-74 West - Downtown to Harrison", "WEST", 39.14, -84.62),
    ]
    
    segments = []
    for code, name, direction, lat, lng in segment_specs:
        segment = session.query(RoadSegment).filter(RoadSegment.code == code).one_or_none()
        if segment is None:
            segment = RoadSegment(
                name=name,
                code=code,
                direction=direction,
                latitude=lat,
                longitude=lng,
            )
            session.add(segment)
            session.flush()
        segments.append(segment)

    # Add sensors for first segment (backwards compatible)
    segment = segments[0]
    sensor_specs = (
        (1, "Segment A Flow Sensor", SensorType.TRAFFIC_FLOW),
        (2, "Segment A Speed Sensor", SensorType.SPEED),
        (3, "Segment A Stopped Vehicle Sensor", SensorType.STOPPED_VEHICLE),
    )

    for sensor_id, name, sensor_type in sensor_specs:
        exists = session.query(Sensor).filter(Sensor.id == sensor_id).one_or_none()
        if exists is not None:
            continue

        session.add(
            Sensor(
                id=sensor_id,
                name=name,
                type=sensor_type,
                road_segment_id=segment.id,
                is_active=True,
            )
        )
    
    # Add sensors for other segments
    sensor_id_start = 4
    for i, seg in enumerate(segments[1:], start=1):
        for j, (name_suffix, sensor_type) in enumerate([
            ("Flow Sensor", SensorType.TRAFFIC_FLOW),
            ("Speed Sensor", SensorType.SPEED),
            ("Stopped Vehicle Sensor", SensorType.STOPPED_VEHICLE),
        ]):
            sensor_id = sensor_id_start + (i - 1) * 3 + j
            exists = session.query(Sensor).filter(Sensor.id == sensor_id).one_or_none()
            if exists is not None:
                continue
            session.add(
                Sensor(
                    id=sensor_id,
                    name=f"{seg.name.split(' - ')[0]} {name_suffix}",
                    type=sensor_type,
                    road_segment_id=seg.id,
                    is_active=True,
                )
            )

    session.commit()

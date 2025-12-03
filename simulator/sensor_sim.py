"""Sensor simulator for Beltways RTIIS."""
from __future__ import annotations

import os
import random
import time
from dataclasses import dataclass
from datetime import datetime, timezone
from typing import Any

import httpx

BACKEND_URL = os.getenv("BACKEND_URL", "http://localhost:8000")
INTERVAL_SECONDS = int(os.getenv("SIM_INTERVAL_SECONDS", "5"))
READINGS_ENDPOINT = f"{BACKEND_URL}/api/readings/"


@dataclass
class SensorConfig:
    sensor_id: int
    sensor_type: str
    baseline: float


SENSORS = [
    SensorConfig(sensor_id=1, sensor_type="TRAFFIC_FLOW", baseline=50.0),
    SensorConfig(sensor_id=2, sensor_type="SPEED", baseline=80.0),
    SensorConfig(sensor_id=3, sensor_type="STOPPED_VEHICLE", baseline=0.0),
]


class SensorSimulator:
    """Generates normal and anomalous readings for the backend."""

    def __init__(self) -> None:
        self.cycle_count = 0
        self.anomaly_cycles_remaining = 0

    def run(self) -> None:
        print(f"Starting simulator. Posting to {READINGS_ENDPOINT} every {INTERVAL_SECONDS}s.")
        with httpx.Client(timeout=10) as client:
            while True:
                self.cycle_count += 1
                anomaly_active = self._should_trigger_anomaly()
                payload = self._build_payload(anomaly_active)

                try:
                    response = client.post(READINGS_ENDPOINT, json=payload)
                    response.raise_for_status()
                    status = "ANOMALY" if anomaly_active else "normal"
                    print(f"[{status}] Sent {len(payload['readings'])} readings")
                except httpx.HTTPError as exc:
                    print(f"Failed to send readings: {exc}")

                time.sleep(INTERVAL_SECONDS)

    def _should_trigger_anomaly(self) -> bool:
        if self.anomaly_cycles_remaining > 0:
            self.anomaly_cycles_remaining -= 1
            return True

        # Trigger anomalies every 6 cycles (~30s) for faster testing
        if self.cycle_count % 6 == 0:
            self.anomaly_cycles_remaining = random.randint(3, 5)
            return True

        return False

    def _build_payload(self, anomaly: bool) -> dict[str, Any]:
        timestamp = datetime.now(timezone.utc).isoformat()
        readings = []

        for sensor in SENSORS:
            data = self._generate_reading(sensor, anomaly)
            readings.append({
                "sensor_id": sensor.sensor_id,
                "timestamp": timestamp,
                "data": data,
            })

        return {"readings": readings}

    def _generate_reading(self, sensor: SensorConfig, anomaly: bool) -> dict[str, Any]:
        if sensor.sensor_type == "TRAFFIC_FLOW":
            if anomaly:
                value = sensor.baseline * random.uniform(0.1, 0.2)
            else:
                value = sensor.baseline * random.uniform(0.9, 1.1)
            return {"vehicles_per_minute": round(value, 1)}

        if sensor.sensor_type == "SPEED":
            if anomaly:
                value = random.uniform(10, 30)
            else:
                value = sensor.baseline + random.uniform(-10, 10)
            return {"avg_speed_kmh": round(value, 1)}

        if sensor.sensor_type == "STOPPED_VEHICLE":
            if anomaly:
                return {"stopped_count": random.randint(1, 2), "lane_blocked": True}
            return {"stopped_count": 0, "lane_blocked": False}

        raise ValueError(f"Unsupported sensor type {sensor.sensor_type}")


def main() -> None:
    simulator = SensorSimulator()
    simulator.run()


if __name__ == "__main__":
    main()

"""LLM integration helpers for Beltways RTIIS."""
from __future__ import annotations

import json
import logging

import httpx

from .models import Incident, RoadSegment, SensorReading
from .settings import settings

logger = logging.getLogger(__name__)
DEFAULT_OPENAI_MODEL = "gpt-4o-mini"


async def analyze_incident_with_llm(
    incident: Incident,
    segment: RoadSegment,
    recent_readings: dict[str, list[SensorReading]],
) -> dict[str, str]:
    """Generate AI-derived summary, cause, and recommendations for an incident."""

    prompt = _build_prompt(incident, segment, recent_readings)

    if not settings.openai_api_key:
        return _dummy_response(incident)

    provider = settings.llm_provider.lower()

    try:
        if provider == "openai":
            return await _call_openai(prompt)
    except Exception as exc:  # pragma: no cover - network failures
        logger.warning("LLM call failed, falling back to dummy response: %s", exc)

    return _dummy_response(incident)


async def _call_openai(prompt: str) -> dict[str, str]:
    """Call the OpenAI chat completions endpoint and parse structured response."""

    headers = {
        "Authorization": f"Bearer {settings.openai_api_key}",
        "Content-Type": "application/json",
    }
    payload = {
        "model": DEFAULT_OPENAI_MODEL,
        "messages": [
            {"role": "system", "content": "You are a traffic operations assistant."},
            {
                "role": "user",
                "content": (
                    "Respond with a JSON object containing keys summary, cause, recommendation.\n"
                    f"Context:\n{prompt}"
                ),
            },
        ],
        "temperature": 0.2,
    }

    async with httpx.AsyncClient(timeout=20) as client:
        response = await client.post(
            "https://api.openai.com/v1/chat/completions", headers=headers, json=payload
        )
        response.raise_for_status()
        content = response.json()["choices"][0]["message"]["content"]

    try:
        parsed = json.loads(content)
    except json.JSONDecodeError:
        logger.debug("Failed to parse LLM JSON response: %s", content)
        return _dummy_response(None)

    return {
        "ai_summary": parsed.get("summary", ""),
        "ai_cause": parsed.get("cause", ""),
        "ai_recommendation": parsed.get("recommendation", ""),
    }


def _build_prompt(
    incident: Incident, segment: RoadSegment, recent_readings: dict[str, list[SensorReading]]
) -> str:
    """Construct the textual prompt for the LLM."""

    lines = [
        f"Segment: {segment.name} ({segment.code}) direction {segment.direction}",
        f"Incident type: {incident.type}",
        f"Rule triggered: {incident.rule_triggered}",
        "Recent readings:",
    ]

    for key, readings in recent_readings.items():
        series = ", ".join(
            f"{reading.timestamp.isoformat()} -> {reading.data}" for reading in readings[-10:]
        ) or "no data"
        lines.append(f"- {key}: {series}")

    return "\n".join(lines)


def _dummy_response(incident: Incident | None) -> dict[str, str]:
    """Fallback AI response when no provider is configured."""

    incident_type = incident.type if incident else "Incident"
    return {
        "ai_summary": f"{incident_type} detected; monitoring conditions while awaiting operator review.",
        "ai_cause": "Automatic detection based on sensor anomalies.",
        "ai_recommendation": "Verify camera feeds, dispatch response crew, and update signage as needed.",
    }

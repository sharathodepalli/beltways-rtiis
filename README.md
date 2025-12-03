# Beltways Real-Time Roadway Incident Intelligence System (RTIIS)

Beltways RTIIS is a demo platform that simulates roadside sensors, detects congestion/stopped-vehicle incidents with FastAPI + SQLAlchemy, enriches events with an LLM, and visualizes everything on a live React dashboard. A lightweight Python simulator generates both normal and anomalous traffic patterns to keep the system active during demos.

## Architecture

- **Backend:** FastAPI, SQLAlchemy, Pydantic, async routers, rule-based detection, optional OpenAI/Gemini integration.
- **Database:** Configurable via `DATABASE_URL`; use SQLite locally, Supabase Postgres (or any Postgres) for deployment.
- **Frontend:** Vite + React + TypeScript dashboard with polling, AI summaries, and Recharts visualizations.
- **Simulator:** Standalone Python script that posts batched readings to the backend every few seconds.

## Prerequisites

- Python 3.10+
- Node.js 18+
- Access to a Postgres database (Supabase recommended) for deploys

## Environment configuration

Copy `.env.example` to `.env` at the repo root and adjust values:

```
# Production / Supabase example
DATABASE_URL=postgresql+psycopg2://YOUR_SUPABASE_USER:YOUR_PASSWORD@YOUR_SUPABASE_HOST:5432/postgres

# Optional local fallback
# DATABASE_URL=sqlite:///./rtis.db

OPENAI_API_KEY=
LLM_PROVIDER=openai
BACKEND_PORT=8000
FRONTEND_PORT=3000
```

> The backend **always** reads `DATABASE_URL`; swap between SQLite and Supabase Postgres by changing this value only.

For the frontend, create `frontend/.env` (or `.env.local`) with:

```
VITE_API_BASE_URL=http://localhost:8000
```

## Backend

```bash
cd backend
python -m venv .venv
source .venv/bin/activate  # or .venv\Scripts\activate on Windows
pip install -r requirements.txt

uvicorn app.main:app --reload --port 8000
```

- Startup automatically seeds one `RoadSegment` plus three sensors (IDs 1–3).
- `POST /api/readings` ingests sensor data, runs detection, and calls the LLM module.
- Run unit tests any time with `pytest tests/test_incident_detection.py`.

## Frontend

```bash
cd frontend
npm install
npm run dev  # launches Vite dev server on http://localhost:3000
```

The dashboard polls `/api/incidents` every 5 seconds, renders AI summaries, and shows two live charts (flow & speed). Use the “Mark as Resolved” button to exercise the PATCH endpoint.

## Sensor simulator

```bash
BACKEND_URL=http://localhost:8000 SIM_INTERVAL_SECONDS=5 \
python simulator/sensor_sim.py
```

- Emits baseline traffic data with ±10% noise.
- Every ~30 cycles it simulates 3–5 cycles of congestion (low flow + low speed + blocked lane) to trigger incidents.
- Logs each batch and whether the simulator is in anomaly mode.

## Demo flow

1. Start the backend (`uvicorn app.main:app --reload`).
2. Start the frontend (`npm run dev`).
3. Launch the simulator (`python simulator/sensor_sim.py`).
4. Watch incidents appear on the dashboard; resolve one to demonstrate the PATCH endpoint and UI refresh.

## Future enhancements

- Replace REST polling with WebSockets for lower-latency updates.
- Add authentication + role-based access control for operator dashboards.
- Persist simulator scenarios so they can be replayed deterministically.
- Expand LLM providers (Gemini, Azure OpenAI) via the existing abstraction.

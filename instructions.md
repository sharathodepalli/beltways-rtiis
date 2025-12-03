1️⃣ Global instructions for Copilot (tell this first)
Paste something like this to Copilot before coding:
You are helping me implement a project called
“Beltways Real-Time Roadway Incident Intelligence System (RTIIS)”.
I already have a full product + system spec.
Your job is to:
Follow the specification strictly.
Use clean, modular, production-style code.
Use Python + FastAPI + SQLAlchemy for backend.
Use React (or Next.js with React) for the frontend.
Use SQLite for local development.
Implement the sensor simulator as a separate Python script.
Use type hints and docstrings in Python.
Don’t invent extra features unless needed to complete the spec.
I will now share the specification. Read it and confirm understanding before generating code.

Nice, this is exactly the right question to ask _before_ opening VS Code and spamming Copilot 😄

You already have the **product + system documentation**.
Now you need to give Copilot a **build contract**: structure, rules, and concrete prompts.

I’ll give you:

1. **What Copilot needs overall (global instructions)**
2. **Repo structure to create first**
3. **Extra specs Copilot still needs (that weren’t in the docs)**
4. **Ready-to-paste Copilot prompts for each part (backend, frontend, simulator, LLM)**

You can literally copy-paste these into Copilot Chat.

---

## 1️⃣ Global instructions for Copilot (tell this first)

Paste something like this to Copilot **before coding**:

> You are helping me implement a project called
> “Beltways Real-Time Roadway Incident Intelligence System (RTIIS)”.
>
> I already have a full product + system spec.
> Your job is to:
>
> - Follow the specification strictly.
> - Use clean, modular, production-style code.
> - Use Python + FastAPI + SQLAlchemy for backend.
> - Use React (or Next.js with React) for the frontend.
> - Use SQLite for local development.
> - Implement the sensor simulator as a separate Python script.
> - Use type hints and docstrings in Python.
> - Don’t invent extra features unless needed to complete the spec.
>
> I will now share the specification. Read it and confirm understanding before generating code.

Then paste the documentation I gave you before.

---

## 2️⃣ Repo structure to give Copilot

Tell Copilot to **create this structure**:

```text
rtis-project/
  backend/
    app/
      __init__.py
      main.py
      database.py
      models.py
      schemas.py
      detection.py
      llm.py
      routers/
        __init__.py
        segments.py
        sensors.py
        readings.py
        incidents.py
    tests/
      test_incident_detection.py
    requirements.txt

  frontend/
    src/
      components/
        IncidentList.tsx
        IncidentDetail.tsx
        MetricsCharts.tsx
      pages/
        App.tsx (or index.tsx if Next.js)
    package.json

  simulator/
    sensor_sim.py

  README.md
  .env.example
```

You can ask Copilot:

> Generate the above folder structure and minimal placeholder files where needed.

---

## 3️⃣ Extra things Copilot still needs (beyond the spec)

These are **important details** Copilot won’t guess correctly unless you tell it:

### a) Coding style / quality rules

Tell Copilot:

- Use **Python 3.10+** syntax.
- Always add **type hints**.
- Use **Pydantic models** for request/response.
- Use **async** FastAPI endpoints.
- Handle errors cleanly (raise HTTPException with clear messages).
- Keep business logic out of `main.py` (put it in modules like `detection.py`, `llm.py`).
- Keep strings like rule names / incident types in constants/enums.

### b) Environment variables

Create a `.env.example` and tell Copilot to fill:

```env
DATABASE_URL=sqlite:///./rtis.db
OPENAI_API_KEY=your-key-here
LLM_PROVIDER=openai   # or gemini
BACKEND_PORT=8000
FRONTEND_PORT=3000
```

Tell Copilot:

> Do not hardcode secrets or API keys. Read them from environment variables using `python-dotenv` or `os.getenv`.

### c) Dependency lists

Tell Copilot to generate and fill:

**`backend/requirements.txt`**

- fastapi
- uvicorn
- sqlalchemy
- pydantic
- httpx
- python-dotenv

**`frontend/package.json`**

- react
- react-dom
- axios or fetch
- chart library (e.g., recharts or chart.js)

### d) Testing & demo requirements

Tell Copilot:

- Add **at least one test file**: `test_incident_detection.py` that:

  - Creates fake readings.
  - Verifies that incidents are triggered for known thresholds.

- The system must be demo-able with:

  - `uvicorn app.main:app --reload`
  - `npm run dev` for frontend
  - `python simulator/sensor_sim.py` for simulator

---

## 4️⃣ Ready-to-paste prompts for Copilot (per part)

Now the fun part. Here are **exact prompts** you can paste into Copilot Chat section by section.

---

### 🔹 Prompt 1 — Backend skeleton + DB

> Create the backend skeleton for the RTIIS project using FastAPI and SQLAlchemy.
>
> Requirements:
>
> - Use a `backend/app` package with:
>
>   - `main.py` for FastAPI app and router registration
>   - `database.py` for SQLAlchemy engine and session
>   - `models.py` containing SQLAlchemy models: RoadSegment, Sensor, SensorReading, Incident
>   - `schemas.py` containing Pydantic models for API requests and responses
>
> - Use SQLite for development, reading `DATABASE_URL` from environment variables.
> - Include a startup event that:
>
>   - creates all tables
>   - seeds one RoadSegment and three Sensors (flow, speed, stopped_vehicle) with known IDs
>
> - Use async FastAPI endpoints, but synchronous SQLAlchemy is ok for MVP.
> - Follow the data model exactly as in the spec I provided.

---

### 🔹 Prompt 2 — Detection logic

> Implement the incident detection logic in a new module `backend/app/detection.py`.
>
> Requirements:
>
> - Provide functions to:
>
>   - Fetch recent readings for a given road segment (last 10 minutes).
>   - Compute baseline metrics (average flow and speed) over a 5-minute window.
>
> - Implement the two detection rules from the spec:
>
>   1. FLOW_DROP_AND_SPEED_DROP → type "CONGESTION", severity "HIGH"
>   2. STOPPED_VEHICLE_DETECTED → type "STOPPED_VEHICLE", severity "MEDIUM"
>
> - When evaluating rules, avoid generating duplicate incidents:
>
>   - If an incident with the same `road_segment_id` and `type` is already OPEN, update its timestamps but do not insert a new row.
>
> - Expose a main function like:
>   `def evaluate_incidents_for_segment(db: Session, road_segment_id: int) -> list[Incident]:`
>   which:
>
>   - reads recent readings
>   - applies rules
>   - returns any newly created incidents.

---

### 🔹 Prompt 3 — LLM integration

> Create a new module `backend/app/llm.py` that handles LLM integration for incident analysis.
>
> Requirements:
>
> - Use a function:
>
>   ```python
>   async def analyze_incident_with_llm(incident: models.Incident,
>                                       segment: models.RoadSegment,
>                                       recent_readings: dict) -> dict:
>       """
>       Returns dict with keys:
>       - ai_summary
>       - ai_cause
>       - ai_recommendation
>       """
>   ```
>
> - Use an environment variable `OPENAI_API_KEY` and provider `LLM_PROVIDER`.
> - If the API key is missing, return sensible dummy text instead of erroring.
> - Use the prompt template from the spec: include segment, incident type, rule name, and series of recent flow/speed/stopped values.
> - Implement this using OpenAI ChatCompletion or dummy function if external calls are not allowed in this environment.
> - This module should not depend on FastAPI, only on models and plain Python.

---

### 🔹 Prompt 4 — API routers

> Implement API routers under `backend/app/routers` for:
>
> - `segments.py` → `/api/segments`
> - `sensors.py` → `/api/sensors`
> - `readings.py` → `/api/readings`
> - `incidents.py` → `/api/incidents`
>
> Follow the API spec given earlier:
>
> - `GET /api/segments` → list of segments
> - `GET /api/sensors` → list of sensors
> - `POST /api/readings`:
>
>   - Accepts a batch of readings
>   - Validates sensor existence and data shape
>   - Stores readings
>   - Calls detection logic for impacted segments
>   - For each new incident, call the LLM analysis and update the incident with ai\_\* fields
>
> - `GET /api/incidents` with filters (`status`, `limit`)
> - `GET /api/incidents/{id}` including incident, segment, and recent_readings
> - `PATCH /api/incidents/{id}/resolve` to mark as resolved.
>
> Make sure:
>
> - All request/response bodies use Pydantic schemas.
> - Proper HTTP status codes and error handling are implemented.

---

### 🔹 Prompt 5 — Frontend dashboard

> Generate a React (or Next.js) frontend under `frontend/` that implements the RTIIS dashboard.
>
> Requirements:
>
> - Main layout: three panels (left: incident list, center: incident details, right: charts).
> - Components:
>
>   - `IncidentList`:
>
>     - Fetches `/api/incidents?limit=50`
>     - Poll every 5 seconds
>     - Displays status, severity, type, segment, created_at
>     - On click, selects an incident
>
>   - `IncidentDetail`:
>
>     - When an incident is selected, calls `/api/incidents/{id}`
>     - Displays segment, status, severity, type, rule_triggered
>     - Shows ai_summary, ai_cause, ai_recommendation
>     - Includes "Mark as Resolved" button calling PATCH endpoint
>
>   - `MetricsCharts`:
>
>     - Receives `recent_readings` as props
>     - Renders two simple line charts: flow vs time, speed vs time
>
> - Use Axios or fetch for HTTP.
> - Keep styling simple but clean.
> - Handle loading / empty / error states gracefully.

---

### 🔹 Prompt 6 — Sensor simulator

> Implement a Python script `simulator/sensor_sim.py` that simulates sensor readings and sends them to the backend at regular intervals.
>
> Requirements:
>
> - Read configuration from constants at the top:
>
>   - BACKEND_URL (e.g., `http://localhost:8000`)
>   - INTERVAL_SECONDS (e.g., 5)
>
> - Assume three sensor IDs:
>
>   - 1: TRAFFIC_FLOW with baseline 50 vehicles/min
>   - 2: SPEED with baseline 80 km/h
>   - 3: STOPPED_VEHICLE with baseline stopped_count 0, lane_blocked false
>
> - Normal behavior:
>
>   - Flow: random around baseline ± 10%
>   - Speed: random around baseline ± 10 km/h
>   - Stopped: usually 0, lane_blocked false
>
> - Anomaly behavior:
>
>   - Every ~30 cycles, simulate a congestion event for 5 cycles:
>
>     - Flow drops to 10–20% baseline
>     - Speed drops to 10–30 km/h
>     - For some cycles, stopped_count=1 and lane_blocked=true
>
> - On each interval, POST to `/api/readings` with the batch-format payload from the spec.
> - Log to console what it is sending (normal vs anomaly).

---

### 🔹 Prompt 7 — README + run instructions

> Generate a `README.md` at the project root that explains:
>
> - Project summary (1–2 paragraphs).
> - Architecture (backend + frontend + simulator + LLM).
> - How to set up and run:
>
>   - Backend (Python, venv, `pip install -r requirements.txt`, `uvicorn app.main:app --reload`).
>   - Frontend (`npm install`, `npm run dev`).
>   - Simulator (`python simulator/sensor_sim.py`).
>
> - Example demo flow:
>
>   1. Start backend.
>   2. Start frontend.
>   3. Start simulator.
>   4. Watch incidents appear on the dashboard.
>
> - Mention that LLM integration falls back to dummy responses if OPENAI_API_KEY is not set.
> - List possible future improvements briefly.

---

If you give Copilot:

- The **spec document**
- The **repo structure**
- The **env + style rules**
- These **specific prompts**

…then Copilot has everything it needs to build a **clean, impressive MVP** you can refine and own in the interview.

If you want, next I can help you prepare:

- The **GitHub repo description**
- The **project tagline for LinkedIn**
- The **2–3 minute story** you’ll tell when you demo this to Beltways.

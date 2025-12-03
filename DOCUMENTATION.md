# Beltways Real-Time Incident Intelligence System (RTIIS)

## Project Documentation

---

## Executive Summary

The **Beltways RTIIS** is a full-stack, real-time traffic incident detection and intelligence platform designed to enhance roadway safety and operational efficiency. The system ingests live sensor data from highway infrastructure, applies intelligent detection algorithms to identify incidents, and leverages AI to provide actionable insights for traffic management operators.

This document provides a comprehensive overview of the system architecture, features, technical implementation, and demonstration guide.

---

## Table of Contents

1. [Problem Statement](#problem-statement)
2. [Solution Overview](#solution-overview)
3. [Key Features](#key-features)
4. [System Architecture](#system-architecture)
5. [Technology Stack](#technology-stack)
6. [Data Flow](#data-flow)
7. [Detection Logic](#detection-logic)
8. [AI Integration](#ai-integration)
9. [Frontend Dashboard](#frontend-dashboard)
10. [API Endpoints](#api-endpoints)
11. [Demo Walkthrough](#demo-walkthrough)
12. [Future Enhancements](#future-enhancements)
13. [Conclusion](#conclusion)

---

## Problem Statement

Highway traffic management faces several critical challenges:

- **Delayed Incident Detection**: Traditional monitoring relies on manual observation or delayed reports from drivers, leading to slow response times.
- **Information Overload**: Operators must process vast amounts of sensor data without intelligent filtering.
- **Lack of Actionable Intelligence**: Raw data doesn't provide context about incident severity, causes, or recommended actions.
- **Resource Allocation**: Without prioritization, response teams cannot efficiently deploy resources.

**Impact**: Delayed incident response leads to secondary accidents, increased congestion, higher emissions, and economic losses estimated at billions annually.

---

## Solution Overview

Beltways RTIIS addresses these challenges through:

1. **Real-Time Sensor Ingestion**: Continuous collection of traffic flow, speed, and stopped vehicle data from highway sensors.

2. **Intelligent Detection Engine**: Rule-based algorithms that identify congestion and stopped vehicle incidents by analyzing patterns against dynamic baselines.

3. **AI-Powered Intelligence**: Integration with Large Language Models (LLMs) to generate human-readable summaries, cause analysis, and recommended actions.

4. **Operator Dashboard**: Modern, intuitive interface for monitoring incidents, viewing live metrics, and managing incident lifecycle.

5. **Scalable Architecture**: Built on modern technologies that support horizontal scaling for statewide deployment.

---

## Key Features

### 🚨 Real-Time Incident Detection

- Automatic detection of congestion events based on flow and speed anomalies
- Stopped vehicle detection with lane blockage identification
- Sub-minute detection latency from sensor reading to incident alert

### 🤖 AI-Generated Intelligence

- Natural language summaries of each incident
- Automated cause analysis based on sensor patterns
- Actionable recommendations for traffic operators

### 📊 Live Metrics Dashboard

- Real-time visualization of traffic flow and speed
- Interactive incident list with severity indicators
- Detailed incident view with full context

### ⚡ Incident Lifecycle Management

- Track incidents from detection to resolution
- Add resolution notes for post-incident analysis
- Historical record for reporting and analytics

### 🔌 Extensible API

- RESTful endpoints for all operations
- Easy integration with existing TMC systems
- Support for additional sensor types

---

## System Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                         BELTWAYS RTIIS                              │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────────────┐  │
│  │   SENSORS    │    │   BACKEND    │    │      FRONTEND        │  │
│  │              │    │   (FastAPI)  │    │   (React + Vite)     │  │
│  │ • Flow       │───▶│              │◀───│                      │  │
│  │ • Speed      │    │ • Ingestion  │    │ • Incident List      │  │
│  │ • Stopped    │    │ • Detection  │    │ • Detail View        │  │
│  │   Vehicle    │    │ • AI/LLM     │    │ • Live Charts        │  │
│  │              │    │ • REST API   │    │ • Resolution UI      │  │
│  └──────────────┘    └──────┬───────┘    └──────────────────────┘  │
│                             │                                       │
│                      ┌──────▼───────┐                               │
│                      │   DATABASE   │                               │
│                      │  (SQLite /   │                               │
│                      │   Postgres)  │                               │
│                      └──────────────┘                               │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### Component Breakdown

| Component              | Purpose                                  | Technology                       |
| ---------------------- | ---------------------------------------- | -------------------------------- |
| **Sensor Simulator**   | Generates realistic traffic sensor data  | Python, httpx                    |
| **Backend API**        | Data ingestion, detection, AI enrichment | FastAPI, SQLAlchemy              |
| **Detection Engine**   | Rule-based incident identification       | Python, custom algorithms        |
| **AI Module**          | Generate insights via LLM                | OpenAI GPT integration           |
| **Database**           | Persistent storage                       | SQLite (dev) / PostgreSQL (prod) |
| **Frontend Dashboard** | Operator interface                       | React, TypeScript, Recharts      |

---

## Technology Stack

### Backend

| Technology         | Purpose                              |
| ------------------ | ------------------------------------ |
| **Python 3.11+**   | Primary backend language             |
| **FastAPI**        | High-performance async API framework |
| **SQLAlchemy 2.0** | ORM with async support               |
| **Pydantic v2**    | Data validation and serialization    |
| **OpenAI API**     | LLM integration for AI summaries     |

### Frontend

| Technology     | Purpose                        |
| -------------- | ------------------------------ |
| **React 18**   | Component-based UI framework   |
| **TypeScript** | Type-safe JavaScript           |
| **Vite**       | Fast build tool and dev server |
| **Recharts**   | Responsive charting library    |
| **Axios**      | HTTP client for API calls      |

### Infrastructure

| Technology     | Purpose                        |
| -------------- | ------------------------------ |
| **SQLite**     | Local development database     |
| **PostgreSQL** | Production database (Supabase) |
| **Uvicorn**    | ASGI server for FastAPI        |

---

## Data Flow

### 1. Sensor Data Ingestion

```
Sensor → POST /api/readings/ → Validation → Database → Detection Engine
```

The system receives batches of sensor readings containing:

- **Sensor ID**: Identifies the specific sensor device
- **Timestamp**: UTC timestamp of the reading
- **Data Payload**: Type-specific metrics (flow, speed, stopped count)

### 2. Incident Detection

```
New Reading → Collect Recent Data → Evaluate Rules → Create/Update Incident
```

Detection runs after each batch ingestion, evaluating:

- Last N minutes of readings per road segment
- Dynamic baseline calculations
- Multiple rule conditions for each incident type

### 3. AI Enrichment

```
New Incident → Prepare Context → Call LLM → Store AI Fields → Return Response
```

When an incident is created:

1. Recent sensor readings are compiled as context
2. Structured prompt sent to OpenAI GPT
3. AI generates summary, cause, and recommendations
4. Results stored with the incident record

### 4. Dashboard Updates

```
Frontend Polling → GET /api/incidents/ → Render Updates → User Interaction
```

The dashboard polls every 5 seconds for:

- Latest incidents list
- Selected incident details with readings
- Real-time chart data

---

## Detection Logic

### Congestion Detection Rule

**Rule Name**: `FLOW_DROP_AND_SPEED_DROP`

**Trigger Conditions**:

1. Traffic flow drops to ≤40% of 5-minute baseline
2. Average speed drops to ≤25 km/h
3. Both conditions sustained for 2+ consecutive readings

**Severity**: HIGH

**Example**:

```
Baseline: 50 vehicles/min, 80 km/h
Anomaly:  8 vehicles/min, 20 km/h  → CONGESTION DETECTED
```

### Stopped Vehicle Detection Rule

**Rule Name**: `STOPPED_VEHICLE_DETECTED`

**Trigger Conditions**:

1. Stopped vehicle count ≥1
2. Lane blocked = true
3. Condition persists for 2+ consecutive readings

**Severity**: MEDIUM

**Example**:

```
Reading 1: stopped_count=1, lane_blocked=true
Reading 2: stopped_count=1, lane_blocked=true  → STOPPED_VEHICLE DETECTED
```

---

## AI Integration

### LLM Prompt Structure

The system constructs contextual prompts for GPT:

```
You are a traffic incident analyst. Based on the following sensor data
from road segment "{segment_name}", provide:

1. A brief summary of the incident
2. The likely cause
3. Recommended actions for traffic operators

Sensor Data (last 10 minutes):
- Traffic Flow: [readings...]
- Speed: [readings...]
- Stopped Vehicles: [readings...]

Incident Type: {incident_type}
Severity: {severity}
```

### AI Response Fields

| Field               | Description                  | Example                                                                                  |
| ------------------- | ---------------------------- | ---------------------------------------------------------------------------------------- |
| `ai_summary`        | Concise incident description | "Major congestion detected on I-71 North with traffic flow reduced to 15% of normal."    |
| `ai_cause`          | Probable cause analysis      | "Likely caused by a multi-vehicle incident blocking the center lane."                    |
| `ai_recommendation` | Actionable steps             | "Deploy incident response team, activate dynamic message signs, consider ramp metering." |

### Fallback Handling

When OpenAI is unavailable, the system provides default responses:

- Summary: "Incident detected; monitoring conditions while awaiting operator review."
- Cause: "Automatic detection based on sensor anomalies."
- Recommendation: "Verify camera feeds, dispatch response crew, and update signage as needed."

---

## Frontend Dashboard

### Layout Structure

```
┌─────────────────────────────────────────────────────────────────┐
│  HEADER: Beltways RTIIS Dashboard              [● Online]       │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────┐  ┌───────────────────┐  ┌─────────────────┐   │
│  │  INCIDENTS  │  │  INCIDENT DETAIL  │  │  LIVE METRICS   │   │
│  │             │  │                   │  │                 │   │
│  │ • Stopped   │  │  I-71 North       │  │  ┌───────────┐  │   │
│  │   Vehicle   │  │  Segment A        │  │  │ Flow Chart│  │   │
│  │   ○ MEDIUM  │  │                   │  │  └───────────┘  │   │
│  │             │  │  [OPEN] [HIGH]    │  │                 │   │
│  │ • Congestion│  │                   │  │  ┌───────────┐  │   │
│  │   ● HIGH    │  │  AI Summary:      │  │  │Speed Chart│  │   │
│  │             │  │  "Major conges.." │  │  └───────────┘  │   │
│  │             │  │                   │  │                 │   │
│  │             │  │  [Mark Resolved]  │  │                 │   │
│  └─────────────┘  └───────────────────┘  └─────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### UI Features

1. **Incident List Panel**

   - Color-coded severity dots (🔵 Low, 🟡 Medium, 🔴 High)
   - Timestamp and status display
   - Click to select and view details

2. **Incident Detail Panel**

   - Road segment information
   - Status and severity badges
   - AI-generated summary, cause, and recommendations
   - "Mark as Resolved" action button

3. **Live Metrics Panel**

   - Traffic flow area chart (blue gradient)
   - Speed area chart (red gradient)
   - Auto-updating with new readings

4. **Visual Design**
   - Modern dark theme with subtle gradients
   - Animated status indicators
   - Smooth hover transitions
   - Responsive layout for different screens

---

## API Endpoints

### Road Segments

| Method | Endpoint             | Description            |
| ------ | -------------------- | ---------------------- |
| GET    | `/api/segments`      | List all road segments |
| GET    | `/api/segments/{id}` | Get segment details    |

### Sensors

| Method | Endpoint            | Description        |
| ------ | ------------------- | ------------------ |
| GET    | `/api/sensors`      | List all sensors   |
| GET    | `/api/sensors/{id}` | Get sensor details |

### Sensor Readings

| Method | Endpoint         | Description               |
| ------ | ---------------- | ------------------------- |
| POST   | `/api/readings/` | Ingest batch of readings  |
| GET    | `/api/readings/` | Query historical readings |

### Incidents

| Method | Endpoint                      | Description                 |
| ------ | ----------------------------- | --------------------------- |
| GET    | `/api/incidents/`             | List incidents (filterable) |
| GET    | `/api/incidents/{id}`         | Get incident with details   |
| PATCH  | `/api/incidents/{id}/resolve` | Resolve an incident         |

### Health

| Method | Endpoint  | Description         |
| ------ | --------- | ------------------- |
| GET    | `/health` | System health check |

---

## Demo Walkthrough

### Prerequisites

- Backend running on `http://localhost:8000`
- Frontend running on `http://localhost:3000`
- Simulator generating data

### Demo Script

**1. Introduction (1 min)**

> "This is the Beltways Real-Time Incident Intelligence System. It monitors highway sensors and automatically detects traffic incidents, providing AI-powered insights for operators."

**2. Show Empty State (30 sec)**

> "When no incidents are detected, the dashboard displays a clean monitoring state with the green indicator showing the system is online and processing data."

**3. Incident Detection (1 min)**

> "Watch as our detection engine identifies anomalies. Here we see a CONGESTION incident detected on I-71 North. Notice the HIGH severity indicator and the automatic timestamp."

**4. AI Intelligence (1 min)**

> "Click on the incident to see AI-generated intelligence. The system provides:
>
> - A summary of what's happening
> - Analysis of the likely cause
> - Recommended actions for operators"

**5. Live Metrics (30 sec)**

> "The metrics panel shows real-time sensor data. Notice how the flow dropped significantly while speed also decreased—the pattern that triggered our detection rule."

**6. Incident Resolution (30 sec)**

> "Operators can mark incidents as resolved with optional notes. This creates an audit trail for post-incident analysis and reporting."

**7. Architecture Overview (1 min)**

> "Under the hood:
>
> - FastAPI backend processes sensor data in real-time
> - SQLAlchemy manages our data layer
> - OpenAI integration provides the AI summaries
> - React frontend with live polling updates"

---

## Future Enhancements

### Phase 2: Advanced Detection

- Machine learning models for predictive incident detection
- Weather data integration for context-aware thresholds
- Multi-segment correlation for regional incident patterns

### Phase 3: Enhanced Visualization

- Geographic map view with incident markers
- Historical trend analysis and reporting
- Custom alert configurations per segment

### Phase 4: Integration & Scale

- CCTV camera feed integration
- Integration with 511 systems
- Mobile app for field responders
- Multi-region deployment support

### Phase 5: Predictive Intelligence

- Traffic flow prediction models
- Incident duration estimation
- Optimal response time calculations
- Resource allocation recommendations

---

## Conclusion

The Beltways RTIIS demonstrates a modern, scalable approach to traffic incident management:

✅ **Real-time detection** reduces response times from minutes to seconds

✅ **AI integration** transforms raw data into actionable intelligence

✅ **Clean architecture** enables easy maintenance and extension

✅ **Modern UI** improves operator efficiency and decision-making

✅ **API-first design** supports integration with existing infrastructure

The system is production-ready for pilot deployment and designed for incremental enhancement based on operational feedback.

---

## Quick Reference

### Start the System

```bash
# Terminal 1: Backend
cd backend
uvicorn app.main:app --reload --port 8000

# Terminal 2: Frontend
cd frontend
npm run dev -- --port 3000

# Terminal 3: Simulator
python simulator/sensor_sim.py
```

### Access Points

- **Dashboard**: http://localhost:3000
- **API Docs**: http://localhost:8000/docs
- **Health Check**: http://localhost:8000/health

---

_Document Version: 1.0_  
_Last Updated: November 2025_

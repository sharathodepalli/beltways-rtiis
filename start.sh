#!/bin/bash

# Beltways RTIIS - Start Script
# Starts both backend and frontend servers

echo "🚀 Starting Beltways RTIIS..."
echo ""

# Kill any existing processes on ports 8000 and 3001
echo "Cleaning up existing processes..."
lsof -ti:8000 | xargs kill -9 2>/dev/null
lsof -ti:3001 | xargs kill -9 2>/dev/null
sleep 1

# Get the directory where this script is located
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

# Start Backend
echo "Starting Backend (FastAPI) on port 8000..."
cd "$SCRIPT_DIR/backend"
uvicorn app.main:app --reload --port 8000 &
BACKEND_PID=$!
echo "Backend PID: $BACKEND_PID"

# Wait for backend to be ready
echo "Waiting for backend to start..."
sleep 3

# Start Frontend
echo "Starting Frontend (Vite + React) on port 3001..."
cd "$SCRIPT_DIR/frontend"
npm run dev -- --port 3001 &
FRONTEND_PID=$!
echo "Frontend PID: $FRONTEND_PID"

# Wait for frontend to be ready
sleep 3

echo ""
echo "============================================"
echo "  Beltways RTIIS is running!"
echo "============================================"
echo ""
echo "  Frontend:  http://localhost:3001"
echo "  Backend:   http://localhost:8000"
echo "  API Docs:  http://localhost:8000/docs"
echo ""
echo "  Press Ctrl+C to stop all servers"
echo "============================================"
echo ""

# Wait for user to press Ctrl+C
trap "echo ''; echo 'Shutting down...'; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit 0" INT

# Keep script running
wait

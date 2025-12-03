import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { API_BASE_URL } from "../lib/api";
import "./SystemStatus.css";

interface SystemStatusData {
  backend_status: string;
  db_status: string;
  llm_status: string;
  total_readings: number;
  readings_last_minute: number;
  total_incidents: number;
  open_incidents: number;
  last_incident_at: string | null;
  last_reading_at: string | null;
  uptime_seconds: number;
}

const SystemStatus: React.FC = () => {
  const [status, setStatus] = useState<SystemStatusData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  const fetchStatus = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/system/status`);
      if (!res.ok) throw new Error("Failed to fetch status");
      const data = await res.json();
      setStatus(data);
      setError(null);
      setLastUpdated(new Date());
    } catch (err) {
      setError("Unable to connect to backend");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 5000);
    return () => clearInterval(interval);
  }, []);

  const formatUptime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    if (hrs > 0) return `${hrs}h ${mins}m ${secs}s`;
    if (mins > 0) return `${mins}m ${secs}s`;
    return `${secs}s`;
  };

  const formatTime = (isoString: string | null) => {
    if (!isoString) return "Never";
    return new Date(isoString).toLocaleString();
  };

  const getStatusIcon = (statusValue: string) => {
    if (
      statusValue === "healthy" ||
      statusValue === "connected" ||
      statusValue === "online"
    ) {
      return <span className="status-dot-icon ok"></span>;
    }
    return <span className="status-dot-icon error"></span>;
  };

  const getStatusClass = (statusValue: string) => {
    if (
      statusValue === "healthy" ||
      statusValue === "connected" ||
      statusValue === "online"
    ) {
      return "status-ok";
    }
    return "status-error";
  };

  return (
    <div className="system-status-page">
      <header className="status-header">
        <Link to="/" className="back-link">
          ← Home
        </Link>
        <h1>System Diagnostics</h1>
        <Link to="/demo" className="demo-link">
          Dashboard →
        </Link>
      </header>

      <main className="status-content">
        {loading ? (
          <div className="status-loading">
            <div className="spinner"></div>
            <p>Connecting to backend...</p>
          </div>
        ) : error ? (
          <div className="status-error-box">
            <span className="error-indicator"></span>
            <h2>Connection Error</h2>
            <p>{error}</p>
            <button onClick={fetchStatus} className="retry-btn">
              Retry Connection
            </button>
          </div>
        ) : status ? (
          <>
            {/* Health Indicators */}
            <section className="status-section">
              <h2>System Health</h2>
              <div className="health-grid">
                <div
                  className={`health-card ${getStatusClass(
                    status.backend_status
                  )}`}
                >
                  <span className="health-icon">
                    {getStatusIcon(status.backend_status)}
                  </span>
                  <div className="health-info">
                    <span className="health-label">Backend API</span>
                    <span className="health-value">
                      {status.backend_status}
                    </span>
                  </div>
                </div>
                <div
                  className={`health-card ${getStatusClass(status.db_status)}`}
                >
                  <span className="health-icon">
                    {getStatusIcon(status.db_status)}
                  </span>
                  <div className="health-info">
                    <span className="health-label">Database</span>
                    <span className="health-value">{status.db_status}</span>
                  </div>
                </div>
                <div
                  className={`health-card ${getStatusClass(status.llm_status)}`}
                >
                  <span className="health-icon">
                    {getStatusIcon(status.llm_status)}
                  </span>
                  <div className="health-info">
                    <span className="health-label">LLM Module</span>
                    <span className="health-value">{status.llm_status}</span>
                  </div>
                </div>
              </div>
            </section>

            {/* Metrics */}
            <section className="status-section">
              <h2>Live Metrics</h2>
              <div className="metrics-grid">
                <div className="metric-card">
                  <span className="metric-value">
                    {status.readings_last_minute}
                  </span>
                  <span className="metric-label">Readings / Minute</span>
                  <div className="metric-bar">
                    <div
                      className="metric-bar-fill"
                      style={{
                        width: `${Math.min(
                          status.readings_last_minute * 5,
                          100
                        )}%`,
                      }}
                    ></div>
                  </div>
                </div>
                <div className="metric-card">
                  <span className="metric-value">
                    {status.total_readings.toLocaleString()}
                  </span>
                  <span className="metric-label">Total Readings</span>
                </div>
                <div className="metric-card highlight">
                  <span className="metric-value">{status.open_incidents}</span>
                  <span className="metric-label">Open Incidents</span>
                </div>
                <div className="metric-card">
                  <span className="metric-value">{status.total_incidents}</span>
                  <span className="metric-label">Total Incidents</span>
                </div>
              </div>
            </section>

            {/* Timestamps */}
            <section className="status-section">
              <h2>Timestamps</h2>
              <div className="timestamps-grid">
                <div className="timestamp-card">
                  <span className="timestamp-indicator uptime"></span>
                  <div className="timestamp-info">
                    <span className="timestamp-label">Server Uptime</span>
                    <span className="timestamp-value">
                      {formatUptime(status.uptime_seconds)}
                    </span>
                  </div>
                </div>
                <div className="timestamp-card">
                  <span className="timestamp-indicator reading"></span>
                  <div className="timestamp-info">
                    <span className="timestamp-label">Last Reading</span>
                    <span className="timestamp-value">
                      {formatTime(status.last_reading_at)}
                    </span>
                  </div>
                </div>
                <div className="timestamp-card">
                  <span className="timestamp-indicator incident"></span>
                  <div className="timestamp-info">
                    <span className="timestamp-label">Last Incident</span>
                    <span className="timestamp-value">
                      {formatTime(status.last_incident_at)}
                    </span>
                  </div>
                </div>
                <div className="timestamp-card">
                  <span className="timestamp-indicator refresh"></span>
                  <div className="timestamp-info">
                    <span className="timestamp-label">Last Updated</span>
                    <span className="timestamp-value">
                      {lastUpdated.toLocaleTimeString()}
                    </span>
                  </div>
                </div>
              </div>
            </section>

            {/* System Info */}
            <section className="status-section">
              <h2>System Info</h2>
              <div className="info-table">
                <div className="info-row">
                  <span className="info-key">API Endpoint</span>
                  <span className="info-value">{API_BASE_URL}</span>
                </div>
                <div className="info-row">
                  <span className="info-key">Frontend</span>
                  <span className="info-value">React + TypeScript + Vite</span>
                </div>
                <div className="info-row">
                  <span className="info-key">Backend</span>
                  <span className="info-value">FastAPI + SQLAlchemy</span>
                </div>
                <div className="info-row">
                  <span className="info-key">AI Integration</span>
                  <span className="info-value">OpenAI GPT (with fallback)</span>
                </div>
              </div>
            </section>
          </>
        ) : null}
      </main>

      <footer className="status-footer">
        <p>Auto-refreshing every 5 seconds</p>
        <div className="pulse-indicator"></div>
      </footer>
    </div>
  );
};

export default SystemStatus;

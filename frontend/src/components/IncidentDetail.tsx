import React from "react";
import type { IncidentDetailResponse } from "../types";
import IncidentTimeline from "./IncidentTimeline";
import "./IncidentTimeline.css";

interface IncidentDetailProps {
  detail: IncidentDetailResponse | null;
  loading: boolean;
  resolving: boolean;
  onResolve: (incidentId: number) => Promise<void>;
}

const IncidentDetail: React.FC<IncidentDetailProps> = ({
  detail,
  loading,
  resolving,
  onResolve,
}) => {
  if (loading) {
    return <div className="panel loading">Loading details</div>;
  }

  if (!detail) {
    return (
      <div className="panel empty-state">
        <span>Select an incident</span>
        <small style={{ marginTop: "0.5rem", opacity: 0.7 }}>
          Click on an incident to view details
        </small>
      </div>
    );
  }

  const { incident, segment } = detail;

  return (
    <div className="panel incident-detail">
      <header>
        <div>
          <p className="segment-name">{segment.name}</p>
          <p className="segment-meta">
            {segment.code} · {segment.direction}
          </p>
        </div>
        {incident.status === "OPEN" && (
          <button disabled={resolving} onClick={() => onResolve(incident.id)}>
            {resolving ? "Resolving…" : "✓ Mark Resolved"}
          </button>
        )}
      </header>
      <section className="incident-tags">
        <span className={`status-badge ${incident.status.toLowerCase()}`}>
          {incident.status}
        </span>
        <span
          className={`severity-badge severity-${incident.severity.toLowerCase()}`}
        >
          {incident.severity}
        </span>
        <span className="rule-tag">{incident.rule_triggered}</span>
      </section>
      <section>
        <h3>AI Summary</h3>
        <p>{incident.ai_summary ?? "Generating summary…"}</p>
      </section>
      <section>
        <h3>Likely Cause</h3>
        <p>{incident.ai_cause ?? "Analyzing cause…"}</p>
      </section>
      <section>
        <h3>Recommended Actions</h3>
        <p>{incident.ai_recommendation ?? "Generating recommendations…"}</p>
      </section>
      {incident.resolution_note && (
        <section>
          <h3>Resolution Note</h3>
          <p>{incident.resolution_note}</p>
        </section>
      )}

      {/* Incident Timeline */}
      <IncidentTimeline incident={incident} />
    </div>
  );
};

export default IncidentDetail;

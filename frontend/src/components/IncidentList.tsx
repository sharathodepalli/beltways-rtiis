import React from "react";
import type { Incident, RoadSegment } from "../types";

interface IncidentListProps {
  incidents: Incident[];
  selectedIncidentId: number | null;
  onSelect: (incidentId: number) => void;
  loading: boolean;
  error: string | null;
  segmentsById: Record<number, RoadSegment>;
}

const severityColors: Record<string, string> = {
  LOW: "#3b82f6",
  MEDIUM: "#f59e0b",
  HIGH: "#ef4444",
};

const IncidentList: React.FC<IncidentListProps> = ({
  incidents,
  selectedIncidentId,
  onSelect,
  loading,
  error,
  segmentsById,
}) => {
  if (loading) {
    return <div className="panel loading">Loading incidents</div>;
  }

  if (error) {
    return <div className="panel error">{error}</div>;
  }

  if (!incidents.length) {
    return (
      <div className="panel empty-state">
        <span>No incidents detected yet</span>
        <small style={{ marginTop: "0.5rem", opacity: 0.7 }}>
          Waiting for sensor data…
        </small>
      </div>
    );
  }

  return (
    <div className="panel incident-list">
      <h2>Incidents ({incidents.length})</h2>
      <ul>
        {incidents.map((incident) => {
          const segment = segmentsById[incident.road_segment_id];
          const isSelected = incident.id === selectedIncidentId;
          const severityColor = severityColors[incident.severity] || "#64748b";
          return (
            <li
              key={incident.id}
              className={isSelected ? "selected" : ""}
              onClick={() => onSelect(incident.id)}
            >
              <div className="incident-row">
                <span
                  className="severity-dot"
                  style={{
                    backgroundColor: severityColor,
                    boxShadow: `0 0 8px ${severityColor}`,
                  }}
                />
                <div className="incident-info">
                  <div className="incident-type">
                    {incident.type.replace("_", " ")}
                  </div>
                  <div className="incident-meta">
                    {segment
                      ? segment.name
                      : `Segment ${incident.road_segment_id}`}{" "}
                    · {incident.status}
                  </div>
                </div>
                <span className="incident-time">
                  {new Date(incident.created_at).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
};

export default IncidentList;

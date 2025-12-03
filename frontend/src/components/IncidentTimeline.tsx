import React from "react";
import "./IncidentTimeline.css";

interface Incident {
  id: number;
  created_at: string;
  updated_at: string;
  status: string;
  ai_summary: string | null;
  resolution_note: string | null;
}

interface IncidentTimelineProps {
  incident: Incident;
}

const IncidentTimeline: React.FC<IncidentTimelineProps> = ({ incident }) => {
  const createdAt = new Date(incident.created_at);
  const updatedAt = new Date(incident.updated_at);

  // Estimate AI summary time (usually happens ~1 second after detection)
  const aiSummaryTime = new Date(createdAt.getTime() + 1000);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="incident-timeline">
      <h4 className="timeline-title">Incident Timeline</h4>

      <div className="timeline-track">
        {/* Detection Event */}
        <div className="timeline-event detected">
          <div className="event-marker">
            <span className="event-dot detected-dot"></span>
          </div>
          <div className="event-content">
            <span className="event-time">{formatTime(createdAt)}</span>
            <span className="event-label">Incident Detected</span>
            <span className="event-date">{formatDate(createdAt)}</span>
          </div>
        </div>

        {/* AI Summary Event */}
        {incident.ai_summary && (
          <div className="timeline-event ai-analyzed">
            <div className="event-marker">
              <span className="event-dot ai-dot"></span>
            </div>
            <div className="event-content">
              <span className="event-time">{formatTime(aiSummaryTime)}</span>
              <span className="event-label">AI Summary Generated</span>
              <span className="event-detail">Analysis complete</span>
            </div>
          </div>
        )}

        {/* Resolution Event (if resolved) */}
        {incident.status === "RESOLVED" ? (
          <div className="timeline-event resolved">
            <div className="event-marker">
              <span className="event-dot resolved-dot"></span>
            </div>
            <div className="event-content">
              <span className="event-time">{formatTime(updatedAt)}</span>
              <span className="event-label">Incident Resolved</span>
              {incident.resolution_note && (
                <span className="event-detail">{incident.resolution_note}</span>
              )}
            </div>
          </div>
        ) : (
          <div className="timeline-event pending">
            <div className="event-marker pulsing">
              <span className="event-dot pending-dot"></span>
            </div>
            <div className="event-content">
              <span className="event-time">--:--:--</span>
              <span className="event-label">Awaiting Resolution</span>
              <span className="event-detail">Operator action required</span>
            </div>
          </div>
        )}
      </div>

      {/* Time Elapsed */}
      <div className="timeline-elapsed">
        <span className="elapsed-label">
          {incident.status === "RESOLVED" ? "Total Duration" : "Time Open"}
        </span>
        <span className="elapsed-value">
          {formatElapsed(
            createdAt,
            incident.status === "RESOLVED" ? updatedAt : new Date()
          )}
        </span>
      </div>
    </div>
  );
};

function formatElapsed(start: Date, end: Date): string {
  const diffMs = end.getTime() - start.getTime();
  const diffSec = Math.floor(diffMs / 1000);

  if (diffSec < 60) return `${diffSec}s`;

  const mins = Math.floor(diffSec / 60);
  const secs = diffSec % 60;

  if (mins < 60) return `${mins}m ${secs}s`;

  const hours = Math.floor(mins / 60);
  const remainingMins = mins % 60;
  return `${hours}h ${remainingMins}m`;
}

export default IncidentTimeline;

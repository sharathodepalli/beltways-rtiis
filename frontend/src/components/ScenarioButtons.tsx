import React, { useState } from "react";
import { API_BASE_URL } from "../lib/api";
import "./ScenarioButtons.css";

interface ScenarioButtonsProps {
  onScenarioTriggered?: () => void;
}

const ScenarioButtons: React.FC<ScenarioButtonsProps> = ({
  onScenarioTriggered,
}) => {
  const [loading, setLoading] = useState<string | null>(null);
  const [lastResult, setLastResult] = useState<{
    scenario: string;
    incident_id: number | null;
  } | null>(null);

  const triggerScenario = async (scenario: string, endpoint: string) => {
    setLoading(scenario);
    setLastResult(null);

    try {
      const res = await fetch(
        `${API_BASE_URL}/api/system/scenario/${endpoint}`,
        {
          method: "POST",
        }
      );
      const data = await res.json();
      setLastResult({ scenario: data.scenario, incident_id: data.incident_id });

      // Notify parent to refresh data
      if (onScenarioTriggered) {
        setTimeout(onScenarioTriggered, 500);
      }
    } catch (err) {
      console.error("Failed to trigger scenario:", err);
      setLastResult({ scenario, incident_id: null });
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="scenario-buttons-container">
      <div className="scenario-header">
        <div className="scenario-icon-shape"></div>
        <div className="scenario-title">
          <h3>Operator Playground</h3>
          <p>Trigger test scenarios to see detection in action</p>
        </div>
      </div>

      <div className="scenario-buttons">
        <button
          className={`scenario-btn congestion ${
            loading === "congestion" ? "loading" : ""
          }`}
          onClick={() => triggerScenario("congestion", "congestion")}
          disabled={loading !== null}
        >
          <span className="btn-indicator congestion-ind"></span>
          <span className="btn-text">
            <strong>Simulate Congestion</strong>
            <small>Low speed, high density</small>
          </span>
          {loading === "congestion" && <span className="btn-spinner"></span>}
        </button>

        <button
          className={`scenario-btn stopped ${
            loading === "stopped" ? "loading" : ""
          }`}
          onClick={() => triggerScenario("stopped", "stopped-vehicle")}
          disabled={loading !== null}
        >
          <span className="btn-indicator stopped-ind"></span>
          <span className="btn-text">
            <strong>Stopped Vehicle</strong>
            <small>Lane blockage detected</small>
          </span>
          {loading === "stopped" && <span className="btn-spinner"></span>}
        </button>

        <button
          className={`scenario-btn multi-lane ${
            loading === "multi-lane" ? "loading" : ""
          }`}
          onClick={() => triggerScenario("multi-lane", "multi-lane-slowdown")}
          disabled={loading !== null}
        >
          <span className="btn-indicator multilane-ind"></span>
          <span className="btn-text">
            <strong>Multi-Lane Slowdown</strong>
            <small>Severe traffic impact</small>
          </span>
          {loading === "multi-lane" && <span className="btn-spinner"></span>}
        </button>
      </div>

      {lastResult && (
        <div
          className={`scenario-result ${
            lastResult.incident_id ? "success" : "info"
          }`}
        >
          {lastResult.incident_id ? (
            <>
              <span className="result-indicator success-ind"></span>
              <span>
                Scenario "{lastResult.scenario}" triggered •
                <strong> Incident #{lastResult.incident_id}</strong> created!
              </span>
            </>
          ) : (
            <>
              <span className="result-indicator info-ind"></span>
              <span>
                Scenario "{lastResult.scenario}" triggered • No new incident
                (conditions may not meet threshold)
              </span>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default ScenarioButtons;

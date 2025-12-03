import { useCallback, useEffect, useMemo, useState } from "react";

import IncidentDetail from "./components/IncidentDetail";
import IncidentList from "./components/IncidentList";
import MetricsCharts from "./components/MetricsCharts";
import { apiClient } from "./lib/api";
import type { Incident, IncidentDetailResponse, RoadSegment } from "./types";

const POLL_INTERVAL_MS = 5000;

function App() {
  const [segments, setSegments] = useState<RoadSegment[]>([]);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [incidentsLoading, setIncidentsLoading] = useState(true);
  const [incidentError, setIncidentError] = useState<string | null>(null);

  const [selectedIncidentId, setSelectedIncidentId] = useState<number | null>(
    null
  );
  const [incidentDetail, setIncidentDetail] =
    useState<IncidentDetailResponse | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [resolving, setResolving] = useState(false);

  const segmentsById = useMemo(() => {
    const mapping: Record<number, RoadSegment> = {};
    segments.forEach((segment: RoadSegment) => {
      mapping[segment.id] = segment;
    });
    return mapping;
  }, [segments]);

  const fetchSegments = useCallback(async () => {
    try {
      const { data } = await apiClient.get<RoadSegment[]>("/api/segments");
      setSegments(data);
    } catch (error) {
      console.warn("Failed to load segments", error);
    }
  }, []);

  const loadIncidents = useCallback(async () => {
    try {
      const { data } = await apiClient.get<Incident[]>("/api/incidents", {
        params: { limit: 50 },
      });
      setIncidents(data);
      if (!selectedIncidentId && data.length) {
        setSelectedIncidentId(data[0].id);
      }
      setIncidentError(null);
    } catch (error) {
      console.error(error);
      setIncidentError("Failed to load incidents");
    } finally {
      setIncidentsLoading(false);
    }
  }, [selectedIncidentId]);

  const loadIncidentDetail = useCallback(async (incidentId: number) => {
    setDetailLoading(true);
    try {
      const { data } = await apiClient.get<IncidentDetailResponse>(
        `/api/incidents/${incidentId}`
      );
      setIncidentDetail(data);
    } catch (error) {
      console.error(error);
      setIncidentDetail(null);
    } finally {
      setDetailLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSegments();
  }, [fetchSegments]);

  useEffect(() => {
    loadIncidents();
    const interval = setInterval(loadIncidents, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [loadIncidents]);

  useEffect(() => {
    if (selectedIncidentId) {
      loadIncidentDetail(selectedIncidentId);
    } else {
      setIncidentDetail(null);
    }
  }, [selectedIncidentId, loadIncidentDetail]);

  const handleResolve = useCallback(
    async (incidentId: number) => {
      const resolution_note =
        window.prompt("Add an optional resolution note:") ?? undefined;
      setResolving(true);
      try {
        await apiClient.patch(`/api/incidents/${incidentId}/resolve`, {
          resolution_note,
        });
        await loadIncidents();
        if (incidentId === selectedIncidentId) {
          await loadIncidentDetail(incidentId);
        }
      } catch (error) {
        console.error("Failed to resolve incident", error);
        alert("Failed to resolve incident. Please try again.");
      } finally {
        setResolving(false);
      }
    },
    [loadIncidents, loadIncidentDetail, selectedIncidentId]
  );

  return (
    <div className="app-shell">
      <header>
        <div>
          <h1>Beltways RTIIS Dashboard</h1>
          <p>
            Real-time roadway incident intelligence powered by sensor data and
            AI summaries.
          </p>
        </div>
        <span className="status-dot" data-online />
      </header>
      <main>
        <IncidentList
          incidents={incidents}
          selectedIncidentId={selectedIncidentId}
          onSelect={setSelectedIncidentId}
          loading={incidentsLoading}
          error={incidentError}
          segmentsById={segmentsById}
        />
        <IncidentDetail
          detail={incidentDetail}
          loading={detailLoading}
          resolving={resolving}
          onResolve={handleResolve}
        />
        <MetricsCharts readings={incidentDetail?.recent_readings ?? []} />
      </main>
    </div>
  );
}

export default App;

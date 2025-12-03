import React, { useEffect, useState } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polyline,
} from "react-leaflet";
import { Link } from "react-router-dom";
import L from "leaflet";
import { API_BASE_URL } from "../lib/api";
import "leaflet/dist/leaflet.css";
import "./MapView.css";

// Fix for default marker icons in react-leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

interface Incident {
  id: number;
  road_segment_id: number;
  status: string;
  severity: string;
  type: string;
  ai_summary: string | null;
  created_at: string;
}

interface RoadSegment {
  id: number;
  name: string;
  code: string;
  direction: string;
  latitude: number | null;
  longitude: number | null;
}

// Cincinnati area road segments - I-71, I-75, I-275
const segmentCoords: Record<
  string,
  { lat: number; lng: number; path: [number, number][] }
> = {
  // I-71 North - Downtown Cincinnati to Mason
  I71_N_SEG_A: {
    lat: 39.123,
    lng: -84.456,
    path: [
      [39.095, -84.512], // Downtown Cincinnati
      [39.123, -84.456], // Norwood area
      [39.155, -84.42], // Blue Ash
      [39.195, -84.385], // Mason
    ],
  },
  // I-75 North - Covington to Fairfield
  I75_N_SEG_A: {
    lat: 39.15,
    lng: -84.55,
    path: [
      [39.08, -84.51], // Covington KY
      [39.11, -84.52], // Downtown
      [39.15, -84.55], // Mill Creek
      [39.2, -84.56], // Fairfield
    ],
  },
  // I-275 East - Airport to Anderson
  I275_E_SEG_A: {
    lat: 39.06,
    lng: -84.42,
    path: [
      [39.05, -84.66], // Airport area
      [39.03, -84.55], // Kentucky side
      [39.06, -84.42], // Anderson Township
      [39.1, -84.32], // Eastgate
    ],
  },
  // I-74 West - Downtown to Harrison
  I74_W_SEG_A: {
    lat: 39.14,
    lng: -84.62,
    path: [
      [39.11, -84.52], // Downtown split
      [39.14, -84.62], // Cheviot
      [39.18, -84.72], // Harrison
    ],
  },
  // Default fallback for any segment
  DEFAULT: {
    lat: 39.1,
    lng: -84.51,
    path: [
      [39.08, -84.53],
      [39.1, -84.51],
      [39.12, -84.49],
    ],
  },
};

// Custom marker icons based on incident status
const createIcon = (color: string) => {
  return L.divIcon({
    className: "custom-marker",
    html: `<div class="marker-pin ${color}"><span class="marker-inner"></span></div>`,
    iconSize: [30, 42],
    iconAnchor: [15, 42],
    popupAnchor: [0, -42],
  });
};

const greenIcon = createIcon("green");
const yellowIcon = createIcon("yellow");
const redIcon = createIcon("red");

const MapView: React.FC = () => {
  const [segments, setSegments] = useState<RoadSegment[]>([]);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(
    null
  );
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const [segRes, incRes] = await Promise.all([
        fetch(`${API_BASE_URL}/api/segments`),
        fetch(`${API_BASE_URL}/api/incidents`),
      ]);
      const segData = await segRes.json();
      const incData = await incRes.json();
      setSegments(segData);
      setIncidents(incData);
    } catch (err) {
      console.error("Failed to fetch map data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, []);

  const getSegmentIncidents = (segmentId: number) => {
    return incidents.filter(
      (inc) => inc.road_segment_id === segmentId && inc.status === "OPEN"
    );
  };

  const getMarkerIcon = (segmentId: number) => {
    const segIncidents = getSegmentIncidents(segmentId);
    if (segIncidents.length === 0) return greenIcon;
    const hasHigh = segIncidents.some((i) => i.severity === "HIGH");
    if (hasHigh) return redIcon;
    return yellowIcon;
  };

  const getLineColor = (segmentId: number) => {
    const segIncidents = getSegmentIncidents(segmentId);
    if (segIncidents.length === 0) return "#22c55e";
    const hasHigh = segIncidents.some((i) => i.severity === "HIGH");
    if (hasHigh) return "#ef4444";
    return "#f59e0b";
  };

  // Center on Cincinnati area
  const center: [number, number] = [39.1, -84.51];

  return (
    <div className="map-view-page">
      <header className="map-header">
        <Link to="/" className="back-link">
          ← Home
        </Link>
        <h1>Live Map View</h1>
        <Link to="/demo" className="demo-link">
          Dashboard →
        </Link>
      </header>

      <div className="map-container-wrapper">
        {loading ? (
          <div className="map-loading">Loading map data...</div>
        ) : (
          <MapContainer center={center} zoom={10} className="leaflet-map">
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            {segments.map((segment) => {
              const coords = segmentCoords[segment.code];
              if (!coords) return null;

              return (
                <React.Fragment key={segment.id}>
                  {/* Road segment line */}
                  <Polyline
                    positions={coords.path}
                    color={getLineColor(segment.id)}
                    weight={6}
                    opacity={0.8}
                  />

                  {/* Segment marker */}
                  <Marker
                    position={[coords.lat, coords.lng]}
                    icon={getMarkerIcon(segment.id)}
                  >
                    <Popup>
                      <div className="popup-content">
                        <h3>{segment.name}</h3>
                        <p className="popup-direction">{segment.direction}</p>
                        {getSegmentIncidents(segment.id).length > 0 ? (
                          <>
                            <p className="popup-incident-count">
                              {getSegmentIncidents(segment.id).length} Active
                              Incident(s)
                            </p>
                            {getSegmentIncidents(segment.id).map((inc) => (
                              <div
                                key={inc.id}
                                className={`popup-incident ${inc.severity.toLowerCase()}`}
                                onClick={() => setSelectedIncident(inc)}
                              >
                                <span className="incident-type">
                                  {inc.type}
                                </span>
                                <span className="incident-severity">
                                  {inc.severity}
                                </span>
                              </div>
                            ))}
                          </>
                        ) : (
                          <p className="popup-clear">No active incidents</p>
                        )}
                      </div>
                    </Popup>
                  </Marker>
                </React.Fragment>
              );
            })}
          </MapContainer>
        )}
      </div>

      {/* Legend */}
      <div className="map-legend">
        <h4>Status Legend</h4>
        <div className="legend-item">
          <span className="legend-marker green"></span>
          <span>Clear - No incidents</span>
        </div>
        <div className="legend-item">
          <span className="legend-marker yellow"></span>
          <span>Warning - Medium severity</span>
        </div>
        <div className="legend-item">
          <span className="legend-marker red"></span>
          <span>Alert - High severity</span>
        </div>
      </div>

      {/* Incident Detail Modal */}
      {selectedIncident && (
        <div
          className="map-modal-overlay"
          onClick={() => setSelectedIncident(null)}
        >
          <div className="map-modal" onClick={(e) => e.stopPropagation()}>
            <button
              className="modal-close"
              onClick={() => setSelectedIncident(null)}
            >
              ×
            </button>
            <h2>Incident #{selectedIncident.id}</h2>
            <div className="modal-meta">
              <span
                className={`severity-badge ${selectedIncident.severity.toLowerCase()}`}
              >
                {selectedIncident.severity}
              </span>
              <span className="type-badge">{selectedIncident.type}</span>
            </div>
            {selectedIncident.ai_summary && (
              <div className="modal-section">
                <h4>AI Summary</h4>
                <p>{selectedIncident.ai_summary}</p>
              </div>
            )}
            <div className="modal-section">
              <h4>Detected At</h4>
              <p>{new Date(selectedIncident.created_at).toLocaleString()}</p>
            </div>
            <Link to="/demo" className="modal-action-btn">
              View in Dashboard →
            </Link>
          </div>
        </div>
      )}

      {/* Stats Bar */}
      <div className="map-stats-bar">
        <div className="stat">
          <span className="stat-value">{segments.length}</span>
          <span className="stat-label">Segments</span>
        </div>
        <div className="stat">
          <span className="stat-value">
            {incidents.filter((i) => i.status === "OPEN").length}
          </span>
          <span className="stat-label">Active Incidents</span>
        </div>
        <div className="stat">
          <span className="stat-value green">
            {
              segments.filter((s) => getSegmentIncidents(s.id).length === 0)
                .length
            }
          </span>
          <span className="stat-label">Clear Segments</span>
        </div>
      </div>
    </div>
  );
};

export default MapView;

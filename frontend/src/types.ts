export type IncidentStatus = "OPEN" | "RESOLVED";
export type IncidentSeverity = "LOW" | "MEDIUM" | "HIGH";
export type SensorType = "TRAFFIC_FLOW" | "SPEED" | "STOPPED_VEHICLE";

export interface RoadSegment {
  id: number;
  name: string;
  code: string;
  direction: string;
  latitude?: number | null;
  longitude?: number | null;
}

export interface Incident {
  id: number;
  road_segment_id: number;
  created_at: string;
  updated_at: string;
  status: IncidentStatus;
  severity: IncidentSeverity;
  type: string;
  rule_triggered: string;
  ai_summary?: string | null;
  ai_cause?: string | null;
  ai_recommendation?: string | null;
  resolution_note?: string | null;
}

export interface SensorReading {
  id: number;
  sensor_id: number;
  timestamp: string;
  data: Record<string, number | boolean>;
  sensor_type?: SensorType;
}

export interface IncidentDetailResponse {
  incident: Incident;
  segment: RoadSegment;
  recent_readings: SensorReading[];
}

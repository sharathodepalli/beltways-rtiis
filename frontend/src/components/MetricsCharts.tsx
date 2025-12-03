import React, { useMemo } from "react";
import {
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  CartesianGrid,
  Area,
  AreaChart,
} from "recharts";

import type { SensorReading } from "../types";

interface MetricsChartsProps {
  readings: SensorReading[];
}

const formatLabel = (timestamp: string): string =>
  new Date(timestamp).toLocaleTimeString([], {
    minute: "2-digit",
    second: "2-digit",
  });

const MetricsCharts: React.FC<MetricsChartsProps> = ({ readings }) => {
  const flowData = useMemo(
    () =>
      readings
        .filter((reading) => reading.sensor_type === "TRAFFIC_FLOW")
        .map((reading) => ({
          label: formatLabel(reading.timestamp),
          value: Number(reading.data.vehicles_per_minute ?? 0),
        })),
    [readings]
  );

  const speedData = useMemo(
    () =>
      readings
        .filter((reading) => reading.sensor_type === "SPEED")
        .map((reading) => ({
          label: formatLabel(reading.timestamp),
          value: Number(reading.data.avg_speed_kmh ?? 0),
        })),
    [readings]
  );

  if (!readings.length) {
    return (
      <div className="panel empty-state">
        <span>No metrics available</span>
        <small style={{ marginTop: "0.5rem", opacity: 0.7 }}>
          Waiting for readings…
        </small>
      </div>
    );
  }

  return (
    <div className="panel charts">
      <h2>Live Metrics</h2>
      <div className="chart">
        <h3>Traffic Flow (vehicles/min)</h3>
        <ResponsiveContainer width="100%" height={160}>
          <AreaChart
            data={flowData}
            margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
          >
            <defs>
              <linearGradient id="flowGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
            <XAxis
              dataKey="label"
              tick={{ fill: "#64748b", fontSize: 11 }}
              axisLine={{ stroke: "#1e293b" }}
              tickLine={{ stroke: "#1e293b" }}
            />
            <YAxis
              allowDecimals={false}
              tick={{ fill: "#64748b", fontSize: 11 }}
              axisLine={{ stroke: "#1e293b" }}
              tickLine={{ stroke: "#1e293b" }}
            />
            <Tooltip
              contentStyle={{
                background: "#111827",
                border: "1px solid #1e293b",
                borderRadius: "8px",
                color: "#f8fafc",
              }}
            />
            <Area
              type="monotone"
              dataKey="value"
              name="Flow"
              stroke="#3b82f6"
              strokeWidth={2}
              fill="url(#flowGradient)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <div className="chart">
        <h3>Average Speed (km/h)</h3>
        <ResponsiveContainer width="100%" height={160}>
          <AreaChart
            data={speedData}
            margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
          >
            <defs>
              <linearGradient id="speedGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#ef4444" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
            <XAxis
              dataKey="label"
              tick={{ fill: "#64748b", fontSize: 11 }}
              axisLine={{ stroke: "#1e293b" }}
              tickLine={{ stroke: "#1e293b" }}
            />
            <YAxis
              allowDecimals={false}
              tick={{ fill: "#64748b", fontSize: 11 }}
              axisLine={{ stroke: "#1e293b" }}
              tickLine={{ stroke: "#1e293b" }}
            />
            <Tooltip
              contentStyle={{
                background: "#111827",
                border: "1px solid #1e293b",
                borderRadius: "8px",
                color: "#f8fafc",
              }}
            />
            <Area
              type="monotone"
              dataKey="value"
              name="Speed"
              stroke="#ef4444"
              strokeWidth={2}
              fill="url(#speedGradient)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default MetricsCharts;

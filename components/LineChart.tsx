"use client";

import { useId } from "react";

export function LineChart({
  vals,
  color,
  height = 150,
  min,
  max,
}: {
  vals: number[];
  color: string;
  height?: number;
  min?: number;
  max?: number;
}) {
  const id = useId().replace(/[:]/g, "");
  const w = 600;
  const pad = 14;
  if (!vals.length) return <div style={{ height }} />;
  const lo = min ?? Math.min(...vals);
  const hi = max ?? Math.max(...vals);
  const rng = hi - lo || 1;
  const pts = vals.map((v, i) => {
    const x =
      pad + (vals.length === 1 ? 0.5 : i / (vals.length - 1)) * (w - 2 * pad);
    const y = height - pad - ((v - lo) / rng) * (height - 2 * pad - 10);
    return [x, y] as const;
  });
  const line = pts
    .map((p, i) => (i ? "L" : "M") + p[0].toFixed(1) + " " + p[1].toFixed(1))
    .join(" ");
  const area = `${line} L ${w - pad} ${height - pad} L ${pad} ${height - pad} Z`;
  return (
    <svg
      viewBox={`0 0 ${w} ${height}`}
      width="100%"
      height={height}
      preserveAspectRatio="none"
      style={{ display: "block" }}
    >
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={0.16} />
          <stop offset="100%" stopColor={color} stopOpacity={0} />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#${id})`} />
      <path
        d={line}
        fill="none"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

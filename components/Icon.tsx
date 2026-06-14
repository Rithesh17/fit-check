import * as React from "react";

export type IconName =
  | "home"
  | "dumbbell"
  | "clock"
  | "chart"
  | "body"
  | "grid"
  | "plus"
  | "run"
  | "racquet"
  | "info"
  | "edit"
  | "trash"
  | "play"
  | "flame"
  | "target";

const PATHS: Record<IconName, string[]> = {
  home: ["M3 10.5 12 3l9 7.5", "M5 9.5V20h5v-5h4v5h5V9.5"],
  dumbbell: ["M6.5 6.5v11", "M17.5 6.5v11", "M4 9v6", "M20 9v6", "M6.5 12h11"],
  clock: ["M12 7v5l3 2"],
  chart: ["M4 19V5", "M4 19h16", "M8 16v-4", "M12 16V9", "M16 16v-7"],
  body: [
    "M12 5.2a1.8 1.8 0 1 0 0-3.6 1.8 1.8 0 0 0 0 3.6Z",
    "M12 6v8m0 0-3 6m3-6 3 6M6 9l6 1 6-1",
  ],
  grid: ["M4 4h7v7H4z", "M13 4h7v7h-7z", "M4 13h7v7H4z", "M13 13h7v7h-7z"],
  plus: ["M12 6v12M6 12h12"],
  run: [
    "M13 5.2a1.6 1.6 0 1 0 0-3.2 1.6 1.6 0 0 0 0 3.2Z",
    "M7 21l3-5 1-4 3 2 1 4M11 12 9 9l4-2 2 3 3 1",
  ],
  racquet: [
    "M12 4a1.6 1.6 0 1 0 0-3.2A1.6 1.6 0 0 0 12 4Z",
    "M12 5v7m0 0-3 8m3-8 3 8M7 9h10",
  ],
  info: ["M12 11v5", "M12 8h.01"],
  edit: ["M12 20h9", "M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4Z"],
  trash: ["M4 7h16", "M9 7V5h6v2", "M6 7l1 13h10l1-13"],
  play: ["M8 5v14l11-7z"],
  flame: ["M12 3c2 3 4 4.5 4 8a4 4 0 0 1-8 0c0-1.5.5-2.5 1.5-3.5C9 9 12 7 12 3Z"],
  target: ["M12 8v4l2 2"],
};

const CIRCLED: Partial<Record<IconName, number>> = { clock: 9, info: 9, target: 9 };

export function Icon({
  name,
  color = "currentColor",
  size = 20,
  strokeWidth = 1.8,
}: {
  name: IconName;
  color?: string;
  size?: number;
  strokeWidth?: number;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
    >
      {CIRCLED[name] && (
        <circle
          cx={12}
          cy={12}
          r={CIRCLED[name]}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
        />
      )}
      {PATHS[name].map((d, i) => (
        <path
          key={i}
          d={d}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      ))}
    </svg>
  );
}

export function typeIcon(type: "gym" | "run" | "racquet"): IconName {
  return type === "gym" ? "dumbbell" : type === "run" ? "run" : "racquet";
}

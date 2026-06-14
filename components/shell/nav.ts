import type { IconName } from "@/components/Icon";

export interface NavItem {
  key: string;
  label: string;
  href: string;
  icon: IconName;
}

export const NAV: NavItem[] = [
  { key: "dashboard", label: "Dashboard", href: "/dashboard", icon: "home" },
  { key: "log", label: "Log Workout", href: "/log", icon: "dumbbell" },
  { key: "history", label: "History", href: "/history", icon: "clock" },
  { key: "exercises", label: "Exercises", href: "/exercises", icon: "grid" },
  { key: "routines", label: "Routines", href: "/routines", icon: "body" },
  { key: "progress", label: "Progress", href: "/progress", icon: "chart" },
];

// mobile bottom bar order (center = log FAB)
export const BOTTOM_ORDER = [
  "dashboard",
  "history",
  "log",
  "exercises",
  "progress",
] as const;

export const BOTTOM_LABELS: Record<string, string> = {
  dashboard: "Home",
  history: "History",
  log: "Log",
  exercises: "Exercises",
  progress: "Progress",
};

export function isActive(pathname: string, key: string): boolean {
  if (key === "history") return pathname.startsWith("/history");
  return pathname === "/" + key || pathname.startsWith("/" + key + "/");
}

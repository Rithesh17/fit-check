import type { Units } from "./types";

// Unit-aware formatters. Canonical storage is imperial (lb / mi / spm / in).
export function makeFmt(units: Units) {
  const imp = units === "imperial";

  const wt = (lb: number) => (imp ? Math.round(lb) : Math.round(lb * 0.453592));
  const wtU = () => (imp ? "lb" : "kg");

  // weight value for display with optional decimal (body weight)
  const wt1 = (lb: number) =>
    (imp ? lb : lb * 0.453592).toFixed(1);

  // volume: compact 'k' formatting over 1000
  const vol = (lb: number) => {
    const v = imp ? Math.round(lb) : Math.round(lb * 0.453592);
    return v >= 1000 ? (v / 1000).toFixed(1) + "k" : "" + v;
  };

  const dist = (mi: number) => (imp ? mi.toFixed(1) : (mi * 1.60934).toFixed(1));
  const distU = () => (imp ? "mi" : "km");

  const pace = (spm: number) => {
    const s = imp ? spm : Math.round(spm / 1.60934);
    const m = Math.floor(s / 60);
    const r = s % 60;
    return m + ":" + String(r).padStart(2, "0");
  };
  const paceU = () => "/" + distU();

  // measurements: inches -> cm
  const len = (inch: number) => (imp ? inch.toFixed(1) : (inch * 2.54).toFixed(1));
  const lenU = () => (imp ? "in" : "cm");

  return { imp, wt, wtU, wt1, vol, dist, distU, pace, paceU, len, lenU };
}

export type Fmt = ReturnType<typeof makeFmt>;

export function fmtDuration(sec: number) {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  if (h > 0) return `${h}h ${String(m).padStart(2, "0")}m`;
  return `${m}m ${String(s).padStart(2, "0")}s`;
}

export function fmtClock(sec: number) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

// "Today · 7:10 AM", "Yesterday · 6:40 PM", "Wed · 8:00 PM"
export function relDate(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  const startOf = (x: Date) =>
    new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
  const days = Math.round((startOf(now) - startOf(d)) / 86400000);
  const time = d.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
  let day: string;
  if (days === 0) day = "Today";
  else if (days === 1) day = "Yesterday";
  else if (days < 7)
    day = d.toLocaleDateString("en-US", { weekday: "short" });
  else day = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  return { day, time, label: `${day} · ${time}`, days };
}

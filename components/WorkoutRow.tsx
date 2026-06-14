"use client";

import Link from "next/link";
import { useUnits } from "@/lib/units";
import { Icon, typeIcon } from "@/components/Icon";
import { TYPE_META, type WorkoutType } from "@/lib/types";
import { relDate } from "@/lib/format";

export interface WorkoutRowData {
  id: string;
  type: WorkoutType;
  title: string;
  performed_at: string;
  duration_sec: number;
  volLb: number;
  sets: number;
  distMi: number | null;
  paceSpm: number | null;
  kcal: number | null;
  rallies: number | null;
  prs?: number;
}

export function WorkoutRow({
  w,
  variant = "card",
  last = false,
}: {
  w: WorkoutRowData;
  variant?: "card" | "plain";
  last?: boolean;
}) {
  const { fmt } = useUnits();
  const tm = TYPE_META[w.type];
  const { day } = relDate(w.performed_at);
  const dur = fmtDur(w.duration_sec);

  let metric = "";
  if (w.type === "gym")
    metric = `${fmt.vol(w.volLb)} ${fmt.wtU()} · ${w.sets} sets`;
  else if (w.type === "run")
    metric = `${fmt.dist(w.distMi || 0)} ${fmt.distU()} · ${fmt.pace(
      w.paceSpm || 0,
    )}${fmt.paceU()}`;
  else metric = `${w.kcal ?? 0} kcal · ${w.rallies ?? 0} rallies`;

  const inner = (
    <>
      <div
        className="flex shrink-0 items-center justify-center rounded-[13px]"
        style={{
          width: variant === "card" ? 46 : 42,
          height: variant === "card" ? 46 : 42,
          background: tm.soft,
        }}
      >
        <Icon name={typeIcon(w.type)} color={tm.color} size={variant === "card" ? 22 : 20} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="truncate text-[15px] font-semibold">{w.title}</span>
          {(w.prs ?? 0) > 0 && (
            <span
              className="mono shrink-0 rounded-[5px] px-[5px] py-[3px] text-[9px] font-bold"
              style={{ color: "#6FB52B", background: "#EEF7DD", letterSpacing: ".05em" }}
            >
              {w.prs} PR
            </span>
          )}
        </div>
        <div className="mt-[3px] truncate text-[12.5px] text-muted">{metric}</div>
      </div>
      <div className="shrink-0 text-right">
        <div
          suppressHydrationWarning
          className="text-[12px] font-semibold text-muted2"
        >
          {day}
        </div>
        <div className="mono mt-[3px] text-[11px] text-faint">{dur}</div>
      </div>
    </>
  );

  if (variant === "plain") {
    return (
      <Link
        href={`/history/${w.id}`}
        className="flex items-center gap-[13px] py-[13px] text-left"
        style={{ borderBottom: last ? "none" : "1px solid #F4F0E8" }}
      >
        {inner}
      </Link>
    );
  }

  return (
    <Link
      href={`/history/${w.id}`}
      className="flex items-center gap-[14px] rounded-card border border-line2 bg-card p-[15px] text-left shadow-card"
    >
      {inner}
    </Link>
  );
}

function fmtDur(sec: number) {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  if (h > 0) return `${h}h ${String(m).padStart(2, "0")}m`;
  return `${m}m`;
}

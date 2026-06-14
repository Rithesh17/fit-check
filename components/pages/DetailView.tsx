"use client";

import Link from "next/link";
import { useUnits } from "@/lib/units";
import { Card, Kicker } from "@/components/ui";
import { TYPE_META, type Workout } from "@/lib/types";
import { fmtDuration, relDate } from "@/lib/format";

export function DetailView({ workout: w }: { workout: Workout }) {
  const { fmt } = useUnits();
  const tm = TYPE_META[w.type];
  const { label: dateLabel } = relDate(w.performed_at);

  let volLb = 0;
  let setCount = 0;
  for (const we of w.workout_exercises || [])
    for (const s of we.sets || []) {
      setCount++;
      if (s.done) volLb += s.weight_lb * s.reps;
    }

  const stat = (v: string, u: string, l: string) => (
    <div className="flex-1">
      <div className="flex items-baseline gap-[3px]">
        <span className="display text-[26px] font-bold leading-none text-white">
          {v}
        </span>
        {u && (
          <span className="text-[12px]" style={{ color: "rgba(255,255,255,.5)" }}>
            {u}
          </span>
        )}
      </div>
      <div className="mt-1 text-[11.5px]" style={{ color: "rgba(255,255,255,.55)" }}>
        {l}
      </div>
    </div>
  );

  let stats;
  if (w.type === "gym")
    stats = [
      stat(fmt.vol(volLb), fmt.wtU(), "Volume"),
      stat(String(setCount), "", "Sets"),
      stat(fmtDuration(w.duration_sec).replace(/\s/g, ""), "", "Time"),
      stat(String((w.workout_exercises || []).length), "", "Lifts"),
    ];
  else if (w.type === "run")
    stats = [
      stat(fmt.dist(w.distance_mi || 0), fmt.distU(), "Distance"),
      stat(fmt.pace(w.pace_spm || 0), fmt.paceU(), "Avg pace"),
      stat(fmtDuration(w.duration_sec).replace(/\s/g, ""), "", "Time"),
      stat(String(w.kcal ?? 0), "", "kcal"),
    ];
  else
    stats = [
      stat(fmtDuration(w.duration_sec).replace(/\s/g, ""), "", "Duration"),
      stat(String(w.kcal ?? 0), "", "kcal"),
      stat(String(w.rallies ?? 0), "", "Rallies"),
      stat(String((w.score || []).length), "", "Games"),
    ];

  return (
    <div className="flex flex-col gap-[14px] animate-popIn">
      <Link
        href="/history"
        className="flex items-center gap-[7px] text-[13px] font-semibold text-muted2"
      >
        ← Back to history
      </Link>

      <div
        className="rounded-card p-[22px] text-white"
        style={{ background: "linear-gradient(135deg,#1A1712,#2A241B)" }}
      >
        <div
          className="mb-[14px] inline-flex items-center gap-[7px] rounded-full px-[11px] py-[5px]"
          style={{ background: tm.color }}
        >
          <span className="h-[7px] w-[7px] rounded-full bg-white" />
          <span
            className="mono text-[10px] font-bold text-white"
            style={{ letterSpacing: ".08em" }}
          >
            {tm.label.toUpperCase()}
          </span>
        </div>
        <div className="display text-[27px] font-bold">{w.title}</div>
        <div
          suppressHydrationWarning
          className="mt-[5px] text-[13px]"
          style={{ color: "rgba(255,255,255,.55)" }}
        >
          {dateLabel}
        </div>
        <div
          className="mt-5 flex gap-[10px] border-t pt-[18px]"
          style={{ borderColor: "rgba(255,255,255,.12)" }}
        >
          {stats}
        </div>
      </div>

      {w.notes && (
        <Card className="p-[16px] text-[13.5px] leading-relaxed text-ink2">
          {w.notes}
        </Card>
      )}

      {w.type === "gym" && <GymBody w={w} />}
      {w.type === "run" && <RunBody w={w} />}
      {w.type === "racquet" && <RacquetBody w={w} />}
    </div>
  );
}

function GymBody({ w }: { w: Workout }) {
  const { fmt } = useUnits();
  const exs = w.workout_exercises || [];
  return (
    <div className="flex flex-col gap-3">
      <Kicker className="mt-1">Exercises · {exs.length}</Kicker>
      {exs.map((e) => {
        const top = Math.max(1, ...e.sets.map((s) => s.weight_lb));
        return (
          <Card key={e.id} className="p-4">
            <div className="mb-2 flex items-center justify-between">
              <span className="truncate pr-2 text-[15px] font-bold">{e.name}</span>
              <span className="mono text-[11px] text-faint">
                {e.sets.length} sets
              </span>
            </div>
            {e.sets.map((s, j) => (
              <div key={s.id} className="flex items-center gap-[10px] py-[6px]">
                <div className="display w-6 text-[12px] font-bold text-faint">
                  {j + 1}
                </div>
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-sand">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${(s.weight_lb / top) * 100}%`,
                      background: "#FF5A3C",
                      opacity: 0.35 + 0.65 * (s.weight_lb / top),
                    }}
                  />
                </div>
                <div className="display w-[92px] text-right text-[13px] font-bold">
                  {fmt.wt(s.weight_lb)} {fmt.wtU()} × {s.reps}
                </div>
              </div>
            ))}
          </Card>
        );
      })}
    </div>
  );
}

function RunBody({ w }: { w: Workout }) {
  const { fmt } = useUnits();
  // synthesise mile splits around the average pace for a richer view
  const miles = Math.max(1, Math.round(w.distance_mi || 1));
  const base = w.pace_spm || 480;
  const splits = Array.from({ length: miles }, (_, i) =>
    Math.round(base + (i % 2 === 0 ? -8 : 6) + (i - miles / 2) * 2),
  );
  const slow = Math.max(...splits);
  const fast = Math.min(...splits);
  return (
    <div className="flex flex-col gap-3">
      <Card
        className="flex h-[150px] items-center justify-center overflow-hidden p-0"
        style={{
          background:
            "repeating-linear-gradient(135deg,#EAF0FB,#EAF0FB 11px,#F3F7FD 11px,#F3F7FD 22px)",
        }}
      >
        <span
          className="mono text-[11px]"
          style={{ color: "#9DB4DC", letterSpacing: ".1em" }}
        >
          [ GPS ROUTE MAP ]
        </span>
      </Card>
      <Card className="p-[18px]">
        <Kicker color="#2F6BFF" className="mb-2">
          {fmt.distU() === "mi" ? "Mile" : "Km"} Splits
        </Kicker>
        {splits.map((p, i) => (
          <div
            key={i}
            className="flex items-center gap-3 py-[9px]"
            style={{
              borderBottom: i < splits.length - 1 ? "1px solid #F4F0E8" : "none",
            }}
          >
            <div className="display w-[30px] text-[13px] font-bold text-muted">
              #{i + 1}
            </div>
            <div className="h-[10px] flex-1 overflow-hidden rounded-full bg-sand">
              <div
                className="h-full rounded-full"
                style={{
                  width: `${30 + (70 * (slow - p)) / (slow - fast || 1)}%`,
                  background: "#2F6BFF",
                }}
              />
            </div>
            <div className="display w-[70px] text-right text-[13px] font-bold">
              {fmt.pace(p)}
              {fmt.paceU()}
            </div>
          </div>
        ))}
      </Card>
    </div>
  );
}

function RacquetBody({ w }: { w: Workout }) {
  const games: number[][] = w.score || [];
  let wins = 0;
  for (const g of games) if ((g[0] ?? 0) > (g[1] ?? 0)) wins++;
  const won = wins > games.length - wins;
  return (
    <Card className="p-5">
      <Kicker color="#7A4DFF" className="mb-[14px]">
        Match Summary
      </Kicker>
      {games.map((g, i) => (
        <div
          key={i}
          className="flex items-center justify-between py-3"
          style={{
            borderBottom: i < games.length - 1 ? "1px solid #F4F0E8" : "none",
          }}
        >
          <span className="text-[14px] font-semibold text-muted2">
            Game {i + 1}
          </span>
          <div className="flex items-baseline gap-2">
            <span
              className="display text-[22px] font-bold"
              style={{ color: g[0] > g[1] ? "#7A4DFF" : "#C3BBAC" }}
            >
              {g[0]}
            </span>
            <span className="text-faint">–</span>
            <span
              className="display text-[22px] font-bold"
              style={{ color: g[1] > g[0] ? "#7A4DFF" : "#C3BBAC" }}
            >
              {g[1]}
            </span>
          </div>
        </div>
      ))}
      {games.length > 0 && (
        <div
          className="mt-[14px] rounded-[14px] p-[14px] text-center text-[14px] font-bold"
          style={{ background: "#EFE9FF", color: "#5B3FB8" }}
        >
          {won ? "Won" : "Lost"} {wins} – {games.length - wins}
        </div>
      )}
    </Card>
  );
}

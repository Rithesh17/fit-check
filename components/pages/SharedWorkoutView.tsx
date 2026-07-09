import Link from "next/link";
import { Logo } from "@/components/Logo";
import { makeFmt, fmtDuration, relDate } from "@/lib/format";
import { TYPE_META, type Workout } from "@/lib/types";

// Clean, read-only public view of a single workout (no app nav, no controls).
// Rendered server-side; formats in the app's canonical imperial units.
export function SharedWorkoutView({ workout: w }: { workout: Workout }) {
  const fmt = makeFmt("imperial");
  const tm = TYPE_META[w.type];
  const { label: dateLabel } = relDate(w.performed_at);
  const exs = w.workout_exercises || [];

  let vol = 0;
  let setCount = 0;
  for (const we of exs)
    for (const s of we.sets || []) {
      setCount++;
      vol += s.weight_lb * s.reps;
    }

  const stat = (v: string, u: string, l: string) => (
    <div className="flex-1">
      <div className="flex items-baseline gap-[3px]">
        <span className="display text-[24px] font-bold leading-none text-white">
          {v}
        </span>
        {u && (
          <span className="text-[12px]" style={{ color: "rgba(255,255,255,.5)" }}>
            {u}
          </span>
        )}
      </div>
      <div className="mt-1 text-[11px]" style={{ color: "rgba(255,255,255,.55)" }}>
        {l}
      </div>
    </div>
  );

  const stats =
    w.type === "gym"
      ? [
          stat(fmt.vol(vol), fmt.wtU(), "Volume"),
          stat(String(setCount), "", "Sets"),
          stat(fmtDuration(w.duration_sec).replace(/\s/g, ""), "", "Time"),
          stat(String(exs.length), "", "Lifts"),
        ]
      : w.type === "run"
        ? [
            stat(fmt.dist(w.distance_mi || 0), fmt.distU(), "Distance"),
            stat(fmt.pace(w.pace_spm || 0), fmt.paceU(), "Pace"),
            stat(fmtDuration(w.duration_sec).replace(/\s/g, ""), "", "Time"),
            stat(String(w.kcal ?? 0), "", "kcal"),
          ]
        : [
            stat(fmtDuration(w.duration_sec).replace(/\s/g, ""), "", "Duration"),
            stat(String(w.kcal ?? 0), "", "kcal"),
            stat(String(w.rallies ?? 0), "", "Rallies"),
            stat(String((w.score || []).length), "", "Games"),
          ];

  return (
    <div className="min-h-[100dvh] bg-sand px-5 py-9">
      <div className="mx-auto w-full max-w-[520px]">
        <div className="mb-6 flex items-center justify-center gap-2">
          <Logo size={28} />
          <span className="display text-[18px] font-bold">Pulse</span>
        </div>

        <div
          className="rounded-card p-[22px] text-white shadow-card"
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
          <div className="display text-[27px] font-bold leading-tight">
            {w.title}
          </div>
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
          <div className="mt-[14px] rounded-card border border-line2 bg-card p-4 text-[13.5px] leading-relaxed text-ink2 shadow-card">
            {w.notes}
          </div>
        )}

        {w.type === "gym" && exs.length > 0 && (
          <div className="mt-[14px] flex flex-col gap-3">
            {exs.map((e) => {
              return (
                <div
                  key={e.id}
                  className="rounded-card border border-line2 bg-card p-4 shadow-card"
                >
                  <div className="mb-2 flex items-center justify-between">
                    <span className="truncate pr-2 text-[15px] font-bold">
                      {e.name}
                    </span>
                    <span className="mono text-[11px] text-faint">
                      {e.sets.length} sets
                    </span>
                  </div>
                  {e.sets.map((s, j) => (
                    <div
                      key={s.id}
                      className="flex items-center justify-between py-[7px]"
                    >
                      <div className="display text-[12px] font-bold text-faint">
                        {j + 1}
                      </div>
                      <div className="display text-[13px] font-bold">
                        {fmt.wt(s.weight_lb)} {fmt.wtU()} × {s.reps}
                      </div>
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        )}

        <div className="mt-8 flex flex-col items-center gap-1 text-center">
          <span className="text-[12.5px] text-muted2">Logged with Pulse</span>
          <Link href="/" className="text-[13px] font-semibold text-pulse">
            Track your own workouts →
          </Link>
        </div>
      </div>
    </div>
  );
}

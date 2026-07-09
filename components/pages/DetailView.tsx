"use client";

import Link from "next/link";
import { useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { useUnits } from "@/lib/units";
import { createClient } from "@/lib/supabase/client";
import { Card, Kicker } from "@/components/ui";
import { Icon } from "@/components/Icon";
import { TYPE_META, type Workout } from "@/lib/types";
import { fmtDuration, relDate } from "@/lib/format";

export function DetailView({ workout: w }: { workout: Workout }) {
  const { fmt } = useUnits();
  const router = useRouter();
  const [confirmDel, setConfirmDel] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  async function del() {
    setDeleting(true);
    const supabase = createClient();
    await supabase.from("workouts").delete().eq("id", w.id);
    router.push("/history");
    router.refresh();
  }

  async function copy(url: string) {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  }

  async function share() {
    setSharing(true);
    const supabase = createClient();
    let sid = w.share_id ?? null;
    if (!sid) {
      sid =
        globalThis.crypto?.randomUUID?.() ??
        `${Date.now()}-${Math.random().toString(16).slice(2)}`;
      const { error } = await supabase
        .from("workouts")
        .update({ share_id: sid })
        .eq("id", w.id);
      if (error) {
        setSharing(false);
        return;
      }
      w.share_id = sid;
    }
    const url = `${window.location.origin}/share/${sid}`;
    setShareUrl(url);
    copy(url);
    setSharing(false);
  }
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
      <div className="flex items-center justify-between">
        <Link
          href="/history"
          className="flex items-center gap-[7px] text-[13px] font-semibold text-muted2"
        >
          ← Back to history
        </Link>
        <div className="flex items-center gap-2">
          <button
            onClick={share}
            disabled={sharing}
            className="flex items-center gap-[6px] rounded-[10px] border border-line bg-paper px-3 py-2 text-[12.5px] font-semibold text-muted2"
            aria-label="Share workout"
          >
            <svg
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="18" cy="5" r="3" />
              <circle cx="6" cy="12" r="3" />
              <circle cx="18" cy="19" r="3" />
              <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
              <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
            </svg>
            {sharing ? "…" : "Share"}
          </button>
          <Link
            href={`/log/edit/${w.id}`}
            className="flex items-center gap-[6px] rounded-[10px] border border-line bg-paper px-3 py-2 text-[12.5px] font-semibold text-muted2"
          >
            <Icon name="edit" size={15} color="currentColor" />
            Edit
          </Link>
          {confirmDel ? (
            <button
              onClick={del}
              disabled={deleting}
              className="rounded-[10px] bg-pulse px-3 py-2 text-[12.5px] font-bold text-white"
            >
              {deleting ? "…" : "Confirm delete"}
            </button>
          ) : (
            <button
              onClick={() => setConfirmDel(true)}
              className="flex items-center justify-center rounded-[10px] border border-line bg-paper px-3 py-2 text-muted2"
              aria-label="Delete workout"
            >
              <Icon name="trash" size={15} color="currentColor" />
            </button>
          )}
        </div>
      </div>

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

      {shareUrl && createPortal(
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/30 sm:items-center"
          onClick={() => setShareUrl(null)}
        >
          <div
            className="w-full max-w-[440px] rounded-t-[24px] bg-sand p-5 shadow-card sm:rounded-[24px]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-2 flex items-center justify-between">
              <div className="display text-[18px] font-bold">
                Share this workout
              </div>
              <button
                onClick={() => setShareUrl(null)}
                className="text-[22px] leading-none text-muted"
              >
                ×
              </button>
            </div>
            <p className="mb-3 text-[13px] text-muted2">
              Anyone with this link can view a clean, read-only copy — no account
              needed.
            </p>
            <div className="rounded-[12px] border border-line bg-card px-3 py-3">
              <div className="scrollx overflow-x-auto whitespace-nowrap text-[13px] text-ink">
                {shareUrl}
              </div>
            </div>
            <div className="mt-3 flex gap-2">
              <button
                onClick={() => copy(shareUrl)}
                className="flex-1 rounded-[12px] bg-ink py-[13px] text-[14px] font-bold text-white"
              >
                {copied ? "Copied!" : "Copy link"}
              </button>
              <a
                href={shareUrl}
                target="_blank"
                rel="noreferrer"
                className="flex-1 rounded-[12px] border border-line bg-paper py-[13px] text-center text-[14px] font-bold text-ink"
              >
                Open
              </a>
            </div>
          </div>
        </div>,
        document.body,
      )}
    </div>
  );
}

function GymBody({ w }: { w: Workout }) {
  const { fmt } = useUnits();
  const exs = w.workout_exercises || [];
  return (
    <div className="flex flex-col gap-3">
      <Kicker className="mt-1">Exercises · {exs.length}</Kicker>
      {exs.map((e) => (
        <Card key={e.id} className="p-[15px]">
          <div className="mb-[10px] flex items-center justify-between gap-2">
            <span className="truncate text-[15px] font-bold">{e.name}</span>
            <span className="mono shrink-0 text-[11px] text-faint">
              {e.sets.length} sets
            </span>
          </div>
          <div className="flex flex-wrap gap-[7px]">
            {e.sets.map((s) => (
              <span
                key={s.id}
                className="display flex items-baseline gap-[3px] rounded-[10px] bg-sand px-[11px] py-[6px] text-[13px] font-bold text-ink"
              >
                {fmt.wt(s.weight_lb)}
                <span className="text-[10.5px] font-semibold text-muted2">
                  {fmt.wtU()}
                </span>
                <span className="px-[1px] text-[11px] font-normal text-faint">
                  ×
                </span>
                {s.reps}
              </span>
            ))}
          </div>
        </Card>
      ))}
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

"use client";

import { useState } from "react";
import {
  bodyParts,
  lerp,
  MUSCLE_NAME,
  muscleRole,
  type Side,
} from "@/lib/muscles";

type LoadMap = Record<string, number>;
export type WindowKey = "daily" | "3day" | "weekly";

export function BodyMap({
  loads,
}: {
  loads: Record<WindowKey, LoadMap>;
}) {
  const [view, setView] = useState<WindowKey>("weekly");
  const [side, setSide] = useState<Side>("front");
  const [hover, setHover] = useState<string | null>(null);

  const data = loads[view] || {};
  const base = "#E7E0D4";

  const parts = bodyParts(side);
  const mk = (p: { k: string; d: string }, mirror: boolean, idx: number) => {
    const v = data[p.k] || 0;
    const isH = hover === p.k;
    return (
      <path
        key={(mirror ? "r" : "l") + idx}
        d={p.d}
        fill={v > 0 ? lerp(v) : base}
        stroke={isH ? "#1A1712" : "#FAF7F2"}
        strokeWidth={isH ? 2.2 : 1.3}
        style={{ cursor: "pointer", transition: "fill .3s, stroke .15s" }}
        onMouseEnter={() => setHover(p.k)}
        onMouseLeave={() => setHover(null)}
        onClick={() => setHover(isH ? null : p.k)}
      />
    );
  };

  const sil = (k: string, cx: number, cy: number, rx: number, ry: number) => (
    <ellipse key={k} cx={cx} cy={cy} rx={rx} ry={ry} fill={base} />
  );

  const hoverV = hover ? data[hover] || 0 : 0;

  const top = Object.entries(data)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4)
    .map(([k, v]) => ({ name: MUSCLE_NAME[k] || k, pct: Math.round(v * 100) }));

  const viewChip = (label: string, key: WindowKey) => (
    <button
      key={key}
      onClick={() => setView(key)}
      className="rounded-full px-[11px] py-[6px] text-[11px] font-semibold"
      style={{
        background: view === key ? "#1A1712" : "#F1ECE3",
        color: view === key ? "#fff" : "#7E776A",
      }}
    >
      {label}
    </button>
  );
  const sideChip = (label: string, key: Side) => (
    <button
      key={key}
      onClick={() => setSide(key)}
      className="flex-1 rounded-[9px] py-[7px] text-[11.5px] font-semibold"
      style={{
        background: side === key ? "#fff" : "transparent",
        color: side === key ? "#1A1712" : "#A39B8B",
        boxShadow: side === key ? "0 1px 3px rgba(0,0,0,.08)" : "none",
      }}
    >
      {label}
    </button>
  );

  return (
    <div className="p-[18px]">
      <div className="mb-2 flex items-start justify-between gap-3">
        <div>
          <div className="kicker" style={{ color: "#C7917F" }}>
            Muscle Focus
          </div>
          <div className="display mt-[7px] text-[19px] font-bold">
            Recovery &amp; Load
          </div>
        </div>
        <div className="flex gap-[5px]">
          {viewChip("Today", "daily")}
          {viewChip("3-Day", "3day")}
          {viewChip("Week", "weekly")}
        </div>
      </div>

      <div className="mt-[6px] grid items-center gap-[18px] sm:grid-cols-[auto_1fr]">
        <div className="flex flex-col items-center gap-[10px]">
          <div style={{ width: 160 }}>
            <svg
              viewBox="0 0 240 575"
              width="100%"
              height="100%"
              style={{ display: "block", maxHeight: 350 }}
            >
              <g opacity={0.85}>
                {sil("head", 120, 44, 23, 27)}
                <path d="M108,62 L132,62 L130,86 Q120,93 110,86 Z" fill={base} />
                <path
                  d="M64,104 C64,96 74,90 90,90 L150,90 C166,90 176,96 176,104 L166,252 C163,272 156,286 144,290 L96,290 C84,286 77,272 74,252 Z"
                  fill={base}
                />
                {sil("uarmL", 55, 170, 15, 48)}
                {sil("farmL", 45, 252, 11, 44)}
                {sil("handL", 41, 304, 10, 13)}
                {sil("uarmR", 185, 170, 15, 48)}
                {sil("farmR", 195, 252, 11, 44)}
                {sil("handR", 199, 304, 10, 13)}
                <path
                  d="M84,278 L156,278 Q162,304 150,326 L90,326 Q78,304 84,278 Z"
                  fill={base}
                />
                {sil("thighL", 99, 374, 23, 62)}
                {sil("thighR", 141, 374, 23, 62)}
                {sil("shinL", 103, 488, 14, 52)}
                {sil("shinR", 137, 488, 14, 52)}
                {sil("footL", 100, 550, 12, 12)}
                {sil("footR", 140, 550, 12, 12)}
              </g>
              <g>{parts.map((p, i) => mk(p, false, i))}</g>
              <g transform="translate(240,0) scale(-1,1)">
                {parts.map((p, i) => mk(p, true, i))}
              </g>
              {side === "front" && (
                <g
                  stroke="#FAF7F2"
                  strokeWidth={1.3}
                  fill="none"
                  opacity={0.65}
                  strokeLinecap="round"
                >
                  <path d="M120,168 V250" />
                  <path d="M104,184 H136" />
                  <path d="M102,206 H138" />
                  <path d="M104,228 H136" />
                </g>
              )}
            </svg>
          </div>
          <div
            className="flex w-[150px] rounded-[11px] p-[3px]"
            style={{ background: "#F1ECE3" }}
          >
            {sideChip("Front", "front")}
            {sideChip("Back", "back")}
          </div>
          <div
            className="flex min-h-[50px] w-[150px] flex-col justify-center rounded-[12px] px-3 py-[9px] text-center transition-all"
            style={{
              background: hover ? "#FFF4F0" : "#F7F3EC",
              border: "1px solid " + (hover ? "#FBD9CE" : "#EEE8DC"),
            }}
          >
            {hover ? (
              <>
                <div className="text-[12.5px] font-bold text-ink">
                  {MUSCLE_NAME[hover] || hover}
                </div>
                <div
                  className="mono mt-[5px] text-[9.5px] font-semibold"
                  style={{ color: "#FF5A3C", letterSpacing: ".04em" }}
                >
                  {muscleRole(hoverV).toUpperCase()} · {Math.round(hoverV * 100)}%
                </div>
              </>
            ) : (
              <div className="text-[11px] leading-[1.35] text-muted">
                Tap a muscle to see how it&rsquo;s worked
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-[13px]">
          {top.length === 0 && (
            <div className="text-[12.5px] text-muted">
              No training logged in this window yet.
            </div>
          )}
          {top.map((m, i) => (
            <div key={i} className="flex items-center gap-[10px]">
              <div className="w-[78px] text-[12.5px] font-semibold text-ink2">
                {m.name}
              </div>
              <div className="h-[7px] flex-1 overflow-hidden rounded-full bg-sand">
                <div
                  className="h-full rounded-full"
                  style={{ width: m.pct + "%", background: lerp(m.pct / 100) }}
                />
              </div>
              <div className="mono w-[34px] text-right text-[11px] font-semibold text-muted">
                {m.pct}%
              </div>
            </div>
          ))}
          <div className="mt-1 flex items-center gap-2 border-t border-sand pt-3">
            <span className="mono text-[10.5px] font-medium text-faint">LOW</span>
            <div
              className="h-[6px] flex-1 rounded-full"
              style={{ background: "linear-gradient(90deg,#EBE5DA,#FF5A3C)" }}
            />
            <span className="mono text-[10.5px] font-medium text-faint">
              HIGH
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

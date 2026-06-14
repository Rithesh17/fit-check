"use client";

import { useState } from "react";
import { useUnits } from "@/lib/units";
import { Modal } from "@/components/exercise/ExerciseForm";
import { e1rm } from "@/lib/exercise";

const PLATES_LB = [45, 35, 25, 10, 5, 2.5];
const PLATES_KG = [25, 20, 15, 10, 5, 2.5, 1.25];

// Plate calculator — what to load per side for a target weight.
export function PlateCalc({
  weightLb,
  onClose,
}: {
  weightLb: number;
  onClose: () => void;
}) {
  const { imperial, fmt } = useUnits();
  const bar = imperial ? 45 : 20;
  const target = imperial ? Math.round(weightLb) : Math.round(weightLb * 0.453592);
  const [val, setVal] = useState(String(target));
  const plates = imperial ? PLATES_LB : PLATES_KG;
  const unit = fmt.wtU();

  const t = parseFloat(val) || 0;
  let perSide = Math.max(0, (t - bar) / 2);
  const loaded: number[] = [];
  for (const p of plates) {
    while (perSide >= p - 1e-9) {
      loaded.push(p);
      perSide = Math.round((perSide - p) * 100) / 100;
    }
  }
  const leftover = perSide;

  return (
    <Modal title="Plate calculator" onClose={onClose}>
      <div className="flex flex-col gap-4">
        <label className="block">
          <span className="kicker mb-2 block">Target weight ({unit})</span>
          <input
            type="number"
            value={val}
            onChange={(e) => setVal(e.target.value)}
            className="w-full rounded-[12px] border border-line bg-paper px-[14px] py-[12px] text-[16px] font-semibold outline-none focus:border-pulse"
          />
        </label>
        <div className="text-[12.5px] text-muted">
          {bar} {unit} bar · {loaded.length} plates per side
        </div>
        {loaded.length === 0 ? (
          <div className="rounded-[12px] bg-paper p-4 text-center text-[13px] text-muted">
            Just the bar.
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {loaded.map((p, i) => (
              <span
                key={i}
                className="display rounded-[10px] bg-ink px-3 py-2 text-[14px] font-bold text-white"
              >
                {p}
              </span>
            ))}
          </div>
        )}
        {leftover > 0.01 && (
          <div className="text-[12px] text-pulse">
            {leftover.toFixed(2)} {unit}/side can&rsquo;t be made with standard
            plates.
          </div>
        )}
      </div>
    </Modal>
  );
}

// Estimated 1-rep-max (Epley).
export function OneRepMax({ onClose }: { onClose: () => void }) {
  const { fmt, imperial } = useUnits();
  const [w, setW] = useState("");
  const [r, setR] = useState("5");
  const wLb = w ? (imperial ? +w : +w / 0.453592) : 0;
  const est = wLb ? e1rm(wLb, parseInt(r) || 1) : 0;
  return (
    <Modal title="1RM calculator" onClose={onClose}>
      <div className="flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-3">
          <label className="block">
            <span className="kicker mb-2 block">Weight ({fmt.wtU()})</span>
            <input
              type="number"
              value={w}
              onChange={(e) => setW(e.target.value)}
              placeholder="185"
              className="w-full rounded-[12px] border border-line bg-paper px-[14px] py-[12px] text-[16px] font-semibold outline-none focus:border-pulse"
            />
          </label>
          <label className="block">
            <span className="kicker mb-2 block">Reps</span>
            <input
              type="number"
              value={r}
              onChange={(e) => setR(e.target.value)}
              className="w-full rounded-[12px] border border-line bg-paper px-[14px] py-[12px] text-[16px] font-semibold outline-none focus:border-pulse"
            />
          </label>
        </div>
        <div className="rounded-[14px] bg-paper p-4 text-center">
          <div className="kicker">Estimated 1RM</div>
          <div className="display mt-2 text-[34px] font-bold">
            {est ? fmt.wt(est) : "—"}{" "}
            <span className="text-[15px] text-muted">{est ? fmt.wtU() : ""}</span>
          </div>
        </div>
      </div>
    </Modal>
  );
}

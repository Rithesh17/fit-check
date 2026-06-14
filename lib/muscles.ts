// Muscle model + anatomy paths adapted from the Pulse design (GymVis / Symmetric
// Strength style taxonomy). Body-map load is computed from the user's recent
// training instead of being hard-coded.

export type Side = "front" | "back";

export const MUSCLE_NAME: Record<string, string> = {
  traps: "Trapezius",
  frontdelts: "Anterior Deltoid",
  reardelts: "Posterior Deltoid",
  chest: "Pectoralis Major",
  biceps: "Biceps Brachii",
  triceps: "Triceps Brachii",
  forearms: "Forearms",
  abs: "Rectus Abdominis",
  obliques: "Obliques",
  serratus: "Serratus Anterior",
  lats: "Latissimus Dorsi",
  lowerback: "Erector Spinae",
  quads: "Quadriceps",
  adductors: "Adductors",
  glutes: "Gluteus Maximus",
  hamstrings: "Hamstrings",
  calves: "Gastrocnemius",
  shins: "Tibialis Anterior",
};

export function muscleRole(v: number) {
  return v >= 0.7
    ? "Primary mover"
    : v >= 0.4
      ? "Synergist"
      : v > 0
        ? "Stabilizer"
        : "Not worked";
}

// sand -> coral interpolation matching the design
export function lerp(t: number) {
  t = Math.max(0, Math.min(1, t));
  const a = [235, 229, 218];
  const b = [255, 90, 60];
  const c = a.map((x, i) => Math.round(x + (b[i] - x) * t));
  return `rgb(${c[0]},${c[1]},${c[2]})`;
}

export interface PartPath {
  k: string;
  d: string;
}

export function bodyParts(side: Side): PartPath[] {
  if (side === "front")
    return [
      { k: "traps", d: "M120,70 L120,86 Q106,88 94,102 Q98,88 108,78 Q114,72 120,70 Z" },
      { k: "frontdelts", d: "M94,102 Q74,102 66,122 Q62,139 74,145 Q89,133 96,114 Q99,106 94,102 Z" },
      { k: "chest", d: "M118,110 Q96,105 80,120 Q71,133 80,147 Q98,157 114,149 Q120,139 119,118 Q119,112 118,110 Z" },
      { k: "serratus", d: "M99,150 Q90,152 86,164 Q93,160 100,158 Q101,153 99,150 Z" },
      { k: "biceps", d: "M74,148 Q62,158 60,187 Q59,205 70,211 Q78,201 80,176 Q82,156 74,148 Z" },
      { k: "forearms", d: "M66,213 Q54,227 50,257 Q48,279 57,287 Q67,277 68,247 Q70,225 66,213 Z" },
      { k: "abs", d: "M118,154 L100,156 Q96,186 98,218 Q102,246 118,253 Z" },
      { k: "obliques", d: "M98,160 Q88,168 86,194 Q86,218 96,238 Q94,210 100,182 Q102,166 98,160 Z" },
      { k: "quads", d: "M116,298 Q94,302 84,340 Q80,388 92,440 Q104,454 112,444 Q118,394 119,340 Q119,314 116,298 Z" },
      { k: "adductors", d: "M118,302 Q108,332 106,384 Q110,402 118,402 Z" },
      { k: "shins", d: "M114,448 Q102,458 100,496 Q100,524 110,530 Q116,502 117,472 Q117,454 114,448 Z" },
    ];
  return [
    { k: "traps", d: "M120,68 L120,172 Q102,170 90,128 Q96,98 108,80 Q114,72 120,68 Z" },
    { k: "reardelts", d: "M90,108 Q70,106 62,127 Q58,143 70,149 Q86,137 92,118 Q94,110 90,108 Z" },
    { k: "triceps", d: "M72,150 Q60,160 58,190 Q57,208 68,214 Q76,204 78,178 Q80,158 72,150 Z" },
    { k: "lats", d: "M118,150 Q94,152 84,180 Q78,212 96,252 Q110,260 118,250 Z" },
    { k: "lowerback", d: "M118,252 Q104,252 98,270 Q104,286 118,288 Z" },
    { k: "forearms", d: "M66,216 Q54,230 50,260 Q48,282 57,290 Q67,280 68,250 Q70,228 66,216 Z" },
    { k: "glutes", d: "M118,290 Q94,290 84,316 Q82,340 98,352 Q114,348 118,324 Z" },
    { k: "hamstrings", d: "M116,354 Q94,358 88,396 Q86,436 98,454 Q108,460 114,450 Q118,402 118,374 Z" },
    { k: "calves", d: "M114,454 Q100,466 100,502 Q102,530 112,534 Q118,510 117,478 Q117,460 114,454 Z" },
  ];
}

// Aggregate a 0..1 load value per muscle from recent training.
// Each completed set contributes its exercise intensity; values are normalised.
export interface LoadInput {
  performedAt: string;
  muscle: string | null;
  intensity: number;
  setCount: number;
}

export function computeLoad(
  rows: LoadInput[],
  windowDays: number,
): Record<string, number> {
  const cutoff = Date.now() - windowDays * 86400000;
  const acc: Record<string, number> = {};
  for (const r of rows) {
    if (!r.muscle) continue;
    if (new Date(r.performedAt).getTime() < cutoff) continue;
    acc[r.muscle] = (acc[r.muscle] || 0) + r.intensity * Math.max(1, r.setCount);
  }
  const max = Math.max(1, ...Object.values(acc));
  const out: Record<string, number> = {};
  for (const k of Object.keys(acc)) {
    // soft normalise so a worked muscle never looks empty
    out[k] = Math.min(1, 0.25 + 0.75 * (acc[k] / max));
  }
  return out;
}

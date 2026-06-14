import type { Exercise, UserExercisePrefs } from "./types";

export interface EffectiveDefaults {
  sets: number | null;
  reps: number | null;
  weight_lb: number | null;
  duration_sec: number | null;
  video_url: string | null;
  cues: string | null;
}

// Prefs (per-user overlay) take precedence over the exercise's own defaults.
export function effectiveDefaults(
  ex: Pick<
    Exercise,
    | "default_sets"
    | "default_reps"
    | "default_weight_lb"
    | "default_duration_sec"
    | "video_url"
    | "cues"
  >,
  prefs?: Partial<UserExercisePrefs> | null,
): EffectiveDefaults {
  const pick = <T>(p: T | null | undefined, e: T | null | undefined): T | null =>
    p != null ? p : e != null ? e : null;
  return {
    sets: pick(prefs?.default_sets, ex.default_sets),
    reps: pick(prefs?.default_reps, ex.default_reps),
    weight_lb: pick(prefs?.default_weight_lb, ex.default_weight_lb),
    duration_sec: pick(prefs?.default_duration_sec, ex.default_duration_sec),
    video_url: pick(prefs?.video_url, ex.video_url),
    cues: pick(prefs?.cues, ex.cues),
  };
}

// Epley estimated 1RM
export function e1rm(weight: number, reps: number): number {
  if (reps <= 1) return Math.round(weight);
  return Math.round(weight * (1 + reps / 30));
}

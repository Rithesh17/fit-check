import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  Workout,
  Exercise,
  BodyMetric,
  BodyMeasurement,
  WorkoutTemplate,
} from "./types";

type DB = SupabaseClient;

export async function getWorkouts(
  supabase: DB,
  opts: { limit?: number } = {},
): Promise<Workout[]> {
  let q = supabase
    .from("workouts")
    .select(
      "*, workout_exercises(*, sets(*))",
    )
    .order("performed_at", { ascending: false });
  if (opts.limit) q = q.limit(opts.limit);
  const { data, error } = await q;
  if (error || !data) return [];
  // normalise nested ordering
  return (data as Workout[]).map((w) => ({
    ...w,
    workout_exercises: (w.workout_exercises || [])
      .slice()
      .sort((a, b) => a.position - b.position)
      .map((we) => ({
        ...we,
        sets: (we.sets || []).slice().sort((a, b) => a.position - b.position),
      })),
  }));
}

export async function getWorkout(
  supabase: DB,
  id: string,
): Promise<Workout | null> {
  const { data, error } = await supabase
    .from("workouts")
    .select("*, workout_exercises(*, sets(*))")
    .eq("id", id)
    .maybeSingle();
  if (error || !data) return null;
  const w = data as Workout;
  w.workout_exercises = (w.workout_exercises || [])
    .slice()
    .sort((a, b) => a.position - b.position)
    .map((we) => ({
      ...we,
      sets: (we.sets || []).slice().sort((a, b) => a.position - b.position),
    }));
  return w;
}

export async function getExercises(supabase: DB): Promise<Exercise[]> {
  const { data } = await supabase
    .from("exercises")
    .select("*")
    .order("name", { ascending: true });
  return (data as Exercise[]) || [];
}

export async function getBodyMetrics(supabase: DB): Promise<BodyMetric[]> {
  const { data } = await supabase
    .from("body_metrics")
    .select("*")
    .order("measured_on", { ascending: true });
  return (data as BodyMetric[]) || [];
}

export async function getMeasurements(
  supabase: DB,
): Promise<BodyMeasurement[]> {
  const { data } = await supabase
    .from("body_measurements")
    .select("*")
    .order("measured_on", { ascending: false });
  return (data as BodyMeasurement[]) || [];
}

export async function getTemplates(supabase: DB): Promise<WorkoutTemplate[]> {
  const { data } = await supabase
    .from("workout_templates")
    .select("*, template_exercises(*)")
    .order("position", { ascending: true });
  return ((data as WorkoutTemplate[]) || []).map((t) => ({
    ...t,
    template_exercises: (t.template_exercises || []).slice().sort(
      (a, b) => a.position - b.position,
    ),
  }));
}

export async function getTemplate(
  supabase: DB,
  id: string,
): Promise<WorkoutTemplate | null> {
  const { data } = await supabase
    .from("workout_templates")
    .select("*, template_exercises(*)")
    .eq("id", id)
    .maybeSingle();
  if (!data) return null;
  const t = data as WorkoutTemplate;
  t.template_exercises = (t.template_exercises || []).slice().sort(
    (a, b) => a.position - b.position,
  );
  return t;
}

// Per-exercise session history for the info sheet: each past workout that
// included this exercise, newest first, with that session's sets.
export interface ExerciseSession {
  date: string;
  topWeight: number;
  sets: { w: number; r: number }[];
}

export async function getExerciseHistory(
  supabase: DB,
  exerciseId: string,
): Promise<ExerciseSession[]> {
  const { data } = await supabase
    .from("workout_exercises")
    .select("id, sets(weight_lb, reps, position), workouts!inner(performed_at)")
    .eq("exercise_id", exerciseId);
  if (!data) return [];
  const rows = (data as unknown as {
    sets: { weight_lb: number; reps: number; position: number }[];
    workouts: { performed_at: string };
  }[]).map((r) => {
    const sets = (r.sets || [])
      .slice()
      .sort((a, b) => a.position - b.position)
      .map((s) => ({ w: s.weight_lb, r: s.reps }));
    return {
      date: r.workouts.performed_at,
      topWeight: Math.max(0, ...sets.map((s) => s.w)),
      sets,
    };
  });
  return rows.sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
  );
}

// ---- derived helpers ----

export function workoutVolumeLb(w: Workout): number {
  let v = 0;
  for (const we of w.workout_exercises || [])
    for (const s of we.sets || []) if (s.done) v += s.weight_lb * s.reps;
  return v;
}

export function workoutSetCount(w: Workout): number {
  let n = 0;
  for (const we of w.workout_exercises || []) n += (we.sets || []).length;
  return n;
}

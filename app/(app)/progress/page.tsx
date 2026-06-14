import { createClient } from "@/lib/supabase/server";
import { getExercises, getWorkouts } from "@/lib/queries";
import { PageHeader, PageContent } from "@/components/shell/PageHeader";
import { ProgressView, type ProgressData } from "@/components/pages/ProgressView";

export const dynamic = "force-dynamic";

const WEEKS = 12;

export default async function ProgressPage() {
  const supabase = await createClient();
  const [workouts, exercises] = await Promise.all([
    getWorkouts(supabase),
    getExercises(supabase),
  ]);
  const catOf = new Map(exercises.map((e) => [e.id, e.category]));

  const now = Date.now();
  const weekAgoIdx = (iso: string) =>
    Math.floor((now - new Date(iso).getTime()) / (7 * 86400000));

  // weekly total volume (gym), oldest -> newest
  const vol = new Array(WEEKS).fill(0);
  // weekly best e1RM per exercise name
  const e1rm: Record<string, number[]> = {};
  // sets per category in last 7 days
  const muscleSets: Record<string, number> = {};
  // best weight per exercise name (+ when)
  const bestByName: Record<string, { lb: number; at: string; second: number }> =
    {};

  for (const w of workouts) {
    if (w.type !== "gym") continue;
    const wi = weekAgoIdx(w.performed_at);
    for (const we of w.workout_exercises || []) {
      const cat = we.exercise_id ? catOf.get(we.exercise_id) : null;
      for (const s of we.sets || []) {
        if (!s.done) continue;
        // weekly volume
        if (wi >= 0 && wi < WEEKS) vol[WEEKS - 1 - wi] += s.weight_lb * s.reps;
        // sets per muscle (last 7d)
        if (wi === 0 && cat)
          muscleSets[cat] = (muscleSets[cat] || 0) + 1;
        // e1RM (Epley)
        const est = Math.round(s.weight_lb * (1 + s.reps / 30));
        if (wi >= 0 && wi < WEEKS) {
          if (!e1rm[we.name]) e1rm[we.name] = new Array(WEEKS).fill(0);
          e1rm[we.name][WEEKS - 1 - wi] = Math.max(
            e1rm[we.name][WEEKS - 1 - wi],
            est,
          );
        }
        // best by name
        const b = bestByName[we.name];
        if (!b) bestByName[we.name] = { lb: s.weight_lb, at: w.performed_at, second: 0 };
        else if (s.weight_lb > b.lb) {
          b.second = b.lb;
          b.lb = s.weight_lb;
          b.at = w.performed_at;
        } else if (s.weight_lb > b.second && s.weight_lb < b.lb) {
          b.second = s.weight_lb;
        }
      }
    }
  }

  // forward-fill e1RM zeros so the line is continuous
  for (const name of Object.keys(e1rm)) {
    const arr = e1rm[name];
    let last = 0;
    for (let i = 0; i < arr.length; i++) {
      if (arr[i] === 0) arr[i] = last;
      else last = arr[i];
    }
    // back-fill leading zeros with first real value
    const firstReal = arr.find((v) => v > 0) || 0;
    for (let i = 0; i < arr.length && arr[i] === 0; i++) arr[i] = firstReal;
  }

  // pick the lifts with the most data for the e1RM selector
  const liftNames = Object.entries(e1rm)
    .sort((a, b) => Math.max(...b[1]) - Math.max(...a[1]))
    .slice(0, 4)
    .map(([n]) => n);

  // PRs: top lifts by best weight
  const prs = Object.entries(bestByName)
    .sort((a, b) => b[1].lb - a[1].lb)
    .slice(0, 4)
    .map(([name, v]) => ({
      lift: name,
      lb: v.lb,
      at: v.at,
      up: v.second > 0 ? v.lb - v.second : 0,
    }));

  const muscleOrder = ["Chest", "Back", "Legs", "Shoulders", "Arms", "Core"];
  const muscle = muscleOrder
    .map((m) => [m, muscleSets[m] || 0] as [string, number])
    .filter((m) => m[1] > 0 || true);

  const data: ProgressData = {
    volSeries: vol,
    volTotal: vol[vol.length - 1] || 0,
    volTrendPct:
      vol.length >= 2 && vol[0] > 0
        ? Math.round(((vol[vol.length - 1] - vol[0]) / vol[0]) * 100)
        : 0,
    e1rm: Object.fromEntries(liftNames.map((n) => [n, e1rm[n]])),
    liftNames,
    muscle,
    prs,
  };

  return (
    <>
      <PageHeader kicker="Last 12 weeks" title="Progress" />
      <PageContent>
        <ProgressView data={data} />
      </PageContent>
    </>
  );
}

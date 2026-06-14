import { createClient } from "@/lib/supabase/server";
import {
  getWorkouts,
  getExercises,
  workoutVolumeLb,
  workoutSetCount,
} from "@/lib/queries";
import { computeLoad, type LoadInput } from "@/lib/muscles";
import { PageHeader, PageContent } from "@/components/shell/PageHeader";
import { DashboardView, type DashboardData } from "@/components/pages/DashboardView";

export const dynamic = "force-dynamic";

function dayWindow(days: number) {
  return Date.now() - days * 86400000;
}

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // seed demo data on first load BEFORE querying (layout runs concurrently with
  // the page, so we can't rely on it having finished). No-op after first run.
  await supabase.rpc("seed_demo_for_me");

  const [workouts, exercises] = await Promise.all([
    getWorkouts(supabase),
    getExercises(supabase),
  ]);

  const exMap = new Map(
    exercises.map((e) => [e.id, { muscle: e.primary_muscle, intensity: e.intensity }]),
  );

  // muscle load rows
  const loadRows: LoadInput[] = [];
  for (const w of workouts) {
    for (const we of w.workout_exercises || []) {
      const ex = we.exercise_id ? exMap.get(we.exercise_id) : null;
      const doneSets =
        (we.sets || []).filter((s) => s.done).length || (we.sets || []).length;
      loadRows.push({
        performedAt: w.performed_at,
        muscle: ex?.muscle ?? null,
        intensity: ex?.intensity ?? 0.5,
        setCount: doneSets,
      });
    }
  }
  const loads = {
    daily: computeLoad(loadRows, 1.05),
    "3day": computeLoad(loadRows, 3),
    weekly: computeLoad(loadRows, 7),
  };

  // ---- weekly stats vs previous week ----
  const w1 = dayWindow(7);
  const w2 = dayWindow(14);
  const inThis = (iso: string) => new Date(iso).getTime() >= w1;
  const inPrev = (iso: string) => {
    const t = new Date(iso).getTime();
    return t >= w2 && t < w1;
  };

  const sum = (
    list: typeof workouts,
    pick: (w: (typeof workouts)[number]) => number,
  ) => list.reduce((a, w) => a + pick(w), 0);

  const thisW = workouts.filter((w) => inThis(w.performed_at));
  const prevW = workouts.filter((w) => inPrev(w.performed_at));

  const volThis = sum(thisW, (w) => (w.type === "gym" ? workoutVolumeLb(w) : 0));
  const volPrev = sum(prevW, (w) => (w.type === "gym" ? workoutVolumeLb(w) : 0));
  const distThis = sum(thisW, (w) => w.distance_mi || 0);
  const distPrev = sum(prevW, (w) => w.distance_mi || 0);
  const hrsThis = sum(thisW, (w) => w.duration_sec) / 3600;
  const hrsPrev = sum(prevW, (w) => w.duration_sec) / 3600;

  const pct = (a: number, b: number) =>
    b > 0 ? Math.round(((a - b) / b) * 100) : a > 0 ? 100 : 0;

  // ---- weekly training-load bars (last 7 days) ----
  const today = new Date();
  const days: DashboardData["week"]["days"] = [];
  let maxMin = 1;
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today.getFullYear(), today.getMonth(), today.getDate() - i);
    const dayStart = d.getTime();
    const dayEnd = dayStart + 86400000;
    const seg = { gym: 0, run: 0, racquet: 0 };
    for (const w of workouts) {
      const t = new Date(w.performed_at).getTime();
      if (t >= dayStart && t < dayEnd) seg[w.type] += w.duration_sec / 60;
    }
    maxMin = Math.max(maxMin, seg.gym, seg.run, seg.racquet);
    days.push({
      label: ["S", "M", "T", "W", "T", "F", "S"][d.getDay()],
      isToday: i === 0,
      gym: Math.round(seg.gym),
      run: Math.round(seg.run),
      racquet: Math.round(seg.racquet),
    });
  }

  // ---- recent ----
  const recent = workouts.slice(0, 4).map((w) => ({
    id: w.id,
    type: w.type,
    title: w.title,
    performed_at: w.performed_at,
    duration_sec: w.duration_sec,
    volLb: workoutVolumeLb(w),
    sets: workoutSetCount(w),
    distMi: w.distance_mi,
    paceSpm: w.pace_spm,
    kcal: w.kcal,
    rallies: w.rallies,
    prs: 0,
  }));

  // ---- next up: most-recent gym template suggestion ----
  const lastGym = workouts.find((w) => w.type === "gym");
  const nextUp = lastGym
    ? {
        title: lastGym.title,
        subtitle: `${(lastGym.workout_exercises || []).length} exercises · last ${new Date(
          lastGym.performed_at,
        ).toLocaleDateString("en-US", { weekday: "short" })}`,
      }
    : null;

  const data: DashboardData = {
    hasData: workouts.length > 0,
    firstName:
      (user?.user_metadata?.display_name as string)?.split(" ")[0] ||
      (user?.email?.split("@")[0] ?? "athlete"),
    loads,
    stats: {
      workoutsCount: thisW.length,
      workoutsDelta: thisW.length - prevW.length,
      volumeLb: volThis,
      volumeDeltaPct: pct(volThis, volPrev),
      distanceMi: distThis,
      distanceDelta: Math.round((distThis - distPrev) * 10) / 10,
      activeHrs: Math.round(hrsThis * 10) / 10,
      activeDelta: Math.round((hrsThis - hrsPrev) * 10) / 10,
    },
    week: { totalHrs: Math.round(hrsThis * 10) / 10, maxMin, days },
    recent,
    nextUp,
  };

  const now = new Date();
  const kicker = now
    .toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })
    .replace(",", " ·");
  const hour = now.getHours();
  const greeting =
    hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  return (
    <>
      <PageHeader
        kicker={kicker}
        title={`${greeting}, ${capitalize(data.firstName)}`}
      />
      <PageContent>
        <DashboardView data={data} />
      </PageContent>
    </>
  );
}

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

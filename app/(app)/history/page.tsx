import { createClient } from "@/lib/supabase/server";
import { getWorkouts, workoutVolumeLb, workoutSetCount } from "@/lib/queries";
import { PageHeader, PageContent } from "@/components/shell/PageHeader";
import { HistoryView, type HistoryData } from "@/components/pages/HistoryView";
import type { WorkoutType } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function HistoryPage() {
  const supabase = await createClient();
  const workouts = await getWorkouts(supabase);

  const rows = workouts.map((w) => ({
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

  // this month summary
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
  const thisMonth = workouts.filter(
    (w) => new Date(w.performed_at).getTime() >= monthStart,
  );
  const counts: Record<WorkoutType, number> = { gym: 0, run: 0, racquet: 0 };
  for (const w of thisMonth) counts[w.type]++;

  // 14-day strip
  const strip: (WorkoutType | null)[] = [];
  for (let i = 13; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
    const s = d.getTime();
    const e = s + 86400000;
    const found = workouts.find((w) => {
      const t = new Date(w.performed_at).getTime();
      return t >= s && t < e;
    });
    strip.push(found ? found.type : null);
  }

  const data: HistoryData = {
    rows,
    monthLabel: now
      .toLocaleDateString("en-US", { month: "long", year: "numeric" })
      .toUpperCase(),
    total: thisMonth.length,
    counts,
    strip,
  };

  return (
    <>
      <PageHeader
        kicker={`${workouts.length} sessions logged`}
        title="History"
      />
      <PageContent>
        <HistoryView data={data} />
      </PageContent>
    </>
  );
}

import { createClient } from "@/lib/supabase/server";
import { getExercises, getWorkouts } from "@/lib/queries";
import { PageHeader, PageContent } from "@/components/shell/PageHeader";
import { ExercisesView } from "@/components/pages/ExercisesView";

export const dynamic = "force-dynamic";

export default async function ExercisesPage() {
  const supabase = await createClient();
  const [exercises, workouts] = await Promise.all([
    getExercises(supabase),
    getWorkouts(supabase),
  ]);

  // best (max) logged weight per exercise id
  const best: Record<string, number> = {};
  for (const w of workouts)
    for (const we of w.workout_exercises || [])
      if (we.exercise_id)
        for (const s of we.sets || [])
          best[we.exercise_id] = Math.max(best[we.exercise_id] || 0, s.weight_lb);

  const items = exercises.map((e) => ({
    id: e.id,
    name: e.name,
    category: e.category,
    equipment: e.equipment,
    bestLb: best[e.id] || 0,
  }));

  return (
    <>
      <PageHeader
        kicker={`Library · ${exercises.length} movements`}
        title="Exercises"
      />
      <PageContent>
        <ExercisesView items={items} />
      </PageContent>
    </>
  );
}

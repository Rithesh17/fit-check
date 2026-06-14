import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getWorkout, getExercises } from "@/lib/queries";
import { PageHeader, PageContent } from "@/components/shell/PageHeader";
import { LogWorkout, type LibItem, type InitialConfig } from "@/components/pages/LogWorkout";

export const dynamic = "force-dynamic";

export default async function EditWorkoutPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const [workout, exercises] = await Promise.all([
    getWorkout(supabase, id),
    getExercises(supabase),
  ]);
  if (!workout) notFound();

  const lib: LibItem[] = exercises.map((e) => ({
    id: e.id,
    name: e.name,
    category: e.category,
    equipment: e.equipment,
    target: e.primary_muscle,
    is_cardio: e.is_cardio,
    default_sets: e.default_sets,
    default_reps: e.default_reps,
    default_weight_lb: e.default_weight_lb,
  }));

  const initial: InitialConfig =
    workout.type === "gym"
      ? {
          type: "gym",
          title: workout.title,
          durationMin: String(Math.round(workout.duration_sec / 60)),
          exercises: (workout.workout_exercises || [])
            .filter((we) => we.exercise_id)
            .map((we) => ({
              exercise_id: we.exercise_id as string,
              name: we.name,
              target: we.target,
              sets: (we.sets || []).map((s) => ({
                w: s.weight_lb,
                r: s.reps,
                done: s.done,
              })),
            })),
        }
      : workout.type === "run"
        ? {
            type: "run",
            title: workout.title,
            distance: workout.distance_mi ? String(workout.distance_mi) : "",
            durationMin: String(Math.round(workout.duration_sec / 60)),
            kcal: workout.kcal ? String(workout.kcal) : "",
          }
        : {
            type: "racquet",
            title: workout.title,
            durationMin: String(Math.round(workout.duration_sec / 60)),
            kcal: workout.kcal ? String(workout.kcal) : "",
            rallies: workout.rallies ? String(workout.rallies) : "",
            score: (workout.score || []).map((g) => g.join("-")).join(", "),
          };

  return (
    <>
      <PageHeader kicker="Editing workout" title={workout.title} />
      <PageContent>
        <LogWorkout lib={lib} initial={initial} editId={workout.id} />
      </PageContent>
    </>
  );
}

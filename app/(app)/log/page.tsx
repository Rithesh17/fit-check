import { createClient } from "@/lib/supabase/server";
import { getExercises, getTemplates, getWorkouts } from "@/lib/queries";
import { PageHeader, PageContent } from "@/components/shell/PageHeader";
import { LogFlow, type TemplateLite } from "@/components/pages/LogFlow";
import type { LibItem, InitialConfig } from "@/components/pages/LogWorkout";

export const dynamic = "force-dynamic";

export default async function LogPage() {
  const supabase = await createClient();
  const [exercises, templates, recent] = await Promise.all([
    getExercises(supabase),
    getTemplates(supabase),
    getWorkouts(supabase, { limit: 1 }),
  ]);

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

  const tmpl: TemplateLite[] = templates.map((t) => ({
    id: t.id,
    name: t.name,
    type: t.type,
    exercises: (t.template_exercises || []).map((te) => ({
      exercise_id: te.exercise_id,
      name: te.name,
      target: te.target,
      default_sets: te.default_sets,
      default_reps: te.default_reps,
      default_weight_lb: te.default_weight_lb,
    })),
  }));

  // "repeat last" prefill
  let repeat: InitialConfig | null = null;
  const last = recent[0];
  if (last) {
    if (last.type === "gym") {
      repeat = {
        type: "gym",
        title: last.title,
        exercises: (last.workout_exercises || [])
          .filter((we) => we.exercise_id)
          .map((we) => ({
            exercise_id: we.exercise_id as string,
            name: we.name,
            target: we.target,
            sets: (we.sets || []).map((s) => ({ w: s.weight_lb, r: s.reps })),
          })),
      };
    } else if (last.type === "run") {
      repeat = {
        type: "run",
        title: last.title,
        distance: last.distance_mi ? String(last.distance_mi) : "",
        durationMin: last.duration_sec
          ? String(Math.round(last.duration_sec / 60))
          : "",
        kcal: last.kcal ? String(last.kcal) : "",
      };
    } else {
      repeat = {
        type: "racquet",
        title: last.title,
        durationMin: last.duration_sec
          ? String(Math.round(last.duration_sec / 60))
          : "",
        kcal: last.kcal ? String(last.kcal) : "",
        rallies: last.rallies ? String(last.rallies) : "",
      };
    }
  }

  return (
    <>
      <PageHeader kicker="Start a session" title="Log Workout" />
      <PageContent>
        <LogFlow lib={lib} templates={tmpl} repeat={repeat} />
      </PageContent>
    </>
  );
}

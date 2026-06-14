import { createClient } from "@/lib/supabase/server";
import { getExercises } from "@/lib/queries";
import { PageHeader, PageContent } from "@/components/shell/PageHeader";
import { LogWorkout } from "@/components/pages/LogWorkout";

export const dynamic = "force-dynamic";

export default async function LogPage() {
  const supabase = await createClient();
  const exercises = await getExercises(supabase);
  const lib = exercises.map((e) => ({
    id: e.id,
    name: e.name,
    category: e.category,
    equipment: e.equipment,
    target: e.primary_muscle,
  }));

  return (
    <>
      <PageHeader kicker="In progress" title="Log Workout" />
      <PageContent>
        <LogWorkout lib={lib} />
      </PageContent>
    </>
  );
}

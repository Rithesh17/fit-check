import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getTemplate, getExercises } from "@/lib/queries";
import { PageHeader, PageContent } from "@/components/shell/PageHeader";
import { RoutineEditor } from "@/components/pages/RoutineEditor";
import type { LibItem } from "@/components/pages/LogWorkout";

export const dynamic = "force-dynamic";

export default async function RoutineEditorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const [template, exercises] = await Promise.all([
    getTemplate(supabase, id),
    getExercises(supabase),
  ]);
  if (!template) notFound();

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

  return (
    <>
      <PageHeader kicker="Edit routine" title={template.name} />
      <PageContent>
        <RoutineEditor template={template} lib={lib} />
      </PageContent>
    </>
  );
}

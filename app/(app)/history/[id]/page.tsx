import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getWorkout } from "@/lib/queries";
import { PageHeader, PageContent } from "@/components/shell/PageHeader";
import { DetailView } from "@/components/pages/DetailView";
import { TYPE_META } from "@/lib/types";
import { relDate } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function DetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const workout = await getWorkout(supabase, id);
  if (!workout) notFound();

  const tm = TYPE_META[workout.type];
  const { day } = relDate(workout.performed_at);

  return (
    <>
      <PageHeader kicker={`${tm.label} · ${day}`} title={workout.title} />
      <PageContent>
        <DetailView workout={workout} />
      </PageContent>
    </>
  );
}

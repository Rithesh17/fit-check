import { createClient } from "@/lib/supabase/server";
import { getTemplates } from "@/lib/queries";
import { PageHeader, PageContent } from "@/components/shell/PageHeader";
import { RoutinesView } from "@/components/pages/RoutinesView";

export const dynamic = "force-dynamic";

export default async function RoutinesPage() {
  const supabase = await createClient();
  const templates = await getTemplates(supabase);
  const items = templates.map((t) => ({
    id: t.id,
    name: t.name,
    type: t.type,
    count: (t.template_exercises || []).length,
  }));
  return (
    <>
      <PageHeader kicker="Reusable templates" title="Routines" />
      <PageContent>
        <RoutinesView items={items} />
      </PageContent>
    </>
  );
}

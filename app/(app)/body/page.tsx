import { createClient } from "@/lib/supabase/server";
import { getBodyMetrics, getMeasurements } from "@/lib/queries";
import { PageHeader, PageContent } from "@/components/shell/PageHeader";
import { BodyView, type BodyData } from "@/components/pages/BodyView";

export const dynamic = "force-dynamic";

export default async function BodyPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [metrics, measurements, profileRes] = await Promise.all([
    getBodyMetrics(supabase),
    getMeasurements(supabase),
    supabase.from("profiles").select("weight_goal_lb").eq("id", user!.id).maybeSingle(),
  ]);

  // latest measurement per part
  const latestMeas = new Map<string, { value_in: number }>();
  for (const m of measurements) if (!latestMeas.has(m.part)) latestMeas.set(m.part, m);

  const weightSeries = metrics
    .map((m) => m.weight_lb)
    .filter((v): v is number => v != null);

  const latest = metrics[metrics.length - 1];
  const prev = metrics[metrics.length - 2];

  const data: BodyData = {
    weightSeries,
    weightStart: weightSeries[0] ?? null,
    weightCur: weightSeries[weightSeries.length - 1] ?? null,
    goalLb: profileRes.data?.weight_goal_lb ?? null,
    bodyFat: latest?.body_fat_pct ?? null,
    bodyFatDelta:
      latest?.body_fat_pct != null && prev?.body_fat_pct != null
        ? Math.round((latest.body_fat_pct - prev.body_fat_pct) * 10) / 10
        : null,
    leanMass: latest?.lean_mass_lb ?? null,
    leanDelta:
      latest?.lean_mass_lb != null && prev?.lean_mass_lb != null
        ? Math.round((latest.lean_mass_lb - prev.lean_mass_lb) * 10) / 10
        : null,
    bmi: latest?.bmi ?? null,
    bmiDelta:
      latest?.bmi != null && prev?.bmi != null
        ? Math.round((latest.bmi - prev.bmi) * 10) / 10
        : null,
    measurements: ["Chest", "Waist", "Hips", "L Arm", "Thigh", "Calf"]
      .filter((p) => latestMeas.has(p))
      .map((p) => ({ part: p, value_in: latestMeas.get(p)!.value_in })),
    updatedOn: measurements[0]?.measured_on ?? null,
  };

  return (
    <>
      <PageHeader
        kicker={
          data.updatedOn
            ? `Updated ${new Date(data.updatedOn).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
              })}`
            : "Body composition"
        }
        title="Body Metrics"
      />
      <PageContent>
        <BodyView data={data} />
      </PageContent>
    </>
  );
}

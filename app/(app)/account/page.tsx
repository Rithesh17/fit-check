import { createClient } from "@/lib/supabase/server";
import { getBodyMetrics, getMeasurements } from "@/lib/queries";
import { PageHeader, PageContent } from "@/components/shell/PageHeader";
import { AccountView } from "@/components/pages/AccountView";
import type { BodyData } from "@/components/pages/BodyView";
import type { Profile } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function AccountPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [metricsRes, measurements, profRes] = await Promise.all([
    getBodyMetrics(supabase),
    getMeasurements(supabase),
    supabase
      .from("profiles")
      .select("*")
      .eq("id", user!.id)
      .maybeSingle(),
  ]);
  const metrics = metricsRes;

  const latestMeas = new Map<string, { value_in: number }>();
  for (const m of measurements) if (!latestMeas.has(m.part)) latestMeas.set(m.part, m);

  const weightSeries = metrics
    .map((m) => m.weight_lb)
    .filter((v): v is number => v != null);
  const latest = metrics[metrics.length - 1];
  const prev = metrics[metrics.length - 2];

  const p = profRes.data;
  const profile: Profile = {
    id: user!.id,
    display_name: p?.display_name ?? "Athlete",
    units: (p?.units as Profile["units"]) ?? "imperial",
    streak_days: p?.streak_days ?? 0,
    weight_goal_lb: p?.weight_goal_lb ?? null,
    weekly_workout_goal: p?.weekly_workout_goal ?? null,
    weekly_volume_goal_lb: p?.weekly_volume_goal_lb ?? null,
  };

  const body: BodyData = {
    weightSeries,
    weightStart: weightSeries[0] ?? null,
    weightCur: weightSeries[weightSeries.length - 1] ?? null,
    goalLb: profile.weight_goal_lb,
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
      .filter((part) => latestMeas.has(part))
      .map((part) => ({ part, value_in: latestMeas.get(part)!.value_in })),
    updatedOn: measurements[0]?.measured_on ?? null,
  };

  return (
    <>
      <PageHeader kicker="Your account" title={profile.display_name} />
      <PageContent>
        <AccountView profile={profile} body={body} email={user!.email ?? ""} />
      </PageContent>
    </>
  );
}

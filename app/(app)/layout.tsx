import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AppFrame } from "@/components/shell/AppFrame";
import type { Profile } from "@/lib/types";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // ensure a profile exists, then seed demo data on first visit (no-op afterwards)
  let { data: profile } = await supabase
    .from("profiles")
    .select("id, display_name, units, streak_days, weight_goal_lb")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile) {
    const fallbackName =
      (user.user_metadata?.display_name as string) ||
      (user.email ? user.email.split("@")[0] : "Athlete");
    await supabase
      .from("profiles")
      .upsert({ id: user.id, display_name: fallbackName });
    const { data } = await supabase
      .from("profiles")
      .select("id, display_name, units, streak_days, weight_goal_lb")
      .eq("id", user.id)
      .maybeSingle();
    profile = data;
  }

  // seed sample data the first time (function is a no-op if workouts exist)
  await supabase.rpc("seed_demo_for_me");

  const safeProfile: Profile = {
    id: user.id,
    display_name: profile?.display_name ?? "Athlete",
    units: (profile?.units as Profile["units"]) ?? "imperial",
    streak_days: profile?.streak_days ?? 0,
    weight_goal_lb: profile?.weight_goal_lb ?? null,
  };

  return <AppFrame profile={safeProfile}>{children}</AppFrame>;
}

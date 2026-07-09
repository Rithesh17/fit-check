import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SharedWorkoutView } from "@/components/pages/SharedWorkoutView";
import type { Workout } from "@/lib/types";

export const dynamic = "force-dynamic";

async function fetchShared(shareId: string): Promise<Workout | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("workouts")
    .select("*, workout_exercises(*, sets(*))")
    .eq("share_id", shareId)
    .maybeSingle();
  if (!data) return null;
  const w = data as Workout;
  w.workout_exercises = (w.workout_exercises || [])
    .slice()
    .sort((a, b) => a.position - b.position)
    .map((we) => ({
      ...we,
      sets: (we.sets || []).slice().sort((a, b) => a.position - b.position),
    }));
  return w;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ shareId: string }>;
}): Promise<Metadata> {
  const { shareId } = await params;
  const w = await fetchShared(shareId);
  if (!w) return { title: "Workout · Pulse" };
  return {
    title: `${w.title} · Pulse`,
    description: "A workout shared from Pulse.",
  };
}

export default async function SharePage({
  params,
}: {
  params: Promise<{ shareId: string }>;
}) {
  const { shareId } = await params;
  const w = await fetchShared(shareId);
  if (!w) notFound();
  return <SharedWorkoutView workout={w} />;
}

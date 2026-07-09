-- ============================================================================
-- Pulse — public workout sharing
-- ----------------------------------------------------------------------------
-- Adds a nullable, unique `share_id` to workouts. When set, that workout (and
-- its exercises/sets) becomes readable by anyone who has the unguessable link
-- at /share/<share_id>. When null, the workout stays private (owner-only).
--
-- Run in the Supabase SQL Editor. Idempotent.
-- ============================================================================

alter table public.workouts
  add column if not exists share_id uuid unique;

-- ---- public (anon) read of a SHARED workout + its children ----
-- These are permissive SELECT policies that sit alongside the existing
-- owner-only policies (RLS ORs them). Because share_id is a random uuid, a
-- workout is only reachable by someone who already holds the link.

drop policy if exists "workouts_public_shared" on public.workouts;
create policy "workouts_public_shared" on public.workouts
  for select using (share_id is not null);

drop policy if exists "we_public_shared" on public.workout_exercises;
create policy "we_public_shared" on public.workout_exercises
  for select using (
    exists (
      select 1 from public.workouts w
      where w.id = workout_id and w.share_id is not null
    )
  );

drop policy if exists "sets_public_shared" on public.sets;
create policy "sets_public_shared" on public.sets
  for select using (
    exists (
      select 1 from public.workout_exercises we
      join public.workouts w on w.id = we.workout_id
      where we.id = workout_exercise_id and w.share_id is not null
    )
  );

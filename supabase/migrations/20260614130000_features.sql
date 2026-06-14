-- ============================================================================
-- Phase 2 — exercise config + video, per-user overrides, workout templates,
-- profile goals, and account deletion.
-- ============================================================================

-- ---- exercises: defaults, form cues, video, cardio flag ----
alter table public.exercises
  add column if not exists video_url           text,
  add column if not exists cues                text,
  add column if not exists is_cardio           boolean not null default false,
  add column if not exists default_sets        int,
  add column if not exists default_reps        int,
  add column if not exists default_weight_lb   numeric,
  add column if not exists default_duration_sec int;

update public.exercises set is_cardio = true where category = 'Cardio';

-- sensible library defaults
update public.exercises
  set default_sets = coalesce(default_sets, 3),
      default_reps = coalesce(default_reps, 10)
  where user_id is null and is_cardio = false;
update public.exercises
  set default_duration_sec = coalesce(default_duration_sec, 1800)
  where user_id is null and is_cardio = true;

-- a few example form-cue videos on the big lifts
update public.exercises set video_url = 'https://www.youtube.com/watch?v=rT7DgCr-3pg' where name = 'Barbell Bench Press' and user_id is null;
update public.exercises set video_url = 'https://www.youtube.com/watch?v=ultWZbUMPL8' where name = 'Back Squat' and user_id is null;
update public.exercises set video_url = 'https://www.youtube.com/watch?v=op9kVnSso6Q' where name = 'Deadlift' and user_id is null;
update public.exercises set video_url = 'https://www.youtube.com/watch?v=2yjwXTZQDDI' where name = 'Overhead Press' and user_id is null;
update public.exercises set video_url = 'https://www.youtube.com/watch?v=eGo4IYlbE5g' where name = 'Pull-Up' and user_id is null;
update public.exercises set video_url = 'https://www.youtube.com/watch?v=9efgcAjQe7E' where name = 'Romanian Deadlift' and user_id is null;

-- ---- per-user overrides (apply to global or own exercises) ----
create table if not exists public.user_exercise_prefs (
  id                   uuid primary key default gen_random_uuid(),
  user_id              uuid not null references auth.users (id) on delete cascade,
  exercise_id          uuid not null references public.exercises (id) on delete cascade,
  video_url            text,
  cues                 text,
  default_sets         int,
  default_reps         int,
  default_weight_lb    numeric,
  default_duration_sec int,
  updated_at           timestamptz not null default now(),
  unique (user_id, exercise_id)
);
alter table public.user_exercise_prefs enable row level security;
drop policy if exists uep_all_own on public.user_exercise_prefs;
create policy uep_all_own on public.user_exercise_prefs
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ---- workout templates (routines) ----
create table if not exists public.workout_templates (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users (id) on delete cascade,
  name       text not null,
  type       workout_type not null default 'gym',
  notes      text,
  position   int not null default 0,
  created_at timestamptz not null default now()
);
alter table public.workout_templates enable row level security;
drop policy if exists wt_all_own on public.workout_templates;
create policy wt_all_own on public.workout_templates
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create table if not exists public.template_exercises (
  id                   uuid primary key default gen_random_uuid(),
  template_id          uuid not null references public.workout_templates (id) on delete cascade,
  exercise_id          uuid references public.exercises (id) on delete set null,
  name                 text not null,
  target               text,
  position             int not null default 0,
  default_sets         int,
  default_reps         int,
  default_weight_lb    numeric,
  default_duration_sec int
);
alter table public.template_exercises enable row level security;
drop policy if exists te_all_own on public.template_exercises;
create policy te_all_own on public.template_exercises
  for all using (
    exists (select 1 from public.workout_templates t
            where t.id = template_id and t.user_id = auth.uid())
  ) with check (
    exists (select 1 from public.workout_templates t
            where t.id = template_id and t.user_id = auth.uid())
  );
create index if not exists te_template_idx on public.template_exercises (template_id, position);

-- ---- profile goals ----
alter table public.profiles
  add column if not exists weekly_workout_goal   int,
  add column if not exists weekly_volume_goal_lb numeric;

-- ---- account deletion (removes the auth user; cascades all data) ----
create or replace function public.delete_my_account()
returns void
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  uid uuid := auth.uid();
begin
  if uid is null then
    raise exception 'not authenticated';
  end if;
  delete from auth.users where id = uid;
end $$;

revoke all on function public.delete_my_account() from public;
grant execute on function public.delete_my_account() to authenticated;

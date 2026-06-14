-- ============================================================================
-- Pulse — core schema, row-level security, and triggers
-- ============================================================================
-- Canonical storage units (converted to metric for display in the UI):
--   weight       -> pounds (lb)
--   distance     -> miles (mi)
--   pace         -> seconds per mile (spm)
--   measurements -> inches (in)
-- ============================================================================

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- enums
-- ---------------------------------------------------------------------------
do $$ begin
  create type workout_type as enum ('gym', 'run', 'racquet');
exception when duplicate_object then null; end $$;

do $$ begin
  create type unit_system as enum ('imperial', 'metric');
exception when duplicate_object then null; end $$;

-- ---------------------------------------------------------------------------
-- profiles  (1:1 with auth.users)
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  id              uuid primary key references auth.users (id) on delete cascade,
  display_name    text not null default 'Athlete',
  units           unit_system not null default 'imperial',
  streak_days     int not null default 0,
  weight_goal_lb  numeric,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- exercises  (global library rows have user_id = null; user rows are owned)
-- ---------------------------------------------------------------------------
create table if not exists public.exercises (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid references auth.users (id) on delete cascade,
  name           text not null,
  category       text not null,           -- Chest / Back / Legs / Shoulders / Arms / Cardio
  equipment      text not null default 'Other',
  primary_muscle text,                     -- muscle key used by the body map
  intensity      numeric not null default 0.6,  -- 0..1 contribution for body-map model
  created_at     timestamptz not null default now()
);
create index if not exists exercises_user_idx on public.exercises (user_id);
create index if not exists exercises_category_idx on public.exercises (category);

-- ---------------------------------------------------------------------------
-- workouts
-- ---------------------------------------------------------------------------
create table if not exists public.workouts (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users (id) on delete cascade,
  type          workout_type not null default 'gym',
  title         text not null,
  performed_at  timestamptz not null default now(),
  duration_sec  int not null default 0,
  notes         text,
  -- cardio / racquet metrics
  kcal          int,
  distance_mi   numeric,
  pace_spm      int,
  rallies       int,
  score         jsonb,                    -- e.g. [[21,18],[19,21],[21,15]]
  created_at    timestamptz not null default now()
);
create index if not exists workouts_user_idx on public.workouts (user_id, performed_at desc);

-- ---------------------------------------------------------------------------
-- workout_exercises
-- ---------------------------------------------------------------------------
create table if not exists public.workout_exercises (
  id           uuid primary key default gen_random_uuid(),
  workout_id   uuid not null references public.workouts (id) on delete cascade,
  exercise_id  uuid references public.exercises (id) on delete set null,
  name         text not null,
  target       text,                      -- e.g. 'Chest · Triceps'
  position     int not null default 0,
  created_at   timestamptz not null default now()
);
create index if not exists we_workout_idx on public.workout_exercises (workout_id, position);

-- ---------------------------------------------------------------------------
-- sets
-- ---------------------------------------------------------------------------
create table if not exists public.sets (
  id                  uuid primary key default gen_random_uuid(),
  workout_exercise_id uuid not null references public.workout_exercises (id) on delete cascade,
  position            int not null default 0,
  weight_lb           numeric not null default 0,
  reps                int not null default 0,
  done                boolean not null default false,
  created_at          timestamptz not null default now()
);
create index if not exists sets_we_idx on public.sets (workout_exercise_id, position);

-- ---------------------------------------------------------------------------
-- body_metrics (one snapshot per day)
-- ---------------------------------------------------------------------------
create table if not exists public.body_metrics (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users (id) on delete cascade,
  measured_on   date not null default current_date,
  weight_lb     numeric,
  body_fat_pct  numeric,
  lean_mass_lb  numeric,
  bmi           numeric,
  created_at    timestamptz not null default now(),
  unique (user_id, measured_on)
);
create index if not exists body_metrics_user_idx on public.body_metrics (user_id, measured_on);

-- ---------------------------------------------------------------------------
-- body_measurements (tape measurements per part, latest snapshot)
-- ---------------------------------------------------------------------------
create table if not exists public.body_measurements (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users (id) on delete cascade,
  measured_on  date not null default current_date,
  part         text not null,             -- Chest / Waist / Hips / L Arm / Thigh / Calf ...
  value_in     numeric not null,
  created_at   timestamptz not null default now()
);
create index if not exists body_meas_user_idx on public.body_measurements (user_id, measured_on);

-- ---------------------------------------------------------------------------
-- updated_at trigger for profiles
-- ---------------------------------------------------------------------------
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

drop trigger if exists profiles_touch on public.profiles;
create trigger profiles_touch before update on public.profiles
  for each row execute function public.touch_updated_at();

-- ---------------------------------------------------------------------------
-- auto-create a profile when a new auth user is created
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    coalesce(
      nullif(new.raw_user_meta_data ->> 'display_name', ''),
      initcap(split_part(new.email, '@', 1))
    )
  )
  on conflict (id) do nothing;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================================
-- Row Level Security
-- ============================================================================
alter table public.profiles          enable row level security;
alter table public.exercises         enable row level security;
alter table public.workouts          enable row level security;
alter table public.workout_exercises enable row level security;
alter table public.sets              enable row level security;
alter table public.body_metrics      enable row level security;
alter table public.body_measurements enable row level security;

-- profiles -------------------------------------------------------------------
drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own" on public.profiles
  for select using (auth.uid() = id);
drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);
drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own" on public.profiles
  for insert with check (auth.uid() = id);

-- exercises: global rows (user_id is null) are readable by everyone ----------
drop policy if exists "exercises_select" on public.exercises;
create policy "exercises_select" on public.exercises
  for select using (user_id is null or auth.uid() = user_id);
drop policy if exists "exercises_insert_own" on public.exercises;
create policy "exercises_insert_own" on public.exercises
  for insert with check (auth.uid() = user_id);
drop policy if exists "exercises_update_own" on public.exercises;
create policy "exercises_update_own" on public.exercises
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "exercises_delete_own" on public.exercises;
create policy "exercises_delete_own" on public.exercises
  for delete using (auth.uid() = user_id);

-- workouts -------------------------------------------------------------------
drop policy if exists "workouts_all_own" on public.workouts;
create policy "workouts_all_own" on public.workouts
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- workout_exercises: scoped through parent workout ---------------------------
drop policy if exists "we_all_own" on public.workout_exercises;
create policy "we_all_own" on public.workout_exercises
  for all using (
    exists (select 1 from public.workouts w
            where w.id = workout_id and w.user_id = auth.uid())
  ) with check (
    exists (select 1 from public.workouts w
            where w.id = workout_id and w.user_id = auth.uid())
  );

-- sets: scoped through workout_exercise -> workout ---------------------------
drop policy if exists "sets_all_own" on public.sets;
create policy "sets_all_own" on public.sets
  for all using (
    exists (
      select 1 from public.workout_exercises we
      join public.workouts w on w.id = we.workout_id
      where we.id = workout_exercise_id and w.user_id = auth.uid()
    )
  ) with check (
    exists (
      select 1 from public.workout_exercises we
      join public.workouts w on w.id = we.workout_id
      where we.id = workout_exercise_id and w.user_id = auth.uid()
    )
  );

-- body_metrics ---------------------------------------------------------------
drop policy if exists "body_metrics_all_own" on public.body_metrics;
create policy "body_metrics_all_own" on public.body_metrics
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- body_measurements ----------------------------------------------------------
drop policy if exists "body_meas_all_own" on public.body_measurements;
create policy "body_meas_all_own" on public.body_measurements
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- =============================================================
-- Pulse — consolidated schema (paste into Supabase SQL Editor)
-- Equivalent to running all files in supabase/migrations in order.
-- =============================================================

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

-- ============================================================================
-- Global exercise library (user_id = null -> readable by everyone, owned by no one)
-- primary_muscle keys map to the dashboard body map model.
-- ============================================================================
insert into public.exercises (name, category, equipment, primary_muscle, intensity)
values
  -- Chest
  ('Barbell Bench Press',   'Chest',     'Barbell',    'chest',      0.90),
  ('Incline Bench Press',   'Chest',     'Barbell',    'chest',      0.82),
  ('Incline DB Press',      'Chest',     'Dumbbell',   'chest',      0.70),
  ('Flat DB Press',         'Chest',     'Dumbbell',   'chest',      0.72),
  ('Cable Fly',             'Chest',     'Cable',      'chest',      0.50),
  ('Pec Deck',              'Chest',     'Machine',    'chest',      0.55),
  ('Push-Up',               'Chest',     'Bodyweight', 'chest',      0.45),
  ('Dips',                  'Chest',     'Bodyweight', 'chest',      0.65),
  -- Back
  ('Deadlift',              'Back',      'Barbell',    'lowerback',  0.95),
  ('Pull-Up',               'Back',      'Bodyweight', 'lats',       0.85),
  ('Chin-Up',               'Back',      'Bodyweight', 'lats',       0.80),
  ('Barbell Row',           'Back',      'Barbell',    'lats',       0.80),
  ('Pendlay Row',           'Back',      'Barbell',    'lats',       0.78),
  ('Lat Pulldown',          'Back',      'Cable',      'lats',       0.65),
  ('Seated Cable Row',      'Back',      'Cable',      'lats',       0.62),
  ('Single-Arm DB Row',     'Back',      'Dumbbell',   'lats',       0.60),
  ('Face Pull',             'Back',      'Cable',      'reardelts',  0.45),
  ('Hyperextension',        'Back',      'Bodyweight', 'lowerback',  0.50),
  -- Legs
  ('Back Squat',            'Legs',      'Barbell',    'quads',      0.95),
  ('Front Squat',           'Legs',      'Barbell',    'quads',      0.88),
  ('Romanian Deadlift',     'Legs',      'Barbell',    'hamstrings', 0.85),
  ('Leg Press',             'Legs',      'Machine',    'quads',      0.70),
  ('Bulgarian Split Squat', 'Legs',      'Dumbbell',   'quads',      0.72),
  ('Walking Lunge',         'Legs',      'Dumbbell',   'glutes',     0.68),
  ('Leg Extension',         'Legs',      'Machine',    'quads',      0.55),
  ('Lying Leg Curl',        'Legs',      'Machine',    'hamstrings', 0.58),
  ('Hip Thrust',            'Legs',      'Barbell',    'glutes',     0.80),
  ('Standing Calf Raise',   'Legs',      'Machine',    'calves',     0.55),
  ('Seated Calf Raise',     'Legs',      'Machine',    'calves',     0.50),
  -- Shoulders
  ('Overhead Press',        'Shoulders', 'Barbell',    'frontdelts', 0.80),
  ('Seated DB Press',       'Shoulders', 'Dumbbell',   'frontdelts', 0.72),
  ('Arnold Press',          'Shoulders', 'Dumbbell',   'frontdelts', 0.70),
  ('Lateral Raise',         'Shoulders', 'Dumbbell',   'frontdelts', 0.45),
  ('Cable Lateral Raise',   'Shoulders', 'Cable',      'frontdelts', 0.45),
  ('Rear Delt Fly',         'Shoulders', 'Dumbbell',   'reardelts',  0.42),
  ('Upright Row',           'Shoulders', 'Barbell',    'traps',      0.55),
  ('Barbell Shrug',         'Shoulders', 'Barbell',    'traps',      0.60),
  -- Arms
  ('Barbell Curl',          'Arms',      'Barbell',    'biceps',     0.60),
  ('Dumbbell Curl',         'Arms',      'Dumbbell',   'biceps',     0.55),
  ('Hammer Curl',           'Arms',      'Dumbbell',   'biceps',     0.55),
  ('Preacher Curl',         'Arms',      'Machine',    'biceps',     0.52),
  ('Cable Curl',            'Arms',      'Cable',      'biceps',     0.50),
  ('Triceps Pushdown',      'Arms',      'Cable',      'triceps',    0.50),
  ('Overhead Triceps Ext',  'Arms',      'Dumbbell',   'triceps',    0.52),
  ('Skull Crusher',         'Arms',      'Barbell',    'triceps',    0.58),
  ('Close-Grip Bench',      'Arms',      'Barbell',    'triceps',    0.70),
  ('Wrist Curl',            'Arms',      'Dumbbell',   'forearms',   0.40),
  -- Core
  ('Hanging Leg Raise',     'Core',      'Bodyweight', 'abs',        0.55),
  ('Cable Crunch',          'Core',      'Cable',      'abs',        0.55),
  ('Plank',                 'Core',      'Bodyweight', 'abs',        0.45),
  ('Russian Twist',         'Core',      'Bodyweight', 'obliques',   0.45),
  ('Ab Wheel Rollout',      'Core',      'Other',      'abs',        0.60),
  ('Sit-Up',                'Core',      'Bodyweight', 'abs',        0.40),
  -- Cardio
  ('Treadmill Run',         'Cardio',    'Machine',    'quads',      0.60),
  ('Outdoor Run',           'Cardio',    'Bodyweight', 'quads',      0.62),
  ('Rowing Erg',            'Cardio',    'Machine',    'lats',       0.65),
  ('Cycling',               'Cardio',    'Machine',    'quads',      0.58),
  ('Stair Climber',         'Cardio',    'Machine',    'glutes',     0.55),
  ('Jump Rope',             'Cardio',    'Other',      'calves',     0.50),
  ('Elliptical',            'Cardio',    'Machine',    'quads',      0.45),
  ('Incline Walk',          'Cardio',    'Machine',    'calves',     0.40)
on conflict do nothing;

-- ============================================================================
-- seed_demo_for_me()  — populate the calling user's account with a realistic
-- starter dataset so the app feels alive on first sign-in. No-op if the user
-- already has workouts. SECURITY DEFINER so it can write across the user's rows,
-- but it always scopes to auth.uid().
-- ============================================================================
create or replace function public.seed_demo_for_me()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  w_id uuid;
  we_id uuid;
  i int;
  base_weight numeric := 178;
  d date;
begin
  if uid is null then
    raise exception 'not authenticated';
  end if;

  -- only seed once
  if exists (select 1 from public.workouts where user_id = uid) then
    return;
  end if;

  -- profile flourishes
  update public.profiles
     set streak_days = 38,
         weight_goal_lb = 168
   where id = uid;

  -- ----- body metrics: 12 weekly snapshots, gently trending down -----
  for i in 0..11 loop
    d := current_date - ((11 - i) * 7);
    insert into public.body_metrics (user_id, measured_on, weight_lb, body_fat_pct, lean_mass_lb, bmi)
    values (
      uid, d,
      round(base_weight - i * 0.47, 1),
      round(15.3 - i * 0.10, 1),
      round(146.0 + i * 0.21, 1),
      round(24.1 - i * 0.06, 1)
    )
    on conflict (user_id, measured_on) do nothing;
  end loop;

  -- ----- tape measurements (latest) -----
  insert into public.body_measurements (user_id, measured_on, part, value_in) values
    (uid, current_date - 2, 'Chest', 42.0),
    (uid, current_date - 2, 'Waist', 32.5),
    (uid, current_date - 2, 'Hips',  39.0),
    (uid, current_date - 2, 'L Arm', 15.2),
    (uid, current_date - 2, 'Thigh', 23.5),
    (uid, current_date - 2, 'Calf',  15.8);

  -- ===== Workouts =====

  -- Push Day (today)
  insert into public.workouts (user_id, type, title, performed_at, duration_sec, notes)
  values (uid, 'gym', 'Push Day', now() - interval '6 hours', 3840, 'Felt strong — new bench PR.')
  returning id into w_id;

  insert into public.workout_exercises (workout_id, exercise_id, name, target, position)
  values (w_id, (select id from exercises where name='Barbell Bench Press' and user_id is null), 'Bench Press', 'Chest · Triceps', 0)
  returning id into we_id;
  insert into public.sets (workout_exercise_id, position, weight_lb, reps, done) values
    (we_id,0,135,10,true),(we_id,1,155,8,true),(we_id,2,165,6,true);

  insert into public.workout_exercises (workout_id, exercise_id, name, target, position)
  values (w_id, (select id from exercises where name='Incline DB Press' and user_id is null), 'Incline DB Press', 'Upper Chest', 1)
  returning id into we_id;
  insert into public.sets (workout_exercise_id, position, weight_lb, reps, done) values
    (we_id,0,55,12,true),(we_id,1,55,11,true),(we_id,2,50,11,true);

  insert into public.workout_exercises (workout_id, exercise_id, name, target, position)
  values (w_id, (select id from exercises where name='Overhead Press' and user_id is null), 'Overhead Press', 'Shoulders', 2)
  returning id into we_id;
  insert into public.sets (workout_exercise_id, position, weight_lb, reps, done) values
    (we_id,0,95,8,true),(we_id,1,95,7,true),(we_id,2,85,8,true);

  insert into public.workout_exercises (workout_id, exercise_id, name, target, position)
  values (w_id, (select id from exercises where name='Cable Fly' and user_id is null), 'Cable Fly', 'Chest', 3)
  returning id into we_id;
  insert into public.sets (workout_exercise_id, position, weight_lb, reps, done) values
    (we_id,0,25,15,true),(we_id,1,25,14,true),(we_id,2,30,12,true);

  insert into public.workout_exercises (workout_id, exercise_id, name, target, position)
  values (w_id, (select id from exercises where name='Lateral Raise' and user_id is null), 'Lateral Raise', 'Side Delts', 4)
  returning id into we_id;
  insert into public.sets (workout_exercise_id, position, weight_lb, reps, done) values
    (we_id,0,20,15,true),(we_id,1,20,14,true);

  insert into public.workout_exercises (workout_id, exercise_id, name, target, position)
  values (w_id, (select id from exercises where name='Triceps Pushdown' and user_id is null), 'Triceps Pushdown', 'Triceps', 5)
  returning id into we_id;
  insert into public.sets (workout_exercise_id, position, weight_lb, reps, done) values
    (we_id,0,50,14,true),(we_id,1,55,12,true),(we_id,2,55,11,true);

  -- Tempo Run (yesterday)
  insert into public.workouts (user_id, type, title, performed_at, duration_sec, distance_mi, pace_spm, kcal)
  values (uid, 'run', 'Tempo Run', now() - interval '1 day 5 hours', 2520, 5.2, 468, 540);

  -- Badminton (Wed)
  insert into public.workouts (user_id, type, title, performed_at, duration_sec, kcal, rallies, score)
  values (uid, 'racquet', 'Badminton — Doubles', now() - interval '3 days', 4800, 610, 214, '[[21,18],[19,21],[21,15]]'::jsonb);

  -- Leg Day (Tue)
  insert into public.workouts (user_id, type, title, performed_at, duration_sec, notes)
  values (uid, 'gym', 'Leg Day', now() - interval '4 days', 4320, 'Squat + RDL focus, 2 PRs.')
  returning id into w_id;
  insert into public.workout_exercises (workout_id, exercise_id, name, target, position)
  values (w_id, (select id from exercises where name='Back Squat' and user_id is null), 'Back Squat', 'Quads · Glutes', 0)
  returning id into we_id;
  insert into public.sets (workout_exercise_id, position, weight_lb, reps, done) values
    (we_id,0,225,8,true),(we_id,1,275,5,true),(we_id,2,315,3,true);
  insert into public.workout_exercises (workout_id, exercise_id, name, target, position)
  values (w_id, (select id from exercises where name='Romanian Deadlift' and user_id is null), 'Romanian Deadlift', 'Hamstrings', 1)
  returning id into we_id;
  insert into public.sets (workout_exercise_id, position, weight_lb, reps, done) values
    (we_id,0,185,10,true),(we_id,1,225,8,true),(we_id,2,275,6,true);
  insert into public.workout_exercises (workout_id, exercise_id, name, target, position)
  values (w_id, (select id from exercises where name='Leg Press' and user_id is null), 'Leg Press', 'Quads', 2)
  returning id into we_id;
  insert into public.sets (workout_exercise_id, position, weight_lb, reps, done) values
    (we_id,0,360,12,true),(we_id,1,450,10,true);

  -- Easy Recovery run (Mon)
  insert into public.workouts (user_id, type, title, performed_at, duration_sec, distance_mi, pace_spm, kcal)
  values (uid, 'run', 'Easy Recovery', now() - interval '5 days', 1680, 3.1, 534, 300);

  -- Tennis (Sun)
  insert into public.workouts (user_id, type, title, performed_at, duration_sec, kcal, rallies, score)
  values (uid, 'racquet', 'Tennis — Singles', now() - interval '6 days', 3900, 520, 160, '[[6,4],[3,6],[7,5]]'::jsonb);

  -- Pull Day (Sat)
  insert into public.workouts (user_id, type, title, performed_at, duration_sec, notes)
  values (uid, 'gym', 'Pull Day', now() - interval '7 days', 3480, 'Back volume day.')
  returning id into w_id;
  insert into public.workout_exercises (workout_id, exercise_id, name, target, position)
  values (w_id, (select id from exercises where name='Pull-Up' and user_id is null), 'Pull-Up', 'Lats · Biceps', 0)
  returning id into we_id;
  insert into public.sets (workout_exercise_id, position, weight_lb, reps, done) values
    (we_id,0,0,12,true),(we_id,1,25,8,true),(we_id,2,45,6,true);
  insert into public.workout_exercises (workout_id, exercise_id, name, target, position)
  values (w_id, (select id from exercises where name='Barbell Row' and user_id is null), 'Barbell Row', 'Back', 1)
  returning id into we_id;
  insert into public.sets (workout_exercise_id, position, weight_lb, reps, done) values
    (we_id,0,135,10,true),(we_id,1,185,8,true),(we_id,2,205,6,true);
  insert into public.workout_exercises (workout_id, exercise_id, name, target, position)
  values (w_id, (select id from exercises where name='Barbell Curl' and user_id is null), 'Barbell Curl', 'Biceps', 2)
  returning id into we_id;
  insert into public.sets (workout_exercise_id, position, weight_lb, reps, done) values
    (we_id,0,65,12,true),(we_id,1,85,8,true),(we_id,2,95,6,true);
end $$;

grant execute on function public.seed_demo_for_me() to authenticated;

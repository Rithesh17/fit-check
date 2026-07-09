-- ============================================================================
-- Pulse — dumbbell starter routines: Upper Push / Upper Pull / Leg
-- ----------------------------------------------------------------------------
-- Adds a handful of dumbbell exercises to the GLOBAL library (user_id = null),
-- then seeds three per-user routines (workout_templates + template_exercises)
-- for every existing account. Each day = 6 exercises, 3 sets, ~9–12 reps.
--
-- Run in the Supabase SQL Editor. Idempotent: safe to run more than once
-- (new exercises are only inserted when missing; a routine is skipped if the
-- user already has one with the same name).
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1) New dumbbell moves for the global library (only if not already present —
--    the exercises table has no unique key, so we guard with NOT EXISTS).
-- ---------------------------------------------------------------------------
insert into public.exercises
  (name, category, equipment, primary_muscle, intensity, is_cardio, default_sets, default_reps)
select d.name, d.category, 'Dumbbell', d.primary_muscle, d.intensity, false, 3, d.reps
from (values
  ('Dumbbell Chest Fly',         'Chest',     'chest',      0.55::numeric, 12),
  ('Chest-Supported DB Row',     'Back',      'lats',       0.65,          10),
  ('Dumbbell Shrug',             'Shoulders', 'traps',      0.55,          12),
  ('Goblet Squat',               'Legs',      'quads',      0.70,          10),
  ('Dumbbell Romanian Deadlift', 'Legs',      'hamstrings', 0.75,          10),
  ('Dumbbell Hip Thrust',        'Legs',      'glutes',     0.70,          12),
  ('Dumbbell Calf Raise',        'Legs',      'calves',     0.50,          12)
) as d(name, category, primary_muscle, intensity, reps)
where not exists (
  select 1 from public.exercises e where e.name = d.name and e.user_id is null
);

-- ---------------------------------------------------------------------------
-- 2) Seeder: create the three routines for one user. SECURITY DEFINER so it
--    can be called from the app (via seed_starter_templates) or the backfill
--    below. Idempotent per template name.
-- ---------------------------------------------------------------------------
create or replace function public.seed_starter_templates_for(p_uid uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  t_id uuid;
begin
  if p_uid is null then
    return;
  end if;

  -- ---- Upper Push : chest, shoulders, triceps ----
  if not exists (select 1 from workout_templates where user_id = p_uid and name = 'Upper Push') then
    insert into workout_templates (user_id, name, type, notes, position)
    values (p_uid, 'Upper Push', 'gym',
            'Dumbbell push — full chest, delts & triceps. 3 sets, 9–12 reps.', 0)
    returning id into t_id;

    insert into template_exercises
      (template_id, exercise_id, name, target, position, default_sets, default_reps, default_weight_lb)
    values
      (t_id, (select id from exercises where name='Incline DB Press'     and user_id is null limit 1), 'Incline DB Press',     'Upper chest',    0, 3, 10, 30),
      (t_id, (select id from exercises where name='Flat DB Press'        and user_id is null limit 1), 'Flat DB Press',        'Chest',          1, 3, 10, 35),
      (t_id, (select id from exercises where name='Seated DB Press'      and user_id is null limit 1), 'Seated DB Press',      'Front delts',    2, 3, 10, 25),
      (t_id, (select id from exercises where name='Dumbbell Chest Fly'   and user_id is null limit 1), 'Dumbbell Chest Fly',   'Chest · stretch',3, 3, 12, 20),
      (t_id, (select id from exercises where name='Lateral Raise'        and user_id is null limit 1), 'Lateral Raise',        'Side delts',     4, 3, 12, 12),
      (t_id, (select id from exercises where name='Overhead Triceps Ext' and user_id is null limit 1), 'Overhead Triceps Ext', 'Triceps',        5, 3, 12, 25);
  end if;

  -- ---- Upper Pull : lats, mid-back, rear delts, traps, biceps, forearms ----
  if not exists (select 1 from workout_templates where user_id = p_uid and name = 'Upper Pull') then
    insert into workout_templates (user_id, name, type, notes, position)
    values (p_uid, 'Upper Pull', 'gym',
            'Dumbbell pull — lats, upper back, rear delts, traps & biceps. 3 sets, 9–12 reps.', 1)
    returning id into t_id;

    insert into template_exercises
      (template_id, exercise_id, name, target, position, default_sets, default_reps, default_weight_lb)
    values
      (t_id, (select id from exercises where name='Single-Arm DB Row'     and user_id is null limit 1), 'Single-Arm DB Row',     'Lats',              0, 3, 10, 40),
      (t_id, (select id from exercises where name='Chest-Supported DB Row' and user_id is null limit 1),'Chest-Supported DB Row','Upper back',        1, 3, 10, 30),
      (t_id, (select id from exercises where name='Rear Delt Fly'         and user_id is null limit 1), 'Rear Delt Fly',         'Rear delts',        2, 3, 12, 12),
      (t_id, (select id from exercises where name='Dumbbell Shrug'        and user_id is null limit 1), 'Dumbbell Shrug',        'Traps',             3, 3, 12, 45),
      (t_id, (select id from exercises where name='Dumbbell Curl'         and user_id is null limit 1), 'Dumbbell Curl',         'Biceps',            4, 3, 10, 25),
      (t_id, (select id from exercises where name='Hammer Curl'          and user_id is null limit 1), 'Hammer Curl',           'Biceps · forearms', 5, 3, 12, 20);
  end if;

  -- ---- Leg : quads, hamstrings, glutes, calves ----
  if not exists (select 1 from workout_templates where user_id = p_uid and name = 'Leg') then
    insert into workout_templates (user_id, name, type, notes, position)
    values (p_uid, 'Leg', 'gym',
            'Dumbbell legs — quads, hamstrings, glutes & calves. 3 sets, 9–12 reps.', 2)
    returning id into t_id;

    insert into template_exercises
      (template_id, exercise_id, name, target, position, default_sets, default_reps, default_weight_lb)
    values
      (t_id, (select id from exercises where name='Goblet Squat'               and user_id is null limit 1), 'Goblet Squat',               'Quads · glutes',      0, 3, 10, 45),
      (t_id, (select id from exercises where name='Dumbbell Romanian Deadlift' and user_id is null limit 1), 'Dumbbell Romanian Deadlift', 'Hamstrings',          1, 3, 10, 40),
      (t_id, (select id from exercises where name='Bulgarian Split Squat'      and user_id is null limit 1), 'Bulgarian Split Squat',      'Quads · glutes',      2, 3, 10, 25),
      (t_id, (select id from exercises where name='Walking Lunge'              and user_id is null limit 1), 'Walking Lunge',              'Quads · glutes',      3, 3, 12, 25),
      (t_id, (select id from exercises where name='Dumbbell Hip Thrust'        and user_id is null limit 1), 'Dumbbell Hip Thrust',        'Glutes · hamstrings', 4, 3, 12, 40),
      (t_id, (select id from exercises where name='Dumbbell Calf Raise'        and user_id is null limit 1), 'Dumbbell Calf Raise',        'Calves',              5, 3, 12, 35);
  end if;
end $$;

-- Thin wrapper the app can call over RPC (seeds the signed-in user).
create or replace function public.seed_starter_templates()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;
  perform public.seed_starter_templates_for(auth.uid());
end $$;

revoke all on function public.seed_starter_templates() from public;
grant execute on function public.seed_starter_templates() to authenticated;

-- ---------------------------------------------------------------------------
-- 3) Backfill: seed the routines for every existing account right now.
-- ---------------------------------------------------------------------------
do $$
declare
  u record;
begin
  for u in select id from auth.users loop
    perform public.seed_starter_templates_for(u.id);
  end loop;
end $$;

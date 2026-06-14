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

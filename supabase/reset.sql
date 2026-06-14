-- ============================================================================
-- Pulse — RESET TO A BRAND-NEW APP
-- ----------------------------------------------------------------------------
-- Deletes every account and ALL user data. The shared global exercise library
-- (exercises where user_id is null) is preserved, because every user-owned
-- table cascades from auth.users on delete:
--   profiles, exercises(user_id), workouts -> workout_exercises -> sets,
--   workout_templates -> template_exercises, user_exercise_prefs,
--   body_metrics, body_measurements
--
-- Run this in the Supabase SQL Editor. THIS CANNOT BE UNDONE.
-- ============================================================================

delete from auth.users;

-- (optional) verify what's left — should show only global library rows:
-- select count(*) as users from auth.users;            -- expect 0
-- select count(*) as global_exercises from public.exercises where user_id is null;
-- select count(*) as workouts from public.workouts;    -- expect 0

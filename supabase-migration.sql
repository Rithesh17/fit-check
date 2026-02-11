-- Migration Script: Update exercises table to use TEXT for id
-- Run this if you already created tables with the old UUID schema

-- Step 1: Drop the foreign key constraint from workout_exercises
ALTER TABLE IF EXISTS workout_exercises 
  DROP CONSTRAINT IF EXISTS workout_exercises_exercise_id_fkey;

-- Step 2: Drop the exercises table (this will cascade to workout_exercises if data exists)
-- WARNING: This will delete all existing data in exercises and workout_exercises tables
-- If you have important data, back it up first!
DROP TABLE IF EXISTS workout_exercises CASCADE;
DROP TABLE IF EXISTS exercises CASCADE;

-- Step 3: Recreate exercises table with TEXT id
CREATE TABLE exercises (
  id TEXT PRIMARY KEY, -- Using TEXT for readable IDs like 'bench-press'
  name TEXT NOT NULL,
  muscle_groups TEXT[] NOT NULL,
  equipment TEXT NOT NULL,
  default_sets INTEGER DEFAULT 3,
  default_reps INTEGER DEFAULT 10,
  default_rest_seconds INTEGER DEFAULT 60,
  instructions TEXT,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 4: Recreate workout_exercises table with TEXT exercise_id
CREATE TABLE workout_exercises (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workout_id UUID NOT NULL REFERENCES workouts(id) ON DELETE CASCADE,
  exercise_id TEXT NOT NULL REFERENCES exercises(id) ON DELETE CASCADE,
  exercise_order INTEGER NOT NULL,
  sets JSONB NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(workout_id, exercise_id, exercise_order)
);

-- Step 5: Recreate indexes
CREATE INDEX IF NOT EXISTS idx_workout_exercises_workout_id ON workout_exercises(workout_id);
CREATE INDEX IF NOT EXISTS idx_workout_exercises_exercise_id ON workout_exercises(exercise_id);
CREATE INDEX IF NOT EXISTS idx_exercises_muscle_groups ON exercises USING GIN(muscle_groups);

-- Step 6: Recreate RLS policies
ALTER TABLE exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_exercises ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all operations on exercises" ON exercises FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on workout_exercises" ON workout_exercises FOR ALL USING (true) WITH CHECK (true);

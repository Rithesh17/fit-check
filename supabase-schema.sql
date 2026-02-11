-- Fit-Check Database Schema for Supabase
-- Run this in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Exercises table (pre-populated library)
CREATE TABLE IF NOT EXISTS exercises (
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

-- Workouts table
CREATE TABLE IF NOT EXISTS workouts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT,
  date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  duration_minutes INTEGER,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Workout exercises (junction table for exercises in a workout)
CREATE TABLE IF NOT EXISTS workout_exercises (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workout_id UUID NOT NULL REFERENCES workouts(id) ON DELETE CASCADE,
  exercise_id TEXT NOT NULL REFERENCES exercises(id) ON DELETE CASCADE, -- Changed to TEXT to match exercises.id
  exercise_order INTEGER NOT NULL,
  sets JSONB NOT NULL, -- Array of {reps: number, weight: number, rest: number, completed: boolean}
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(workout_id, exercise_id, exercise_order)
);

-- Body metrics table (for weight loss tracking)
CREATE TABLE IF NOT EXISTS body_metrics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  weight_kg DECIMAL(5,2),
  body_fat_percentage DECIMAL(4,2),
  measurements JSONB, -- {chest, waist, hips, arms, thighs, etc.}
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(date)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_workouts_date ON workouts(date DESC);
CREATE INDEX IF NOT EXISTS idx_workout_exercises_workout_id ON workout_exercises(workout_id);
CREATE INDEX IF NOT EXISTS idx_workout_exercises_exercise_id ON workout_exercises(exercise_id);
CREATE INDEX IF NOT EXISTS idx_body_metrics_date ON body_metrics(date DESC);
CREATE INDEX IF NOT EXISTS idx_exercises_muscle_groups ON exercises USING GIN(muscle_groups);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at
CREATE TRIGGER update_workouts_updated_at
  BEFORE UPDATE ON workouts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS) - Since it's single user, we can disable or set permissive policies
ALTER TABLE exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE workouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE body_metrics ENABLE ROW LEVEL SECURITY;

-- Permissive policies (since it's single user, allow all operations)
CREATE POLICY "Allow all operations on exercises" ON exercises FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on workouts" ON workouts FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on workout_exercises" ON workout_exercises FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on body_metrics" ON body_metrics FOR ALL USING (true) WITH CHECK (true);

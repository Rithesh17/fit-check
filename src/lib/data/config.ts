/**
 * Single source of truth for all app-wide constants, defaults, and enums.
 * Every magic number, option list, and configuration value lives here.
 * Import from this file — never define constants inline elsewhere.
 */

// ─── Workout session defaults ─────────────────────────────────────────────────
export const DEFAULT_REST_BETWEEN_EXERCISES = 90;    // seconds
export const DEFAULT_REST_BETWEEN_SETS = 60;         // seconds
export const DEFAULT_SETS = 3;
export const DEFAULT_REPS = 10;
export const DEFAULT_CARDIO_DURATION_MINUTES = 20;
export const DEFAULT_STRETCH_DURATION_SECONDS = 30;
export const DEFAULT_STRETCH_REPS = 3;

// ─── Pagination & list limits ─────────────────────────────────────────────────
export const WORKOUT_HISTORY_PAGE_SIZE = 20;
export const EXERCISE_LIBRARY_PAGE_SIZE = 20;
export const RECENT_EXERCISES_LIMIT = 8;
export const RECENT_WORKOUTS_LIMIT = 3;

// ─── Active workout store ─────────────────────────────────────────────────────
export const ACTIVE_WORKOUT_SCHEMA_VERSION = 4;
export const ACTIVE_WORKOUT_STORAGE_KEY = 'activeWorkout';

// ─── Timer / sound ────────────────────────────────────────────────────────────
export const REST_TIMER_BEEP_FREQUENCY = 800;        // Hz
export const REST_TIMER_BEEP_DURATION = 0.2;         // seconds

// ─── Exercise types ───────────────────────────────────────────────────────────
export const EXERCISE_TYPES = ['weights', 'bodyweight', 'cardio', 'stretches'] as const;
export type ExerciseTypeConst = typeof EXERCISE_TYPES[number];

// ─── Muscle groups ────────────────────────────────────────────────────────────
export const MUSCLE_GROUPS = [
	'chest',
	'back',
	'shoulders',
	'biceps',
	'triceps',
	'forearms',
	'quadriceps',
	'hamstrings',
	'glutes',
	'calves',
	'core',
	'other'
] as const;
export type MuscleGroupConst = typeof MUSCLE_GROUPS[number];

// ─── Mood options ─────────────────────────────────────────────────────────────
export const MOOD_OPTIONS = ['great', 'good', 'okay', 'tired', 'bad'] as const;
export type MoodOption = typeof MOOD_OPTIONS[number];

// ─── Energy level ─────────────────────────────────────────────────────────────
export const ENERGY_LEVEL_MIN = 1;
export const ENERGY_LEVEL_MAX = 5;

// ─── Workout modes ────────────────────────────────────────────────────────────
export const WORKOUT_MODES = ['straight', 'circuit'] as const;
export type WorkoutMode = typeof WORKOUT_MODES[number];

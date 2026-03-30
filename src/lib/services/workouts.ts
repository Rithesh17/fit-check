import { supabase } from '$lib/supabase/client';

export interface WorkoutInsert {
	name: string;
	date: string;
	duration_minutes: number;
	notes?: string | null;
	energy_level?: number | null;
	mood?: string | null;
}

export interface WorkoutExerciseInsert {
	exercise_id: string;
	exercise_order: number;
	sets: unknown;
}

export interface RecentWorkout {
	id: string;
	name: string | null;
	date: string;
	duration_minutes: number | null;
	exercise_count: number;
}

/**
 * Save a completed workout session and its exercises to Supabase.
 * Returns the new workout ID.
 */
export async function saveWorkout(
	workout: WorkoutInsert,
	exercises: WorkoutExerciseInsert[]
): Promise<string> {
	const { data, error } = await supabase
		.from('workouts')
		.insert(workout as any)
		.select('id')
		.single();

	if (error) throw error;
	const id = (data as { id: string }).id;

	if (exercises.length > 0) {
		const { error: exError } = await supabase
			.from('workout_exercises')
			.insert(exercises.map((ex) => ({ ...ex, workout_id: id })) as any);

		if (exError) throw exError;
	}

	return id;
}

export async function loadRecentWorkouts(limit = 20): Promise<RecentWorkout[]> {
	const { data, error } = await supabase
		.from('workouts')
		.select('id, name, date, duration_minutes, workout_exercises(count)')
		.order('date', { ascending: false })
		.limit(limit);

	if (error) throw error;

	return (data || []).map((w: any) => ({
		id: w.id,
		name: w.name,
		date: w.date,
		duration_minutes: w.duration_minutes,
		exercise_count: Array.isArray(w.workout_exercises) ? w.workout_exercises.length : 0
	}));
}

/**
 * Fetch the most recent logged set data for a given exercise.
 * Used for previous-set autofill on the active workout screen.
 */
export async function getLastSetsForExercise(
	exerciseId: string
): Promise<Array<{ reps: number; weight: number }> | null> {
	const { data, error } = await supabase
		.from('workout_exercises')
		.select('sets')
		.eq('exercise_id', exerciseId)
		.order('created_at', { ascending: false })
		.limit(1)
		.maybeSingle();

	if (error || !data) return null;

	const sets = data.sets as any;
	if (!Array.isArray(sets)) return null;

	return sets.map((s: any) => ({ reps: s.reps ?? 0, weight: s.weight ?? 0 }));
}

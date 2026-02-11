/**
 * Exercise Overrides Utility
 * Handles merging default exercises with user overrides
 */

import { supabase } from '$lib/supabase/client';
import type { Exercise } from '$lib/data/exercises';

export interface ExerciseOverride {
	id: string;
	exercise_id: string;
	default_sets?: number | null;
	default_reps?: number | null;
	default_rest_seconds?: number | null;
	instructions?: string | null;
	video_url?: string | null;
	created_at: string;
	updated_at: string;
}

/**
 * Get user override for a specific exercise
 */
export async function getExerciseOverride(exerciseId: string): Promise<ExerciseOverride | null> {
	try {
		const { data, error } = await supabase
			.from('user_exercise_overrides')
			.select('*')
			.eq('exercise_id', exerciseId)
			.single();

		if (error && error.code !== 'PGRST116') {
			// PGRST116 is "not found" which is fine
			console.error('Error fetching exercise override:', error);
			return null;
		}

		return data || null;
	} catch (error) {
		console.error('Error fetching exercise override:', error);
		return null;
	}
}

/**
 * Get all user overrides
 */
export async function getAllExerciseOverrides(): Promise<Map<string, ExerciseOverride>> {
	try {
		const { data, error } = await supabase.from('user_exercise_overrides').select('*');

		if (error) {
			console.error('Error fetching exercise overrides:', error);
			return new Map();
		}

		const overrideMap = new Map<string, ExerciseOverride>();
		(data || []).forEach((override) => {
			overrideMap.set(override.exercise_id, override);
		});

		return overrideMap;
	} catch (error) {
		console.error('Error fetching exercise overrides:', error);
		return new Map();
	}
}

/**
 * Merge default exercise with user override
 * Returns a new exercise object with override values applied
 */
export function mergeExerciseWithOverride(
	defaultExercise: Exercise,
	override: ExerciseOverride | null
): Exercise {
	if (!override) {
		return defaultExercise;
	}

	return {
		...defaultExercise,
		defaultSets: override.default_sets ?? defaultExercise.defaultSets,
		defaultReps: override.default_reps ?? defaultExercise.defaultReps,
		defaultRestSeconds: override.default_rest_seconds ?? defaultExercise.defaultRestSeconds,
		instructions: override.instructions ?? defaultExercise.instructions,
		videoUrl: override.video_url ?? defaultExercise.videoUrl
	};
}

/**
 * Save or update exercise override
 */
export async function saveExerciseOverride(
	exerciseId: string,
	override: {
		default_sets?: number;
		default_reps?: number;
		default_rest_seconds?: number;
		instructions?: string;
		video_url?: string;
	}
): Promise<ExerciseOverride | null> {
	try {
		// Check if override exists
		const existing = await getExerciseOverride(exerciseId);

		if (existing) {
			// Update existing override
			const { data, error } = await supabase
				.from('user_exercise_overrides')
				.update(override)
				.eq('exercise_id', exerciseId)
				.select()
				.single();

			if (error) throw error;
			return data;
		} else {
			// Create new override
			const { data, error } = await supabase
				.from('user_exercise_overrides')
				.insert({
					exercise_id: exerciseId,
					...override
				})
				.select()
				.single();

			if (error) throw error;
			return data;
		}
	} catch (error) {
		console.error('Error saving exercise override:', error);
		throw error;
	}
}

/**
 * Delete exercise override
 */
export async function deleteExerciseOverride(exerciseId: string): Promise<boolean> {
	try {
		const { error } = await supabase
			.from('user_exercise_overrides')
			.delete()
			.eq('exercise_id', exerciseId);

		if (error) throw error;
		return true;
	} catch (error) {
		console.error('Error deleting exercise override:', error);
		return false;
	}
}

/**
 * Check if exercise has an override
 */
export async function hasExerciseOverride(exerciseId: string): Promise<boolean> {
	const override = await getExerciseOverride(exerciseId);
	return override !== null;
}

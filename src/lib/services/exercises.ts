import { supabase } from '$lib/supabase/client';
import type { Exercise, ExerciseType } from '$lib/data/exercises';

export type CustomExercise = Exercise & { isCustom: boolean };

export async function loadCustomExercises(): Promise<CustomExercise[]> {
	try {
		const { data, error } = await supabase
			.from('user_exercises')
			.select('*')
			.order('created_at', { ascending: false });

		if (error) {
			console.error('Error loading custom exercises:', error);
			return [];
		}

		return (data || []).map((ex: any): CustomExercise => ({
			id: ex.id,
			name: ex.name,
			exerciseType: (ex.exercise_type || 'weights') as ExerciseType,
			primaryMuscleGroup: (ex.muscle_groups || [])[0] || 'other',
			muscleGroups: ex.muscle_groups || [],
			equipment: ex.equipment,
			defaultSets: ex.default_sets ?? undefined,
			defaultReps: ex.default_reps ?? undefined,
			defaultRestSeconds: ex.default_rest_seconds ?? undefined,
			defaultDurationMinutes: ex.default_duration_minutes ?? undefined,
			defaultCalories: ex.default_calories ?? undefined,
			defaultDurationSeconds: ex.default_duration_seconds ?? undefined,
			defaultRepsStretches: ex.default_reps_stretches ?? undefined,
			instructions: ex.instructions || '',
			videoUrl: ex.video_url || undefined,
			isCustom: true
		}));
	} catch (error) {
		console.error('Error loading custom exercises:', error);
		return [];
	}
}

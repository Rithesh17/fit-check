/**
 * Get recently used exercises from workout history
 */

import { supabase } from '$lib/supabase/client';
import type { Exercise } from '$lib/data/exercises';

export interface RecentExercise {
	exerciseId: string;
	exerciseName: string;
	lastUsed: Date;
	useCount: number;
}

/**
 * Get recently used exercises (last 30 days, top 10 by frequency)
 */
export async function getRecentExercises(limit: number = 10): Promise<RecentExercise[]> {
	try {
		const thirtyDaysAgo = new Date();
		thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

		// Get workout exercises from last 30 days
		const { data: workouts, error: workoutsError } = await supabase
			.from('workouts')
			.select('id, date')
			.gte('date', thirtyDaysAgo.toISOString())
			.order('date', { ascending: false });

		if (workoutsError) throw workoutsError;
		if (!workouts || workouts.length === 0) return [];

		const workoutIds = workouts.map((w) => w.id);

		// Get exercise usage
		const { data: workoutExercises, error: exercisesError } = await supabase
			.from('workout_exercises')
			.select('exercise_id')
			.in('workout_id', workoutIds);

		if (exercisesError) throw exercisesError;
		if (!workoutExercises || workoutExercises.length === 0) return [];

		// Count exercise usage and find last used date
		const exerciseMap = new Map<string, { count: number; lastUsed: Date }>();

		workoutExercises.forEach((we) => {
			const exerciseId = we.exercise_id as string;
			const workout = workouts.find((w) => w.id === we.workout_id);
			const workoutDate = workout ? new Date(workout.date) : new Date();

			if (!exerciseMap.has(exerciseId)) {
				exerciseMap.set(exerciseId, { count: 0, lastUsed: workoutDate });
			}

			const entry = exerciseMap.get(exerciseId)!;
			entry.count++;
			if (workoutDate > entry.lastUsed) {
				entry.lastUsed = workoutDate;
			}
		});

		// Convert to array and sort by frequency, then by last used
		const recentExercises: RecentExercise[] = Array.from(exerciseMap.entries())
			.map(([exerciseId, data]) => ({
				exerciseId,
				exerciseName: exerciseId, // Will be resolved to actual name later
				lastUsed: data.lastUsed,
				useCount: data.count
			}))
			.sort((a, b) => {
				// Sort by frequency first, then by last used
				if (b.useCount !== a.useCount) {
					return b.useCount - a.useCount;
				}
				return b.lastUsed.getTime() - a.lastUsed.getTime();
			})
			.slice(0, limit);

		return recentExercises;
	} catch (error) {
		console.error('Error fetching recent exercises:', error);
		return [];
	}
}

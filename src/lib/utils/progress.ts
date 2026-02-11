/**
 * Progress Calculation Utilities
 * Calculate strength progression, volume, and personal records
 */

import type { Exercise } from '$lib/data/exercises';

export interface ExerciseProgress {
	exerciseId: string;
	exerciseName: string;
	dates: Date[];
	weights: number[]; // Max weight per workout
	volumes: number[]; // Total volume per workout
	reps: number[]; // Max reps per workout
	personalRecord: {
		weight: number;
		date: Date;
		reps: number;
	} | null;
}

export interface WorkoutVolume {
	date: Date;
	totalVolume: number; // Total kg lifted
	exerciseCount: number;
}

/**
 * Calculate exercise-specific progress from workout data
 */
export function calculateExerciseProgress(
	exerciseId: string,
	exerciseName: string,
	workoutData: Array<{
		date: string;
		sets: Array<{ reps: number; weight: number; completed: boolean }>;
	}>
): ExerciseProgress {
	if (workoutData.length === 0) {
		return {
			exerciseId,
			exerciseName,
			dates: [],
			weights: [],
			volumes: [],
			reps: [],
			personalRecord: null
		};
	}

	const dates: Date[] = [];
	const weights: number[] = [];
	const volumes: number[] = [];
	const reps: number[] = [];

	let maxWeight = 0;
	let maxWeightDate: Date | null = null;
	let maxWeightReps = 0;

	workoutData.forEach((workout) => {
		const date = new Date(workout.date);
		const completedSets = workout.sets.filter((set) => set.completed);

		if (completedSets.length === 0) return;

		// Calculate max weight and volume for this workout
		const workoutMaxWeight = Math.max(...completedSets.map((set) => set.weight));
		const workoutVolume = completedSets.reduce((sum, set) => sum + set.reps * set.weight, 0);
		const workoutMaxReps = Math.max(...completedSets.map((set) => set.reps));

		dates.push(date);
		weights.push(workoutMaxWeight);
		volumes.push(workoutVolume);
		reps.push(workoutMaxReps);

		// Track personal record
		if (workoutMaxWeight > maxWeight) {
			maxWeight = workoutMaxWeight;
			maxWeightDate = date;
			maxWeightReps = workoutMaxReps;
		}
	});

	return {
		exerciseId,
		exerciseName,
		dates,
		weights,
		volumes,
		reps,
		personalRecord:
			maxWeightDate && maxWeight > 0
				? {
						weight: maxWeight,
						date: maxWeightDate,
						reps: maxWeightReps
					}
				: null
	};
}

/**
 * Calculate total volume per workout
 */
export function calculateWorkoutVolumes(
	workoutData: Array<{
		date: string;
		exercises: Array<{
			sets: Array<{ reps: number; weight: number; completed: boolean }>;
		}>;
	}>
): WorkoutVolume[] {
	return workoutData.map((workout) => {
		const totalVolume = workout.exercises.reduce((workoutSum, exercise) => {
			const exerciseVolume = exercise.sets
				.filter((set) => set.completed)
				.reduce((sum, set) => sum + set.reps * set.weight, 0);
			return workoutSum + exerciseVolume;
		}, 0);

		return {
			date: new Date(workout.date),
			totalVolume,
			exerciseCount: workout.exercises.length
		};
	});
}

/**
 * Get personal records for all exercises
 */
export function getPersonalRecords(
	exerciseProgress: ExerciseProgress[]
): Array<{
	exerciseName: string;
	weight: number;
	reps: number;
	date: Date;
}> {
	return exerciseProgress
		.filter((progress) => progress.personalRecord !== null)
		.map((progress) => ({
			exerciseName: progress.exerciseName,
			weight: progress.personalRecord!.weight,
			reps: progress.personalRecord!.reps,
			date: progress.personalRecord!.date
		}))
		.sort((a, b) => b.date.getTime() - a.date.getTime());
}

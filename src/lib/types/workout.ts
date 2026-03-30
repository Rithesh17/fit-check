import type { Exercise } from '$lib/data/exercises';

export type WorkoutSet = {
	reps: number;
	weight: number;
	rest: number;
	completed: boolean;
	notes?: string;
	durationSeconds?: number;
};

export type WorkoutExercise =
	| {
			exercise: Exercise;
			exerciseType: 'weights' | 'bodyweight';
			sets: WorkoutSet[];
	  }
	| {
			exercise: Exercise;
			exerciseType: 'cardio';
			durationMinutes: number;
			calories: number;
			completed: boolean;
	  }
	| {
			exercise: Exercise;
			exerciseType: 'stretches';
			durationSeconds: number;
			reps: number;
			completed: boolean;
	  };

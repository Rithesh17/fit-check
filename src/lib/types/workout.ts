import type { Exercise } from '$lib/data/exercises';

export type WorkoutSet = {
	reps: number;
	weight: number;
	rest: number;
	completed: boolean;
	notes?: string;
	durationSeconds?: number;
};

/**
 * One alternative within a workout slot.
 * The union covers all exercise types.
 */
export type SlotAlternative =
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

/**
 * A slot is one position in the workout.
 * alternatives[0] is the primary; the rest are fallbacks the user can choose from.
 * chosenIndex is set when the user picks during an active workout.
 */
export type WorkoutSlot = {
	alternatives: SlotAlternative[];
	chosenIndex?: number;
};

/**
 * Active Workout Store
 *
 * Single source of truth for an in-progress workout session.
 * Backs itself with sessionStorage so hard-refreshes on /workout/active
 * don't lose the current session.
 */

import { writable } from 'svelte/store';
import {
	ACTIVE_WORKOUT_SCHEMA_VERSION,
	ACTIVE_WORKOUT_STORAGE_KEY,
	DEFAULT_REST_BETWEEN_EXERCISES,
	type WorkoutMode
} from '$lib/data/config';

export type ActiveWorkoutSet = {
	reps: number;
	weight: number;
	rest: number;
	completed: boolean;
	notes?: string;
	durationSeconds?: number;
};

export type ActiveSlotAlternative =
	| {
			exerciseId: string;
			exerciseName?: string;
			exerciseType: 'weights' | 'bodyweight';
			sets: ActiveWorkoutSet[];
	  }
	| {
			exerciseId: string;
			exerciseName?: string;
			exerciseType: 'cardio';
			durationMinutes: number;
			calories: number;
			completed: boolean;
	  }
	| {
			exerciseId: string;
			exerciseName?: string;
			exerciseType: 'stretches';
			durationSeconds: number;
			reps: number;
			completed: boolean;
	  };

/**
 * A slot is one position in the workout.
 * It carries 1..N alternatives; chosenIndex is null until the user picks one.
 * Single-alternative slots skip the picker and go straight to logging.
 */
export type ActiveWorkoutSlot = {
	alternatives: ActiveSlotAlternative[];
	chosenIndex: number | null; // null = not yet chosen (picker will show)
};

export type ActiveWorkoutPayload = {
	name: string;
	notes: string;
	energyLevel: number | null;
	mood: string;
	restDurationBetweenExercises: number;
	workoutMode: WorkoutMode;
	slots: ActiveWorkoutSlot[];
};

type StoredPayload = ActiveWorkoutPayload & { schemaVersion: number };

function restoreFromStorage(): ActiveWorkoutPayload | null {
	if (typeof window === 'undefined') return null;
	try {
		const stored = sessionStorage.getItem(ACTIVE_WORKOUT_STORAGE_KEY);
		if (!stored) return null;
		const parsed = JSON.parse(stored) as StoredPayload;
		if (parsed.schemaVersion !== ACTIVE_WORKOUT_SCHEMA_VERSION) {
			sessionStorage.removeItem(ACTIVE_WORKOUT_STORAGE_KEY);
			return null;
		}
		return parsed;
	} catch {
		sessionStorage.removeItem(ACTIVE_WORKOUT_STORAGE_KEY);
		return null;
	}
}

function createActiveWorkoutStore() {
	const { subscribe, set, update } = writable<ActiveWorkoutPayload | null>(restoreFromStorage());

	function persist(payload: ActiveWorkoutPayload) {
		if (typeof window !== 'undefined') {
			const toStore: StoredPayload = { ...payload, schemaVersion: ACTIVE_WORKOUT_SCHEMA_VERSION };
			sessionStorage.setItem(ACTIVE_WORKOUT_STORAGE_KEY, JSON.stringify(toStore));
		}
	}

	return {
		subscribe,
		start(payload: ActiveWorkoutPayload) {
			persist(payload);
			set(payload);
		},
		update(fn: (p: ActiveWorkoutPayload) => ActiveWorkoutPayload) {
			update((current) => {
				if (!current) return current;
				const next = fn(current);
				persist(next);
				return next;
			});
		},
		clear() {
			if (typeof window !== 'undefined') {
				sessionStorage.removeItem(ACTIVE_WORKOUT_STORAGE_KEY);
			}
			set(null);
		}
	};
}

export const activeWorkout = createActiveWorkoutStore();

/** Convenience: build a default payload with sensible values */
export function buildDefaultPayload(overrides: Partial<ActiveWorkoutPayload> = {}): ActiveWorkoutPayload {
	return {
		name: '',
		notes: '',
		energyLevel: null,
		mood: '',
		restDurationBetweenExercises: DEFAULT_REST_BETWEEN_EXERCISES,
		workoutMode: 'straight',
		slots: [],
		...overrides
	};
}

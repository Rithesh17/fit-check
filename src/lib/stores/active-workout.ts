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
	exerciseId: string;    // which exercise this set was performed with
	exerciseName: string;  // display name (denormalised for fast rendering)
	notes?: string;
	durationSeconds?: number;
};

/**
 * An alternative is now pure exercise metadata — no sets stored here.
 * Sets live at the slot level (ActiveWorkoutSlot.sets) and each set
 * carries its own exerciseId so swapping mid-slot is lossless.
 */
export type ActiveSlotAlternative =
	| {
			exerciseId: string;
			exerciseName?: string;
			exerciseType: 'weights' | 'bodyweight';
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
 * - alternatives: pool of exercises the user can pick from (pills).
 * - currentExerciseIndex: which alternative is active for upcoming sets.
 * - sets: the actual logged sets. Each set knows which exercise it used,
 *   so switching alternatives mid-slot is non-destructive.
 */
export type ActiveWorkoutSlot = {
	alternatives: ActiveSlotAlternative[];
	currentExerciseIndex: number;
	sets: ActiveWorkoutSet[]; // weights/bodyweight only; empty for cardio/stretches
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

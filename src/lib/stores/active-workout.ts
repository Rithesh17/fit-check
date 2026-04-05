/**
 * Active Workout Store
 *
 * Single source of truth for an in-progress workout session.
 * Backs itself with sessionStorage so hard-refreshes on /workout/active
 * don't lose the current session.
 */

import { writable } from 'svelte/store';

const SCHEMA_VERSION = 2;

export type ActiveWorkoutSet = {
	reps: number;
	weight: number;
	rest: number;
	completed: boolean;
	notes?: string;
	durationSeconds?: number;
};

export type ActiveWorkoutExercise =
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

export type ActiveWorkoutPayload = {
	name: string;
	notes: string;
	energyLevel: number | null;
	mood: string;
	restDurationBetweenExercises: number;
	exercises: ActiveWorkoutExercise[];
};

const STORAGE_KEY = 'activeWorkout';

type StoredPayload = ActiveWorkoutPayload & { schemaVersion: number };

function restoreFromStorage(): ActiveWorkoutPayload | null {
	if (typeof window === 'undefined') return null;
	try {
		const stored = sessionStorage.getItem(STORAGE_KEY);
		if (!stored) return null;
		const parsed = JSON.parse(stored) as StoredPayload;
		if (parsed.schemaVersion !== SCHEMA_VERSION) {
			sessionStorage.removeItem(STORAGE_KEY);
			return null;
		}
		return parsed;
	} catch {
		sessionStorage.removeItem(STORAGE_KEY);
		return null;
	}
}

function createActiveWorkoutStore() {
	const { subscribe, set } = writable<ActiveWorkoutPayload | null>(restoreFromStorage());

	return {
		subscribe,
		start(payload: ActiveWorkoutPayload) {
			if (typeof window !== 'undefined') {
				const toStore: StoredPayload = { ...payload, schemaVersion: SCHEMA_VERSION };
				sessionStorage.setItem(STORAGE_KEY, JSON.stringify(toStore));
			}
			set(payload);
		},
		clear() {
			if (typeof window !== 'undefined') {
				sessionStorage.removeItem(STORAGE_KEY);
			}
			set(null);
		}
	};
}

export const activeWorkout = createActiveWorkoutStore();

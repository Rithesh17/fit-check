/**
 * Active Workout Store
 *
 * Single source of truth for an in-progress workout session.
 * Backs itself with sessionStorage so hard-refreshes on /workout/active
 * don't lose the current session.
 */

import { writable } from 'svelte/store';

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
			exerciseType: 'weights' | 'bodyweight';
			sets: ActiveWorkoutSet[];
	  }
	| {
			exerciseId: string;
			exerciseType: 'cardio';
			durationMinutes: number;
			calories: number;
			completed: boolean;
	  }
	| {
			exerciseId: string;
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

function restoreFromStorage(): ActiveWorkoutPayload | null {
	if (typeof window === 'undefined') return null;
	try {
		const stored = sessionStorage.getItem(STORAGE_KEY);
		return stored ? (JSON.parse(stored) as ActiveWorkoutPayload) : null;
	} catch {
		return null;
	}
}

function createActiveWorkoutStore() {
	const { subscribe, set } = writable<ActiveWorkoutPayload | null>(restoreFromStorage());

	return {
		subscribe,
		start(payload: ActiveWorkoutPayload) {
			if (typeof window !== 'undefined') {
				sessionStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
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

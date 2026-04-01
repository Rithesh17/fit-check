import { writable } from 'svelte/store';

export interface Goal {
	id: string;
	type: 'exercise' | 'weight';
	exerciseId?: string;
	exerciseName?: string;
	targetValue: number; // always stored in kg
	targetDate?: string; // ISO date string e.g. "2026-06-01"
	createdAt: string;
}

const STORAGE_KEY = 'fit-check-goals';

function getStoredGoals(): Goal[] {
	if (typeof window === 'undefined') return [];
	try {
		const stored = localStorage.getItem(STORAGE_KEY);
		return stored ? JSON.parse(stored) : [];
	} catch {
		return [];
	}
}

function createGoalsStore() {
	const { subscribe, update } = writable<Goal[]>(getStoredGoals());

	function persist(goals: Goal[]) {
		if (typeof window !== 'undefined') {
			localStorage.setItem(STORAGE_KEY, JSON.stringify(goals));
		}
	}

	return {
		subscribe,
		addGoal(goal: Omit<Goal, 'id' | 'createdAt'>) {
			update((goals) => {
				const next = [
					...goals,
					{ ...goal, id: crypto.randomUUID(), createdAt: new Date().toISOString() }
				];
				persist(next);
				return next;
			});
		},
		deleteGoal(id: string) {
			update((goals) => {
				const next = goals.filter((g) => g.id !== id);
				persist(next);
				return next;
			});
		}
	};
}

export const goals = createGoalsStore();

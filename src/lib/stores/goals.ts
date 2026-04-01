import { writable } from 'svelte/store';
import { supabase } from '$lib/supabase/client';

export interface Goal {
	id: string;
	type: 'exercise' | 'weight';
	exerciseId?: string;
	exerciseName?: string;
	targetValue: number; // always stored in kg
	targetDate?: string; // ISO date string e.g. "2026-06-01"
	createdAt: string;
}

function rowToGoal(row: any): Goal {
	return {
		id: row.id,
		type: row.type,
		exerciseId: row.exercise_id ?? undefined,
		exerciseName: row.exercise_name ?? undefined,
		targetValue: row.target_value,
		targetDate: row.target_date ?? undefined,
		createdAt: row.created_at
	};
}

async function fetchGoals(): Promise<Goal[]> {
	const { data, error } = await supabase
		.from('goals')
		.select('*')
		.order('created_at', { ascending: false });

	if (error || !data) return [];
	return data.map(rowToGoal);
}

function createGoalsStore() {
	const { subscribe, update, set } = writable<Goal[]>([]);

	// Auto-load from Supabase on client
	if (typeof window !== 'undefined') {
		fetchGoals().then((g) => set(g));
	}

	return {
		subscribe,
		async addGoal(goal: Omit<Goal, 'id' | 'createdAt'>) {
			const { data, error } = await supabase
				.from('goals')
				.insert({
					type: goal.type,
					exercise_id: goal.exerciseId ?? null,
					exercise_name: goal.exerciseName ?? null,
					target_value: goal.targetValue,
					target_date: goal.targetDate ?? null
				})
				.select()
				.single();

			if (error || !data) {
				console.error('Failed to save goal', error);
				return;
			}

			update((goals) => [rowToGoal(data), ...goals]);
		},
		async deleteGoal(id: string) {
			await supabase.from('goals').delete().eq('id', id);
			update((goals) => goals.filter((g) => g.id !== id));
		}
	};
}

export const goals = createGoalsStore();

<script lang="ts">
	import { goto } from '$app/navigation';
	import { Calendar, Clock, Activity } from 'lucide-svelte';

	interface Workout {
		id: string;
		name: string | null;
		date: string;
		duration_minutes: number | null;
		exercise_count?: number;
	}

	let { workouts }: { workouts: Workout[] } = $props();

	function formatDate(dateString: string): string {
		const date = new Date(dateString);
		const today = new Date();
		const yesterday = new Date(today);
		yesterday.setDate(yesterday.getDate() - 1);

		// Normalize to midnight for comparison
		const dateMidnight = new Date(date);
		dateMidnight.setHours(0, 0, 0, 0);
		const todayMidnight = new Date(today);
		todayMidnight.setHours(0, 0, 0, 0);
		const yesterdayMidnight = new Date(yesterday);
		yesterdayMidnight.setHours(0, 0, 0, 0);

		if (dateMidnight.getTime() === todayMidnight.getTime()) {
			return 'Today';
		} else if (dateMidnight.getTime() === yesterdayMidnight.getTime()) {
			return 'Yesterday';
		} else {
			return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
		}
	}
</script>

<div class="space-y-3">
	{#each workouts as workout}
		<button
			onclick={() => goto(`/workout/${workout.id}`)}
			class="w-full fitness-card text-left hover:scale-[1.02] transition-transform"
		>
			<div class="flex items-start justify-between">
				<div class="flex-1">
					<div class="flex items-center gap-2 mb-2">
						<Calendar class="w-4 h-4 text-[var(--color-muted)]" />
						<span class="text-sm text-[var(--color-muted)]">{formatDate(workout.date)}</span>
					</div>
					<h3 class="text-lg font-semibold text-[var(--color-foreground)] mb-2">
						{workout.name || 'Workout'}
					</h3>
					<div class="flex items-center gap-4 text-sm text-[var(--color-muted)]">
						{#if workout.exercise_count !== undefined}
							<div class="flex items-center gap-1">
								<Activity class="w-4 h-4" />
								<span>{workout.exercise_count} exercise{workout.exercise_count !== 1 ? 's' : ''}</span>
							</div>
						{/if}
						{#if workout.duration_minutes}
							<div class="flex items-center gap-1">
								<Clock class="w-4 h-4" />
								<span>{workout.duration_minutes} min</span>
							</div>
						{/if}
					</div>
				</div>
			</div>
		</button>
	{/each}
</div>

<style>
	.fitness-card {
		background: var(--color-card);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-lg);
		padding: 1.5rem;
		transition: all var(--transition-normal);
	}

	.fitness-card:hover {
		background: var(--color-card-hover);
		border-color: var(--color-primary);
		transform: translateY(-2px);
		box-shadow: var(--shadow-md);
	}
</style>

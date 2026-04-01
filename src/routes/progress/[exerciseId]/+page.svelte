<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { supabase } from '$lib/supabase/client';
	import { getExerciseById } from '$lib/data/exercises';
	import { loadCustomExercises } from '$lib/services/exercises';
	import { calculateExerciseProgress, type ExerciseProgress } from '$lib/utils/progress';
	import { calculate1RM } from '$lib/utils/calculators';
	import { unitPreference } from '$lib/stores/unit-preference';
	import { formatWeight, convertWeight, getWeightUnitLabel } from '$lib/utils/weight-conversion';
	import StrengthChart from '$lib/components/StrengthChart.svelte';
	import { ArrowLeft, Award, TrendingUp, Dumbbell, BarChart2 } from 'lucide-svelte';

	const exerciseId = $derived($page.params.exerciseId);
	const currentUnit = $derived($unitPreference);

	let exerciseName = $state('');
	let progress = $state<ExerciseProgress | null>(null);
	let isLoading = $state(true);
	let chartType = $state<'weight' | 'volume'>('weight');

	interface SessionRow {
		date: string;
		maxWeight: number;
		volume: number;
		setsCompleted: number;
	}
	let sessions = $state<SessionRow[]>([]);

	const estimated1RM = $derived(
		progress?.personalRecord
			? calculate1RM(progress.personalRecord.weight, progress.personalRecord.reps)
			: 0
	);

	const totalVolume = $derived(sessions.reduce((sum, s) => sum + s.volume, 0));

	onMount(async () => {
		const customExercises = await loadCustomExercises();
		const found = getExerciseById(exerciseId) || customExercises.find((ce) => ce.id === exerciseId);

		if (!found) {
			goto('/progress');
			return;
		}

		exerciseName = found.name;

		const [{ data: workouts }, { data: workoutExercises }] = await Promise.all([
			supabase.from('workouts').select('id, date').order('date', { ascending: true }),
			supabase
				.from('workout_exercises')
				.select('workout_id, sets')
				.eq('exercise_id', exerciseId)
				.order('created_at', { ascending: true })
		]);

		if (!workouts || !workoutExercises) {
			isLoading = false;
			return;
		}

		const workoutDateMap = new Map((workouts as any[]).map((w) => [w.id, w.date]));

		const workoutData = (workoutExercises as any[])
			.map((we) => {
				const date = workoutDateMap.get(we.workout_id);
				if (!date) return null;
				return { date, sets: we.sets };
			})
			.filter((x): x is { date: string; sets: any } => x !== null);

		progress = calculateExerciseProgress(exerciseId, found.name, workoutData);

		// Build sessions table — most recent first
		sessions = [...workoutData].reverse().map((wd) => {
			const completedSets = Array.isArray(wd.sets) ? wd.sets.filter((s: any) => s.completed) : [];
			const maxWeight = completedSets.length
				? Math.max(...completedSets.map((s: any) => s.weight))
				: 0;
			const volume = completedSets.reduce((sum: number, s: any) => sum + s.weight * s.reps, 0);
			return { date: wd.date, maxWeight, volume, setsCompleted: completedSets.length };
		});

		isLoading = false;
	});

	function formatDate(dateString: string): string {
		return new Date(dateString).toLocaleDateString('en-US', {
			month: 'short',
			day: 'numeric',
			year: 'numeric'
		});
	}
</script>

<svelte:head>
	<title>{exerciseName || 'Exercise'} Progress - Fit Check</title>
</svelte:head>

<div class="min-h-screen bg-[var(--color-background)] pb-20">
	<!-- Header -->
	<div class="sticky top-0 z-10 bg-[var(--color-background)]/95 backdrop-blur-sm border-b border-[var(--color-border)]">
		<div class="max-w-md mx-auto px-4 py-4 flex items-center gap-3">
			<a href="/progress" class="text-[var(--color-muted)] hover:text-[var(--color-foreground)]">
				<ArrowLeft class="w-6 h-6" />
			</a>
			<h1 class="text-xl font-bold text-[var(--color-foreground)] truncate">
				{exerciseName || 'Loading...'}
			</h1>
		</div>
	</div>

	<div class="max-w-md mx-auto px-4 py-6 space-y-6">
		{#if isLoading}
			<div class="grid grid-cols-2 gap-4">
				{#each Array(4) as _}
					<div class="fitness-card animate-pulse h-24"></div>
				{/each}
			</div>
			<div class="fitness-card animate-pulse h-64"></div>
		{:else if !progress || progress.dates.length === 0}
			<div class="fitness-card text-center py-12">
				<Dumbbell class="w-12 h-12 text-[var(--color-muted)] mx-auto mb-3 opacity-50" />
				<p class="text-[var(--color-muted)]">No workout data for this exercise yet</p>
				<a href="/workout/new" class="inline-block mt-4 px-6 py-2 bg-[var(--gradient-primary)] text-white font-semibold rounded-lg">
					Start a Workout
				</a>
			</div>
		{:else}
			<!-- Stats Grid -->
			<div class="grid grid-cols-2 gap-4">
				<div class="fitness-card">
					<Award class="w-5 h-5 text-[var(--color-accent)] mb-2" />
					<p class="text-xs text-[var(--color-muted)] mb-1">Best Set</p>
					<p class="text-lg font-bold text-[var(--color-foreground)]">
						{formatWeight(progress.personalRecord!.weight, currentUnit)}
						<span class="text-sm font-normal text-[var(--color-muted)]">× {progress.personalRecord!.reps}</span>
					</p>
					<p class="text-xs text-[var(--color-muted)] mt-1">{formatDate(progress.personalRecord!.date.toISOString())}</p>
				</div>
				<div class="fitness-card">
					<TrendingUp class="w-5 h-5 text-[var(--color-primary)] mb-2" />
					<p class="text-xs text-[var(--color-muted)] mb-1">Est. 1RM</p>
					<p class="text-lg font-bold text-[var(--color-foreground)]">
						{formatWeight(estimated1RM, currentUnit)}
					</p>
					<p class="text-xs text-[var(--color-muted)] mt-1">Epley formula</p>
				</div>
				<div class="fitness-card">
					<Dumbbell class="w-5 h-5 text-[var(--color-secondary)] mb-2" />
					<p class="text-xs text-[var(--color-muted)] mb-1">Sessions</p>
					<p class="text-lg font-bold text-[var(--color-foreground)]">{sessions.length}</p>
				</div>
				<div class="fitness-card">
					<BarChart2 class="w-5 h-5 text-[var(--color-accent)] mb-2" />
					<p class="text-xs text-[var(--color-muted)] mb-1">Total Volume</p>
					<p class="text-lg font-bold text-[var(--color-foreground)]">
						{formatWeight(totalVolume, currentUnit)}
					</p>
				</div>
			</div>

			<!-- Chart Toggle + Chart -->
			<div>
				<div class="flex gap-2 mb-4">
					<button
						onclick={() => (chartType = 'weight')}
						class="flex-1 px-4 py-2 rounded-lg font-medium transition-colors {chartType === 'weight'
							? 'bg-[var(--color-primary)] text-white'
							: 'bg-[var(--color-card)] text-[var(--color-muted)] border border-[var(--color-border)]'}"
					>
						Max Weight
					</button>
					<button
						onclick={() => (chartType = 'volume')}
						class="flex-1 px-4 py-2 rounded-lg font-medium transition-colors {chartType === 'volume'
							? 'bg-[var(--color-secondary)] text-white'
							: 'bg-[var(--color-card)] text-[var(--color-muted)] border border-[var(--color-border)]'}"
					>
						Volume
					</button>
				</div>
				<div class="fitness-card">
					<StrengthChart {progress} type={chartType} unit={currentUnit} />
				</div>
			</div>

			<!-- All Sessions Table -->
			{#if sessions.length > 0}
				<div class="fitness-card">
					<h3 class="font-semibold text-[var(--color-foreground)] mb-4">All Sessions</h3>
					<div class="space-y-2">
						{#each sessions as session}
							<div class="flex items-center justify-between p-3 bg-[var(--color-card-hover)] rounded-lg">
								<span class="text-sm text-[var(--color-muted)] w-24 flex-shrink-0">{formatDate(session.date)}</span>
								<div class="flex gap-3 text-sm text-right">
									<div>
										<span class="font-medium text-[var(--color-foreground)]">{formatWeight(session.maxWeight, currentUnit)}</span>
										<span class="text-[var(--color-muted)] text-xs block">max</span>
									</div>
									<div>
										<span class="font-medium text-[var(--color-foreground)]">{formatWeight(session.volume, currentUnit)}</span>
										<span class="text-[var(--color-muted)] text-xs block">vol</span>
									</div>
									<div>
										<span class="font-medium text-[var(--color-foreground)]">{session.setsCompleted}</span>
										<span class="text-[var(--color-muted)] text-xs block">sets</span>
									</div>
								</div>
							</div>
						{/each}
					</div>
				</div>
			{/if}
		{/if}
	</div>
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

<script lang="ts">
	import { onMount } from 'svelte';
	import { supabase } from '$lib/supabase/client';
	import { getExerciseById, type Exercise } from '$lib/data/exercises';
	import { calculateExerciseProgress, type ExerciseProgress } from '$lib/utils/progress';
	import StrengthChart from './StrengthChart.svelte';
	import { Trophy, TrendingUp, Calendar, Weight, Target, Activity, X } from 'lucide-svelte';
	import { format } from 'date-fns';

	interface Props {
		exercise: Exercise;
		onClose: () => void;
	}

	let { exercise, onClose }: Props = $props();

	let progress = $state<ExerciseProgress | null>(null);
	let isLoading = $state(true);
	let chartType = $state<'weight' | 'volume'>('weight');

	onMount(async () => {
		await loadExerciseHistory();
	});

	async function loadExerciseHistory() {
		try {
			isLoading = true;

			// Fetch all workouts containing this exercise
			const { data: workoutExercises, error } = await supabase
				.from('workout_exercises')
				.select(`
					sets,
					workouts!inner(date)
				`)
				.eq('exercise_id', exercise.id)
				.order('workouts.date', { ascending: false });

			if (error) throw error;

			// Transform data for progress calculation
			const workoutData = (workoutExercises || []).map((we: any) => ({
				date: we.workouts.date,
				sets: Array.isArray(we.sets) ? we.sets : []
			}));

			// Calculate progress
			progress = calculateExerciseProgress(exercise.id, exercise.name, workoutData);
		} catch (error) {
			console.error('Error loading exercise history:', error);
		} finally {
			isLoading = false;
		}
	}

	function getBestSet() {
		if (!progress || !progress.personalRecord) return null;
		return progress.personalRecord;
	}

	function getRecentPerformances() {
		if (!progress || progress.dates.length === 0) return [];
		
		// Get last 5 workouts
		return progress.dates.slice(0, 5).map((date, index) => ({
			date,
			weight: progress!.weights[index],
			volume: progress!.volumes[index],
			reps: progress!.reps[index]
		}));
	}
</script>

<!-- Backdrop -->
<div
	class="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
	role="button"
	tabindex="0"
	onclick={onClose}
	onkeydown={(e) => {
		if (e.key === 'Escape' || e.key === 'Enter' || e.key === ' ') {
			e.preventDefault();
			onClose();
		}
	}}
>
	<!-- Modal Content -->
	<div
		class="w-full max-w-2xl max-h-[90vh] bg-[var(--color-card)] rounded-2xl overflow-hidden flex flex-col shadow-2xl"
		role="dialog"
		aria-modal="true"
		aria-label="Exercise history"
		onclick={(e) => e.stopPropagation()}
		onkeydown={(e) => e.stopPropagation()}
	>
		<!-- Header -->
		<div class="flex items-center justify-between p-6 border-b border-[var(--color-border)]">
			<div>
				<h2 class="text-2xl font-bold text-[var(--color-foreground)]">{exercise.name} History</h2>
				<p class="text-sm text-[var(--color-muted)] mt-1">Track your progress over time</p>
			</div>
			<button
				onclick={onClose}
				class="p-2 text-[var(--color-muted)] hover:text-[var(--color-foreground)] transition-colors rounded-lg hover:bg-[var(--color-card-hover)]"
				title="Close"
			>
				<X class="w-6 h-6" />
			</button>
		</div>

		<!-- Content (Scrollable) -->
		<div class="flex-1 overflow-y-auto scrollbar-hide">
			<div class="p-6 space-y-6">
				{#if isLoading}
					<div class="text-center py-12 text-[var(--color-muted)]">Loading history...</div>
				{:else if !progress || progress.dates.length === 0}
					<div class="text-center py-12">
						<Activity class="w-16 h-16 text-[var(--color-muted)] mx-auto mb-4 opacity-50" />
						<p class="text-[var(--color-muted)] mb-2">No workout history yet</p>
						<p class="text-sm text-[var(--color-muted)]">Complete workouts with this exercise to see your progress</p>
					</div>
				{:else}
					<!-- Personal Record -->
					{#if progress.personalRecord}
						<div class="fitness-card bg-gradient-to-r from-[var(--color-primary)]/20 to-[var(--color-accent)]/20 border-2 border-[var(--color-primary)]">
							<div class="flex items-center gap-3 mb-3">
								<Trophy class="w-6 h-6 text-[var(--color-primary)]" />
								<h3 class="text-lg font-bold text-[var(--color-foreground)]">Personal Record</h3>
							</div>
							<div class="grid grid-cols-3 gap-4">
								<div>
									<p class="text-xs text-[var(--color-muted)] mb-1">Max Weight</p>
									<p class="text-2xl font-bold text-[var(--color-primary)]">
										{progress.personalRecord.weight} <span class="text-sm">kg</span>
									</p>
								</div>
								<div>
									<p class="text-xs text-[var(--color-muted)] mb-1">Reps</p>
									<p class="text-2xl font-bold text-[var(--color-foreground)]">
										{progress.personalRecord.reps}
									</p>
								</div>
								<div>
									<p class="text-xs text-[var(--color-muted)] mb-1">Date</p>
									<p class="text-sm font-semibold text-[var(--color-foreground)]">
										{format(progress.personalRecord.date, 'MMM d, yyyy')}
									</p>
								</div>
							</div>
						</div>
					{/if}

					<!-- Chart Toggle -->
					<div class="flex items-center gap-2">
						<button
							onclick={() => (chartType = 'weight')}
							class="flex-1 px-4 py-2 rounded-lg font-medium transition-colors {chartType === 'weight'
								? 'bg-[var(--color-primary)] text-white'
								: 'bg-[var(--color-card)] text-[var(--color-muted)] hover:text-[var(--color-foreground)]'}"
						>
							<Weight class="w-4 h-4 inline-block mr-2" />
							Weight Progression
						</button>
						<button
							onclick={() => (chartType = 'volume')}
							class="flex-1 px-4 py-2 rounded-lg font-medium transition-colors {chartType === 'volume'
								? 'bg-[var(--color-secondary)] text-white'
								: 'bg-[var(--color-card)] text-[var(--color-muted)] hover:text-[var(--color-foreground)]'}"
						>
							<TrendingUp class="w-4 h-4 inline-block mr-2" />
							Volume Progression
						</button>
					</div>

					<!-- Progress Chart -->
					<div class="fitness-card">
						<h3 class="text-lg font-semibold text-[var(--color-foreground)] mb-4">
							{chartType === 'weight' ? 'Weight Progression' : 'Volume Progression'}
						</h3>
						<StrengthChart progress={progress} type={chartType} />
					</div>

					<!-- Recent Performances -->
					<div>
						<h3 class="text-lg font-semibold text-[var(--color-foreground)] mb-4">Recent Workouts</h3>
						<div class="space-y-2">
							{#each getRecentPerformances() as perf}
								<div class="fitness-card">
									<div class="flex items-center justify-between">
										<div class="flex items-center gap-3">
											<Calendar class="w-4 h-4 text-[var(--color-muted)]" />
											<div>
												<p class="text-sm font-semibold text-[var(--color-foreground)]">
													{format(perf.date, 'MMM d, yyyy')}
												</p>
												<p class="text-xs text-[var(--color-muted)]">
													{format(perf.date, 'EEEE')}
												</p>
											</div>
										</div>
										<div class="flex items-center gap-4 text-sm">
											<div class="text-right">
												<p class="text-xs text-[var(--color-muted)]">Max Weight</p>
												<p class="font-semibold text-[var(--color-foreground)]">
													{perf.weight} <span class="text-xs text-[var(--color-muted)]">kg</span>
												</p>
											</div>
											<div class="text-right">
												<p class="text-xs text-[var(--color-muted)]">Volume</p>
												<p class="font-semibold text-[var(--color-foreground)]">
													{perf.volume} <span class="text-xs text-[var(--color-muted)]">kg</span>
												</p>
											</div>
											<div class="text-right">
												<p class="text-xs text-[var(--color-muted)]">Reps</p>
												<p class="font-semibold text-[var(--color-foreground)]">
													{perf.reps}
												</p>
											</div>
										</div>
									</div>
								</div>
							{/each}
						</div>
					</div>

					<!-- Stats Summary -->
					<div class="grid grid-cols-2 gap-4">
						<div class="fitness-card">
							<p class="text-xs text-[var(--color-muted)] mb-1">Total Workouts</p>
							<p class="text-2xl font-bold text-[var(--color-foreground)]">
								{progress.dates.length}
							</p>
						</div>
						<div class="fitness-card">
							<p class="text-xs text-[var(--color-muted)] mb-1">Average Volume</p>
							<p class="text-2xl font-bold text-[var(--color-foreground)]">
								{Math.round(progress.volumes.reduce((a, b) => a + b, 0) / progress.volumes.length)} <span class="text-sm">kg</span>
							</p>
						</div>
					</div>
				{/if}
			</div>
		</div>
	</div>
</div>

<style>
	.scrollbar-hide {
		-ms-overflow-style: none;
		scrollbar-width: none;
	}

	.scrollbar-hide::-webkit-scrollbar {
		display: none;
	}
</style>

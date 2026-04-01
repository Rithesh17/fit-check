<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { Scale, TrendingDown, Calendar, Plus, Download, Target, Trash2 } from 'lucide-svelte';
	import WeightChart from '$lib/components/WeightChart.svelte';
	import { exportAsJSON, exportWorkoutsAsCSV, exportBodyMetricsAsCSV, downloadFile } from '$lib/utils/export';
	import { unitPreference } from '$lib/stores/unit-preference';
	import { convertWeight, formatWeight, getWeightUnitLabel, lbsToKg } from '$lib/utils/weight-conversion';
	import { loadBodyMetrics, saveBodyMetric } from '$lib/services/body-metrics';
	import { toast } from '$lib/stores/toast';
	import { goals, type Goal } from '$lib/stores/goals';
	import { supabase } from '$lib/supabase/client';
	import { getExerciseById } from '$lib/data/exercises';
	import { loadCustomExercises } from '$lib/services/exercises';
	import { calculateExerciseProgress } from '$lib/utils/progress';

	let bodyMetrics = $state<Array<{ id: string; date: string; weight_kg: number | null; body_fat_percentage: number | null }>>([]);
	let isLoading = $state(true);
	let showAddForm = $state(false);
	let newWeight = $state('');
	let newBodyFat = $state('');
	let newDate = $state(new Date().toISOString().split('T')[0]);
	
	const currentUnit = $derived($unitPreference);

	// Goals state
	const currentGoals = $derived($goals);
	let showGoalForm = $state(false);
	let goalType = $state<'exercise' | 'weight'>('exercise');
	let goalExerciseId = $state('');
	let goalTargetValue = $state('');
	let goalTargetDate = $state('');
	let usedExercises = $state<Array<{ id: string; name: string }>>([]);
	let currentValues = $state<Map<string, number>>(new Map());

	onMount(async () => {
		await fetchBodyMetrics();
		await loadGoalCurrentValues();
	});

	async function fetchBodyMetrics() {
		try {
			isLoading = true;
			bodyMetrics = await loadBodyMetrics(30);
		} catch (error) {
			console.error('Error loading body metrics:', error);
			toast.error('Failed to load weight data');
		} finally {
			isLoading = false;
		}
	}

	async function addBodyMetric() {
		if (!newWeight) {
			toast.error('Please enter your weight');
			return;
		}

		try {
			const weightValue = parseFloat(newWeight);
			const weightKg = currentUnit === 'lbs' ? lbsToKg(weightValue) : weightValue;
			await saveBodyMetric({
				date: newDate,
				weight_kg: weightKg,
				body_fat_percentage: newBodyFat ? parseFloat(newBodyFat) : null
			});
			newWeight = '';
			newBodyFat = '';
			newDate = new Date().toISOString().split('T')[0];
			showAddForm = false;
			toast.success('Weight saved');
			await fetchBodyMetrics();
		} catch (error) {
			console.error('Error saving body metric:', error);
			toast.error('Failed to save. Please try again.');
		}
	}

	function formatDate(dateString: string): string {
		const date = new Date(dateString);
		return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
	}

	function getWeightChange(): { change: number; percentage: number } | null {
		if (bodyMetrics.length < 2) return null;
		const latest = bodyMetrics[0].weight_kg;
		const previous = bodyMetrics[1].weight_kg;
		if (!latest || !previous) return null;
		const change = latest - previous;
		const percentage = (change / previous) * 100;
		return { change, percentage };
	}

	const weightChange = $derived(getWeightChange());
	const weightChangeDisplay = $derived(
		weightChange ? convertWeight(weightChange.change, currentUnit) : null
	);

	async function loadGoalCurrentValues() {
		const customExercises = await loadCustomExercises();

		// Populate usedExercises for the goal form
		const { data: workoutExercises } = await supabase
			.from('workout_exercises')
			.select('exercise_id')
			.limit(500);

		const usedIds = [...new Set((workoutExercises || []).map((we: any) => we.exercise_id))];
		usedExercises = usedIds
			.map((id) => {
				const ex = getExerciseById(id) || customExercises.find((ce) => ce.id === id);
				return ex ? { id, name: ex.name } : null;
			})
			.filter((e): e is { id: string; name: string } => e !== null)
			.sort((a, b) => a.name.localeCompare(b.name));

		// Load current values for each goal
		const exerciseGoals = currentGoals.filter((g) => g.type === 'exercise' && g.exerciseId);
		if (exerciseGoals.length > 0) {
			const { data: workouts } = await supabase.from('workouts').select('id, date');
			const { data: allWorkoutExercises } = await supabase
				.from('workout_exercises')
				.select('exercise_id, workout_id, sets');

			if (workouts && allWorkoutExercises) {
				const workoutDateMap = new Map((workouts as any[]).map((w) => [w.id, w.date]));
				for (const goal of exerciseGoals) {
					const wd = (allWorkoutExercises as any[])
						.filter((we) => we.exercise_id === goal.exerciseId)
						.map((we) => ({ date: workoutDateMap.get(we.workout_id) || '', sets: we.sets }))
						.filter((d) => d.date);
					if (wd.length > 0) {
						const ex = getExerciseById(goal.exerciseId!) || customExercises.find((ce) => ce.id === goal.exerciseId);
						if (ex) {
							const progress = calculateExerciseProgress(goal.exerciseId!, ex.name, wd);
							if (progress.personalRecord) {
								currentValues = new Map(currentValues).set(goal.id, progress.personalRecord.weight);
							}
						}
					}
				}
			}
		}

		// Body weight goals
		for (const goal of currentGoals.filter((g) => g.type === 'weight')) {
			if (bodyMetrics[0]?.weight_kg != null) {
				currentValues = new Map(currentValues).set(goal.id, bodyMetrics[0].weight_kg);
			}
		}
	}

	function addGoal() {
		if (!goalTargetValue) {
			toast.error('Please enter a target value');
			return;
		}
		if (goalType === 'exercise' && !goalExerciseId) {
			toast.error('Please select an exercise');
			return;
		}
		const targetKg =
			currentUnit === 'lbs' ? lbsToKg(parseFloat(goalTargetValue)) : parseFloat(goalTargetValue);
		const exerciseInfo = goalType === 'exercise' ? usedExercises.find((e) => e.id === goalExerciseId) : null;
		goals.addGoal({
			type: goalType,
			exerciseId: goalType === 'exercise' ? goalExerciseId : undefined,
			exerciseName: exerciseInfo?.name,
			targetValue: targetKg,
			targetDate: goalTargetDate || undefined
		});
		showGoalForm = false;
		goalTargetValue = '';
		goalTargetDate = '';
		goalExerciseId = '';
		toast.success('Goal added');
		loadGoalCurrentValues();
	}

	function getGoalProgress(goal: Goal): number {
		const current = currentValues.get(goal.id) ?? 0;
		if (goal.targetValue <= 0 || current <= 0) return 0;
		return Math.min(100, (current / goal.targetValue) * 100);
	}
</script>

<svelte:head>
	<title>Profile - Fit Check</title>
</svelte:head>

<div class="min-h-screen bg-[var(--color-background)] pb-20">
	<!-- Header -->
	<div class="sticky top-0 z-10 bg-[var(--color-background)]/95 backdrop-blur-sm border-b border-[var(--color-border)]">
		<div class="max-w-md mx-auto px-4 py-4">
			<h1 class="text-2xl font-bold text-[var(--color-foreground)]">Profile</h1>
		</div>
	</div>

	<div class="max-w-md mx-auto px-4 py-6 space-y-6">
		<!-- Unit Preference Toggle -->
		<div class="fitness-card">
			<div class="flex items-center justify-between">
				<div>
					<h3 class="font-semibold text-[var(--color-foreground)] mb-1">Weight Unit</h3>
					<p class="text-sm text-[var(--color-muted)]">Choose your preferred unit</p>
				</div>
				<div class="flex gap-2">
					<button
						onclick={() => unitPreference.set('kg')}
						class="px-4 py-2 rounded-lg font-medium transition-colors {currentUnit === 'kg'
							? 'bg-[var(--color-primary)] text-white'
							: 'bg-[var(--color-card-hover)] text-[var(--color-foreground)] border border-[var(--color-border)]'}"
					>
						kg
					</button>
					<button
						onclick={() => unitPreference.set('lbs')}
						class="px-4 py-2 rounded-lg font-medium transition-colors {currentUnit === 'lbs'
							? 'bg-[var(--color-primary)] text-white'
							: 'bg-[var(--color-card-hover)] text-[var(--color-foreground)] border border-[var(--color-border)]'}"
					>
						lbs
					</button>
				</div>
			</div>
		</div>

		<!-- Goals Section -->
		<div>
			<div class="flex items-center justify-between mb-4">
				<h2 class="text-lg font-semibold text-[var(--color-foreground)] flex items-center gap-2">
					<Target class="w-5 h-5 text-[var(--color-primary)]" />
					Goals
				</h2>
				<button
					onclick={() => (showGoalForm = !showGoalForm)}
					class="px-4 py-2 bg-[var(--gradient-primary)] text-white rounded-lg font-medium flex items-center gap-2"
				>
					<Plus class="w-4 h-4" />
					Add Goal
				</button>
			</div>

			{#if showGoalForm}
				<div class="fitness-card mb-4 space-y-4">
					<h3 class="font-semibold text-[var(--color-foreground)]">New Goal</h3>

					<!-- Goal Type Toggle -->
					<div class="flex gap-2">
						<button
							onclick={() => (goalType = 'exercise')}
							class="flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors {goalType === 'exercise'
								? 'bg-[var(--color-primary)] text-white'
								: 'bg-[var(--color-card-hover)] text-[var(--color-foreground)] border border-[var(--color-border)]'}"
						>
							Exercise Strength
						</button>
						<button
							onclick={() => (goalType = 'weight')}
							class="flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors {goalType === 'weight'
								? 'bg-[var(--color-primary)] text-white'
								: 'bg-[var(--color-card-hover)] text-[var(--color-foreground)] border border-[var(--color-border)]'}"
						>
							Body Weight
						</button>
					</div>

					{#if goalType === 'exercise'}
						<div>
							<label for="goal-exercise" class="block text-sm text-[var(--color-muted)] mb-2">Exercise</label>
							<select
								id="goal-exercise"
								bind:value={goalExerciseId}
								class="w-full px-4 py-2 bg-[var(--color-card-hover)] border border-[var(--color-border)] rounded-lg text-[var(--color-foreground)] focus:outline-none focus:border-[var(--color-primary)]"
							>
								<option value="">Select exercise...</option>
								{#each usedExercises as ex}
									<option value={ex.id}>{ex.name}</option>
								{/each}
							</select>
						</div>
					{/if}

					<div>
						<label for="goal-target" class="block text-sm text-[var(--color-muted)] mb-2">
							Target Weight ({getWeightUnitLabel(currentUnit)})
						</label>
						<input
							id="goal-target"
							type="number"
							bind:value={goalTargetValue}
							placeholder={currentUnit === 'lbs' ? 'e.g., 225' : 'e.g., 100'}
							step="0.5"
							class="w-full px-4 py-2 bg-[var(--color-card-hover)] border border-[var(--color-border)] rounded-lg text-[var(--color-foreground)] focus:outline-none focus:border-[var(--color-primary)]"
						/>
					</div>

					<div>
						<label for="goal-date" class="block text-sm text-[var(--color-muted)] mb-2">Target Date (optional)</label>
						<input
							id="goal-date"
							type="date"
							bind:value={goalTargetDate}
							class="w-full px-4 py-2 bg-[var(--color-card-hover)] border border-[var(--color-border)] rounded-lg text-[var(--color-foreground)] focus:outline-none focus:border-[var(--color-primary)]"
						/>
					</div>

					<div class="flex gap-2">
						<button
							onclick={addGoal}
							class="flex-1 px-4 py-2 bg-[var(--gradient-primary)] text-white rounded-lg font-medium"
						>
							Save
						</button>
						<button
							onclick={() => (showGoalForm = false)}
							class="px-4 py-2 bg-[var(--color-card-hover)] border border-[var(--color-border)] text-[var(--color-foreground)] rounded-lg"
						>
							Cancel
						</button>
					</div>
				</div>
			{/if}

			{#if currentGoals.length === 0 && !showGoalForm}
				<div class="fitness-card text-center py-8">
					<Target class="w-12 h-12 text-[var(--color-muted)] mx-auto mb-3 opacity-50" />
					<p class="text-[var(--color-muted)]">No goals yet. Set a target to track your progress!</p>
				</div>
			{:else}
				<div class="space-y-3">
					{#each currentGoals as goal}
						{@const current = currentValues.get(goal.id) ?? 0}
						{@const progressPct = getGoalProgress(goal)}
						<div class="fitness-card">
							<div class="flex items-start justify-between mb-3">
								<div>
									<h3 class="font-semibold text-[var(--color-foreground)]">
										{goal.type === 'exercise' ? (goal.exerciseName || 'Exercise') : 'Body Weight'}
									</h3>
									<p class="text-sm text-[var(--color-muted)]">
										Target: {formatWeight(goal.targetValue, currentUnit)}
										{#if goal.targetDate}
											· {new Date(goal.targetDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
										{/if}
									</p>
								</div>
								<button
									onclick={() => goals.deleteGoal(goal.id)}
									class="p-1 text-[var(--color-muted)] hover:text-[var(--color-danger)] transition-colors"
									title="Delete goal"
								>
									<Trash2 class="w-4 h-4" />
								</button>
							</div>
							<div class="w-full bg-[var(--color-card-hover)] rounded-full h-2 mb-2">
								<div
									class="h-2 rounded-full transition-all"
									style="width: {progressPct.toFixed(0)}%; background: var(--gradient-primary);"
								></div>
							</div>
							<div class="flex justify-between text-xs text-[var(--color-muted)]">
								<span>Current: {current > 0 ? formatWeight(current, currentUnit) : 'No data yet'}</span>
								<span>{progressPct.toFixed(0)}%</span>
							</div>
						</div>
					{/each}
				</div>
			{/if}
		</div>

		<!-- Weight Tracking Section -->
		<div>
			<div class="flex items-center justify-between mb-4">
				<h2 class="text-lg font-semibold text-[var(--color-foreground)] flex items-center gap-2">
					<Scale class="w-5 h-5 text-[var(--color-primary)]" />
					Weight Tracking
				</h2>
				<button
					onclick={() => (showAddForm = !showAddForm)}
					class="px-4 py-2 bg-[var(--gradient-primary)] text-white rounded-lg font-medium flex items-center gap-2"
				>
					<Plus class="w-4 h-4" />
					Add
				</button>
			</div>

			<!-- Add Weight Form -->
			{#if showAddForm}
				<div class="fitness-card mb-4">
					<h3 class="font-semibold text-[var(--color-foreground)] mb-4">Log Weight</h3>
					<div class="space-y-4">
						<div>
							<label for="weight-date" class="block text-sm text-[var(--color-muted)] mb-2">Date</label>
							<input
								id="weight-date"
								type="date"
								bind:value={newDate}
								class="w-full px-4 py-2 bg-[var(--color-card-hover)] border border-[var(--color-border)] rounded-lg text-[var(--color-foreground)] focus:outline-none focus:border-[var(--color-primary)]"
							/>
						</div>
						<div>
							<label for="weight-value" class="block text-sm text-[var(--color-muted)] mb-2">
								Weight ({getWeightUnitLabel(currentUnit)})
							</label>
							<input
								id="weight-value"
								type="number"
								bind:value={newWeight}
								placeholder={currentUnit === 'lbs' ? 'e.g., 165.5' : 'e.g., 75.5'}
								step={currentUnit === 'lbs' ? '0.5' : '0.1'}
								class="w-full px-4 py-2 bg-[var(--color-card-hover)] border border-[var(--color-border)] rounded-lg text-[var(--color-foreground)] focus:outline-none focus:border-[var(--color-primary)]"
							/>
						</div>
						<div>
							<label for="body-fat" class="block text-sm text-[var(--color-muted)] mb-2">Body Fat % (optional)</label>
							<input
								id="body-fat"
								type="number"
								bind:value={newBodyFat}
								placeholder="e.g., 15.5"
								step="0.1"
								class="w-full px-4 py-2 bg-[var(--color-card-hover)] border border-[var(--color-border)] rounded-lg text-[var(--color-foreground)] focus:outline-none focus:border-[var(--color-primary)]"
							/>
						</div>
						<div class="flex gap-2">
							<button
								onclick={addBodyMetric}
								class="flex-1 px-4 py-2 bg-[var(--gradient-primary)] text-white rounded-lg font-medium"
							>
								Save
							</button>
							<button
								onclick={() => (showAddForm = false)}
								class="px-4 py-2 bg-[var(--color-card-hover)] border border-[var(--color-border)] text-[var(--color-foreground)] rounded-lg"
							>
								Cancel
							</button>
						</div>
					</div>
				</div>
			{/if}

			<!-- Current Weight & Stats -->
			{#if bodyMetrics.length > 0}
				<div class="fitness-card mb-4">
					<div class="flex items-center justify-between mb-4">
						<div>
							<p class="text-sm text-[var(--color-muted)] mb-1">Current Weight</p>
							<p class="text-3xl font-bold text-[var(--color-foreground)]">
								{#if bodyMetrics[0].weight_kg !== null}
									{formatWeight(bodyMetrics[0].weight_kg, currentUnit)}
								{:else}
									—
								{/if}
							</p>
							{#if bodyMetrics[0].body_fat_percentage}
								<p class="text-sm text-[var(--color-muted)] mt-1">
									Body Fat: {bodyMetrics[0].body_fat_percentage.toFixed(1)}%
								</p>
							{/if}
						</div>
						{#if weightChange && weightChangeDisplay !== null}
							<div class="text-right">
								<div
									class="flex items-center gap-1 {weightChange.change < 0
										? 'text-[var(--color-accent)]'
										: weightChange.change > 0
											? 'text-[var(--color-primary)]'
											: 'text-[var(--color-muted)]'}"
								>
									<TrendingDown
										class="w-4 h-4 {weightChange.change > 0 ? 'rotate-180' : ''}"
									/>
									<span class="font-semibold">
										{weightChangeDisplay > 0 ? '+' : ''}
										{weightChangeDisplay.toFixed(1)} {getWeightUnitLabel(currentUnit)}
									</span>
								</div>
								<p class="text-xs text-[var(--color-muted)] mt-1">
									{weightChange.percentage > 0 ? '+' : ''}
									{weightChange.percentage.toFixed(1)}%
								</p>
							</div>
						{/if}
					</div>
				</div>

				<!-- Weight Chart -->
				{#if bodyMetrics.filter((m) => m.weight_kg !== null).length > 1}
					<div class="fitness-card mb-4">
						<h3 class="text-sm font-semibold text-[var(--color-muted)] mb-4">Weight Trend</h3>
						<WeightChart data={bodyMetrics} unit={currentUnit} />
					</div>
				{/if}

				<!-- Weight History -->
				<div>
					<h3 class="text-sm font-semibold text-[var(--color-muted)] mb-3">Recent Entries</h3>
					<div class="space-y-2">
						{#each bodyMetrics.slice(0, 10) as metric}
							<div class="fitness-card py-3">
								<div class="flex items-center justify-between">
									<div class="flex items-center gap-3">
										<Calendar class="w-4 h-4 text-[var(--color-muted)]" />
										<span class="text-sm text-[var(--color-foreground)]">{formatDate(metric.date)}</span>
									</div>
									<div class="text-right">
										<span class="font-semibold text-[var(--color-foreground)]">
											{#if metric.weight_kg !== null}
												{formatWeight(metric.weight_kg, currentUnit)}
											{:else}
												—
											{/if}
										</span>
										{#if metric.body_fat_percentage}
											<p class="text-xs text-[var(--color-muted)]">
												{metric.body_fat_percentage.toFixed(1)}% BF
											</p>
										{/if}
									</div>
								</div>
							</div>
						{/each}
					</div>
				</div>
			{:else if !isLoading}
				<div class="fitness-card text-center py-8">
					<Scale class="w-12 h-12 text-[var(--color-muted)] mx-auto mb-3 opacity-50" />
					<p class="text-[var(--color-muted)] mb-4">No weight data yet</p>
					<button
						onclick={() => (showAddForm = true)}
						class="px-6 py-2 bg-[var(--gradient-primary)] text-white font-semibold rounded-lg"
					>
						Log Your First Weight
					</button>
				</div>
			{/if}
		</div>

		<!-- Export Data Section -->
		<div>
			<h2 class="text-lg font-semibold text-[var(--color-foreground)] mb-4">Export Data</h2>
			<div class="fitness-card space-y-3">
				<button
					onclick={async () => {
						try {
							const json = await exportAsJSON();
							downloadFile(json, `fit-check-export-${new Date().toISOString().split('T')[0]}.json`, 'application/json');
						} catch (error) {
							alert('Failed to export data. Please try again.');
						}
					}}
					class="w-full flex items-center justify-between p-3 bg-[var(--color-card-hover)] rounded-lg hover:bg-[var(--color-primary)]/10 transition-colors"
				>
					<div class="flex items-center gap-3">
						<Download class="w-5 h-5 text-[var(--color-primary)]" />
						<span class="text-sm font-semibold text-[var(--color-foreground)]">Export All Data (JSON)</span>
					</div>
				</button>
				<button
					onclick={async () => {
						try {
							const csv = await exportWorkoutsAsCSV();
							downloadFile(csv, `workouts-${new Date().toISOString().split('T')[0]}.csv`, 'text/csv');
						} catch (error) {
							alert('Failed to export workouts. Please try again.');
						}
					}}
					class="w-full flex items-center justify-between p-3 bg-[var(--color-card-hover)] rounded-lg hover:bg-[var(--color-primary)]/10 transition-colors"
				>
					<div class="flex items-center gap-3">
						<Download class="w-5 h-5 text-[var(--color-primary)]" />
						<span class="text-sm font-semibold text-[var(--color-foreground)]">Export Workouts (CSV)</span>
					</div>
				</button>
				<button
					onclick={async () => {
						try {
							const csv = await exportBodyMetricsAsCSV();
							downloadFile(csv, `body-metrics-${new Date().toISOString().split('T')[0]}.csv`, 'text/csv');
						} catch (error) {
							alert('Failed to export body metrics. Please try again.');
						}
					}}
					class="w-full flex items-center justify-between p-3 bg-[var(--color-card-hover)] rounded-lg hover:bg-[var(--color-primary)]/10 transition-colors"
				>
					<div class="flex items-center gap-3">
						<Download class="w-5 h-5 text-[var(--color-primary)]" />
						<span class="text-sm font-semibold text-[var(--color-foreground)]">Export Body Metrics (CSV)</span>
					</div>
				</button>
			</div>
		</div>
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

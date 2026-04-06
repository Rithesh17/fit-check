<script lang="ts">
	import { onMount } from 'svelte';
	import { Scale, TrendingDown, Calendar, Plus, Download, Target, Trash2, Settings, X } from 'lucide-svelte';
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
	let showSettings = $state(false);

	const currentUnit = $derived($unitPreference);
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
		} catch {
			toast.error('Failed to load weight data');
		} finally {
			isLoading = false;
		}
	}

	async function addBodyMetric() {
		if (!newWeight) { toast.error('Please enter your weight'); return; }
		try {
			const weightKg = currentUnit === 'lbs' ? lbsToKg(parseFloat(newWeight)) : parseFloat(newWeight);
			await saveBodyMetric({
				date: newDate,
				weight_kg: weightKg,
				body_fat_percentage: newBodyFat ? parseFloat(newBodyFat) : null
			});
			newWeight = ''; newBodyFat = ''; newDate = new Date().toISOString().split('T')[0];
			showAddForm = false;
			toast.success('Weight saved');
			await fetchBodyMetrics();
		} catch {
			toast.error('Failed to save. Please try again.');
		}
	}

	function formatDate(dateString: string): string {
		return new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
	}

	function getWeightChange(): { change: number; percentage: number } | null {
		if (bodyMetrics.length < 2) return null;
		const latest = bodyMetrics[0].weight_kg;
		const previous = bodyMetrics[1].weight_kg;
		if (!latest || !previous) return null;
		const change = latest - previous;
		return { change, percentage: (change / previous) * 100 };
	}

	const weightChange = $derived(getWeightChange());
	const weightChangeDisplay = $derived(weightChange ? convertWeight(weightChange.change, currentUnit) : null);

	async function loadGoalCurrentValues() {
		const customExercises = await loadCustomExercises();
		const { data: workoutExercises } = await supabase.from('workout_exercises').select('exercise_id').limit(500);
		const usedIds = [...new Set((workoutExercises || []).map((we: any) => we.exercise_id))];
		usedExercises = usedIds
			.map((id) => {
				const ex = getExerciseById(id) || customExercises.find((ce) => ce.id === id);
				return ex ? { id, name: ex.name } : null;
			})
			.filter((e): e is { id: string; name: string } => e !== null)
			.sort((a, b) => a.name.localeCompare(b.name));

		const exerciseGoals = currentGoals.filter((g) => g.type === 'exercise' && g.exerciseId);
		if (exerciseGoals.length > 0) {
			const { data: workouts } = await supabase.from('workouts').select('id, date');
			const { data: allWorkoutExercises } = await supabase.from('workout_exercises').select('exercise_id, workout_id, sets');
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
		for (const goal of currentGoals.filter((g) => g.type === 'weight')) {
			if (bodyMetrics[0]?.weight_kg != null) {
				currentValues = new Map(currentValues).set(goal.id, bodyMetrics[0].weight_kg);
			}
		}
	}

	function addGoal() {
		if (!goalTargetValue) { toast.error('Please enter a target value'); return; }
		if (goalType === 'exercise' && !goalExerciseId) { toast.error('Please select an exercise'); return; }
		const targetKg = currentUnit === 'lbs' ? lbsToKg(parseFloat(goalTargetValue)) : parseFloat(goalTargetValue);
		const exerciseInfo = goalType === 'exercise' ? usedExercises.find((e) => e.id === goalExerciseId) : null;
		goals.addGoal({ type: goalType, exerciseId: goalType === 'exercise' ? goalExerciseId : undefined, exerciseName: exerciseInfo?.name, targetValue: targetKg, targetDate: goalTargetDate || undefined });
		showGoalForm = false; goalTargetValue = ''; goalTargetDate = ''; goalExerciseId = '';
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
	<title>You — Fit Check</title>
</svelte:head>

<div class="min-h-screen bg-[var(--color-background)] pb-24">
	<!-- Header -->
	<div class="sticky top-0 z-10 border-b border-[var(--color-border)] bg-[var(--color-background)]/95 backdrop-blur-sm">
		<div class="mx-auto flex max-w-md items-center justify-between px-4 py-4">
			<h1 class="text-2xl font-bold text-[var(--color-foreground)]">You</h1>
			<button
				onclick={() => (showSettings = !showSettings)}
				class="rounded-lg p-2 text-[var(--color-muted)] transition-colors hover:text-[var(--color-foreground)] {showSettings ? 'text-[var(--color-primary)]' : ''}"
				title="Settings & Export"
			>
				<Settings class="h-5 w-5" />
			</button>
		</div>
	</div>

	<div class="mx-auto max-w-md space-y-6 px-4 py-6">

		<!-- Settings Panel (collapsible) -->
		{#if showSettings}
			<div class="fitness-card space-y-4">
				<div class="flex items-center justify-between">
					<h2 class="font-semibold text-[var(--color-foreground)]">Settings & Export</h2>
					<button onclick={() => (showSettings = false)} class="text-[var(--color-muted)] hover:text-[var(--color-foreground)]">
						<X class="h-4 w-4" />
					</button>
				</div>

				<!-- Unit toggle -->
				<div class="flex items-center justify-between">
					<div>
						<p class="text-sm font-medium text-[var(--color-foreground)]">Weight Unit</p>
						<p class="text-xs text-[var(--color-muted)]">Used across the app</p>
					</div>
					<div class="flex gap-1.5">
						{#each ['kg', 'lbs'] as unit}
							<button
								onclick={() => unitPreference.set(unit as 'kg' | 'lbs')}
								class="rounded-lg px-3 py-1.5 text-sm font-medium transition-colors
									{currentUnit === unit ? 'bg-[var(--color-primary)] text-white' : 'border border-[var(--color-border)] text-[var(--color-muted)]'}"
							>
								{unit}
							</button>
						{/each}
					</div>
				</div>

				<div class="border-t border-[var(--color-border)] pt-3 space-y-2">
					<p class="text-xs font-semibold uppercase tracking-wide text-[var(--color-muted)]">Export</p>
					{#each [
						{ label: 'All Data (JSON)', fn: async () => { const d = await exportAsJSON(); downloadFile(d, `fit-check-${new Date().toISOString().split('T')[0]}.json`, 'application/json'); } },
						{ label: 'Workouts (CSV)', fn: async () => { const d = await exportWorkoutsAsCSV(); downloadFile(d, `workouts-${new Date().toISOString().split('T')[0]}.csv`, 'text/csv'); } },
						{ label: 'Body Metrics (CSV)', fn: async () => { const d = await exportBodyMetricsAsCSV(); downloadFile(d, `body-metrics-${new Date().toISOString().split('T')[0]}.csv`, 'text/csv'); } }
					] as item}
						<button
							onclick={item.fn}
							class="flex w-full items-center gap-2.5 rounded-lg p-2.5 text-sm text-[var(--color-foreground)] transition-colors hover:bg-[var(--color-card-hover)]"
						>
							<Download class="h-4 w-4 text-[var(--color-primary)]" />
							{item.label}
						</button>
					{/each}
				</div>
			</div>
		{/if}

		<!-- Goals Section -->
		<div>
			<div class="mb-4 flex items-center justify-between">
				<h2 class="flex items-center gap-2 text-lg font-semibold text-[var(--color-foreground)]">
					<Target class="h-5 w-5 text-[var(--color-primary)]" />
					Goals
				</h2>
				<button
					onclick={() => (showGoalForm = !showGoalForm)}
					class="flex items-center gap-1.5 rounded-lg bg-[var(--color-primary)] px-3 py-1.5 text-sm font-semibold text-white"
				>
					<Plus class="h-4 w-4" />
					Add
				</button>
			</div>

			{#if showGoalForm}
				<div class="fitness-card mb-4 space-y-4">
					<h3 class="font-semibold text-[var(--color-foreground)]">New Goal</h3>
					<div class="flex gap-2">
						{#each [['exercise', 'Strength'], ['weight', 'Body Weight']] as [val, label]}
							<button
								onclick={() => (goalType = val as 'exercise' | 'weight')}
								class="flex-1 rounded-lg py-2 text-sm font-medium transition-colors
									{goalType === val ? 'bg-[var(--color-primary)] text-white' : 'border border-[var(--color-border)] text-[var(--color-muted)]'}"
							>
								{label}
							</button>
						{/each}
					</div>
					{#if goalType === 'exercise'}
						<select bind:value={goalExerciseId} class="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-card-hover)] px-3 py-2 text-sm text-[var(--color-foreground)] focus:border-[var(--color-primary)] focus:outline-none">
							<option value="">Select exercise...</option>
							{#each usedExercises as ex}
								<option value={ex.id}>{ex.name}</option>
							{/each}
						</select>
					{/if}
					<div class="grid grid-cols-2 gap-3">
						<div>
							<label class="mb-1 block text-xs text-[var(--color-muted)]">Target ({getWeightUnitLabel(currentUnit)})</label>
							<input type="number" bind:value={goalTargetValue} placeholder={currentUnit === 'lbs' ? '225' : '100'} step="0.5"
								class="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-card-hover)] px-3 py-2 text-sm text-[var(--color-foreground)] focus:border-[var(--color-primary)] focus:outline-none" />
						</div>
						<div>
							<label class="mb-1 block text-xs text-[var(--color-muted)]">By date (opt.)</label>
							<input type="date" bind:value={goalTargetDate}
								class="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-card-hover)] px-3 py-2 text-sm text-[var(--color-foreground)] focus:border-[var(--color-primary)] focus:outline-none" />
						</div>
					</div>
					<div class="flex gap-2">
						<button onclick={addGoal} class="flex-1 rounded-lg bg-[var(--color-primary)] py-2 text-sm font-semibold text-white">Save</button>
						<button onclick={() => (showGoalForm = false)} class="rounded-lg border border-[var(--color-border)] px-4 py-2 text-sm text-[var(--color-muted)]">Cancel</button>
					</div>
				</div>
			{/if}

			{#if currentGoals.length === 0 && !showGoalForm}
				<div class="fitness-card py-10 text-center">
					<Target class="mx-auto mb-3 h-10 w-10 text-[var(--color-muted)] opacity-40" />
					<p class="text-sm text-[var(--color-muted)]">No goals yet</p>
					<p class="mt-1 text-xs text-[var(--color-muted)]">Set a target to track progress</p>
				</div>
			{:else}
				<div class="space-y-3">
					{#each currentGoals as goal}
						{@const progressPct = getGoalProgress(goal)}
						{@const current = currentValues.get(goal.id) ?? 0}
						<div class="fitness-card">
							<div class="mb-3 flex items-start justify-between">
								<div>
									<h3 class="font-semibold text-[var(--color-foreground)]">
										{goal.type === 'exercise' ? (goal.exerciseName ?? 'Exercise') : 'Body Weight'}
									</h3>
									<p class="mt-0.5 text-xs text-[var(--color-muted)]">
										Target: {formatWeight(goal.targetValue, currentUnit)}
										{#if goal.targetDate}
											· {new Date(goal.targetDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
										{/if}
									</p>
								</div>
								<button onclick={() => goals.deleteGoal(goal.id)} class="p-1 text-[var(--color-muted)] hover:text-[var(--color-danger)]">
									<Trash2 class="h-4 w-4" />
								</button>
							</div>
							<div class="mb-2 h-2 w-full overflow-hidden rounded-full bg-[var(--color-card-hover)]">
								<div class="h-2 rounded-full transition-all" style="width: {progressPct.toFixed(0)}%; background: var(--gradient-primary);"></div>
							</div>
							<div class="flex justify-between text-xs text-[var(--color-muted)]">
								<span>Current: {current > 0 ? formatWeight(current, currentUnit) : 'No data'}</span>
								<span class="font-medium text-[var(--color-foreground)]">{progressPct.toFixed(0)}%</span>
							</div>
						</div>
					{/each}
				</div>
			{/if}
		</div>

		<!-- Weight Tracking -->
		<div>
			<div class="mb-4 flex items-center justify-between">
				<h2 class="flex items-center gap-2 text-lg font-semibold text-[var(--color-foreground)]">
					<Scale class="h-5 w-5 text-[var(--color-primary)]" />
					Weight
				</h2>
				<button
					onclick={() => (showAddForm = !showAddForm)}
					class="flex items-center gap-1.5 rounded-lg bg-[var(--color-primary)] px-3 py-1.5 text-sm font-semibold text-white"
				>
					<Plus class="h-4 w-4" />
					Log
				</button>
			</div>

			{#if showAddForm}
				<div class="fitness-card mb-4 space-y-4">
					<h3 class="font-semibold text-[var(--color-foreground)]">Log Weight</h3>
					<div class="grid grid-cols-2 gap-3">
						<div>
							<label class="mb-1 block text-xs text-[var(--color-muted)]">Date</label>
							<input type="date" bind:value={newDate} class="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-card-hover)] px-3 py-2 text-sm text-[var(--color-foreground)] focus:border-[var(--color-primary)] focus:outline-none" />
						</div>
						<div>
							<label class="mb-1 block text-xs text-[var(--color-muted)]">Weight ({getWeightUnitLabel(currentUnit)})</label>
							<input type="number" bind:value={newWeight} placeholder={currentUnit === 'lbs' ? '165.5' : '75.5'} step={currentUnit === 'lbs' ? '0.5' : '0.1'}
								class="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-card-hover)] px-3 py-2 text-sm text-[var(--color-foreground)] focus:border-[var(--color-primary)] focus:outline-none" />
						</div>
					</div>
					<div>
						<label class="mb-1 block text-xs text-[var(--color-muted)]">Body Fat % (optional)</label>
						<input type="number" bind:value={newBodyFat} placeholder="15.5" step="0.1"
							class="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-card-hover)] px-3 py-2 text-sm text-[var(--color-foreground)] focus:border-[var(--color-primary)] focus:outline-none" />
					</div>
					<div class="flex gap-2">
						<button onclick={addBodyMetric} class="flex-1 rounded-lg bg-[var(--color-primary)] py-2 text-sm font-semibold text-white">Save</button>
						<button onclick={() => (showAddForm = false)} class="rounded-lg border border-[var(--color-border)] px-4 py-2 text-sm text-[var(--color-muted)]">Cancel</button>
					</div>
				</div>
			{/if}

			{#if bodyMetrics.length > 0}
				<!-- Current weight stat -->
				<div class="fitness-card mb-4">
					<div class="flex items-center justify-between">
						<div>
							<p class="mb-1 text-xs text-[var(--color-muted)]">Current</p>
							<p class="text-3xl font-bold text-[var(--color-foreground)]">
								{bodyMetrics[0].weight_kg !== null ? formatWeight(bodyMetrics[0].weight_kg, currentUnit) : '—'}
							</p>
							{#if bodyMetrics[0].body_fat_percentage}
								<p class="mt-1 text-xs text-[var(--color-muted)]">{bodyMetrics[0].body_fat_percentage.toFixed(1)}% BF</p>
							{/if}
						</div>
						{#if weightChange && weightChangeDisplay !== null}
							<div class="text-right">
								<div class="flex items-center gap-1 {weightChange.change < 0 ? 'text-[var(--color-accent)]' : weightChange.change > 0 ? 'text-[var(--color-primary)]' : 'text-[var(--color-muted)]'}">
									<TrendingDown class="h-4 w-4 {weightChange.change > 0 ? 'rotate-180' : ''}" />
									<span class="font-semibold">{weightChangeDisplay > 0 ? '+' : ''}{weightChangeDisplay.toFixed(1)} {getWeightUnitLabel(currentUnit)}</span>
								</div>
								<p class="mt-1 text-xs text-[var(--color-muted)]">{weightChange.percentage > 0 ? '+' : ''}{weightChange.percentage.toFixed(1)}%</p>
							</div>
						{/if}
					</div>
				</div>

				{#if bodyMetrics.filter((m) => m.weight_kg !== null).length > 1}
					<div class="fitness-card mb-4">
						<h3 class="mb-4 text-xs font-semibold uppercase tracking-wide text-[var(--color-muted)]">Trend</h3>
						<WeightChart data={bodyMetrics} unit={currentUnit} />
					</div>
				{/if}

				<div class="space-y-2">
					{#each bodyMetrics.slice(0, 10) as metric}
						<div class="flex items-center justify-between rounded-lg border border-[var(--color-border)] bg-[var(--color-card)] px-4 py-3">
							<div class="flex items-center gap-2 text-xs text-[var(--color-muted)]">
								<Calendar class="h-3.5 w-3.5" />
								{formatDate(metric.date)}
							</div>
							<div class="text-right">
								<span class="font-semibold text-[var(--color-foreground)]">
									{metric.weight_kg !== null ? formatWeight(metric.weight_kg, currentUnit) : '—'}
								</span>
								{#if metric.body_fat_percentage}
									<p class="text-xs text-[var(--color-muted)]">{metric.body_fat_percentage.toFixed(1)}% BF</p>
								{/if}
							</div>
						</div>
					{/each}
				</div>
			{:else if !isLoading}
				<div class="fitness-card py-10 text-center">
					<Scale class="mx-auto mb-3 h-10 w-10 text-[var(--color-muted)] opacity-40" />
					<p class="text-sm text-[var(--color-muted)]">No weight data yet</p>
					<button onclick={() => (showAddForm = true)} class="mt-3 rounded-lg bg-[var(--color-primary)] px-6 py-2 text-sm font-semibold text-white">
						Log First Weight
					</button>
				</div>
			{/if}
		</div>
	</div>
</div>

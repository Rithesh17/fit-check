<script lang="ts">
	import { onMount } from 'svelte';
	import { supabase } from '$lib/supabase/client';
	import { goto } from '$app/navigation';
	import { Scale, TrendingDown, Calendar, Plus, Download } from 'lucide-svelte';
	import WeightChart from '$lib/components/WeightChart.svelte';
	import { exportAsJSON, exportWorkoutsAsCSV, exportBodyMetricsAsCSV, downloadFile } from '$lib/utils/export';
	import { unitPreference, type WeightUnit } from '$lib/stores/unit-preference';
	import { convertWeight, formatWeight, getWeightUnitLabel, lbsToKg } from '$lib/utils/weight-conversion';

	let bodyMetrics = $state<Array<{ id: string; date: string; weight_kg: number | null; body_fat_percentage: number | null }>>([]);
	let isLoading = $state(true);
	let showAddForm = $state(false);
	let newWeight = $state('');
	let newBodyFat = $state('');
	let newDate = $state(new Date().toISOString().split('T')[0]);
	
	let currentUnit = $state<WeightUnit>('kg');
	
	// Subscribe to unit preference
	$effect(() => {
		const unsubscribe = unitPreference.subscribe((unit) => {
			currentUnit = unit;
		});
		return unsubscribe;
	});

	onMount(async () => {
		await loadBodyMetrics();
	});

	async function loadBodyMetrics() {
		try {
			isLoading = true;
			const { data, error } = await supabase
				.from('body_metrics')
				.select('*')
				.order('date', { ascending: false })
				.limit(30);

			if (error) throw error;
			bodyMetrics = (data || []).map((m) => ({
				id: m.id,
				date: m.date,
				weight_kg: m.weight_kg,
				body_fat_percentage: m.body_fat_percentage
			}));
		} catch (error) {
			console.error('Error loading body metrics:', error);
		} finally {
			isLoading = false;
		}
	}

	async function saveBodyMetric() {
		if (!newWeight) {
			alert('Please enter your weight');
			return;
		}

		try {
			// Convert weight to kg if user entered in lbs
			const weightValue = parseFloat(newWeight);
			const weightKg = currentUnit === 'lbs' ? lbsToKg(weightValue) : weightValue;

			const { error } = await supabase.from('body_metrics').insert({
				date: newDate,
				weight_kg: weightKg,
				body_fat_percentage: newBodyFat ? parseFloat(newBodyFat) : null
			});

			if (error) throw error;

			// Reset form and reload
			newWeight = '';
			newBodyFat = '';
			newDate = new Date().toISOString().split('T')[0];
			showAddForm = false;
			await loadBodyMetrics();
		} catch (error) {
			console.error('Error saving body metric:', error);
			alert('Failed to save. Please try again.');
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
								onclick={saveBodyMetric}
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

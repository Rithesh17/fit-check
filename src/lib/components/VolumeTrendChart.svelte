<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import {
		Chart,
		CategoryScale,
		LinearScale,
		PointElement,
		LineElement,
		LineController,
		Title,
		Tooltip,
		Legend,
		Filler
	} from 'chart.js';
	import { calculateWorkoutVolumes, type WorkoutVolume } from '$lib/utils/progress';
	import { supabase } from '$lib/supabase/client';
	import { convertWeight, getWeightUnitLabel, type WeightUnit } from '$lib/utils/weight-conversion';
	import { unitPreference } from '$lib/stores/unit-preference';
	import { getChartTheme, hexToRgba } from '$lib/utils/chart-theme';

	let volumes = $state<WorkoutVolume[]>([]);
	let isLoading = $state(true);
	let chartCanvas = $state<HTMLCanvasElement | null>(null);
	let chartInstance: Chart | null = null;
	let currentUnit = $state<WeightUnit>('kg');
	
	// Register Chart.js components once at module level
	Chart.register(
		CategoryScale,
		LinearScale,
		PointElement,
		LineElement,
		LineController,
		Title,
		Tooltip,
		Legend,
		Filler
	);
	
	// Subscribe to unit preference
	$effect(() => {
		const unsubscribe = unitPreference.subscribe((unit) => {
			currentUnit = unit;
		});
		return unsubscribe;
	});

	$effect(() => {
		loadVolumeData();
	});

	$effect(() => {
		if (chartCanvas && volumes.length > 0 && !isLoading) {
			createChart();
		}
		return () => {
			if (chartInstance) {
				chartInstance.destroy();
				chartInstance = null;
			}
		};
	});
	
	// Recreate chart when unit changes
	$effect(() => {
		if (chartCanvas && volumes.length > 0 && !isLoading) {
			createChart();
		}
	});

	async function loadVolumeData() {
		try {
			isLoading = true;
			const { data: workouts, error } = await supabase
				.from('workouts')
				.select(`
					id,
					date,
					workout_exercises(sets)
				`)
				.order('date', { ascending: true });

			if (error) throw error;

			const workoutData = (workouts || []).map((w: any) => ({
				date: w.date,
				exercises: (w.workout_exercises || []).map((we: any) => ({
					sets: we.sets || []
				}))
			}));

			volumes = calculateWorkoutVolumes(workoutData);
		} catch (error) {
			console.error('Error loading volume data:', error);
		} finally {
			isLoading = false;
		}
	}

	function createChart() {
		if (!chartCanvas || volumes.length === 0) return;

		// Destroy existing chart
		if (chartInstance) {
			chartInstance.destroy();
		}

		const labels = volumes.map((v) => v.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
		const data = volumes.map((v) => convertWeight(v.totalVolume, currentUnit));
		const unitLabel = getWeightUnitLabel(currentUnit);
		const t = getChartTheme();

		chartInstance = new Chart(chartCanvas, {
			type: 'line',
			data: {
				labels,
				datasets: [
					{
						label: `Total Volume (${unitLabel})`,
						data,
						borderColor: t.primary,
						backgroundColor: hexToRgba(t.primary, 0.18),
						fill: true,
						tension: 0.4,
						pointRadius: 4,
						pointHoverRadius: 6,
						pointBackgroundColor: t.primary,
						pointBorderColor: t.background,
						pointBorderWidth: 2
					}
				]
			},
			options: {
				responsive: true,
				maintainAspectRatio: false,
				plugins: {
					legend: {
						display: false
					},
					tooltip: {
						backgroundColor: t.card,
						titleColor: t.foreground,
						bodyColor: t.foreground,
						borderColor: t.border,
						borderWidth: 1,
						padding: 12,
						displayColors: false
					}
				},
				scales: {
					x: {
						border: {
							display: false
						},
						grid: {
							color: hexToRgba(t.foreground, 0.08)
						},
						ticks: {
							color: t.muted,
							font: { size: 11 }
						}
					},
					y: {
						border: {
							display: false
						},
						grid: {
							color: hexToRgba(t.foreground, 0.08)
						},
						ticks: {
							color: t.muted,
							font: { size: 11 }
						}
					}
				}
			}
		});
	}
</script>

<div class="volume-trend-chart fitness-card">
	<h3 class="text-lg font-bold text-[var(--color-foreground)] mb-4">Volume Trends</h3>
	{#if isLoading}
		<div class="text-center py-8 text-[var(--color-muted)]">Loading...</div>
	{:else if volumes.length === 0}
		<div class="text-center py-8 text-[var(--color-muted)]">No volume data yet</div>
	{:else}
		<div class="chart-container">
			<canvas bind:this={chartCanvas}></canvas>
		</div>
	{/if}
</div>

<style>
	.chart-container {
		height: 300px;
		position: relative;
	}
</style>

<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import {
		Chart,
		CategoryScale,
		LinearScale,
		PointElement,
		LineElement,
		Title,
		Tooltip,
		Legend,
		Filler
	} from 'chart.js';
	import { calculateWorkoutVolumes, type WorkoutVolume } from '$lib/utils/progress';
	import { supabase } from '$lib/supabase/client';

	let volumes = $state<WorkoutVolume[]>([]);
	let isLoading = $state(true);
	let chartCanvas: HTMLCanvasElement;
	let chartInstance: Chart | null = null;

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

		// Register Chart.js components
		Chart.register(
			CategoryScale,
			LinearScale,
			PointElement,
			LineElement,
			Title,
			Tooltip,
			Legend,
			Filler
		);

		const labels = volumes.map((v) => v.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
		const data = volumes.map((v) => v.totalVolume);

		chartInstance = new Chart(chartCanvas, {
			type: 'line',
			data: {
				labels,
				datasets: [
					{
						label: 'Total Volume (kg)',
						data,
						borderColor: 'var(--color-primary)',
						backgroundColor: 'rgba(255, 107, 53, 0.1)',
						fill: true,
						tension: 0.4,
						pointRadius: 4,
						pointHoverRadius: 6,
						pointBackgroundColor: 'var(--color-primary)',
						pointBorderColor: '#000',
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
						backgroundColor: 'var(--color-card)',
						titleColor: 'var(--color-foreground)',
						bodyColor: 'var(--color-foreground)',
						borderColor: 'var(--color-border)',
						borderWidth: 1,
						padding: 12,
						displayColors: false
					}
				},
				scales: {
					x: {
						grid: {
							color: 'var(--color-border)',
							drawBorder: false
						},
						ticks: {
							color: 'var(--color-muted)',
							font: { size: 11 }
						}
					},
					y: {
						grid: {
							color: 'var(--color-border)',
							drawBorder: false
						},
						ticks: {
							color: 'var(--color-muted)',
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

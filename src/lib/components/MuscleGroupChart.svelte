<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { Chart, ArcElement, DoughnutController, Tooltip, Legend } from 'chart.js';
	import { supabase } from '$lib/supabase/client';
	import { getExerciseById } from '$lib/data/exercises';
	import { loadCustomExercises, type CustomExercise } from '$lib/services/exercises';
	import { getChartTheme } from '$lib/utils/chart-theme';

	let muscleGroupData = $state<Map<string, number>>(new Map());
	let isLoading = $state(true);
	let chartCanvas = $state<HTMLCanvasElement | null>(null);
	let chartInstance: Chart | null = null;
	
	// Custom exercises from database
	let customExercises = $state<CustomExercise[]>([]);

	$effect(() => {
		loadMuscleGroupData();
	});

	$effect(() => {
		if (chartCanvas && muscleGroupData.size > 0 && !isLoading) {
			createChart();
		}
		return () => {
			if (chartInstance) {
				chartInstance.destroy();
				chartInstance = null;
			}
		};
	});

	async function loadMuscleGroupData() {
		try {
			isLoading = true;
			customExercises = await loadCustomExercises();
			
			const { data: workoutExercises, error } = await supabase
				.from('workout_exercises')
				.select('exercise_id, sets');

			if (error) throw error;

			const groupCounts = new Map<string, number>();

			(workoutExercises || []).forEach((we: any) => {
				const exercise = getExerciseById(we.exercise_id) || customExercises.find(ce => ce.id === we.exercise_id);
				if (exercise) {
					exercise.muscleGroups.forEach((group) => {
						const current = groupCounts.get(group) || 0;
						// Count sets completed
						const completedSets = (we.sets || []).filter((s: any) => s.completed).length;
						groupCounts.set(group, current + completedSets);
					});
				}
			});

			muscleGroupData = groupCounts;
		} catch (error) {
			console.error('Error loading muscle group data:', error);
		} finally {
			isLoading = false;
		}
	}

	function createChart() {
		if (!chartCanvas || muscleGroupData.size === 0) return;

		// Destroy existing chart
		if (chartInstance) {
			chartInstance.destroy();
		}

		Chart.register(DoughnutController, ArcElement, Tooltip, Legend);

		const labels = Array.from(muscleGroupData.keys());
		const data = Array.from(muscleGroupData.values());
		const total = data.reduce((sum, val) => sum + val, 0);

		const backgroundColor = [
			'#ff6b35',
			'#00d9ff',
			'#00ff88',
			'#ff9a00',
			'#00aaff',
			'#00cc66',
			'#ff6b9d',
			'#9b59b6',
			'#3498db',
			'#e74c3c'
		];

		const t = getChartTheme();

		chartInstance = new Chart(chartCanvas, {
			type: 'doughnut',
			data: {
				labels: labels.map((label) => `${label} (${((muscleGroupData.get(label)! / total) * 100).toFixed(1)}%)`),
				datasets: [
					{
						data,
						backgroundColor
					}
				]
			},
			options: {
				responsive: true,
				maintainAspectRatio: false,
				plugins: {
					legend: {
						position: 'bottom',
						labels: {
							color: t.foreground,
							font: { size: 11 },
							padding: 12,
							boxWidth: 12,
							boxHeight: 12
						}
					},
					tooltip: {
						backgroundColor: t.card,
						titleColor: t.foreground,
						bodyColor: t.foreground,
						borderColor: t.border,
						borderWidth: 1,
						padding: 12
					}
				}
			}
		});
	}
</script>

<div class="muscle-group-chart fitness-card">
	<h3 class="text-lg font-bold text-[var(--color-foreground)] mb-4">Muscle Group Distribution</h3>
	{#if isLoading}
		<div class="text-center py-8 text-[var(--color-muted)]">Loading...</div>
	{:else if muscleGroupData.size === 0}
		<div class="text-center py-8 text-[var(--color-muted)]">No data yet</div>
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

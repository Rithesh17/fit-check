<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { Chart, ArcElement, Tooltip, Legend } from 'chart.js';
	import { supabase } from '$lib/supabase/client';
	import { getExerciseById, type ExerciseType } from '$lib/data/exercises';
	import type { Exercise } from '$lib/data/exercises';

	let muscleGroupData = $state<Map<string, number>>(new Map());
	let isLoading = $state(true);
	let chartCanvas: HTMLCanvasElement;
	let chartInstance: Chart | null = null;
	
	// Custom exercises from database
	let customExercises = $state<Array<Exercise & { id: string; isCustom: boolean }>>([]);

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

	async function loadCustomExercises() {
		try {
			const { data, error } = await supabase
				.from('user_exercises')
				.select('*')
				.order('created_at', { ascending: false });

			if (error) {
				console.error('Error loading custom exercises:', error);
				return;
			}

			customExercises = (data || []).map((ex: any) => ({
				id: ex.id,
				name: ex.name,
				exerciseType: (ex.exercise_type || 'weights') as ExerciseType,
				muscleGroups: ex.muscle_groups || [],
				equipment: ex.equipment,
				defaultSets: ex.default_sets,
				defaultReps: ex.default_reps,
				defaultRestSeconds: ex.default_rest_seconds,
				defaultDurationMinutes: ex.default_duration_minutes,
				defaultCalories: ex.default_calories,
				defaultDurationSeconds: ex.default_duration_seconds,
				defaultRepsStretches: ex.default_reps_stretches,
				instructions: ex.instructions || '',
				videoUrl: ex.video_url || '',
				isCustom: true
			}));
		} catch (error) {
			console.error('Error loading custom exercises:', error);
		}
	}

	async function loadMuscleGroupData() {
		try {
			isLoading = true;
			await loadCustomExercises();
			
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

		// Register Chart.js components
		Chart.register(ArcElement, Tooltip, Legend);

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
							color: 'var(--color-foreground)',
							font: { size: 11 },
							padding: 12
						}
					},
					tooltip: {
						backgroundColor: 'var(--color-card)',
						titleColor: 'var(--color-foreground)',
						bodyColor: 'var(--color-foreground)',
						borderColor: 'var(--color-border)',
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

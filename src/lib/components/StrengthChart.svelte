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
	import type { ExerciseProgress } from '$lib/utils/progress';
	import { convertWeight, getWeightUnitLabel, type WeightUnit } from '$lib/utils/weight-conversion';

	let { progress, type = 'weight', unit = 'kg' }: { progress: ExerciseProgress; type?: 'weight' | 'volume'; unit?: WeightUnit } = $props();

	let chartCanvas: HTMLCanvasElement;
	let chartInstance: Chart | null = null;
	let isChartInitialized = $state(false);

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

	function createChart() {
		if (!chartCanvas || !progress.dates.length) return;

		// Destroy existing chart if it exists
		if (chartInstance) {
			chartInstance.destroy();
			chartInstance = null;
		}

		const labels = progress.dates.map((date) => {
			return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
		});

		const data = type === 'weight' 
			? progress.weights.map(w => convertWeight(w, unit))
			: progress.volumes.map(v => convertWeight(v, unit));
		const unitLabel = getWeightUnitLabel(unit);
		const label = type === 'weight' ? `Max Weight (${unitLabel})` : `Volume (${unitLabel})`;
		const color = type === 'weight' ? 'var(--color-primary)' : 'var(--color-secondary)';

		chartInstance = new Chart(chartCanvas, {
			type: 'line',
			data: {
				labels,
				datasets: [
					{
						label,
						data,
						borderColor: color,
						backgroundColor: color + '40',
						fill: true,
						tension: 0.4,
						pointRadius: 4,
						pointHoverRadius: 6,
						pointBackgroundColor: color,
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
							font: {
								size: 11
							}
						}
					},
					y: {
						grid: {
							color: 'var(--color-border)',
							drawBorder: false
						},
						ticks: {
							color: 'var(--color-muted)',
							font: {
								size: 11
							}
						},
						beginAtZero: true
					}
				}
			}
		});
		
		isChartInitialized = true;
	}

	function updateChart() {
		if (!chartInstance || !isChartInitialized) return;

		const labels = progress.dates.map((date) => {
			return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
		});

		const data = type === 'weight' 
			? progress.weights.map(w => convertWeight(w, unit))
			: progress.volumes.map(v => convertWeight(v, unit));
		const unitLabel = getWeightUnitLabel(unit);
		const label = type === 'weight' ? `Max Weight (${unitLabel})` : `Volume (${unitLabel})`;

		chartInstance.data.labels = labels;
		chartInstance.data.datasets[0].data = data;
		chartInstance.data.datasets[0].label = label;
		chartInstance.update();
	}

	onMount(() => {
		createChart();
	});

	// Update chart when unit or type changes
	$effect(() => {
		if (isChartInitialized && chartInstance) {
			updateChart();
		}
	});

	onDestroy(() => {
		if (chartInstance) {
			chartInstance.destroy();
		}
	});
</script>

<div class="w-full" style="height: 250px;">
	<canvas bind:this={chartCanvas}></canvas>
</div>

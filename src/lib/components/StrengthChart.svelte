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
	import type { ExerciseProgress } from '$lib/utils/progress';

	let { progress, type = 'weight' }: { progress: ExerciseProgress; type?: 'weight' | 'volume' } = $props();

	let chartCanvas: HTMLCanvasElement;
	let chartInstance: Chart | null = null;

	onMount(() => {
		if (!chartCanvas || !progress.dates.length) return;

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

		const labels = progress.dates.map((date) => {
			return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
		});

		const data = type === 'weight' ? progress.weights : progress.volumes;
		const label = type === 'weight' ? 'Max Weight (kg)' : 'Volume (kg)';
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

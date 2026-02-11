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

	interface WeightData {
		date: string;
		weight_kg: number | null;
		body_fat_percentage: number | null;
	}

	let { data }: { data: WeightData[] } = $props();

	let chartCanvas: HTMLCanvasElement;
	let chartInstance: Chart | null = null;

	onMount(() => {
		if (!chartCanvas || !data.length) return;

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

		const weightData = data
			.filter((d) => d.weight_kg !== null)
			.map((d) => ({ date: d.date, weight: d.weight_kg! }))
			.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

		const labels = weightData.map((d) => {
			const date = new Date(d.date);
			return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
		});

		const weights = weightData.map((d) => d.weight);

		chartInstance = new Chart(chartCanvas, {
			type: 'line',
			data: {
				labels,
				datasets: [
					{
						label: 'Weight (kg)',
						data: weights,
						borderColor: 'var(--color-primary)',
						backgroundColor: 'var(--color-primary)40',
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
						}
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

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
	import { convertWeight, getWeightUnitLabel, type WeightUnit } from '$lib/utils/weight-conversion';

	interface WeightData {
		date: string;
		weight_kg: number | null;
		body_fat_percentage: number | null;
	}

	let { data, unit = 'kg' }: { data: WeightData[]; unit?: WeightUnit } = $props();

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
		if (!chartCanvas || !data.length) return;

		// Destroy existing chart if it exists
		if (chartInstance) {
			chartInstance.destroy();
			chartInstance = null;
		}

		const weightData = data
			.filter((d) => d.weight_kg !== null)
			.map((d) => ({ 
				date: d.date, 
				weight: convertWeight(d.weight_kg!, unit) 
			}))
			.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

		const labels = weightData.map((d) => {
			const date = new Date(d.date);
			return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
		});

		const weights = weightData.map((d) => d.weight);
		const unitLabel = getWeightUnitLabel(unit);

		chartInstance = new Chart(chartCanvas, {
			type: 'line',
			data: {
				labels,
				datasets: [
					{
						label: `Weight (${unitLabel})`,
						data: weights,
						borderColor: '#FF6B35',
						borderWidth: 4,
						fill: false,
						tension: 0.4,
						pointRadius: 6,
						pointHoverRadius: 8,
						pointBackgroundColor: '#FF6B35',
						pointBorderColor: '#FFFFFF',
						pointBorderWidth: 3
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
						border: {
							color: '#FF6B35',
							width: 2
						},
						grid: {
							color: 'rgba(255, 107, 53, 0.1)'
						},
						ticks: {
							color: '#FFFFFF',
							font: {
								size: 13,
								weight: 'bold'
							},
							padding: 8
						}
					},
					y: {
						border: {
							color: '#FF6B35',
							width: 2
						},
						grid: {
							color: 'rgba(255, 107, 53, 0.1)'
						},
						ticks: {
							color: '#FFFFFF',
							font: {
								size: 13,
								weight: 'bold'
							},
							padding: 8
						}
					}
				}
			}
		});
		
		isChartInitialized = true;
	}

	function updateChart() {
		if (!chartInstance || !isChartInitialized) return;

		const weightData = data
			.filter((d) => d.weight_kg !== null)
			.map((d) => ({ 
				date: d.date, 
				weight: convertWeight(d.weight_kg!, unit) 
			}))
			.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

		const labels = weightData.map((d) => {
			const date = new Date(d.date);
			return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
		});

		const weights = weightData.map((d) => d.weight);
		const unitLabel = getWeightUnitLabel(unit);

		chartInstance.data.labels = labels;
		chartInstance.data.datasets[0].data = weights;
		chartInstance.data.datasets[0].label = `Weight (${unitLabel})`;
		chartInstance.update();
	}

	onMount(() => {
		createChart();
	});

	// Update chart when unit or data changes
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

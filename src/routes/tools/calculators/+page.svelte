<script lang="ts">
	import Calculators from '$lib/components/Calculators.svelte';
</script>

<svelte:head>
	<title>Calculators - Fit Check</title>
</svelte:head>

<div class="min-h-screen bg-[var(--color-background)] pb-20">
	<!-- Header -->
	<div class="sticky top-0 z-10 bg-[var(--color-background)]/95 backdrop-blur-sm border-b border-[var(--color-border)]">
		<div class="max-w-md mx-auto px-4 py-4">
			<h1 class="text-2xl font-bold text-[var(--color-foreground)]">Fitness Calculators</h1>
		</div>
	</div>

	<div class="max-w-md mx-auto px-4 py-6">
		<Calculators />
	</div>
</div>

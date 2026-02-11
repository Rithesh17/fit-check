<script lang="ts">
	import { onMount } from 'svelte';
	import { exercises, getExercisesByMuscleGroup, searchExercises, type Exercise } from '$lib/data/exercises';
	import { Search, Filter, X } from 'lucide-svelte';

	let searchQuery = $state('');
	let selectedMuscleGroup = $state<string | null>(null);
	let selectedEquipment = $state<string | null>(null);

	// Get unique muscle groups and equipment
	const muscleGroups = $derived(
		Array.from(new Set(exercises.flatMap((ex) => ex.muscleGroups))).sort()
	);
	const equipmentTypes = $derived(
		Array.from(new Set(exercises.map((ex) => ex.equipment))).sort()
	);

	// Filter exercises
	let filteredExercises = $derived.by(() => {
		let result = exercises;

		// Search filter
		if (searchQuery) {
			result = searchExercises(searchQuery);
		}

		// Muscle group filter
		if (selectedMuscleGroup) {
			result = result.filter((ex) => ex.muscleGroups.includes(selectedMuscleGroup));
		}

		// Equipment filter
		if (selectedEquipment) {
			result = result.filter((ex) => ex.equipment === selectedEquipment);
		}

		return result;
	});

	function clearFilters() {
		searchQuery = '';
		selectedMuscleGroup = null;
		selectedEquipment = null;
	}

	let hasActiveFilters = $derived(
		searchQuery !== '' || selectedMuscleGroup !== null || selectedEquipment !== null
	);
</script>

<svelte:head>
	<title>Exercise Library - Fit Check</title>
</svelte:head>

<div class="min-h-screen bg-[var(--color-background)] pb-20">
	<!-- Header -->
	<div class="sticky top-0 z-10 bg-[var(--color-background)]/95 backdrop-blur-sm border-b border-[var(--color-border)]">
		<div class="max-w-md mx-auto px-4 py-4">
			<h1 class="text-2xl font-bold text-[var(--color-foreground)] mb-4">Exercise Library</h1>

			<!-- Search -->
			<div class="relative mb-3">
				<Search class="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--color-muted)]" />
				<input
					type="text"
					bind:value={searchQuery}
					placeholder="Search exercises..."
					class="w-full pl-10 pr-4 py-3 bg-[var(--color-card)] border border-[var(--color-border)] rounded-lg text-[var(--color-foreground)] focus:outline-none focus:border-[var(--color-primary)]"
				/>
			</div>

			<!-- Filters -->
			<div class="flex items-center gap-2 flex-wrap">
				<!-- Muscle Group Filter -->
				<select
					bind:value={selectedMuscleGroup}
					class="flex-1 min-w-[120px] px-3 py-2 bg-[var(--color-card)] border border-[var(--color-border)] rounded-lg text-[var(--color-foreground)] text-sm focus:outline-none focus:border-[var(--color-primary)]"
				>
					<option value={null}>All Muscle Groups</option>
					{#each muscleGroups as mg}
						<option value={mg}>{mg.charAt(0).toUpperCase() + mg.slice(1)}</option>
					{/each}
				</select>

				<!-- Equipment Filter -->
				<select
					bind:value={selectedEquipment}
					class="flex-1 min-w-[120px] px-3 py-2 bg-[var(--color-card)] border border-[var(--color-border)] rounded-lg text-[var(--color-foreground)] text-sm focus:outline-none focus:border-[var(--color-primary)]"
				>
					<option value={null}>All Equipment</option>
					{#each equipmentTypes as eq}
						<option value={eq}>{eq}</option>
					{/each}
				</select>

				{#if hasActiveFilters}
					<button
						onclick={clearFilters}
						class="px-3 py-2 bg-[var(--color-card-hover)] border border-[var(--color-border)] rounded-lg text-[var(--color-muted)] hover:text-[var(--color-foreground)] transition-colors"
					>
						<X class="w-4 h-4" />
					</button>
				{/if}
			</div>

			<!-- Results count -->
			{#if hasActiveFilters}
				<p class="text-sm text-[var(--color-muted)] mt-2">
					{filteredExercises.length} exercise{filteredExercises.length !== 1 ? 's' : ''} found
				</p>
			{/if}
		</div>
	</div>

	<!-- Exercise List -->
	<div class="max-w-md mx-auto px-4 py-6">
		{#if filteredExercises.length === 0}
			<div class="fitness-card text-center py-12">
				<p class="text-[var(--color-muted)] mb-4">No exercises found</p>
				<button
					onclick={clearFilters}
					class="px-4 py-2 bg-[var(--color-primary)] text-white rounded-lg font-medium"
				>
					Clear Filters
				</button>
			</div>
		{:else}
			<div class="space-y-3">
				{#each filteredExercises as exercise}
					<div class="fitness-card">
						<div class="flex items-start justify-between mb-3">
							<div class="flex-1">
								<h3 class="text-lg font-semibold text-[var(--color-foreground)] mb-2">
									{exercise.name}
								</h3>
								<p class="text-sm text-[var(--color-muted)] mb-3">{exercise.equipment}</p>
								<div class="flex flex-wrap gap-2 mb-3">
									{#each exercise.muscleGroups as mg}
										<span class="px-2 py-1 bg-[var(--color-primary)]/20 text-[var(--color-primary)] text-xs rounded-full">
											{mg}
										</span>
									{/each}
								</div>
								{#if exercise.instructions}
									<p class="text-sm text-[var(--color-muted)] leading-relaxed">
										{exercise.instructions}
									</p>
								{/if}
							</div>
						</div>
						<div class="pt-3 border-t border-[var(--color-border)] flex items-center gap-4 text-xs text-[var(--color-muted)]">
							<span>Default: {exercise.defaultSets} sets × {exercise.defaultReps} reps</span>
							<span>•</span>
							<span>Rest: {exercise.defaultRestSeconds}s</span>
						</div>
					</div>
				{/each}
			</div>
		{/if}
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

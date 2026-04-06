<script lang="ts">
	import { onMount } from 'svelte';
	import { exercises, type Exercise } from '$lib/data/exercises';
	import { EXERCISE_LIBRARY_PAGE_SIZE } from '$lib/data/config';
	import { Search, X, Plus, ChevronLeft, ChevronRight } from 'lucide-svelte';
	import ExerciseDetail from '$lib/components/ExerciseDetail.svelte';
	import ExerciseEditor from '$lib/components/ExerciseEditor.svelte';
	import { loadCustomExercises } from '$lib/services/exercises';
	import { toast } from '$lib/stores/toast';

	let customExercises = $state<Array<Exercise & { id: string; isCustom?: boolean }>>([]);
	let selectedExercise = $state<Exercise | null>(null);
	let exerciseToEdit = $state<Exercise | null>(null);
	let showEditor = $state(false);
	let isCustomEdit = $state(false);

	// Filters
	let searchQuery = $state('');
	let selectedMuscleGroup = $state<string | null>(null);
	let selectedEquipment = $state<string | null>(null);
	let selectedExerciseType = $state<string | null>(null);
	let currentPage = $state(1);

	const allExercises = $derived([...exercises, ...customExercises]);

	const muscleGroups = $derived(
		Array.from(new Set(allExercises.flatMap((ex) => ex.muscleGroups))).sort()
	);
	const equipmentTypes = $derived(
		Array.from(new Set(allExercises.map((ex) => ex.equipment))).sort()
	);

	const filteredExercises = $derived.by(() => {
		let result = allExercises;
		if (searchQuery) {
			const q = searchQuery.toLowerCase();
			result = result.filter(
				(ex) =>
					ex.name.toLowerCase().includes(q) ||
					ex.muscleGroups.some((mg) => mg.toLowerCase().includes(q)) ||
					ex.equipment.toLowerCase().includes(q)
			);
		}
		if (selectedMuscleGroup) result = result.filter((ex) => ex.muscleGroups.includes(selectedMuscleGroup!));
		if (selectedEquipment) result = result.filter((ex) => ex.equipment === selectedEquipment);
		if (selectedExerciseType) result = result.filter((ex) => ex.exerciseType === selectedExerciseType);
		return result;
	});

	const totalPages = $derived(Math.ceil(filteredExercises.length / EXERCISE_LIBRARY_PAGE_SIZE));
	const paginatedExercises = $derived.by(() => {
		const start = (currentPage - 1) * EXERCISE_LIBRARY_PAGE_SIZE;
		return filteredExercises.slice(start, start + EXERCISE_LIBRARY_PAGE_SIZE);
	});

	const hasActiveFilters = $derived(
		!!searchQuery || !!selectedMuscleGroup || !!selectedEquipment || !!selectedExerciseType
	);

	// Reset to page 1 on filter change
	$effect(() => {
		void searchQuery; void selectedMuscleGroup; void selectedEquipment; void selectedExerciseType;
		currentPage = 1;
	});

	onMount(async () => {
		customExercises = await loadCustomExercises();
	});

	function clearFilters() {
		searchQuery = '';
		selectedMuscleGroup = null;
		selectedEquipment = null;
		selectedExerciseType = null;
	}

	function openEditor(exercise: Exercise | null, isCustom: boolean) {
		exerciseToEdit = exercise;
		isCustomEdit = isCustom;
		showEditor = true;
	}

	async function onEditorSave() {
		showEditor = false;
		customExercises = await loadCustomExercises();
		toast.success('Exercise saved');
	}

	function capitalize(s: string) {
		return s.charAt(0).toUpperCase() + s.slice(1);
	}
</script>

<svelte:head>
	<title>Exercise Library — Fit Check</title>
</svelte:head>

<div class="min-h-screen bg-[var(--color-background)] pb-24">
	<!-- Header -->
	<div class="sticky top-0 z-10 border-b border-[var(--color-border)] bg-[var(--color-background)]/95 backdrop-blur-sm">
		<div class="mx-auto max-w-md px-4 pt-4">
			<div class="mb-3 flex items-center gap-3">
				<a href="/log" class="text-[var(--color-muted)] hover:text-[var(--color-foreground)]">
					<ChevronLeft class="h-5 w-5" />
				</a>
				<h1 class="flex-1 text-xl font-bold text-[var(--color-foreground)]">Exercise Library</h1>
				<button
					onclick={() => openEditor(null, true)}
					class="flex items-center gap-1.5 rounded-lg bg-[var(--color-primary)] px-3 py-1.5 text-sm font-semibold text-white"
				>
					<Plus class="h-4 w-4" />
					Add
				</button>
			</div>

			<!-- Search -->
			<div class="relative mb-3">
				<Search class="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-muted)]" />
				<input
					type="text"
					bind:value={searchQuery}
					placeholder="Search exercises..."
					class="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-card)] py-2.5 pl-9 pr-4 text-sm text-[var(--color-foreground)] placeholder:text-[var(--color-muted)] focus:border-[var(--color-primary)] focus:outline-none"
				/>
			</div>

			<!-- Filters row -->
			<div class="flex gap-2 pb-3">
				<select
					bind:value={selectedExerciseType}
					class="flex-1 rounded-lg border border-[var(--color-border)] bg-[var(--color-card)] px-2 py-2 text-xs text-[var(--color-foreground)] focus:border-[var(--color-primary)] focus:outline-none"
				>
					<option value={null}>All types</option>
					<option value="weights">Weights</option>
					<option value="bodyweight">Bodyweight</option>
					<option value="cardio">Cardio</option>
					<option value="stretches">Stretches</option>
				</select>

				<select
					bind:value={selectedMuscleGroup}
					class="flex-1 rounded-lg border border-[var(--color-border)] bg-[var(--color-card)] px-2 py-2 text-xs text-[var(--color-foreground)] focus:border-[var(--color-primary)] focus:outline-none"
				>
					<option value={null}>All muscles</option>
					{#each muscleGroups as mg}
						<option value={mg}>{capitalize(mg)}</option>
					{/each}
				</select>

				<select
					bind:value={selectedEquipment}
					class="flex-1 rounded-lg border border-[var(--color-border)] bg-[var(--color-card)] px-2 py-2 text-xs text-[var(--color-foreground)] focus:border-[var(--color-primary)] focus:outline-none"
				>
					<option value={null}>All equipment</option>
					{#each equipmentTypes as eq}
						<option value={eq}>{eq}</option>
					{/each}
				</select>

				{#if hasActiveFilters}
					<button
						onclick={clearFilters}
						class="flex-shrink-0 rounded-lg border border-[var(--color-border)] bg-[var(--color-card)] p-2 text-[var(--color-muted)] hover:text-[var(--color-foreground)]"
					>
						<X class="h-4 w-4" />
					</button>
				{/if}
			</div>

			<!-- Count -->
			<p class="pb-2 text-xs text-[var(--color-muted)]">
				{filteredExercises.length} exercise{filteredExercises.length !== 1 ? 's' : ''}
				{#if totalPages > 1}
					· page {currentPage} of {totalPages}
				{/if}
			</p>
		</div>
	</div>

	<!-- Exercise list -->
	<div class="mx-auto max-w-md space-y-2 px-4 py-4">
		{#if paginatedExercises.length === 0}
			<div class="py-16 text-center">
				<p class="text-[var(--color-muted)]">No exercises found</p>
				{#if hasActiveFilters}
					<button
						onclick={clearFilters}
						class="mt-3 text-sm text-[var(--color-primary)] hover:underline"
					>
						Clear filters
					</button>
				{/if}
			</div>
		{:else}
			{#each paginatedExercises as exercise}
				<button
					onclick={() => (selectedExercise = exercise)}
					class="fitness-card w-full text-left transition-all hover:border-[var(--color-primary)]/30"
				>
					<div class="flex items-start justify-between">
						<div class="min-w-0 flex-1">
							<div class="mb-1 flex items-center gap-2">
								<h3 class="font-semibold text-[var(--color-foreground)]">{exercise.name}</h3>
								<span class="rounded-full bg-[var(--color-accent)]/15 px-2 py-0.5 text-xs font-medium text-[var(--color-accent)]">
									{capitalize(exercise.exerciseType)}
								</span>
							</div>
							<p class="mb-2 text-xs text-[var(--color-muted)]">{exercise.equipment}</p>
							<div class="flex flex-wrap gap-1">
								{#each exercise.muscleGroups.slice(0, 3) as mg}
									<span class="rounded-full bg-[var(--color-primary)]/10 px-2 py-0.5 text-xs text-[var(--color-primary)]">
										{mg}
									</span>
								{/each}
							</div>
						</div>
					</div>
				</button>
			{/each}

			<!-- Pagination -->
			{#if totalPages > 1}
				<div class="flex items-center justify-between border-t border-[var(--color-border)] pt-4">
					<button
						onclick={() => (currentPage = Math.max(1, currentPage - 1))}
						disabled={currentPage === 1}
						class="flex items-center gap-1.5 rounded-lg border border-[var(--color-border)] px-3 py-2 text-sm text-[var(--color-foreground)] transition-colors hover:bg-[var(--color-card-hover)] disabled:cursor-not-allowed disabled:opacity-40"
					>
						<ChevronLeft class="h-4 w-4" />
						Prev
					</button>
					<span class="text-xs text-[var(--color-muted)]">
						{currentPage} / {totalPages}
					</span>
					<button
						onclick={() => (currentPage = Math.min(totalPages, currentPage + 1))}
						disabled={currentPage === totalPages}
						class="flex items-center gap-1.5 rounded-lg border border-[var(--color-border)] px-3 py-2 text-sm text-[var(--color-foreground)] transition-colors hover:bg-[var(--color-card-hover)] disabled:cursor-not-allowed disabled:opacity-40"
					>
						Next
						<ChevronRight class="h-4 w-4" />
					</button>
				</div>
			{/if}
		{/if}
	</div>
</div>

<!-- Exercise Detail Modal -->
{#if selectedExercise}
	<ExerciseDetail
		exercise={selectedExercise}
		onClose={() => (selectedExercise = null)}
		onEdit={(ex) => {
			selectedExercise = null;
			const isCustom = customExercises.some((c) => c.id === ex.id);
			openEditor(ex, isCustom);
		}}
	/>
{/if}

<!-- Exercise Editor Modal -->
{#if showEditor}
	<ExerciseEditor
		exercise={exerciseToEdit}
		isCustom={isCustomEdit}
		onClose={() => (showEditor = false)}
		onSave={onEditorSave}
	/>
{/if}

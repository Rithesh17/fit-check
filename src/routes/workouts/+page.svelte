<script lang="ts">
	import { onMount } from 'svelte';
	import { exercises, type Exercise, type ExerciseType } from '$lib/data/exercises';
	import { Search, X, Plus, ChevronLeft, ChevronRight, Activity, BookOpen, Play, Calendar, Clock, Pencil, Trash2 } from 'lucide-svelte';
	import ExerciseDetail from '$lib/components/ExerciseDetail.svelte';
	import ExerciseEditor from '$lib/components/ExerciseEditor.svelte';
	import { goto } from '$app/navigation';
	import { loadCustomExercises, findExercise } from '$lib/services/exercises';
	import { loadTemplates, deleteTemplate } from '$lib/services/templates';
	import { activeWorkout, type ActiveWorkoutExercise } from '$lib/stores/active-workout';
	import { toast } from '$lib/stores/toast';
	import { weeklySchedule, DAYS_OF_WEEK, DAY_LABELS } from '$lib/stores/schedule';

	// View mode: 'workouts' or 'exercises'
	let viewMode = $state<'workouts' | 'exercises'>('workouts');

	// Exercise-related state
	let searchQuery = $state('');
	let selectedMuscleGroup = $state<string | null>(null);
	let selectedEquipment = $state<string | null>(null);
	let selectedExerciseType = $state<string | null>(null);
	let selectedExercise = $state<Exercise | null>(null);
	let exerciseToEdit = $state<Exercise | null>(null);
	let isEditing = $state(false);
	
	// Custom exercises from database
	let customExercises = $state<Array<Exercise & { id: string; isCustom: boolean }>>([]);

	// Workout-related state: templates (saved plans)
	let workoutTemplates = $state<Array<{ id: string; name: string | null; exercise_count: number }>>([]);
	let isLoadingWorkouts = $state(true);
	let templateExercisesMap = $state<Record<string, Array<{ exercise_id: string; exercise_order: number; sets: Array<{ reps: number; weight: number; rest: number }> }>>>({});

	// Weekly schedule
	const currentSchedule = $derived($weeklySchedule);

	// Pagination
	const EXERCISES_PER_PAGE = 20;
	let currentPage = $state(1);

	// Combine default and custom exercises
	const allExercises = $derived.by(() => {
		return [...exercises, ...customExercises];
	});

	// Get unique muscle groups and equipment (from all exercises)
	const muscleGroups = $derived.by(() => {
		const all = [...exercises, ...customExercises];
		if (!all || all.length === 0) return [];
		return Array.from(new Set(all.flatMap((ex) => ex.muscleGroups))).sort();
	});
	const equipmentTypes = $derived.by(() => {
		const all = [...exercises, ...customExercises];
		if (!all || all.length === 0) return [];
		return Array.from(new Set(all.map((ex) => ex.equipment))).sort();
	});

	// Filter exercises
	let filteredExercises = $derived.by(() => {
		if (!allExercises || allExercises.length === 0) return [];
		let result = allExercises;

		// Search filter
		if (searchQuery) {
			const query = searchQuery.toLowerCase();
			result = allExercises.filter((ex) => 
				ex.name.toLowerCase().includes(query) ||
				ex.muscleGroups.some(mg => mg.toLowerCase().includes(query)) ||
				ex.equipment.toLowerCase().includes(query)
			);
		}

		// Muscle group filter
		const muscleFilter = selectedMuscleGroup;
		if (muscleFilter) {
			result = result.filter((ex) => ex.muscleGroups.includes(muscleFilter));
		}

		// Equipment filter
		if (selectedEquipment) {
			result = result.filter((ex) => ex.equipment === selectedEquipment);
		}

		// Exercise type filter
		if (selectedExerciseType) {
			result = result.filter((ex) => ex.exerciseType === selectedExerciseType);
		}

		return result;
	});

	// Pagination
	const totalPages = $derived(Math.ceil(filteredExercises.length / EXERCISES_PER_PAGE));
	const paginatedExercises = $derived.by(() => {
		const start = (currentPage - 1) * EXERCISES_PER_PAGE;
		const end = start + EXERCISES_PER_PAGE;
		return filteredExercises.slice(start, end);
	});

	// Reset to page 1 when filters change
	$effect(() => {
		// Access filter values to trigger effect when they change
		const _ = searchQuery;
		const __ = selectedMuscleGroup;
		const ___ = selectedEquipment;
		// Reset to first page when filters change
		if (currentPage > 1) {
			currentPage = 1;
		}
	});

	function clearFilters() {
		searchQuery = '';
		selectedMuscleGroup = null;
		selectedEquipment = null;
		selectedExerciseType = null;
	}

	let hasActiveFilters = $derived(
		searchQuery !== '' || selectedMuscleGroup !== null || selectedEquipment !== null || selectedExerciseType !== null
	);

	async function loadWorkouts() {
		try {
			isLoadingWorkouts = true;
			const { templates, exercisesMap } = await loadTemplates();
			workoutTemplates = templates;
			templateExercisesMap = exercisesMap as any;
		} catch (error) {
			console.error('Error loading workouts:', error);
			toast.error('Failed to load workouts');
		} finally {
			isLoadingWorkouts = false;
		}
	}

	async function removeTemplate(id: string) {
		if (!confirm('Delete this template? This cannot be undone.')) return;
		try {
			await deleteTemplate(id);
			workoutTemplates = workoutTemplates.filter((t) => t.id !== id);
			toast.success('Template deleted');
		} catch (error) {
			console.error('Error deleting template:', error);
			toast.error('Failed to delete template');
		}
	}

	function startTemplate(templateId: string) {
		const name = workoutTemplates.find((t) => t.id === templateId)?.name || 'Workout';
		const exs = templateExercisesMap[templateId] || [];
		const exercisesPayload = exs
			.map((ex) => {
				const exercise = findExercise(ex.exercise_id, customExercises);
				if (!exercise) return null;

				// Handle different exercise types
				if (exercise.exerciseType === 'weights' || exercise.exerciseType === 'bodyweight') {
					// Check if sets is an array (old format) or object with type
					let sets;
					if (Array.isArray(ex.sets)) {
						sets = (ex.sets.length ? ex.sets : [{ reps: exercise.defaultReps || 10, weight: 0, rest: exercise.defaultRestSeconds || 60 }]).map(
							(s: any) => ({ ...s, completed: false })
						);
					} else {
						// Fallback to defaults
						sets = [{ reps: exercise.defaultReps || 10, weight: 0, rest: exercise.defaultRestSeconds || 60, completed: false }];
					}
					return { exerciseId: exercise.id, exerciseName: exercise.name, exerciseType: exercise.exerciseType, sets };
				} else if (exercise.exerciseType === 'cardio') {
					const rawSets = ex.sets as any;
					return {
						exerciseId: exercise.id,
						exerciseName: exercise.name,
						exerciseType: 'cardio' as const,
						durationMinutes: rawSets?.durationMinutes || exercise.defaultDurationMinutes || 30,
						calories: rawSets?.calories || exercise.defaultCalories || 300,
						completed: false
					};
				} else if (exercise.exerciseType === 'stretches') {
					const rawSets = ex.sets as any;
					return {
						exerciseId: exercise.id,
						exerciseName: exercise.name,
						exerciseType: 'stretches' as const,
						durationSeconds: rawSets?.durationSeconds || exercise.defaultDurationSeconds || 60,
						reps: rawSets?.reps || exercise.defaultRepsStretches || 10,
						completed: false
					};
				}
				return null;
			})
			.filter((e) => e != null) as ActiveWorkoutExercise[];
		if (exercisesPayload.length === 0) {
			toast.error('This template has no valid exercises.');
			return;
		}
		activeWorkout.start({
			name,
			notes: '',
			energyLevel: null,
			mood: '',
			restDurationBetweenExercises: 90,
			exercises: exercisesPayload
		});
		goto('/workout/active');
	}


	onMount(async () => {
		customExercises = await loadCustomExercises();
	});

	$effect(() => {
		if (viewMode === 'workouts') {
			loadWorkouts();
		}
	});
</script>

<svelte:head>
	<title>{viewMode === 'workouts' ? 'Workouts' : 'Exercise Library'} - Fit Check</title>
</svelte:head>

<div class="min-h-screen bg-[var(--color-background)] pb-20">
	<!-- Header -->
	<div class="sticky top-0 z-10 bg-[var(--color-background)]/95 backdrop-blur-sm border-b border-[var(--color-border)]">
		<div class="max-w-md mx-auto px-4 py-4">
			<div class="flex items-center justify-between mb-4">
				<h1 class="text-2xl font-bold text-[var(--color-foreground)]">
					{viewMode === 'workouts' ? 'Workouts' : 'Exercise Library'}
				</h1>
				<button
					onclick={() => {
						if (viewMode === 'workouts') {
							goto('/workout/new');
						} else {
							// Open exercise editor for new exercise
							exerciseToEdit = null;
							isEditing = true;
						}
					}}
					class="px-4 py-2 bg-[var(--gradient-accent)] text-white font-semibold rounded-lg hover:scale-[1.02] transition-transform flex items-center gap-2"
					title={viewMode === 'workouts' ? 'New workout' : 'Add exercise'}
				>
					<Plus class="w-4 h-4" />
					<span class="hidden sm:inline">{viewMode === 'workouts' ? 'New' : 'Add'}</span>
				</button>
			</div>

			<!-- View Toggle -->
			<div class="flex items-center gap-2 mb-4">
				<button
					onclick={() => (viewMode = 'workouts')}
					class="flex-1 px-4 py-2 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 {viewMode === 'workouts'
						? 'bg-[var(--color-primary)] text-white'
						: 'bg-[var(--color-card)] text-[var(--color-muted)] hover:text-[var(--color-foreground)]'}"
				>
					<Activity class="w-4 h-4" />
					<span>Workouts</span>
				</button>
				<button
					onclick={() => (viewMode = 'exercises')}
					class="flex-1 px-4 py-2 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 {viewMode === 'exercises'
						? 'bg-[var(--color-primary)] text-white'
						: 'bg-[var(--color-card)] text-[var(--color-muted)] hover:text-[var(--color-foreground)]'}"
				>
					<BookOpen class="w-4 h-4" />
					<span>Exercises</span>
				</button>
			</div>

			{#if viewMode === 'exercises'}
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
					<!-- Exercise Type Filter -->
					<select
						bind:value={selectedExerciseType}
						class="flex-1 min-w-[120px] px-3 py-2 bg-[var(--color-card)] border border-[var(--color-border)] rounded-lg text-[var(--color-foreground)] text-sm focus:outline-none focus:border-[var(--color-primary)]"
					>
						<option value={null}>All Types</option>
						<option value="weights">Weights</option>
						<option value="bodyweight">Bodyweight</option>
						<option value="cardio">Cardio</option>
						<option value="stretches">Stretches</option>
					</select>

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
				<div class="flex items-center justify-between mt-2">
					{#if hasActiveFilters}
						<p class="text-sm text-[var(--color-muted)]">
							{filteredExercises.length} exercise{filteredExercises.length !== 1 ? 's' : ''} found
						</p>
					{:else}
						<p class="text-sm text-[var(--color-muted)]">
							{filteredExercises.length} total exercises
						</p>
					{/if}
					{#if totalPages > 1}
						<p class="text-sm text-[var(--color-muted)]">
							Showing {((currentPage - 1) * EXERCISES_PER_PAGE) + 1}-
							{Math.min(currentPage * EXERCISES_PER_PAGE, filteredExercises.length)} of {filteredExercises.length}
						</p>
					{/if}
				</div>
			{/if}
		</div>
	</div>

	<!-- Content -->
	<div class="max-w-md mx-auto px-4 py-6">
		{#if viewMode === 'workouts'}
			<!-- Workouts View: templates to start + New, then recent completed sessions -->
			{#if isLoadingWorkouts}
				<div class="space-y-3">
					{#each Array(3) as _}
						<div class="fitness-card animate-pulse h-24"></div>
					{/each}
				</div>
			{:else}
				<!-- Your workout plans: templates + New -->
				<div class="mb-6">
					<h2 class="text-sm font-semibold text-[var(--color-muted)] mb-3">Your workout plans</h2>
					<div class="space-y-3">
						<button
							onclick={() => goto('/workout/new')}
							class="w-full fitness-card text-left hover:scale-[1.02] transition-transform flex items-center gap-4 border-2 border-dashed border-[var(--color-primary)]/50"
						>
							<div class="w-12 h-12 rounded-full bg-[var(--color-primary)]/20 flex items-center justify-center flex-shrink-0">
								<Plus class="w-6 h-6 text-[var(--color-primary)]" />
							</div>
							<div>
								<h3 class="text-lg font-semibold text-[var(--color-foreground)]">New workout</h3>
								<p class="text-sm text-[var(--color-muted)]">Create and save a new workout plan</p>
							</div>
						</button>
						{#each workoutTemplates as template}
							<div class="fitness-card flex items-center justify-between gap-3">
								<div class="flex-1 min-w-0">
									<h3 class="text-lg font-semibold text-[var(--color-foreground)] mb-1 truncate">
										{template.name || 'Workout'}
									</h3>
									<div class="flex items-center gap-1 text-sm text-[var(--color-muted)]">
										<Activity class="w-4 h-4" />
										<span>{template.exercise_count} exercise{template.exercise_count !== 1 ? 's' : ''}</span>
									</div>
								</div>
								<div class="flex items-center gap-2 flex-shrink-0">
									<button
										onclick={() => goto(`/workout/edit/${template.id}`)}
										class="p-2 text-[var(--color-muted)] hover:text-[var(--color-primary)] transition-colors"
										title="Edit template"
									>
										<Pencil class="w-4 h-4" />
									</button>
									<button
										onclick={() => removeTemplate(template.id)}
										class="p-2 text-[var(--color-muted)] hover:text-[var(--color-danger)] transition-colors"
										title="Delete template"
									>
										<Trash2 class="w-4 h-4" />
									</button>
									<button
										onclick={() => startTemplate(template.id)}
										class="px-4 py-2 bg-[var(--gradient-accent)] text-white font-semibold rounded-lg hover:scale-[1.02] transition-transform flex items-center gap-2"
										title="Start this workout"
									>
										<Play class="w-4 h-4" />
										Start
									</button>
								</div>
							</div>
						{/each}
					</div>
				</div>

				<!-- Weekly Schedule -->
				<div class="mb-6">
					<h2 class="text-sm font-semibold text-[var(--color-muted)] mb-3 flex items-center gap-2">
						<Calendar class="w-4 h-4" />
						Weekly Schedule
					</h2>
					<div class="fitness-card space-y-3">
						{#each DAYS_OF_WEEK as day}
							<div class="flex items-center gap-3">
								<span class="text-sm font-medium text-[var(--color-muted)] w-8 flex-shrink-0">
									{DAY_LABELS[day]}
								</span>
								<select
									value={currentSchedule[day] ?? ''}
									onchange={(e) => {
										const val = (e.target as HTMLSelectElement).value;
										weeklySchedule.setDay(day, val || null);
									}}
									class="flex-1 px-3 py-1.5 bg-[var(--color-card-hover)] border border-[var(--color-border)] rounded-lg text-[var(--color-foreground)] text-sm focus:outline-none focus:border-[var(--color-primary)]"
								>
									<option value="">Rest day</option>
									{#each workoutTemplates as template}
										<option value={template.id}>{template.name || 'Workout'}</option>
									{/each}
								</select>
							</div>
						{/each}
					</div>
				</div>

				<!-- Link to full history -->
				<a
					href="/workouts/history"
					class="fitness-card flex items-center justify-between hover:scale-[1.02] transition-transform border-dashed"
				>
					<div class="flex items-center gap-3">
						<Clock class="w-5 h-5 text-[var(--color-muted)]" />
						<span class="font-medium text-[var(--color-foreground)]">View workout history</span>
					</div>
					<span class="text-[var(--color-primary)] text-sm font-medium">→</span>
				</a>
			{/if}
		{:else}
			<!-- Exercises View -->
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
			{:else if paginatedExercises.length === 0}
				<div class="fitness-card text-center py-12">
					<p class="text-[var(--color-muted)] mb-4">No exercises on this page</p>
					<p class="text-xs text-[var(--color-muted)] mb-4">
						Total: {filteredExercises.length}, Page: {currentPage} of {totalPages}
					</p>
					<button
						onclick={() => (currentPage = 1)}
						class="px-4 py-2 bg-[var(--color-primary)] text-white rounded-lg font-medium"
					>
						Go to First Page
					</button>
				</div>
			{:else}
				<div class="space-y-3">
					{#each paginatedExercises as exercise}
						<button
							onclick={() => (selectedExercise = exercise)}
							class="w-full text-left fitness-card hover:scale-[1.02] transition-transform"
						>
							<div class="flex items-start justify-between mb-3">
								<div class="flex-1">
									<div class="flex items-center gap-2 mb-2">
										<h3 class="text-lg font-semibold text-[var(--color-foreground)]">
											{exercise.name}
										</h3>
										<span class="px-2 py-0.5 bg-[var(--color-accent)]/20 text-[var(--color-accent)] text-xs font-medium rounded-full">
											{exercise.exerciseType ? exercise.exerciseType.charAt(0).toUpperCase() + exercise.exerciseType.slice(1) : 'Weights'}
										</span>
									</div>
									<p class="text-sm text-[var(--color-muted)] mb-3">{exercise.equipment}</p>
									<div class="flex flex-wrap gap-2 mb-3">
										{#each exercise.muscleGroups as mg}
											<span class="px-2 py-1 bg-[var(--color-primary)]/20 text-[var(--color-primary)] text-xs rounded-full">
												{mg}
											</span>
										{/each}
									</div>
									{#if exercise.instructions}
										<p class="text-sm text-[var(--color-muted)] leading-relaxed line-clamp-2">
											{exercise.instructions}
										</p>
									{/if}
								</div>
							</div>
							<div class="pt-3 border-t border-[var(--color-border)] flex items-center gap-4 text-xs text-[var(--color-muted)]">
								{#if exercise.exerciseType === 'cardio'}
									<span>Duration: {exercise.defaultDurationMinutes || 30} min</span>
									<span>•</span>
									<span>Calories: {exercise.defaultCalories || 300}</span>
								{:else if exercise.exerciseType === 'stretches'}
									<span>Duration: {exercise.defaultDurationSeconds || 60}s</span>
									<span>•</span>
									<span>Reps: {exercise.defaultRepsStretches || 10}</span>
								{:else}
									<span>Default: {exercise.defaultSets || 3} sets × {exercise.defaultReps || 10} reps</span>
									<span>•</span>
									<span>Rest: {exercise.defaultRestSeconds || 60}s</span>
								{/if}
							</div>
						</button>
					{/each}
				</div>

				<!-- Pagination -->
				{#if totalPages > 1}
					<div class="flex items-center justify-between mt-6 pt-4 border-t border-[var(--color-border)]">
						<button
							onclick={() => (currentPage = Math.max(1, currentPage - 1))}
							disabled={currentPage === 1}
							class="px-4 py-2 bg-[var(--color-card)] border border-[var(--color-border)] rounded-lg text-[var(--color-foreground)] disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[var(--color-card-hover)] transition-colors flex items-center gap-2"
						>
							<ChevronLeft class="w-4 h-4" />
							<span>Previous</span>
						</button>

						<div class="flex items-center gap-2">
							<span class="text-sm text-[var(--color-muted)]">
								Page {currentPage} of {totalPages}
							</span>
							<span class="text-sm text-[var(--color-muted)]">
								({filteredExercises.length} exercises)
							</span>
						</div>

						<button
							onclick={() => (currentPage = Math.min(totalPages, currentPage + 1))}
							disabled={currentPage === totalPages}
							class="px-4 py-2 bg-[var(--color-card)] border border-[var(--color-border)] rounded-lg text-[var(--color-foreground)] disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[var(--color-card-hover)] transition-colors flex items-center gap-2"
						>
							<span>Next</span>
							<ChevronRight class="w-4 h-4" />
						</button>
					</div>
				{/if}
			{/if}
		{/if}
	</div>

	<!-- Exercise Detail Modal -->
	<ExerciseDetail
		exercise={selectedExercise}
		onClose={() => (selectedExercise = null)}
		onEdit={(exercise) => {
			exerciseToEdit = exercise;
			isEditing = true;
		}}
	/>

	<!-- Exercise Editor Modal -->
	{#if isEditing && exerciseToEdit}
		{@const editingExercise = exerciseToEdit}
		<ExerciseEditor
			exercise={editingExercise}
			isCustom={!exercises.find((e) => e.id === editingExercise.id)}
			onClose={() => {
				isEditing = false;
				exerciseToEdit = null;
			}}
			onSave={async () => {
				await loadCustomExercises();
				isEditing = false;
				exerciseToEdit = null;
			}}
		/>
	{/if}
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

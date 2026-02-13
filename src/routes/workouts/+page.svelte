<script lang="ts">
	import { onMount } from 'svelte';
	import { supabase } from '$lib/supabase/client';
	import { exercises, getExerciseById, getExercisesByMuscleGroup, searchExercises, type Exercise, type ExerciseType } from '$lib/data/exercises';
	import { Search, X, Plus, ChevronLeft, ChevronRight, Activity, BookOpen, Play } from 'lucide-svelte';
	import ExerciseDetail from '$lib/components/ExerciseDetail.svelte';
	import ExerciseEditor from '$lib/components/ExerciseEditor.svelte';
	import { goto } from '$app/navigation';
	import { Calendar, Clock } from 'lucide-svelte';

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

	// Workout-related state: templates (saved plans) + completed sessions (history)
	let workoutTemplates = $state<Array<{ id: string; name: string | null; exercise_count: number }>>([]);
	let completedWorkouts = $state<any[]>([]);
	let isLoadingWorkouts = $state(true);
	let templateExercisesMap = $state<Record<string, Array<{ exercise_id: string; exercise_order: number; sets: Array<{ reps: number; weight: number; rest: number }> }>>>({});

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
		if (selectedMuscleGroup) {
			result = result.filter((ex) => ex.muscleGroups.includes(selectedMuscleGroup));
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
			// Load saved templates (workout plans to start)
			const { data: templates, error: templatesError } = await supabase
				.from('workout_templates')
				.select('id, name')
				.order('created_at', { ascending: false });

			if (templatesError) throw templatesError;

			const { data: templateExs, error: templateExsError } = await supabase
				.from('workout_template_exercises')
				.select('workout_template_id, exercise_id, exercise_order, sets')
				.order('exercise_order', { ascending: true });

			if (templateExsError) throw templateExsError;

			const map: Record<string, Array<{ exercise_id: string; exercise_order: number; sets: Array<{ reps: number; weight: number; rest: number }> }>> = {};
			for (const row of templateExs || []) {
				const arr = map[row.workout_template_id] || [];
				arr.push({
					exercise_id: row.exercise_id,
					exercise_order: row.exercise_order,
					sets: (row.sets as Array<{ reps: number; weight: number; rest: number }>) || []
				});
				map[row.workout_template_id] = arr;
			}
			templateExercisesMap = map;

			workoutTemplates = (templates || []).map((t: any) => ({
				id: t.id,
				name: t.name,
				exercise_count: (map[t.id] || []).length
			}));

			// Load completed workout sessions (history)
			const { data: completed, error: completedError } = await supabase
				.from('workouts')
				.select(`
					id,
					name,
					date,
					duration_minutes,
					workout_exercises(count)
				`)
				.order('date', { ascending: false })
				.limit(20);

			if (completedError) throw completedError;

			completedWorkouts = (completed || []).map((w: any) => ({
				id: w.id,
				name: w.name,
				date: w.date,
				duration_minutes: w.duration_minutes,
				exercise_count: Array.isArray(w.workout_exercises) ? w.workout_exercises.length : 0
			}));
		} catch (error) {
			console.error('Error loading workouts:', error);
		} finally {
			isLoadingWorkouts = false;
		}
	}

	function startTemplate(templateId: string) {
		const name = workoutTemplates.find((t) => t.id === templateId)?.name || 'Workout';
		const exs = templateExercisesMap[templateId] || [];
		const exercisesPayload = exs
			.map((ex) => {
				const exercise = getExerciseById(ex.exercise_id) || customExercises.find(ce => ce.id === ex.exercise_id);
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
					return { exerciseId: exercise.id, exerciseType: exercise.exerciseType, sets };
				} else if (exercise.exerciseType === 'cardio') {
					const cardioData = (typeof ex.sets === 'object' && ex.sets !== null && !Array.isArray(ex.sets) && ex.sets.type === 'cardio')
						? ex.sets
						: { type: 'cardio', durationMinutes: exercise.defaultDurationMinutes || 30, calories: exercise.defaultCalories || 300 };
					return { exerciseId: exercise.id, exerciseType: 'cardio', ...cardioData, completed: false };
				} else if (exercise.exerciseType === 'stretches') {
					const stretchesData = (typeof ex.sets === 'object' && ex.sets !== null && !Array.isArray(ex.sets) && ex.sets.type === 'stretches')
						? ex.sets
						: { type: 'stretches', durationSeconds: exercise.defaultDurationSeconds || 60, reps: exercise.defaultRepsStretches || 10 };
					return { exerciseId: exercise.id, exerciseType: 'stretches', ...stretchesData, completed: false };
				}
				return null;
			})
			.filter(Boolean);
		if (exercisesPayload.length === 0) {
			alert('This template has no valid exercises.');
			return;
		}
		const workoutData = {
			name,
			notes: '',
			energyLevel: null as number | null,
			mood: '',
			exercises: exercisesPayload
		};
		sessionStorage.setItem('activeWorkout', JSON.stringify(workoutData));
		goto('/workout/active');
	}

	function formatDate(dateString: string): string {
		const date = new Date(dateString);
		const today = new Date();
		const yesterday = new Date(today);
		yesterday.setDate(yesterday.getDate() - 1);

		const dateMidnight = new Date(date);
		dateMidnight.setHours(0, 0, 0, 0);
		const todayMidnight = new Date(today);
		todayMidnight.setHours(0, 0, 0, 0);
		const yesterdayMidnight = new Date(yesterday);
		yesterdayMidnight.setHours(0, 0, 0, 0);

		if (dateMidnight.getTime() === todayMidnight.getTime()) {
			return 'Today';
		} else if (dateMidnight.getTime() === yesterdayMidnight.getTime()) {
			return 'Yesterday';
		} else {
			return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
		}
	}

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

	onMount(async () => {
		await loadCustomExercises();
		if (viewMode === 'workouts') {
			loadWorkouts();
		}
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
							<div
								class="fitness-card flex items-center justify-between gap-3"
							>
								<div class="flex-1 min-w-0">
									<h3 class="text-lg font-semibold text-[var(--color-foreground)] mb-1 truncate">
										{template.name || 'Workout'}
									</h3>
									<div class="flex items-center gap-1 text-sm text-[var(--color-muted)]">
										<Activity class="w-4 h-4" />
										<span>{template.exercise_count} exercise{template.exercise_count !== 1 ? 's' : ''}</span>
									</div>
								</div>
								<button
									onclick={() => startTemplate(template.id)}
									class="px-4 py-2 bg-[var(--gradient-accent)] text-white font-semibold rounded-lg hover:scale-[1.02] transition-transform flex items-center gap-2 flex-shrink-0"
									title="Start this workout"
								>
									<Play class="w-4 h-4" />
									Start
								</button>
							</div>
						{/each}
					</div>
				</div>

				<!-- Recent completed sessions -->
				{#if completedWorkouts.length > 0}
					<div>
						<h2 class="text-sm font-semibold text-[var(--color-muted)] mb-3">Recent sessions</h2>
						<div class="space-y-3">
							{#each completedWorkouts as workout}
								<button
									onclick={() => goto(`/workout/${workout.id}`)}
									class="w-full fitness-card text-left hover:scale-[1.02] transition-transform"
								>
									<div class="flex items-start justify-between">
										<div class="flex-1">
											<div class="flex items-center gap-2 mb-2">
												<Calendar class="w-4 h-4 text-[var(--color-muted)]" />
												<span class="text-sm text-[var(--color-muted)]">{formatDate(workout.date)}</span>
											</div>
											<h3 class="text-lg font-semibold text-[var(--color-foreground)] mb-2">
												{workout.name || 'Workout'}
											</h3>
											<div class="flex items-center gap-4 text-sm text-[var(--color-muted)]">
												{#if workout.exercise_count !== undefined}
													<div class="flex items-center gap-1">
														<Activity class="w-4 h-4" />
														<span>{workout.exercise_count} exercise{workout.exercise_count !== 1 ? 's' : ''}</span>
													</div>
												{/if}
												{#if workout.duration_minutes}
													<div class="flex items-center gap-1">
														<Clock class="w-4 h-4" />
														<span>{workout.duration_minutes} min</span>
													</div>
												{/if}
											</div>
										</div>
									</div>
								</button>
							{/each}
						</div>
					</div>
				{/if}
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
	{#if isEditing}
		<ExerciseEditor
			exercise={exerciseToEdit}
			isCustom={exerciseToEdit ? !exercises.find((e) => e.id === exerciseToEdit.id) : true}
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

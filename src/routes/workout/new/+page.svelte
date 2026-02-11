<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { supabase } from '$lib/supabase/client';
	import { exercises, getExerciseById, type Exercise } from '$lib/data/exercises';
	import { workoutTemplates, templateToWorkoutExercises, type WorkoutTemplate } from '$lib/data/workout-templates';
	import { getRecentExercises } from '$lib/utils/recent-exercises';
	import { Search, Plus, X, Play, Check, Activity, Timer, Clock } from 'lucide-svelte';

	let workoutName = $state('');
	let selectedExercises = $state<Array<{ exercise: Exercise; sets: Array<{ reps: number; weight: number; rest: number; completed: boolean }> }>>([]);
	let searchQuery = $state('');
	let showExerciseSearch = $state(false);
	let showTemplates = $state(true); // Show templates by default
	let selectedTemplates = $state<Set<string>>(new Set());
	let isLoading = $state(false);
	let searchInputElement: HTMLInputElement | null = $state(null);
	let recentExercises = $state<Array<{ exerciseId: string; exerciseName: string; lastUsed: Date; useCount: number }>>([]);
	let showRecentExercises = $state(false);

	// Focus search input when modal opens
	$effect(() => {
		if (showExerciseSearch && searchInputElement) {
			setTimeout(() => searchInputElement?.focus(), 100);
		}
	});

	// Load recent exercises
	onMount(async () => {
		if (!showTemplates) {
			recentExercises = await getRecentExercises(8);
		}
	});

	$effect(() => {
		if (!showTemplates && recentExercises.length === 0) {
			getRecentExercises(8).then((exercises) => {
				recentExercises = exercises.map((ex) => ({
					...ex,
					exerciseName: getExerciseById(ex.exerciseId)?.name || ex.exerciseId
				}));
			});
		}
	});

	// Filter exercises based on search
	let filteredExercises = $derived(
		searchQuery
			? exercises.filter(
					(ex) =>
						ex.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
						ex.muscleGroups.some((mg) => mg.toLowerCase().includes(searchQuery.toLowerCase())) ||
						ex.equipment.toLowerCase().includes(searchQuery.toLowerCase())
				)
			: exercises.slice(0, 20) // Show first 20 by default
	);

	function addExercise(exercise: Exercise) {
		// Check if exercise already added
		if (selectedExercises.some((e) => e.exercise.id === exercise.id)) {
			return;
		}

		// Create default sets based on exercise defaults
		const sets = Array.from({ length: exercise.defaultSets }, () => ({
			reps: exercise.defaultReps,
			weight: 0,
			rest: exercise.defaultRestSeconds,
			completed: false
		}));

		selectedExercises = [...selectedExercises, { exercise, sets }];
		showExerciseSearch = false;
		searchQuery = '';
	}

	function toggleTemplate(templateId: string) {
		const newSelected = new Set(selectedTemplates);
		if (newSelected.has(templateId)) {
			newSelected.delete(templateId);
		} else {
			newSelected.add(templateId);
		}
		selectedTemplates = newSelected;
	}

	function applyTemplates() {
		// Clear existing exercises
		selectedExercises = [];

		// Add exercises from all selected templates
		for (const templateId of selectedTemplates) {
			const template = workoutTemplates.find((t) => t.id === templateId);
			if (template) {
				const templateExercises = templateToWorkoutExercises(template);
				// Merge exercises, avoiding duplicates
				for (const templateEx of templateExercises) {
					if (!selectedExercises.some((e) => e.exercise.id === templateEx.exercise.id)) {
						selectedExercises = [...selectedExercises, templateEx];
					}
				}
			}
		}

		// Hide templates view and show workout builder
		showTemplates = false;
		
		// Set workout name if not set
		if (!workoutName) {
			if (selectedTemplates.size === 1) {
				const template = workoutTemplates.find((t) => t.id === Array.from(selectedTemplates)[0]);
				if (template) {
					workoutName = template.name;
				}
			} else if (selectedTemplates.size > 1) {
				// Combine template names
				const templateNames = Array.from(selectedTemplates)
					.map((id) => workoutTemplates.find((t) => t.id === id)?.name)
					.filter(Boolean)
					.join(' + ');
				workoutName = templateNames || 'Custom Workout';
			}
		}
	}

	function removeExercise(index: number) {
		selectedExercises = selectedExercises.filter((_, i) => i !== index);
	}

	function clearAllExercises() {
		selectedExercises = [];
		selectedTemplates = new Set();
		workoutName = '';
		showTemplates = true;
	}

	function updateSet(
		exerciseIndex: number,
		setIndex: number,
		field: 'reps' | 'weight' | 'rest',
		value: number
	) {
		selectedExercises = selectedExercises.map((ex, exIdx) => {
			if (exIdx === exerciseIndex) {
				return {
					...ex,
					sets: ex.sets.map((set, setIdx) => {
						if (setIdx === setIndex) {
							return { ...set, [field]: value };
						}
						return set;
					})
				};
			}
			return ex;
		});
	}

	function toggleSetComplete(exerciseIndex: number, setIndex: number) {
		selectedExercises = selectedExercises.map((ex, exIdx) => {
			if (exIdx === exerciseIndex) {
				return {
					...ex,
					sets: ex.sets.map((set, setIdx) => {
						if (setIdx === setIndex) {
							return { ...set, completed: !set.completed };
						}
						return set;
					})
				};
			}
			return ex;
		});
	}

	function addSet(exerciseIndex: number) {
		const exercise = selectedExercises[exerciseIndex].exercise;
		const lastSet = selectedExercises[exerciseIndex].sets[selectedExercises[exerciseIndex].sets.length - 1];
		
		selectedExercises = selectedExercises.map((ex, idx) => {
			if (idx === exerciseIndex) {
				return {
					...ex,
					sets: [
						...ex.sets,
						{
							reps: lastSet?.reps || exercise.defaultReps,
							weight: lastSet?.weight || 0,
							rest: exercise.defaultRestSeconds,
							completed: false
						}
					]
				};
			}
			return ex;
		});
	}

	function startActiveWorkout() {
		if (selectedExercises.length === 0) {
			alert('Please add at least one exercise');
			return;
		}

		// Save workout data to sessionStorage
		const workoutData = {
			name: workoutName || 'Workout',
			exercises: selectedExercises.map((ex) => ({
				exerciseId: ex.exercise.id,
				sets: ex.sets
			}))
		};

		sessionStorage.setItem('activeWorkout', JSON.stringify(workoutData));
		goto('/workout/active');
	}

	async function saveWorkout() {
		if (selectedExercises.length === 0) {
			alert('Please add at least one exercise');
			return;
		}

		isLoading = true;
		try {
			// Create workout
			const { data: workout, error: workoutError } = await supabase
				.from('workouts')
				.insert({
					name: workoutName || 'Workout',
					date: new Date().toISOString()
				})
				.select()
				.single();

			if (workoutError) throw workoutError;

			// Create workout exercises
			const workoutExercises = selectedExercises.map((ex, index) => ({
				workout_id: workout.id,
				exercise_id: ex.exercise.id,
				exercise_order: index,
				sets: ex.sets.map((set) => ({
					reps: set.reps,
					weight: set.weight,
					rest: set.rest,
					completed: set.completed
				}))
			}));

			const { error: exercisesError } = await supabase
				.from('workout_exercises')
				.insert(workoutExercises);

			if (exercisesError) throw exercisesError;

			// Redirect to dashboard
			goto('/');
		} catch (error) {
			console.error('Error saving workout:', error);
			alert('Failed to save workout. Please try again.');
		} finally {
			isLoading = false;
		}
	}
</script>

<svelte:head>
	<title>New Workout - Fit Check</title>
</svelte:head>

<div class="min-h-screen bg-[var(--color-background)] pb-20">
	<!-- Header -->
	<div class="sticky top-0 z-20 bg-[var(--color-background)]/95 backdrop-blur-sm border-b border-[var(--color-border)]">
		<div class="max-w-md mx-auto px-4 py-4 flex items-center justify-between">
			<a href="/" class="text-[var(--color-muted)] hover:text-[var(--color-foreground)]">
				<X class="w-6 h-6" />
			</a>
			<h1 class="text-xl font-bold text-[var(--color-foreground)]">New Workout</h1>
			<div class="flex gap-2">
				{#if !showTemplates && selectedExercises.length > 0}
					<button
						onclick={startActiveWorkout}
						class="px-4 py-2 bg-[var(--gradient-accent)] text-white font-semibold rounded-lg hover:scale-[1.02] transition-transform flex items-center gap-2"
						title="Start active workout with timer"
					>
						<Play class="w-4 h-4" />
						Start
					</button>
				{/if}
				<button
					onclick={saveWorkout}
					disabled={isLoading || selectedExercises.length === 0}
					class="px-4 py-2 bg-[var(--gradient-primary)] text-white font-semibold rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
				>
					{isLoading ? 'Saving...' : 'Save'}
				</button>
			</div>
		</div>
	</div>

	<div class="max-w-md mx-auto px-4 py-6 space-y-6">
		{#if showTemplates}
			<!-- Workout Templates -->
			<div class="space-y-4">
				<div class="text-center mb-6">
					<h2 class="text-2xl font-bold text-[var(--color-foreground)] mb-2">Build Your Workout</h2>
					<p class="text-sm text-[var(--color-muted)]">Select one or more workout parts to combine</p>
					<p class="text-xs text-[var(--color-muted)] mt-1">You can create multiple workouts per day</p>
				</div>

				{#each workoutTemplates as template}
					<button
						onclick={() => toggleTemplate(template.id)}
						class="w-full fitness-card text-left hover:scale-[1.02] transition-transform {selectedTemplates.has(template.id)
							? 'ring-2 ring-[var(--color-primary)] bg-[var(--color-primary)]/10'
							: ''}"
					>
						<div class="flex items-start justify-between mb-2">
							<div class="flex-1">
								<div class="flex items-center gap-2 mb-1">
									<Activity class="w-5 h-5 text-[var(--color-primary)]" />
									<h3 class="text-lg font-semibold text-[var(--color-foreground)]">
										{template.name}
									</h3>
									{#if selectedTemplates.has(template.id)}
										<Check class="w-5 h-5 text-[var(--color-primary)]" />
									{/if}
								</div>
								<p class="text-sm text-[var(--color-muted)] mb-3">{template.description}</p>
								<div class="flex flex-wrap gap-2 mb-3">
									{#each template.muscleGroups as mg}
										<span
											class="px-2 py-1 bg-[var(--color-primary)]/20 text-[var(--color-primary)] text-xs rounded-full"
										>
											{mg}
										</span>
									{/each}
								</div>
								<div class="text-xs text-[var(--color-muted)]">
									{template.exercises.length} exercises
								</div>
							</div>
						</div>
					</button>
				{/each}

				<button
					onclick={applyTemplates}
					disabled={selectedTemplates.size === 0}
					class="w-full py-4 bg-[var(--gradient-primary)] text-white font-semibold rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:scale-[1.02] transition-transform"
				>
					{selectedTemplates.size === 0
						? 'Select a Template'
						: `Start Workout (${selectedTemplates.size} ${selectedTemplates.size === 1 ? 'template' : 'templates'})`}
				</button>

				<button
					onclick={() => (showTemplates = false)}
					class="w-full py-3 text-[var(--color-primary)] font-medium hover:text-[var(--color-primary-dark)]"
				>
					Create Custom Workout Instead
				</button>
			</div>
		{:else}
			<!-- Workout Builder -->
			<!-- Clear All / Start Over Button -->
			{#if selectedExercises.length > 0}
				<button
					onclick={clearAllExercises}
					class="w-full py-2 text-sm text-[var(--color-muted)] hover:text-[var(--color-foreground)] font-medium flex items-center justify-center gap-2"
				>
					<X class="w-4 h-4" />
					<span>Clear All & Start Over</span>
				</button>
			{/if}

			<!-- Workout Name -->
			<div class="fitness-card">
				<label for="workout-name-input" class="block text-sm font-semibold text-[var(--color-muted)] mb-2">Workout Name</label>
				<input
					id="workout-name-input"
					type="text"
					bind:value={workoutName}
					placeholder="e.g., Push Day, Leg Day"
					class="w-full px-4 py-2 bg-[var(--color-card-hover)] border border-[var(--color-border)] rounded-lg text-[var(--color-foreground)] focus:outline-none focus:border-[var(--color-primary)]"
				/>
			</div>

			<!-- Add Exercise Button -->
			<button
				onclick={() => (showExerciseSearch = true)}
				class="w-full fitness-card flex items-center justify-center gap-2 hover:scale-[1.02] transition-transform"
			>
				<Plus class="w-5 h-5 text-[var(--color-primary)]" />
				<span class="font-semibold text-[var(--color-foreground)]">Add Exercise</span>
			</button>

			<!-- Recent Exercises Quick Add -->
			{#if recentExercises.length > 0}
				<div class="fitness-card">
					<div class="flex items-center justify-between mb-3">
						<div class="flex items-center gap-2">
							<Clock class="w-4 h-4 text-[var(--color-muted)]" />
							<h3 class="text-sm font-semibold text-[var(--color-foreground)]">Recent Exercises</h3>
						</div>
						<button
							onclick={() => (showRecentExercises = !showRecentExercises)}
							class="text-xs text-[var(--color-primary)] hover:underline"
						>
							{showRecentExercises ? 'Hide' : 'Show'}
						</button>
					</div>
					{#if showRecentExercises}
						<div class="flex flex-wrap gap-2">
							{#each recentExercises as recent}
								{@const exercise = getExerciseById(recent.exerciseId)}
								{#if exercise && !selectedExercises.some((e) => e.exercise.id === exercise.id)}
									<button
										onclick={() => addExercise(exercise)}
										class="px-3 py-1.5 bg-[var(--color-card-hover)] border border-[var(--color-border)] rounded-lg text-sm text-[var(--color-foreground)] hover:border-[var(--color-primary)] transition-colors"
										title="Used {recent.useCount} time{recent.useCount !== 1 ? 's' : ''} in last 30 days"
									>
										{exercise.name}
									</button>
								{/if}
							{/each}
						</div>
					{/if}
				</div>
			{/if}
		{/if}

		<!-- Selected Exercises -->
		{#if !showTemplates && selectedExercises.length > 0}
			<div class="space-y-4">
				<div class="flex items-center justify-between mb-2">
					<h2 class="text-lg font-semibold text-[var(--color-foreground)]">
						Exercises ({selectedExercises.length})
					</h2>
					<div class="flex items-center gap-3">
						<button
							onclick={startActiveWorkout}
							class="px-4 py-2 bg-[var(--gradient-accent)] text-white font-semibold rounded-lg hover:scale-[1.02] transition-transform flex items-center gap-2 text-sm"
							title="Start active workout with timer"
						>
							<Play class="w-4 h-4" />
							Start Workout
						</button>
						{#if selectedExercises.length > 1}
							<button
								onclick={clearAllExercises}
								class="text-sm text-[var(--color-muted)] hover:text-[var(--color-danger)] font-medium"
							>
								Clear All
							</button>
						{/if}
					</div>
				</div>
				{#each selectedExercises as { exercise, sets }, exerciseIndex}
					<div class="fitness-card">
						<div class="flex items-start justify-between mb-4">
							<div class="flex-1">
								<h3 class="text-lg font-semibold text-[var(--color-foreground)] mb-1">
									{exercise.name}
								</h3>
								<div class="flex flex-wrap gap-2 mt-2">
									{#each exercise.muscleGroups as mg}
										<span class="px-2 py-1 bg-[var(--color-primary)]/20 text-[var(--color-primary)] text-xs rounded-full">
											{mg}
										</span>
									{/each}
								</div>
							</div>
							<button
								onclick={() => removeExercise(exerciseIndex)}
								class="p-2 text-[var(--color-muted)] hover:text-[var(--color-danger)] transition-colors"
								title="Remove exercise"
							>
								<X class="w-5 h-5" />
							</button>
						</div>

						<!-- Sets -->
						<div class="space-y-3">
							{#each sets as set, setIndex}
								<div
									class="flex items-center gap-2 p-3 rounded-lg {set.completed
										? 'bg-[var(--color-accent)]/20 border border-[var(--color-accent)]/50'
										: 'bg-[var(--color-card-hover)] border border-[var(--color-border)]'}"
								>
									<button
										onclick={() => toggleSetComplete(exerciseIndex, setIndex)}
										class="flex-shrink-0 w-6 h-6 rounded-full border-2 {set.completed
											? 'bg-[var(--color-accent)] border-[var(--color-accent)]'
											: 'border-[var(--color-border)]'} flex items-center justify-center"
									>
										{#if set.completed}
											<Check class="w-4 h-4 text-[var(--color-on-primary)]" />
										{/if}
									</button>
									<span class="text-sm text-[var(--color-muted)] w-8">Set {setIndex + 1}</span>
									<input
										type="number"
										value={set.reps}
										oninput={(e) => updateSet(exerciseIndex, setIndex, 'reps', parseInt(e.target.value) || 0)}
										class="flex-1 px-3 py-2 bg-[var(--color-background)] border border-[var(--color-border)] rounded text-[var(--color-foreground)] focus:outline-none focus:border-[var(--color-primary)]"
										placeholder="Reps"
									/>
									<span class="text-[var(--color-muted)]">×</span>
									<input
										type="number"
										value={set.weight}
										oninput={(e) => updateSet(exerciseIndex, setIndex, 'weight', parseFloat(e.target.value) || 0)}
										class="flex-1 px-3 py-2 bg-[var(--color-background)] border border-[var(--color-border)] rounded text-[var(--color-foreground)] focus:outline-none focus:border-[var(--color-primary)]"
										placeholder="Weight"
									/>
									<span class="text-[var(--color-muted)] text-sm">kg</span>
								</div>
							{/each}
							<button
								onclick={() => addSet(exerciseIndex)}
								class="w-full py-2 text-sm text-[var(--color-primary)] hover:text-[var(--color-primary-dark)] font-medium"
							>
								+ Add Set
							</button>
						</div>
					</div>
				{/each}
			</div>
		{/if}
	</div>

	<!-- Exercise Search Modal -->
	{#if showExerciseSearch}
		<div
			class="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end"
			role="button"
			tabindex="0"
			onclick={() => (showExerciseSearch = false)}
			onkeydown={(e) => {
				if (e.key === 'Enter' || e.key === ' ') {
					e.preventDefault();
					showExerciseSearch = false;
				}
			}}
		>
        <div
          class="w-full max-w-md mx-auto bg-[var(--color-card)] rounded-t-3xl max-h-[80vh] overflow-hidden flex flex-col"
          role="dialog"
          aria-modal="true"
          aria-label="Exercise search"
          tabindex="-1"
          onclick={(e) => e.stopPropagation()}
          onkeydown={(e) => e.stopPropagation()}
        >
				<div class="p-4 border-b border-[var(--color-border)]">
					<div class="flex items-center gap-3 mb-4">
						<Search class="w-5 h-5 text-[var(--color-muted)]" />
						<input
							bind:this={searchInputElement}
							type="text"
							bind:value={searchQuery}
							placeholder="Search exercises..."
							class="flex-1 px-4 py-2 bg-[var(--color-card-hover)] border border-[var(--color-border)] rounded-lg text-[var(--color-foreground)] focus:outline-none focus:border-[var(--color-primary)]"
						/>
					</div>
					<button
						onclick={() => (showExerciseSearch = false)}
						class="text-[var(--color-muted)] hover:text-[var(--color-foreground)]"
					>
						Cancel
					</button>
				</div>
				<div class="flex-1 overflow-y-auto">
					<div class="p-4 space-y-2">
						{#each filteredExercises as exercise}
							<button
								onclick={() => addExercise(exercise)}
								disabled={selectedExercises.some((e) => e.exercise.id === exercise.id)}
								class="w-full p-4 text-left fitness-card hover:scale-[1.02] transition-transform disabled:opacity-50 disabled:cursor-not-allowed"
							>
								<div class="flex items-start justify-between">
									<div class="flex-1">
										<h3 class="font-semibold text-[var(--color-foreground)] mb-1">
											{exercise.name}
										</h3>
										<p class="text-sm text-[var(--color-muted)] mb-2">{exercise.equipment}</p>
										<div class="flex flex-wrap gap-1">
											{#each exercise.muscleGroups.slice(0, 3) as mg}
												<span class="px-2 py-1 bg-[var(--color-primary)]/20 text-[var(--color-primary)] text-xs rounded">
													{mg}
												</span>
											{/each}
										</div>
									</div>
									{#if selectedExercises.some((e) => e.exercise.id === exercise.id)}
										<Check class="w-5 h-5 text-[var(--color-accent)] flex-shrink-0 ml-2" />
									{/if}
								</div>
							</button>
						{/each}
					</div>
				</div>
			</div>
		</div>
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

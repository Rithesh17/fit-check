<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { supabase } from '$lib/supabase/client';
	import { exercises, getExerciseById, type Exercise, type ExerciseType } from '$lib/data/exercises';
	import { workoutTemplates, templateToWorkoutExercises, type WorkoutTemplate } from '$lib/data/workout-templates';
	import { getRecentExercises } from '$lib/utils/recent-exercises';
	import ExerciseDetail from '$lib/components/ExerciseDetail.svelte';
	import { Search, Plus, X, Check, Activity, Timer, Clock, Info, ChevronUp, ChevronDown, GripVertical } from 'lucide-svelte';
	import { unitPreference, type WeightUnit } from '$lib/stores/unit-preference';
	import { convertWeight, getWeightUnitLabel, lbsToKg } from '$lib/utils/weight-conversion';

	let workoutName = $state('');
	type WorkoutExerciseData = 
		| { exercise: Exercise; exerciseType: 'weights' | 'bodyweight'; sets: Array<{ reps: number; weight: number; rest: number; completed: boolean }> }
		| { exercise: Exercise; exerciseType: 'cardio'; durationMinutes: number; calories: number; completed: boolean }
		| { exercise: Exercise; exerciseType: 'stretches'; durationSeconds: number; reps: number; completed: boolean };
	
	let selectedExercises = $state<WorkoutExerciseData[]>([]);
	let searchQuery = $state('');
	let showExerciseSearch = $state(false);
	let showTemplates = $state(true); // Show templates by default
	let selectedTemplates = $state<Set<string>>(new Set());
	let isLoading = $state(false);
	let searchInputElement: HTMLInputElement | null = $state(null);
	let recentExercises = $state<Array<{ exerciseId: string; exerciseName: string; lastUsed: Date; useCount: number }>>([]);
	let showRecentExercises = $state(false);
	let selectedExerciseDetail = $state<Exercise | null>(null);
	let workoutNotes = $state('');
	let energyLevel = $state<number | null>(null);
	let mood = $state<string>('');
	
	// Custom exercises from database
	let customExercises = $state<Array<Exercise & { id: string; isCustom: boolean }>>([]);
	
	let currentUnit = $state<WeightUnit>('kg');
	
	// Subscribe to unit preference
	$effect(() => {
		const unsubscribe = unitPreference.subscribe((unit) => {
			currentUnit = unit;
		});
		return unsubscribe;
	});
	
	// Combine default and custom exercises
	const allExercises = $derived([...exercises, ...customExercises]);

	// Focus search input when modal opens
	$effect(() => {
		if (showExerciseSearch && searchInputElement) {
			setTimeout(() => searchInputElement?.focus(), 100);
		}
	});

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

	// Load recent exercises
	onMount(async () => {
		await loadCustomExercises();
		if (!showTemplates) {
			recentExercises = await getRecentExercises(8);
		}
	});

	$effect(() => {
		if (!showTemplates && recentExercises.length === 0) {
			getRecentExercises(8).then((exercises) => {
				recentExercises = exercises.map((ex) => {
					const exercise = getExerciseById(ex.exerciseId) || customExercises.find(ce => ce.id === ex.exerciseId);
					return {
						...ex,
						exerciseName: exercise?.name || ex.exerciseId
					};
				});
			});
		}
	});

	// Filter exercises based on search
	let filteredExercises = $derived(
		searchQuery
			? allExercises.filter(
					(ex) =>
						ex.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
						ex.muscleGroups.some((mg) => mg.toLowerCase().includes(searchQuery.toLowerCase())) ||
						ex.equipment.toLowerCase().includes(searchQuery.toLowerCase())
				)
			: allExercises.slice(0, 20) // Show first 20 by default
	);

	function addExercise(exercise: Exercise) {
		// Check if exercise already added
		if (selectedExercises.some((e) => e.exercise.id === exercise.id)) {
			return;
		}

		// Create workout exercise data based on exercise type
		if (exercise.exerciseType === 'weights' || exercise.exerciseType === 'bodyweight') {
			const sets = Array.from({ length: exercise.defaultSets || 3 }, () => ({
				reps: exercise.defaultReps || 10,
				weight: 0,
				rest: exercise.defaultRestSeconds || 60,
				completed: false
			}));
			selectedExercises = [...selectedExercises, { exercise, exerciseType: exercise.exerciseType, sets }];
		} else if (exercise.exerciseType === 'cardio') {
			selectedExercises = [...selectedExercises, {
				exercise,
				exerciseType: 'cardio',
				durationMinutes: exercise.defaultDurationMinutes || 30,
				calories: exercise.defaultCalories || 300,
				completed: false
			}];
		} else if (exercise.exerciseType === 'stretches') {
			selectedExercises = [...selectedExercises, {
				exercise,
				exerciseType: 'stretches',
				durationSeconds: exercise.defaultDurationSeconds || 60,
				reps: exercise.defaultRepsStretches || 10,
				completed: false
			}];
		}

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
				const templateExercises = templateToWorkoutExercises(template, customExercises);
				// Merge exercises, avoiding duplicates
				for (const templateEx of templateExercises) {
					if (!selectedExercises.some((e) => e.exercise.id === templateEx.exercise.id)) {
						selectedExercises = [...selectedExercises, templateEx as WorkoutExerciseData];
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

	function moveExerciseUp(index: number) {
		if (index > 0) {
			const newExercises = [...selectedExercises];
			[newExercises[index - 1], newExercises[index]] = [newExercises[index], newExercises[index - 1]];
			selectedExercises = newExercises;
		}
	}

	function moveExerciseDown(index: number) {
		if (index < selectedExercises.length - 1) {
			const newExercises = [...selectedExercises];
			[newExercises[index], newExercises[index + 1]] = [newExercises[index + 1], newExercises[index]];
			selectedExercises = newExercises;
		}
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
			if (exIdx === exerciseIndex && (ex.exerciseType === 'weights' || ex.exerciseType === 'bodyweight')) {
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

	function updateCardioData(exerciseIndex: number, field: 'durationMinutes' | 'calories', value: number) {
		selectedExercises = selectedExercises.map((ex, exIdx) => {
			if (exIdx === exerciseIndex && ex.exerciseType === 'cardio') {
				return { ...ex, [field]: value };
			}
			return ex;
		});
	}

	function updateStretchesData(exerciseIndex: number, field: 'durationSeconds' | 'reps', value: number) {
		selectedExercises = selectedExercises.map((ex, exIdx) => {
			if (exIdx === exerciseIndex && ex.exerciseType === 'stretches') {
				return { ...ex, [field]: value };
			}
			return ex;
		});
	}

	function removeSet(exerciseIndex: number, setIndex: number) {
		selectedExercises = selectedExercises.map((ex, exIdx) => {
			if (exIdx === exerciseIndex && (ex.exerciseType === 'weights' || ex.exerciseType === 'bodyweight') && ex.sets.length > 1) {
				return {
					...ex,
					sets: ex.sets.filter((_, idx) => idx !== setIndex)
				};
			}
			return ex;
		});
	}

	function addSet(exerciseIndex: number) {
		const ex = selectedExercises[exerciseIndex];
		if (ex.exerciseType !== 'weights' && ex.exerciseType !== 'bodyweight') return;
		
		const exercise = ex.exercise;
		const lastSet = ex.sets[ex.sets.length - 1];
		
		selectedExercises = selectedExercises.map((exercise, idx) => {
			if (idx === exerciseIndex && (exercise.exerciseType === 'weights' || exercise.exerciseType === 'bodyweight')) {
				return {
					...exercise,
					sets: [
						...exercise.sets,
						{
							reps: lastSet?.reps || exercise.exercise.defaultReps || 10,
							weight: lastSet?.weight || 0,
							rest: exercise.exercise.defaultRestSeconds || 60,
							completed: false
						}
					]
				};
			}
			return exercise;
		});
	}

	async function saveWorkout() {
		if (selectedExercises.length === 0) {
			alert('Please add at least one exercise');
			return;
		}

		isLoading = true;
		try {
			// Save as template only (does not record as workout done for the day)
			const { data: template, error: templateError } = await supabase
				.from('workout_templates')
				.insert({
					name: workoutName || 'Workout'
				})
				.select()
				.single();

			if (templateError) throw templateError;

			const templateExercises = selectedExercises.map((ex, index) => {
				const base = {
					workout_template_id: template.id,
					exercise_id: ex.exercise.id,
					exercise_order: index
				};
				
				if (ex.exerciseType === 'weights' || ex.exerciseType === 'bodyweight') {
					return {
						...base,
						sets: ex.sets.map((set) => ({
							reps: set.reps,
							weight: set.weight,
							rest: set.rest
						}))
					};
				} else if (ex.exerciseType === 'cardio') {
					return {
						...base,
						sets: {
							type: 'cardio',
							durationMinutes: ex.durationMinutes,
							calories: ex.calories
						}
					};
				} else if (ex.exerciseType === 'stretches') {
					return {
						...base,
						sets: {
							type: 'stretches',
							durationSeconds: ex.durationSeconds,
							reps: ex.reps
						}
					};
				}
				return base;
			});

			const { error: exercisesError } = await supabase
				.from('workout_template_exercises')
				.insert(templateExercises);

			if (exercisesError) throw exercisesError;

			// Redirect to workouts page so user can start it or create another
			goto('/workouts');
		} catch (error) {
			console.error('Error saving workout template:', error);
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
		<div class="max-w-md mx-auto px-4 py-4">
			<div class="flex items-center justify-between gap-2">
				<a href="/" class="text-[var(--color-muted)] hover:text-[var(--color-foreground)] flex-shrink-0">
					<X class="w-6 h-6" />
				</a>
				<h1 class="text-xl font-bold text-[var(--color-foreground)] flex-1 text-center">New Workout</h1>
				<div class="flex gap-2 flex-shrink-0">
					{#if showTemplates}
						<button
							onclick={applyTemplates}
							disabled={selectedTemplates.size === 0}
							class="px-4 py-2 bg-[var(--gradient-primary)] text-white font-semibold rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
						>
							Select
						</button>
					{:else}
						<button
							onclick={saveWorkout}
							disabled={isLoading || selectedExercises.length === 0}
							class="px-4 py-2 bg-[var(--gradient-primary)] text-white font-semibold rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
						>
							{isLoading ? 'Saving...' : 'Save'}
						</button>
					{/if}
				</div>
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
								{@const exercise = getExerciseById(recent.exerciseId) || customExercises.find(ce => ce.id === recent.exerciseId)}
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
					{#if selectedExercises.length > 1}
						<button
							onclick={clearAllExercises}
							class="text-sm text-[var(--color-muted)] hover:text-[var(--color-danger)] font-medium"
						>
							Clear All
						</button>
					{/if}
				</div>
				{#each selectedExercises as ex, exerciseIndex}
					<div class="fitness-card">
						<div class="flex items-start justify-between mb-4">
							<div class="flex items-start gap-2 flex-1">
								<!-- Reorder buttons -->
								<div class="flex flex-col gap-1 pt-1">
									<button
										onclick={() => moveExerciseUp(exerciseIndex)}
										disabled={exerciseIndex === 0}
										class="p-1 text-[var(--color-muted)] hover:text-[var(--color-primary)] transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
										title="Move up"
									>
										<ChevronUp class="w-4 h-4" />
									</button>
									<button
										onclick={() => moveExerciseDown(exerciseIndex)}
										disabled={exerciseIndex === selectedExercises.length - 1}
										class="p-1 text-[var(--color-muted)] hover:text-[var(--color-primary)] transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
										title="Move down"
									>
										<ChevronDown class="w-4 h-4" />
									</button>
								</div>
								<button
									onclick={() => (selectedExerciseDetail = ex.exercise)}
									class="flex-1 text-left"
								>
									<h3 class="text-lg font-semibold text-[var(--color-foreground)] mb-1 hover:text-[var(--color-primary)] transition-colors">
										{ex.exercise.name}
									</h3>
									{#if (ex.exerciseType === 'weights' || ex.exerciseType === 'bodyweight') && ex.exercise.muscleGroups.length > 0}
										<div class="flex flex-wrap gap-2 mt-2">
											{#each ex.exercise.muscleGroups as mg}
												<span class="px-2 py-1 bg-[var(--color-primary)]/20 text-[var(--color-primary)] text-xs rounded-full">
													{mg}
												</span>
											{/each}
										</div>
									{/if}
									<div class="text-xs text-[var(--color-muted)] mt-1">
										{ex.exerciseType.charAt(0).toUpperCase() + ex.exerciseType.slice(1)} • {ex.exercise.equipment}
									</div>
								</button>
							</div>
							<div class="flex items-center gap-2">
								<button
									onclick={() => (selectedExerciseDetail = ex.exercise)}
									class="p-2 text-[var(--color-muted)] hover:text-[var(--color-primary)] transition-colors"
									title="View details"
								>
									<Info class="w-5 h-5" />
								</button>
								<button
									onclick={() => removeExercise(exerciseIndex)}
									class="p-2 text-[var(--color-muted)] hover:text-[var(--color-danger)] transition-colors"
									title="Remove exercise"
								>
									<X class="w-5 h-5" />
								</button>
							</div>
						</div>

						<!-- Weights/Bodyweight Sets -->
						{#if ex.exerciseType === 'weights' || ex.exerciseType === 'bodyweight'}
							<div class="space-y-3">
								{#each ex.sets as set, setIndex}
									<div
										class="flex items-center gap-3 p-3 rounded-lg bg-[var(--color-card-hover)] border border-[var(--color-border)]"
									>
										<button
											onclick={() => removeSet(exerciseIndex, setIndex)}
											class="flex-shrink-0 w-6 h-6 rounded-full border-2 border-[var(--color-danger)]/50 hover:bg-[var(--color-danger)]/20 flex items-center justify-center transition-colors"
											title="Remove set"
										>
											<X class="w-4 h-4 text-[var(--color-danger)]" />
										</button>
										<span class="text-sm text-[var(--color-muted)] w-14 flex-shrink-0 text-left">Set {setIndex + 1}</span>
										<input
											type="number"
											value={set.reps}
											oninput={(e) => updateSet(exerciseIndex, setIndex, 'reps', parseInt(e.target.value) || 0)}
											class="flex-1 min-w-0 px-3 py-2 bg-[var(--color-background)] border border-[var(--color-border)] rounded text-[var(--color-foreground)] text-center focus:outline-none focus:border-[var(--color-primary)]"
											placeholder="Reps"
										/>
										<span class="text-[var(--color-muted)] flex-shrink-0">×</span>
										<input
											type="number"
											value={convertWeight(set.weight, currentUnit)}
											step={currentUnit === 'lbs' ? '0.5' : '0.5'}
											oninput={(e) => {
												const inputValue = parseFloat(e.target.value) || 0;
												// Convert from displayed unit back to kg for storage
												const weightKg = currentUnit === 'lbs' ? lbsToKg(inputValue) : inputValue;
												updateSet(exerciseIndex, setIndex, 'weight', weightKg);
											}}
											class="flex-1 min-w-0 px-3 py-2 bg-[var(--color-background)] border border-[var(--color-border)] rounded text-[var(--color-foreground)] text-center focus:outline-none focus:border-[var(--color-primary)]"
											placeholder="Weight"
										/>
										<span class="text-[var(--color-muted)] text-sm flex-shrink-0">{getWeightUnitLabel(currentUnit)}</span>
									</div>
								{/each}
								<button
									onclick={() => addSet(exerciseIndex)}
									class="w-full py-2 text-sm text-[var(--color-primary)] hover:text-[var(--color-primary-dark)] font-medium"
								>
									+ Add Set
								</button>
							</div>
						{:else if ex.exerciseType === 'cardio'}
							<!-- Cardio Fields -->
							<div class="space-y-3">
								<div class="flex items-center gap-3 p-3 rounded-lg bg-[var(--color-card-hover)] border border-[var(--color-border)]">
									<div class="flex-1 flex items-center gap-2">
										<label class="text-sm text-[var(--color-muted)] w-20">Duration:</label>
										<input
											type="number"
											value={ex.durationMinutes}
											oninput={(e) => updateCardioData(exerciseIndex, 'durationMinutes', parseInt(e.target.value) || 0)}
											class="flex-1 px-3 py-2 bg-[var(--color-background)] border border-[var(--color-border)] rounded text-[var(--color-foreground)] text-center focus:outline-none focus:border-[var(--color-primary)]"
											placeholder="Minutes"
										/>
										<span class="text-[var(--color-muted)] text-sm">min</span>
									</div>
								</div>
								<div class="flex items-center gap-3 p-3 rounded-lg bg-[var(--color-card-hover)] border border-[var(--color-border)]">
									<div class="flex-1 flex items-center gap-2">
										<label class="text-sm text-[var(--color-muted)] w-20">Calories:</label>
										<input
											type="number"
											value={ex.calories}
											oninput={(e) => updateCardioData(exerciseIndex, 'calories', parseInt(e.target.value) || 0)}
											class="flex-1 px-3 py-2 bg-[var(--color-background)] border border-[var(--color-border)] rounded text-[var(--color-foreground)] text-center focus:outline-none focus:border-[var(--color-primary)]"
											placeholder="Calories"
										/>
										<span class="text-[var(--color-muted)] text-sm">cal</span>
									</div>
								</div>
							</div>
						{:else if ex.exerciseType === 'stretches'}
							<!-- Stretches Fields -->
							<div class="space-y-3">
								<div class="flex items-center gap-3 p-3 rounded-lg bg-[var(--color-card-hover)] border border-[var(--color-border)]">
									<div class="flex-1 flex items-center gap-2">
										<label class="text-sm text-[var(--color-muted)] w-20">Duration:</label>
										<input
											type="number"
											value={ex.durationSeconds}
											oninput={(e) => updateStretchesData(exerciseIndex, 'durationSeconds', parseInt(e.target.value) || 0)}
											class="flex-1 px-3 py-2 bg-[var(--color-background)] border border-[var(--color-border)] rounded text-[var(--color-foreground)] text-center focus:outline-none focus:border-[var(--color-primary)]"
											placeholder="Seconds"
										/>
										<span class="text-[var(--color-muted)] text-sm">sec</span>
									</div>
								</div>
								<div class="flex items-center gap-3 p-3 rounded-lg bg-[var(--color-card-hover)] border border-[var(--color-border)]">
									<div class="flex-1 flex items-center gap-2">
										<label class="text-sm text-[var(--color-muted)] w-20">Reps:</label>
										<input
											type="number"
											value={ex.reps}
											oninput={(e) => updateStretchesData(exerciseIndex, 'reps', parseInt(e.target.value) || 0)}
											class="flex-1 px-3 py-2 bg-[var(--color-background)] border border-[var(--color-border)] rounded text-[var(--color-foreground)] text-center focus:outline-none focus:border-[var(--color-primary)]"
											placeholder="Reps"
										/>
									</div>
								</div>
							</div>
						{/if}
					</div>
				{/each}
			</div>
		{/if}
	</div>

	<!-- Exercise Search Modal -->
	{#if showExerciseSearch}
		<div
			class="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
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
          class="w-full max-w-md bg-[var(--color-card)] rounded-2xl max-h-[80vh] overflow-hidden flex flex-col shadow-2xl"
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
							<div class="flex items-center gap-2">
								<button
									onclick={() => addExercise(exercise)}
									disabled={selectedExercises.some((e) => e.exercise.id === exercise.id)}
									class="flex-1 p-4 text-left fitness-card hover:scale-[1.02] transition-transform disabled:opacity-50 disabled:cursor-not-allowed"
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
								<button
									onclick={(e) => {
										e.stopPropagation();
										selectedExerciseDetail = exercise;
									}}
									class="p-3 text-[var(--color-muted)] hover:text-[var(--color-primary)] transition-colors"
									title="View details"
								>
									<Info class="w-5 h-5" />
								</button>
							</div>
						{/each}
					</div>
				</div>
			</div>
		</div>
	{/if}

	<!-- Exercise Detail Modal -->
	<ExerciseDetail
		exercise={selectedExerciseDetail}
		onClose={() => (selectedExerciseDetail = null)}
		onEdit={(exercise) => {
			selectedExerciseDetail = null;
			// Could open editor here if needed
		}}
	/>
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

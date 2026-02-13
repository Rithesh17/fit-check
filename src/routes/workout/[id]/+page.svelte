<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { supabase } from '$lib/supabase/client';
	import { getExerciseById, type Exercise, type ExerciseType } from '$lib/data/exercises';
	import { Calendar, Clock, Activity, ArrowLeft, Check } from 'lucide-svelte';

	type WorkoutExerciseSets = 
		| Array<{ reps: number; weight: number; rest: number; completed: boolean }>
		| { type: 'cardio'; durationMinutes: number; calories: number; completed: boolean }
		| { type: 'stretches'; durationSeconds: number; reps: number; completed: boolean };

	interface WorkoutExercise {
		id: string;
		exercise_id: string;
		exercise_order: number;
		sets: WorkoutExerciseSets;
		notes: string | null;
		exercise?: Exercise;
	}

	interface Workout {
		id: string;
		name: string | null;
		date: string;
		duration_minutes: number | null;
		notes: string | null;
	}

	let { params } = $props();

	let workout = $state<Workout | null>(null);
	let workoutExercises = $state<WorkoutExercise[]>([]);
	let isLoading = $state(true);
	
	// Custom exercises from database
	let customExercises = $state<Array<Exercise & { id: string; isCustom: boolean }>>([]);

	$effect(() => {
		if (params.id) {
			loadWorkout(params.id);
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

	async function loadWorkout(id: string) {
		try {
			isLoading = true;
			await loadCustomExercises();

			// Fetch workout
			const { data: workoutData, error: workoutError } = await supabase
				.from('workouts')
				.select('*')
				.eq('id', id)
				.single();

			if (workoutError) throw workoutError;
			workout = workoutData;

			// Fetch workout exercises
			const { data: exercisesData, error: exercisesError } = await supabase
				.from('workout_exercises')
				.select('*')
				.eq('workout_id', id)
				.order('exercise_order', { ascending: true });

			if (exercisesError) throw exercisesError;

			// Enrich with exercise data
			workoutExercises = (exercisesData || []).map((we: any) => ({
				id: we.id,
				exercise_id: we.exercise_id,
				exercise_order: we.exercise_order,
				sets: we.sets as WorkoutExerciseSets,
				notes: we.notes,
				exercise: getExerciseById(we.exercise_id) || customExercises.find(ce => ce.id === we.exercise_id)
			}));
		} catch (error) {
			console.error('Error loading workout:', error);
		} finally {
			isLoading = false;
		}
	}

	function formatDate(dateString: string): string {
		const date = new Date(dateString);
		return date.toLocaleDateString('en-US', {
			weekday: 'long',
			year: 'numeric',
			month: 'long',
			day: 'numeric'
		});
	}

	function getTotalVolume(): number {
		return workoutExercises.reduce((total, we) => {
			if (Array.isArray(we.sets)) {
				return total + we.sets.reduce((setTotal, set) => {
					return setTotal + (set.reps * set.weight);
				}, 0);
			}
			return total;
		}, 0);
	}

	function getCompletedSets(): number {
		return workoutExercises.reduce((total, we) => {
			if (Array.isArray(we.sets)) {
				return total + we.sets.filter((set) => set.completed).length;
			} else if (we.sets && typeof we.sets === 'object' && 'completed' in we.sets) {
				return total + (we.sets.completed ? 1 : 0);
			}
			return total;
		}, 0);
	}

	function getTotalSets(): number {
		return workoutExercises.reduce((total, we) => {
			if (Array.isArray(we.sets)) {
				return total + we.sets.length;
			} else {
				return total + 1; // Cardio/stretches count as 1 "set"
			}
		}, 0);
	}
</script>

<svelte:head>
	<title>{workout?.name || 'Workout'} - Fit Check</title>
</svelte:head>

<div class="min-h-screen bg-[var(--color-background)] pb-20">
	<!-- Header -->
	<div class="sticky top-0 z-10 bg-[var(--color-background)]/95 backdrop-blur-sm border-b border-[var(--color-border)]">
		<div class="max-w-md mx-auto px-4 py-4">
			<div class="flex items-center gap-3 mb-4">
				<button onclick={() => goto('/')} class="text-[var(--color-muted)] hover:text-[var(--color-foreground)]">
					<ArrowLeft class="w-6 h-6" />
				</button>
				<h1 class="text-xl font-bold text-[var(--color-foreground)] flex-1">
					{workout?.name || 'Workout'}
				</h1>
			</div>
			{#if workout}
				<div class="flex items-center gap-4 text-sm text-[var(--color-muted)]">
					<div class="flex items-center gap-1">
						<Calendar class="w-4 h-4" />
						<span>{formatDate(workout.date)}</span>
					</div>
					{#if workout.duration_minutes}
						<div class="flex items-center gap-1">
							<Clock class="w-4 h-4" />
							<span>{workout.duration_minutes} min</span>
						</div>
					{/if}
				</div>
			{/if}
		</div>
	</div>

	<div class="max-w-md mx-auto px-4 py-6">
		{#if isLoading}
			<div class="fitness-card animate-pulse">
				<div class="h-32 bg-[var(--color-card-hover)] rounded-lg"></div>
			</div>
		{:else if !workout}
			<div class="fitness-card text-center py-12">
				<p class="text-[var(--color-muted)]">Workout not found</p>
			</div>
		{:else}
			<!-- Stats -->
			<div class="grid grid-cols-3 gap-3 mb-6">
				<div class="fitness-card text-center">
					<p class="text-2xl font-bold text-[var(--color-foreground)]">{workoutExercises.length}</p>
					<p class="text-xs text-[var(--color-muted)] mt-1">Exercises</p>
				</div>
				<div class="fitness-card text-center">
					<p class="text-2xl font-bold text-[var(--color-foreground)]">
						{getCompletedSets()}/{getTotalSets()}
					</p>
					<p class="text-xs text-[var(--color-muted)] mt-1">Sets</p>
				</div>
				<div class="fitness-card text-center">
					<p class="text-2xl font-bold text-[var(--color-foreground)]">{getTotalVolume().toFixed(0)}</p>
					<p class="text-xs text-[var(--color-muted)] mt-1">Volume (kg)</p>
				</div>
			</div>

			<!-- Exercises -->
			<div class="space-y-4">
				{#each workoutExercises as we, index}
					<div class="fitness-card">
						<div class="mb-4">
							<h3 class="text-lg font-semibold text-[var(--color-foreground)] mb-2">
								{we.exercise?.name || 'Unknown Exercise'}
							</h3>
							{#if we.exercise}
								<div class="flex items-center gap-2 mb-2">
									<span class="text-xs text-[var(--color-muted)]">
										{we.exercise.exerciseType ? we.exercise.exerciseType.charAt(0).toUpperCase() + we.exercise.exerciseType.slice(1) : ''}
									</span>
									{#if (we.exercise.exerciseType === 'weights' || we.exercise.exerciseType === 'bodyweight') && we.exercise.muscleGroups.length > 0}
										<div class="flex flex-wrap gap-2">
											{#each we.exercise.muscleGroups as mg}
												<span class="px-2 py-1 bg-[var(--color-primary)]/20 text-[var(--color-primary)] text-xs rounded-full">
													{mg}
												</span>
											{/each}
										</div>
									{/if}
								</div>
							{/if}
						</div>

						<!-- Sets - Weights/Bodyweight -->
						{#if Array.isArray(we.sets)}
							<div class="space-y-2">
								{#each we.sets as set, setIndex}
									<div
										class="flex items-center gap-3 p-3 rounded-lg {set.completed
											? 'bg-[var(--color-accent)]/20 border border-[var(--color-accent)]/50'
											: 'bg-[var(--color-card-hover)] border border-[var(--color-border)]'}"
									>
										<div
											class="flex-shrink-0 w-6 h-6 rounded-full border-2 {set.completed
												? 'bg-[var(--color-accent)] border-[var(--color-accent)]'
												: 'border-[var(--color-border)]'} flex items-center justify-center"
										>
											{#if set.completed}
												<Check class="w-4 h-4 text-[var(--color-on-primary)]" />
											{/if}
										</div>
										<span class="text-sm text-[var(--color-muted)] w-8">Set {setIndex + 1}</span>
										<div class="flex-1 flex items-center gap-2">
											<span class="text-[var(--color-foreground)] font-medium">{set.reps}</span>
											<span class="text-[var(--color-muted)]">×</span>
											<span class="text-[var(--color-foreground)] font-medium">{set.weight}</span>
											<span class="text-[var(--color-muted)] text-sm">kg</span>
										</div>
									</div>
								{/each}
							</div>
						{:else if we.sets && typeof we.sets === 'object' && 'type' in we.sets}
							<!-- Cardio or Stretches -->
							<div class="space-y-2">
								{#if we.sets.type === 'cardio'}
									<div
										class="flex items-center gap-3 p-3 rounded-lg {we.sets.completed
											? 'bg-[var(--color-accent)]/20 border border-[var(--color-accent)]/50'
											: 'bg-[var(--color-card-hover)] border border-[var(--color-border)]'}"
									>
										<div
											class="flex-shrink-0 w-6 h-6 rounded-full border-2 {we.sets.completed
												? 'bg-[var(--color-accent)] border-[var(--color-accent)]'
												: 'border-[var(--color-border)]'} flex items-center justify-center"
										>
											{#if we.sets.completed}
												<Check class="w-4 h-4 text-[var(--color-on-primary)]" />
											{/if}
										</div>
										<div class="flex-1 flex items-center gap-4">
											<div class="flex items-center gap-2">
												<Clock class="w-4 h-4 text-[var(--color-muted)]" />
												<span class="text-[var(--color-foreground)] font-medium">{we.sets.durationMinutes}</span>
												<span class="text-[var(--color-muted)] text-sm">min</span>
											</div>
											<div class="flex items-center gap-2">
												<Activity class="w-4 h-4 text-[var(--color-muted)]" />
												<span class="text-[var(--color-foreground)] font-medium">{we.sets.calories}</span>
												<span class="text-[var(--color-muted)] text-sm">cal</span>
											</div>
										</div>
									</div>
								{:else if we.sets.type === 'stretches'}
									<div
										class="flex items-center gap-3 p-3 rounded-lg {we.sets.completed
											? 'bg-[var(--color-accent)]/20 border border-[var(--color-accent)]/50'
											: 'bg-[var(--color-card-hover)] border border-[var(--color-border)]'}"
									>
										<div
											class="flex-shrink-0 w-6 h-6 rounded-full border-2 {we.sets.completed
												? 'bg-[var(--color-accent)] border-[var(--color-accent)]'
												: 'border-[var(--color-border)]'} flex items-center justify-center"
										>
											{#if we.sets.completed}
												<Check class="w-4 h-4 text-[var(--color-on-primary)]" />
											{/if}
										</div>
										<div class="flex-1 flex items-center gap-4">
											<div class="flex items-center gap-2">
												<Clock class="w-4 h-4 text-[var(--color-muted)]" />
												<span class="text-[var(--color-foreground)] font-medium">{we.sets.durationSeconds}</span>
												<span class="text-[var(--color-muted)] text-sm">sec</span>
											</div>
											<div class="flex items-center gap-2">
												<span class="text-[var(--color-foreground)] font-medium">{we.sets.reps}</span>
												<span class="text-[var(--color-muted)] text-sm">reps</span>
											</div>
										</div>
									</div>
								{/if}
							</div>
						{/if}
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

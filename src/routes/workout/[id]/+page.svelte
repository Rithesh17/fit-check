<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { supabase } from '$lib/supabase/client';
	import { getExerciseById, type Exercise } from '$lib/data/exercises';
	import { Calendar, Clock, Activity, ArrowLeft, Check } from 'lucide-svelte';

	interface WorkoutExercise {
		id: string;
		exercise_id: string;
		exercise_order: number;
		sets: Array<{ reps: number; weight: number; rest: number; completed: boolean }>;
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

	$effect(() => {
		if (params.id) {
			loadWorkout(params.id);
		}
	});

	async function loadWorkout(id: string) {
		try {
			isLoading = true;

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
			workoutExercises = (exercisesData || []).map((we) => ({
				...we,
				sets: we.sets as Array<{ reps: number; weight: number; rest: number; completed: boolean }>,
				exercise: getExerciseById(we.exercise_id)
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
			return (
				total +
				we.sets.reduce((setTotal, set) => {
					return setTotal + (set.reps * set.weight);
				}, 0)
			);
		}, 0);
	}

	function getCompletedSets(): number {
		return workoutExercises.reduce((total, we) => {
			return total + we.sets.filter((set) => set.completed).length;
		}, 0);
	}

	function getTotalSets(): number {
		return workoutExercises.reduce((total, we) => {
			return total + we.sets.length;
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
								<div class="flex flex-wrap gap-2">
									{#each we.exercise.muscleGroups as mg}
										<span class="px-2 py-1 bg-[var(--color-primary)]/20 text-[var(--color-primary)] text-xs rounded-full">
											{mg}
										</span>
									{/each}
								</div>
							{/if}
						</div>

						<!-- Sets -->
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

<script lang="ts">
	import { onMount } from 'svelte';
	import { supabase } from '$lib/supabase/client';
	import { exercises, getExerciseById, type ExerciseType } from '$lib/data/exercises';
	import { calculateExerciseProgress, getPersonalRecords, type ExerciseProgress } from '$lib/utils/progress';
	import StrengthChart from '$lib/components/StrengthChart.svelte';
	import VolumeTrendChart from '$lib/components/VolumeTrendChart.svelte';
	import MuscleGroupChart from '$lib/components/MuscleGroupChart.svelte';
	import { TrendingUp, Award, Activity } from 'lucide-svelte';

	let selectedExerciseId = $state<string | null>(null);
	let exerciseProgress = $state<ExerciseProgress | null>(null);
	let personalRecords = $state<Array<{ exerciseName: string; weight: number; reps: number; date: Date }>>([]);
	let isLoading = $state(true);
	let chartType = $state<'weight' | 'volume'>('weight');

	// Get exercises that have been used in workouts
	let usedExercises = $state<Array<{ id: string; name: string }>>([]);
	let exerciseMap = $state<Map<string, Array<{ date: string; sets: any }>>>(new Map());
	
	// Custom exercises from database
	let customExercises = $state<Array<{ id: string; name: string; exerciseType: ExerciseType; isCustom: boolean }>>([]);

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
				isCustom: true
			}));
		} catch (error) {
			console.error('Error loading custom exercises:', error);
		}
	}

	onMount(async () => {
		await loadCustomExercises();
		await loadProgressData();
	});

	async function loadProgressData() {
		try {
			isLoading = true;

			// Fetch all workouts first
			const { data: workouts, error: workoutsError } = await supabase
				.from('workouts')
				.select('id, date')
				.order('date', { ascending: true });

			if (workoutsError) throw workoutsError;

			// Fetch all workout exercises
			const { data: workoutExercises, error } = await supabase
				.from('workout_exercises')
				.select('exercise_id, workout_id, sets')
				.order('created_at', { ascending: true });

			if (error) throw error;

			// Create workout date lookup
			const workoutDateMap = new Map<string, string>();
			(workouts || []).forEach((w: any) => {
				workoutDateMap.set(w.id, w.date);
			});

			// Group by exercise
			const map = new Map<string, Array<{ date: string; sets: any }>>();

			(workoutExercises || []).forEach((we: any) => {
				const workoutDate = workoutDateMap.get(we.workout_id);
				if (!workoutDate) return;

				if (!map.has(we.exercise_id)) {
					map.set(we.exercise_id, []);
				}
				map.get(we.exercise_id)!.push({
					date: workoutDate,
					sets: we.sets
				});
			});

			exerciseMap = map;

			// Get unique exercises (from both default and custom)
			usedExercises = Array.from(map.keys())
				.map((id) => {
					const exercise = getExerciseById(id) || customExercises.find(ce => ce.id === id);
					return exercise ? { id, name: exercise.name } : null;
				})
				.filter((e): e is { id: string; name: string } => e !== null)
				.sort((a, b) => a.name.localeCompare(b.name));

			// Calculate personal records
			const allProgress: ExerciseProgress[] = [];
			map.forEach((workouts, exerciseId) => {
				const exercise = getExerciseById(exerciseId) || customExercises.find(ce => ce.id === exerciseId);
				if (exercise) {
					const progress = calculateExerciseProgress(exerciseId, exercise.name, workouts);
					if (progress.dates.length > 0) {
						allProgress.push(progress);
					}
				}
			});

			personalRecords = getPersonalRecords(allProgress);

			// Set first exercise as default if available
			if (usedExercises.length > 0 && !selectedExerciseId) {
				selectedExerciseId = usedExercises[0].id;
			}

			// Load selected exercise progress
			if (selectedExerciseId) {
				loadExerciseProgress(selectedExerciseId);
			}
		} catch (error) {
			console.error('Error loading progress data:', error);
		} finally {
			isLoading = false;
		}
	}

	function loadExerciseProgress(exerciseId: string) {
		const workouts = exerciseMap.get(exerciseId) || [];
		const exercise = getExerciseById(exerciseId) || customExercises.find(ce => ce.id === exerciseId);
		if (exercise) {
			exerciseProgress = calculateExerciseProgress(exerciseId, exercise.name, workouts);
		} else {
			exerciseProgress = null;
		}
	}

	$effect(() => {
		if (selectedExerciseId && exerciseMap.size > 0) {
			// Update progress when exercise changes
			loadExerciseProgress(selectedExerciseId);
		}
	});
</script>

<svelte:head>
	<title>Progress - Fit Check</title>
</svelte:head>

<div class="min-h-screen bg-[var(--color-background)] pb-20">
	<!-- Header -->
	<div class="sticky top-0 z-10 bg-[var(--color-background)]/95 backdrop-blur-sm border-b border-[var(--color-border)]">
		<div class="max-w-md mx-auto px-4 py-4">
			<h1 class="text-2xl font-bold text-[var(--color-foreground)] mb-4">Progress</h1>
		</div>
	</div>

	<div class="max-w-md mx-auto px-4 py-6 space-y-6">
		{#if isLoading}
			<div class="fitness-card animate-pulse">
				<div class="h-64 bg-[var(--color-card-hover)] rounded-lg"></div>
			</div>
		{:else if usedExercises.length === 0}
			<div class="fitness-card text-center py-12">
				<Activity class="w-12 h-12 text-[var(--color-muted)] mx-auto mb-3 opacity-50" />
				<p class="text-[var(--color-muted)] mb-4">No workout data yet</p>
				<a href="/workout/new" class="inline-block px-6 py-2 bg-[var(--gradient-primary)] text-white font-semibold rounded-lg">
					Start Your First Workout
				</a>
			</div>
		{:else}
			<!-- Personal Records -->
			{#if personalRecords.length > 0}
				<div>
					<div class="flex items-center gap-2 mb-4">
						<Award class="w-5 h-5 text-[var(--color-primary)]" />
						<h2 class="text-lg font-semibold text-[var(--color-foreground)]">Personal Records</h2>
					</div>
					<div class="space-y-2">
						{#each personalRecords.slice(0, 5) as pr}
							<div class="fitness-card">
								<div class="flex items-center justify-between">
									<div>
										<h3 class="font-semibold text-[var(--color-foreground)]">{pr.exerciseName}</h3>
										<p class="text-sm text-[var(--color-muted)]">
											{pr.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
										</p>
									</div>
									<div class="text-right">
										<p class="text-xl font-bold text-[var(--color-primary)]">{pr.weight} kg</p>
										<p class="text-sm text-[var(--color-muted)]">{pr.reps} reps</p>
									</div>
								</div>
							</div>
						{/each}
					</div>
				</div>
			{/if}

			<!-- Exercise Selection -->
			<div>
				<h2 class="text-lg font-semibold text-[var(--color-foreground)] mb-4">Strength Progression</h2>
				<select
					bind:value={selectedExerciseId}
					class="w-full px-4 py-3 bg-[var(--color-card)] border border-[var(--color-border)] rounded-lg text-[var(--color-foreground)] focus:outline-none focus:border-[var(--color-primary)] mb-4"
				>
					{#each usedExercises as ex}
						<option value={ex.id}>{ex.name}</option>
					{/each}
				</select>

				{#if exerciseProgress && exerciseProgress.dates.length > 0}
					<!-- Chart Type Toggle -->
					<div class="flex gap-2 mb-4">
						<button
							onclick={() => (chartType = 'weight')}
							class="flex-1 px-4 py-2 rounded-lg font-medium transition-colors {chartType === 'weight'
								? 'bg-[var(--color-primary)] text-white'
								: 'bg-[var(--color-card)] text-[var(--color-muted)] border border-[var(--color-border)]'}"
						>
							Max Weight
						</button>
						<button
							onclick={() => (chartType = 'volume')}
							class="flex-1 px-4 py-2 rounded-lg font-medium transition-colors {chartType === 'volume'
								? 'bg-[var(--color-secondary)] text-white'
								: 'bg-[var(--color-card)] text-[var(--color-muted)] border border-[var(--color-border)]'}"
						>
							Volume
						</button>
					</div>

					<!-- Chart -->
					<div class="fitness-card">
						<h3 class="text-lg font-semibold text-[var(--color-foreground)] mb-4">
							{exerciseProgress.exerciseName}
						</h3>
						<StrengthChart progress={exerciseProgress} {chartType} />
					</div>

					<!-- Stats -->
					{#if exerciseProgress.personalRecord}
						<div class="fitness-card">
							<div class="flex items-center gap-2 mb-4">
								<TrendingUp class="w-5 h-5 text-[var(--color-accent)]" />
								<h3 class="font-semibold text-[var(--color-foreground)]">Personal Record</h3>
							</div>
							<div class="space-y-2">
								<div class="flex justify-between">
									<span class="text-[var(--color-muted)]">Max Weight</span>
									<span class="font-bold text-[var(--color-foreground)]">
										{exerciseProgress.personalRecord.weight} kg
									</span>
								</div>
								<div class="flex justify-between">
									<span class="text-[var(--color-muted)]">Reps</span>
									<span class="font-bold text-[var(--color-foreground)]">
										{exerciseProgress.personalRecord.reps}
									</span>
								</div>
								<div class="flex justify-between">
									<span class="text-[var(--color-muted)]">Date</span>
									<span class="font-bold text-[var(--color-foreground)]">
										{exerciseProgress.personalRecord.date.toLocaleDateString('en-US', {
											month: 'short',
											day: 'numeric',
											year: 'numeric'
										})}
									</span>
								</div>
							</div>
						</div>
					{/if}
				{:else if selectedExerciseId}
					<div class="fitness-card text-center py-8">
						<p class="text-[var(--color-muted)]">No data for this exercise yet</p>
					</div>
				{/if}
			</div>

			<!-- Volume Trends -->
			<VolumeTrendChart />

			<!-- Muscle Group Distribution -->
			<MuscleGroupChart />
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

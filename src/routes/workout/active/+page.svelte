<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { supabase } from '$lib/supabase/client';
	import { exercises, getExerciseById, type Exercise } from '$lib/data/exercises';
	import RestTimer from '$lib/components/RestTimer.svelte';
	import { Check, X, Play, Pause, SkipForward, Info, Clock, Edit2 } from 'lucide-svelte';

	type WorkoutExercise = {
		exercise: Exercise;
		sets: Array<{ reps: number; weight: number; rest: number; completed: boolean; notes?: string }>;
	};

	let workoutName = $state('');
	let selectedExercises = $state<WorkoutExercise[]>([]);
	let currentExerciseIndex = $state(0);
	let currentSetIndex = $state(0);
	let workoutStartTime = $state<Date | null>(null);
	let workoutDuration = $state(0); // in seconds
	let durationInterval: ReturnType<typeof setInterval> | null = $state(null);
	let showRestTimer = $state(false);
	let showInstructions = $state(false);
	let showSetNotes = $state(false);
	let isSaving = $state(false);
	let workoutNotes = $state('');
	let energyLevel = $state<number | null>(null);
	let mood = $state<string>('');
	let currentSetNotes = $state('');

	const currentExercise = $derived(
		selectedExercises[currentExerciseIndex]?.exercise || null
	);
	const currentSet = $derived(
		selectedExercises[currentExerciseIndex]?.sets[currentSetIndex] || null
	);
	const allSetsComplete = $derived(
		selectedExercises.every((ex) => ex.sets.every((set) => set.completed))
	);

	onMount(() => {
		// Load workout data from sessionStorage (passed from workout creation)
		const savedWorkout = sessionStorage.getItem('activeWorkout');
		if (savedWorkout) {
			try {
				const data = JSON.parse(savedWorkout);
				workoutName = data.name || 'Workout';
				workoutNotes = data.notes || '';
				energyLevel = data.energyLevel || null;
				mood = data.mood || '';
				selectedExercises = data.exercises.map((ex: any) => ({
					exercise: getExerciseById(ex.exerciseId),
					sets: ex.sets.map((set: any) => ({
						...set,
						notes: set.notes || ''
					}))
				})).filter((ex: any) => ex.exercise); // Filter out any invalid exercises
				
				if (selectedExercises.length === 0) {
					alert('No valid exercises found. Redirecting...');
					goto('/workout/new');
					return;
				}
				
				workoutStartTime = new Date();
				startDurationTimer();
			} catch (error) {
				console.error('Error loading workout:', error);
				goto('/workout/new');
			}
		} else {
			goto('/workout/new');
		}
	});

	// Cleanup duration interval on unmount
	$effect(() => {
		return () => {
			if (durationInterval) {
				clearInterval(durationInterval);
				durationInterval = null;
			}
		};
	});

	function startDurationTimer() {
		if (durationInterval) return;
		durationInterval = setInterval(() => {
			if (workoutStartTime) {
				workoutDuration = Math.floor((new Date().getTime() - workoutStartTime.getTime()) / 1000);
			}
		}, 1000);
	}

	function formatDuration(seconds: number): string {
		const hours = Math.floor(seconds / 3600);
		const mins = Math.floor((seconds % 3600) / 60);
		const secs = seconds % 60;
		if (hours > 0) {
			return `${hours}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
		}
		return `${mins}:${secs.toString().padStart(2, '0')}`;
	}

	function completeSet() {
		if (!currentSet) return;

		// Save set notes if any
		if (currentSetNotes) {
			updateSetValue('notes', currentSetNotes);
		}

		// Mark set as completed
		updateSetValue('completed', true);

		// Show rest timer if there's a next set (auto-start)
		const nextSetIndex = currentSetIndex + 1;
		if (nextSetIndex < selectedExercises[currentExerciseIndex].sets.length) {
			showRestTimer = true;
		} else {
			// Move to next exercise or finish
			moveToNextExercise();
		}
	}

	function moveToNextExercise() {
		showRestTimer = false;
		const nextSetIndex = currentSetIndex + 1;
		
		// If there are more sets in current exercise, move to next set
		if (nextSetIndex < selectedExercises[currentExerciseIndex].sets.length) {
			currentSetIndex = nextSetIndex;
			return;
		}

		// Move to next exercise
		const nextExerciseIndex = currentExerciseIndex + 1;
		if (nextExerciseIndex < selectedExercises.length) {
			currentExerciseIndex = nextExerciseIndex;
			currentSetIndex = 0;
		}
	}

	function skipRest() {
		showRestTimer = false;
		moveToNextExercise();
	}

	function updateSetValue(field: 'reps' | 'weight' | 'notes' | 'completed', value: number | string | boolean) {
		selectedExercises = selectedExercises.map((ex, exIdx) => {
			if (exIdx === currentExerciseIndex) {
				return {
					...ex,
					sets: ex.sets.map((set, setIdx) => {
						if (setIdx === currentSetIndex) {
							return { ...set, [field]: value };
						}
						return set;
					})
				};
			}
			return ex;
		});
	}

	async function finishWorkout() {
		if (isSaving) return;
		
		const confirmed = confirm('Finish and save this workout?');
		if (!confirmed) return;

		isSaving = true;
		try {
			const durationMinutes = Math.ceil(workoutDuration / 60);

			// Create workout
			const { data: workout, error: workoutError } = await supabase
				.from('workouts')
				.insert({
					name: workoutName || 'Workout',
					date: workoutStartTime?.toISOString() || new Date().toISOString(),
					duration_minutes: durationMinutes,
					notes: workoutNotes || null,
					energy_level: energyLevel,
					mood: mood || null
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
					completed: set.completed,
					notes: set.notes || null
				}))
			}));

			const { error: exercisesError } = await supabase
				.from('workout_exercises')
				.insert(workoutExercises);

			if (exercisesError) throw exercisesError;

			// Clear session storage
			sessionStorage.removeItem('activeWorkout');

			// Redirect to workout detail page
			goto(`/workout/${workout.id}`);
		} catch (error) {
			console.error('Error saving workout:', error);
			alert('Failed to save workout. Please try again.');
		} finally {
			isSaving = false;
		}
	}

	function handleRestComplete() {
		showRestTimer = false;
		moveToNextExercise();
	}
</script>

<svelte:head>
	<title>Active Workout - Fit Check</title>
</svelte:head>

<div class="min-h-screen bg-[var(--color-background)] pb-20">
	<!-- Header with Duration -->
	<div class="sticky top-0 z-20 bg-[var(--color-background)]/95 backdrop-blur-sm border-b border-[var(--color-border)]">
		<div class="max-w-md mx-auto px-4 py-3">
			<div class="flex items-center justify-between mb-2">
				<h1 class="text-lg font-bold text-[var(--color-foreground)]">
					{workoutName || 'Active Workout'}
				</h1>
				<button
					onclick={finishWorkout}
					disabled={isSaving}
					class="px-4 py-2 bg-[var(--gradient-primary)] text-white font-semibold rounded-lg disabled:opacity-50 text-sm"
				>
					{isSaving ? 'Saving...' : 'Finish'}
				</button>
			</div>
			<div class="flex items-center gap-2 text-sm text-[var(--color-muted)]">
				<Clock class="w-4 h-4" />
				<span>{formatDuration(workoutDuration)}</span>
				<span class="text-[var(--color-muted)]">•</span>
				<span>Exercise {currentExerciseIndex + 1} of {selectedExercises.length}</span>
			</div>
		</div>
	</div>

	<div class="max-w-md mx-auto px-4 py-6 space-y-6">
		{#if showRestTimer && currentSet}
			<!-- Rest Timer -->
			<RestTimer
				duration={currentSet.rest}
				onComplete={handleRestComplete}
				onSkip={skipRest}
				autoStart={true}
				soundEnabled={true}
				vibrationEnabled={true}
			/>
		{/if}

		{#if currentExercise}
			<!-- Current Exercise Card -->
			<div class="fitness-card">
				<div class="flex items-start justify-between mb-4">
					<div class="flex-1">
						<h2 class="text-2xl font-bold text-[var(--color-foreground)] mb-2">
							{currentExercise.name}
						</h2>
						<div class="flex flex-wrap gap-2 mb-3">
							{#each currentExercise.muscleGroups as mg}
								<span class="px-2 py-1 bg-[var(--color-primary)]/20 text-[var(--color-primary)] text-xs rounded-full">
									{mg}
								</span>
							{/each}
						</div>
						<div class="text-sm text-[var(--color-muted)]">
							{currentExercise.equipment}
						</div>
					</div>
					<button
						onclick={() => (showInstructions = !showInstructions)}
						class="p-2 text-[var(--color-muted)] hover:text-[var(--color-primary)] transition-colors"
						title="Show instructions"
					>
						<Info class="w-5 h-5" />
					</button>
				</div>

				{#if showInstructions && currentExercise.instructions}
					<div class="mb-4 p-3 bg-[var(--color-card-hover)] rounded-lg border border-[var(--color-border)]">
						<p class="text-sm text-[var(--color-foreground)] whitespace-pre-line">
							{currentExercise.instructions}
						</p>
					</div>
				{/if}

				<!-- Current Set -->
				{#if currentSet}
					<div class="space-y-4">
						<div class="text-center py-4">
							<div class="text-sm text-[var(--color-muted)] mb-1">Set {currentSetIndex + 1} of {selectedExercises[currentExerciseIndex].sets.length}</div>
							<div class="text-3xl font-bold text-[var(--color-primary)]">
								{currentSetIndex + 1}/{selectedExercises[currentExerciseIndex].sets.length}
							</div>
						</div>

						<!-- Reps Input -->
						<div>
							<label for="reps-input" class="block text-sm font-semibold text-[var(--color-muted)] mb-2">
								Reps
							</label>
							<input
								id="reps-input"
								type="number"
								value={currentSet.reps}
								oninput={(e) => updateSetValue('reps', parseInt(e.target.value) || 0)}
								class="w-full px-4 py-3 bg-[var(--color-card-hover)] border border-[var(--color-border)] rounded-lg text-[var(--color-foreground)] text-center text-2xl font-bold focus:outline-none focus:border-[var(--color-primary)]"
							/>
						</div>

						<!-- Weight Input -->
						<div>
							<label for="weight-input" class="block text-sm font-semibold text-[var(--color-muted)] mb-2">
								Weight (kg)
							</label>
							<div class="relative">
								<input
									id="weight-input"
									type="number"
									step="0.5"
									value={currentSet.weight}
									oninput={(e) => updateSetValue('weight', parseFloat(e.target.value) || 0)}
									class="w-full px-4 py-3 bg-[var(--color-card-hover)] border border-[var(--color-border)] rounded-lg text-[var(--color-foreground)] text-center text-2xl font-bold focus:outline-none focus:border-[var(--color-primary)]"
								/>
								<!-- Quick Weight Buttons -->
								<div class="absolute right-2 top-1/2 -translate-y-1/2 flex flex-col gap-1">
									<button
										onclick={() => updateSetValue('weight', currentSet.weight + 2.5)}
										class="w-8 h-6 text-xs bg-[var(--color-primary)]/20 text-[var(--color-primary)] rounded hover:bg-[var(--color-primary)]/30 transition-colors"
										title="+2.5kg"
									>
										+2.5
									</button>
									<button
										onclick={() => updateSetValue('weight', Math.max(0, currentSet.weight - 2.5))}
										class="w-8 h-6 text-xs bg-[var(--color-primary)]/20 text-[var(--color-primary)] rounded hover:bg-[var(--color-primary)]/30 transition-colors"
										title="-2.5kg"
									>
										-2.5
									</button>
								</div>
							</div>
							<!-- Quick Weight Buttons Row -->
							<div class="flex gap-2 mt-2">
								<button
									onclick={() => updateSetValue('weight', currentSet.weight + 5)}
									class="flex-1 py-2 text-xs bg-[var(--color-card-hover)] border border-[var(--color-border)] rounded-lg text-[var(--color-foreground)] hover:border-[var(--color-primary)] transition-colors"
								>
									+5kg
								</button>
								<button
									onclick={() => updateSetValue('weight', currentSet.weight + 10)}
									class="flex-1 py-2 text-xs bg-[var(--color-card-hover)] border border-[var(--color-border)] rounded-lg text-[var(--color-foreground)] hover:border-[var(--color-primary)] transition-colors"
								>
									+10kg
								</button>
								<button
									onclick={() => updateSetValue('weight', Math.max(0, currentSet.weight - 5))}
									class="flex-1 py-2 text-xs bg-[var(--color-card-hover)] border border-[var(--color-border)] rounded-lg text-[var(--color-foreground)] hover:border-[var(--color-primary)] transition-colors"
								>
									-5kg
								</button>
							</div>
						</div>

						<!-- Set Notes -->
						<div>
							<div class="flex items-center justify-between mb-2">
								<label for="set-notes" class="block text-sm font-semibold text-[var(--color-muted)]">
									Set Notes (Optional)
								</label>
								<button
									onclick={() => (showSetNotes = !showSetNotes)}
									class="p-1 text-[var(--color-muted)] hover:text-[var(--color-primary)] transition-colors"
									title={showSetNotes ? 'Hide notes' : 'Show notes'}
								>
									<Edit2 class="w-4 h-4" />
								</button>
							</div>
							{#if showSetNotes}
								<textarea
									id="set-notes"
									bind:value={currentSetNotes}
									onblur={() => updateSetValue('notes', currentSetNotes)}
									placeholder="Add notes about this set (form, difficulty, etc.)"
									rows="2"
									class="w-full px-3 py-2 bg-[var(--color-card-hover)] border border-[var(--color-border)] rounded-lg text-[var(--color-foreground)] text-sm focus:outline-none focus:border-[var(--color-primary)] resize-none"
								></textarea>
							{/if}
						</div>

						<!-- Complete Set Button -->
						<button
							onclick={completeSet}
							class="w-full py-4 bg-[var(--gradient-accent)] text-white font-bold text-lg rounded-lg hover:scale-[1.02] transition-transform flex items-center justify-center gap-2"
						>
							<Check class="w-6 h-6" />
							Complete Set
						</button>

						<!-- Quick Actions -->
						<div class="flex gap-2">
							{#if currentSetIndex > 0}
								<button
									onclick={() => {
										currentSetIndex = currentSetIndex - 1;
										showRestTimer = false;
									}}
									class="flex-1 py-2 text-sm text-[var(--color-muted)] hover:text-[var(--color-foreground)] border border-[var(--color-border)] rounded-lg"
								>
									Previous Set
								</button>
							{/if}
							{#if currentSetIndex < selectedExercises[currentExerciseIndex].sets.length - 1}
								<button
									onclick={() => {
										currentSetIndex = currentSetIndex + 1;
										showRestTimer = false;
									}}
									class="flex-1 py-2 text-sm text-[var(--color-muted)] hover:text-[var(--color-foreground)] border border-[var(--color-border)] rounded-lg"
								>
									Next Set
								</button>
							{/if}
						</div>
					</div>
				{/if}
			</div>

			<!-- Exercise Navigation -->
			<div class="flex gap-2">
				{#if currentExerciseIndex > 0}
					<button
						onclick={() => {
							currentExerciseIndex = currentExerciseIndex - 1;
							currentSetIndex = 0;
							showRestTimer = false;
						}}
						class="flex-1 py-3 text-sm font-semibold text-[var(--color-foreground)] bg-[var(--color-card)] border border-[var(--color-border)] rounded-lg hover:bg-[var(--color-card-hover)]"
					>
						← Previous Exercise
					</button>
				{/if}
				{#if currentExerciseIndex < selectedExercises.length - 1}
					<button
						onclick={() => {
							currentExerciseIndex = currentExerciseIndex + 1;
							currentSetIndex = 0;
							showRestTimer = false;
						}}
						class="flex-1 py-3 text-sm font-semibold text-[var(--color-foreground)] bg-[var(--color-card)] border border-[var(--color-border)] rounded-lg hover:bg-[var(--color-card-hover)]"
					>
						Next Exercise →
					</button>
				{/if}
			</div>
		{/if}

		{#if allSetsComplete}
			<!-- Workout Complete -->
			<div class="fitness-card text-center bg-[var(--color-accent)]/20 border-2 border-[var(--color-accent)]">
				<h3 class="text-xl font-bold text-[var(--color-accent)] mb-2">🎉 Workout Complete!</h3>
				<p class="text-sm text-[var(--color-muted)] mb-4">
					All sets completed. Great work!
				</p>
				<button
					onclick={finishWorkout}
					disabled={isSaving}
					class="w-full py-3 bg-[var(--gradient-accent)] text-white font-semibold rounded-lg disabled:opacity-50"
				>
					{isSaving ? 'Saving...' : 'Save & Finish'}
				</button>
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
</style>

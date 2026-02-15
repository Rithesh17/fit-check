<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { supabase } from '$lib/supabase/client';
	import { exercises, getExerciseById, type Exercise, type ExerciseType } from '$lib/data/exercises';
	import RestTimer from '$lib/components/RestTimer.svelte';
	import ExerciseDetail from '$lib/components/ExerciseDetail.svelte';
	import { Check, X, Play, Pause, SkipForward, Info, Clock, Edit2 } from 'lucide-svelte';

	type WorkoutExercise = 
		| { exercise: Exercise; exerciseType: 'weights' | 'bodyweight'; sets: Array<{ reps: number; weight: number; rest: number; completed: boolean; notes?: string }> }
		| { exercise: Exercise; exerciseType: 'cardio'; durationMinutes: number; calories: number; completed: boolean }
		| { exercise: Exercise; exerciseType: 'stretches'; durationSeconds: number; reps: number; completed: boolean };

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
	let restDurationBetweenExercises = $state(90); // Rest time between exercises (in seconds) - default 90 seconds
	let isRestBetweenExercises = $state(false); // Track if we're showing rest between exercises vs sets
	let showExerciseDetail = $state(false);
	let cardioTimerSeconds = $state(0);
	let cardioTimerInterval: ReturnType<typeof setInterval> | null = $state(null);
	let cardioTimerRunning = $state(false);
	
	// Custom exercises from database
	let customExercises = $state<Array<Exercise & { id: string; isCustom: boolean }>>([]);

	const currentExercise = $derived(
		selectedExercises[currentExerciseIndex]?.exercise || null
	);
	const currentExerciseData = $derived(
		selectedExercises[currentExerciseIndex] || null
	);
	const currentSet = $derived(
		(currentExerciseData?.exerciseType === 'weights' || currentExerciseData?.exerciseType === 'bodyweight')
			? currentExerciseData.sets[currentSetIndex] || null
			: null
	);
	const allSetsComplete = $derived(
		selectedExercises.every((ex) => {
			if (ex.exerciseType === 'weights' || ex.exerciseType === 'bodyweight') {
				return ex.sets.every((set) => set.completed);
			} else if (ex.exerciseType === 'cardio' || ex.exerciseType === 'stretches') {
				return ex.completed;
			}
			return false;
		})
	);

	// Get next exercise in circuit order
	const nextExerciseInCircuit = $derived.by(() => {
		if (!showRestTimer || !isRestBetweenExercises) return null;
		
		// Find next exercise with same set index that's not completed
		for (let exIdx = currentExerciseIndex + 1; exIdx < selectedExercises.length; exIdx++) {
			const ex = selectedExercises[exIdx];
			if ((ex.exerciseType === 'weights' || ex.exerciseType === 'bodyweight') && 
				currentSetIndex < ex.sets.length) {
				const set = ex.sets[currentSetIndex];
				if (!set.completed) {
					return {
						exercise: ex.exercise,
						exerciseData: ex,
						exerciseIndex: exIdx,
						setIndex: currentSetIndex,
						set: set
					};
				}
			}
		}
		
		// No more exercises with this set index, move to next set round
		const nextSetIndex = currentSetIndex + 1;
		for (let exIdx = 0; exIdx < selectedExercises.length; exIdx++) {
			const ex = selectedExercises[exIdx];
			if (ex.exerciseType === 'weights' || ex.exerciseType === 'bodyweight') {
				if (nextSetIndex < ex.sets.length) {
					const set = ex.sets[nextSetIndex];
					if (!set.completed) {
						return {
							exercise: ex.exercise,
							exerciseData: ex,
							exerciseIndex: exIdx,
							setIndex: nextSetIndex,
							set: set
						};
					}
				}
			}
		}
		
		return null;
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

	onMount(async () => {
		await loadCustomExercises();
		// Load workout data from sessionStorage (passed from workout creation)
		const savedWorkout = sessionStorage.getItem('activeWorkout');
		if (savedWorkout) {
			try {
				const data = JSON.parse(savedWorkout);
				workoutName = data.name || 'Workout';
				workoutNotes = data.notes || '';
				energyLevel = data.energyLevel || null;
				mood = data.mood || '';
				restDurationBetweenExercises = data.restDurationBetweenExercises || 90; // Default 90 seconds
				selectedExercises = data.exercises.map((ex: any): WorkoutExercise | null => {
					const exercise = getExerciseById(ex.exerciseId) || customExercises.find(ce => ce.id === ex.exerciseId);
					if (!exercise) return null;
					
					if (ex.exerciseType === 'cardio' || (exercise.exerciseType === 'cardio' && ex.durationMinutes !== undefined)) {
						const cardioEx: WorkoutExercise = {
							exercise,
							exerciseType: 'cardio',
							durationMinutes: ex.durationMinutes || exercise.defaultDurationMinutes || 30,
							calories: ex.calories || exercise.defaultCalories || 300,
							completed: ex.completed || false
						};
						return cardioEx;
					} else if (ex.exerciseType === 'stretches' || (exercise.exerciseType === 'stretches' && ex.durationSeconds !== undefined)) {
						const stretchesEx: WorkoutExercise = {
							exercise,
							exerciseType: 'stretches',
							durationSeconds: ex.durationSeconds || exercise.defaultDurationSeconds || 60,
							reps: ex.reps || exercise.defaultRepsStretches || 10,
							completed: ex.completed || false
						};
						return stretchesEx;
					} else {
						// Weights or bodyweight
						const sets = (ex.sets || []).map((set: any) => ({
							...set,
							notes: set.notes || ''
						}));
						const weightsEx: WorkoutExercise = {
							exercise,
							exerciseType: exercise.exerciseType === 'bodyweight' ? 'bodyweight' : 'weights',
							sets
						};
						return weightsEx;
					}
				}).filter((ex: WorkoutExercise | null): ex is WorkoutExercise => ex !== null && ex !== undefined && ex.exercise !== undefined); // Filter out any invalid exercises
				
				if (selectedExercises.length === 0) {
					alert('No valid exercises found. Redirecting...');
					goto('/workout/new');
					return;
				}
				
				// Initialize to first incomplete set in circuit order
				initializeCircuitPosition();
				
				workoutStartTime = new Date();
				startDurationTimer();
				
				// Start cardio timer if first exercise is cardio
				if (selectedExercises.length > 0 && selectedExercises[0]?.exerciseType === 'cardio') {
					startCardioTimer();
				}
			} catch (error) {
				console.error('Error loading workout:', error);
				goto('/workout/new');
			}
		} else {
			goto('/workout/new');
		}
	});

	// Start/stop cardio timer when exercise changes
	$effect(() => {
		const exerciseType = currentExerciseData?.exerciseType;
		if (exerciseType === 'cardio') {
			if (!cardioTimerRunning) {
				startCardioTimer();
			}
		} else {
			if (cardioTimerRunning) {
				stopCardioTimer();
			}
		}
	});

	// Cleanup intervals on unmount
	$effect(() => {
		return () => {
			if (durationInterval) {
				clearInterval(durationInterval);
				durationInterval = null;
			}
			if (cardioTimerInterval) {
				clearInterval(cardioTimerInterval);
				cardioTimerInterval = null;
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

	function formatTime(seconds: number): string {
		const mins = Math.floor(seconds / 60);
		const secs = seconds % 60;
		return `${mins}:${secs.toString().padStart(2, '0')}`;
	}

	/**
	 * Initialize circuit position to first incomplete set
	 */
	function initializeCircuitPosition() {
		// Find first incomplete set in circuit order (round by round)
		const maxSets = Math.max(...selectedExercises
			.filter(ex => ex.exerciseType === 'weights' || ex.exerciseType === 'bodyweight')
			.map(ex => ex.sets.length), 0);
		
		for (let setIdx = 0; setIdx < maxSets; setIdx++) {
			for (let exIdx = 0; exIdx < selectedExercises.length; exIdx++) {
				const ex = selectedExercises[exIdx];
				if (ex.exerciseType === 'weights' || ex.exerciseType === 'bodyweight') {
					if (setIdx < ex.sets.length) {
						const set = ex.sets[setIdx];
						if (!set.completed) {
							currentExerciseIndex = exIdx;
							currentSetIndex = setIdx;
							return;
						}
					}
				} else if (ex.exerciseType === 'cardio' || ex.exerciseType === 'stretches') {
					// For cardio/stretches, check if not completed
					if (!ex.completed && setIdx === 0) {
						currentExerciseIndex = exIdx;
						currentSetIndex = 0;
						return;
					}
				}
			}
		}
		
		// All sets completed, start at first exercise
		currentExerciseIndex = 0;
		currentSetIndex = 0;
	}

	function startCardioTimer() {
		// Clear any existing timer
		if (cardioTimerInterval) {
			clearInterval(cardioTimerInterval);
			cardioTimerInterval = null;
		}
		// Reset and start timer
		cardioTimerSeconds = 0;
		cardioTimerRunning = true;
		cardioTimerInterval = setInterval(() => {
			cardioTimerSeconds = cardioTimerSeconds + 1;
		}, 1000);
	}

	function stopCardioTimer() {
		if (cardioTimerInterval) {
			clearInterval(cardioTimerInterval);
			cardioTimerInterval = null;
		}
		cardioTimerRunning = false;
	}

	function completeSet() {
		const currentEx = currentExerciseData;
		if (!currentEx) return;

		if (currentEx.exerciseType === 'weights' || currentEx.exerciseType === 'bodyweight') {
			if (!currentSet) return;

			// Save set notes if any
			if (currentSetNotes) {
				updateSetValue('notes', currentSetNotes);
			}

			// Mark set as completed
			updateSetValue('completed', true);

			// Circuit-style: Move to same set index of next exercise, or next set round
			moveToNextInCircuit();
		} else {
			// Cardio or stretches - mark as completed and move to next
			selectedExercises = selectedExercises.map((ex, idx) => {
				if (idx === currentExerciseIndex) {
					return { ...ex, completed: true };
				}
				return ex;
			});
			moveToNextExercise();
		}
	}

	/**
	 * Circuit-style progression: Move to same set index of next exercise, or next set round
	 */
	function moveToNextInCircuit() {
		showRestTimer = false;
		isRestBetweenExercises = false;
		
		// Find next exercise with same set index that's not completed
		for (let exIdx = currentExerciseIndex + 1; exIdx < selectedExercises.length; exIdx++) {
			const ex = selectedExercises[exIdx];
			// Check if exercise has weights/bodyweight with same set index available
			if ((ex.exerciseType === 'weights' || ex.exerciseType === 'bodyweight') && 
				currentSetIndex < ex.sets.length) {
				const set = ex.sets[currentSetIndex];
				if (!set.completed) {
					// Show rest timer between exercises
					if (restDurationBetweenExercises > 0) {
						showRestTimer = true;
						isRestBetweenExercises = true;
					} else {
						// No rest, move directly
						currentExerciseIndex = exIdx;
						// Keep same set index
					}
					return;
				}
			}
		}
		
		// No more exercises with this set index, move to next set round (set index + 1)
		const nextSetIndex = currentSetIndex + 1;
		
		// Find first exercise with next set index that's not completed
		for (let exIdx = 0; exIdx < selectedExercises.length; exIdx++) {
			const ex = selectedExercises[exIdx];
			if (ex.exerciseType === 'weights' || ex.exerciseType === 'bodyweight') {
				if (nextSetIndex < ex.sets.length) {
					const set = ex.sets[nextSetIndex];
					if (!set.completed) {
						// Show rest timer between exercises
						if (restDurationBetweenExercises > 0) {
							showRestTimer = true;
							isRestBetweenExercises = true;
						} else {
							// No rest, move directly
							currentExerciseIndex = exIdx;
							currentSetIndex = nextSetIndex;
						}
						return;
					}
				}
			}
		}
		
		// All sets completed, finish workout
		finishWorkout(true);
	}

	function moveToNextExercise() {
		showRestTimer = false;
		isRestBetweenExercises = false;
		const currentEx = currentExerciseData;
		
		if (currentEx && (currentEx.exerciseType === 'weights' || currentEx.exerciseType === 'bodyweight')) {
			// Check if all sets in current exercise are completed
			const allSetsCompleted = currentEx.sets.every(set => set.completed);
			
			// Only move to next exercise if all sets are completed
			if (!allSetsCompleted) {
				// Find the first incomplete set and move to it
				const incompleteSetIndex = currentEx.sets.findIndex(set => !set.completed);
				if (incompleteSetIndex !== -1) {
					currentSetIndex = incompleteSetIndex;
					return;
				}
			}
		}

		// Move to next exercise
		const nextExerciseIndex = currentExerciseIndex + 1;
		if (nextExerciseIndex < selectedExercises.length) {
			// Show rest timer between exercises
			if (restDurationBetweenExercises > 0) {
				showRestTimer = true;
				isRestBetweenExercises = true;
			} else {
				// No rest, move directly
				currentExerciseIndex = nextExerciseIndex;
				currentSetIndex = 0;
				// Start cardio timer if next exercise is cardio
				if (selectedExercises[nextExerciseIndex]?.exerciseType === 'cardio') {
					startCardioTimer();
				}
			}
		} else {
			// This is the last exercise, finish the workout
			finishWorkout(true); // Skip confirmation when auto-finishing
		}
	}

	function skipRest() {
		showRestTimer = false;
		
		// Check if we're skipping rest between exercises (circuit mode)
		if (isRestBetweenExercises) {
			isRestBetweenExercises = false;
			// Move to next exercise with same set index, or next set round
			for (let exIdx = currentExerciseIndex + 1; exIdx < selectedExercises.length; exIdx++) {
				const ex = selectedExercises[exIdx];
				if ((ex.exerciseType === 'weights' || ex.exerciseType === 'bodyweight') && 
					currentSetIndex < ex.sets.length) {
					const set = ex.sets[currentSetIndex];
					if (!set.completed) {
						currentExerciseIndex = exIdx;
						// Keep same set index
						return;
					}
				}
			}
			
			// No more exercises with this set index, move to next set round
			const nextSetIndex = currentSetIndex + 1;
			for (let exIdx = 0; exIdx < selectedExercises.length; exIdx++) {
				const ex = selectedExercises[exIdx];
				if (ex.exerciseType === 'weights' || ex.exerciseType === 'bodyweight') {
					if (nextSetIndex < ex.sets.length) {
						const set = ex.sets[nextSetIndex];
						if (!set.completed) {
							currentExerciseIndex = exIdx;
							currentSetIndex = nextSetIndex;
							// Start cardio timer if needed (though unlikely in circuit mode)
							if (ex.exerciseType === 'cardio') {
								startCardioTimer();
							}
							return;
						}
					}
				}
			}
			
			// All sets completed
			finishWorkout(true);
			return;
		}
		
		// Legacy: skipping rest between sets (shouldn't happen in circuit mode)
		const currentEx = currentExerciseData;
		if (currentEx && (currentEx.exerciseType === 'weights' || currentEx.exerciseType === 'bodyweight')) {
			const nextSetIndex = currentSetIndex + 1;
			if (nextSetIndex < currentEx.sets.length) {
				currentSetIndex = nextSetIndex;
				return;
			}
		}
		
		// No more sets, move to next exercise
		const nextExerciseIndex = currentExerciseIndex + 1;
		if (nextExerciseIndex < selectedExercises.length) {
			currentExerciseIndex = nextExerciseIndex;
			currentSetIndex = 0;
			if (selectedExercises[nextExerciseIndex]?.exerciseType === 'cardio') {
				startCardioTimer();
			}
		} else {
			finishWorkout(true);
		}
	}

	function updateSetValue(field: 'reps' | 'weight' | 'notes' | 'completed', value: number | string | boolean) {
		selectedExercises = selectedExercises.map((ex, exIdx) => {
			if (exIdx === currentExerciseIndex && (ex.exerciseType === 'weights' || ex.exerciseType === 'bodyweight')) {
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

	function updateCardioValue(field: 'durationMinutes' | 'calories', value: number) {
		selectedExercises = selectedExercises.map((ex, exIdx) => {
			if (exIdx === currentExerciseIndex && ex.exerciseType === 'cardio') {
				return { ...ex, [field]: value };
			}
			return ex;
		});
	}

	function updateStretchesValue(field: 'durationSeconds' | 'reps', value: number) {
		selectedExercises = selectedExercises.map((ex, exIdx) => {
			if (exIdx === currentExerciseIndex && ex.exerciseType === 'stretches') {
				return { ...ex, [field]: value };
			}
			return ex;
		});
	}

	async function finishWorkout(skipConfirmation = false) {
		if (isSaving) return;
		
		// If called automatically (not from button click), skip confirmation
		if (!skipConfirmation) {
			const confirmed = confirm('Finish and save this workout?');
			if (!confirmed) return;
		}

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
				} as any)
				.select()
				.single();

			if (workoutError) throw workoutError;
			if (!workout || !('id' in workout)) throw new Error('Failed to create workout');

			// Create workout exercises
			const createdWorkoutId = (workout as { id: string }).id;
			const workoutExercises = selectedExercises.map((ex, index) => {
				const base = {
					workout_id: createdWorkoutId,
					exercise_id: ex.exercise.id,
					exercise_order: index
				};

				if (ex.exerciseType === 'weights' || ex.exerciseType === 'bodyweight') {
					return {
						...base,
						sets: ex.sets.map((set) => ({
							reps: set.reps,
							weight: set.weight,
							rest: set.rest,
							completed: set.completed,
							notes: set.notes || null
						}))
					};
				} else if (ex.exerciseType === 'cardio') {
					return {
						...base,
						sets: {
							type: 'cardio',
							durationMinutes: ex.durationMinutes,
							calories: ex.calories,
							completed: ex.completed
						}
					};
				} else if (ex.exerciseType === 'stretches') {
					return {
						...base,
						sets: {
							type: 'stretches',
							durationSeconds: ex.durationSeconds,
							reps: ex.reps,
							completed: ex.completed
						}
					};
				}
				return base;
			});

			const { error: exercisesError } = await supabase
				.from('workout_exercises')
				.insert(workoutExercises as any);

			if (exercisesError) throw exercisesError;

			// Clear session storage
			sessionStorage.removeItem('activeWorkout');

			// Redirect to workout detail page
			goto(`/workout/${createdWorkoutId}`);
		} catch (error) {
			console.error('Error saving workout:', error);
			alert('Failed to save workout. Please try again.');
		} finally {
			isSaving = false;
		}
	}

	function handleSetRestComplete() {
		showRestTimer = false;
		// Note: This is for rest between sets (legacy - shouldn't happen in circuit mode)
		// In circuit mode, we use handleRestComplete for rest between exercises
		const currentEx = currentExerciseData;
		if (currentEx && (currentEx.exerciseType === 'weights' || currentEx.exerciseType === 'bodyweight')) {
			const nextSetIndex = currentSetIndex + 1;
			if (nextSetIndex < currentEx.sets.length) {
				currentSetIndex = nextSetIndex;
				return;
			}
		}
		handleRestComplete();
	}

	function handleRestComplete() {
		showRestTimer = false;
		const wasRestBetweenExercises = isRestBetweenExercises;
		isRestBetweenExercises = false;
		
		// Circuit-style progression: Move to same set index of next exercise, or next set round
		if (wasRestBetweenExercises) {
			// Rest between exercises in circuit mode - move to next exercise with same set index
			for (let exIdx = currentExerciseIndex + 1; exIdx < selectedExercises.length; exIdx++) {
				const ex = selectedExercises[exIdx];
				if ((ex.exerciseType === 'weights' || ex.exerciseType === 'bodyweight') && 
					currentSetIndex < ex.sets.length) {
					const set = ex.sets[currentSetIndex];
					if (!set.completed) {
						currentExerciseIndex = exIdx;
						// Keep same set index (same round)
						// Start cardio timer if needed (though unlikely in circuit mode)
						if (ex.exerciseType === 'cardio') {
							startCardioTimer();
						}
						return;
					}
				}
			}
			
			// No more exercises with this set index, move to next set round
			const nextSetIndex = currentSetIndex + 1;
			for (let exIdx = 0; exIdx < selectedExercises.length; exIdx++) {
				const ex = selectedExercises[exIdx];
				if (ex.exerciseType === 'weights' || ex.exerciseType === 'bodyweight') {
					if (nextSetIndex < ex.sets.length) {
						const set = ex.sets[nextSetIndex];
						if (!set.completed) {
							currentExerciseIndex = exIdx;
							currentSetIndex = nextSetIndex;
							// Start cardio timer if needed
							if (ex.exerciseType === 'cardio') {
								startCardioTimer();
							}
							return;
						}
					}
				}
			}
			
			// All sets completed
			finishWorkout(true);
		} else {
			// Legacy mode: Move to next exercise (not circuit mode)
			const nextExerciseIndex = currentExerciseIndex + 1;
			if (nextExerciseIndex < selectedExercises.length) {
				currentExerciseIndex = nextExerciseIndex;
				currentSetIndex = 0;
				// Start cardio timer if next exercise is cardio
				if (selectedExercises[nextExerciseIndex]?.exerciseType === 'cardio') {
					startCardioTimer();
				}
			} else {
				// This is the last exercise, finish the workout
				finishWorkout();
			}
		}
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
					onclick={() => finishWorkout()}
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
		{#if showRestTimer && isRestBetweenExercises}
			<!-- Rest Timer Between Exercises -->
			<RestTimer
				duration={restDurationBetweenExercises}
				onComplete={handleRestComplete}
				onSkip={skipRest}
				autoStart={true}
				soundEnabled={true}
				vibrationEnabled={true}
			/>
			
			<!-- Up Next Section -->
			{#if nextExerciseInCircuit}
				<div class="fitness-card border-2 border-[var(--color-primary)]/50 bg-[var(--color-primary)]/5">
					<h3 class="text-sm font-semibold text-[var(--color-muted)] mb-3 uppercase tracking-wide">
						Up Next
					</h3>
					<div class="space-y-3">
						<!-- Exercise Name -->
						<div>
							<h4 class="text-xl font-bold text-[var(--color-foreground)] mb-2">
								{nextExerciseInCircuit.exercise.name}
							</h4>
							{#if nextExerciseInCircuit.exercise.muscleGroups && nextExerciseInCircuit.exercise.muscleGroups.length > 0}
								<div class="flex flex-wrap gap-2 mb-2">
									{#each nextExerciseInCircuit.exercise.muscleGroups as mg}
										<span class="px-2 py-1 bg-[var(--color-primary)]/20 text-[var(--color-primary)] text-xs rounded-full">
											{mg}
										</span>
									{/each}
								</div>
							{/if}
							<div class="text-sm text-[var(--color-muted)]">
								{nextExerciseInCircuit.exerciseData.exerciseType ? nextExerciseInCircuit.exerciseData.exerciseType.charAt(0).toUpperCase() + nextExerciseInCircuit.exerciseData.exerciseType.slice(1) : ''} • {nextExerciseInCircuit.exercise.equipment}
							</div>
						</div>
						
						<!-- Set Information -->
						{#if nextExerciseInCircuit.set}
							<div class="pt-3 border-t border-[var(--color-border)] space-y-2">
								<div class="flex items-center justify-between">
									<span class="text-sm font-semibold text-[var(--color-muted)]">Round</span>
									<span class="text-lg font-bold text-[var(--color-primary)]">
										{nextExerciseInCircuit.setIndex + 1}
									</span>
								</div>
								<div class="flex items-center justify-between">
									<span class="text-sm font-semibold text-[var(--color-muted)]">Set</span>
									<span class="text-lg font-bold text-[var(--color-foreground)]">
										{nextExerciseInCircuit.setIndex + 1} of {nextExerciseInCircuit.exerciseData.sets.length}
									</span>
								</div>
								<div class="flex items-center justify-between">
									<span class="text-sm font-semibold text-[var(--color-muted)]">Reps</span>
									<span class="text-lg font-bold text-[var(--color-foreground)]">
										{nextExerciseInCircuit.set.reps}
									</span>
								</div>
								<div class="flex items-center justify-between">
									<span class="text-sm font-semibold text-[var(--color-muted)]">Weight</span>
									<span class="text-lg font-bold text-[var(--color-foreground)]">
										{nextExerciseInCircuit.set.weight || 0} kg
									</span>
								</div>
								{#if nextExerciseInCircuit.set.notes}
									<div class="pt-2 border-t border-[var(--color-border)]">
										<p class="text-xs text-[var(--color-muted)] italic">
											{nextExerciseInCircuit.set.notes}
										</p>
									</div>
								{/if}
							</div>
						{/if}
					</div>
				</div>
			{/if}
		{:else if showRestTimer && currentSet}
			<!-- Rest Timer Between Sets -->
			<RestTimer
				duration={currentSet.rest}
				onComplete={handleSetRestComplete}
				onSkip={skipRest}
				autoStart={true}
				soundEnabled={true}
				vibrationEnabled={true}
			/>
		{/if}

		{#if currentExercise && !(showRestTimer && isRestBetweenExercises)}
			<!-- Current Exercise Card -->
			<div class="fitness-card">
				<div class="flex items-start justify-between mb-4">
					<div class="flex-1">
						<h2 class="text-2xl font-bold text-[var(--color-foreground)] mb-2">
							{currentExercise.name}
						</h2>
						{#if (currentExerciseData?.exerciseType === 'weights' || currentExerciseData?.exerciseType === 'bodyweight') && currentExercise.muscleGroups.length > 0}
							<div class="flex flex-wrap gap-2 mb-3">
								{#each currentExercise.muscleGroups as mg}
									<span class="px-2 py-1 bg-[var(--color-primary)]/20 text-[var(--color-primary)] text-xs rounded-full">
										{mg}
									</span>
								{/each}
							</div>
						{/if}
						<div class="text-sm text-[var(--color-muted)]">
							{currentExerciseData?.exerciseType ? currentExerciseData.exerciseType.charAt(0).toUpperCase() + currentExerciseData.exerciseType.slice(1) : ''} • {currentExercise.equipment}
						</div>
					</div>
					<button
						onclick={() => (showExerciseDetail = true)}
						class="p-2 text-[var(--color-muted)] hover:text-[var(--color-primary)] transition-colors"
						title="View exercise details"
					>
						<Info class="w-5 h-5" />
					</button>
				</div>

				<!-- Current Set - Weights/Bodyweight -->
				{#if currentSet && (currentExerciseData?.exerciseType === 'weights' || currentExerciseData?.exerciseType === 'bodyweight')}
					<div class="space-y-4">
						<div class="text-center py-4">
							<div class="text-sm text-[var(--color-muted)] mb-1">
								Round {currentSetIndex + 1} • Set {currentSetIndex + 1} of {currentExerciseData.sets.length}
							</div>
							<div class="text-3xl font-bold text-[var(--color-primary)]">
								Round {currentSetIndex + 1}
							</div>
							<div class="text-sm text-[var(--color-muted)] mt-1">
								Exercise {currentExerciseIndex + 1} of {selectedExercises.length}
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
								oninput={(e) => updateSetValue('reps', parseInt((e.target as HTMLInputElement).value) || 0)}
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
									oninput={(e) => updateSetValue('weight', parseFloat((e.target as HTMLInputElement).value) || 0)}
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
							{#if currentSetIndex < currentExerciseData.sets.length - 1}
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
				{:else if currentExerciseData?.exerciseType === 'cardio'}
					<!-- Cardio Exercise -->
					<div class="space-y-4">
						<div class="text-center py-4">
							<div class="text-sm text-[var(--color-muted)] mb-1">Cardio Exercise</div>
							<div class="text-5xl font-bold text-[var(--color-primary)] mb-2">
								{formatTime(cardioTimerSeconds)}
							</div>
							<div class="text-sm text-[var(--color-muted)]">
								{currentExerciseData.completed ? '✓ Completed' : 'In Progress'}
							</div>
						</div>

						<!-- Duration Input -->
						<div>
							<label for="cardio-duration" class="block text-sm font-semibold text-[var(--color-muted)] mb-2">
								Duration (minutes)
							</label>
							<input
								id="cardio-duration"
								type="number"
								value={currentExerciseData.durationMinutes}
								oninput={(e) => updateCardioValue('durationMinutes', parseInt((e.target as HTMLInputElement).value) || 0)}
								class="w-full px-4 py-3 bg-[var(--color-card-hover)] border border-[var(--color-border)] rounded-lg text-[var(--color-foreground)] text-center text-2xl font-bold focus:outline-none focus:border-[var(--color-primary)]"
							/>
						</div>

						<!-- Calories Input -->
						<div>
							<label for="cardio-calories" class="block text-sm font-semibold text-[var(--color-muted)] mb-2">
								Calories
							</label>
							<input
								id="cardio-calories"
								type="number"
								value={currentExerciseData.calories}
								oninput={(e) => updateCardioValue('calories', parseInt((e.target as HTMLInputElement).value) || 0)}
								class="w-full px-4 py-3 bg-[var(--color-card-hover)] border border-[var(--color-border)] rounded-lg text-[var(--color-foreground)] text-center text-2xl font-bold focus:outline-none focus:border-[var(--color-primary)]"
							/>
						</div>

						<!-- Complete Button -->
						<button
							onclick={completeSet}
							class="w-full py-4 bg-[var(--gradient-accent)] text-white font-bold text-lg rounded-lg hover:scale-[1.02] transition-transform flex items-center justify-center gap-2"
						>
							<Check class="w-6 h-6" />
							{currentExerciseData.completed ? 'Mark as Incomplete' : 'Complete Exercise'}
						</button>
					</div>
				{:else if currentExerciseData?.exerciseType === 'stretches'}
					<!-- Stretches Exercise -->
					<div class="space-y-4">
						<div class="text-center py-4">
							<div class="text-sm text-[var(--color-muted)] mb-1">Stretch Exercise</div>
							<div class="text-3xl font-bold text-[var(--color-primary)]">
								{currentExerciseData.completed ? '✓ Completed' : 'In Progress'}
							</div>
						</div>

						<!-- Duration Input -->
						<div>
							<label for="stretches-duration" class="block text-sm font-semibold text-[var(--color-muted)] mb-2">
								Duration (seconds)
							</label>
							<input
								id="stretches-duration"
								type="number"
								value={currentExerciseData.durationSeconds}
								oninput={(e) => updateStretchesValue('durationSeconds', parseInt((e.target as HTMLInputElement).value) || 0)}
								class="w-full px-4 py-3 bg-[var(--color-card-hover)] border border-[var(--color-border)] rounded-lg text-[var(--color-foreground)] text-center text-2xl font-bold focus:outline-none focus:border-[var(--color-primary)]"
							/>
						</div>

						<!-- Reps Input -->
						<div>
							<label for="stretches-reps" class="block text-sm font-semibold text-[var(--color-muted)] mb-2">
								Reps
							</label>
							<input
								id="stretches-reps"
								type="number"
								value={currentExerciseData.reps}
								oninput={(e) => updateStretchesValue('reps', parseInt((e.target as HTMLInputElement).value) || 0)}
								class="w-full px-4 py-3 bg-[var(--color-card-hover)] border border-[var(--color-border)] rounded-lg text-[var(--color-foreground)] text-center text-2xl font-bold focus:outline-none focus:border-[var(--color-primary)]"
							/>
						</div>

						<!-- Complete Button -->
						<button
							onclick={completeSet}
							class="w-full py-4 bg-[var(--gradient-accent)] text-white font-bold text-lg rounded-lg hover:scale-[1.02] transition-transform flex items-center justify-center gap-2"
						>
							<Check class="w-6 h-6" />
							{currentExerciseData.completed ? 'Mark as Incomplete' : 'Complete Exercise'}
						</button>
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
					onclick={() => finishWorkout()}
					disabled={isSaving}
					class="w-full py-3 bg-[var(--gradient-accent)] text-white font-semibold rounded-lg disabled:opacity-50"
				>
					{isSaving ? 'Saving...' : 'Save & Finish'}
				</button>
			</div>
		{/if}
	</div>
</div>

<!-- Exercise Detail Modal -->
{#if showExerciseDetail}
	<ExerciseDetail
		exercise={currentExercise}
		onClose={() => (showExerciseDetail = false)}
		onEdit={(exercise) => {
			showExerciseDetail = false;
			// Could open editor here if needed
		}}
	/>
{/if}

<style>
	.fitness-card {
		background: var(--color-card);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-lg);
		padding: 1.5rem;
		transition: all var(--transition-normal);
	}
</style>

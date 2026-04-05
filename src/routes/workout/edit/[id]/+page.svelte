<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { loadTemplateById, updateTemplate } from '$lib/services/templates';
	import { toast } from '$lib/stores/toast';
	import { exercises, isTimeBased, type Exercise } from '$lib/data/exercises';
	import { getRecentExercises } from '$lib/utils/recent-exercises';
	import ExerciseDetail from '$lib/components/ExerciseDetail.svelte';
	import { Search, Plus, X, Check, Activity, Timer, Clock, Info, ChevronUp, ChevronDown } from 'lucide-svelte';
	import { unitPreference } from '$lib/stores/unit-preference';
	import { loadCustomExercises, findExercise, type CustomExercise } from '$lib/services/exercises';
	import type { WorkoutExercise } from '$lib/types/workout';
	import { convertWeight, getWeightUnitLabel, lbsToKg } from '$lib/utils/weight-conversion';

	const templateId = $derived($page.params.id);

	let workoutName = $state('');
	let selectedExercises = $state<WorkoutExercise[]>([]);
	let searchQuery = $state('');
	let showExerciseSearch = $state(false);
	let isLoading = $state(false);
	let isInitializing = $state(true);
	let searchInputElement: HTMLInputElement | null = $state(null);
	let recentExercises = $state<Array<{ exerciseId: string; exerciseName: string; lastUsed: Date; useCount: number }>>([]);
	let showRecentExercises = $state(false);
	let selectedExerciseDetail = $state<Exercise | null>(null);
	let customExercises = $state<CustomExercise[]>([]);

	const currentUnit = $derived($unitPreference);
	const allExercises = $derived([...exercises, ...customExercises]);

	$effect(() => {
		if (showExerciseSearch && searchInputElement) {
			setTimeout(() => searchInputElement?.focus(), 100);
		}
	});

	let filteredExercises = $derived(
		searchQuery
			? allExercises.filter(
					(ex) =>
						ex.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
						ex.muscleGroups.some((mg) => mg.toLowerCase().includes(searchQuery.toLowerCase())) ||
						ex.equipment.toLowerCase().includes(searchQuery.toLowerCase())
				)
			: allExercises.slice(0, 20)
	);

	onMount(async () => {
		customExercises = await loadCustomExercises();
		recentExercises = await getRecentExercises(8);

		const result = await loadTemplateById(templateId);
		if (!result) {
			toast.error('Template not found');
			goto('/workouts');
			return;
		}

		workoutName = result.template.name || '';

		// Reconstruct WorkoutExercise[] from stored template exercises
		selectedExercises = result.exercises
			.map((ex) => {
				const exercise = findExercise(ex.exercise_id, customExercises);
				if (!exercise) return null;

				if (exercise.exerciseType === 'weights' || exercise.exerciseType === 'bodyweight') {
					const timeBased = isTimeBased(exercise);
					let sets;
					const defaultSet = {
						reps: timeBased ? 0 : (exercise.defaultReps || 10),
						weight: 0,
						rest: exercise.defaultRestSeconds || 60,
						...(timeBased ? { durationSeconds: exercise.defaultDurationSeconds || 45 } : {})
					};
					if (Array.isArray(ex.sets)) {
						sets = ((ex.sets as any[]).length ? (ex.sets as any[]) : [defaultSet]).map(
							(s: any) => ({
								...s,
								completed: false,
								...(timeBased && s.durationSeconds == null
									? { durationSeconds: exercise.defaultDurationSeconds || 45 }
									: {})
							})
						);
					} else {
						sets = [{ ...defaultSet, completed: false }];
					}
					return { exercise, exerciseType: exercise.exerciseType, sets };
				} else if (exercise.exerciseType === 'cardio') {
					const rawSets = ex.sets as any;
					return {
						exercise,
						exerciseType: 'cardio' as const,
						durationMinutes: rawSets?.durationMinutes || exercise.defaultDurationMinutes || 30,
						calories: rawSets?.calories || exercise.defaultCalories || 300,
						completed: false
					};
				} else if (exercise.exerciseType === 'stretches') {
					const rawSets = ex.sets as any;
					return {
						exercise,
						exerciseType: 'stretches' as const,
						durationSeconds: rawSets?.durationSeconds || exercise.defaultDurationSeconds || 60,
						reps: rawSets?.reps || exercise.defaultRepsStretches || 10,
						completed: false
					};
				}
				return null;
			})
			.filter((e): e is WorkoutExercise => e !== null);

		isInitializing = false;
	});

	function addExercise(exercise: Exercise) {
		if (selectedExercises.some((e) => e.exercise.id === exercise.id)) return;

		if (exercise.exerciseType === 'weights' || exercise.exerciseType === 'bodyweight') {
			const timeBased = isTimeBased(exercise);
			const sets = Array.from({ length: exercise.defaultSets || 3 }, () => ({
				reps: timeBased ? 0 : (exercise.defaultReps || 10),
				weight: 0,
				rest: exercise.defaultRestSeconds || 60,
				completed: false,
				...(timeBased ? { durationSeconds: exercise.defaultDurationSeconds || 45 } : {})
			}));
			selectedExercises = [...selectedExercises, { exercise, exerciseType: exercise.exerciseType, sets }];
		} else if (exercise.exerciseType === 'cardio') {
			selectedExercises = [
				...selectedExercises,
				{
					exercise,
					exerciseType: 'cardio',
					durationMinutes: exercise.defaultDurationMinutes || 30,
					calories: exercise.defaultCalories || 300,
					completed: false
				}
			];
		} else if (exercise.exerciseType === 'stretches') {
			selectedExercises = [
				...selectedExercises,
				{
					exercise,
					exerciseType: 'stretches',
					durationSeconds: exercise.defaultDurationSeconds || 60,
					reps: exercise.defaultRepsStretches || 10,
					completed: false
				}
			];
		}

		showExerciseSearch = false;
		searchQuery = '';
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

	function updateSet(
		exerciseIndex: number,
		setIndex: number,
		field: 'reps' | 'weight' | 'rest' | 'durationSeconds',
		value: number
	) {
		selectedExercises = selectedExercises.map((ex, exIdx) => {
			if (exIdx === exerciseIndex && (ex.exerciseType === 'weights' || ex.exerciseType === 'bodyweight')) {
				return {
					...ex,
					sets: ex.sets.map((set, setIdx) => {
						if (setIdx === setIndex) return { ...set, [field]: value };
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
			if (
				exIdx === exerciseIndex &&
				(ex.exerciseType === 'weights' || ex.exerciseType === 'bodyweight') &&
				ex.sets.length > 1
			) {
				return { ...ex, sets: ex.sets.filter((_, idx) => idx !== setIndex) };
			}
			return ex;
		});
	}

	function addSet(exerciseIndex: number) {
		const ex = selectedExercises[exerciseIndex];
		if (ex.exerciseType !== 'weights' && ex.exerciseType !== 'bodyweight') return;
		const lastSet = ex.sets[ex.sets.length - 1];
		const timeBased = isTimeBased(ex.exercise);
		selectedExercises = selectedExercises.map((exercise, idx) => {
			if (idx === exerciseIndex && (exercise.exerciseType === 'weights' || exercise.exerciseType === 'bodyweight')) {
				return {
					...exercise,
					sets: [
						...exercise.sets,
						{
							reps: timeBased ? 0 : (lastSet?.reps || exercise.exercise.defaultReps || 10),
							weight: lastSet?.weight || 0,
							rest: exercise.exercise.defaultRestSeconds || 60,
							completed: false,
							...(timeBased
								? { durationSeconds: lastSet?.durationSeconds || exercise.exercise.defaultDurationSeconds || 45 }
								: {})
						}
					]
				};
			}
			return exercise;
		});
	}

	async function saveWorkout() {
		if (selectedExercises.length === 0) {
			toast.error('Please add at least one exercise');
			return;
		}

		isLoading = true;
		try {
			const templateExercises = selectedExercises.map((ex, index) => {
				const base = { exercise_id: ex.exercise.id, exercise_order: index };
				if (ex.exerciseType === 'weights' || ex.exerciseType === 'bodyweight') {
					return {
						...base,
						sets: ex.sets.map((set) => ({
						reps: set.reps,
						weight: set.weight,
						rest: set.rest,
						...(set.durationSeconds != null ? { durationSeconds: set.durationSeconds } : {})
					}))
					};
				} else if (ex.exerciseType === 'cardio') {
					return {
						...base,
						sets: { type: 'cardio', durationMinutes: ex.durationMinutes, calories: ex.calories }
					};
				} else {
					return {
						...base,
						sets: { type: 'stretches', durationSeconds: ex.durationSeconds, reps: ex.reps }
					};
				}
			});

			await updateTemplate(templateId, workoutName || 'Workout', templateExercises);
			toast.success('Template updated');
			goto('/workouts');
		} catch (error) {
			console.error('Error updating template:', error);
			toast.error('Failed to update workout. Please try again.');
		} finally {
			isLoading = false;
		}
	}
</script>

<svelte:head>
	<title>Edit Workout - Fit Check</title>
</svelte:head>

<div class="min-h-screen bg-[var(--color-background)] pb-20">
	<!-- Header -->
	<div class="sticky top-0 z-20 bg-[var(--color-background)]/95 backdrop-blur-sm border-b border-[var(--color-border)]">
		<div class="max-w-md mx-auto px-4 py-4">
			<div class="flex items-center justify-between gap-2">
				<a href="/workouts" class="text-[var(--color-muted)] hover:text-[var(--color-foreground)] flex-shrink-0">
					<X class="w-6 h-6" />
				</a>
				<h1 class="text-xl font-bold text-[var(--color-foreground)] flex-1 text-center">Edit Workout</h1>
				<div class="flex gap-2 flex-shrink-0">
					<button
						onclick={saveWorkout}
						disabled={isLoading || selectedExercises.length === 0 || isInitializing}
						class="px-4 py-2 bg-[var(--gradient-primary)] text-white font-semibold rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
					>
						{isLoading ? 'Saving...' : 'Save'}
					</button>
				</div>
			</div>
		</div>
	</div>

	<div class="max-w-md mx-auto px-4 py-6 space-y-6">
		{#if isInitializing}
			<div class="space-y-4">
				<div class="fitness-card animate-pulse h-16"></div>
				<div class="fitness-card animate-pulse h-32"></div>
				<div class="fitness-card animate-pulse h-32"></div>
			</div>
		{:else}
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
								{@const exercise = findExercise(recent.exerciseId, customExercises)}
								{#if exercise && !selectedExercises.some((e) => e.exercise.id === exercise.id)}
									<button
										onclick={() => addExercise(exercise)}
										class="px-3 py-1.5 bg-[var(--color-card-hover)] border border-[var(--color-border)] rounded-lg text-sm text-[var(--color-foreground)] hover:border-[var(--color-primary)] transition-colors"
									>
										{exercise.name}
									</button>
								{/if}
							{/each}
						</div>
					{/if}
				</div>
			{/if}

			<!-- Selected Exercises -->
			{#if selectedExercises.length > 0}
				<div class="space-y-4">
					<h2 class="text-lg font-semibold text-[var(--color-foreground)]">
						Exercises ({selectedExercises.length})
					</h2>
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
										<div class="flex items-center gap-3 p-3 rounded-lg bg-[var(--color-card-hover)] border border-[var(--color-border)]">
											<button
												onclick={() => removeSet(exerciseIndex, setIndex)}
												class="flex-shrink-0 w-6 h-6 rounded-full border-2 border-[var(--color-danger)]/50 hover:bg-[var(--color-danger)]/20 flex items-center justify-center transition-colors"
												title="Remove set"
											>
												<X class="w-4 h-4 text-[var(--color-danger)]" />
											</button>
											<span class="text-sm text-[var(--color-muted)] w-14 flex-shrink-0 text-left">Set {setIndex + 1}</span>
											{#if isTimeBased(ex.exercise)}
												<input
													type="number"
													value={set.durationSeconds || 0}
													oninput={(e) => updateSet(exerciseIndex, setIndex, 'durationSeconds', parseInt((e.target as HTMLInputElement).value) || 0)}
													class="flex-1 min-w-0 px-3 py-2 bg-[var(--color-background)] border border-[var(--color-border)] rounded text-[var(--color-foreground)] text-center focus:outline-none focus:border-[var(--color-primary)]"
													placeholder="Secs"
												/>
												<span class="text-[var(--color-muted)] text-sm flex-shrink-0">sec</span>
											{:else}
												<input
													type="number"
													value={set.reps}
													oninput={(e) => updateSet(exerciseIndex, setIndex, 'reps', parseInt((e.target as HTMLInputElement).value) || 0)}
													class="flex-1 min-w-0 px-3 py-2 bg-[var(--color-background)] border border-[var(--color-border)] rounded text-[var(--color-foreground)] text-center focus:outline-none focus:border-[var(--color-primary)]"
													placeholder="Reps"
												/>
												<span class="text-[var(--color-muted)] flex-shrink-0">×</span>
											{/if}
											<input
												type="number"
												value={convertWeight(set.weight, currentUnit)}
												step="0.5"
												oninput={(e) => {
													const inputValue = parseFloat((e.target as HTMLInputElement).value) || 0;
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
								<div class="space-y-3">
									<div class="flex items-center gap-3 p-3 rounded-lg bg-[var(--color-card-hover)] border border-[var(--color-border)]">
										<div class="flex-1 flex items-center gap-2">
											<label class="text-sm text-[var(--color-muted)] w-20">Duration:</label>
											<input
												type="number"
												value={ex.durationMinutes}
												oninput={(e) => updateCardioData(exerciseIndex, 'durationMinutes', parseInt((e.target as HTMLInputElement).value) || 0)}
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
												oninput={(e) => updateCardioData(exerciseIndex, 'calories', parseInt((e.target as HTMLInputElement).value) || 0)}
												class="flex-1 px-3 py-2 bg-[var(--color-background)] border border-[var(--color-border)] rounded text-[var(--color-foreground)] text-center focus:outline-none focus:border-[var(--color-primary)]"
												placeholder="Calories"
											/>
											<span class="text-[var(--color-muted)] text-sm">cal</span>
										</div>
									</div>
								</div>
							{:else if ex.exerciseType === 'stretches'}
								<div class="space-y-3">
									<div class="flex items-center gap-3 p-3 rounded-lg bg-[var(--color-card-hover)] border border-[var(--color-border)]">
										<div class="flex-1 flex items-center gap-2">
											<label class="text-sm text-[var(--color-muted)] w-20">Duration:</label>
											<input
												type="number"
												value={ex.durationSeconds}
												oninput={(e) => updateStretchesData(exerciseIndex, 'durationSeconds', parseInt((e.target as HTMLInputElement).value) || 0)}
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
												oninput={(e) => updateStretchesData(exerciseIndex, 'reps', parseInt((e.target as HTMLInputElement).value) || 0)}
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
											<h3 class="font-semibold text-[var(--color-foreground)] mb-1">{exercise.name}</h3>
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
		onEdit={() => {
			selectedExerciseDetail = null;
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

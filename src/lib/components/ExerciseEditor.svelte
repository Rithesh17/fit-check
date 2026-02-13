<script lang="ts">
	import { X, Save, Trash2, RotateCcw } from 'lucide-svelte';
	import { supabase } from '$lib/supabase/client';
	import type { Exercise, ExerciseType } from '$lib/data/exercises';
	import {
		getExerciseOverride,
		saveExerciseOverride,
		deleteExerciseOverride,
		mergeExerciseWithOverride,
		type ExerciseOverride
	} from '$lib/utils/exercise-overrides';

	interface Props {
		exercise: Exercise | null;
		isCustom: boolean;
		onClose: () => void;
		onSave: () => void | Promise<void>;
	}

	let { exercise, isCustom, onClose, onSave }: Props = $props();

	// Override state
	let override: ExerciseOverride | null = $state(null);
	let isLoadingOverride = $state(false);
	let hasChanges = $state(false);

	// Form state
	let name = $state('');
	let exerciseType = $state<ExerciseType>('weights');
	let muscleGroups = $state<string[]>([]);
	let equipment = $state('');
	let customEquipment = $state('');
	let showCustomEquipment = $state(false);
	let defaultSets = $state(3);
	let defaultReps = $state(10);
	let defaultRestSeconds = $state(60);
	// Cardio fields
	let defaultDurationMinutes = $state(30);
	let defaultCalories = $state(300);
	// Stretches fields
	let defaultDurationSeconds = $state(60);
	let defaultRepsStretches = $state(10);
	let instructions = $state('');
	let videoUrl = $state('');

	// Muscle group input
	let newMuscleGroup = $state('');

	// Available muscle groups (removed 'cardio')
	const availableMuscleGroups = [
		'chest',
		'back',
		'shoulders',
		'biceps',
		'triceps',
		'quadriceps',
		'hamstrings',
		'glutes',
		'calves',
		'core',
		'forearms'
	];

	// Equipment dropdown options - Weights/Bodyweight
	const weightsEquipmentOptions = [
		'Barbell',
		'Dumbbells',
		'Cable Machine',
		'Bodyweight',
		'Pull-up Bar',
		'Dip Bar',
		'Leg Press Machine',
		'Leg Extension Machine',
		'Leg Curl Machine',
		'Calf Raise Machine',
		'Seated Calf Machine',
		'Back Extension Machine',
		'Reverse Hyper Machine',
		'T-Bar Machine',
		'Ab Wheel',
		'None',
		'Other'
	];

	// Equipment dropdown options - Cardio
	const cardioEquipmentOptions = [
		'Treadmill',
		'Bike',
		'Stationary Bike',
		'Rowing Machine',
		'Elliptical',
		'Stair Climber',
		'Jump Rope',
		'None',
		'Other'
	];

	// Get equipment options based on exercise type
	const equipmentOptions = $derived(
		exerciseType === 'cardio' 
			? cardioEquipmentOptions 
			: exerciseType === 'stretches'
			? ['None', 'Other'] // Stretches typically don't need equipment
			: weightsEquipmentOptions // weights and bodyweight
	);

	// Track custom equipment entries
	let customEquipmentList = $state<string[]>([]);

	// Initialize form from exercise
	$effect(() => {
		(async () => {
			if (exercise) {
				// Load override if editing default exercise
				if (!isCustom) {
					isLoadingOverride = true;
					override = await getExerciseOverride(exercise.id);
					const mergedExercise = mergeExerciseWithOverride(exercise, override);
					name = mergedExercise.name;
					exerciseType = mergedExercise.exerciseType;
					muscleGroups = [...mergedExercise.muscleGroups];
					equipment = mergedExercise.equipment;
					showCustomEquipment = !equipmentOptions.includes(equipment);
					if (showCustomEquipment) {
						customEquipment = equipment;
						if (!customEquipmentList.includes(equipment)) {
							customEquipmentList = [...customEquipmentList, equipment];
						}
					}
					defaultSets = mergedExercise.defaultSets ?? 3;
					defaultReps = mergedExercise.defaultReps ?? 10;
					defaultRestSeconds = mergedExercise.defaultRestSeconds ?? 60;
					defaultDurationMinutes = mergedExercise.defaultDurationMinutes ?? 30;
					defaultCalories = mergedExercise.defaultCalories ?? 300;
					defaultDurationSeconds = mergedExercise.defaultDurationSeconds ?? 60;
					defaultRepsStretches = mergedExercise.defaultRepsStretches ?? 10;
					instructions = mergedExercise.instructions || '';
					videoUrl = mergedExercise.videoUrl || '';
					isLoadingOverride = false;
				} else {
					// Custom exercise - use as-is
					name = exercise.name;
					exerciseType = exercise.exerciseType;
					muscleGroups = [...exercise.muscleGroups];
					equipment = exercise.equipment;
					showCustomEquipment = !equipmentOptions.includes(equipment);
					if (showCustomEquipment) {
						customEquipment = equipment;
						if (!customEquipmentList.includes(equipment)) {
							customEquipmentList = [...customEquipmentList, equipment];
						}
					}
					defaultSets = exercise.defaultSets ?? 3;
					defaultReps = exercise.defaultReps ?? 10;
					defaultRestSeconds = exercise.defaultRestSeconds ?? 60;
					defaultDurationMinutes = exercise.defaultDurationMinutes ?? 30;
					defaultCalories = exercise.defaultCalories ?? 300;
					defaultDurationSeconds = exercise.defaultDurationSeconds ?? 60;
					defaultRepsStretches = exercise.defaultRepsStretches ?? 10;
					instructions = exercise.instructions || '';
					videoUrl = exercise.videoUrl || '';
				}
			} else {
				// New exercise
				name = '';
				exerciseType = 'weights';
				muscleGroups = [];
				equipment = '';
				showCustomEquipment = false;
				customEquipment = '';
				defaultSets = 3;
				defaultReps = 10;
				defaultRestSeconds = 60;
				defaultDurationMinutes = 30;
				defaultCalories = 300;
				defaultDurationSeconds = 60;
				defaultRepsStretches = 10;
				instructions = '';
				videoUrl = '';
			}
			hasChanges = false;
		})();
	});

	// Handle equipment selection
	function handleEquipmentChange(value: string) {
		if (value === 'Other') {
			showCustomEquipment = true;
			equipment = '';
		} else {
			showCustomEquipment = false;
			equipment = value;
			customEquipment = '';
		}
	}

	// Reset equipment when exercise type changes
	$effect(() => {
		// If equipment is not in the new list, reset it
		if (equipment && !equipmentOptions.includes(equipment) && equipment !== customEquipment) {
			equipment = '';
			showCustomEquipment = false;
			customEquipment = '';
		}
	});

	// Handle custom equipment input
	function handleCustomEquipmentBlur() {
		if (customEquipment.trim() && !customEquipmentList.includes(customEquipment.trim())) {
			customEquipmentList = [...customEquipmentList, customEquipment.trim()];
		}
		equipment = customEquipment.trim();
	}

	function addMuscleGroup() {
		const mg = newMuscleGroup.toLowerCase().trim();
		if (mg && !muscleGroups.includes(mg)) {
			muscleGroups = [...muscleGroups, mg];
			newMuscleGroup = '';
		}
	}

	function removeMuscleGroup(mg: string) {
		muscleGroups = muscleGroups.filter((g) => g !== mg);
	}

	async function handleSave() {
		if (!exercise) {
			// New custom exercise
			const finalEquipment = showCustomEquipment ? customEquipment.trim() : equipment;
			
			// Validation based on exercise type
			if (!name || !finalEquipment) {
				alert('Please fill in all required fields');
				return;
			}
			
			if ((exerciseType === 'weights' || exerciseType === 'bodyweight') && muscleGroups.length === 0) {
				alert('Please select at least one muscle group');
				return;
			}

			try {
				const insertData: any = {
					name,
					exercise_type: exerciseType,
					equipment: finalEquipment,
					instructions: instructions || null,
					video_url: videoUrl || null
				};

				// Add fields based on exercise type
				if (exerciseType === 'weights' || exerciseType === 'bodyweight') {
					insertData.muscle_groups = muscleGroups;
					insertData.default_sets = defaultSets;
					insertData.default_reps = defaultReps;
					insertData.default_rest_seconds = defaultRestSeconds;
				} else if (exerciseType === 'cardio') {
					insertData.muscle_groups = []; // Required field, empty for cardio
					insertData.default_duration_minutes = defaultDurationMinutes;
					insertData.default_calories = defaultCalories;
				} else if (exerciseType === 'stretches') {
					insertData.muscle_groups = []; // Required field, empty for stretches
					insertData.default_duration_seconds = defaultDurationSeconds;
					insertData.default_reps_stretches = defaultRepsStretches;
				}

				const { error } = await supabase.from('user_exercises').insert(insertData);

				if (error) throw error;
				await onSave();
				onClose();
			} catch (error) {
				console.error('Error saving exercise:', error);
				alert('Failed to save exercise. Please try again.');
			}
			return;
		}

		try {
			if (isCustom) {
				// Update custom exercise
				const finalEquipment = showCustomEquipment ? customEquipment.trim() : equipment;
				const updateData: any = {
					name,
					exercise_type: exerciseType,
					equipment: finalEquipment,
					instructions: instructions || null,
					video_url: videoUrl || null
				};

				// Add fields based on exercise type
				if (exerciseType === 'weights' || exerciseType === 'bodyweight') {
					updateData.muscle_groups = muscleGroups;
					updateData.default_sets = defaultSets;
					updateData.default_reps = defaultReps;
					updateData.default_rest_seconds = defaultRestSeconds;
					// Clear cardio/stretches fields
					updateData.default_duration_minutes = null;
					updateData.default_calories = null;
					updateData.default_duration_seconds = null;
					updateData.default_reps_stretches = null;
				} else if (exerciseType === 'cardio') {
					updateData.default_duration_minutes = defaultDurationMinutes;
					updateData.default_calories = defaultCalories;
					// Clear weights/stretches fields
					updateData.muscle_groups = [];
					updateData.default_sets = null;
					updateData.default_reps = null;
					updateData.default_rest_seconds = null;
					updateData.default_duration_seconds = null;
					updateData.default_reps_stretches = null;
				} else if (exerciseType === 'stretches') {
					updateData.default_duration_seconds = defaultDurationSeconds;
					updateData.default_reps_stretches = defaultRepsStretches;
					// Clear weights/cardio fields
					updateData.muscle_groups = [];
					updateData.default_sets = null;
					updateData.default_reps = null;
					updateData.default_rest_seconds = null;
					updateData.default_duration_minutes = null;
					updateData.default_calories = null;
				}

				const { error } = await supabase
					.from('user_exercises')
					.update(updateData as any as never)
					.eq('id', exercise.id);

				if (error) throw error;
			} else {
				// Save override for default exercise
				// Only save fields that differ from default
				const overrideData: {
					default_sets?: number;
					default_reps?: number;
					default_rest_seconds?: number;
					default_duration_minutes?: number;
					default_calories?: number;
					default_duration_seconds?: number;
					default_reps_stretches?: number;
					instructions?: string;
					video_url?: string;
				} = {};

				// Compare based on exercise type
				if (exercise.exerciseType === 'weights' || exercise.exerciseType === 'bodyweight') {
					if (defaultSets !== (exercise.defaultSets ?? 3)) {
						overrideData.default_sets = defaultSets;
					}
					if (defaultReps !== (exercise.defaultReps ?? 10)) {
						overrideData.default_reps = defaultReps;
					}
					if (defaultRestSeconds !== (exercise.defaultRestSeconds ?? 60)) {
						overrideData.default_rest_seconds = defaultRestSeconds;
					}
				} else if (exercise.exerciseType === 'cardio') {
					if (defaultDurationMinutes !== (exercise.defaultDurationMinutes ?? 30)) {
						overrideData.default_duration_minutes = defaultDurationMinutes;
					}
					if (defaultCalories !== (exercise.defaultCalories ?? 300)) {
						overrideData.default_calories = defaultCalories;
					}
				} else if (exercise.exerciseType === 'stretches') {
					if (defaultDurationSeconds !== (exercise.defaultDurationSeconds ?? 60)) {
						overrideData.default_duration_seconds = defaultDurationSeconds;
					}
					if (defaultRepsStretches !== (exercise.defaultRepsStretches ?? 10)) {
						overrideData.default_reps_stretches = defaultRepsStretches;
					}
				}

				if (instructions !== (exercise.instructions || '')) {
					overrideData.instructions = instructions || undefined;
				}
				if (videoUrl !== (exercise.videoUrl || '')) {
					overrideData.video_url = videoUrl || undefined;
				}

				// If no changes, delete override if it exists
				if (Object.keys(overrideData).length === 0) {
					if (override) {
						await deleteExerciseOverride(exercise.id);
					}
				} else {
					await saveExerciseOverride(exercise.id, overrideData);
				}
			}

			await onSave();
			onClose();
		} catch (error) {
			console.error('Error saving exercise:', error);
			alert('Failed to save exercise. Please try again.');
		}
	}

	async function handleDelete() {
		if (!exercise) return;

		if (isCustom) {
			// Delete custom exercise
			const confirmed = confirm(`Delete "${exercise.name}"? This cannot be undone.`);
			if (!confirmed) return;

			try {
				const { error } = await supabase.from('user_exercises').delete().eq('id', exercise.id);
				if (error) throw error;

				await onSave();
				onClose();
			} catch (error) {
				console.error('Error deleting exercise:', error);
				alert('Failed to delete exercise. Please try again.');
			}
		} else {
			// Delete override (reset to default)
			const confirmed = confirm(
				`Reset "${exercise.name}" to default values? Your customizations will be lost.`
			);
			if (!confirmed) return;

			try {
				await deleteExerciseOverride(exercise.id);
				await onSave();
				onClose();
			} catch (error) {
				console.error('Error deleting override:', error);
				alert('Failed to reset exercise. Please try again.');
			}
		}
	}

	async function handleReset() {
		if (!exercise || isCustom) return;

		const confirmed = confirm(`Reset "${exercise.name}" to default values?`);
		if (!confirmed) return;

		try {
			await deleteExerciseOverride(exercise.id);
			// Reload override
			override = await getExerciseOverride(exercise.id);
			const mergedExercise = mergeExerciseWithOverride(exercise, override);
			defaultSets = mergedExercise.defaultSets ?? 3;
			defaultReps = mergedExercise.defaultReps ?? 10;
			defaultRestSeconds = mergedExercise.defaultRestSeconds ?? 60;
			defaultDurationMinutes = mergedExercise.defaultDurationMinutes ?? 30;
			defaultCalories = mergedExercise.defaultCalories ?? 300;
			defaultDurationSeconds = mergedExercise.defaultDurationSeconds ?? 60;
			defaultRepsStretches = mergedExercise.defaultRepsStretches ?? 10;
			instructions = mergedExercise.instructions || '';
			videoUrl = mergedExercise.videoUrl || '';
			hasChanges = false;
		} catch (error) {
			console.error('Error resetting override:', error);
			alert('Failed to reset exercise. Please try again.');
		}
	}
</script>

{#if exercise !== null || isCustom}
	<!-- Backdrop -->
	<div
		class="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
		role="button"
		tabindex="0"
		onclick={onClose}
		onkeydown={(e) => {
			if (e.key === 'Escape') {
				e.preventDefault();
				onClose();
			}
		}}
	>
		<!-- Modal Content -->
		<div
			class="w-full max-w-2xl max-h-[90vh] bg-[var(--color-card)] rounded-2xl overflow-hidden flex flex-col shadow-2xl"
			role="dialog"
			aria-modal="true"
			aria-label={exercise ? 'Edit exercise' : 'Create exercise'}
			onclick={(e) => e.stopPropagation()}
			onkeydown={(e) => e.stopPropagation()}
		>
			<!-- Header -->
			<div class="flex items-center justify-between p-6 border-b border-[var(--color-border)]">
				<div>
					<h2 class="text-2xl font-bold text-[var(--color-foreground)]">
						{exercise ? (isCustom ? 'Edit Exercise' : 'Customize Exercise') : 'Create Exercise'}
					</h2>
					{#if exercise && !isCustom}
						<p class="text-sm text-[var(--color-muted)] mt-1">
							Customize default values for this exercise
						</p>
					{/if}
				</div>
				<button
					onclick={onClose}
					class="p-2 text-[var(--color-muted)] hover:text-[var(--color-foreground)] transition-colors rounded-lg hover:bg-[var(--color-card-hover)]"
					title="Close"
				>
					<X class="w-6 h-6" />
				</button>
			</div>

			<!-- Content (Scrollable) -->
			<div class="flex-1 overflow-y-auto p-6 space-y-4">
				{#if isLoadingOverride}
					<div class="text-center py-8 text-[var(--color-muted)]">Loading...</div>
				{:else}
				<!-- Name -->
				<div>
					<label for="exercise-name" class="block text-sm font-semibold text-[var(--color-muted)] mb-2">
						Exercise Name {isCustom ? '*' : ''}
					</label>
					<input
						id="exercise-name"
						type="text"
						bind:value={name}
						placeholder="e.g., Bench Press"
						disabled={!isCustom}
						class="w-full px-4 py-3 bg-[var(--color-card-hover)] border border-[var(--color-border)] rounded-lg text-[var(--color-foreground)] focus:outline-none focus:border-[var(--color-primary)] disabled:opacity-50 disabled:cursor-not-allowed"
					/>
					{#if !isCustom}
						<p class="text-xs text-[var(--color-muted)] mt-1">
							Name cannot be changed for default exercises
						</p>
					{/if}
				</div>

				<!-- Exercise Type (only for custom exercises) -->
				{#if isCustom}
					<div>
						<label for="exercise-type" class="block text-sm font-semibold text-[var(--color-muted)] mb-2">
							Exercise Type *
						</label>
						<select
							id="exercise-type"
							bind:value={exerciseType}
							class="w-full px-4 py-3 bg-[var(--color-card-hover)] border border-[var(--color-border)] rounded-lg text-[var(--color-foreground)] focus:outline-none focus:border-[var(--color-primary)]"
						>
							<option value="weights">Weights</option>
							<option value="bodyweight">Bodyweight</option>
							<option value="cardio">Cardio</option>
							<option value="stretches">Stretches</option>
						</select>
					</div>
				{:else}
					<!-- Show exercise type for default exercises (read-only) -->
					<div>
						<label class="block text-sm font-semibold text-[var(--color-muted)] mb-2">
							Exercise Type
						</label>
						<div class="px-4 py-3 bg-[var(--color-card-hover)] border border-[var(--color-border)] rounded-lg text-[var(--color-foreground)] opacity-50">
							{exercise?.exerciseType ? exercise.exerciseType.charAt(0).toUpperCase() + exercise.exerciseType.slice(1) : 'N/A'}
						</div>
					</div>
				{/if}

				<!-- Equipment -->
				<div>
					<label for="exercise-equipment" class="block text-sm font-semibold text-[var(--color-muted)] mb-2">
						Equipment {isCustom ? '*' : ''}
					</label>
					{#if isCustom}
						<select
							id="exercise-equipment"
							value={showCustomEquipment ? 'Other' : equipment}
							onchange={(e) => {
								const target = e.target as HTMLSelectElement;
								handleEquipmentChange(target.value);
							}}
							class="w-full px-4 py-3 bg-[var(--color-card-hover)] border border-[var(--color-border)] rounded-lg text-[var(--color-foreground)] focus:outline-none focus:border-[var(--color-primary)]"
						>
							<option value="">Select equipment</option>
							{#each equipmentOptions as opt}
								<option value={opt}>{opt}</option>
							{/each}
							{#each customEquipmentList as custom}
								{#if !equipmentOptions.includes(custom)}
									<option value={custom}>{custom}</option>
								{/if}
							{/each}
						</select>
						{#if showCustomEquipment}
							<input
								type="text"
								bind:value={customEquipment}
								onblur={handleCustomEquipmentBlur}
								placeholder="Enter custom equipment"
								class="w-full mt-2 px-4 py-3 bg-[var(--color-card-hover)] border border-[var(--color-border)] rounded-lg text-[var(--color-foreground)] focus:outline-none focus:border-[var(--color-primary)]"
							/>
						{/if}
					{:else}
						<div class="px-4 py-3 bg-[var(--color-card-hover)] border border-[var(--color-border)] rounded-lg text-[var(--color-foreground)] opacity-50">
							{exercise?.equipment || 'N/A'}
						</div>
						<p class="text-xs text-[var(--color-muted)] mt-1">
							Equipment cannot be changed for default exercises
						</p>
					{/if}
				</div>

				<!-- Muscle Groups (only for weights and bodyweight) -->
				{#if (exerciseType === 'weights' || exerciseType === 'bodyweight') && (isCustom || exercise)}
					<div>
						<label class="block text-sm font-semibold text-[var(--color-muted)] mb-2">
							Muscle Groups {isCustom ? '*' : ''}
						</label>
						{#if isCustom}
							<div class="flex gap-2 mb-2">
								<select
									bind:value={newMuscleGroup}
									class="flex-1 px-3 py-2 bg-[var(--color-card-hover)] border border-[var(--color-border)] rounded-lg text-[var(--color-foreground)] focus:outline-none focus:border-[var(--color-primary)]"
								>
									<option value="">Select muscle group</option>
									{#each availableMuscleGroups as mg}
										{#if !muscleGroups.includes(mg)}
											<option value={mg}>{mg.charAt(0).toUpperCase() + mg.slice(1)}</option>
										{/if}
									{/each}
								</select>
								<button
									onclick={addMuscleGroup}
									disabled={!newMuscleGroup}
									class="px-4 py-2 bg-[var(--color-primary)] text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
								>
									Add
								</button>
							</div>
						{/if}
						<div class="flex flex-wrap gap-2">
							{#each muscleGroups as mg}
								<span class="px-3 py-1.5 bg-[var(--color-primary)]/20 text-[var(--color-primary)] rounded-full flex items-center gap-2">
									{mg}
									{#if isCustom}
										<button
											onclick={() => removeMuscleGroup(mg)}
											class="text-[var(--color-primary)] hover:text-[var(--color-danger)]"
										>
											<X class="w-3 h-3" />
										</button>
									{/if}
								</span>
							{/each}
						</div>
						{#if !isCustom}
							<p class="text-xs text-[var(--color-muted)] mt-1">
								Muscle groups cannot be changed for default exercises
							</p>
						{/if}
					</div>
				{/if}

				<!-- Defaults Grid - Weights and Bodyweight -->
				{#if exerciseType === 'weights' || exerciseType === 'bodyweight'}
					<div class="grid grid-cols-3 gap-4">
						<div>
							<label for="exercise-sets" class="block text-sm font-semibold text-[var(--color-muted)] mb-2">
								Sets
							</label>
							<input
								id="exercise-sets"
								type="number"
								bind:value={defaultSets}
								min="1"
								class="w-full px-4 py-3 bg-[var(--color-card-hover)] border border-[var(--color-border)] rounded-lg text-[var(--color-foreground)] focus:outline-none focus:border-[var(--color-primary)]"
							/>
						</div>
						<div>
							<label for="exercise-reps" class="block text-sm font-semibold text-[var(--color-muted)] mb-2">
								Reps
							</label>
							<input
								id="exercise-reps"
								type="number"
								bind:value={defaultReps}
								min="1"
								class="w-full px-4 py-3 bg-[var(--color-card-hover)] border border-[var(--color-border)] rounded-lg text-[var(--color-foreground)] focus:outline-none focus:border-[var(--color-primary)]"
							/>
						</div>
						<div>
							<label for="exercise-rest" class="block text-sm font-semibold text-[var(--color-muted)] mb-2">
								Rest (sec)
							</label>
							<input
								id="exercise-rest"
								type="number"
								bind:value={defaultRestSeconds}
								min="0"
								class="w-full px-4 py-3 bg-[var(--color-card-hover)] border border-[var(--color-border)] rounded-lg text-[var(--color-foreground)] focus:outline-none focus:border-[var(--color-primary)]"
							/>
						</div>
					</div>
				{/if}

				<!-- Cardio Fields -->
				{#if exerciseType === 'cardio'}
					<div class="grid grid-cols-2 gap-4">
						<div>
							<label for="exercise-duration" class="block text-sm font-semibold text-[var(--color-muted)] mb-2">
								Duration (minutes)
							</label>
							<input
								id="exercise-duration"
								type="number"
								bind:value={defaultDurationMinutes}
								min="1"
								class="w-full px-4 py-3 bg-[var(--color-card-hover)] border border-[var(--color-border)] rounded-lg text-[var(--color-foreground)] focus:outline-none focus:border-[var(--color-primary)]"
							/>
						</div>
						<div>
							<label for="exercise-calories" class="block text-sm font-semibold text-[var(--color-muted)] mb-2">
								Calories
							</label>
							<input
								id="exercise-calories"
								type="number"
								bind:value={defaultCalories}
								min="0"
								class="w-full px-4 py-3 bg-[var(--color-card-hover)] border border-[var(--color-border)] rounded-lg text-[var(--color-foreground)] focus:outline-none focus:border-[var(--color-primary)]"
							/>
						</div>
					</div>
				{/if}

				<!-- Stretches Fields -->
				{#if exerciseType === 'stretches'}
					<div class="grid grid-cols-2 gap-4">
						<div>
							<label for="exercise-duration-stretches" class="block text-sm font-semibold text-[var(--color-muted)] mb-2">
								Duration (seconds)
							</label>
							<input
								id="exercise-duration-stretches"
								type="number"
								bind:value={defaultDurationSeconds}
								min="1"
								class="w-full px-4 py-3 bg-[var(--color-card-hover)] border border-[var(--color-border)] rounded-lg text-[var(--color-foreground)] focus:outline-none focus:border-[var(--color-primary)]"
							/>
						</div>
						<div>
							<label for="exercise-reps-stretches" class="block text-sm font-semibold text-[var(--color-muted)] mb-2">
								Reps
							</label>
							<input
								id="exercise-reps-stretches"
								type="number"
								bind:value={defaultRepsStretches}
								min="1"
								class="w-full px-4 py-3 bg-[var(--color-card-hover)] border border-[var(--color-border)] rounded-lg text-[var(--color-foreground)] focus:outline-none focus:border-[var(--color-primary)]"
							/>
						</div>
					</div>
				{/if}

				<!-- Instructions -->
				<div>
					<label for="exercise-instructions" class="block text-sm font-semibold text-[var(--color-muted)] mb-2">
						Instructions
					</label>
					<textarea
						id="exercise-instructions"
						bind:value={instructions}
						placeholder="Describe how to perform this exercise..."
						rows="4"
						class="w-full px-4 py-3 bg-[var(--color-card-hover)] border border-[var(--color-border)] rounded-lg text-[var(--color-foreground)] focus:outline-none focus:border-[var(--color-primary)] resize-none"
					></textarea>
				</div>

				<!-- Video URL -->
				<div>
					<label for="exercise-video" class="block text-sm font-semibold text-[var(--color-muted)] mb-2">
						YouTube Video URL
					</label>
					<input
						id="exercise-video"
						type="url"
						bind:value={videoUrl}
						placeholder="https://www.youtube.com/watch?v=..."
						class="w-full px-4 py-3 bg-[var(--color-card-hover)] border border-[var(--color-border)] rounded-lg text-[var(--color-foreground)] focus:outline-none focus:border-[var(--color-primary)]"
					/>
					<p class="text-xs text-[var(--color-muted)] mt-1">
						Paste a YouTube video URL for exercise demonstration
					</p>
				</div>
				{/if}
			</div>

			<!-- Footer Actions -->
			<div class="flex items-center justify-between p-6 border-t border-[var(--color-border)]">
				<div class="flex gap-2">
					{#if exercise && isCustom}
						<button
							onclick={handleDelete}
							class="px-4 py-2 text-[var(--color-danger)] hover:bg-[var(--color-danger)]/10 rounded-lg transition-colors flex items-center gap-2"
						>
							<Trash2 class="w-4 h-4" />
							Delete
						</button>
					{:else if exercise && !isCustom && override}
						<button
							onclick={handleReset}
							class="px-4 py-2 text-[var(--color-muted)] hover:bg-[var(--color-card-hover)] rounded-lg transition-colors flex items-center gap-2"
						>
							<RotateCcw class="w-4 h-4" />
							Reset to Default
						</button>
					{/if}
				</div>
				<div class="flex gap-3">
					<button
						onclick={onClose}
						class="px-4 py-2 text-[var(--color-muted)] hover:text-[var(--color-foreground)] transition-colors"
					>
						Cancel
					</button>
					<button
						onclick={handleSave}
						class="px-6 py-2 bg-[var(--gradient-primary)] text-white font-semibold rounded-lg hover:scale-[1.02] transition-transform flex items-center gap-2"
					>
						<Save class="w-4 h-4" />
						Save
					</button>
				</div>
			</div>
		</div>
	</div>
{/if}

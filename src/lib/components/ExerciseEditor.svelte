<script lang="ts">
	import { X, Save, Trash2, RotateCcw } from 'lucide-svelte';
	import { supabase } from '$lib/supabase/client';
	import type { Exercise } from '$lib/data/exercises';
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
		onSave: () => void;
	}

	let { exercise, isCustom, onClose, onSave }: Props = $props();

	// Override state
	let override: ExerciseOverride | null = $state(null);
	let isLoadingOverride = $state(false);
	let hasChanges = $state(false);

	// Form state
	let name = $state('');
	let muscleGroups = $state<string[]>([]);
	let equipment = $state('');
	let defaultSets = $state(3);
	let defaultReps = $state(10);
	let defaultRestSeconds = $state(60);
	let instructions = $state('');
	let videoUrl = $state('');

	// Muscle group input
	let newMuscleGroup = $state('');

	// Available muscle groups
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
		'forearms',
		'cardio'
	];

	// Initialize form from exercise
	$effect(async () => {
		if (exercise) {
			// Load override if editing default exercise
			if (!isCustom) {
				isLoadingOverride = true;
				override = await getExerciseOverride(exercise.id);
				const mergedExercise = mergeExerciseWithOverride(exercise, override);
				name = mergedExercise.name;
				muscleGroups = [...mergedExercise.muscleGroups];
				equipment = mergedExercise.equipment;
				defaultSets = mergedExercise.defaultSets;
				defaultReps = mergedExercise.defaultReps;
				defaultRestSeconds = mergedExercise.defaultRestSeconds;
				instructions = mergedExercise.instructions || '';
				videoUrl = mergedExercise.videoUrl || '';
				isLoadingOverride = false;
			} else {
				// Custom exercise - use as-is
				name = exercise.name;
				muscleGroups = [...exercise.muscleGroups];
				equipment = exercise.equipment;
				defaultSets = exercise.defaultSets;
				defaultReps = exercise.defaultReps;
				defaultRestSeconds = exercise.defaultRestSeconds;
				instructions = exercise.instructions || '';
				videoUrl = exercise.videoUrl || '';
			}
		} else {
			// New exercise
			name = '';
			muscleGroups = [];
			equipment = '';
			defaultSets = 3;
			defaultReps = 10;
			defaultRestSeconds = 60;
			instructions = '';
			videoUrl = '';
		}
		hasChanges = false;
	});

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
			if (!name || muscleGroups.length === 0 || !equipment) {
				alert('Please fill in all required fields');
				return;
			}

			try {
				const { error } = await supabase.from('user_exercises').insert({
					name,
					muscle_groups: muscleGroups,
					equipment,
					default_sets: defaultSets,
					default_reps: defaultReps,
					default_rest_seconds: defaultRestSeconds,
					instructions: instructions || null,
					video_url: videoUrl || null
				});

				if (error) throw error;
				onSave();
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
				const { error } = await supabase
					.from('user_exercises')
					.update({
						name,
						muscle_groups: muscleGroups,
						equipment,
						default_sets: defaultSets,
						default_reps: defaultReps,
						default_rest_seconds: defaultRestSeconds,
						instructions: instructions || null,
						video_url: videoUrl || null
					})
					.eq('id', exercise.id);

				if (error) throw error;
			} else {
				// Save override for default exercise
				// Only save fields that differ from default
				const overrideData: {
					default_sets?: number;
					default_reps?: number;
					default_rest_seconds?: number;
					instructions?: string;
					video_url?: string;
				} = {};

				if (defaultSets !== exercise.defaultSets) {
					overrideData.default_sets = defaultSets;
				}
				if (defaultReps !== exercise.defaultReps) {
					overrideData.default_reps = defaultReps;
				}
				if (defaultRestSeconds !== exercise.defaultRestSeconds) {
					overrideData.default_rest_seconds = defaultRestSeconds;
				}
				if (instructions !== (exercise.instructions || '')) {
					overrideData.instructions = instructions || null;
				}
				if (videoUrl !== (exercise.videoUrl || '')) {
					overrideData.video_url = videoUrl || null;
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

			onSave();
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

				onSave();
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
				onSave();
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
			defaultSets = mergedExercise.defaultSets;
			defaultReps = mergedExercise.defaultReps;
			defaultRestSeconds = mergedExercise.defaultRestSeconds;
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

				<!-- Equipment -->
				<div>
					<label for="exercise-equipment" class="block text-sm font-semibold text-[var(--color-muted)] mb-2">
						Equipment {isCustom ? '*' : ''}
					</label>
					<input
						id="exercise-equipment"
						type="text"
						bind:value={equipment}
						placeholder="e.g., Barbell, Dumbbells"
						disabled={!isCustom}
						class="w-full px-4 py-3 bg-[var(--color-card-hover)] border border-[var(--color-border)] rounded-lg text-[var(--color-foreground)] focus:outline-none focus:border-[var(--color-primary)] disabled:opacity-50 disabled:cursor-not-allowed"
					/>
					{#if !isCustom}
						<p class="text-xs text-[var(--color-muted)] mt-1">
							Equipment cannot be changed for default exercises
						</p>
					{/if}
				</div>

				<!-- Muscle Groups -->
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

				<!-- Defaults Grid -->
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

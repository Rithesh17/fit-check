<script lang="ts">
	import { onMount } from 'svelte';
	import { supabase } from '$lib/supabase/client';
	import { exercises, getExerciseById, type Exercise } from '$lib/data/exercises';
	import { hasExerciseOverride } from '$lib/utils/exercise-overrides';
	import ExerciseEditor from '$lib/components/ExerciseEditor.svelte';
	import { Plus, Edit, Trash2, Star, StarOff, Settings } from 'lucide-svelte';

	let customExercises = $state<Array<Exercise & { id: string; isCustom: boolean }>>([]);
	let favorites = $state<Set<string>>(new Set());
	let exerciseOverrides = $state<Set<string>>(new Set());
	let selectedExercise = $state<Exercise | null>(null);
	let isEditing = $state(false);
	let isLoading = $state(true);

	onMount(async () => {
		await loadCustomExercises();
		await loadFavorites();
		await loadExerciseOverrides();
	});

	async function loadCustomExercises() {
		try {
			isLoading = true;
			const { data, error } = await supabase
				.from('user_exercises')
				.select('*')
				.order('created_at', { ascending: false });

			if (error) throw error;

			customExercises = (data || []).map((ex: any) => ({
				id: ex.id,
				name: ex.name,
				muscleGroups: ex.muscle_groups || [],
				equipment: ex.equipment,
				defaultSets: ex.default_sets || 3,
				defaultReps: ex.default_reps || 10,
				defaultRestSeconds: ex.default_rest_seconds || 60,
				instructions: ex.instructions || '',
				videoUrl: ex.video_url || '',
				isCustom: true
			}));
		} catch (error) {
			console.error('Error loading custom exercises:', error);
		} finally {
			isLoading = false;
		}
	}

	async function loadFavorites() {
		try {
			const { data, error } = await supabase
				.from('user_exercise_favorites')
				.select('exercise_id')
				.eq('is_custom', false);

			if (error) throw error;

			favorites = new Set((data || []).map((f: any) => f.exercise_id));
		} catch (error) {
			console.error('Error loading favorites:', error);
		}
	}

	async function loadExerciseOverrides() {
		try {
			const { data, error } = await supabase
				.from('user_exercise_overrides')
				.select('exercise_id');

			if (error) throw error;

			exerciseOverrides = new Set((data || []).map((o: any) => o.exercise_id));
		} catch (error) {
			console.error('Error loading exercise overrides:', error);
		}
	}

	async function toggleFavorite(exerciseId: string) {
		try {
			const isFavorite = favorites.has(exerciseId);

			if (isFavorite) {
				const { error } = await supabase
					.from('user_exercise_favorites')
					.delete()
					.eq('exercise_id', exerciseId)
					.eq('is_custom', false);

				if (error) throw error;
				favorites.delete(exerciseId);
			} else {
				const { error } = await supabase.from('user_exercise_favorites').insert({
					exercise_id: exerciseId,
					is_custom: false
				});

				if (error) throw error;
				favorites.add(exerciseId);
			}

			favorites = new Set(favorites); // Trigger reactivity
		} catch (error) {
			console.error('Error toggling favorite:', error);
			alert('Failed to update favorite. Please try again.');
		}
	}

	function handleCreateNew() {
		selectedExercise = null;
		isEditing = true;
	}

	function handleEdit(exercise: Exercise & { id: string; isCustom: boolean }) {
		selectedExercise = exercise;
		isEditing = true;
	}

	function handleSave() {
		loadCustomExercises();
		loadFavorites();
		loadExerciseOverrides();
	}

	function handleEditDefault(exercise: Exercise) {
		selectedExercise = exercise;
		isEditing = true;
	}
</script>

<svelte:head>
	<title>Manage Exercises - Fit Check</title>
</svelte:head>

<div class="min-h-screen bg-[var(--color-background)] pb-20">
	<!-- Header -->
	<div class="sticky top-0 z-10 bg-[var(--color-background)]/95 backdrop-blur-sm border-b border-[var(--color-border)]">
		<div class="max-w-md mx-auto px-4 py-4">
			<div class="flex items-center justify-between mb-4">
				<h1 class="text-2xl font-bold text-[var(--color-foreground)]">Manage Exercises</h1>
				<button
					onclick={handleCreateNew}
					class="px-4 py-2 bg-[var(--gradient-primary)] text-white font-semibold rounded-lg hover:scale-[1.02] transition-transform flex items-center gap-2"
				>
					<Plus class="w-4 h-4" />
					New
				</button>
			</div>
		</div>
	</div>

	<div class="max-w-md mx-auto px-4 py-6 space-y-6">
		<!-- Custom Exercises -->
		<div>
			<h2 class="text-lg font-semibold text-[var(--color-foreground)] mb-4">Custom Exercises</h2>
			{#if isLoading}
				<div class="text-center py-8 text-[var(--color-muted)]">Loading...</div>
			{:else if customExercises.length === 0}
				<div class="fitness-card text-center py-8">
					<p class="text-[var(--color-muted)] mb-4">No custom exercises yet</p>
					<button
						onclick={handleCreateNew}
						class="px-6 py-2 bg-[var(--gradient-primary)] text-white font-semibold rounded-lg"
					>
						Create Your First Exercise
					</button>
				</div>
			{:else}
				<div class="space-y-3">
					{#each customExercises as exercise}
						<div class="fitness-card">
							<div class="flex items-start justify-between">
								<div class="flex-1">
									<h3 class="text-lg font-semibold text-[var(--color-foreground)] mb-2">
										{exercise.name}
									</h3>
									<p class="text-sm text-[var(--color-muted)] mb-2">{exercise.equipment}</p>
									<div class="flex flex-wrap gap-2">
										{#each exercise.muscleGroups as mg}
											<span class="px-2 py-1 bg-[var(--color-primary)]/20 text-[var(--color-primary)] text-xs rounded-full">
												{mg}
											</span>
										{/each}
									</div>
								</div>
								<div class="flex items-center gap-2">
									<button
										onclick={() => handleEdit(exercise)}
										class="p-2 text-[var(--color-muted)] hover:text-[var(--color-primary)] transition-colors"
										title="Edit"
									>
										<Edit class="w-5 h-5" />
									</button>
								</div>
							</div>
						</div>
					{/each}
				</div>
			{/if}
		</div>

		<!-- Default Exercises with Favorites -->
		<div>
			<h2 class="text-lg font-semibold text-[var(--color-foreground)] mb-4">All Exercises</h2>
			<div class="space-y-2">
				{#each exercises.slice(0, 20) as exercise}
					<div class="fitness-card flex items-center justify-between">
						<div class="flex-1">
							<div class="flex items-center gap-2">
								<h3 class="font-semibold text-[var(--color-foreground)]">{exercise.name}</h3>
								{#if exerciseOverrides.has(exercise.id)}
									<span
										class="px-2 py-0.5 bg-[var(--color-primary)]/20 text-[var(--color-primary)] text-xs rounded-full"
										title="Customized"
									>
										Customized
									</span>
								{/if}
							</div>
							<p class="text-xs text-[var(--color-muted)]">{exercise.equipment}</p>
						</div>
						<div class="flex items-center gap-1">
							<button
								onclick={() => handleEditDefault(exercise)}
								class="p-2 text-[var(--color-muted)] hover:text-[var(--color-primary)] transition-colors"
								title="Customize"
							>
								<Settings class="w-5 h-5" />
							</button>
							<button
								onclick={() => toggleFavorite(exercise.id)}
								class="p-2 text-[var(--color-muted)] hover:text-[var(--color-primary)] transition-colors"
								title={favorites.has(exercise.id) ? 'Remove from favorites' : 'Add to favorites'}
							>
								{#if favorites.has(exercise.id)}
									<Star class="w-5 h-5 fill-[var(--color-primary)] text-[var(--color-primary)]" />
								{:else}
									<StarOff class="w-5 h-5" />
								{/if}
							</button>
						</div>
					</div>
				{/each}
			</div>
		</div>
	</div>

	<!-- Exercise Editor Modal -->
	{#if isEditing}
		<ExerciseEditor
			exercise={selectedExercise}
			isCustom={selectedExercise ? !exercises.find((e) => e.id === selectedExercise.id) : true}
			onClose={() => {
				isEditing = false;
				selectedExercise = null;
			}}
			onSave={handleSave}
		/>
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

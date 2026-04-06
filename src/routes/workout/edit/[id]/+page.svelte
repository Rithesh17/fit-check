<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { loadTemplateById, updateTemplate } from '$lib/services/templates';
	import type { WorkoutTemplateSlot, WorkoutTemplateAlternative } from '$lib/data/workout-templates';
	import { toast } from '$lib/stores/toast';
	import { exercises, type Exercise } from '$lib/data/exercises';
	import ExerciseDetail from '$lib/components/ExerciseDetail.svelte';
	import { Search, Plus, X, Check, ChevronUp, ChevronDown, Info } from 'lucide-svelte';
	import { loadCustomExercises, findExercise, type CustomExercise } from '$lib/services/exercises';
	import { DEFAULT_SETS, DEFAULT_REPS, DEFAULT_REST_BETWEEN_SETS } from '$lib/data/config';

	const templateId = $derived($page.params.id);

	let workoutName = $state('');
	let slots = $state<WorkoutTemplateSlot[]>([]);
	let searchQuery = $state('');
	let activeSlotIndex = $state<number | null>(null); // which slot is getting an alternative
	let showExerciseSearch = $state(false);
	let isLoading = $state(false);
	let isInitializing = $state(true);
	let selectedExerciseDetail = $state<Exercise | null>(null);
	let customExercises = $state<CustomExercise[]>([]);
	let searchInputEl: HTMLInputElement | null = $state(null);

	const allExercises = $derived([...exercises, ...customExercises]);

	const filteredExercises = $derived(
		searchQuery
			? allExercises.filter(
					(ex) =>
						ex.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
						ex.muscleGroups.some((mg) => mg.toLowerCase().includes(searchQuery.toLowerCase())) ||
						ex.equipment.toLowerCase().includes(searchQuery.toLowerCase())
				)
			: allExercises.slice(0, 20)
	);

	$effect(() => {
		if (showExerciseSearch && searchInputEl) setTimeout(() => searchInputEl?.focus(), 100);
	});

	onMount(async () => {
		customExercises = await loadCustomExercises();

		const id = templateId;
		if (!id) {
			toast.error('Template not found');
			goto('/log/templates');
			return;
		}

		const result = await loadTemplateById(id);
		if (!result) {
			toast.error('Template not found');
			goto('/log/templates');
			return;
		}

		workoutName = result.template.name ?? '';
		slots = result.slots.length > 0 ? result.slots : [];
		isInitializing = false;
	});

	// ─── Slot manipulation ───────────────────────────────────────────────────────

	function addSlot(exercise: Exercise) {
		const alt: WorkoutTemplateAlternative = {
			exerciseId: exercise.id,
			sets: DEFAULT_SETS,
			reps: exercise.exerciseType === 'stretches' ? undefined : DEFAULT_REPS,
			durationSeconds: exercise.exerciseType === 'stretches' || exercise.exerciseType === 'cardio'
				? (exercise.defaultDurationSeconds ?? 30)
				: undefined,
			restSeconds: DEFAULT_REST_BETWEEN_SETS
		};
		slots = [...slots, { alternatives: [alt] }];
	}

	function addAlternativeToSlot(slotIndex: number, exercise: Exercise) {
		const alt: WorkoutTemplateAlternative = {
			exerciseId: exercise.id,
			sets: slots[slotIndex].alternatives[0]?.sets ?? DEFAULT_SETS,
			reps: slots[slotIndex].alternatives[0]?.reps,
			durationSeconds: slots[slotIndex].alternatives[0]?.durationSeconds,
			restSeconds: slots[slotIndex].alternatives[0]?.restSeconds ?? DEFAULT_REST_BETWEEN_SETS
		};
		slots = slots.map((s, i) =>
			i === slotIndex ? { ...s, alternatives: [...s.alternatives, alt] } : s
		);
	}

	function removeAlternative(slotIndex: number, altIndex: number) {
		const slot = slots[slotIndex];
		if (slot.alternatives.length === 1) {
			// Remove the whole slot
			slots = slots.filter((_, i) => i !== slotIndex);
		} else {
			slots = slots.map((s, i) =>
				i === slotIndex
					? { ...s, alternatives: s.alternatives.filter((_, j) => j !== altIndex) }
					: s
			);
		}
	}

	function moveSlotUp(index: number) {
		if (index === 0) return;
		const arr = [...slots];
		[arr[index - 1], arr[index]] = [arr[index], arr[index - 1]];
		slots = arr;
	}

	function moveSlotDown(index: number) {
		if (index >= slots.length - 1) return;
		const arr = [...slots];
		[arr[index], arr[index + 1]] = [arr[index + 1], arr[index]];
		slots = arr;
	}

	function updateSlotField(
		slotIndex: number,
		field: 'sets' | 'reps' | 'restSeconds' | 'durationSeconds',
		value: number | string
	) {
		// Propagate the change to all alternatives in the slot
		slots = slots.map((s, i) =>
			i !== slotIndex
				? s
				: {
						...s,
						alternatives: s.alternatives.map((a) => ({ ...a, [field]: value }))
					}
		);
	}

	function openSearchForSlot(slotIndex: number) {
		activeSlotIndex = slotIndex;
		showExerciseSearch = true;
		searchQuery = '';
	}

	function openSearchForNewSlot() {
		activeSlotIndex = null;
		showExerciseSearch = true;
		searchQuery = '';
	}

	function handleExercisePick(exercise: Exercise) {
		if (activeSlotIndex === null) {
			addSlot(exercise);
		} else {
			addAlternativeToSlot(activeSlotIndex, exercise);
		}
		showExerciseSearch = false;
		activeSlotIndex = null;
	}

	// ─── Save ────────────────────────────────────────────────────────────────────

	async function saveWorkout() {
		if (slots.length === 0) {
			toast.error('Add at least one exercise');
			return;
		}
		const id = templateId;
		if (!id) return;

		isLoading = true;
		try {
			await updateTemplate(id, workoutName || 'Workout', slots);
			toast.success('Template updated');
			goto('/log/templates');
		} catch (err) {
			console.error('Error updating template:', err);
			toast.error('Failed to update template');
		} finally {
			isLoading = false;
		}
	}

	function exerciseName(exerciseId: string): string {
		return findExercise(exerciseId, customExercises)?.name ?? exerciseId;
	}

	function isAlreadyInSlot(slotIndex: number, exerciseId: string): boolean {
		return slots[slotIndex]?.alternatives.some((a) => a.exerciseId === exerciseId) ?? false;
	}
</script>

<svelte:head>
	<title>Edit Template — Fit Check</title>
</svelte:head>

<div class="min-h-screen bg-[var(--color-background)] pb-24">
	<!-- Header -->
	<div class="sticky top-0 z-20 border-b border-[var(--color-border)] bg-[var(--color-background)]/95 backdrop-blur-sm">
		<div class="mx-auto max-w-md px-4 py-4">
			<div class="flex items-center justify-between gap-2">
				<a href="/log/templates" class="flex-shrink-0 text-[var(--color-muted)] hover:text-[var(--color-foreground)]">
					<X class="h-6 w-6" />
				</a>
				<h1 class="flex-1 text-center text-xl font-bold text-[var(--color-foreground)]">Edit Template</h1>
				<button
					onclick={saveWorkout}
					disabled={isLoading || slots.length === 0 || isInitializing}
					class="flex-shrink-0 rounded-lg bg-[var(--color-primary)] px-4 py-2 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
				>
					{isLoading ? 'Saving…' : 'Save'}
				</button>
			</div>
		</div>
	</div>

	<div class="mx-auto max-w-md space-y-6 px-4 py-6">
		{#if isInitializing}
			<div class="space-y-3">
				{#each [1, 2, 3] as _}
					<div class="fitness-card h-24 animate-pulse"></div>
				{/each}
			</div>
		{:else}
			<!-- Template name -->
			<div class="fitness-card">
				<label for="tpl-name" class="mb-2 block text-xs font-semibold uppercase tracking-widest text-[var(--color-muted)]">
					Template Name
				</label>
				<input
					id="tpl-name"
					type="text"
					bind:value={workoutName}
					placeholder="e.g., Push Day, Leg Day"
					class="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-card-hover)] px-4 py-2.5 text-[var(--color-foreground)] focus:border-[var(--color-primary)] focus:outline-none"
				/>
			</div>

			<!-- Slots -->
			{#if slots.length > 0}
				<div class="space-y-3">
					<h2 class="text-sm font-semibold uppercase tracking-widest text-[var(--color-muted)]">
						Exercises ({slots.length})
					</h2>

					{#each slots as slot, si}
						{@const primary = slot.alternatives[0]}
						<div class="fitness-card space-y-3">
							<!-- Slot header row -->
							<div class="flex items-start gap-2">
								<!-- Reorder -->
								<div class="flex flex-col gap-0.5 pt-0.5">
									<button
										onclick={() => moveSlotUp(si)}
										disabled={si === 0}
										class="rounded p-1 text-[var(--color-muted)] hover:text-[var(--color-primary)] disabled:opacity-30"
									><ChevronUp class="h-4 w-4" /></button>
									<button
										onclick={() => moveSlotDown(si)}
										disabled={si === slots.length - 1}
										class="rounded p-1 text-[var(--color-muted)] hover:text-[var(--color-primary)] disabled:opacity-30"
									><ChevronDown class="h-4 w-4" /></button>
								</div>

								<!-- Exercise list -->
								<div class="min-w-0 flex-1">
									{#each slot.alternatives as alt, ai}
										<div class="flex items-center gap-2 {ai > 0 ? 'mt-1' : ''}">
											{#if ai === 0}
												<span class="flex-shrink-0 rounded-full bg-[var(--color-primary)]/15 px-2 py-0.5 text-xs font-medium text-[var(--color-primary)]">Primary</span>
											{:else}
												<span class="flex-shrink-0 rounded-full bg-[var(--color-card-hover)] px-2 py-0.5 text-xs text-[var(--color-muted)]">Alt {ai}</span>
											{/if}
											<span class="min-w-0 flex-1 truncate text-sm font-semibold text-[var(--color-foreground)]">
												{exerciseName(alt.exerciseId)}
											</span>
											<button
												onclick={() => removeAlternative(si, ai)}
												class="flex-shrink-0 p-1 text-[var(--color-muted)] hover:text-red-400"
											><X class="h-3.5 w-3.5" /></button>
										</div>
									{/each}

									<!-- Add alternative -->
									<button
										onclick={() => openSearchForSlot(si)}
										class="mt-2 text-xs font-medium text-[var(--color-primary)] hover:underline"
									>
										+ Add alternative
									</button>
								</div>
							</div>

							<!-- Sets / reps / rest (applied to all alternatives in slot) -->
							<div class="grid grid-cols-3 gap-2 border-t border-[var(--color-border)] pt-3">
								<div class="space-y-1">
									<label class="block text-xs text-[var(--color-muted)]">Sets</label>
									<input
										type="number"
										min="1"
										value={primary?.sets ?? DEFAULT_SETS}
										oninput={(e) => updateSlotField(si, 'sets', parseInt((e.target as HTMLInputElement).value) || 1)}
										class="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-card-hover)] px-2 py-2 text-center text-sm text-[var(--color-foreground)] focus:border-[var(--color-primary)] focus:outline-none"
									/>
								</div>
								<div class="space-y-1">
									<label class="block text-xs text-[var(--color-muted)]">Reps</label>
									<input
										type="text"
										value={primary?.reps ?? DEFAULT_REPS}
										oninput={(e) => updateSlotField(si, 'reps', (e.target as HTMLInputElement).value)}
										placeholder="e.g. 8-12"
										class="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-card-hover)] px-2 py-2 text-center text-sm text-[var(--color-foreground)] focus:border-[var(--color-primary)] focus:outline-none"
									/>
								</div>
								<div class="space-y-1">
									<label class="block text-xs text-[var(--color-muted)]">Rest (s)</label>
									<input
										type="number"
										min="0"
										value={primary?.restSeconds ?? DEFAULT_REST_BETWEEN_SETS}
										oninput={(e) => updateSlotField(si, 'restSeconds', parseInt((e.target as HTMLInputElement).value) || 0)}
										class="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-card-hover)] px-2 py-2 text-center text-sm text-[var(--color-foreground)] focus:border-[var(--color-primary)] focus:outline-none"
									/>
								</div>
							</div>
						</div>
					{/each}
				</div>
			{/if}

			<!-- Add Exercise button -->
			<button
				onclick={openSearchForNewSlot}
				class="fitness-card flex w-full items-center justify-center gap-2 transition-transform hover:scale-[1.01] active:scale-[0.99]"
			>
				<Plus class="h-5 w-5 text-[var(--color-primary)]" />
				<span class="font-semibold text-[var(--color-foreground)]">Add Exercise</span>
			</button>
		{/if}
	</div>
</div>

<!-- Exercise Search Sheet -->
{#if showExerciseSearch}
	<div
		class="fixed inset-0 z-50 flex items-end bg-black/70 backdrop-blur-sm"
		role="button"
		tabindex="0"
		onclick={() => (showExerciseSearch = false)}
		onkeydown={(e) => e.key === 'Escape' && (showExerciseSearch = false)}
	>
		<div
			class="flex max-h-[80vh] w-full flex-col rounded-t-2xl bg-[var(--color-card)] shadow-2xl"
			role="dialog"
			aria-modal="true"
			tabindex="-1"
			onclick={(e) => e.stopPropagation()}
			onkeydown={(e) => e.stopPropagation()}
		>
			<!-- Search header -->
			<div class="border-b border-[var(--color-border)] p-4">
				<p class="mb-3 text-xs font-semibold uppercase tracking-widest text-[var(--color-primary)]">
					{activeSlotIndex !== null ? `Add alternative to slot ${activeSlotIndex + 1}` : 'Add exercise'}
				</p>
				<div class="flex items-center gap-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-card-hover)] px-3 py-2">
					<Search class="h-4 w-4 flex-shrink-0 text-[var(--color-muted)]" />
					<input
						bind:this={searchInputEl}
						type="text"
						bind:value={searchQuery}
						placeholder="Search exercises…"
						class="flex-1 bg-transparent text-sm text-[var(--color-foreground)] placeholder:text-[var(--color-muted)] focus:outline-none"
					/>
				</div>
			</div>

			<!-- Results -->
			<div class="flex-1 overflow-y-auto p-4 space-y-2">
				{#each filteredExercises as ex}
					{@const alreadyIn = activeSlotIndex !== null && isAlreadyInSlot(activeSlotIndex, ex.id)}
					<div
						onclick={() => !alreadyIn && handleExercisePick(ex)}
						onkeydown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); !alreadyIn && handleExercisePick(ex); } }}
						role="button"
						tabindex={alreadyIn ? -1 : 0}
						aria-disabled={alreadyIn}
						class="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-card-hover)] p-3 text-left transition-all hover:border-[var(--color-primary)]/60 {alreadyIn ? 'opacity-40' : 'cursor-pointer'}"
					>
						<div class="flex items-center justify-between">
							<div class="min-w-0 flex-1">
								<p class="font-semibold text-[var(--color-foreground)]">{ex.name}</p>
								<p class="text-xs text-[var(--color-muted)]">{ex.equipment} · {ex.exerciseType}</p>
							</div>
							<div class="flex items-center gap-2">
								{#if alreadyIn}
									<Check class="h-4 w-4 text-[var(--color-primary)]" />
								{/if}
								<button
									onclick={(e) => { e.stopPropagation(); selectedExerciseDetail = ex; }}
									class="p-1 text-[var(--color-muted)] hover:text-[var(--color-primary)]"
								><Info class="h-4 w-4" /></button>
							</div>
						</div>
					</div>
				{/each}
			</div>
		</div>
	</div>
{/if}

<!-- Exercise detail modal -->
<ExerciseDetail
	exercise={selectedExerciseDetail}
	onClose={() => (selectedExerciseDetail = null)}
	onEdit={() => (selectedExerciseDetail = null)}
/>

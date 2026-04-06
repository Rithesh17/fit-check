<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { saveTemplate } from '$lib/services/templates';
	import { toast } from '$lib/stores/toast';
	import { exercises as allStaticExercises, isTimeBased, type Exercise } from '$lib/data/exercises';
	import { workoutTemplates } from '$lib/data/workout-templates';
	import { getRecentExercises } from '$lib/utils/recent-exercises';
	import ExerciseDetail from '$lib/components/ExerciseDetail.svelte';
	import { Search, Plus, X, Check, ChevronUp, ChevronDown, Info, ArrowLeft, Layers } from 'lucide-svelte';
	import { unitPreference } from '$lib/stores/unit-preference';
	import { loadCustomExercises, findExercise, type CustomExercise } from '$lib/services/exercises';
	import {
		DEFAULT_SETS,
		DEFAULT_REPS,
		DEFAULT_REST_BETWEEN_SETS,
		DEFAULT_CARDIO_DURATION_MINUTES,
		DEFAULT_STRETCH_DURATION_SECONDS,
		DEFAULT_STRETCH_REPS,
		RECENT_EXERCISES_LIMIT,
		EXERCISE_LIBRARY_PAGE_SIZE
	} from '$lib/data/config';
	import type { WorkoutTemplateSlot, WorkoutTemplateAlternative } from '$lib/data/workout-templates';

	// ─── State ─────────────────────────────────────────────────────────────────
	let workoutName = $state('');
	let slots = $state<WorkoutTemplateSlot[]>([]);
	let showTemplates = $state(true);
	let selectedTemplateIds = $state<Set<string>>(new Set());
	let isLoading = $state(false);
	let customExercises = $state<CustomExercise[]>([]);
	let recentExercises = $state<Array<{ exerciseId: string; exerciseName: string }>>([]);

	// Exercise search/picker
	let showSearch = $state(false);
	/** When set, adding an exercise goes into this slot as an alternative. When null, adds as a new slot. */
	let addingAlternativeToSlot = $state<number | null>(null);
	let searchQuery = $state('');
	let searchInput: HTMLInputElement | null = $state(null);
	let selectedExerciseDetail = $state<Exercise | null>(null);

	const currentUnit = $derived($unitPreference);
	const allExercises = $derived([...allStaticExercises, ...customExercises]);

	const filteredExercises = $derived(
		searchQuery
			? allExercises.filter(
					(ex) =>
						ex.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
						ex.muscleGroups.some((mg) => mg.toLowerCase().includes(searchQuery.toLowerCase())) ||
						ex.equipment.toLowerCase().includes(searchQuery.toLowerCase())
				)
			: allExercises.slice(0, EXERCISE_LIBRARY_PAGE_SIZE)
	);

	$effect(() => {
		if (showSearch && searchInput) setTimeout(() => searchInput?.focus(), 100);
	});

	onMount(async () => {
		customExercises = await loadCustomExercises();
		const recent = await getRecentExercises(RECENT_EXERCISES_LIMIT);
		recentExercises = recent.map((r) => {
			const ex = findExercise(r.exerciseId, customExercises);
			return { exerciseId: r.exerciseId, exerciseName: ex?.name ?? r.exerciseId };
		});
	});

	// ─── Slot / Alternative construction ────────────────────────────────────────

	function exerciseToAlternative(exercise: Exercise): WorkoutTemplateAlternative {
		if (exercise.exerciseType === 'cardio') {
			return {
				exerciseId: exercise.id,
				sets: 1,
				restSeconds: 0,
				durationSeconds: (exercise.defaultDurationMinutes ?? DEFAULT_CARDIO_DURATION_MINUTES) * 60
			};
		}
		if (exercise.exerciseType === 'stretches') {
			return {
				exerciseId: exercise.id,
				sets: exercise.defaultRepsStretches ?? DEFAULT_STRETCH_REPS,
				restSeconds: 30,
				durationSeconds: exercise.defaultDurationSeconds ?? DEFAULT_STRETCH_DURATION_SECONDS
			};
		}
		const timeBased = isTimeBased(exercise);
		return {
			exerciseId: exercise.id,
			sets: exercise.defaultSets ?? DEFAULT_SETS,
			reps: timeBased ? undefined : (exercise.defaultReps ?? DEFAULT_REPS),
			durationSeconds: timeBased ? (exercise.defaultDurationSeconds ?? 45) : undefined,
			restSeconds: exercise.defaultRestSeconds ?? DEFAULT_REST_BETWEEN_SETS
		};
	}

	function addExercise(exercise: Exercise) {
		const alt = exerciseToAlternative(exercise);

		if (addingAlternativeToSlot !== null) {
			// Add as alternative to existing slot
			const idx = addingAlternativeToSlot;
			slots = slots.map((s, i) =>
				i === idx ? { alternatives: [...s.alternatives, alt] } : s
			);
		} else {
			// Add as new slot
			if (slots.some((s) => s.alternatives[0].exerciseId === exercise.id)) return;
			slots = [...slots, { alternatives: [alt] }];
		}

		showSearch = false;
		searchQuery = '';
		addingAlternativeToSlot = null;
	}

	function openSearchForNewSlot() {
		addingAlternativeToSlot = null;
		showSearch = true;
	}

	function openSearchForAlternative(slotIndex: number) {
		addingAlternativeToSlot = slotIndex;
		showSearch = true;
	}

	function removeSlot(index: number) {
		slots = slots.filter((_, i) => i !== index);
	}

	function removeAlternative(slotIndex: number, altIndex: number) {
		slots = slots.map((s, i) => {
			if (i !== slotIndex) return s;
			const alts = s.alternatives.filter((_, ai) => ai !== altIndex);
			return { alternatives: alts };
		}).filter((s) => s.alternatives.length > 0);
	}

	function moveSlotUp(index: number) {
		if (index === 0) return;
		const arr = [...slots];
		[arr[index - 1], arr[index]] = [arr[index], arr[index - 1]];
		slots = arr;
	}

	function moveSlotDown(index: number) {
		if (index === slots.length - 1) return;
		const arr = [...slots];
		[arr[index], arr[index + 1]] = [arr[index + 1], arr[index]];
		slots = arr;
	}

	function updateSets(slotIdx: number, value: number) {
		slots = slots.map((s, i) =>
			i === slotIdx
				? { alternatives: s.alternatives.map((a) => ({ ...a, sets: value })) }
				: s
		);
	}

	function updateReps(slotIdx: number, value: number) {
		slots = slots.map((s, i) =>
			i === slotIdx
				? { alternatives: s.alternatives.map((a) => ({ ...a, reps: value })) }
				: s
		);
	}

	function updateRest(slotIdx: number, value: number) {
		slots = slots.map((s, i) =>
			i === slotIdx
				? { alternatives: s.alternatives.map((a) => ({ ...a, restSeconds: value })) }
				: s
		);
	}

	// ─── Template selection ──────────────────────────────────────────────────────

	function applyTemplates() {
		slots = [];
		for (const templateId of selectedTemplateIds) {
			const template = workoutTemplates.find((t) => t.id === templateId);
			if (!template) continue;
			for (const slot of template.slots) {
				// Only add if primary exercise is not already in a slot
				const primaryId = slot.alternatives[0]?.exerciseId;
				if (primaryId && !slots.some((s) => s.alternatives[0].exerciseId === primaryId)) {
					slots = [...slots, { alternatives: [...slot.alternatives] }];
				}
			}
		}
		if (!workoutName) {
			if (selectedTemplateIds.size === 1) {
				const t = workoutTemplates.find((t) => t.id === Array.from(selectedTemplateIds)[0]);
				workoutName = t?.name ?? '';
			}
		}
		showTemplates = false;
	}

	// ─── Save ────────────────────────────────────────────────────────────────────

	async function saveWorkoutTemplate() {
		if (slots.length === 0) { toast.error('Please add at least one exercise'); return; }
		isLoading = true;
		try {
			await saveTemplate(workoutName || 'Workout', slots);
			toast.success('Workout saved');
			goto('/log/templates');
		} catch {
			toast.error('Failed to save workout');
		} finally {
			isLoading = false;
		}
	}

	// ─── Helpers ─────────────────────────────────────────────────────────────────

	function exerciseName(exerciseId: string): string {
		return findExercise(exerciseId, customExercises)?.name ?? exerciseId;
	}

	function primaryAlt(slot: WorkoutTemplateSlot): WorkoutTemplateAlternative {
		return slot.alternatives[0];
	}

	function exerciseType(exerciseId: string): string {
		const ex = findExercise(exerciseId, customExercises);
		return ex?.exerciseType ?? 'weights';
	}

	function isTimeBasedById(exerciseId: string): boolean {
		const ex = findExercise(exerciseId, customExercises);
		return ex ? isTimeBased(ex) : false;
	}
</script>

<svelte:head>
	<title>New Workout — Fit Check</title>
</svelte:head>

<div class="min-h-screen bg-[var(--color-background)] pb-24">
	<!-- Header -->
	<div class="sticky top-0 z-20 border-b border-[var(--color-border)] bg-[var(--color-background)]/95 backdrop-blur-sm">
		<div class="mx-auto flex max-w-md items-center gap-3 px-4 py-4">
			<a href="/log" class="flex-shrink-0 text-[var(--color-muted)] hover:text-[var(--color-foreground)]">
				<ArrowLeft class="h-5 w-5" />
			</a>
			<h1 class="flex-1 text-xl font-bold text-[var(--color-foreground)]">
				{showTemplates ? 'New Workout' : (workoutName || 'New Workout')}
			</h1>
			{#if showTemplates}
				<button
					onclick={applyTemplates}
					disabled={selectedTemplateIds.size === 0}
					class="rounded-lg bg-[var(--color-primary)] px-4 py-1.5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40"
				>
					Use Selected
				</button>
			{:else}
				<button
					onclick={saveWorkoutTemplate}
					disabled={isLoading || slots.length === 0}
					class="rounded-lg bg-[var(--color-primary)] px-4 py-1.5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40"
				>
					{isLoading ? 'Saving…' : 'Save'}
				</button>
			{/if}
		</div>
	</div>

	<div class="mx-auto max-w-md space-y-5 px-4 py-5">

		{#if showTemplates}
			<!-- ── Template picker ────────────────────────────────────────────── -->
			<div class="mb-2 text-center">
				<p class="text-sm text-[var(--color-muted)]">Select a template to start from, or build from scratch</p>
			</div>

			{#each workoutTemplates as template}
				<button
					onclick={() => {
						const s = new Set(selectedTemplateIds);
						s.has(template.id) ? s.delete(template.id) : s.add(template.id);
						selectedTemplateIds = s;
					}}
					class="fitness-card w-full text-left transition-all
						{selectedTemplateIds.has(template.id) ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/8' : 'hover:border-[var(--color-primary)]/40'}"
				>
					<div class="mb-2 flex items-center justify-between">
						<h3 class="font-semibold text-[var(--color-foreground)]">{template.name}</h3>
						{#if selectedTemplateIds.has(template.id)}
							<Check class="h-4 w-4 text-[var(--color-primary)]" />
						{/if}
					</div>
					<p class="mb-3 text-xs text-[var(--color-muted)]">{template.description}</p>
					<div class="flex flex-wrap gap-1.5">
						{#each template.muscleGroups as mg}
							<span class="rounded-full bg-[var(--color-primary)]/10 px-2 py-0.5 text-xs text-[var(--color-primary)]">{mg}</span>
						{/each}
					</div>
					<p class="mt-2 text-xs text-[var(--color-muted)]">{template.slots.length} exercises</p>
				</button>
			{/each}

			<button
				onclick={() => (showTemplates = false)}
				class="w-full py-3 text-sm font-medium text-[var(--color-muted)] hover:text-[var(--color-foreground)]"
			>
				Build from scratch →
			</button>

		{:else}
			<!-- ── Workout builder ────────────────────────────────────────────── -->

			<!-- Workout name -->
			<input
				type="text"
				bind:value={workoutName}
				placeholder="Workout name (e.g. Push Day)"
				class="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-card)] px-4 py-3 text-[var(--color-foreground)] placeholder:text-[var(--color-muted)] focus:border-[var(--color-primary)] focus:outline-none"
			/>

			<!-- Slot list -->
			{#if slots.length === 0}
				<div class="py-10 text-center text-[var(--color-muted)]">
					<p class="text-sm">No exercises yet.</p>
					<p class="mt-1 text-xs">Tap below to add one.</p>
				</div>
			{:else}
				{#each slots as slot, slotIdx}
					{@const primary = primaryAlt(slot)}
					{@const type = exerciseType(primary.exerciseId)}
					{@const timeBased = isTimeBasedById(primary.exerciseId)}
					<div class="fitness-card space-y-3">
						<!-- Slot header -->
						<div class="flex items-center gap-2">
							<span class="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-[var(--color-primary)]/15 text-xs font-bold text-[var(--color-primary)]">
								{slotIdx + 1}
							</span>
							<div class="min-w-0 flex-1">
								<p class="truncate font-semibold text-[var(--color-foreground)]">
									{exerciseName(primary.exerciseId)}
								</p>
								{#if slot.alternatives.length > 1}
									<p class="text-xs text-[var(--color-muted)]">
										+{slot.alternatives.length - 1} alternative{slot.alternatives.length > 2 ? 's' : ''}
									</p>
								{/if}
							</div>
							<!-- Reorder -->
							<div class="flex flex-col">
								<button onclick={() => moveSlotUp(slotIdx)} disabled={slotIdx === 0} class="p-0.5 text-[var(--color-muted)] hover:text-[var(--color-foreground)] disabled:opacity-30">
									<ChevronUp class="h-4 w-4" />
								</button>
								<button onclick={() => moveSlotDown(slotIdx)} disabled={slotIdx === slots.length - 1} class="p-0.5 text-[var(--color-muted)] hover:text-[var(--color-foreground)] disabled:opacity-30">
									<ChevronDown class="h-4 w-4" />
								</button>
							</div>
							<button
								onclick={() => (selectedExerciseDetail = findExercise(primary.exerciseId, customExercises) ?? null)}
								class="p-1 text-[var(--color-muted)] hover:text-[var(--color-foreground)]"
							>
								<Info class="h-4 w-4" />
							</button>
							<button onclick={() => removeSlot(slotIdx)} class="p-1 text-[var(--color-muted)] hover:text-[var(--color-danger)]">
								<X class="h-4 w-4" />
							</button>
						</div>

						<!-- Slot config (shared across all alternatives) -->
						{#if type === 'weights' || type === 'bodyweight'}
							<div class="grid grid-cols-3 gap-2 text-center">
								<div>
									<label class="mb-1 block text-xs text-[var(--color-muted)]">Sets</label>
									<input
										type="number" min="1" max="20"
										value={primary.sets}
										oninput={(e) => updateSets(slotIdx, parseInt((e.target as HTMLInputElement).value) || 1)}
										class="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-card-hover)] py-2 text-center text-sm text-[var(--color-foreground)] focus:border-[var(--color-primary)] focus:outline-none"
									/>
								</div>
								{#if timeBased}
									<div>
										<label class="mb-1 block text-xs text-[var(--color-muted)]">Sec/set</label>
										<input
											type="number" min="1"
											value={primary.durationSeconds ?? 45}
											oninput={(e) => slots = slots.map((s, i) => i === slotIdx ? { alternatives: s.alternatives.map((a) => ({ ...a, durationSeconds: parseInt((e.target as HTMLInputElement).value) || 45 })) } : s)}
											class="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-card-hover)] py-2 text-center text-sm text-[var(--color-foreground)] focus:border-[var(--color-primary)] focus:outline-none"
										/>
									</div>
								{:else}
									<div>
										<label class="mb-1 block text-xs text-[var(--color-muted)]">Reps</label>
										<input
											type="number" min="1"
											value={primary.reps ?? DEFAULT_REPS}
											oninput={(e) => updateReps(slotIdx, parseInt((e.target as HTMLInputElement).value) || DEFAULT_REPS)}
											class="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-card-hover)] py-2 text-center text-sm text-[var(--color-foreground)] focus:border-[var(--color-primary)] focus:outline-none"
										/>
									</div>
								{/if}
								<div>
									<label class="mb-1 block text-xs text-[var(--color-muted)]">Rest (s)</label>
									<input
										type="number" min="0"
										value={primary.restSeconds}
										oninput={(e) => updateRest(slotIdx, parseInt((e.target as HTMLInputElement).value) || 0)}
										class="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-card-hover)] py-2 text-center text-sm text-[var(--color-foreground)] focus:border-[var(--color-primary)] focus:outline-none"
									/>
								</div>
							</div>
						{:else if type === 'cardio'}
							<div class="grid grid-cols-2 gap-2">
								<div>
									<label class="mb-1 block text-xs text-[var(--color-muted)]">Duration (min)</label>
									<input type="number" min="1"
										value={Math.round((primary.durationSeconds ?? DEFAULT_CARDIO_DURATION_MINUTES * 60) / 60)}
										oninput={(e) => slots = slots.map((s, i) => i === slotIdx ? { alternatives: s.alternatives.map((a) => ({ ...a, durationSeconds: (parseInt((e.target as HTMLInputElement).value) || DEFAULT_CARDIO_DURATION_MINUTES) * 60 })) } : s)}
										class="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-card-hover)] py-2 text-center text-sm text-[var(--color-foreground)] focus:border-[var(--color-primary)] focus:outline-none"
									/>
								</div>
								<div>
									<label class="mb-1 block text-xs text-[var(--color-muted)]">Calories (est.)</label>
									<input type="number" min="0"
										value={findExercise(primary.exerciseId, customExercises)?.defaultCalories ?? 0}
										class="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-card-hover)] py-2 text-center text-sm text-[var(--color-foreground)] focus:border-[var(--color-primary)] focus:outline-none"
									/>
								</div>
							</div>
						{/if}

						<!-- Alternatives list -->
						{#if slot.alternatives.length > 1}
							<div class="space-y-1 border-t border-[var(--color-border)] pt-2">
								<p class="text-xs font-medium text-[var(--color-muted)]">Alternatives</p>
								{#each slot.alternatives as alt, altIdx}
									<div class="flex items-center justify-between rounded-lg bg-[var(--color-card-hover)] px-3 py-2">
										<div class="flex items-center gap-2">
											{#if altIdx === 0}
												<span class="text-xs font-medium text-[var(--color-primary)]">Primary</span>
											{:else}
												<span class="text-xs text-[var(--color-muted)]">Alt {altIdx}</span>
											{/if}
											<span class="text-sm text-[var(--color-foreground)]">{exerciseName(alt.exerciseId)}</span>
										</div>
										{#if altIdx > 0}
											<button onclick={() => removeAlternative(slotIdx, altIdx)} class="text-[var(--color-muted)] hover:text-[var(--color-danger)]">
												<X class="h-3.5 w-3.5" />
											</button>
										{/if}
									</div>
								{/each}
							</div>
						{/if}

						<!-- Add alternative -->
						<button
							onclick={() => openSearchForAlternative(slotIdx)}
							class="flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-[var(--color-border)] py-2 text-xs text-[var(--color-muted)] transition-colors hover:border-[var(--color-primary)]/50 hover:text-[var(--color-primary)]"
						>
							<Layers class="h-3.5 w-3.5" />
							Add alternative
						</button>
					</div>
				{/each}
			{/if}

			<!-- Add exercise button -->
			<button
				onclick={openSearchForNewSlot}
				class="fitness-card flex w-full items-center justify-center gap-2 border-dashed transition-all hover:border-[var(--color-primary)]/60"
			>
				<div class="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--color-primary)]/15">
					<Plus class="h-4 w-4 text-[var(--color-primary)]" />
				</div>
				<span class="font-medium text-[var(--color-foreground)]">Add Exercise</span>
			</button>

			<!-- Recent exercises -->
			{#if recentExercises.length > 0}
				<div>
					<p class="mb-2 text-xs font-semibold uppercase tracking-wide text-[var(--color-muted)]">Recent</p>
					<div class="flex flex-wrap gap-2">
						{#each recentExercises as r}
							{@const ex = findExercise(r.exerciseId, customExercises)}
							{#if ex && !slots.some((s) => s.alternatives[0].exerciseId === ex.id)}
								<button
									onclick={() => addExercise(ex)}
									class="rounded-lg border border-[var(--color-border)] bg-[var(--color-card)] px-3 py-1.5 text-sm text-[var(--color-foreground)] transition-colors hover:border-[var(--color-primary)]"
								>
									{ex.name}
								</button>
							{/if}
						{/each}
					</div>
				</div>
			{/if}
		{/if}
	</div>
</div>

<!-- Exercise Search Modal -->
{#if showSearch}
	<div
		class="fixed inset-0 z-50 flex flex-col bg-[var(--color-background)]"
		role="dialog"
		aria-modal="true"
		aria-label="Search exercises"
	>
		<div class="border-b border-[var(--color-border)] px-4 py-3">
			<div class="flex items-center gap-3">
				<button onclick={() => { showSearch = false; addingAlternativeToSlot = null; }} class="text-[var(--color-muted)]">
					<ArrowLeft class="h-5 w-5" />
				</button>
				<p class="text-sm font-medium text-[var(--color-muted)]">
					{addingAlternativeToSlot !== null
						? `Add alternative to slot ${addingAlternativeToSlot + 1}`
						: 'Add exercise'}
				</p>
			</div>
			<div class="relative mt-3">
				<Search class="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-muted)]" />
				<input
					bind:this={searchInput}
					type="text"
					bind:value={searchQuery}
					placeholder="Search by name, muscle, equipment…"
					class="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-card)] py-2.5 pl-9 pr-4 text-sm text-[var(--color-foreground)] placeholder:text-[var(--color-muted)] focus:border-[var(--color-primary)] focus:outline-none"
				/>
			</div>
		</div>

		<div class="flex-1 overflow-y-auto px-4 py-3">
			{#if filteredExercises.length === 0}
				<p class="py-10 text-center text-sm text-[var(--color-muted)]">No exercises found</p>
			{:else}
				<div class="space-y-2">
					{#each filteredExercises as exercise}
						<button
							onclick={() => addExercise(exercise)}
							class="fitness-card w-full text-left transition-all hover:border-[var(--color-primary)]/40"
						>
							<div class="flex items-center justify-between">
								<div class="min-w-0">
									<p class="font-medium text-[var(--color-foreground)]">{exercise.name}</p>
									<p class="mt-0.5 text-xs text-[var(--color-muted)]">
										{exercise.equipment} · {exercise.muscleGroups.slice(0, 2).join(', ')}
									</p>
								</div>
								<Plus class="h-4 w-4 flex-shrink-0 text-[var(--color-primary)]" />
							</div>
						</button>
					{/each}
				</div>
			{/if}
		</div>
	</div>
{/if}

<!-- Exercise Detail Modal -->
{#if selectedExerciseDetail}
	<ExerciseDetail
		exercise={selectedExerciseDetail}
		onClose={() => (selectedExerciseDetail = null)}
	/>
{/if}

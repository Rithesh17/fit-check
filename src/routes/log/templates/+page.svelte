<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { Play, Plus, Pencil, Trash2, Calendar, ChevronLeft, Dumbbell } from 'lucide-svelte';
	import { loadTemplates, deleteTemplate } from '$lib/services/templates';
	import { loadCustomExercises } from '$lib/services/exercises';
	import { activeWorkout, buildDefaultPayload } from '$lib/stores/active-workout';
	import { templateToActiveSlots } from '$lib/data/workout-templates';
	import { weeklySchedule, DAYS_OF_WEEK, DAY_LABELS } from '$lib/stores/schedule';
	import { toast } from '$lib/stores/toast';
	import type { WorkoutTemplateSlot } from '$lib/data/workout-templates';

	type TemplateSummary = { id: string; name: string | null; exercise_count: number };

	let isLoading = $state(true);
	let templates = $state<TemplateSummary[]>([]);
	let slotsMap = $state<Record<string, WorkoutTemplateSlot[]>>({});
	let showSchedule = $state(false);

	const currentSchedule = $derived($weeklySchedule);

	onMount(async () => {
		await reload();
	});

	async function reload() {
		try {
			isLoading = true;
			const result = await loadTemplates();
			templates = result.templates;
			slotsMap = result.slotsMap;
		} catch {
			toast.error('Failed to load templates');
		} finally {
			isLoading = false;
		}
	}

	async function startTemplate(template: TemplateSummary) {
		try {
			const customExercises = await loadCustomExercises();
			const slots = templateToActiveSlots(
				{
					id: template.id,
					name: template.name ?? '',
					description: '',
					muscleGroups: [],
					slots: slotsMap[template.id] ?? []
				},
				customExercises
			);
			if (slots.length === 0) {
				toast.error('Template has no exercises');
				return;
			}
			activeWorkout.start(buildDefaultPayload({ name: template.name ?? 'Workout', slots }));
			goto('/workout/active');
		} catch {
			toast.error('Could not start workout');
		}
	}

	async function remove(id: string) {
		if (!confirm('Delete this template? This cannot be undone.')) return;
		try {
			await deleteTemplate(id);
			templates = templates.filter((t) => t.id !== id);
			toast.success('Template deleted');
		} catch {
			toast.error('Failed to delete template');
		}
	}

	function muscleGroupBadgeColor(i: number) {
		const colors = [
			'bg-[var(--color-primary)]/15 text-[var(--color-primary)]',
			'bg-[var(--color-secondary)]/15 text-[var(--color-secondary)]',
			'bg-[var(--color-accent)]/15 text-[var(--color-accent)]'
		];
		return colors[i % colors.length];
	}
</script>

<svelte:head>
	<title>Templates — Fit Check</title>
</svelte:head>

<div class="min-h-screen bg-[var(--color-background)] pb-24">
	<!-- Header -->
	<div class="sticky top-0 z-10 border-b border-[var(--color-border)] bg-[var(--color-background)]/95 backdrop-blur-sm">
		<div class="mx-auto flex max-w-md items-center gap-3 px-4 py-4">
			<a href="/log" class="text-[var(--color-muted)] hover:text-[var(--color-foreground)]">
				<ChevronLeft class="h-5 w-5" />
			</a>
			<h1 class="flex-1 text-xl font-bold text-[var(--color-foreground)]">Templates</h1>
			<button
				onclick={() => (showSchedule = !showSchedule)}
				class="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors
					{showSchedule ? 'bg-[var(--color-primary)]/15 text-[var(--color-primary)]' : 'text-[var(--color-muted)] hover:text-[var(--color-foreground)]'}"
			>
				<Calendar class="h-4 w-4" />
				Schedule
			</button>
		</div>
	</div>

	<div class="mx-auto max-w-md space-y-5 px-4 py-6">
		<!-- Weekly Schedule (collapsible) -->
		{#if showSchedule}
			<div class="fitness-card space-y-3">
				<h2 class="flex items-center gap-2 text-sm font-semibold text-[var(--color-foreground)]">
					<Calendar class="h-4 w-4 text-[var(--color-primary)]" />
					Weekly Schedule
				</h2>
				{#each DAYS_OF_WEEK as day, i}
					<div class="flex items-center gap-3">
						<span class="w-8 flex-shrink-0 text-xs font-medium text-[var(--color-muted)]">
							{DAY_LABELS[day]}
						</span>
						<select
							value={currentSchedule[day] ?? ''}
							onchange={(e) => {
								const val = (e.target as HTMLSelectElement).value;
								weeklySchedule.setDay(day, val || null);
							}}
							class="flex-1 rounded-lg border border-[var(--color-border)] bg-[var(--color-card-hover)] px-3 py-1.5 text-sm text-[var(--color-foreground)] focus:border-[var(--color-primary)] focus:outline-none"
						>
							<option value="">Rest day</option>
							{#each templates as template}
								<option value={template.id}>{template.name ?? 'Workout'}</option>
							{/each}
						</select>
					</div>
				{/each}
			</div>
		{/if}

		{#if isLoading}
			<div class="space-y-3">
				{#each [1, 2, 3] as _}
					<div class="fitness-card h-24 animate-pulse"></div>
				{/each}
			</div>
		{:else}
			<!-- Create new -->
			<button
				onclick={() => goto('/workout/new')}
				class="fitness-card w-full border-2 border-dashed border-[var(--color-primary)]/40 text-left transition-all hover:border-[var(--color-primary)]/70"
			>
				<div class="flex items-center gap-4">
					<div class="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full bg-[var(--color-primary)]/15">
						<Plus class="h-5 w-5 text-[var(--color-primary)]" />
					</div>
					<div>
						<p class="font-semibold text-[var(--color-foreground)]">New Template</p>
						<p class="text-xs text-[var(--color-muted)]">Build a reusable workout plan</p>
					</div>
				</div>
			</button>

			<!-- Saved templates -->
			{#if templates.length === 0}
				<div class="py-12 text-center">
					<Dumbbell class="mx-auto mb-3 h-10 w-10 text-[var(--color-muted)]" />
					<p class="text-[var(--color-muted)]">No templates yet</p>
					<p class="mt-1 text-xs text-[var(--color-muted)]">Create one to get started</p>
				</div>
			{:else}
				{#each templates as template}
					<div class="fitness-card flex items-center gap-3">
						<div class="min-w-0 flex-1">
							<h3 class="truncate font-semibold text-[var(--color-foreground)]">
								{template.name ?? 'Workout'}
							</h3>
							<p class="mt-0.5 text-xs text-[var(--color-muted)]">
								{template.exercise_count}
								{template.exercise_count !== 1 ? 'exercises' : 'exercise'}
							</p>
						</div>

						<div class="flex flex-shrink-0 items-center gap-1">
							<button
								onclick={() => goto(`/workout/edit/${template.id}`)}
								class="rounded-lg p-2 text-[var(--color-muted)] transition-colors hover:text-[var(--color-primary)]"
								title="Edit"
							>
								<Pencil class="h-4 w-4" />
							</button>
							<button
								onclick={() => remove(template.id)}
								class="rounded-lg p-2 text-[var(--color-muted)] transition-colors hover:text-[var(--color-danger)]"
								title="Delete"
							>
								<Trash2 class="h-4 w-4" />
							</button>
							<button
								onclick={() => startTemplate(template)}
								class="fitness-button-primary flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold"
							>
								<Play class="h-4 w-4" fill="currentColor" />
								Start
							</button>
						</div>
					</div>
				{/each}
			{/if}
		{/if}
	</div>
</div>

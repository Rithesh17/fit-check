<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { Play, Plus, Clock, Dumbbell, History, Calendar, ChevronRight } from 'lucide-svelte';
	import { weeklySchedule, DAYS_OF_WEEK, DAY_LABELS } from '$lib/stores/schedule';
	import { loadTemplates } from '$lib/services/templates';
	import { loadCustomExercises } from '$lib/services/exercises';
	import { loadRecentWorkouts } from '$lib/services/workouts';
	import { activeWorkout, buildDefaultPayload } from '$lib/stores/active-workout';
	import { templateToActiveSlots } from '$lib/data/workout-templates';
	import { toast } from '$lib/stores/toast';
	import { RECENT_WORKOUTS_LIMIT } from '$lib/data/config';
	import { format } from 'date-fns';

	type RecentWorkout = {
		id: string;
		name: string | null;
		date: string;
		duration_minutes: number | null;
		exercise_count: number;
	};

	type TemplateSummary = {
		id: string;
		name: string | null;
		exercise_count: number;
	};

	let isLoading = $state(true);
	let recentWorkouts = $state<RecentWorkout[]>([]);
	let templates = $state<TemplateSummary[]>([]);
	let slotsMap = $state<Record<string, any[]>>({});
	let todayTemplateName = $state<string | null>(null);
	let todayTemplateId = $state<string | null>(null);

	const todayDay = DAYS_OF_WEEK[new Date().getDay()];
	const todayLabel = DAY_LABELS[DAYS_OF_WEEK[new Date().getDay()]];

	onMount(async () => {
		try {
			const [recentRes, templatesRes] = await Promise.all([
				loadRecentWorkouts(RECENT_WORKOUTS_LIMIT),
				loadTemplates()
			]);
			recentWorkouts = recentRes;
			templates = templatesRes.templates;
			slotsMap = templatesRes.slotsMap as any;

			const scheduleId = $weeklySchedule[todayDay];
			if (scheduleId) {
				const t = templatesRes.templates.find((t) => t.id === scheduleId);
				if (t) {
					todayTemplateId = t.id;
					todayTemplateName = t.name;
				}
			}
		} catch (e) {
			console.error(e);
		} finally {
			isLoading = false;
		}
	});

	async function startTemplate(templateId: string, templateName: string | null) {
		try {
			const customExercises = await loadCustomExercises();
			const slotRows = slotsMap[templateId] ?? [];
			const slots = templateToActiveSlots(
				{ id: templateId, name: templateName ?? '', description: '', muscleGroups: [], slots: slotRows },
				customExercises
			);
			if (slots.length === 0) {
				toast.error('Template has no exercises');
				return;
			}
			activeWorkout.start(buildDefaultPayload({ name: templateName ?? 'Workout', slots }));
			goto('/workout/active');
		} catch (e) {
			toast.error('Could not start workout');
		}
	}

	function quickStart() {
		activeWorkout.start(buildDefaultPayload({ name: 'Workout' }));
		goto('/workout/new');
	}

	function formatDate(dateStr: string) {
		try {
			return format(new Date(dateStr), 'MMM d');
		} catch {
			return dateStr;
		}
	}

	function formatDuration(mins: number | null) {
		if (!mins) return '—';
		if (mins < 60) return `${mins}m`;
		return `${Math.floor(mins / 60)}h ${mins % 60}m`;
	}
</script>

<svelte:head>
	<title>Log — Fit Check</title>
</svelte:head>

<div class="min-h-screen bg-[var(--color-background)] pb-24">
	<!-- Header -->
	<div class="sticky top-0 z-10 border-b border-[var(--color-border)] bg-[var(--color-background)]/95 backdrop-blur-sm">
		<div class="mx-auto flex max-w-md items-center justify-between px-4 py-4">
			<h1 class="text-2xl font-bold text-[var(--color-foreground)]">Log</h1>
			<a
				href="/log/history"
				class="flex items-center gap-1 text-sm text-[var(--color-muted)] hover:text-[var(--color-foreground)]"
			>
				<History class="h-4 w-4" />
				History
			</a>
		</div>
	</div>

	<div class="mx-auto max-w-md space-y-6 px-4 py-6">
		{#if isLoading}
			<div class="space-y-4">
				{#each [1, 2, 3] as _}
					<div class="fitness-card h-20 animate-pulse"></div>
				{/each}
			</div>
		{:else}
			<!-- Today's Plan -->
			{#if todayTemplateId && todayTemplateName}
				<div>
					<p class="mb-2 text-xs font-semibold uppercase tracking-widest text-[var(--color-primary)]">
						{todayLabel}'s Plan
					</p>
					<button
						onclick={() => startTemplate(todayTemplateId!, todayTemplateName)}
						class="fitness-card w-full border-[var(--color-primary)]/30 bg-[var(--color-primary)]/5 text-left transition-all hover:border-[var(--color-primary)]/60"
					>
						<div class="flex items-center justify-between">
							<div>
								<h3 class="text-lg font-semibold text-[var(--color-foreground)]">{todayTemplateName}</h3>
								<p class="mt-0.5 text-sm text-[var(--color-muted)]">Tap to begin</p>
							</div>
							<div class="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full bg-[var(--color-primary)]">
								<Play class="h-5 w-5 text-white" fill="white" />
							</div>
						</div>
					</button>
				</div>
			{/if}

			<!-- Quick Actions -->
			<div>
				<p class="mb-2 text-xs font-semibold uppercase tracking-widest text-[var(--color-muted)]">
					Start a workout
				</p>
				<div class="grid grid-cols-2 gap-3">
					<button
						onclick={quickStart}
						class="fitness-card flex flex-col items-start gap-2 transition-all hover:border-[var(--color-primary)]/40"
					>
						<div class="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--color-primary)]/15">
							<Plus class="h-5 w-5 text-[var(--color-primary)]" />
						</div>
						<div>
							<p class="font-semibold text-[var(--color-foreground)]">Quick Start</p>
							<p class="text-xs text-[var(--color-muted)]">Add exercises as you go</p>
						</div>
					</button>

					<a
						href="/log/templates"
						class="fitness-card flex flex-col items-start gap-2 transition-all hover:border-[var(--color-primary)]/40"
					>
						<div class="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--color-secondary)]/15">
							<Dumbbell class="h-5 w-5 text-[var(--color-secondary)]" />
						</div>
						<div>
							<p class="font-semibold text-[var(--color-foreground)]">From Template</p>
							<p class="text-xs text-[var(--color-muted)]">Pick a saved plan</p>
						</div>
					</a>
				</div>
			</div>

			<!-- Recent Workouts -->
			{#if recentWorkouts.length > 0}
				<div>
					<div class="mb-2 flex items-center justify-between">
						<p class="text-xs font-semibold uppercase tracking-widest text-[var(--color-muted)]">
							Recent
						</p>
						<a
							href="/log/history"
							class="text-xs text-[var(--color-primary)] hover:underline"
						>
							View all
						</a>
					</div>
					<div class="space-y-2">
						{#each recentWorkouts as w}
							<a
								href="/workout/{w.id}"
								class="fitness-card flex items-center justify-between transition-all hover:border-[var(--color-border-hover,var(--color-border))]"
							>
								<div class="min-w-0">
									<p class="truncate font-medium text-[var(--color-foreground)]">
										{w.name ?? 'Workout'}
									</p>
									<div class="mt-0.5 flex items-center gap-3 text-xs text-[var(--color-muted)]">
										<span class="flex items-center gap-1">
											<Calendar class="h-3 w-3" />
											{formatDate(w.date)}
										</span>
										<span class="flex items-center gap-1">
											<Clock class="h-3 w-3" />
											{formatDuration(w.duration_minutes)}
										</span>
										<span>{w.exercise_count} exercise{w.exercise_count !== 1 ? 's' : ''}</span>
									</div>
								</div>
								<ChevronRight class="h-4 w-4 flex-shrink-0 text-[var(--color-muted)]" />
							</a>
						{/each}
					</div>
				</div>
			{/if}

			<!-- Explore -->
			<div>
				<p class="mb-2 text-xs font-semibold uppercase tracking-widest text-[var(--color-muted)]">
					Explore
				</p>
				<div class="space-y-2">
					<a
						href="/log/templates"
						class="fitness-card flex items-center justify-between transition-all hover:border-[var(--color-border)]"
					>
						<div class="flex items-center gap-3">
							<Dumbbell class="h-5 w-5 text-[var(--color-primary)]" />
							<div>
								<p class="font-medium text-[var(--color-foreground)]">Templates</p>
								<p class="text-xs text-[var(--color-muted)]">Browse and manage workout plans</p>
							</div>
						</div>
						<ChevronRight class="h-4 w-4 text-[var(--color-muted)]" />
					</a>

					<a
						href="/log/exercises"
						class="fitness-card flex items-center justify-between transition-all hover:border-[var(--color-border)]"
					>
						<div class="flex items-center gap-3">
							<History class="h-5 w-5 text-[var(--color-secondary)]" />
							<div>
								<p class="font-medium text-[var(--color-foreground)]">Exercise Library</p>
								<p class="text-xs text-[var(--color-muted)]">Browse and create exercises</p>
							</div>
						</div>
						<ChevronRight class="h-4 w-4 text-[var(--color-muted)]" />
					</a>
				</div>
			</div>
		{/if}
	</div>
</div>

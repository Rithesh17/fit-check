<script lang="ts">
	import { onMount } from 'svelte';
	import { supabase } from '$lib/supabase/client';
	import { calculateStreak, workedOutToday, daysSinceLastWorkout } from '$lib/utils/streak';
	import type { StreakData } from '$lib/utils/streak';
	import { Flame, Calendar, Activity, Play } from 'lucide-svelte';
	import StreakCalendar from './StreakCalendar.svelte';
	import { goto } from '$app/navigation';
	import { weeklySchedule, DAYS_OF_WEEK } from '$lib/stores/schedule';
	import { loadTemplateById } from '$lib/services/templates';
	import { loadCustomExercises } from '$lib/services/exercises';
	import { activeWorkout, buildDefaultPayload } from '$lib/stores/active-workout';
	import { templateToActiveSlots } from '$lib/data/workout-templates';
	import { RECENT_WORKOUTS_LIMIT } from '$lib/data/config';

	let { data: _pageData }: { data?: object } = $props();

	let streakData = $state<StreakData>({
		currentStreak: 0,
		longestStreak: 0,
		lastWorkoutDate: null,
		workoutDates: []
	});

	let workoutsThisWeek = $state(0);
	let totalWorkouts = $state(0);
	let isLoading = $state(true);

	let scheduledTemplate = $state<{ id: string; name: string | null; exercise_count: number } | null>(null);
	const todayDay = DAYS_OF_WEEK[new Date().getDay()];

	onMount(async () => {
		await loadDashboardData();
	});

	async function loadDashboardData() {
		try {
			isLoading = true;

			const { data: workouts, error } = await supabase
				.from('workouts')
				.select('date')
				.order('date', { ascending: false });

			if (error) throw error;

			const workoutDates = (workouts || []).map((w: any) => new Date(w.date));
			streakData = calculateStreak(workoutDates);

			const now = new Date();
			const weekStart = new Date(now);
			weekStart.setDate(now.getDate() - now.getDay());
			weekStart.setHours(0, 0, 0, 0);

			workoutsThisWeek = workoutDates.filter((date) => date >= weekStart).length;
			totalWorkouts = workoutDates.length;
		} catch (error) {
			console.error('Error loading dashboard data:', error);
		} finally {
			isLoading = false;
		}

		// Load today's scheduled workout (non-critical)
		try {
			const todayTemplateId = $weeklySchedule[todayDay];
			if (todayTemplateId) {
				const result = await loadTemplateById(todayTemplateId);
				if (result) scheduledTemplate = result.template;
			}
		} catch {
			// Schedule is optional — ignore errors
		}
	}

	async function startScheduledWorkout() {
		if (!scheduledTemplate) return;
		const customExercises = await loadCustomExercises();
		const result = await loadTemplateById(scheduledTemplate.id);
		if (!result) return;

		// Reconstruct a WorkoutTemplate-like object from the loaded slots
		const slots = templateToActiveSlots(
			{
				id: result.template.id,
				name: result.template.name ?? '',
				description: '',
				muscleGroups: [],
				slots: result.slots
			},
			customExercises
		);

		if (slots.length === 0) return;

		activeWorkout.start(
			buildDefaultPayload({
				name: scheduledTemplate.name ?? 'Workout',
				slots
			})
		);
		goto('/workout/active');
	}

	const hasWorkedOutToday = $derived(workedOutToday(streakData.workoutDates));
	const daysSince = $derived(daysSinceLastWorkout(streakData.workoutDates));

	// suppress unused warning
	void RECENT_WORKOUTS_LIMIT;
</script>

<div class="min-h-screen bg-[var(--color-background)] pb-20">
	<!-- Header -->
	<div class="sticky top-0 z-10 border-b border-[var(--color-border)] bg-[var(--color-background)]/95 backdrop-blur-sm">
		<div class="mx-auto max-w-md px-4 py-4">
			<h1 class="text-2xl font-bold text-[var(--color-foreground)]">Fit Check</h1>
		</div>
	</div>

	<div class="mx-auto max-w-md space-y-6 px-4 py-6">
		{#if isLoading}
			<div class="space-y-6">
				<div class="fitness-card animate-pulse">
					<div class="h-32 rounded-lg bg-[var(--color-card-hover)]"></div>
				</div>
				<div class="grid grid-cols-2 gap-4">
					<div class="fitness-card h-24 animate-pulse"></div>
					<div class="fitness-card h-24 animate-pulse"></div>
				</div>
			</div>
		{:else}
			<!-- Today's Scheduled Workout -->
			{#if scheduledTemplate}
				<div class="fitness-card border-[var(--color-primary)]/40 bg-[var(--color-primary)]/5">
					<div class="flex items-center justify-between">
						<div>
							<p class="mb-1 text-xs font-semibold uppercase tracking-wide text-[var(--color-primary)]">
								Today's Workout
							</p>
							<h3 class="text-lg font-semibold text-[var(--color-foreground)]">
								{scheduledTemplate.name ?? 'Workout'}
							</h3>
							<p class="text-sm text-[var(--color-muted)]">
								{scheduledTemplate.exercise_count}
								{scheduledTemplate.exercise_count !== 1 ? 'exercises' : 'exercise'}
							</p>
						</div>
						<button
							onclick={startScheduledWorkout}
							class="flex flex-shrink-0 items-center gap-2 rounded-lg bg-[var(--gradient-accent)] px-4 py-2 font-semibold text-white"
						>
							<Play class="h-4 w-4" />
							Start
						</button>
					</div>
				</div>
			{/if}

			<!-- Streak Card -->
			<div class="fitness-card relative overflow-hidden">
				<div
					class="absolute inset-0 bg-gradient-to-br from-[var(--color-accent)]/20 to-[var(--color-primary)]/20"
				></div>
				<div class="relative">
					<div class="mb-4 flex items-center justify-between">
						<div class="flex items-center gap-2">
							<Flame class="h-6 w-6 text-[var(--color-accent)]" />
							<h2 class="text-lg font-semibold text-[var(--color-foreground)]">Current Streak</h2>
						</div>
						{#if hasWorkedOutToday}
							<span
								class="rounded-full bg-[var(--color-accent)]/20 px-3 py-1 text-xs font-bold text-[var(--color-accent)]"
							>
								Today ✓
							</span>
						{/if}
					</div>

					<div class="mb-2 flex items-baseline gap-2">
						<span class="text-5xl font-bold text-[var(--color-accent)]"
							>{streakData.currentStreak}</span
						>
						<span class="text-xl text-[var(--color-muted)]">days</span>
					</div>

					<p class="text-sm text-[var(--color-muted)]">
						{#if streakData.currentStreak === 0}
							{#if daysSince !== null}
								{daysSince === 0
									? 'Start your streak today!'
									: `Last workout: ${daysSince} day${daysSince > 1 ? 's' : ''} ago`}
							{:else}
								Start your fitness journey!
							{/if}
						{:else}
							Keep it going! 🔥
						{/if}
					</p>

					<div class="mt-4 border-t border-[var(--color-border)] pt-4">
						<div class="flex items-center justify-between text-sm">
							<span class="text-[var(--color-muted)]">Longest streak</span>
							<span class="font-semibold text-[var(--color-foreground)]"
								>{streakData.longestStreak} days</span
							>
						</div>
					</div>
				</div>
			</div>

			<!-- Quick Stats -->
			<div class="grid grid-cols-2 gap-4">
				<a
					href="/log/history?filter=week"
					class="fitness-card block transition-transform hover:scale-[1.02]"
				>
					<div class="mb-2 flex items-center gap-2">
						<Calendar class="h-5 w-5 text-[var(--color-primary)]" />
						<h3 class="text-sm font-semibold text-[var(--color-muted)]">This Week</h3>
					</div>
					<p class="text-3xl font-bold text-[var(--color-foreground)]">{workoutsThisWeek}</p>
					<p class="mt-1 text-xs text-[var(--color-muted)]">workouts</p>
				</a>

				<a href="/log/history" class="fitness-card block transition-transform hover:scale-[1.02]">
					<div class="mb-2 flex items-center gap-2">
						<Activity class="h-5 w-5 text-[var(--color-secondary)]" />
						<h3 class="text-sm font-semibold text-[var(--color-muted)]">Total</h3>
					</div>
					<p class="text-3xl font-bold text-[var(--color-foreground)]">{totalWorkouts}</p>
					<p class="mt-1 text-xs text-[var(--color-muted)]">workouts</p>
				</a>
			</div>

			<!-- Start Workout CTA -->
			<a href="/log" class="fitness-card block transition-transform hover:scale-[1.02]">
				<div class="flex items-center justify-between">
					<div>
						<h3 class="mb-1 text-lg font-semibold text-[var(--color-foreground)]">Start Workout</h3>
						<p class="text-sm text-[var(--color-muted)]">
							{hasWorkedOutToday ? 'Start another workout' : 'Pick a template or start fresh'}
						</p>
					</div>
					<div
						class="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-[var(--gradient-primary)]"
					>
						<Activity class="h-6 w-6 text-white" />
					</div>
				</div>
			</a>

			{#if hasWorkedOutToday}
				<div class="fitness-card border-[var(--color-accent)]/50">
					<div class="flex items-center gap-3">
						<div
							class="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--color-accent)]/20"
						>
							<Flame class="h-6 w-6 text-[var(--color-accent)]" />
						</div>
						<div>
							<h3 class="text-lg font-semibold text-[var(--color-foreground)]">Great job today!</h3>
							<p class="text-sm text-[var(--color-muted)]">Your streak is safe 🔥</p>
						</div>
					</div>
				</div>
			{/if}

			<StreakCalendar />
		{/if}
	</div>
</div>

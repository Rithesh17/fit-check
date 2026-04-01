<script lang="ts">
	import { onMount } from 'svelte';
	import { supabase } from '$lib/supabase/client';
	import { calculateStreak, workedOutToday, daysSinceLastWorkout } from '$lib/utils/streak';
	import type { StreakData } from '$lib/utils/streak';
	import { Flame, Calendar, Activity, Play } from 'lucide-svelte';
	import StreakCalendar from './StreakCalendar.svelte';
	import { goto } from '$app/navigation';
	import { weeklySchedule, DAYS_OF_WEEK } from '$lib/stores/schedule';
	import { loadTemplates } from '$lib/services/templates';
	import { loadCustomExercises } from '$lib/services/exercises';
	import { getExerciseById } from '$lib/data/exercises';
	import { activeWorkout, type ActiveWorkoutExercise } from '$lib/stores/active-workout';

	let { data } = $props();

	let streakData = $state<StreakData>({
		currentStreak: 0,
		longestStreak: 0,
		lastWorkoutDate: null,
		workoutDates: []
	});

	let workoutsThisWeek = $state(0);
	let totalWorkouts = $state(0);
	let isLoading = $state(true);

	// Today's scheduled workout
	let scheduledTemplate = $state<{ id: string; name: string | null; exercise_count: number } | null>(null);
	let templateExercisesMap = $state<Record<string, any[]>>({});
	const todayDay = DAYS_OF_WEEK[new Date().getDay()];

	onMount(async () => {
		await loadDashboardData();
	});

	async function loadDashboardData() {
		try {
			isLoading = true;

			// Fetch all workout dates for streak + stats
			const { data: workouts, error } = await supabase
				.from('workouts')
				.select('date')
				.order('date', { ascending: false });

			if (error) throw error;

			const workoutDates = (workouts || []).map((w: any) => new Date(w.date));

			// Calculate streak
			streakData = calculateStreak(workoutDates);

			// Calculate workouts this week
			const now = new Date();
			const weekStart = new Date(now);
			weekStart.setDate(now.getDate() - now.getDay());
			weekStart.setHours(0, 0, 0, 0);

			workoutsThisWeek = workoutDates.filter(date => date >= weekStart).length;
			totalWorkouts = workoutDates.length;

		} catch (error) {
			console.error('Error loading dashboard data:', error);
		} finally {
			isLoading = false;
		}

		// Load scheduled workout for today (non-critical)
		try {
			const { templates, exercisesMap } = await loadTemplates();
			templateExercisesMap = exercisesMap as any;
			const todayTemplateId = $weeklySchedule[todayDay];
			if (todayTemplateId) {
				scheduledTemplate = templates.find((t) => t.id === todayTemplateId) ?? null;
			}
		} catch {
			// Ignore — schedule is optional
		}
	}

	async function startScheduledWorkout() {
		if (!scheduledTemplate) return;
		const customExercises = await loadCustomExercises();
		const exs = templateExercisesMap[scheduledTemplate.id] || [];
		const exercisesPayload = exs
			.map((ex: any) => {
				const exercise = getExerciseById(ex.exercise_id) || customExercises.find((ce) => ce.id === ex.exercise_id);
				if (!exercise) return null;
				if (exercise.exerciseType === 'weights' || exercise.exerciseType === 'bodyweight') {
					let sets;
					if (Array.isArray(ex.sets)) {
						sets = (ex.sets.length ? ex.sets : [{ reps: exercise.defaultReps || 10, weight: 0, rest: exercise.defaultRestSeconds || 60 }]).map(
							(s: any) => ({ ...s, completed: false })
						);
					} else {
						sets = [{ reps: exercise.defaultReps || 10, weight: 0, rest: exercise.defaultRestSeconds || 60, completed: false }];
					}
					return { exerciseId: exercise.id, exerciseType: exercise.exerciseType, sets };
				} else if (exercise.exerciseType === 'cardio') {
					const rawSets = ex.sets as any;
					return { exerciseId: exercise.id, exerciseType: 'cardio' as const, durationMinutes: rawSets?.durationMinutes || exercise.defaultDurationMinutes || 30, calories: rawSets?.calories || exercise.defaultCalories || 300, completed: false };
				} else if (exercise.exerciseType === 'stretches') {
					const rawSets = ex.sets as any;
					return { exerciseId: exercise.id, exerciseType: 'stretches' as const, durationSeconds: rawSets?.durationSeconds || exercise.defaultDurationSeconds || 60, reps: rawSets?.reps || exercise.defaultRepsStretches || 10, completed: false };
				}
				return null;
			})
			.filter((e: any): e is ActiveWorkoutExercise => e !== null);
		if (exercisesPayload.length === 0) return;
		activeWorkout.start({ name: scheduledTemplate.name || 'Workout', notes: '', energyLevel: null, mood: '', restDurationBetweenExercises: 90, exercises: exercisesPayload });
		goto('/workout/active');
	}

	const hasWorkedOutToday = $derived(workedOutToday(streakData.workoutDates));
	const daysSince = $derived(daysSinceLastWorkout(streakData.workoutDates));
</script>

<div class="min-h-screen bg-[var(--color-background)] pb-20">
	<!-- Header -->
	<div class="sticky top-0 z-10 bg-[var(--color-background)]/95 backdrop-blur-sm border-b border-[var(--color-border)]">
		<div class="max-w-md mx-auto px-4 py-4">
			<h1 class="text-2xl font-bold text-[var(--color-foreground)]">Fit Check</h1>
		</div>
	</div>

	<div class="max-w-md mx-auto px-4 py-6 space-y-6">
		{#if isLoading}
			<!-- Loading State -->
			<div class="space-y-6">
				<div class="fitness-card animate-pulse">
					<div class="h-32 bg-[var(--color-card-hover)] rounded-lg"></div>
				</div>
				<div class="grid grid-cols-2 gap-4">
					<div class="fitness-card animate-pulse h-24"></div>
					<div class="fitness-card animate-pulse h-24"></div>
				</div>
			</div>
		{:else}
			<!-- Today's Scheduled Workout -->
			{#if scheduledTemplate}
				<div class="fitness-card border-[var(--color-primary)]/40 bg-[var(--color-primary)]/5">
					<div class="flex items-center justify-between">
						<div>
							<p class="text-xs text-[var(--color-primary)] font-semibold uppercase tracking-wide mb-1">Today's Workout</p>
							<h3 class="text-lg font-semibold text-[var(--color-foreground)]">{scheduledTemplate.name || 'Workout'}</h3>
							<p class="text-sm text-[var(--color-muted)]">{scheduledTemplate.exercise_count} exercise{scheduledTemplate.exercise_count !== 1 ? 's' : ''}</p>
						</div>
						<button
							onclick={startScheduledWorkout}
							class="px-4 py-2 bg-[var(--gradient-accent)] text-white font-semibold rounded-lg flex items-center gap-2 flex-shrink-0"
						>
							<Play class="w-4 h-4" />
							Start
						</button>
					</div>
				</div>
			{/if}

			<!-- Streak Card - Most Important -->
			<div class="fitness-card relative overflow-hidden">
				<div class="absolute inset-0 bg-gradient-to-br from-[var(--color-accent)]/20 to-[var(--color-primary)]/20"></div>
				<div class="relative">
					<div class="flex items-center justify-between mb-4">
						<div class="flex items-center gap-2">
							<Flame class="w-6 h-6 text-[var(--color-accent)]" />
							<h2 class="text-lg font-semibold text-[var(--color-foreground)]">Current Streak</h2>
						</div>
						{#if hasWorkedOutToday}
							<span class="px-3 py-1 bg-[var(--color-accent)]/20 text-[var(--color-accent)] text-xs font-bold rounded-full">
								Today ✓
							</span>
						{/if}
					</div>
					
					<div class="flex items-baseline gap-2 mb-2">
						<span class="text-5xl font-bold text-[var(--color-accent)]">{streakData.currentStreak}</span>
						<span class="text-xl text-[var(--color-muted)]">days</span>
					</div>
					
					{#if streakData.currentStreak === 0}
						<p class="text-sm text-[var(--color-muted)]">
							{#if daysSince !== null}
								{daysSince === 0 ? 'Start your streak today!' : `Last workout: ${daysSince} day${daysSince > 1 ? 's' : ''} ago`}
							{:else}
								Start your fitness journey!
							{/if}
						</p>
					{:else}
						<p class="text-sm text-[var(--color-muted)]">
							Keep it going! 🔥
						</p>
					{/if}

					<div class="mt-4 pt-4 border-t border-[var(--color-border)]">
						<div class="flex items-center justify-between text-sm">
							<span class="text-[var(--color-muted)]">Longest streak</span>
							<span class="font-semibold text-[var(--color-foreground)]">{streakData.longestStreak} days</span>
						</div>
					</div>
				</div>
			</div>

			<!-- Quick Stats Grid -->
			<div class="grid grid-cols-2 gap-4">
				<!-- Workouts This Week -->
				<a href="/workouts/history?filter=week" class="fitness-card block hover:scale-[1.02] transition-transform">
					<div class="flex items-center gap-2 mb-2">
						<Calendar class="w-5 h-5 text-[var(--color-primary)]" />
						<h3 class="text-sm font-semibold text-[var(--color-muted)]">This Week</h3>
					</div>
					<p class="text-3xl font-bold text-[var(--color-foreground)]">{workoutsThisWeek}</p>
					<p class="text-xs text-[var(--color-muted)] mt-1">workouts</p>
				</a>

				<!-- Total Workouts -->
				<a href="/workouts/history" class="fitness-card block hover:scale-[1.02] transition-transform">
					<div class="flex items-center gap-2 mb-2">
						<Activity class="w-5 h-5 text-[var(--color-secondary)]" />
						<h3 class="text-sm font-semibold text-[var(--color-muted)]">Total</h3>
					</div>
					<p class="text-3xl font-bold text-[var(--color-foreground)]">{totalWorkouts}</p>
					<p class="text-xs text-[var(--color-muted)] mt-1">workouts</p>
				</a>
			</div>

			<!-- Start Workout Card - always visible so user can do multiple workouts per day -->
			<a href="/workouts" class="fitness-card block hover:scale-[1.02] transition-transform">
				<div class="flex items-center justify-between">
					<div>
						<h3 class="text-lg font-semibold text-[var(--color-foreground)] mb-1">Start Workout</h3>
						<p class="text-sm text-[var(--color-muted)]">
							{hasWorkedOutToday ? 'Start another workout' : 'Pick a workout or create new to log for today'}
						</p>
					</div>
					<div class="w-12 h-12 rounded-full bg-[var(--gradient-primary)] flex items-center justify-center">
						<Activity class="w-6 h-6 text-white" />
					</div>
				</div>
			</a>
			{#if hasWorkedOutToday}
				<div class="fitness-card border-[var(--color-accent)]/50">
					<div class="flex items-center gap-3">
						<div class="w-12 h-12 rounded-full bg-[var(--color-accent)]/20 flex items-center justify-center">
							<Flame class="w-6 h-6 text-[var(--color-accent)]" />
						</div>
						<div>
							<h3 class="text-lg font-semibold text-[var(--color-foreground)]">Great job today!</h3>
							<p class="text-sm text-[var(--color-muted)]">Your streak is safe 🔥</p>
						</div>
					</div>
				</div>
			{/if}

			<!-- Streak Calendar -->
			<StreakCalendar />
		{/if}
	</div>
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

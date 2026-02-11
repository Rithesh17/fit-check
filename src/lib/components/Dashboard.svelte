<script lang="ts">
	import { onMount } from 'svelte';
	import { supabase } from '$lib/supabase/client';
	import { calculateStreak, workedOutToday, daysSinceLastWorkout } from '$lib/utils/streak';
	import type { StreakData } from '$lib/utils/streak';
	import { getAchievedMilestones, getMilestoneProgress } from '$lib/utils/streak-milestones';
	import { Flame, TrendingUp, Calendar, Activity, Award } from 'lucide-svelte';
	import RecentWorkouts from './RecentWorkouts.svelte';
	import StreakCalendar from './StreakCalendar.svelte';

	let { data } = $props();

	let streakData = $state<StreakData>({
		currentStreak: 0,
		longestStreak: 0,
		lastWorkoutDate: null,
		workoutDates: []
	});

	let workoutsThisWeek = $state(0);
	let totalWorkouts = $state(0);
	let recentWorkouts = $state<any[]>([]);
	let isLoading = $state(true);

	onMount(async () => {
		await loadDashboardData();
	});

	async function loadDashboardData() {
		try {
			isLoading = true;

			// Fetch workouts with exercise counts
			const { data: workouts, error } = await supabase
				.from('workouts')
				.select(`
					id,
					name,
					date,
					duration_minutes,
					workout_exercises(count)
				`)
				.order('date', { ascending: false })
				.limit(10);

			if (error) throw error;

			// Convert dates and calculate stats
			const workoutDates = (workouts || []).map(w => new Date(w.date));
			
			// Calculate streak
			streakData = calculateStreak(workoutDates);

			// Calculate workouts this week
			const now = new Date();
			const weekStart = new Date(now);
			weekStart.setDate(now.getDate() - now.getDay()); // Start of week (Sunday)
			weekStart.setHours(0, 0, 0, 0);

			workoutsThisWeek = workoutDates.filter(date => date >= weekStart).length;
			totalWorkouts = workoutDates.length;

			// Format recent workouts
			recentWorkouts = (workouts || []).map(w => ({
				id: w.id,
				name: w.name,
				date: w.date,
				duration_minutes: w.duration_minutes,
				exercise_count: Array.isArray(w.workout_exercises) ? w.workout_exercises.length : 0
			}));

		} catch (error) {
			console.error('Error loading dashboard data:', error);
		} finally {
			isLoading = false;
		}
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
				<div class="fitness-card">
					<div class="flex items-center gap-2 mb-2">
						<Calendar class="w-5 h-5 text-[var(--color-primary)]" />
						<h3 class="text-sm font-semibold text-[var(--color-muted)]">This Week</h3>
					</div>
					<p class="text-3xl font-bold text-[var(--color-foreground)]">{workoutsThisWeek}</p>
					<p class="text-xs text-[var(--color-muted)] mt-1">workouts</p>
				</div>

				<!-- Total Workouts -->
				<div class="fitness-card">
					<div class="flex items-center gap-2 mb-2">
						<Activity class="w-5 h-5 text-[var(--color-secondary)]" />
						<h3 class="text-sm font-semibold text-[var(--color-muted)]">Total</h3>
					</div>
					<p class="text-3xl font-bold text-[var(--color-foreground)]">{totalWorkouts}</p>
					<p class="text-xs text-[var(--color-muted)] mt-1">workouts</p>
				</div>
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

			<!-- Streak Milestones -->
			{#if streakData.currentStreak > 0}
				{@const achieved = getAchievedMilestones(streakData.currentStreak)}
				{@const next = getMilestoneProgress(streakData.currentStreak)}
				<div class="fitness-card">
					<div class="flex items-center gap-2 mb-4">
						<Award class="w-5 h-5 text-[var(--color-accent)]" />
						<h2 class="text-lg font-semibold text-[var(--color-foreground)]">Milestones</h2>
					</div>
					{#if achieved.length > 0}
						<div class="space-y-2 mb-4">
							{#each achieved as milestone}
								<div class="flex items-center gap-2 p-2 bg-[var(--color-card-hover)] rounded-lg">
									<span class="text-2xl">{milestone.icon}</span>
									<div class="flex-1">
										<div class="font-semibold text-[var(--color-foreground)]">{milestone.name}</div>
										<div class="text-xs text-[var(--color-muted)]">{milestone.description}</div>
									</div>
								</div>
							{/each}
						</div>
					{/if}
					{#if next}
						<div class="pt-4 border-t border-[var(--color-border)]">
							<div class="text-sm text-[var(--color-muted)] mb-2">Next: {next.milestone.name}</div>
							<div class="w-full bg-[var(--color-card-hover)] rounded-full h-2 mb-1">
								<div
									class="h-2 rounded-full transition-all"
									style="width: {(next.progress * 100).toFixed(0)}%; background: {next.milestone.color};"
								></div>
							</div>
							<div class="text-xs text-[var(--color-muted)]">
								{next.daysRemaining} day{next.daysRemaining !== 1 ? 's' : ''} to go
							</div>
						</div>
					{/if}
				</div>
			{/if}

			<!-- Streak Calendar -->
			<StreakCalendar />

			<!-- Recent Workouts -->
			<div>
				<h2 class="text-lg font-semibold text-[var(--color-foreground)] mb-4">Recent Workouts</h2>
				{#if totalWorkouts === 0}
					<div class="fitness-card text-center py-8">
						<Activity class="w-12 h-12 text-[var(--color-muted)] mx-auto mb-3 opacity-50" />
						<p class="text-[var(--color-muted)] mb-4">No workouts yet</p>
						<a href="/workouts" class="inline-block px-6 py-2 bg-[var(--gradient-primary)] text-white font-semibold rounded-lg hover:scale-105 transition-transform">
							Start Your First Workout
						</a>
					</div>
				{:else}
					<RecentWorkouts workouts={recentWorkouts} />
				{/if}
			</div>
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

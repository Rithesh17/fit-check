<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { loadWorkoutPage } from '$lib/services/workouts';
	import { formatWorkoutDate } from '$lib/utils/dates';
	import { ChevronLeft, ChevronRight, Calendar, Clock, Activity, Dumbbell } from 'lucide-svelte';

	let workouts = $state<any[]>([]);
	let isLoading = $state(true);
	let currentPage = $state(0);
	let hasMore = $state(false);

	let filter = $state<'all' | 'week'>(
		$page.url.searchParams.get('filter') === 'week' ? 'week' : 'all'
	);

	async function fetchPage(p: number) {
		isLoading = true;
		try {
			const result = await loadWorkoutPage(p, filter);
			workouts = result.workouts;
			hasMore = result.hasMore;
			currentPage = p;
		} catch (e) {
			console.error('Failed to load workout history', e);
		} finally {
			isLoading = false;
		}
	}

	async function changeFilter(f: 'all' | 'week') {
		filter = f;
		await fetchPage(0);
	}

	onMount(() => fetchPage(0));
</script>

<svelte:head>
	<title>Workout History — Fit Check</title>
</svelte:head>

<div class="min-h-screen bg-[var(--color-background)] pb-24">
	<!-- Header -->
	<div class="sticky top-0 z-10 border-b border-[var(--color-border)] bg-[var(--color-background)]/95 backdrop-blur-sm">
		<div class="mx-auto max-w-md px-4 py-4">
			<div class="mb-4 flex items-center gap-3">
				<a href="/log" class="text-[var(--color-muted)] hover:text-[var(--color-foreground)]">
					<ChevronLeft class="h-5 w-5" />
				</a>
				<h1 class="flex-1 text-xl font-bold text-[var(--color-foreground)]">Workout History</h1>
			</div>

			<!-- Filter -->
			<div class="flex gap-2">
				{#each [['all', 'All Time'], ['week', 'This Week']] as [val, label]}
					<button
						onclick={() => changeFilter(val as 'all' | 'week')}
						class="flex-1 rounded-lg py-2 text-sm font-medium transition-colors
							{filter === val
								? 'bg-[var(--color-primary)] text-white'
								: 'border border-[var(--color-border)] bg-[var(--color-card)] text-[var(--color-muted)]'}"
					>
						{label}
					</button>
				{/each}
			</div>
		</div>
	</div>

	<div class="mx-auto max-w-md px-4 py-6">
		{#if isLoading}
			<div class="space-y-3">
				{#each [1, 2, 3, 4, 5] as _}
					<div class="fitness-card h-24 animate-pulse"></div>
				{/each}
			</div>
		{:else if workouts.length === 0}
			<div class="py-16 text-center">
				<Dumbbell class="mx-auto mb-3 h-12 w-12 text-[var(--color-muted)] opacity-40" />
				<p class="text-[var(--color-muted)]">
					{filter === 'week' ? 'No workouts this week' : 'No workouts yet'}
				</p>
				<a
					href="/log"
					class="mt-4 inline-block rounded-lg bg-[var(--color-primary)] px-6 py-2 font-semibold text-white"
				>
					Start a Workout
				</a>
			</div>
		{:else}
			<div class="mb-6 space-y-3">
				{#each workouts as workout}
					<button
						onclick={() => goto(`/workout/${workout.id}`)}
						class="fitness-card w-full text-left transition-all hover:border-[var(--color-primary)]/40"
					>
						<div class="mb-1 flex items-center gap-2 text-xs text-[var(--color-muted)]">
							<Calendar class="h-3.5 w-3.5" />
							{formatWorkoutDate(workout.date)}
						</div>
						<h3 class="mb-2 font-semibold text-[var(--color-foreground)]">
							{workout.name ?? 'Workout'}
						</h3>
						<div class="flex items-center gap-4 text-xs text-[var(--color-muted)]">
							<span class="flex items-center gap-1">
								<Activity class="h-3.5 w-3.5" />
								{workout.exercise_count} exercise{workout.exercise_count !== 1 ? 's' : ''}
							</span>
							{#if workout.duration_minutes}
								<span class="flex items-center gap-1">
									<Clock class="h-3.5 w-3.5" />
									{workout.duration_minutes} min
								</span>
							{/if}
						</div>
					</button>
				{/each}
			</div>

			<!-- Pagination -->
			<div class="flex items-center justify-between">
				<button
					onclick={() => fetchPage(currentPage - 1)}
					disabled={currentPage === 0}
					class="flex items-center gap-1.5 rounded-lg border border-[var(--color-border)] px-4 py-2 text-sm font-medium transition-colors hover:border-[var(--color-primary)] disabled:cursor-not-allowed disabled:opacity-40"
				>
					<ChevronLeft class="h-4 w-4" />
					Prev
				</button>
				<span class="text-sm text-[var(--color-muted)]">Page {currentPage + 1}</span>
				<button
					onclick={() => fetchPage(currentPage + 1)}
					disabled={!hasMore}
					class="flex items-center gap-1.5 rounded-lg border border-[var(--color-border)] px-4 py-2 text-sm font-medium transition-colors hover:border-[var(--color-primary)] disabled:cursor-not-allowed disabled:opacity-40"
				>
					Next
					<ChevronRight class="h-4 w-4" />
				</button>
			</div>
		{/if}
	</div>
</div>

<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { loadWorkoutPage } from '$lib/services/workouts';
	import { formatWorkoutDate } from '$lib/utils/dates';
	import { ArrowLeft, Calendar, Clock, Activity, ChevronLeft, ChevronRight } from 'lucide-svelte';

	let workouts = $state<any[]>([]);
	let isLoading = $state(true);
	let currentPage = $state(0);
	let hasMore = $state(false);
	let totalOnPage = $state(0);

	// Initialise filter from URL query param so the dashboard deep-link works
	let filter = $state<'all' | 'week'>($page.url.searchParams.get('filter') === 'week' ? 'week' : 'all');

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
	<title>Workout History - Fit Check</title>
</svelte:head>

<div class="min-h-screen bg-[var(--color-background)] pb-20">
	<!-- Header -->
	<div class="sticky top-0 z-10 bg-[var(--color-background)]/95 backdrop-blur-sm border-b border-[var(--color-border)]">
		<div class="max-w-md mx-auto px-4 py-4">
			<div class="flex items-center gap-3 mb-4">
				<button onclick={() => goto('/')} class="text-[var(--color-muted)] hover:text-[var(--color-foreground)]">
					<ArrowLeft class="w-6 h-6" />
				</button>
				<h1 class="text-2xl font-bold text-[var(--color-foreground)]">Workout History</h1>
			</div>

			<!-- Filter Toggle -->
			<div class="flex gap-2">
				<button
					onclick={() => changeFilter('all')}
					class="flex-1 px-4 py-2 rounded-lg font-medium transition-colors {filter === 'all'
						? 'bg-[var(--color-primary)] text-white'
						: 'bg-[var(--color-card)] text-[var(--color-muted)] border border-[var(--color-border)]'}"
				>
					All Time
				</button>
				<button
					onclick={() => changeFilter('week')}
					class="flex-1 px-4 py-2 rounded-lg font-medium transition-colors {filter === 'week'
						? 'bg-[var(--color-primary)] text-white'
						: 'bg-[var(--color-card)] text-[var(--color-muted)] border border-[var(--color-border)]'}"
				>
					This Week
				</button>
			</div>
		</div>
	</div>

	<div class="max-w-md mx-auto px-4 py-6">
		{#if isLoading}
			<div class="space-y-3">
				{#each Array(5) as _}
					<div class="fitness-card animate-pulse h-24"></div>
				{/each}
			</div>
		{:else if workouts.length === 0}
			<div class="fitness-card text-center py-12">
				<Activity class="w-12 h-12 text-[var(--color-muted)] mx-auto mb-3 opacity-50" />
				<p class="text-[var(--color-muted)] mb-4">
					{filter === 'week' ? 'No workouts logged this week' : 'No workouts logged yet'}
				</p>
				<a href="/workouts" class="inline-block px-6 py-2 bg-[var(--gradient-primary)] text-white font-semibold rounded-lg">
					Start a Workout
				</a>
			</div>
		{:else}
			<div class="space-y-3 mb-6">
				{#each workouts as workout}
					<button
						onclick={() => goto(`/workout/${workout.id}`)}
						class="w-full fitness-card text-left hover:scale-[1.02] transition-transform"
					>
						<div class="flex items-start justify-between">
							<div class="flex-1">
								<div class="flex items-center gap-2 mb-2">
									<Calendar class="w-4 h-4 text-[var(--color-muted)]" />
									<span class="text-sm text-[var(--color-muted)]">{formatWorkoutDate(workout.date)}</span>
								</div>
								<h3 class="text-lg font-semibold text-[var(--color-foreground)] mb-2">
									{workout.name || 'Workout'}
								</h3>
								<div class="flex items-center gap-4 text-sm text-[var(--color-muted)]">
									{#if workout.exercise_count !== undefined}
										<div class="flex items-center gap-1">
											<Activity class="w-4 h-4" />
											<span>{workout.exercise_count} exercise{workout.exercise_count !== 1 ? 's' : ''}</span>
										</div>
									{/if}
									{#if workout.duration_minutes}
										<div class="flex items-center gap-1">
											<Clock class="w-4 h-4" />
											<span>{workout.duration_minutes} min</span>
										</div>
									{/if}
								</div>
							</div>
						</div>
					</button>
				{/each}
			</div>

			<!-- Pagination -->
			<div class="flex items-center justify-between">
				<button
					onclick={() => fetchPage(currentPage - 1)}
					disabled={currentPage === 0}
					class="flex items-center gap-1 px-4 py-2 rounded-lg font-medium transition-colors
						{currentPage === 0
							? 'text-[var(--color-muted)] opacity-40 cursor-not-allowed'
							: 'bg-[var(--color-card)] text-[var(--color-foreground)] border border-[var(--color-border)] hover:border-[var(--color-primary)]'}"
				>
					<ChevronLeft class="w-4 h-4" />
					Previous
				</button>

				<span class="text-sm text-[var(--color-muted)]">Page {currentPage + 1}</span>

				<button
					onclick={() => fetchPage(currentPage + 1)}
					disabled={!hasMore}
					class="flex items-center gap-1 px-4 py-2 rounded-lg font-medium transition-colors
						{!hasMore
							? 'text-[var(--color-muted)] opacity-40 cursor-not-allowed'
							: 'bg-[var(--color-card)] text-[var(--color-foreground)] border border-[var(--color-border)] hover:border-[var(--color-primary)]'}"
				>
					Next
					<ChevronRight class="w-4 h-4" />
				</button>
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

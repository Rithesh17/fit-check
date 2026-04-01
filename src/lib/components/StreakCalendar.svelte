<script lang="ts">
	import { supabase } from '$lib/supabase/client';
	import { goto } from '$app/navigation';
	import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, getDay, startOfDay, endOfDay } from 'date-fns';
	import { Clock, Activity, X } from 'lucide-svelte';
	import { formatWorkoutDate } from '$lib/utils/dates';

	let workoutDates = $state<Date[]>([]);
	let currentMonth = $state(new Date());
	let isLoading = $state(true);

	let selectedDate = $state<Date | null>(null);
	let selectedWorkouts = $state<any[]>([]);
	let isLoadingSelected = $state(false);

	$effect(() => {
		loadWorkoutDates();
	});

	async function loadWorkoutDates() {
		try {
			isLoading = true;
			const { data, error } = await supabase
				.from('workouts')
				.select('date')
				.order('date', { ascending: false });

			if (error) throw error;

			workoutDates = (data || []).map((w) => new Date(w.date));
		} catch (error) {
			console.error('Error loading workout dates:', error);
		} finally {
			isLoading = false;
		}
	}

	async function selectDate(day: Date) {
		if (selectedDate && isSameDay(day, selectedDate)) {
			selectedDate = null;
			selectedWorkouts = [];
			return;
		}
		selectedDate = day;
		isLoadingSelected = true;
		try {
			const { data, error } = await supabase
				.from('workouts')
				.select('id, name, date, duration_minutes, workout_exercises(count)')
				.gte('date', startOfDay(day).toISOString())
				.lte('date', endOfDay(day).toISOString())
				.order('date', { ascending: false });

			if (error) throw error;

			selectedWorkouts = (data || []).map((w: any) => ({
				id: w.id,
				name: w.name,
				date: w.date,
				duration_minutes: w.duration_minutes,
				exercise_count: Array.isArray(w.workout_exercises) ? w.workout_exercises.length : 0
			}));
		} catch (e) {
			console.error('Error loading workouts for date', e);
			selectedWorkouts = [];
		} finally {
			isLoadingSelected = false;
		}
	}

	function previousMonth() {
		currentMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1);
	}

	function nextMonth() {
		currentMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1);
	}

	function hasWorkout(date: Date): boolean {
		return workoutDates.some((wd) => isSameDay(wd, date));
	}

	const monthStart = $derived.by(() => startOfMonth(currentMonth));
	const monthEnd = $derived.by(() => endOfMonth(currentMonth));
	const daysInMonth = $derived.by(() => eachDayOfInterval({ start: monthStart, end: monthEnd }));
	const firstDayOfWeek = $derived.by(() => getDay(monthStart));

	const calendarDays = $derived.by(() => {
		const days: (Date | null)[] = [];
		for (let i = 0; i < firstDayOfWeek; i++) {
			days.push(null);
		}
		daysInMonth.forEach((day) => days.push(day));
		const totalCells = 42;
		while (days.length < totalCells) {
			days.push(null);
		}
		return days;
	});

	const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
</script>

<div class="streak-calendar fitness-card">
	<div class="flex items-center justify-between mb-4">
		<button
			onclick={previousMonth}
			class="p-2 text-[var(--color-muted)] hover:text-[var(--color-foreground)] transition-colors"
			title="Previous month"
		>
			←
		</button>
		<h3 class="text-lg font-bold text-[var(--color-foreground)]">
			{format(currentMonth, 'MMMM yyyy')}
		</h3>
		<button
			onclick={nextMonth}
			class="p-2 text-[var(--color-muted)] hover:text-[var(--color-foreground)] transition-colors"
			title="Next month"
		>
			→
		</button>
	</div>

	{#if isLoading}
		<div class="text-center py-8 text-[var(--color-muted)]">Loading...</div>
	{:else}
		<div class="calendar-grid">
			{#each weekDays as day}
				<div class="calendar-header">{day}</div>
			{/each}

			{#each calendarDays as day}
				{#if day}
					{#if hasWorkout(day)}
						<button
							onclick={() => selectDate(day)}
							class="calendar-day has-workout {isSameDay(day, new Date()) ? 'today' : ''} {selectedDate && isSameDay(day, selectedDate) ? 'selected' : ''}"
							title="View workouts on {format(day, 'MMM d')}"
						>
							{format(day, 'd')}
						</button>
					{:else}
						<div
							class="calendar-day {isSameDay(day, new Date()) ? 'today' : ''}"
							title={format(day, 'MMM d')}
						>
							{format(day, 'd')}
						</div>
					{/if}
				{:else}
					<div class="calendar-day empty"></div>
				{/if}
			{/each}
		</div>

		<div class="flex items-center justify-center gap-4 mt-4 text-xs text-[var(--color-muted)]">
			<div class="flex items-center gap-2">
				<div class="w-3 h-3 rounded bg-[var(--color-accent)]"></div>
				<span>Workout</span>
			</div>
			<div class="flex items-center gap-2">
				<div class="w-3 h-3 rounded border border-[var(--color-border)]"></div>
				<span>No workout</span>
			</div>
			<div class="flex items-center gap-2">
				<div class="w-3 h-3 rounded border-2 border-[var(--color-primary)]"></div>
				<span>Today</span>
			</div>
		</div>

		<!-- Selected date workouts -->
		{#if selectedDate}
			<div class="mt-4 pt-4 border-t border-[var(--color-border)]">
				<div class="flex items-center justify-between mb-3">
					<h4 class="text-sm font-semibold text-[var(--color-foreground)]">
						{format(selectedDate, 'EEEE, MMMM d')}
					</h4>
					<button
						onclick={() => { selectedDate = null; selectedWorkouts = []; }}
						class="p-1 text-[var(--color-muted)] hover:text-[var(--color-foreground)] transition-colors"
						aria-label="Close"
					>
						<X class="w-4 h-4" />
					</button>
				</div>

				{#if isLoadingSelected}
					<div class="space-y-2">
						<div class="h-16 rounded-lg bg-[var(--color-card-hover)] animate-pulse"></div>
					</div>
				{:else}
					<div class="space-y-2">
						{#each selectedWorkouts as workout}
							<button
								onclick={() => goto(`/workout/${workout.id}`)}
								class="w-full text-left p-3 rounded-lg bg-[var(--color-card-hover)] border border-[var(--color-border)] hover:border-[var(--color-primary)] transition-colors"
							>
								<div class="font-semibold text-[var(--color-foreground)] text-sm mb-1">
									{workout.name || 'Workout'}
								</div>
								<div class="flex items-center gap-3 text-xs text-[var(--color-muted)]">
									{#if workout.exercise_count !== undefined}
										<span class="flex items-center gap-1">
											<Activity class="w-3 h-3" />
											{workout.exercise_count} exercise{workout.exercise_count !== 1 ? 's' : ''}
										</span>
									{/if}
									{#if workout.duration_minutes}
										<span class="flex items-center gap-1">
											<Clock class="w-3 h-3" />
											{workout.duration_minutes} min
										</span>
									{/if}
								</div>
							</button>
						{/each}
					</div>
				{/if}
			</div>
		{/if}
	{/if}
</div>

<style>
	.calendar-grid {
		display: grid;
		grid-template-columns: repeat(7, 1fr);
		gap: 0.25rem;
	}

	.calendar-header {
		text-align: center;
		font-size: 0.75rem;
		font-weight: 600;
		color: var(--color-muted);
		padding: 0.5rem 0;
	}

	.calendar-day {
		aspect-ratio: 1;
		display: flex;
		align-items: center;
		justify-content: center;
		border-radius: 0.375rem;
		font-size: 0.875rem;
		color: var(--color-foreground);
		background: var(--color-card-hover);
		border: 1px solid var(--color-border);
		transition: all var(--transition-normal);
	}

	.calendar-day.empty {
		background: transparent;
		border: none;
	}

	.calendar-day.has-workout {
		background: var(--color-accent);
		color: var(--color-on-primary);
		border-color: var(--color-accent);
		font-weight: 600;
		cursor: pointer;
	}

	.calendar-day.has-workout:hover {
		filter: brightness(1.15);
	}

	.calendar-day.has-workout.selected {
		box-shadow: 0 0 0 2px var(--color-foreground);
	}

	.calendar-day.today {
		border: 2px solid var(--color-primary);
	}

	.calendar-day.today.has-workout {
		border-color: var(--color-primary);
		box-shadow: 0 0 0 2px var(--color-primary);
	}

	.calendar-day.today.has-workout.selected {
		box-shadow: 0 0 0 2px var(--color-foreground);
	}

	/* Remove default button styles for calendar-day buttons */
	button.calendar-day {
		width: 100%;
		padding: 0;
		font-family: inherit;
	}
</style>

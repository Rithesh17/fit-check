<script lang="ts">
	import { supabase } from '$lib/supabase/client';
	import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, getDay } from 'date-fns';

	let workoutDates = $state<Date[]>([]);
	let currentMonth = $state(new Date());
	let isLoading = $state(true);

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
	const firstDayOfWeek = $derived.by(() => getDay(monthStart)); // 0 = Sunday

	// Create calendar grid with empty cells for days before month start
	const calendarDays = $derived.by(() => {
		const days: (Date | null)[] = [];
		// Add empty cells for days before month start
		for (let i = 0; i < firstDayOfWeek; i++) {
			days.push(null);
		}
		// Add all days in month
		daysInMonth.forEach((day) => days.push(day));
		// Fill remaining cells to make a complete grid (6 rows × 7 columns = 42 cells)
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
			<!-- Week day headers -->
			{#each weekDays as day}
				<div class="calendar-header">{day}</div>
			{/each}

			<!-- Calendar days -->
			{#each calendarDays as day}
				{#if day}
					<div
						class="calendar-day {hasWorkout(day)
							? 'has-workout'
							: ''} {isSameDay(day, new Date()) ? 'today' : ''}"
						title={hasWorkout(day) ? `Workout on ${format(day, 'MMM d')}` : format(day, 'MMM d')}
					>
						{format(day, 'd')}
					</div>
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
	}

	.calendar-day.today {
		border: 2px solid var(--color-primary);
	}

	.calendar-day.today.has-workout {
		border-color: var(--color-primary);
		box-shadow: 0 0 0 2px var(--color-primary);
	}
</style>

<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { supabase } from '$lib/supabase/client';
	import { getExerciseById } from '$lib/data/exercises';
	import { calculateExerciseProgress, getPersonalRecords, type ExerciseProgress } from '$lib/utils/progress';
	import VolumeTrendChart from '$lib/components/VolumeTrendChart.svelte';
	import MuscleGroupChart from '$lib/components/MuscleGroupChart.svelte';
	import { TrendingUp, Award, Activity, Dumbbell, ChevronRight } from 'lucide-svelte';
	import { unitPreference } from '$lib/stores/unit-preference';
	import { loadCustomExercises } from '$lib/services/exercises';
	import { formatWeight } from '$lib/utils/weight-conversion';

	type LiftCard = {
		id: string;
		name: string;
		progress: ExerciseProgress;
	};

	let isLoading = $state(true);
	let liftCards = $state<LiftCard[]>([]);
	let personalRecords = $state<Array<{ exerciseName: string; weight: number; reps: number; date: Date; exerciseId?: string }>>([]);
	let todayPR = $state<{ exerciseName: string; weight: number; reps: number; exerciseId?: string } | null>(null);

	const currentUnit = $derived($unitPreference);

	const today = new Date().toDateString();

	onMount(async () => {
		const customExercises = await loadCustomExercises();
		await loadProgressData(customExercises);
	});

	async function loadProgressData(customExercises: Array<{ id: string; name: string; isCustom: boolean }>) {
		try {
			isLoading = true;

			const { data: workouts, error: workoutsError } = await supabase
				.from('workouts')
				.select('id, date')
				.order('date', { ascending: true });

			if (workoutsError) throw workoutsError;

			const { data: workoutExercises, error } = await supabase
				.from('workout_exercises')
				.select('exercise_id, workout_id, sets')
				.order('created_at', { ascending: true });

			if (error) throw error;

			const workoutDateMap = new Map<string, string>();
			(workouts || []).forEach((w: any) => workoutDateMap.set(w.id, w.date));

			const exerciseMap = new Map<string, Array<{ date: string; sets: any }>>();
			(workoutExercises || []).forEach((we: any) => {
				const date = workoutDateMap.get(we.workout_id);
				if (!date) return;
				if (!exerciseMap.has(we.exercise_id)) exerciseMap.set(we.exercise_id, []);
				exerciseMap.get(we.exercise_id)!.push({ date, sets: we.sets });
			});

			// Build lift cards sorted by most recently used
			const cards: LiftCard[] = [];
			const allProgress: ExerciseProgress[] = [];

			// Sort exercise ids by most recent workout date
			const exerciseIds = Array.from(exerciseMap.keys());
			exerciseIds.sort((a, b) => {
				const aLast = exerciseMap.get(a)?.at(-1)?.date ?? '';
				const bLast = exerciseMap.get(b)?.at(-1)?.date ?? '';
				return bLast.localeCompare(aLast);
			});

			for (const id of exerciseIds) {
				const exercise = getExerciseById(id) || customExercises.find((ce) => ce.id === id);
				if (!exercise) continue;
				const data = exerciseMap.get(id) || [];
				const progress = calculateExerciseProgress(id, exercise.name, data);
				if (progress.dates.length > 0) {
					cards.push({ id, name: exercise.name, progress });
					allProgress.push(progress);
				}
			}

			liftCards = cards;

			// Personal records sorted by date desc
			const prs = getPersonalRecords(allProgress).map((pr) => ({
				...pr,
				exerciseId: cards.find((c) => c.name === pr.exerciseName)?.id
			}));
			personalRecords = prs;

			// Check for PR hit today
			const todayEntry = prs.find((pr) => pr.date.toDateString() === today);
			todayPR = todayEntry ?? null;
		} catch (err) {
			console.error('Error loading progress data:', err);
		} finally {
			isLoading = false;
		}
	}

	/** Build a tiny polyline path for SVG sparkline from last N weight values */
	function sparklinePath(weights: number[], width = 80, height = 28): string {
		const pts = weights.slice(-6);
		if (pts.length < 2) return '';
		const min = Math.min(...pts);
		const max = Math.max(...pts);
		const range = max - min || 1;
		return pts
			.map((w, i) => {
				const x = (i / (pts.length - 1)) * width;
				const y = height - ((w - min) / range) * height;
				return `${x.toFixed(1)},${y.toFixed(1)}`;
			})
			.join(' ');
	}
</script>

<svelte:head>
	<title>Progress — Fit Check</title>
</svelte:head>

<div class="min-h-screen bg-[var(--color-background)] pb-24">
	<!-- Header -->
	<div class="sticky top-0 z-10 border-b border-[var(--color-border)] bg-[var(--color-background)]/95 backdrop-blur-sm">
		<div class="mx-auto max-w-md px-4 py-4">
			<h1 class="text-2xl font-bold text-[var(--color-foreground)]">Progress</h1>
		</div>
	</div>

	<div class="mx-auto max-w-md px-4 py-6 space-y-8">
		{#if isLoading}
			<div class="grid grid-cols-2 gap-3">
				{#each [1,2,3,4,5,6] as _}
					<div class="fitness-card h-28 animate-pulse"></div>
				{/each}
			</div>
		{:else if liftCards.length === 0}
			<div class="fitness-card py-16 text-center">
				<Dumbbell class="mx-auto mb-3 h-12 w-12 text-[var(--color-muted)] opacity-40" />
				<p class="mb-4 text-[var(--color-muted)]">No workout data yet</p>
				<a
					href="/log"
					class="inline-block rounded-lg bg-[var(--color-primary)] px-6 py-2 font-semibold text-white"
				>
					Start Your First Workout
				</a>
			</div>
		{:else}
			<!-- PR hit today banner -->
			{#if todayPR}
				<div
					class="relative overflow-hidden rounded-xl border border-[var(--color-primary)]/40 bg-[var(--color-primary)]/10 px-4 py-4"
				>
					<div class="flex items-center gap-3">
						<div class="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-[var(--color-primary)]/20">
							<Award class="h-5 w-5 text-[var(--color-primary)]" />
						</div>
						<div class="min-w-0 flex-1">
							<p class="text-xs font-semibold uppercase tracking-widest text-[var(--color-primary)]">New PR Today!</p>
							<p class="font-semibold text-[var(--color-foreground)]">{todayPR.exerciseName}</p>
							<p class="text-sm text-[var(--color-muted)]">
								{formatWeight(todayPR.weight, currentUnit)} × {todayPR.reps} reps
							</p>
						</div>
						{#if todayPR.exerciseId}
							<a
								href="/progress/{todayPR.exerciseId}"
								class="flex-shrink-0 rounded-lg border border-[var(--color-primary)]/30 px-3 py-1.5 text-xs font-medium text-[var(--color-primary)]"
							>
								View
							</a>
						{/if}
					</div>
				</div>
			{/if}

			<!-- Your Lifts grid -->
			<section>
				<div class="mb-4 flex items-center gap-2">
					<TrendingUp class="h-5 w-5 text-[var(--color-primary)]" />
					<h2 class="text-lg font-semibold text-[var(--color-foreground)]">Your Lifts</h2>
					<span class="ml-auto text-xs text-[var(--color-muted)]">{liftCards.length} tracked</span>
				</div>
				<div class="grid grid-cols-2 gap-3">
					{#each liftCards as card}
						{@const pts = sparklinePath(card.progress.weights)}
						<button
							onclick={() => goto(`/progress/${card.id}`)}
							class="fitness-card group relative text-left transition-all hover:border-[var(--color-primary)]/60 active:scale-[0.97]"
						>
							<p class="mb-1 truncate text-sm font-semibold text-[var(--color-foreground)]">{card.name}</p>
							{#if card.progress.personalRecord}
								<p class="text-lg font-bold text-[var(--color-primary)]">
									{formatWeight(card.progress.personalRecord.weight, currentUnit)}
								</p>
								<p class="text-xs text-[var(--color-muted)]">{card.progress.personalRecord.reps} reps PR</p>
							{:else}
								<p class="text-xs text-[var(--color-muted)]">No weight data</p>
							{/if}
							<!-- Sparkline -->
							{#if pts}
								<svg
									viewBox="0 0 80 28"
									class="mt-2 w-full"
									preserveAspectRatio="none"
									aria-hidden="true"
								>
									<polyline
										points={pts}
										fill="none"
										stroke="var(--color-primary)"
										stroke-width="1.5"
										stroke-linecap="round"
										stroke-linejoin="round"
										opacity="0.7"
									/>
								</svg>
							{/if}
							<ChevronRight
								class="absolute right-2 top-2 h-3.5 w-3.5 text-[var(--color-muted)] opacity-0 transition-opacity group-hover:opacity-100"
							/>
						</button>
					{/each}
				</div>
			</section>

			<!-- Personal Records list -->
			{#if personalRecords.length > 0}
				<section>
					<div class="mb-4 flex items-center gap-2">
						<Award class="h-5 w-5 text-[var(--color-primary)]" />
						<h2 class="text-lg font-semibold text-[var(--color-foreground)]">Personal Records</h2>
					</div>
					<div class="space-y-2">
						{#each personalRecords.slice(0, 5) as pr}
							<button
								onclick={() => pr.exerciseId && goto(`/progress/${pr.exerciseId}`)}
								class="fitness-card w-full text-left transition-all hover:border-[var(--color-primary)]/40"
							>
								<div class="flex items-center justify-between">
									<div class="min-w-0 flex-1">
										<p class="font-semibold text-[var(--color-foreground)]">{pr.exerciseName}</p>
										<p class="text-xs text-[var(--color-muted)]">
											{pr.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
										</p>
									</div>
									<div class="text-right">
										<p class="text-lg font-bold text-[var(--color-primary)]">
											{formatWeight(pr.weight, currentUnit)}
										</p>
										<p class="text-xs text-[var(--color-muted)]">{pr.reps} reps</p>
									</div>
								</div>
							</button>
						{/each}
					</div>
				</section>
			{/if}

			<!-- Volume & Muscle Group -->
			<section class="space-y-4">
				<div class="flex items-center gap-2">
					<Activity class="h-5 w-5 text-[var(--color-primary)]" />
					<h2 class="text-lg font-semibold text-[var(--color-foreground)]">Volume & Distribution</h2>
				</div>
				<VolumeTrendChart />
				<MuscleGroupChart />
			</section>
		{/if}
	</div>
</div>

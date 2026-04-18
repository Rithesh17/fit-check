<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { supabase } from '$lib/supabase/client';
	import { getExerciseById } from '$lib/data/exercises';
	import { calculateExerciseProgress, type ExerciseProgress } from '$lib/utils/progress';
	import VolumeTrendChart from '$lib/components/VolumeTrendChart.svelte';
	import MuscleGroupChart from '$lib/components/MuscleGroupChart.svelte';
	import { Activity, Dumbbell, Search, ChevronRight } from 'lucide-svelte';
	import { loadCustomExercises } from '$lib/services/exercises';

	type LiftCard = {
		id: string;
		name: string;
		progress: ExerciseProgress;
	};

	let isLoading = $state(true);
	let liftCards = $state<LiftCard[]>([]);
	let exerciseSearch = $state('');
	let showDropdown = $state(false);
	let searchInputEl = $state<HTMLInputElement | null>(null);

	const filteredExercises = $derived(
		exerciseSearch.trim() === ''
			? liftCards
			: liftCards.filter((c) =>
					c.name.toLowerCase().includes(exerciseSearch.toLowerCase().trim())
			  )
	);

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

			const exerciseIds = Array.from(exerciseMap.keys());
			exerciseIds.sort((a, b) => {
				const aLast = exerciseMap.get(a)?.at(-1)?.date ?? '';
				const bLast = exerciseMap.get(b)?.at(-1)?.date ?? '';
				return bLast.localeCompare(aLast);
			});

			const cards: LiftCard[] = [];
			for (const id of exerciseIds) {
				const exercise = getExerciseById(id) || customExercises.find((ce) => ce.id === id);
				if (!exercise) continue;
				const data = exerciseMap.get(id) || [];
				const progress = calculateExerciseProgress(id, exercise.name, data);
				if (progress.dates.length > 0) {
					cards.push({ id, name: exercise.name, progress });
				}
			}

			liftCards = cards;
		} catch (err) {
			console.error('Error loading progress data:', err);
		} finally {
			isLoading = false;
		}
	}

	function selectExercise(id: string) {
		showDropdown = false;
		exerciseSearch = '';
		goto(`/progress/${id}`);
	}

	function handleSearchBlur() {
		// Delay so click on dropdown item fires first
		setTimeout(() => { showDropdown = false; }, 150);
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
			<div class="space-y-4">
				<div class="fitness-card h-48 animate-pulse"></div>
				<div class="fitness-card h-48 animate-pulse"></div>
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
			<!-- Volume & Muscle Group charts -->
			<section class="space-y-4">
				<div class="flex items-center gap-2">
					<Activity class="h-5 w-5 text-[var(--color-primary)]" />
					<h2 class="text-lg font-semibold text-[var(--color-foreground)]">Volume & Distribution</h2>
				</div>
				<VolumeTrendChart />
				<MuscleGroupChart />
			</section>

			<!-- Exercise search -->
			<section>
				<div class="mb-3 flex items-center gap-2">
					<Search class="h-5 w-5 text-[var(--color-primary)]" />
					<h2 class="text-lg font-semibold text-[var(--color-foreground)]">Exercise Progress</h2>
				</div>
				<div class="relative">
					<div class="relative">
						<Search class="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-muted)]" />
						<input
							bind:this={searchInputEl}
							type="text"
							placeholder="Search exercises…"
							bind:value={exerciseSearch}
							onfocus={() => (showDropdown = true)}
							onblur={handleSearchBlur}
							class="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] py-3 pl-9 pr-4 text-[var(--color-foreground)] placeholder:text-[var(--color-muted)] focus:border-[var(--color-primary)] focus:outline-none"
						/>
					</div>
					{#if showDropdown && filteredExercises.length > 0}
						<ul class="absolute z-20 mt-1 max-h-64 w-full overflow-y-auto rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] shadow-lg">
							{#each filteredExercises as ex}
								<li>
									<button
										onmousedown={() => selectExercise(ex.id)}
										class="flex w-full items-center justify-between px-4 py-3 text-left hover:bg-[var(--color-border)]/40"
									>
										<span class="font-medium text-[var(--color-foreground)]">{ex.name}</span>
										<ChevronRight class="h-4 w-4 text-[var(--color-muted)]" />
									</button>
								</li>
							{/each}
						</ul>
					{:else if showDropdown && exerciseSearch.trim() !== '' && filteredExercises.length === 0}
						<div class="absolute z-20 mt-1 w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] px-4 py-3 text-sm text-[var(--color-muted)] shadow-lg">
							No exercises found
						</div>
					{/if}
				</div>
			</section>
		{/if}
	</div>
</div>

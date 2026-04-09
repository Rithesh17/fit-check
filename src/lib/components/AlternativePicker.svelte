<script lang="ts">
	import type { ActiveWorkoutSlot, ActiveSlotAlternative } from '$lib/stores/active-workout';
	import { Check, RefreshCw } from 'lucide-svelte';

	interface Props {
		slot: ActiveWorkoutSlot;
		slotNumber: number;
		totalSlots: number;
		previousData: Record<string, Array<{ reps: number; weight: number }>>;
		unit: 'kg' | 'lbs';
		onChoose: (index: number) => void;
	}

	let { slot, slotNumber, totalSlots, previousData, unit, onChoose }: Props = $props();

	function getLastHint(alt: ActiveSlotAlternative): string | null {
		const prev = previousData[alt.exerciseId];
		if (!prev || prev.length === 0) return null;
		const last = prev[0];
		if (!last) return null;
		if (alt.exerciseType === 'weights' || alt.exerciseType === 'bodyweight') {
			if (last.weight > 0) return `${last.weight}${unit} × ${last.reps}`;
			if (last.reps > 0) return `${last.reps} reps`;
		}
		return null;
	}
</script>

<div class="fixed inset-0 z-40 flex flex-col bg-[var(--color-background)]">
	<div class="border-b border-[var(--color-border)] px-4 py-5">
		<p class="mb-1 text-xs font-semibold uppercase tracking-widest text-[var(--color-primary)]">
			Slot {slotNumber} of {totalSlots}
		</p>
		<h2 class="text-xl font-bold text-[var(--color-foreground)]">Choose exercise</h2>
		<p class="mt-1 text-sm text-[var(--color-muted)]">Pick what you'll do for this slot</p>
	</div>

	<!-- Options -->
	<div class="flex-1 overflow-y-auto px-4 py-5 space-y-3">
		{#each slot.alternatives as alt, i}
			{@const hint = getLastHint(alt)}
			<button
				onclick={() => onChoose(i)}
				class="fitness-card w-full text-left transition-all hover:border-[var(--color-primary)]/60 active:scale-[0.98]"
			>
				<div class="flex items-center justify-between">
					<div class="min-w-0 flex-1">
						<div class="flex items-center gap-2">
							{#if i === 0}
								<span class="rounded-full bg-[var(--color-primary)]/15 px-2 py-0.5 text-xs font-medium text-[var(--color-primary)]">
									Primary
								</span>
							{:else}
								<span class="rounded-full bg-[var(--color-card-hover)] px-2 py-0.5 text-xs text-[var(--color-muted)]">
									Alt {i}
								</span>
							{/if}
							<p class="font-semibold text-[var(--color-foreground)]">{alt.exerciseName ?? alt.exerciseId}</p>
						</div>
						{#if hint}
							<p class="mt-1 flex items-center gap-1 text-xs text-[var(--color-muted)]">
								<RefreshCw class="h-3 w-3" />
								Last: {hint}
							</p>
						{:else}
							<p class="mt-1 text-xs text-[var(--color-muted)]">No previous data</p>
						{/if}
					</div>
					<div class="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full border border-[var(--color-border)] text-[var(--color-muted)]">
						<Check class="h-4 w-4" />
					</div>
				</div>
			</button>
		{/each}
	</div>
</div>

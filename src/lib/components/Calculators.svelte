<script lang="ts">
	import { Calculator, TrendingUp, Weight, BarChart3 } from 'lucide-svelte';
	import {
		calculate1RM,
		calculateWorkingWeight,
		calculatePlates,
		type PlateCalculation,
		calculateTotalVolume,
		getRPEDescription
	} from '$lib/utils/calculators';

	let activeTab = $state<'1rm' | 'plates' | 'volume'>('1rm');

	// 1RM Calculator
	let oneRMWeight = $state('');
	let oneRMReps = $state('');
	let oneRMResult = $derived(() => {
		const weight = parseFloat(oneRMWeight);
		const reps = parseInt(oneRMReps);
		if (weight > 0 && reps > 0) {
			return calculate1RM(weight, reps);
		}
		return null;
	});

	// Plate Calculator
	let plateTargetWeight = $state('');
	let plateBarWeight = $state('20');
	let plateResult = $derived<PlateCalculation | null>(() => {
		const weight = parseFloat(plateTargetWeight);
		const bar = parseFloat(plateBarWeight);
		if (weight > 0 && bar >= 0) {
			return calculatePlates(weight, bar);
		}
		return null;
	});

	// Volume Calculator
	let volumeSets = $state<Array<{ weight: string; reps: string }>>([{ weight: '', reps: '' }]);
	let volumeResult = $derived(() => {
		const sets = volumeSets
			.map((s) => ({
				weight: parseFloat(s.weight) || 0,
				reps: parseInt(s.reps) || 0
			}))
			.filter((s) => s.weight > 0 && s.reps > 0);

		if (sets.length > 0) {
			return calculateTotalVolume(sets);
		}
		return null;
	});

	function addVolumeSet() {
		volumeSets = [...volumeSets, { weight: '', reps: '' }];
	}

	function removeVolumeSet(index: number) {
		volumeSets = volumeSets.filter((_, i) => i !== index);
	}
</script>

<div class="calculators-container space-y-6">
	<!-- Tab Navigation -->
	<div class="flex gap-2 border-b border-[var(--color-border)]">
		<button
			onclick={() => (activeTab = '1rm')}
			class="flex-1 px-4 py-3 font-semibold transition-colors {activeTab === '1rm'
				? 'text-[var(--color-primary)] border-b-2 border-[var(--color-primary)]'
				: 'text-[var(--color-muted)] hover:text-[var(--color-foreground)]'}"
		>
			<TrendingUp class="w-4 h-4 inline mr-2" />
			1RM
		</button>
		<button
			onclick={() => (activeTab = 'plates')}
			class="flex-1 px-4 py-3 font-semibold transition-colors {activeTab === 'plates'
				? 'text-[var(--color-primary)] border-b-2 border-[var(--color-primary)]'
				: 'text-[var(--color-muted)] hover:text-[var(--color-foreground)]'}"
		>
			<Weight class="w-4 h-4 inline mr-2" />
			Plates
		</button>
		<button
			onclick={() => (activeTab = 'volume')}
			class="flex-1 px-4 py-3 font-semibold transition-colors {activeTab === 'volume'
				? 'text-[var(--color-primary)] border-b-2 border-[var(--color-primary)]'
				: 'text-[var(--color-muted)] hover:text-[var(--color-foreground)]'}"
		>
			<BarChart3 class="w-4 h-4 inline mr-2" />
			Volume
		</button>
	</div>

	<!-- 1RM Calculator -->
	{#if activeTab === '1rm'}
		<div class="fitness-card space-y-4">
			<h3 class="text-lg font-bold text-[var(--color-foreground)]">1RM Calculator</h3>
			<p class="text-sm text-[var(--color-muted)]">
				Enter your weight and reps to calculate your estimated one-rep max using the Epley formula.
			</p>

			<div class="space-y-4">
				<div>
					<label for="1rm-weight" class="block text-sm font-semibold text-[var(--color-muted)] mb-2">
						Weight (kg)
					</label>
					<input
						id="1rm-weight"
						type="number"
						step="0.5"
						bind:value={oneRMWeight}
						placeholder="e.g., 80"
						class="w-full px-4 py-3 bg-[var(--color-card-hover)] border border-[var(--color-border)] rounded-lg text-[var(--color-foreground)] focus:outline-none focus:border-[var(--color-primary)]"
					/>
				</div>

				<div>
					<label for="1rm-reps" class="block text-sm font-semibold text-[var(--color-muted)] mb-2">
						Reps
					</label>
					<input
						id="1rm-reps"
						type="number"
						bind:value={oneRMReps}
						placeholder="e.g., 5"
						class="w-full px-4 py-3 bg-[var(--color-card-hover)] border border-[var(--color-border)] rounded-lg text-[var(--color-foreground)] focus:outline-none focus:border-[var(--color-primary)]"
					/>
				</div>

				{#if oneRMResult !== null}
					<div class="p-4 bg-[var(--color-primary)]/20 border border-[var(--color-primary)] rounded-lg">
						<div class="text-sm text-[var(--color-muted)] mb-1">Estimated 1RM</div>
						<div class="text-3xl font-bold text-[var(--color-primary)]">{oneRMResult} kg</div>
					</div>

					<!-- Working Weight Percentages -->
					<div class="space-y-2">
						<div class="text-sm font-semibold text-[var(--color-foreground)]">Working Weights:</div>
						<div class="grid grid-cols-2 gap-2">
							{#each [90, 85, 80, 75, 70, 65, 60] as percentage}
								{@const weight = calculateWorkingWeight(oneRMResult, percentage)}
								<div class="p-2 bg-[var(--color-card-hover)] rounded text-center">
									<div class="text-xs text-[var(--color-muted)]">{percentage}%</div>
									<div class="text-sm font-semibold text-[var(--color-foreground)]">{weight} kg</div>
								</div>
							{/each}
						</div>
					</div>
				{/if}
			</div>
		</div>
	{/if}

	<!-- Plate Calculator -->
	{#if activeTab === 'plates'}
		<div class="fitness-card space-y-4">
			<h3 class="text-lg font-bold text-[var(--color-foreground)]">Plate Calculator</h3>
			<p class="text-sm text-[var(--color-muted)]">
				Calculate which plates you need to load for your target weight.
			</p>

			<div class="space-y-4">
				<div>
					<label for="plate-weight" class="block text-sm font-semibold text-[var(--color-muted)] mb-2">
						Target Weight (kg)
					</label>
					<input
						id="plate-weight"
						type="number"
						step="0.5"
						bind:value={plateTargetWeight}
						placeholder="e.g., 100"
						class="w-full px-4 py-3 bg-[var(--color-card-hover)] border border-[var(--color-border)] rounded-lg text-[var(--color-foreground)] focus:outline-none focus:border-[var(--color-primary)]"
					/>
				</div>

				<div>
					<label for="plate-bar" class="block text-sm font-semibold text-[var(--color-muted)] mb-2">
						Bar Weight (kg)
					</label>
					<input
						id="plate-bar"
						type="number"
						step="0.5"
						bind:value={plateBarWeight}
						placeholder="20"
						class="w-full px-4 py-3 bg-[var(--color-card-hover)] border border-[var(--color-border)] rounded-lg text-[var(--color-foreground)] focus:outline-none focus:border-[var(--color-primary)]"
					/>
				</div>

				{#if plateResult}
					<div class="space-y-4">
						<div class="p-4 bg-[var(--color-primary)]/20 border border-[var(--color-primary)] rounded-lg">
							<div class="text-sm text-[var(--color-muted)] mb-1">Total Weight</div>
							<div class="text-2xl font-bold text-[var(--color-primary)]">
								{plateResult.totalWeight} kg
							</div>
							{#if Math.abs(plateResult.totalWeight - plateResult.weight) > 0.1}
								<div class="text-xs text-[var(--color-muted)] mt-1">
									(Target: {plateResult.weight} kg)
								</div>
							{/if}
						</div>

						{#if plateResult.plates.length > 0}
							<div>
								<div class="text-sm font-semibold text-[var(--color-foreground)] mb-2">
									Plates per side:
								</div>
								<div class="flex flex-wrap gap-2">
									{#each plateResult.plates as plate}
										<div class="px-3 py-2 bg-[var(--color-card-hover)] rounded-lg text-center">
											<div class="text-lg font-bold text-[var(--color-foreground)]">
												{plate.weight} kg
											</div>
											<div class="text-xs text-[var(--color-muted)]">
												× {plate.count}
											</div>
										</div>
									{/each}
								</div>
							</div>
						{:else if parseFloat(plateTargetWeight) > 0}
							<div class="p-3 bg-[var(--color-card-hover)] rounded-lg text-sm text-[var(--color-muted)]">
								Bar only ({plateBarWeight} kg)
							</div>
						{/if}
					</div>
				{/if}
			</div>
		</div>
	{/if}

	<!-- Volume Calculator -->
	{#if activeTab === 'volume'}
		<div class="fitness-card space-y-4">
			<h3 class="text-lg font-bold text-[var(--color-foreground)]">Volume Calculator</h3>
			<p class="text-sm text-[var(--color-muted)]">
				Calculate total volume (weight × reps) for multiple sets.
			</p>

			<div class="space-y-3">
				{#each volumeSets as set, index}
					<div class="flex items-center gap-2">
						<span class="text-sm text-[var(--color-muted)] w-12">Set {index + 1}</span>
						<input
							type="number"
							step="0.5"
							bind:value={set.weight}
							placeholder="Weight"
							class="flex-1 px-3 py-2 bg-[var(--color-card-hover)] border border-[var(--color-border)] rounded text-[var(--color-foreground)] focus:outline-none focus:border-[var(--color-primary)]"
						/>
						<span class="text-[var(--color-muted)]">×</span>
						<input
							type="number"
							bind:value={set.reps}
							placeholder="Reps"
							class="flex-1 px-3 py-2 bg-[var(--color-card-hover)] border border-[var(--color-border)] rounded text-[var(--color-foreground)] focus:outline-none focus:border-[var(--color-primary)]"
						/>
						<span class="text-[var(--color-muted)] text-sm">kg</span>
						{#if volumeSets.length > 1}
							<button
								onclick={() => removeVolumeSet(index)}
								class="p-2 text-[var(--color-danger)] hover:bg-[var(--color-danger)]/10 rounded transition-colors"
								title="Remove set"
							>
								×
							</button>
						{/if}
					</div>
				{/each}

				<button
					onclick={addVolumeSet}
					class="w-full py-2 text-sm text-[var(--color-primary)] hover:text-[var(--color-foreground)] font-medium border border-[var(--color-border)] rounded-lg hover:border-[var(--color-primary)] transition-colors"
				>
					+ Add Set
				</button>

				{#if volumeResult !== null}
					<div class="p-4 bg-[var(--color-accent)]/20 border border-[var(--color-accent)] rounded-lg">
						<div class="text-sm text-[var(--color-muted)] mb-1">Total Volume</div>
						<div class="text-3xl font-bold text-[var(--color-accent)]">{volumeResult} kg</div>
					</div>
				{/if}
			</div>
		</div>
	{/if}
</div>

<style>
	.calculators-container {
		max-width: 600px;
		margin: 0 auto;
	}
</style>

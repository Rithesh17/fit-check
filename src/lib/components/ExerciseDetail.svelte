<script lang="ts">
	import { X, Play, Info, Target, Dumbbell, Clock, Edit, History } from 'lucide-svelte';
	import type { Exercise } from '$lib/data/exercises';
	import { exercises } from '$lib/data/exercises';
	import ExerciseHistory from './ExerciseHistory.svelte';

	interface Props {
		exercise: Exercise | null;
		onClose: () => void;
		onEdit?: (exercise: Exercise) => void;
	}

	let { exercise, onClose, onEdit }: Props = $props();

	let showHistory = $state(false);

	const isDefaultExercise = $derived(
		exercise ? exercises.some((e) => e.id === exercise.id) : false
	);

	function getYouTubeEmbedUrl(url: string | undefined): string | null {
		if (!url) return null;
		
		// Handle different YouTube URL formats
		const patterns = [
			/youtube\.com\/watch\?v=([a-zA-Z0-9_-]+)/,
			/youtu\.be\/([a-zA-Z0-9_-]+)/,
			/youtube\.com\/embed\/([a-zA-Z0-9_-]+)/
		];

		for (const pattern of patterns) {
			const match = url.match(pattern);
			if (match && match[1]) {
				return `https://www.youtube.com/embed/${match[1]}`;
			}
		}

		// If it's already an embed URL or just an ID
		if (url.includes('embed/')) return url;
		if (/^[a-zA-Z0-9_-]+$/.test(url)) {
			return `https://www.youtube.com/embed/${url}`;
		}

		return null;
	}

	const embedUrl = $derived(getYouTubeEmbedUrl(exercise?.videoUrl));
</script>

{#if exercise}
	<!-- Backdrop -->
	<div
		class="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
		role="button"
		tabindex="0"
		onclick={onClose}
		onkeydown={(e) => {
			if (e.key === 'Escape' || e.key === 'Enter' || e.key === ' ') {
				e.preventDefault();
				onClose();
			}
		}}
	>
		<!-- Modal Content -->
		<div
			class="w-full max-w-2xl max-h-[85vh] bg-[var(--color-card)] rounded-2xl overflow-hidden flex flex-col shadow-2xl"
			role="dialog"
			aria-modal="true"
			aria-label="Exercise details"
			onclick={(e) => e.stopPropagation()}
			onkeydown={(e) => e.stopPropagation()}
		>
			<!-- Header -->
			<div class="flex items-center justify-between p-6 border-b border-[var(--color-border)]">
				<h2 class="text-2xl font-bold text-[var(--color-foreground)]">{exercise.name}</h2>
				<div class="flex items-center gap-2">
					<button
						onclick={() => (showHistory = true)}
						class="p-2 text-[var(--color-secondary)] hover:bg-[var(--color-secondary)]/10 transition-colors rounded-lg"
						title="View history"
					>
						<History class="w-5 h-5" />
					</button>
					{#if onEdit}
						<button
							onclick={() => {
								if (exercise && onEdit) {
									onEdit(exercise);
									onClose();
								}
							}}
							class="p-2 text-[var(--color-primary)] hover:bg-[var(--color-primary)]/10 transition-colors rounded-lg"
							title="Edit exercise"
						>
							<Edit class="w-5 h-5" />
						</button>
					{/if}
					<button
						onclick={onClose}
						class="p-2 text-[var(--color-muted)] hover:text-[var(--color-foreground)] transition-colors rounded-lg hover:bg-[var(--color-card-hover)]"
						title="Close"
					>
						<X class="w-6 h-6" />
					</button>
				</div>
			</div>

			<!-- Content (Scrollable) -->
			<div class="flex-1 overflow-y-auto scrollbar-hide">
				<div class="p-6 pb-8 space-y-6">
					<!-- Video Section -->
					{#if embedUrl}
						<div class="aspect-video w-full rounded-lg overflow-hidden bg-[var(--color-background)]">
							<iframe
								src={embedUrl}
								title="{exercise.name} demonstration"
								class="w-full h-full"
								allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
								allowfullscreen
							></iframe>
						</div>
					{:else}
						<div class="aspect-video w-full rounded-lg bg-[var(--color-card-hover)] flex items-center justify-center border border-[var(--color-border)]">
							<div class="text-center">
								<Play class="w-12 h-12 text-[var(--color-muted)] mx-auto mb-2 opacity-50" />
								<p class="text-sm text-[var(--color-muted)]">No video available</p>
							</div>
						</div>
					{/if}

					<!-- Quick Info Grid -->
					<div class="grid grid-cols-2 md:grid-cols-4 gap-4">
						<!-- Equipment -->
						<div class="fitness-card p-4">
							<div class="flex items-center gap-2 mb-2">
								<Dumbbell class="w-4 h-4 text-[var(--color-primary)]" />
								<span class="text-xs font-semibold text-[var(--color-muted)]">Equipment</span>
							</div>
							<p class="text-sm font-semibold text-[var(--color-foreground)]">{exercise.equipment}</p>
						</div>

						<!-- Sets -->
						<div class="fitness-card p-4">
							<div class="flex items-center gap-2 mb-2">
								<Info class="w-4 h-4 text-[var(--color-secondary)]" />
								<span class="text-xs font-semibold text-[var(--color-muted)]">Sets</span>
							</div>
							<p class="text-sm font-semibold text-[var(--color-foreground)]">{exercise.defaultSets}</p>
						</div>

						<!-- Reps -->
						<div class="fitness-card p-4">
							<div class="flex items-center gap-2 mb-2">
								<Target class="w-4 h-4 text-[var(--color-accent)]" />
								<span class="text-xs font-semibold text-[var(--color-muted)]">Reps</span>
							</div>
							<p class="text-sm font-semibold text-[var(--color-foreground)]">{exercise.defaultReps}</p>
						</div>

						<!-- Rest -->
						<div class="fitness-card p-4">
							<div class="flex items-center gap-2 mb-2">
								<Clock class="w-4 h-4 text-[var(--color-primary)]" />
								<span class="text-xs font-semibold text-[var(--color-muted)]">Rest</span>
							</div>
							<p class="text-sm font-semibold text-[var(--color-foreground)]">
								{Math.floor(exercise.defaultRestSeconds / 60)}m {exercise.defaultRestSeconds % 60}s
							</p>
						</div>
					</div>

					<!-- Muscle Groups -->
					<div>
						<h3 class="text-lg font-semibold text-[var(--color-foreground)] mb-3">Muscle Groups</h3>
						<div class="flex flex-wrap gap-2">
							{#each exercise.muscleGroups as muscleGroup}
								<span class="px-3 py-1.5 bg-[var(--color-primary)]/20 text-[var(--color-primary)] text-sm font-medium rounded-full">
									{muscleGroup}
								</span>
							{/each}
						</div>
					</div>

					<!-- Instructions -->
					{#if exercise.instructions}
						<div>
							<h3 class="text-lg font-semibold text-[var(--color-foreground)] mb-3">Instructions</h3>
							<div class="fitness-card">
								<p class="text-sm text-[var(--color-foreground)] whitespace-pre-line leading-relaxed">
									{exercise.instructions}
								</p>
							</div>
						</div>
					{/if}

					<!-- Form Tips (Placeholder for future enhancement) -->
					<div>
						<h3 class="text-lg font-semibold text-[var(--color-foreground)] mb-3">Form Tips</h3>
						<div class="fitness-card">
							<p class="text-sm text-[var(--color-muted)] italic">
								Form tips coming soon. Focus on proper form and controlled movements.
							</p>
						</div>
					</div>
				</div>
			</div>
		</div>
	</div>
{/if}

<!-- Exercise History Modal -->
{#if showHistory && exercise}
	<ExerciseHistory exercise={exercise} onClose={() => (showHistory = false)} />
{/if}

<style>
	.fitness-card {
		background: var(--color-card);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-lg);
		transition: all var(--transition-normal);
	}

	.scrollbar-hide {
		-ms-overflow-style: none; /* IE and Edge */
		scrollbar-width: none; /* Firefox */
	}

	.scrollbar-hide::-webkit-scrollbar {
		display: none; /* Chrome, Safari and Opera */
	}
</style>

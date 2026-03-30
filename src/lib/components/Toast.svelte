<script lang="ts">
	import { toast } from '$lib/stores/toast';
	import { X } from 'lucide-svelte';
</script>

<div class="toast-container" aria-live="polite" aria-atomic="false">
	{#each $toast as t (t.id)}
		<div
			class="toast toast--{t.type}"
			role={t.type === 'error' ? 'alert' : 'status'}
		>
			<span class="toast__message">{t.message}</span>
			<button
				onclick={() => toast.remove(t.id)}
				class="toast__close"
				aria-label="Dismiss"
			>
				<X class="w-4 h-4" />
			</button>
		</div>
	{/each}
</div>

<style>
	.toast-container {
		position: fixed;
		bottom: 5rem; /* above bottom nav */
		left: 50%;
		transform: translateX(-50%);
		z-index: 9999;
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		width: min(calc(100vw - 2rem), 400px);
		pointer-events: none;
	}

	.toast {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 0.75rem;
		padding: 0.875rem 1rem;
		border-radius: var(--radius-lg, 0.75rem);
		font-size: 0.875rem;
		font-weight: 500;
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
		pointer-events: auto;
		animation: slideUp 0.2s ease;
	}

	@keyframes slideUp {
		from {
			opacity: 0;
			transform: translateY(0.5rem);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	.toast--success {
		background: #14532d;
		border: 1px solid #16a34a;
		color: #86efac;
	}

	.toast--error {
		background: #450a0a;
		border: 1px solid #dc2626;
		color: #fca5a5;
	}

	.toast--info {
		background: var(--color-card);
		border: 1px solid var(--color-border);
		color: var(--color-foreground);
	}

	.toast__message {
		flex: 1;
	}

	.toast__close {
		flex-shrink: 0;
		opacity: 0.7;
		cursor: pointer;
		background: none;
		border: none;
		color: inherit;
		padding: 0;
		display: flex;
		align-items: center;
	}

	.toast__close:hover {
		opacity: 1;
	}
</style>

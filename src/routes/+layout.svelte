<script>
	import { onMount } from 'svelte';
	import { onNavigate } from '$app/navigation';
	import BottomNav from '$lib/components/BottomNav.svelte';
	import SyncStatus from '$lib/components/SyncStatus.svelte';
	import { initOfflineStorage } from '$lib/storage/offline';
	import { initSyncProcessing } from '$lib/storage/sync';
	import '$lib/index.css';

	let { data, children } = $props();

	// Initialize offline storage and sync processing
	onMount(async () => {
		await initOfflineStorage();
		await initSyncProcessing();
	});

	// Disable view transitions for smoother scroll animations
	onNavigate(() => {
		window.scrollTo(0, 0);
	});
</script>

<SyncStatus />
<main class="min-h-screen bg-[var(--color-background)]">
	{@render children()}
</main>

<BottomNav />

<style>
	:global(body) {
		background-color: var(--color-background);
		font-family:
			-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans',
			'Helvetica Neue', sans-serif;
		margin: 0;
		padding: 0;
	}

	:global(*) {
		box-sizing: border-box;
	}

	/* Fix mobile menu button padding - try multiple selectors */
	:global(nav button:last-child) {
		padding-right: 1rem !important;
	}

	:global(.mobile-menu-button) {
		padding-right: 1rem !important;
	}

	@media (max-width: 768px) {
		:global(nav button[aria-label*='menu']) {
			padding-right: 1rem !important;
		}
	}
</style>

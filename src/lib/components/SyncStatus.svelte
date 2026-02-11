<script lang="ts">
	import { subscribeToSyncStatus, processSyncQueue, type SyncStatus } from '$lib/storage/sync';
	import { Cloud, CloudOff, RefreshCw, CheckCircle, AlertCircle } from 'lucide-svelte';

	let syncStatus = $state<SyncStatus>({
		isSyncing: false,
		lastSyncTime: null,
		pendingItems: 0,
		errors: []
	});

	// Subscribe to sync status updates
	$effect(() => {
		const unsubscribe = subscribeToSyncStatus((status) => {
			syncStatus = status;
		});
		return unsubscribe;
	});

	function handleManualSync() {
		processSyncQueue();
	}

	function formatLastSync(): string {
		if (!syncStatus.lastSyncTime) return 'Never';
		const diff = Date.now() - syncStatus.lastSyncTime;
		const minutes = Math.floor(diff / 60000);
		if (minutes < 1) return 'Just now';
		if (minutes === 1) return '1 minute ago';
		if (minutes < 60) return `${minutes} minutes ago`;
		const hours = Math.floor(minutes / 60);
		if (hours === 1) return '1 hour ago';
		return `${hours} hours ago`;
	}
</script>

{#if syncStatus.pendingItems > 0 || syncStatus.isSyncing || syncStatus.errors.length > 0}
	<div class="sync-status-bar">
		<div class="flex items-center gap-2">
			{#if syncStatus.isSyncing}
				<RefreshCw class="w-4 h-4 text-[var(--color-primary)] animate-spin" />
				<span class="text-sm text-[var(--color-foreground)]">
					Syncing {syncStatus.pendingItems} item{syncStatus.pendingItems !== 1 ? 's' : ''}...
				</span>
			{:else if syncStatus.pendingItems > 0}
				<CloudOff class="w-4 h-4 text-[var(--color-muted)]" />
				<span class="text-sm text-[var(--color-muted)]">
					{syncStatus.pendingItems} item{syncStatus.pendingItems !== 1 ? 's' : ''} pending sync
				</span>
				<button
					onclick={handleManualSync}
					class="text-xs text-[var(--color-primary)] hover:underline"
					title="Sync now"
				>
					Sync
				</button>
			{:else if syncStatus.errors.length > 0}
				<AlertCircle class="w-4 h-4 text-[var(--color-danger)]" />
				<span class="text-sm text-[var(--color-danger)]">
					Sync errors ({syncStatus.errors.length})
				</span>
			{:else if syncStatus.lastSyncTime}
				<CheckCircle class="w-4 h-4 text-[var(--color-accent)]" />
				<span class="text-xs text-[var(--color-muted)]">{formatLastSync()}</span>
			{/if}
		</div>
	</div>
{/if}

<style>
	.sync-status-bar {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		z-index: 100;
		background: var(--color-card);
		border-bottom: 1px solid var(--color-border);
		padding: 0.5rem 1rem;
		display: flex;
		align-items: center;
		justify-content: center;
	}
</style>

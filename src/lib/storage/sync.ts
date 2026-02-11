/**
 * Offline Sync Processing
 * Handles syncing queued operations with Supabase when online
 */

import { supabase } from '$lib/supabase/client';
import {
	getSyncQueue,
	removeFromSyncQueue,
	type SyncItem
} from './offline';

export interface SyncStatus {
	isSyncing: boolean;
	lastSyncTime: number | null;
	pendingItems: number;
	errors: string[];
}

let syncStatus: SyncStatus = {
	isSyncing: false,
	lastSyncTime: null,
	pendingItems: 0,
	errors: []
};

const syncStatusListeners: Set<(status: SyncStatus) => void> = new Set();

/**
 * Subscribe to sync status updates
 */
export function subscribeToSyncStatus(callback: (status: SyncStatus) => void): () => void {
	syncStatusListeners.add(callback);
	callback(syncStatus); // Call immediately with current status
	
	return () => {
		syncStatusListeners.delete(callback);
	};
}

/**
 * Notify all listeners of sync status change
 */
function notifySyncStatus() {
	syncStatusListeners.forEach((callback) => callback(syncStatus));
}

/**
 * Update sync status
 */
function updateSyncStatus(updates: Partial<SyncStatus>) {
	syncStatus = { ...syncStatus, ...updates };
	notifySyncStatus();
}

/**
 * Process sync queue when online
 */
export async function processSyncQueue(): Promise<void> {
	if (syncStatus.isSyncing) {
		return; // Already syncing
	}

	if (!navigator.onLine) {
		return; // Not online
	}

	const queue = await getSyncQueue();
	if (queue.length === 0) {
		updateSyncStatus({ pendingItems: 0 });
		return;
	}

	updateSyncStatus({ isSyncing: true, pendingItems: queue.length, errors: [] });

	try {
		// Sort by timestamp (oldest first)
		const sortedQueue = [...queue].sort((a, b) => a.timestamp - b.timestamp);
		const errors: string[] = [];

		for (const item of sortedQueue) {
			try {
				await processSyncItem(item);
				await removeFromSyncQueue(item.id);
			} catch (error) {
				const errorMessage = error instanceof Error ? error.message : 'Unknown error';
				errors.push(`Failed to sync ${item.type}: ${errorMessage}`);
				console.error('Sync error:', error);
				// Continue with next item instead of stopping
			}
		}

		const remainingQueue = await getSyncQueue();
		updateSyncStatus({
			isSyncing: false,
			lastSyncTime: Date.now(),
			pendingItems: remainingQueue.length,
			errors: errors.length > 0 ? errors : []
		});
	} catch (error) {
		console.error('Sync queue processing failed:', error);
		updateSyncStatus({
			isSyncing: false,
			errors: [error instanceof Error ? error.message : 'Unknown error']
		});
	}
}

/**
 * Process a single sync item
 */
async function processSyncItem(item: SyncItem): Promise<void> {
	switch (item.type) {
		case 'workout':
			await syncWorkout(item);
			break;
		case 'workout_exercise':
			await syncWorkoutExercise(item);
			break;
		case 'body_metric':
			await syncBodyMetric(item);
			break;
		default:
			throw new Error(`Unknown sync item type: ${item.type}`);
	}
}

/**
 * Sync workout
 */
async function syncWorkout(item: SyncItem): Promise<void> {
	const { operation, data } = item;

	switch (operation) {
		case 'create': {
			const { error } = await supabase.from('workouts').insert(data);
			if (error) throw error;
			break;
		}
		case 'update': {
			const { error } = await supabase.from('workouts').update(data).eq('id', data.id);
			if (error) throw error;
			break;
		}
		case 'delete': {
			const { error } = await supabase.from('workouts').delete().eq('id', data.id);
			if (error) throw error;
			break;
		}
	}
}

/**
 * Sync workout exercise
 */
async function syncWorkoutExercise(item: SyncItem): Promise<void> {
	const { operation, data } = item;

	switch (operation) {
		case 'create': {
			const { error } = await supabase.from('workout_exercises').insert(data);
			if (error) throw error;
			break;
		}
		case 'update': {
			const { error } = await supabase
				.from('workout_exercises')
				.update(data)
				.eq('id', data.id);
			if (error) throw error;
			break;
		}
		case 'delete': {
			const { error } = await supabase.from('workout_exercises').delete().eq('id', data.id);
			if (error) throw error;
			break;
		}
	}
}

/**
 * Sync body metric
 */
async function syncBodyMetric(item: SyncItem): Promise<void> {
	const { operation, data } = item;

	switch (operation) {
		case 'create': {
			const { error } = await supabase.from('body_metrics').insert(data);
			if (error) throw error;
			break;
		}
		case 'update': {
			const { error } = await supabase.from('body_metrics').update(data).eq('id', data.id);
			if (error) throw error;
			break;
		}
		case 'delete': {
			const { error } = await supabase.from('body_metrics').delete().eq('id', data.id);
			if (error) throw error;
			break;
		}
	}
}

/**
 * Initialize sync processing
 * Sets up online/offline listeners and processes queue
 */
export async function initSyncProcessing(): Promise<void> {
	// Process queue when coming online
	window.addEventListener('online', () => {
		console.log('🌐 Online - processing sync queue');
		processSyncQueue();
	});

	// Process queue on initial load if online
	if (navigator.onLine) {
		// Wait a bit for Supabase to be ready
		setTimeout(() => {
			processSyncQueue();
		}, 1000);
	}

	// Periodically check and process queue (every 30 seconds when online)
	setInterval(() => {
		if (navigator.onLine && !syncStatus.isSyncing) {
			processSyncQueue();
		}
	}, 30000);

	// Update pending items count
	const queue = await getSyncQueue();
	updateSyncStatus({ pendingItems: queue.length });
}

/**
 * Get current sync status
 */
export function getSyncStatus(): SyncStatus {
	return { ...syncStatus };
}

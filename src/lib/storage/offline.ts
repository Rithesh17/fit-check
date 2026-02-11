/**
 * Offline Storage using IndexedDB
 * Syncs with Supabase when online
 */

const DB_NAME = 'fit-check-db';
const DB_VERSION = 1;
const STORES = {
	WORKOUTS: 'workouts',
	WORKOUT_EXERCISES: 'workout_exercises',
	BODY_METRICS: 'body_metrics',
	SYNC_QUEUE: 'sync_queue'
} as const;

let db: IDBDatabase | null = null;

export interface SyncItem {
	id: string;
	type: 'workout' | 'workout_exercise' | 'body_metric';
	operation: 'create' | 'update' | 'delete';
	data: any;
	timestamp: number;
}

/**
 * Initialize IndexedDB
 */
export async function initOfflineDB(): Promise<IDBDatabase> {
	return new Promise((resolve, reject) => {
		const request = indexedDB.open(DB_NAME, DB_VERSION);

		request.onerror = () => reject(request.error);
		request.onsuccess = () => {
			db = request.result;
			resolve(db);
		};

		request.onupgradeneeded = (event) => {
			const db = (event.target as IDBOpenDBRequest).result;

			// Create object stores
			if (!db.objectStoreNames.contains(STORES.WORKOUTS)) {
				const workoutStore = db.createObjectStore(STORES.WORKOUTS, { keyPath: 'id' });
				workoutStore.createIndex('date', 'date', { unique: false });
			}

			if (!db.objectStoreNames.contains(STORES.WORKOUT_EXERCISES)) {
				const exerciseStore = db.createObjectStore(STORES.WORKOUT_EXERCISES, { keyPath: 'id' });
				exerciseStore.createIndex('workout_id', 'workout_id', { unique: false });
			}

			if (!db.objectStoreNames.contains(STORES.BODY_METRICS)) {
				const metricsStore = db.createObjectStore(STORES.BODY_METRICS, { keyPath: 'id' });
				metricsStore.createIndex('date', 'date', { unique: true });
			}

			if (!db.objectStoreNames.contains(STORES.SYNC_QUEUE)) {
				const syncStore = db.createObjectStore(STORES.SYNC_QUEUE, { keyPath: 'id', autoIncrement: true });
				syncStore.createIndex('timestamp', 'timestamp', { unique: false });
			}
		};
	});
}

/**
 * Get database instance
 */
async function getDB(): Promise<IDBDatabase> {
	if (db) return db;
	return await initOfflineDB();
}

/**
 * Save workout to IndexedDB
 */
export async function saveWorkoutOffline(workout: any): Promise<void> {
	const database = await getDB();
	return new Promise((resolve, reject) => {
		const transaction = database.transaction([STORES.WORKOUTS], 'readwrite');
		const store = transaction.objectStore(STORES.WORKOUTS);
		const request = store.put(workout);

		request.onsuccess = () => resolve();
		request.onerror = () => reject(request.error);
	});
}

/**
 * Get workouts from IndexedDB
 */
export async function getWorkoutsOffline(): Promise<any[]> {
	const database = await getDB();
	return new Promise((resolve, reject) => {
		const transaction = database.transaction([STORES.WORKOUTS], 'readonly');
		const store = transaction.objectStore(STORES.WORKOUTS);
		const request = store.getAll();

		request.onsuccess = () => resolve(request.result || []);
		request.onerror = () => reject(request.error);
	});
}

/**
 * Save body metric to IndexedDB
 */
export async function saveBodyMetricOffline(metric: any): Promise<void> {
	const database = await getDB();
	return new Promise((resolve, reject) => {
		const transaction = database.transaction([STORES.BODY_METRICS], 'readwrite');
		const store = transaction.objectStore(STORES.BODY_METRICS);
		const request = store.put(metric);

		request.onsuccess = () => resolve();
		request.onerror = () => reject(request.error);
	});
}

/**
 * Get body metrics from IndexedDB
 */
export async function getBodyMetricsOffline(): Promise<any[]> {
	const database = await getDB();
	return new Promise((resolve, reject) => {
		const transaction = database.transaction([STORES.BODY_METRICS], 'readonly');
		const store = transaction.objectStore(STORES.BODY_METRICS);
		const index = store.index('date');
		const request = index.getAll();

		request.onsuccess = () => resolve(request.result || []);
		request.onerror = () => reject(request.error);
	});
}

/**
 * Add item to sync queue
 */
export async function addToSyncQueue(item: Omit<SyncItem, 'id' | 'timestamp'>): Promise<void> {
	const database = await getDB();
	return new Promise((resolve, reject) => {
		const transaction = database.transaction([STORES.SYNC_QUEUE], 'readwrite');
		const store = transaction.objectStore(STORES.SYNC_QUEUE);
		const syncItem: SyncItem = {
			...item,
			id: crypto.randomUUID(),
			timestamp: Date.now()
		};
		const request = store.add(syncItem);

		request.onsuccess = () => resolve();
		request.onerror = () => reject(request.error);
	});
}

/**
 * Get sync queue items
 */
export async function getSyncQueue(): Promise<SyncItem[]> {
	const database = await getDB();
	return new Promise((resolve, reject) => {
		const transaction = database.transaction([STORES.SYNC_QUEUE], 'readonly');
		const store = transaction.objectStore(STORES.SYNC_QUEUE);
		const request = store.getAll();

		request.onsuccess = () => resolve(request.result || []);
		request.onerror = () => reject(request.error);
	});
}

/**
 * Remove item from sync queue
 */
export async function removeFromSyncQueue(id: string): Promise<void> {
	const database = await getDB();
	return new Promise((resolve, reject) => {
		const transaction = database.transaction([STORES.SYNC_QUEUE], 'readwrite');
		const store = transaction.objectStore(STORES.SYNC_QUEUE);
		const request = store.delete(id);

		request.onsuccess = () => resolve();
		request.onerror = () => reject(request.error);
	});
}

/**
 * Check if online
 */
export function isOnline(): boolean {
	return navigator.onLine;
}

/**
 * Initialize offline storage
 */
export async function initOfflineStorage(): Promise<void> {
	try {
		await initOfflineDB();
		console.log('✅ Offline storage initialized');
	} catch (error) {
		console.error('❌ Failed to initialize offline storage:', error);
	}
}

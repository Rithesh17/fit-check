import { writable } from 'svelte/store';

export type ToastType = 'success' | 'error' | 'info';

export interface Toast {
	id: string;
	message: string;
	type: ToastType;
}

function createToastStore() {
	const { subscribe, update } = writable<Toast[]>([]);

	function add(message: string, type: ToastType = 'info', duration = 3500) {
		const id = Math.random().toString(36).slice(2);
		update((toasts) => [...toasts, { id, message, type }]);
		setTimeout(() => remove(id), duration);
	}

	function remove(id: string) {
		update((toasts) => toasts.filter((t) => t.id !== id));
	}

	return {
		subscribe,
		success: (message: string) => add(message, 'success'),
		error: (message: string) => add(message, 'error', 5000),
		info: (message: string) => add(message, 'info'),
		remove
	};
}

export const toast = createToastStore();

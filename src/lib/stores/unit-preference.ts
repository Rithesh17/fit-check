/**
 * Unit Preference Store
 * Manages user's weight unit preference (kg or lbs)
 * Persists to localStorage
 */

import { writable } from 'svelte/store';
import type { WeightUnit } from '$lib/utils/weight-conversion';

export type { WeightUnit };

const STORAGE_KEY = 'fit-check-weight-unit';
const DEFAULT_UNIT: WeightUnit = 'kg';

function getStoredUnit(): WeightUnit {
	if (typeof window === 'undefined') return DEFAULT_UNIT;
	
	const stored = localStorage.getItem(STORAGE_KEY);
	if (stored === 'kg' || stored === 'lbs') {
		return stored;
	}
	return DEFAULT_UNIT;
}

function createUnitPreferenceStore() {
	const { subscribe, set, update } = writable<WeightUnit>(getStoredUnit());

	return {
		subscribe,
		set: (unit: WeightUnit) => {
			if (typeof window !== 'undefined') {
				localStorage.setItem(STORAGE_KEY, unit);
			}
			set(unit);
		},
		get: (): WeightUnit => {
			return getStoredUnit();
		}
	};
}

export const unitPreference = createUnitPreferenceStore();

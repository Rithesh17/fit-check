/**
 * Weight Conversion Utilities
 * Converts between kilograms (kg) and pounds (lbs)
 * Conversion factor: 1 kg = 2.20462 lbs
 */

export type WeightUnit = 'kg' | 'lbs';

const KG_TO_LBS = 2.204623;

/**
 * Convert kilograms to pounds
 */
export function kgToLbs(kg: number): number {
	return kg * KG_TO_LBS;
}

/**
 * Convert pounds to kilograms
 */
export function lbsToKg(lbs: number): number {
	return lbs / KG_TO_LBS;
}

/**
 * Convert weight value from kg to the specified unit
 */
export function convertWeight(weightKg: number, toUnit: 'kg' | 'lbs'): number {
	if (toUnit === 'lbs') {
		return kgToLbs(weightKg);
	}
	return weightKg;
}

/**
 * Format weight with unit label
 */
export function formatWeight(weightKg: number, unit: 'kg' | 'lbs'): string {
	const value = convertWeight(weightKg, unit);
	const unitLabel = getWeightUnitLabel(unit);
	return `${value.toFixed(1)} ${unitLabel}`;
}

/**
 * Get weight unit label
 */
export function getWeightUnitLabel(unit: 'kg' | 'lbs'): string {
	return unit === 'kg' ? 'kg' : 'lbs';
}

/**
 * Round weight to appropriate precision for display
 */
export function roundWeight(weight: number, unit: 'kg' | 'lbs'): number {
	// For lbs, we can show more precision (0.5 increments are common)
	// For kg, 0.1 precision is standard
	return unit === 'lbs' ? Math.round(weight * 2) / 2 : Math.round(weight * 10) / 10;
}

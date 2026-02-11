/**
 * Fitness Calculators
 * 1RM, Plate Calculator, Volume Calculator
 */

/**
 * Calculate 1RM (One Rep Max) using Epley formula
 * Formula: weight × (1 + reps / 30)
 */
export function calculate1RM(weight: number, reps: number): number {
	if (reps === 1) return weight;
	if (reps <= 0 || weight <= 0) return 0;
	return Math.round(weight * (1 + reps / 30) * 10) / 10;
}

/**
 * Calculate working weight from 1RM percentage
 */
export function calculateWorkingWeight(oneRM: number, percentage: number): number {
	return Math.round((oneRM * percentage / 100) * 10) / 10;
}

/**
 * Calculate plates needed for a given weight
 * Assumes standard Olympic bar (20kg) and standard plates
 */
export interface PlateCalculation {
	weight: number;
	plates: Array<{ weight: number; count: number }>;
	totalWeight: number;
}

export function calculatePlates(targetWeight: number, barWeight: number = 20): PlateCalculation {
	const standardPlates = [25, 20, 15, 10, 5, 2.5, 1.25]; // kg
	const weightToLoad = (targetWeight - barWeight) / 2; // Divide by 2 for each side
	
	if (weightToLoad <= 0) {
		return {
			weight: targetWeight,
			plates: [],
			totalWeight: barWeight
		};
	}

	const plates: Array<{ weight: number; count: number }> = [];
	let remaining = weightToLoad;

	for (const plateWeight of standardPlates) {
		const count = Math.floor(remaining / plateWeight);
		if (count > 0) {
			plates.push({ weight: plateWeight, count });
			remaining = Math.round((remaining - count * plateWeight) * 100) / 100;
		}
	}

	const totalPlatesWeight = plates.reduce((sum, p) => sum + p.weight * p.count * 2, 0);
	const totalWeight = barWeight + totalPlatesWeight;

	return {
		weight: targetWeight,
		plates,
		totalWeight: Math.round(totalWeight * 10) / 10
	};
}

/**
 * Calculate total volume (weight × reps) for a set
 */
export function calculateSetVolume(weight: number, reps: number): number {
	return weight * reps;
}

/**
 * Calculate total volume for multiple sets
 */
export function calculateTotalVolume(sets: Array<{ weight: number; reps: number }>): number {
	return sets.reduce((total, set) => total + calculateSetVolume(set.weight, set.reps), 0);
}

/**
 * Calculate volume for a workout
 */
export function calculateWorkoutVolume(
	exercises: Array<{
		sets: Array<{ weight: number; reps: number; completed: boolean }>;
	}>
): number {
	return exercises.reduce((total, exercise) => {
		const exerciseVolume = exercise.sets
			.filter((set) => set.completed)
			.reduce((sum, set) => sum + calculateSetVolume(set.weight, set.reps), 0);
		return total + exerciseVolume;
	}, 0);
}

/**
 * Get RPE scale description
 */
export function getRPEDescription(rpe: number): string {
	const descriptions: Record<number, string> = {
		10: 'Maximum effort - No reps left',
		9: 'Very hard - 1 rep left',
		8: 'Hard - 2-3 reps left',
		7: 'Moderately hard - 4-5 reps left',
		6: 'Moderate - 6-7 reps left',
		5: 'Easy - 8-9 reps left',
		4: 'Very easy - 10+ reps left',
		3: 'Very light',
		2: 'Extremely light',
		1: 'No effort'
	};
	return descriptions[rpe] || 'Unknown';
}

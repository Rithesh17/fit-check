/**
 * Streak Calculation Utilities
 * Calculates workout streaks from workout dates
 */

export interface StreakData {
	currentStreak: number;
	longestStreak: number;
	lastWorkoutDate: Date | null;
	workoutDates: Date[];
}

/**
 * Calculate streak from workout dates
 * A streak is broken if there's more than 1 day gap between workouts
 */
export function calculateStreak(workoutDates: Date[]): StreakData {
	if (workoutDates.length === 0) {
		return {
			currentStreak: 0,
			longestStreak: 0,
			lastWorkoutDate: null,
			workoutDates: []
		};
	}

	// Sort dates descending (most recent first)
	const sortedDates = [...workoutDates].sort((a, b) => b.getTime() - a.getTime());
	
	// Normalize dates to midnight for accurate day comparison
	const normalizedDates = sortedDates.map(date => {
		const d = new Date(date);
		d.setHours(0, 0, 0, 0);
		return d;
	});

	// Calculate current streak
	let currentStreak = 0;
	const today = new Date();
	today.setHours(0, 0, 0, 0);
	
	const yesterday = new Date(today);
	yesterday.setDate(yesterday.getDate() - 1);

	// Check if there's a workout today or yesterday to start the streak
	if (normalizedDates.length > 0) {
		const mostRecent = normalizedDates[0];
		const daysDiff = Math.floor((today.getTime() - mostRecent.getTime()) / (1000 * 60 * 60 * 24));
		
		if (daysDiff <= 1) {
			// Streak is active
			currentStreak = 1;
			
			// Count consecutive days going backwards
			for (let i = 1; i < normalizedDates.length; i++) {
				const prevDate = normalizedDates[i - 1];
				const currDate = normalizedDates[i];
				const diff = Math.floor((prevDate.getTime() - currDate.getTime()) / (1000 * 60 * 60 * 24));
				
				if (diff === 1) {
					currentStreak++;
				} else {
					break;
				}
			}
		}
	}

	// Calculate longest streak
	let longestStreak = 1;
	let tempStreak = 1;
	
	for (let i = 1; i < normalizedDates.length; i++) {
		const prevDate = normalizedDates[i - 1];
		const currDate = normalizedDates[i];
		const diff = Math.floor((prevDate.getTime() - currDate.getTime()) / (1000 * 60 * 60 * 24));
		
		if (diff === 1) {
			tempStreak++;
			longestStreak = Math.max(longestStreak, tempStreak);
		} else {
			tempStreak = 1;
		}
	}

	return {
		currentStreak,
		longestStreak,
		lastWorkoutDate: sortedDates[0] || null,
		workoutDates: sortedDates
	};
}

/**
 * Check if user worked out today
 */
export function workedOutToday(workoutDates: Date[]): boolean {
	if (workoutDates.length === 0) return false;
	
	const today = new Date();
	today.setHours(0, 0, 0, 0);
	
	return workoutDates.some(date => {
		const d = new Date(date);
		d.setHours(0, 0, 0, 0);
		return d.getTime() === today.getTime();
	});
}

/**
 * Get days since last workout
 */
export function daysSinceLastWorkout(workoutDates: Date[]): number | null {
	if (workoutDates.length === 0) return null;
	
	const sortedDates = [...workoutDates].sort((a, b) => b.getTime() - a.getTime());
	const lastWorkout = sortedDates[0];
	const today = new Date();
	
	const diffTime = today.getTime() - lastWorkout.getTime();
	const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
	
	return diffDays;
}

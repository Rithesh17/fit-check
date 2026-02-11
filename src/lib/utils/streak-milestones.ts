/**
 * Streak Milestones and Achievements
 */

export interface StreakMilestone {
	id: string;
	name: string;
	description: string;
	daysRequired: number;
	icon: string;
	color: string;
}

export const STREAK_MILESTONES: StreakMilestone[] = [
	{
		id: 'week',
		name: 'Week Warrior',
		description: '7 day streak',
		daysRequired: 7,
		icon: '🔥',
		color: 'var(--color-primary)'
	},
	{
		id: 'two-weeks',
		name: 'Dedicated',
		description: '14 day streak',
		daysRequired: 14,
		icon: '💪',
		color: 'var(--color-primary)'
	},
	{
		id: 'month',
		name: 'Month Master',
		description: '30 day streak',
		daysRequired: 30,
		icon: '⭐',
		color: 'var(--color-accent)'
	},
	{
		id: 'two-months',
		name: 'Consistency King',
		description: '60 day streak',
		daysRequired: 60,
		icon: '👑',
		color: 'var(--color-accent)'
	},
	{
		id: 'hundred',
		name: 'Centurion',
		description: '100 day streak',
		daysRequired: 100,
		icon: '🏆',
		color: 'var(--color-secondary)'
	},
	{
		id: 'half-year',
		name: 'Half Year Hero',
		description: '180 day streak',
		daysRequired: 180,
		icon: '🌟',
		color: 'var(--color-secondary)'
	},
	{
		id: 'year',
		name: 'Year Warrior',
		description: '365 day streak',
		daysRequired: 365,
		icon: '🎯',
		color: 'var(--color-secondary)'
	}
];

/**
 * Get achieved milestones based on current streak
 */
export function getAchievedMilestones(currentStreak: number): StreakMilestone[] {
	return STREAK_MILESTONES.filter((milestone) => currentStreak >= milestone.daysRequired);
}

/**
 * Get next milestone to achieve
 */
export function getNextMilestone(currentStreak: number): StreakMilestone | null {
	const next = STREAK_MILESTONES.find((milestone) => currentStreak < milestone.daysRequired);
	return next || null;
}

/**
 * Get progress to next milestone
 */
export function getMilestoneProgress(currentStreak: number): {
	milestone: StreakMilestone;
	progress: number; // 0-1
	daysRemaining: number;
} | null {
	const next = getNextMilestone(currentStreak);
	if (!next) return null;

	const progress = currentStreak / next.daysRequired;
	const daysRemaining = next.daysRequired - currentStreak;

	return {
		milestone: next,
		progress: Math.min(progress, 1),
		daysRemaining
	};
}

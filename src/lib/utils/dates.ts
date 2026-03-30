/**
 * Formats a date string as "Today", "Yesterday", or "MMM D"
 */
export function formatWorkoutDate(dateString: string): string {
	const date = new Date(dateString);
	const today = new Date();
	const yesterday = new Date(today);
	yesterday.setDate(yesterday.getDate() - 1);

	const dateMidnight = new Date(date);
	dateMidnight.setHours(0, 0, 0, 0);
	const todayMidnight = new Date(today);
	todayMidnight.setHours(0, 0, 0, 0);
	const yesterdayMidnight = new Date(yesterday);
	yesterdayMidnight.setHours(0, 0, 0, 0);

	if (dateMidnight.getTime() === todayMidnight.getTime()) {
		return 'Today';
	} else if (dateMidnight.getTime() === yesterdayMidnight.getTime()) {
		return 'Yesterday';
	} else {
		return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
	}
}

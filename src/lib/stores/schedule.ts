import { writable } from 'svelte/store';

export type DayOfWeek =
	| 'sunday'
	| 'monday'
	| 'tuesday'
	| 'wednesday'
	| 'thursday'
	| 'friday'
	| 'saturday';

export const DAYS_OF_WEEK: DayOfWeek[] = [
	'sunday',
	'monday',
	'tuesday',
	'wednesday',
	'thursday',
	'friday',
	'saturday'
];

export const DAY_LABELS: Record<DayOfWeek, string> = {
	sunday: 'Sun',
	monday: 'Mon',
	tuesday: 'Tue',
	wednesday: 'Wed',
	thursday: 'Thu',
	friday: 'Fri',
	saturday: 'Sat'
};

export type WeeklySchedule = Record<DayOfWeek, string | null>;

const STORAGE_KEY = 'fit-check-weekly-schedule';

const DEFAULT_SCHEDULE: WeeklySchedule = {
	sunday: null,
	monday: null,
	tuesday: null,
	wednesday: null,
	thursday: null,
	friday: null,
	saturday: null
};

function getStoredSchedule(): WeeklySchedule {
	if (typeof window === 'undefined') return { ...DEFAULT_SCHEDULE };
	try {
		const stored = localStorage.getItem(STORAGE_KEY);
		if (!stored) return { ...DEFAULT_SCHEDULE };
		return { ...DEFAULT_SCHEDULE, ...JSON.parse(stored) };
	} catch {
		return { ...DEFAULT_SCHEDULE };
	}
}

function createScheduleStore() {
	const { subscribe, set, update } = writable<WeeklySchedule>(getStoredSchedule());

	function persist(schedule: WeeklySchedule) {
		if (typeof window !== 'undefined') {
			localStorage.setItem(STORAGE_KEY, JSON.stringify(schedule));
		}
	}

	return {
		subscribe,
		setDay(day: DayOfWeek, templateId: string | null) {
			update((schedule) => {
				const next = { ...schedule, [day]: templateId };
				persist(next);
				return next;
			});
		},
		reset() {
			const empty = { ...DEFAULT_SCHEDULE };
			persist(empty);
			set(empty);
		}
	};
}

export const weeklySchedule = createScheduleStore();

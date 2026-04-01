import { writable } from 'svelte/store';
import { supabase } from '$lib/supabase/client';

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

const DEFAULT_SCHEDULE: WeeklySchedule = {
	sunday: null,
	monday: null,
	tuesday: null,
	wednesday: null,
	thursday: null,
	friday: null,
	saturday: null
};

async function fetchSchedule(): Promise<WeeklySchedule> {
	const { data, error } = await supabase
		.from('weekly_schedule')
		.select('day_of_week, workout_template_id, is_active');

	if (error || !data) return { ...DEFAULT_SCHEDULE };

	const schedule = { ...DEFAULT_SCHEDULE };
	for (const row of data) {
		const day = DAYS_OF_WEEK[row.day_of_week as number];
		if (day) {
			schedule[day] = row.is_active ? (row.workout_template_id as string) : null;
		}
	}
	return schedule;
}

function createScheduleStore() {
	const { subscribe, set, update } = writable<WeeklySchedule>({ ...DEFAULT_SCHEDULE });

	// Auto-load from Supabase on client
	if (typeof window !== 'undefined') {
		fetchSchedule().then((s) => set(s));
	}

	return {
		subscribe,
		async setDay(day: DayOfWeek, templateId: string | null) {
			// Optimistic update
			update((s) => ({ ...s, [day]: templateId }));

			const dayIndex = DAYS_OF_WEEK.indexOf(day);

			const { data: existing } = await supabase
				.from('weekly_schedule')
				.select('id')
				.eq('day_of_week', dayIndex)
				.maybeSingle();

			if (existing) {
				await supabase
					.from('weekly_schedule')
					.update({
						workout_template_id: templateId,
						is_active: templateId !== null,
						updated_at: new Date().toISOString()
					})
					.eq('id', (existing as any).id);
			} else if (templateId) {
				await supabase.from('weekly_schedule').insert({
					day_of_week: dayIndex,
					workout_template_id: templateId,
					is_active: true
				});
			}
		},
		async reset() {
			set({ ...DEFAULT_SCHEDULE });
			await supabase.from('weekly_schedule').delete().in('day_of_week', [0, 1, 2, 3, 4, 5, 6]);
		}
	};
}

export const weeklySchedule = createScheduleStore();

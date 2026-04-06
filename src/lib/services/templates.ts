import { supabase } from '$lib/supabase/client';
import type { WorkoutTemplateSlot } from '$lib/data/workout-templates';

// ─── Types ─────────────────────────────────────────────────────────────────────

/** One row in workout_template_exercises as returned from Supabase */
export interface TemplateExerciseRow {
	exercise_id: string;
	exercise_order: number;   // slot position (0-based)
	alternative_order: number; // 0 = primary, 1+ = alternatives within the slot
	sets: unknown;            // JSON — WorkoutTemplateAlternative config
}

export interface Template {
	id: string;
	name: string | null;
	exercise_count: number;   // number of slots (not total rows)
}

export type TemplateSlotsMap = Record<string, WorkoutTemplateSlot[]>;

// ─── Helpers ────────────────────────────────────────────────────────────────────

/** Group flat rows into slot arrays, preserving slot and alternative order */
function rowsToSlots(rows: TemplateExerciseRow[]): WorkoutTemplateSlot[] {
	// Group by exercise_order (slot position)
	const slotMap = new Map<number, TemplateExerciseRow[]>();
	for (const row of rows) {
		const arr = slotMap.get(row.exercise_order) ?? [];
		arr.push(row);
		slotMap.set(row.exercise_order, arr);
	}

	// Sort slot positions, then sort alternatives within each slot
	return Array.from(slotMap.entries())
		.sort(([a], [b]) => a - b)
		.map(([, slotRows]) => ({
			alternatives: slotRows
				.sort((a, b) => a.alternative_order - b.alternative_order)
				.map((row) => {
					const sets = row.sets as Record<string, unknown>;
					return {
						exerciseId: row.exercise_id,
						sets: (sets?.sets as number) ?? 3,
						reps: sets?.reps as number | string | undefined,
						durationSeconds: sets?.durationSeconds as number | undefined,
						restSeconds: (sets?.restSeconds as number) ?? 60,
						notes: sets?.notes as string | undefined
					};
				})
		}));
}

/** Flatten slots back to rows for Supabase insert */
function slotsToRows(
	templateId: string,
	slots: WorkoutTemplateSlot[]
): Array<{
	workout_template_id: string;
	exercise_id: string;
	exercise_order: number;
	alternative_order: number;
	sets: unknown;
}> {
	return slots.flatMap((slot, slotIndex) =>
		slot.alternatives.map((alt, altIndex) => ({
			workout_template_id: templateId,
			exercise_id: alt.exerciseId,
			exercise_order: slotIndex,
			alternative_order: altIndex,
			sets: {
				sets: alt.sets,
				reps: alt.reps,
				durationSeconds: alt.durationSeconds,
				restSeconds: alt.restSeconds,
				notes: alt.notes
			}
		}))
	);
}

// ─── Public API ─────────────────────────────────────────────────────────────────

export async function loadTemplates(): Promise<{
	templates: Template[];
	slotsMap: TemplateSlotsMap;
}> {
	const [{ data: templates, error: tError }, { data: templateExs, error: teError }] =
		await Promise.all([
			supabase
				.from('workout_templates')
				.select('id, name')
				.order('created_at', { ascending: false }),
			supabase
				.from('workout_template_exercises')
				.select('workout_template_id, exercise_id, exercise_order, alternative_order, sets')
				.order('exercise_order', { ascending: true })
				.order('alternative_order', { ascending: true })
		]);

	if (tError) throw tError;
	if (teError) throw teError;

	// Group rows by template id
	const rawMap = new Map<string, TemplateExerciseRow[]>();
	for (const row of templateExs ?? []) {
		const r = row as any;
		const arr = rawMap.get(r.workout_template_id) ?? [];
		arr.push({
			exercise_id: r.exercise_id,
			exercise_order: r.exercise_order,
			alternative_order: r.alternative_order ?? 0,
			sets: r.sets
		});
		rawMap.set(r.workout_template_id, arr);
	}

	const slotsMap: TemplateSlotsMap = {};
	const mapped: Template[] = (templates ?? []).map((t: any) => {
		const rows = rawMap.get(t.id) ?? [];
		const slots = rowsToSlots(rows);
		slotsMap[t.id] = slots;
		return { id: t.id, name: t.name, exercise_count: slots.length };
	});

	return { templates: mapped, slotsMap };
}

export async function saveTemplate(
	name: string,
	slots: WorkoutTemplateSlot[]
): Promise<string> {
	const { data, error } = await supabase
		.from('workout_templates')
		.insert({ name } as any)
		.select('id')
		.single();

	if (error) throw error;
	const id = (data as { id: string }).id;

	const rows = slotsToRows(id, slots);
	if (rows.length > 0) {
		const { error: exError } = await supabase
			.from('workout_template_exercises')
			.insert(rows as any);
		if (exError) throw exError;
	}

	return id;
}

export async function deleteTemplate(id: string): Promise<void> {
	await supabase.from('workout_template_exercises').delete().eq('workout_template_id', id);
	const { error } = await supabase.from('workout_templates').delete().eq('id', id);
	if (error) throw error;
}

export async function loadTemplateById(id: string): Promise<{
	template: Template;
	slots: WorkoutTemplateSlot[];
} | null> {
	const [{ data: template, error: tError }, { data: templateExs, error: teError }] =
		await Promise.all([
			supabase.from('workout_templates').select('id, name').eq('id', id).single(),
			supabase
				.from('workout_template_exercises')
				.select('exercise_id, exercise_order, alternative_order, sets')
				.eq('workout_template_id', id)
				.order('exercise_order', { ascending: true })
				.order('alternative_order', { ascending: true })
		]);

	if (tError || teError || !template) return null;

	const t = template as any;
	const rows: TemplateExerciseRow[] = (templateExs ?? []).map((e: any) => ({
		exercise_id: e.exercise_id,
		exercise_order: e.exercise_order,
		alternative_order: e.alternative_order ?? 0,
		sets: e.sets
	}));

	const slots = rowsToSlots(rows);
	return {
		template: { id: t.id, name: t.name, exercise_count: slots.length },
		slots
	};
}

export async function updateTemplate(
	id: string,
	name: string,
	slots: WorkoutTemplateSlot[]
): Promise<void> {
	const { error: nameError } = await supabase
		.from('workout_templates')
		.update({ name } as any)
		.eq('id', id);
	if (nameError) throw nameError;

	const { error: delError } = await supabase
		.from('workout_template_exercises')
		.delete()
		.eq('workout_template_id', id);
	if (delError) throw delError;

	const rows = slotsToRows(id, slots);
	if (rows.length > 0) {
		const { error: insError } = await supabase
			.from('workout_template_exercises')
			.insert(rows as any);
		if (insError) throw insError;
	}
}

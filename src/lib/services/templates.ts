import { supabase } from '$lib/supabase/client';

export interface TemplateExercise {
	exercise_id: string;
	exercise_order: number;
	sets: unknown;
}

export interface Template {
	id: string;
	name: string | null;
	exercise_count: number;
}

export type TemplateExercisesMap = Record<string, TemplateExercise[]>;

export async function loadTemplates(): Promise<{
	templates: Template[];
	exercisesMap: TemplateExercisesMap;
}> {
	const [{ data: templates, error: tError }, { data: templateExs, error: teError }] =
		await Promise.all([
			supabase
				.from('workout_templates')
				.select('id, name')
				.order('created_at', { ascending: false }),
			supabase
				.from('workout_template_exercises')
				.select('workout_template_id, exercise_id, exercise_order, sets')
				.order('exercise_order', { ascending: true })
		]);

	if (tError) throw tError;
	if (teError) throw teError;

	const map: TemplateExercisesMap = {};
	for (const row of templateExs || []) {
		const arr = map[(row as any).workout_template_id] || [];
		arr.push({
			exercise_id: (row as any).exercise_id,
			exercise_order: (row as any).exercise_order,
			sets: (row as any).sets
		});
		map[(row as any).workout_template_id] = arr;
	}

	const mapped: Template[] = (templates || []).map((t: any) => ({
		id: t.id,
		name: t.name,
		exercise_count: (map[t.id] || []).length
	}));

	return { templates: mapped, exercisesMap: map };
}

export async function saveTemplate(name: string, exercises: TemplateExercise[]): Promise<string> {
	const { data, error } = await supabase
		.from('workout_templates')
		.insert({ name } as any)
		.select('id')
		.single();

	if (error) throw error;
	const id = (data as { id: string }).id;

	if (exercises.length > 0) {
		const { error: exError } = await supabase
			.from('workout_template_exercises')
			.insert(exercises.map((ex) => ({ ...ex, workout_template_id: id })) as any);

		if (exError) throw exError;
	}

	return id;
}

export async function deleteTemplate(id: string): Promise<void> {
	// Delete exercises first (FK constraint)
	await supabase.from('workout_template_exercises').delete().eq('workout_template_id', id);
	const { error } = await supabase.from('workout_templates').delete().eq('id', id);
	if (error) throw error;
}

export async function loadTemplateById(id: string): Promise<{
	template: Template;
	exercises: TemplateExercise[];
} | null> {
	const [{ data: template, error: tError }, { data: templateExs, error: teError }] =
		await Promise.all([
			supabase.from('workout_templates').select('id, name').eq('id', id).single(),
			supabase
				.from('workout_template_exercises')
				.select('exercise_id, exercise_order, sets')
				.eq('workout_template_id', id)
				.order('exercise_order', { ascending: true })
		]);

	if (tError || teError || !template) return null;

	const t = template as any;
	const exs = (templateExs || []) as any[];
	return {
		template: { id: t.id, name: t.name, exercise_count: exs.length },
		exercises: exs.map((e) => ({
			exercise_id: e.exercise_id,
			exercise_order: e.exercise_order,
			sets: e.sets
		}))
	};
}

export async function updateTemplate(
	id: string,
	name: string,
	exercises: TemplateExercise[]
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

	if (exercises.length > 0) {
		const { error: insError } = await supabase
			.from('workout_template_exercises')
			.insert(exercises.map((ex) => ({ ...ex, workout_template_id: id })) as any);
		if (insError) throw insError;
	}
}

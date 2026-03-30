import { supabase } from '$lib/supabase/client';

export interface BodyMetric {
	id: string;
	date: string;
	weight_kg: number | null;
	body_fat_percentage: number | null;
}

export async function loadBodyMetrics(limit = 30): Promise<BodyMetric[]> {
	const { data, error } = await supabase
		.from('body_metrics')
		.select('id, date, weight_kg, body_fat_percentage')
		.order('date', { ascending: false })
		.limit(limit);

	if (error) throw error;
	return (data || []) as BodyMetric[];
}

export async function saveBodyMetric(metric: {
	date: string;
	weight_kg: number;
	body_fat_percentage?: number | null;
}): Promise<void> {
	const { error } = await supabase.from('body_metrics').insert(metric as any);
	if (error) throw error;
}

export async function deleteBodyMetric(id: string): Promise<void> {
	const { error } = await supabase.from('body_metrics').delete().eq('id', id);
	if (error) throw error;
}

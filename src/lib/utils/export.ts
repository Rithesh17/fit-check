/**
 * Export Data Functionality
 * Export workouts, progress, and body metrics as JSON or CSV
 */

import { supabase } from '$lib/supabase/client';

export interface ExportData {
	workouts: any[];
	bodyMetrics: any[];
	exportDate: string;
}

/**
 * Export all data as JSON
 */
export async function exportAsJSON(): Promise<string> {
	try {
		// Fetch all workouts
		const { data: workouts, error: workoutsError } = await supabase
			.from('workouts')
			.select(`
				*,
				workout_exercises(*)
			`)
			.order('date', { ascending: false });

		if (workoutsError) throw workoutsError;

		// Fetch all body metrics
		const { data: bodyMetrics, error: metricsError } = await supabase
			.from('body_metrics')
			.select('*')
			.order('date', { ascending: false });

		if (metricsError) throw metricsError;

		const exportData: ExportData = {
			workouts: workouts || [],
			bodyMetrics: bodyMetrics || [],
			exportDate: new Date().toISOString()
		};

		return JSON.stringify(exportData, null, 2);
	} catch (error) {
		console.error('Error exporting data:', error);
		throw error;
	}
}

/**
 * Export workouts as CSV
 */
export async function exportWorkoutsAsCSV(): Promise<string> {
	try {
		const { data: workouts, error } = await supabase
			.from('workouts')
			.select(`
				*,
				workout_exercises(exercise_id, sets)
			`)
			.order('date', { ascending: false });

		if (error) throw error;

		// CSV header
		const headers = ['Date', 'Name', 'Duration (min)', 'Exercise Count', 'Total Sets'];
		const rows = (workouts || []).map((w: any) => {
			const exercises = w.workout_exercises || [];
			const totalSets = exercises.reduce((sum: number, ex: any) => sum + (ex.sets?.length || 0), 0);
			return [
				new Date(w.date).toLocaleDateString(),
				w.name || '',
				w.duration_minutes || '',
				exercises.length,
				totalSets
			];
		});

		const csv = [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');
		return csv;
	} catch (error) {
		console.error('Error exporting workouts:', error);
		throw error;
	}
}

/**
 * Export body metrics as CSV
 */
export async function exportBodyMetricsAsCSV(): Promise<string> {
	try {
		const { data: metrics, error } = await supabase
			.from('body_metrics')
			.select('*')
			.order('date', { ascending: false });

		if (error) throw error;

		const headers = ['Date', 'Weight (kg)', 'Body Fat (%)'];
		const rows = (metrics || []).map((m: any) => [
			new Date(m.date).toLocaleDateString(),
			m.weight || '',
			m.body_fat_percentage || ''
		]);

		const csv = [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');
		return csv;
	} catch (error) {
		console.error('Error exporting body metrics:', error);
		throw error;
	}
}

/**
 * Download file
 */
export function downloadFile(content: string, filename: string, mimeType: string) {
	const blob = new Blob([content], { type: mimeType });
	const url = URL.createObjectURL(blob);
	const link = document.createElement('a');
	link.href = url;
	link.download = filename;
	document.body.appendChild(link);
	link.click();
	document.body.removeChild(link);
	URL.revokeObjectURL(url);
}

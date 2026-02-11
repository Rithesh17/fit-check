/**
 * Supabase Database Types
 * Auto-generated types for TypeScript support
 * Update these based on your actual schema
 */

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
	public: {
		Tables: {
			exercises: {
				Row: {
					id: string;
					name: string;
					muscle_groups: string[];
					equipment: string;
					default_sets: number;
					default_reps: number;
					default_rest_seconds: number;
					instructions: string | null;
					image_url: string | null;
					created_at: string;
				};
				Insert: {
					id?: string;
					name: string;
					muscle_groups: string[];
					equipment: string;
					default_sets?: number;
					default_reps?: number;
					default_rest_seconds?: number;
					instructions?: string | null;
					image_url?: string | null;
					created_at?: string;
				};
				Update: {
					id?: string;
					name?: string;
					muscle_groups?: string[];
					equipment?: string;
					default_sets?: number;
					default_reps?: number;
					default_rest_seconds?: number;
					instructions?: string | null;
					image_url?: string | null;
					created_at?: string;
				};
			};
			workouts: {
				Row: {
					id: string;
					name: string | null;
					date: string;
					duration_minutes: number | null;
					notes: string | null;
					created_at: string;
					updated_at: string;
				};
				Insert: {
					id?: string;
					name?: string | null;
					date?: string;
					duration_minutes?: number | null;
					notes?: string | null;
					created_at?: string;
					updated_at?: string;
				};
				Update: {
					id?: string;
					name?: string | null;
					date?: string;
					duration_minutes?: number | null;
					notes?: string | null;
					created_at?: string;
					updated_at?: string;
				};
			};
			workout_exercises: {
				Row: {
					id: string;
					workout_id: string;
					exercise_id: string; // TEXT, references exercises.id
					exercise_order: number;
					sets: Json;
					notes: string | null;
					created_at: string;
				};
				Insert: {
					id?: string;
					workout_id: string;
					exercise_id: string; // TEXT, references exercises.id
					exercise_order: number;
					sets: Json;
					notes?: string | null;
					created_at?: string;
				};
				Update: {
					id?: string;
					workout_id?: string;
					exercise_id?: string; // TEXT, references exercises.id
					exercise_order?: number;
					sets?: Json;
					notes?: string | null;
					created_at?: string;
				};
			};
			body_metrics: {
				Row: {
					id: string;
					date: string;
					weight_kg: number | null;
					body_fat_percentage: number | null;
					measurements: Json | null;
					notes: string | null;
					created_at: string;
				};
				Insert: {
					id?: string;
					date?: string;
					weight_kg?: number | null;
					body_fat_percentage?: number | null;
					measurements?: Json | null;
					notes?: string | null;
					created_at?: string;
				};
				Update: {
					id?: string;
					date?: string;
					weight_kg?: number | null;
					body_fat_percentage?: number | null;
					measurements?: Json | null;
					notes?: string | null;
					created_at?: string;
				};
			};
		};
	};
}

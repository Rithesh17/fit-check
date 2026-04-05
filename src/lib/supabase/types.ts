/**
 * Supabase Database Types
 * Compatible with @supabase/supabase-js v2.x (GenericSchema requires Tables, Views, Functions)
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
					video_url: string | null;
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
					video_url?: string | null;
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
					video_url?: string | null;
					created_at?: string;
				};
				Relationships: [];
			};
			workouts: {
				Row: {
					id: string;
					name: string | null;
					date: string;
					duration_minutes: number | null;
					notes: string | null;
					energy_level: number | null;
					mood: string | null;
					created_at: string;
					updated_at: string;
				};
				Insert: {
					id?: string;
					name?: string | null;
					date?: string;
					duration_minutes?: number | null;
					notes?: string | null;
					energy_level?: number | null;
					mood?: string | null;
					created_at?: string;
					updated_at?: string;
				};
				Update: {
					id?: string;
					name?: string | null;
					date?: string;
					duration_minutes?: number | null;
					notes?: string | null;
					energy_level?: number | null;
					mood?: string | null;
					created_at?: string;
					updated_at?: string;
				};
				Relationships: [];
			};
			workout_exercises: {
				Row: {
					id: string;
					workout_id: string;
					exercise_id: string;
					exercise_order: number;
					sets: Json;
					notes: string | null;
					rpe: number | null;
					created_at: string;
				};
				Insert: {
					id?: string;
					workout_id: string;
					exercise_id: string;
					exercise_order: number;
					sets: Json;
					notes?: string | null;
					rpe?: number | null;
					created_at?: string;
				};
				Update: {
					id?: string;
					workout_id?: string;
					exercise_id?: string;
					exercise_order?: number;
					sets?: Json;
					notes?: string | null;
					rpe?: number | null;
					created_at?: string;
				};
				Relationships: [
					{
						foreignKeyName: 'workout_exercises_workout_id_fkey';
						columns: ['workout_id'];
						isOneToOne: false;
						referencedRelation: 'workouts';
						referencedColumns: ['id'];
					}
				];
			};
			user_exercise_overrides: {
				Row: {
					id: string;
					exercise_id: string;
					default_sets: number | null;
					default_reps: number | null;
					default_rest_seconds: number | null;
					default_duration_minutes: number | null;
					default_calories: number | null;
					default_duration_seconds: number | null;
					default_reps_stretches: number | null;
					instructions: string | null;
					video_url: string | null;
					created_at: string;
					updated_at: string;
				};
				Insert: {
					id?: string;
					exercise_id: string;
					default_sets?: number | null;
					default_reps?: number | null;
					default_rest_seconds?: number | null;
					default_duration_minutes?: number | null;
					default_calories?: number | null;
					default_duration_seconds?: number | null;
					default_reps_stretches?: number | null;
					instructions?: string | null;
					video_url?: string | null;
					created_at?: string;
					updated_at?: string;
				};
				Update: {
					id?: string;
					exercise_id?: string;
					default_sets?: number | null;
					default_reps?: number | null;
					default_rest_seconds?: number | null;
					default_duration_minutes?: number | null;
					default_calories?: number | null;
					default_duration_seconds?: number | null;
					default_reps_stretches?: number | null;
					instructions?: string | null;
					video_url?: string | null;
					created_at?: string;
					updated_at?: string;
				};
				Relationships: [];
			};
			workout_templates: {
				Row: {
					id: string;
					name: string | null;
					created_at: string;
					updated_at: string;
				};
				Insert: {
					id?: string;
					name?: string | null;
					created_at?: string;
					updated_at?: string;
				};
				Update: {
					id?: string;
					name?: string | null;
					created_at?: string;
					updated_at?: string;
				};
				Relationships: [];
			};
			workout_template_exercises: {
				Row: {
					id: string;
					workout_template_id: string;
					exercise_id: string;
					exercise_order: number;
					sets: Json;
					created_at: string;
				};
				Insert: {
					id?: string;
					workout_template_id: string;
					exercise_id: string;
					exercise_order: number;
					sets: Json;
					created_at?: string;
				};
				Update: {
					id?: string;
					workout_template_id?: string;
					exercise_id?: string;
					exercise_order?: number;
					sets?: Json;
					created_at?: string;
				};
				Relationships: [
					{
						foreignKeyName: 'workout_template_exercises_template_id_fkey';
						columns: ['workout_template_id'];
						isOneToOne: false;
						referencedRelation: 'workout_templates';
						referencedColumns: ['id'];
					}
				];
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
				Relationships: [];
			};
			user_exercises: {
				Row: {
					id: string;
					name: string;
					exercise_type: string;
					muscle_groups: string[] | null;
					equipment: string;
					default_sets: number | null;
					default_reps: number | null;
					default_rest_seconds: number | null;
					default_duration_minutes: number | null;
					default_calories: number | null;
					default_duration_seconds: number | null;
					default_reps_stretches: number | null;
					instructions: string | null;
					video_url: string | null;
					created_at: string;
					updated_at: string;
				};
				Insert: {
					id?: string;
					name: string;
					exercise_type: string;
					muscle_groups?: string[] | null;
					equipment: string;
					default_sets?: number | null;
					default_reps?: number | null;
					default_rest_seconds?: number | null;
					default_duration_minutes?: number | null;
					default_calories?: number | null;
					default_duration_seconds?: number | null;
					default_reps_stretches?: number | null;
					instructions?: string | null;
					video_url?: string | null;
					created_at?: string;
					updated_at?: string;
				};
				Update: {
					id?: string;
					name?: string;
					exercise_type?: string;
					muscle_groups?: string[] | null;
					equipment?: string;
					default_sets?: number | null;
					default_reps?: number | null;
					default_rest_seconds?: number | null;
					default_duration_minutes?: number | null;
					default_calories?: number | null;
					default_duration_seconds?: number | null;
					default_reps_stretches?: number | null;
					instructions?: string | null;
					video_url?: string | null;
					created_at?: string;
					updated_at?: string;
				};
				Relationships: [];
			};
			goals: {
				Row: {
					id: string;
					type: string;
					exercise_id: string | null;
					exercise_name: string | null;
					target_value: number;
					target_date: string | null;
					created_at: string;
				};
				Insert: {
					id?: string;
					type: string;
					exercise_id?: string | null;
					exercise_name?: string | null;
					target_value: number;
					target_date?: string | null;
					created_at?: string;
				};
				Update: {
					id?: string;
					type?: string;
					exercise_id?: string | null;
					exercise_name?: string | null;
					target_value?: number;
					target_date?: string | null;
					created_at?: string;
				};
				Relationships: [];
			};
			weekly_schedule: {
				Row: {
					id: string;
					day_of_week: number;
					workout_template_id: string | null;
					is_active: boolean;
					created_at: string;
					updated_at: string;
				};
				Insert: {
					id?: string;
					day_of_week: number;
					workout_template_id?: string | null;
					is_active?: boolean;
					created_at?: string;
					updated_at?: string;
				};
				Update: {
					id?: string;
					day_of_week?: number;
					workout_template_id?: string | null;
					is_active?: boolean;
					created_at?: string;
					updated_at?: string;
				};
				Relationships: [];
			};
		};
		Views: Record<string, never>;
		Functions: Record<string, never>;
		Enums: Record<string, never>;
		CompositeTypes: Record<string, never>;
	};
}

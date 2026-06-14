export type Units = "imperial" | "metric";
export type WorkoutType = "gym" | "run" | "racquet";

export interface Profile {
  id: string;
  display_name: string;
  units: Units;
  streak_days: number;
  weight_goal_lb: number | null;
  weekly_workout_goal: number | null;
  weekly_volume_goal_lb: number | null;
}

export interface Exercise {
  id: string;
  user_id: string | null;
  name: string;
  category: string;
  equipment: string;
  primary_muscle: string | null;
  intensity: number;
  is_cardio: boolean;
  video_url: string | null;
  cues: string | null;
  default_sets: number | null;
  default_reps: number | null;
  default_weight_lb: number | null;
  default_duration_sec: number | null;
}

export interface UserExercisePrefs {
  id: string;
  user_id: string;
  exercise_id: string;
  video_url: string | null;
  cues: string | null;
  default_sets: number | null;
  default_reps: number | null;
  default_weight_lb: number | null;
  default_duration_sec: number | null;
}

export interface WorkoutTemplate {
  id: string;
  user_id: string;
  name: string;
  type: WorkoutType;
  notes: string | null;
  position: number;
  template_exercises?: TemplateExercise[];
}

export interface TemplateExercise {
  id: string;
  template_id: string;
  exercise_id: string | null;
  name: string;
  target: string | null;
  position: number;
  default_sets: number | null;
  default_reps: number | null;
  default_weight_lb: number | null;
  default_duration_sec: number | null;
}

export interface WorkoutSet {
  id: string;
  workout_exercise_id: string;
  position: number;
  weight_lb: number;
  reps: number;
  done: boolean;
}

export interface WorkoutExercise {
  id: string;
  workout_id: string;
  exercise_id: string | null;
  name: string;
  target: string | null;
  position: number;
  sets: WorkoutSet[];
}

export interface Workout {
  id: string;
  user_id: string;
  type: WorkoutType;
  title: string;
  performed_at: string;
  duration_sec: number;
  notes: string | null;
  kcal: number | null;
  distance_mi: number | null;
  pace_spm: number | null;
  rallies: number | null;
  score: number[][] | null;
  workout_exercises?: WorkoutExercise[];
}

export interface BodyMetric {
  id: string;
  user_id: string;
  measured_on: string;
  weight_lb: number | null;
  body_fat_pct: number | null;
  lean_mass_lb: number | null;
  bmi: number | null;
}

export interface BodyMeasurement {
  id: string;
  user_id: string;
  measured_on: string;
  part: string;
  value_in: number;
}

export const TYPE_META: Record<
  WorkoutType,
  { label: string; color: string; soft: string }
> = {
  gym: { label: "Strength", color: "#FF5A3C", soft: "#FFEDE8" },
  run: { label: "Cardio", color: "#2F6BFF", soft: "#E8EFFF" },
  racquet: { label: "Racquet", color: "#7A4DFF", soft: "#EFE9FF" },
};

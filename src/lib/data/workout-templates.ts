/**
 * Pre-configured Workout Templates
 * Based on muscle group training plan
 */

import { getExerciseById, type Exercise } from './exercises';

export interface WorkoutTemplateExercise {
	exerciseId: string;
	sets: number;
	reps: number | string; // Can be "max reps" or number range like "6-8"
	restSeconds: number;
	notes?: string;
}

export interface WorkoutTemplate {
	id: string;
	name: string;
	description: string;
	muscleGroups: string[];
	exercises: WorkoutTemplateExercise[];
}

export const workoutTemplates: WorkoutTemplate[] = [
	// LOWER BODY
	{
		id: 'lower-body',
		name: 'Lower Body',
		description: 'Strong legs = better climbing, better hormones, better fat loss',
		muscleGroups: ['legs'],
		exercises: [
			{
				exerciseId: 'goblet-squat',
				sets: 4,
				reps: '6-8',
				restSeconds: 120,
				notes: 'Heavy but clean - use dumbbells'
			},
			{
				exerciseId: 'dumbbell-romanian-deadlift',
				sets: 4,
				reps: 8,
				restSeconds: 120,
				notes: 'Hinge, stretch the hamstrings - use dumbbells'
			},
			{
				exerciseId: 'bulgarian-split-squat',
				sets: 3,
				reps: 8,
				restSeconds: 90,
				notes: 'Each leg - yes, it sucks, yes, it works'
			},
			{
				exerciseId: 'lunges', // Walking Lunges
				sets: 3,
				reps: '10-12',
				restSeconds: 90,
				notes: 'Each leg - use dumbbells'
			},
			{
				exerciseId: 'calf-raise', // Standing Calf Raises
				sets: 3,
				reps: '12-15',
				restSeconds: 60,
				notes: 'Use dumbbells'
			}
		]
	},
	// CORE
	{
		id: 'core',
		name: 'Core',
		description: 'Essential for climbing and overall strength',
		muscleGroups: ['core'],
		exercises: [
			{
				exerciseId: 'hanging-knee-raises',
				sets: 3,
				reps: '10-15',
				restSeconds: 90,
				notes: 'Hanging knee raises or captain\'s chair'
			},
			{
				exerciseId: 'plank',
				sets: 3,
				reps: 1,
				restSeconds: 60,
				notes: 'Hold 45-60 seconds'
			},
			{
				exerciseId: 'cable-woodchoppers',
				sets: 3,
				reps: 10,
				restSeconds: 60,
				notes: 'Cable or band woodchoppers - each side'
			}
		]
	},
	// UPPER PUSH
	{
		id: 'upper-push',
		name: 'Upper Push',
		description: 'Chest, shoulders, triceps',
		muscleGroups: ['chest', 'shoulders', 'triceps'],
		exercises: [
			{
				exerciseId: 'dumbbell-bench-press',
				sets: 4,
				reps: '6-8',
				restSeconds: 120,
				notes: 'Use dumbbells'
			},
			{
				exerciseId: 'incline-dumbbell-bench-press',
				sets: 3,
				reps: '8-10',
				restSeconds: 90,
				notes: 'Use dumbbells or push-ups'
			},
			{
				exerciseId: 'dumbbell-shoulder-press',
				sets: 3,
				reps: '6-8',
				restSeconds: 90,
				notes: 'Seated or standing'
			},
			{
				exerciseId: 'lateral-raises',
				sets: 3,
				reps: '12-15',
				restSeconds: 60,
				notes: 'Control it'
			},
			{
				exerciseId: 'dumbbell-skull-crushers',
				sets: 3,
				reps: '8-12',
				restSeconds: 90,
				notes: 'Tricep dips or DB skull crushers'
			}
		]
	},
	// UPPER PULL
	{
		id: 'upper-pull',
		name: 'Upper Pull',
		description: 'Back and biceps - directly helps climbing strength 💪',
		muscleGroups: ['back', 'biceps'],
		exercises: [
			{
				exerciseId: 'pull-ups',
				sets: 4,
				reps: 'max reps',
				restSeconds: 120,
				notes: 'Aim for 5-8 reps, assisted if needed'
			},
			{
				exerciseId: 'one-arm-dumbbell-row',
				sets: 4,
				reps: 8,
				restSeconds: 90,
				notes: 'One-arm DB row - each side'
			},
			{
				exerciseId: 'lat-pulldown',
				sets: 3,
				reps: '8-10',
				restSeconds: 90,
				notes: 'Neutral or wide grip'
			},
			{
				exerciseId: 'rear-delt-fly',
				sets: 3,
				reps: '12-15',
				restSeconds: 60,
				notes: 'Face pulls or rear delt fly'
			},
			{
				exerciseId: 'hammer-curl',
				sets: 3,
				reps: 10,
				restSeconds: 60
			},
			{
				exerciseId: 'dumbbell-curl', // EZ Bar or DB Curls
				sets: 3,
				reps: '8-10',
				restSeconds: 60,
				notes: 'EZ bar or DB curls'
			}
		]
	},
	// CLIMBING (Note: This is more of a reminder/note, actual climbing is tracked separately)
	{
		id: 'climbing',
		name: 'Climbing',
		description: 'Focus on overhangs, foot placement, slow controlled climbs. 60-90 min',
		muscleGroups: ['full body'],
		exercises: [
			{
				exerciseId: 'dead-bug',
				sets: 3,
				reps: 1,
				restSeconds: 60,
				notes: 'Dead bug or hollow hold - hold 30-45 seconds'
			},
			{
				exerciseId: 'back-extension',
				sets: 3,
				reps: 12,
				restSeconds: 90,
				notes: 'Back extension or reverse hyper'
			}
		]
	},
	// FULL BODY (Light)
	{
		id: 'full-body-light',
		name: 'Full Body (Light)',
		description: 'Lighter weights, more flow. Technique > max effort',
		muscleGroups: ['full body'],
		exercises: [
			{
				exerciseId: 'dumbbell-front-squat',
				sets: 3,
				reps: 8,
				restSeconds: 90,
				notes: 'DB front squat or goblet squat'
			},
			{
				exerciseId: 'dumbbell-romanian-deadlift',
				sets: 3,
				reps: 8,
				restSeconds: 90,
				notes: 'Use dumbbells'
			},
			{
				exerciseId: 'push-ups', // Push-ups or DB Bench
				sets: 3,
				reps: 10,
				restSeconds: 60,
				notes: 'Push-ups or DB bench'
			},
			{
				exerciseId: 'farmer-walk', // Farmer Carries
				sets: 3,
				reps: 1,
				restSeconds: 120,
				notes: '40-60 seconds per round - core + grip + fat loss'
			}
		]
	},
	// PPL CORE WORKOUTS - 6 Day Split
	// Day 1: Push(Primary)
	{
		id: 'ppl-push-day1',
		name: 'Push(Day 1)',
		description: 'Chest, shoulders, and triceps - Primary push day',
		muscleGroups: ['chest', 'shoulders', 'triceps'],
		exercises: [
			{
				exerciseId: 'dumbbell-bench-press',
				sets: 4,
				reps: '6-8',
				restSeconds: 120,
				notes: 'Primary: Chest. Focus on form, progressive overload'
			},
			{
				exerciseId: 'incline-dumbbell-bench-press',
				sets: 3,
				reps: '8-10',
				restSeconds: 90,
				notes: 'Primary: Chest. Upper chest focus'
			},
			{
				exerciseId: 'dumbbell-shoulder-press',
				sets: 3,
				reps: '8-10',
				restSeconds: 90,
				notes: 'Primary: Shoulders. Seated or standing'
			},
			{
				exerciseId: 'lateral-raises',
				sets: 3,
				reps: '12-15',
				restSeconds: 60,
				notes: 'Primary: Shoulders. Control the movement'
			},
			{
				exerciseId: 'dumbbell-skull-crushers',
				sets: 3,
				reps: '10-12',
				restSeconds: 90,
				notes: 'Primary: Triceps. Lower dumbbells to forehead'
			},
			{
				exerciseId: 'overhead-tricep-extension',
				sets: 3,
				reps: '10-12',
				restSeconds: 60,
				notes: 'Primary: Triceps. Full stretch and contraction'
			},
			{
				exerciseId: 'plank',
				sets: 3,
				reps: 1,
				restSeconds: 60,
				notes: 'Core. Hold 60 seconds'
			},
		]
	},
	// Day 2: Pull + Core (Primary)
	{
		id: 'ppl-pull-day2',
		name: 'Pull + Core (Day 2)',
		description: 'Back, biceps, and core - Primary pull day',
		muscleGroups: ['back', 'biceps', 'core'],
		exercises: [
			{
				exerciseId: 'pull-ups',
				sets: 4,
				reps: 2,
				restSeconds: 120,
				notes: 'Primary: Back. Aim for 5-8 reps, assisted if needed'
			},
			{
				exerciseId: 'one-arm-dumbbell-row',
				sets: 4,
				reps: 8,
				restSeconds: 90,
				notes: 'Primary: Back. Each side, bent over position'
			},
			{
				exerciseId: 'rear-delt-flyes',
				sets: 3,
				reps: '12-15',
				restSeconds: 60,
				notes: 'Primary: Shoulders. Bent over, target rear delts'
			},
			{
				exerciseId: 'dumbbell-curl',
				sets: 3,
				reps: '10-12',
				restSeconds: 60,
				notes: 'Primary: Biceps. Alternate or together'
			},
			{
				exerciseId: 'hammer-curl',
				sets: 3,
				reps: '10-12',
				restSeconds: 60,
				notes: 'Primary: Biceps. Neutral grip, targets brachialis'
			},
			{
				exerciseId: 'leg-raises',
				sets: 3,
				reps: 15,
				restSeconds: 60,
				notes: 'Core. Lift legs to 90°, control descent'
			},
			{
				exerciseId: 'plank',
				sets: 3,
				reps: 1,
				restSeconds: 60,
				notes: 'Core. Hold 60 seconds'
			},
			{
				exerciseId: 'cable-woodchoppers',
				sets: 3,
				reps: 10,
				restSeconds: 60,
				notes: 'Core. Pull cable diagonally across body, each side (if available)'
			},
			{
				exerciseId: 'russian-twists',
				sets: 3,
				reps: 20,
				restSeconds: 45,
				notes: 'Core. Rotate torso, keep feet off ground'
			}
		]
	},
	// Day 3: Legs(Primary)
	{
		id: 'ppl-legs-day3',
		name: 'Legs(Day 3)',
		description: 'Quads, hamstrings, and calves - Primary leg day',
		muscleGroups: ['quadriceps', 'hamstrings', 'calves'],
		exercises: [
			{
				exerciseId: 'goblet-squat',
				sets: 4,
				reps: 8,
				restSeconds: 120,
				notes: 'Primary: Quadriceps. Hold dumbbell at chest, squat deep'
			},
			{
				exerciseId: 'dumbbell-front-squat',
				sets: 3,
				reps: 8,
				restSeconds: 90,
				notes: 'Primary: Quadriceps. Hold dumbbells at shoulders'
			},
			{
				exerciseId: 'bulgarian-split-squat',
				sets: 3,
				reps: 10,
				restSeconds: 90,
				notes: 'Primary: Quadriceps. Each leg, rear foot elevated'
			},
			{
				exerciseId: 'dumbbell-romanian-deadlift',
				sets: 4,
				reps: 8,
				restSeconds: 120,
				notes: 'Primary: Hamstrings. Hinge at hips, stretch hamstrings'
			},
			{
				exerciseId: 'lunges',
				sets: 3,
				reps: 12,
				restSeconds: 90,
				notes: 'Primary: Quadriceps. Each leg, step forward'
			},
			{
				exerciseId: 'calf-raise',
				sets: 3,
				reps: 15,
				restSeconds: 45,
				notes: 'Primary: Calves. Use dumbbells, full range of motion'
			},
			{
				exerciseId: 'plank',
				sets: 3,
				reps: 1,
				restSeconds: 60,
				notes: 'Core. Hold 60 seconds'
			},
		]
	},
	// Day 4: Push + Core (Varied)
	{
		id: 'ppl-push-day4',
		name: 'Push + Core (Day 4)',
		description: 'Chest, shoulders, triceps, and core - Varied push day',
		muscleGroups: ['chest', 'shoulders', 'triceps', 'core'],
		exercises: [
			{
				exerciseId: 'dumbbell-flyes',
				sets: 3,
				reps: 12,
				restSeconds: 60,
				notes: 'Primary: Chest. Arms wide arc, feel chest stretch'
			},
			{
				exerciseId: 'push-ups',
				sets: 3,
				reps: 15,
				restSeconds: 60,
				notes: 'Primary: Chest. Keep core tight, full range of motion'
			},
			{
				exerciseId: 'arnold-press',
				sets: 3,
				reps: 10,
				restSeconds: 90,
				notes: 'Primary: Shoulders. Start with palms facing, rotate and press'
			},
			{
				exerciseId: 'rear-delt-fly',
				sets: 3,
				reps: '12-15',
				restSeconds: 60,
				notes: 'Primary: Shoulders. Bent over, target rear delts'
			},
			{
				exerciseId: 'tricep-dips',
				sets: 3,
				reps: 12,
				restSeconds: 90,
				notes: 'Primary: Triceps. Keep body upright, focus on triceps (if dip bar available)'
			},
			{
				exerciseId: 'overhead-tricep-extension',
				sets: 3,
				reps: '10-12',
				restSeconds: 60,
				notes: 'Primary: Triceps. Full stretch and contraction'
			},
			{
				exerciseId: 'russian-twists',
				sets: 3,
				reps: 20,
				restSeconds: 45,
				notes: 'Core. Rotate torso, keep feet off ground'
			},
			{
				exerciseId: 'crunches',
				sets: 3,
				reps: 20,
				restSeconds: 45,
				notes: 'Core. Curl up, don\'t pull on neck'
			},
			{
				exerciseId: 'ab-wheel',
				sets: 3,
				reps: 10,
				restSeconds: 90,
				notes: 'Core. Roll out slowly, keep core engaged (if available)'
			},
			{
				exerciseId: 'hanging-leg-raises',
				sets: 3,
				reps: 12,
				restSeconds: 90,
				notes: 'Core. Hang from bar, raise legs to parallel'
			},
		]
	},
	// Day 5: Pull(Varied)
	{
		id: 'ppl-pull-day5',
		name: 'Pull(Day 5)',
		description: 'Back, and biceps - Varied pull day',
		muscleGroups: ['back', 'biceps'],
		exercises: [
			{
				exerciseId: 'one-arm-dumbbell-row',
				sets: 4,
				reps: 8,
				restSeconds: 90,
				notes: 'Primary: Back. Each side, different angle/focus'
			},
			{
				exerciseId: 'pull-ups',
				sets: 3,
				reps: 'max reps',
				restSeconds: 120,
				notes: 'Primary: Back. Aim for 5-8 reps'
			},
			{
				exerciseId: 'rear-delt-fly',
				sets: 3,
				reps: '12-15',
				restSeconds: 60,
				notes: 'Primary: Shoulders. Bent over, target rear delts'
			},
			{
				exerciseId: 'hammer-curl',
				sets: 3,
				reps: '10-12',
				restSeconds: 60,
				notes: 'Primary: Biceps. Neutral grip'
			},
			{
				exerciseId: 'dumbbell-curl',
				sets: 3,
				reps: '10-12',
				restSeconds: 60,
				notes: 'Primary: Biceps. Alternate or together'
			},
			{
				exerciseId: 'plank',
				sets: 3,
				reps: 1,
				restSeconds: 60,
				notes: 'Core. Hold 60 seconds, variations if desired'
			},
		]
	},
	// Day 6: Legs + Core (Varied)
	{
		id: 'ppl-legs-day6',
		name: 'Legs + Core (Day 6)',
		description: 'Quads, hamstrings, calves, and core - Varied leg day',
		muscleGroups: ['quadriceps', 'hamstrings', 'calves', 'core'],
		exercises: [
			{
				exerciseId: 'dumbbell-front-squat',
				sets: 4,
				reps: 8,
				restSeconds: 90,
				notes: 'Primary: Quadriceps. Hold dumbbells at shoulders'
			},
			{
				exerciseId: 'goblet-squat',
				sets: 3,
				reps: 10,
				restSeconds: 120,
				notes: 'Primary: Quadriceps. Hold dumbbell at chest'
			},
			{
				exerciseId: 'lunges',
				sets: 3,
				reps: 12,
				restSeconds: 90,
				notes: 'Primary: Quadriceps. Each leg, walking lunges'
			},
			{
				exerciseId: 'dumbbell-romanian-deadlift',
				sets: 4,
				reps: 8,
				restSeconds: 120,
				notes: 'Primary: Hamstrings. Hinge at hips, stretch hamstrings'
			},
			{
				exerciseId: 'bulgarian-split-squat',
				sets: 3,
				reps: 10,
				restSeconds: 90,
				notes: 'Primary: Quadriceps. Each leg, rear foot elevated'
			},
			{
				exerciseId: 'calf-raise',
				sets: 3,
				reps: 15,
				restSeconds: 45,
				notes: 'Primary: Calves. Use dumbbells, full range of motion'
			},
			{
				exerciseId: 'mountain-climbers',
				sets: 3,
				reps: 20,
				restSeconds: 45,
				notes: 'Core. Alternate knees, keep core tight'
			},
			{
				exerciseId: 'russian-twists',
				sets: 3,
				reps: 20,
				restSeconds: 45,
				notes: 'Core. Rotate torso, keep feet off ground'
			},
			{
				exerciseId: 'plank',
				sets: 3,
				reps: 1,
				restSeconds: 60,
				notes: 'Core. Hold 60 seconds'
			},
			{
				exerciseId: 'leg-raises',
				sets: 3,
				reps: 15,
				restSeconds: 60,
				notes: 'Core. Lift legs to 90°, control descent'
			}
		]
	}
];

/**
 * Get all exercises for a template with full exercise details
 */
export function getTemplateExercises(
	template: WorkoutTemplate,
	customExercises: Array<Exercise & { id: string }> = []
): Array<{
	exercise: Exercise;
	sets: number;
	reps: number | string;
	restSeconds: number;
	notes?: string;
}> {
	return template.exercises
		.map((templateEx) => {
			const exercise = getExerciseById(templateEx.exerciseId) || customExercises.find(ce => ce.id === templateEx.exerciseId);
			if (!exercise) return null;
			return {
				exercise,
				sets: templateEx.sets,
				reps: templateEx.reps,
				restSeconds: templateEx.restSeconds,
				notes: templateEx.notes
			};
		})
		.filter((ex): ex is NonNullable<typeof ex> => ex !== null);
}

/**
 * Convert template to workout format
 */
export function templateToWorkoutExercises(
	template: WorkoutTemplate,
	customExercises: Array<Exercise & { id: string }> = []
): Array<{
	exercise: Exercise;
	exerciseType: 'weights' | 'bodyweight' | 'cardio' | 'stretches';
	sets?: Array<{ reps: number; weight: number; rest: number; completed: boolean }>;
	durationMinutes?: number;
	calories?: number;
	durationSeconds?: number;
	reps?: number;
	completed?: boolean;
}> {
	return getTemplateExercises(template, customExercises).map(({ exercise, sets, reps, restSeconds }) => {
		if (exercise.exerciseType === 'cardio') {
			return {
				exercise,
				exerciseType: 'cardio' as const,
				durationMinutes: exercise.defaultDurationMinutes || 30,
				calories: exercise.defaultCalories || 300,
				completed: false
			};
		} else if (exercise.exerciseType === 'stretches') {
			return {
				exercise,
				exerciseType: 'stretches' as const,
				durationSeconds: exercise.defaultDurationSeconds || 60,
				reps: exercise.defaultRepsStretches || 10,
				completed: false
			};
		} else {
			// Weights or bodyweight
			// Parse reps - handle "6-8", "max reps", or number
			let defaultReps = exercise.defaultReps || 10;
			if (typeof reps === 'string') {
				if (reps.includes('-')) {
					// Take the lower number for default
					const [min] = reps.split('-').map(Number);
					defaultReps = min || exercise.defaultReps || 10;
				} else if (reps.toLowerCase().includes('max')) {
					// Use exercise default for max reps
					defaultReps = exercise.defaultReps || 10;
				}
			} else {
				defaultReps = reps || exercise.defaultReps || 10;
			}

			return {
				exercise,
				exerciseType: exercise.exerciseType === 'bodyweight' ? ('bodyweight' as const) : ('weights' as const),
				sets: Array.from({ length: sets || exercise.defaultSets || 3 }, () => ({
					reps: defaultReps,
					weight: 0,
					rest: restSeconds || exercise.defaultRestSeconds || 60,
					completed: false
				}))
			};
		}
	});
}

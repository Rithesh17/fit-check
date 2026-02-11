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
				exerciseId: 'squat', // Dumbbell Goblet Squat
				sets: 4,
				reps: '6-8',
				restSeconds: 120,
				notes: 'Heavy but clean - use dumbbells'
			},
			{
				exerciseId: 'romanian-deadlift', // Dumbbell RDL
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
				exerciseId: 'hanging-leg-raises', // Hanging Knee Raises or Captain's Chair
				sets: 3,
				reps: '10-15',
				restSeconds: 90,
				notes: 'Hanging knee raises or captain\'s chair'
			},
			{
				exerciseId: 'plank', // Front Plank
				sets: 3,
				reps: 1,
				restSeconds: 60,
				notes: 'Hold 45-60 seconds'
			},
			{
				exerciseId: 'russian-twists', // Cable or Band Woodchoppers
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
				exerciseId: 'bench-press', // Dumbbell Bench Press
				sets: 4,
				reps: '6-8',
				restSeconds: 120,
				notes: 'Use dumbbells'
			},
			{
				exerciseId: 'incline-bench-press', // Incline DB Bench or Push-ups
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
				exerciseId: 'dips', // Tricep Dips or DB Skull Crushers
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
				exerciseId: 'barbell-row', // One-Arm DB Row
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
				exerciseId: 'face-pulls', // Face Pulls or Rear Delt Fly
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
				exerciseId: 'plank', // Dead Bug or Hollow Hold
				sets: 3,
				reps: 1,
				restSeconds: 60,
				notes: 'Dead bug or hollow hold - hold 30-45 seconds'
			},
			{
				exerciseId: 'deadlift', // Back Extension or Reverse Hyper
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
				exerciseId: 'front-squat', // DB Front Squat or Goblet Squat
				sets: 3,
				reps: 8,
				restSeconds: 90,
				notes: 'DB front squat or goblet squat'
			},
			{
				exerciseId: 'romanian-deadlift', // DB RDL
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
	}
];

/**
 * Get all exercises for a template with full exercise details
 */
export function getTemplateExercises(template: WorkoutTemplate): Array<{
	exercise: Exercise;
	sets: number;
	reps: number | string;
	restSeconds: number;
	notes?: string;
}> {
	return template.exercises
		.map((templateEx) => {
			const exercise = getExerciseById(templateEx.exerciseId);
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
export function templateToWorkoutExercises(template: WorkoutTemplate): Array<{
	exercise: Exercise;
	sets: Array<{ reps: number; weight: number; rest: number; completed: boolean }>;
}> {
	return getTemplateExercises(template).map(({ exercise, sets, reps, restSeconds }) => {
		// Parse reps - handle "6-8", "max reps", or number
		let defaultReps = exercise.defaultReps;
		if (typeof reps === 'string') {
			if (reps.includes('-')) {
				// Take the lower number for default
				const [min] = reps.split('-').map(Number);
				defaultReps = min || exercise.defaultReps;
			} else if (reps.toLowerCase().includes('max')) {
				// Use exercise default for max reps
				defaultReps = exercise.defaultReps;
			}
		} else {
			defaultReps = reps;
		}

		return {
			exercise,
			sets: Array.from({ length: sets }, () => ({
				reps: defaultReps,
				weight: 0,
				rest: restSeconds,
				completed: false
			}))
		};
	});
}

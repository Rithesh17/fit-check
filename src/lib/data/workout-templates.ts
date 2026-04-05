/**
 * Pre-configured Workout Templates
 * Based on muscle group training plan
 */

import { getExerciseById, isTimeBased, type Exercise } from './exercises';

export interface WorkoutTemplateExercise {
	exerciseId: string;
	sets: number;
	reps?: number | string; // Can be "max reps" or number range like "6-8". Not used for time-based exercises.
	durationSeconds?: number; // For time-based exercises (trackingMode: 'time')
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
	// LOWER BODY — six moves: squat, hinge, two unilateral, ham curl, calves
	{
		id: 'lower-body',
		name: 'Lower Body',
		description: 'Six lifts: quads, hamstrings (hip hinge + knee flexion), glutes, calves',
		muscleGroups: ['quadriceps', 'hamstrings', 'glutes', 'calves'],
		exercises: [
			{
				exerciseId: 'goblet-squat',
				sets: 4,
				reps: '6-8',
				restSeconds: 120,
				notes: 'Hold dumbbell at chest, depth you own'
			},
			{
				exerciseId: 'dumbbell-romanian-deadlift',
				sets: 4,
				reps: 8,
				restSeconds: 120,
				notes: 'Hip hinge; stretch hamstrings, neutral spine'
			},
			{
				exerciseId: 'bulgarian-split-squat',
				sets: 3,
				reps: 8,
				restSeconds: 90,
				notes: 'Each leg — hold dumbbells at sides'
			},
			{
				exerciseId: 'lunges',
				sets: 3,
				reps: '10-12',
				restSeconds: 90,
				notes: 'Walking or static; each leg'
			},
			{
				exerciseId: 'leg-curl',
				sets: 3,
				reps: '12-15',
				restSeconds: 60,
				notes: 'Lying or seated machine — knee-flexion for hamstrings'
			},
			{
				exerciseId: 'calf-raise',
				sets: 3,
				reps: '12-15',
				restSeconds: 60,
				notes: 'Standing; full stretch and squeeze'
			}
		]
	},
	// CORE — balanced daily circuit: upper + lower RA, obliques, TVA, posterior, lateral
	{
		id: 'core',
		name: 'Core',
		description: 'Balanced 10-move circuit: upper/lower RA, obliques (rotation + lateral), TVA, posterior core, lateral stability',
		muscleGroups: ['core'],
		exercises: [
			{
				exerciseId: 'butterfly-crunches',
				sets: 1,
				durationSeconds: 45,
				restSeconds: 30,
				notes: 'Upper RA, no hip flexor cheating'
			},
			{
				exerciseId: 'reverse-crunch-leg-opener',
				sets: 1,
				durationSeconds: 45,
				restSeconds: 30,
				notes: 'Lower RA'
			},
			{
				exerciseId: 'leg-lowers',
				sets: 1,
				durationSeconds: 45,
				restSeconds: 45,
				notes: 'Lower RA + highest TVA anti-extension demand'
			},
			{
				exerciseId: 'cross-crunches',
				sets: 1,
				durationSeconds: 45,
				restSeconds: 30,
				notes: 'Obliques (rotation)'
			},
			{
				exerciseId: 'heel-taps',
				sets: 1,
				durationSeconds: 45,
				restSeconds: 45,
				notes: 'Obliques (lateral flexion)'
			},
			{
				exerciseId: 'spider-crunches',
				sets: 1,
				durationSeconds: 45,
				restSeconds: 60,
				notes: 'Highest oblique activation (ACE EMG)'
			},
			{
				exerciseId: 'single-leg-extensions',
				sets: 1,
				durationSeconds: 45,
				restSeconds: 30,
				notes: 'TVA isolation (deep stabiliser)'
			},
			{
				exerciseId: 'plank-knee-tucks',
				sets: 1,
				durationSeconds: 45,
				restSeconds: 30,
				notes: 'TVA + integrated stability'
			},
			{
				exerciseId: 'side-plank',
				sets: 1,
				durationSeconds: 45,
				restSeconds: 30,
				notes: 'Each side — QL + lateral core'
			},
			{
				exerciseId: 'bird-dog',
				sets: 1,
				durationSeconds: 45,
				restSeconds: 30,
				notes: 'Posterior core, erectors, multifidus'
			}
		]
	},
	// UPPER PUSH — six moves: chest flat + incline, three delt angles, triceps long head
	{
		id: 'upper-push',
		name: 'Upper Push',
		description: 'Chest, shoulders, triceps — six lifts (presses cover mid/upper chest and triceps load)',
		muscleGroups: ['chest', 'shoulders', 'triceps'],
		exercises: [
			{
				exerciseId: 'dumbbell-bench-press',
				sets: 4,
				reps: '6-8',
				restSeconds: 120,
				notes: 'Mid/sternal chest; heavy compound'
			},
			{
				exerciseId: 'incline-dumbbell-bench-press',
				sets: 3,
				reps: '8-10',
				restSeconds: 90,
				notes: '30–45°; clavicular chest fibers'
			},
			{
				exerciseId: 'dumbbell-shoulder-press',
				sets: 3,
				reps: '6-8',
				restSeconds: 90,
				notes: 'Anterior delts; seated or standing'
			},
			{
				exerciseId: 'lateral-raises',
				sets: 3,
				reps: '12-15',
				restSeconds: 60,
				notes: 'Lateral delts'
			},
			{
				exerciseId: 'rear-delt-fly',
				sets: 3,
				reps: '12-15',
				restSeconds: 60,
				notes: 'Posterior delts; bent-over'
			},
			{
				exerciseId: 'overhead-tricep-extension',
				sets: 3,
				reps: '10-12',
				restSeconds: 60,
				notes: 'Long head of triceps; presses already load lateral/medial heads'
			}
		]
	},
	// UPPER PULL — vertical + horizontal + scap work; three curl angles for biceps/brachialis
	{
		id: 'upper-pull',
		name: 'Upper Pull',
		description: 'Back and biceps — vertical pull, row, scap work, then three curl variations',
		muscleGroups: ['back', 'biceps'],
		exercises: [
			{
				exerciseId: 'pull-ups',
				sets: 4,
				reps: 'max reps',
				restSeconds: 120,
				notes: 'Vertical pull — lats; assisted or band if needed'
			},
			{
				exerciseId: 'one-arm-dumbbell-row',
				sets: 4,
				reps: 8,
				restSeconds: 90,
				notes: 'Horizontal pull — thickness, rhomboids, lats'
			},
			{
				exerciseId: 'face-pulls',
				sets: 3,
				reps: '15-20',
				restSeconds: 60,
				notes: 'External rotation at end; rope to face'
			},
			{
				exerciseId: 'hammer-curl',
				sets: 3,
				reps: '10-12',
				restSeconds: 60,
				notes: 'Brachialis and neutral grip'
			},
			{
				exerciseId: 'incline-dumbbell-curl',
				sets: 3,
				reps: '8-10',
				restSeconds: 60,
				notes: 'Arms behind body; long-head emphasis'
			},
			{
				exerciseId: 'dumbbell-curl',
				sets: 3,
				reps: '10-12',
				restSeconds: 60,
				notes: 'Standing; supinated, full ROM'
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
	reps?: number | string;
	durationSeconds?: number;
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
				durationSeconds: templateEx.durationSeconds,
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
	return getTemplateExercises(template, customExercises).map(({ exercise, sets, reps, durationSeconds, restSeconds }) => {
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
		} else if (isTimeBased(exercise)) {
			// Time-based weights/bodyweight
			const setDuration = durationSeconds ?? exercise.defaultDurationSeconds ?? 45;
			return {
				exercise,
				exerciseType: exercise.exerciseType === 'bodyweight' ? ('bodyweight' as const) : ('weights' as const),
				sets: Array.from({ length: sets || exercise.defaultSets || 1 }, () => ({
					reps: 0,
					weight: 0,
					rest: restSeconds || exercise.defaultRestSeconds || 30,
					completed: false,
					durationSeconds: setDuration
				}))
			};
		} else {
			// Weights or bodyweight — reps-based
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
			} else if (reps != null) {
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

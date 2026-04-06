/**
 * Pre-configured Workout Templates
 * Based on muscle group training plan.
 *
 * Each template uses slots. A slot is one exercise position.
 * alternatives[0] is the primary; additional alternatives are fallbacks.
 * All defaults come from config.ts — no magic numbers inline.
 */

import { getExerciseById, isTimeBased, type Exercise } from './exercises';
import { DEFAULT_SETS, DEFAULT_REPS, DEFAULT_REST_BETWEEN_SETS } from './config';
import type { ActiveWorkoutSlot } from '$lib/stores/active-workout';

export type WorkoutTemplateAlternative = {
	exerciseId: string;
	sets: number;
	reps?: number | string; // number, range like "6-8", or "max reps"
	durationSeconds?: number; // for time-based exercises
	restSeconds: number;
	notes?: string;
};

export type WorkoutTemplateSlot = {
	alternatives: WorkoutTemplateAlternative[]; // index 0 = primary
};

export interface WorkoutTemplate {
	id: string;
	name: string;
	description: string;
	muscleGroups: string[];
	slots: WorkoutTemplateSlot[];
}

export const workoutTemplates: WorkoutTemplate[] = [
	// LOWER BODY — six moves: squat, hinge, two unilateral, ham curl, calves
	{
		id: 'lower-body',
		name: 'Lower Body',
		description: 'Six lifts: quads, hamstrings (hip hinge + knee flexion), glutes, calves',
		muscleGroups: ['quadriceps', 'hamstrings', 'glutes', 'calves'],
		slots: [
			{
				alternatives: [
					{
						exerciseId: 'goblet-squat',
						sets: 4,
						reps: '6-8',
						restSeconds: 120,
						notes: 'Hold dumbbell at chest, depth you own'
					}
				]
			},
			{
				alternatives: [
					{
						exerciseId: 'dumbbell-romanian-deadlift',
						sets: 4,
						reps: 8,
						restSeconds: 120,
						notes: 'Hip hinge; stretch hamstrings, neutral spine'
					}
				]
			},
			{
				alternatives: [
					{
						exerciseId: 'bulgarian-split-squat',
						sets: 3,
						reps: 8,
						restSeconds: 90,
						notes: 'Each leg — hold dumbbells at sides'
					}
				]
			},
			{
				alternatives: [
					{
						exerciseId: 'lunges',
						sets: 3,
						reps: '10-12',
						restSeconds: 90,
						notes: 'Walking or static; each leg'
					}
				]
			},
			{
				alternatives: [
					{
						exerciseId: 'leg-curl',
						sets: 3,
						reps: '12-15',
						restSeconds: 60,
						notes: 'Lying or seated machine — knee-flexion for hamstrings'
					}
				]
			},
			{
				alternatives: [
					{
						exerciseId: 'calf-raise',
						sets: 3,
						reps: '12-15',
						restSeconds: 60,
						notes: 'Standing; full stretch and squeeze'
					}
				]
			}
		]
	},

	// CORE — balanced daily circuit
	{
		id: 'core',
		name: 'Core',
		description:
			'Balanced 10-move circuit: upper/lower RA, obliques (rotation + lateral), TVA, posterior core, lateral stability',
		muscleGroups: ['core'],
		slots: [
			{
				alternatives: [
					{
						exerciseId: 'butterfly-crunches',
						sets: 1,
						durationSeconds: 45,
						restSeconds: 30,
						notes: 'Upper RA, no hip flexor cheating'
					}
				]
			},
			{
				alternatives: [
					{
						exerciseId: 'reverse-crunch-leg-opener',
						sets: 1,
						durationSeconds: 45,
						restSeconds: 30,
						notes: 'Lower RA'
					}
				]
			},
			{
				alternatives: [
					{
						exerciseId: 'leg-lowers',
						sets: 1,
						durationSeconds: 45,
						restSeconds: 45,
						notes: 'Lower RA + highest TVA anti-extension demand'
					}
				]
			},
			{
				alternatives: [
					{
						exerciseId: 'cross-crunches',
						sets: 1,
						durationSeconds: 45,
						restSeconds: 30,
						notes: 'Obliques (rotation)'
					}
				]
			},
			{
				alternatives: [
					{
						exerciseId: 'heel-taps',
						sets: 1,
						durationSeconds: 45,
						restSeconds: 45,
						notes: 'Obliques (lateral flexion)'
					}
				]
			},
			{
				alternatives: [
					{
						exerciseId: 'spider-crunches',
						sets: 1,
						durationSeconds: 45,
						restSeconds: 60,
						notes: 'Highest oblique activation (ACE EMG)'
					}
				]
			},
			{
				alternatives: [
					{
						exerciseId: 'single-leg-extensions',
						sets: 1,
						durationSeconds: 45,
						restSeconds: 30,
						notes: 'TVA isolation (deep stabiliser)'
					}
				]
			},
			{
				alternatives: [
					{
						exerciseId: 'plank-knee-tucks',
						sets: 1,
						durationSeconds: 45,
						restSeconds: 30,
						notes: 'TVA + integrated stability'
					}
				]
			},
			{
				alternatives: [
					{
						exerciseId: 'side-plank',
						sets: 1,
						durationSeconds: 45,
						restSeconds: 30,
						notes: 'Each side — QL + lateral core'
					}
				]
			},
			{
				alternatives: [
					{
						exerciseId: 'bird-dog',
						sets: 1,
						durationSeconds: 45,
						restSeconds: 30,
						notes: 'Posterior core, erectors, multifidus'
					}
				]
			}
		]
	},

	// UPPER PUSH — chest flat + incline, three delt angles, triceps long head
	{
		id: 'upper-push',
		name: 'Upper Push',
		description:
			'Chest, shoulders, triceps — six lifts (presses cover mid/upper chest and triceps load)',
		muscleGroups: ['chest', 'shoulders', 'triceps'],
		slots: [
			{
				alternatives: [
					{
						exerciseId: 'dumbbell-bench-press',
						sets: 4,
						reps: '6-8',
						restSeconds: 120,
						notes: 'Mid/sternal chest; heavy compound'
					}
				]
			},
			{
				alternatives: [
					{
						exerciseId: 'incline-dumbbell-bench-press',
						sets: 3,
						reps: '8-10',
						restSeconds: 90,
						notes: '30–45°; clavicular chest fibers'
					}
				]
			},
			{
				alternatives: [
					{
						exerciseId: 'dumbbell-shoulder-press',
						sets: 3,
						reps: '6-8',
						restSeconds: 90,
						notes: 'Anterior delts; seated or standing'
					}
				]
			},
			{
				alternatives: [
					{
						exerciseId: 'lateral-raises',
						sets: 3,
						reps: '12-15',
						restSeconds: 60,
						notes: 'Lateral delts'
					}
				]
			},
			{
				alternatives: [
					{
						exerciseId: 'rear-delt-fly',
						sets: 3,
						reps: '12-15',
						restSeconds: 60,
						notes: 'Posterior delts; bent-over'
					}
				]
			},
			{
				alternatives: [
					{
						exerciseId: 'overhead-tricep-extension',
						sets: 3,
						reps: '10-12',
						restSeconds: 60,
						notes: 'Long head of triceps'
					}
				]
			}
		]
	},

	// UPPER PULL — vertical + horizontal + scap work; three curl angles
	{
		id: 'upper-pull',
		name: 'Upper Pull',
		description: 'Back and biceps — vertical pull, row, scap work, then three curl variations',
		muscleGroups: ['back', 'biceps'],
		slots: [
			{
				alternatives: [
					{
						exerciseId: 'pull-ups',
						sets: 4,
						reps: 'max reps',
						restSeconds: 120,
						notes: 'Vertical pull — lats; assisted or band if needed'
					}
				]
			},
			{
				alternatives: [
					{
						exerciseId: 'one-arm-dumbbell-row',
						sets: 4,
						reps: 8,
						restSeconds: 90,
						notes: 'Horizontal pull — thickness, rhomboids, lats'
					}
				]
			},
			{
				alternatives: [
					{
						exerciseId: 'face-pulls',
						sets: 3,
						reps: '15-20',
						restSeconds: 60,
						notes: 'External rotation at end; rope to face'
					}
				]
			},
			{
				alternatives: [
					{
						exerciseId: 'hammer-curl',
						sets: 3,
						reps: '10-12',
						restSeconds: 60,
						notes: 'Brachialis and neutral grip'
					}
				]
			},
			{
				alternatives: [
					{
						exerciseId: 'incline-dumbbell-curl',
						sets: 3,
						reps: '8-10',
						restSeconds: 60,
						notes: 'Arms behind body; long-head emphasis'
					}
				]
			},
			{
				alternatives: [
					{
						exerciseId: 'dumbbell-curl',
						sets: 3,
						reps: '10-12',
						restSeconds: 60,
						notes: 'Standing; supinated, full ROM'
					}
				]
			}
		]
	}
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function parseReps(reps: number | string | undefined, fallback: number): number {
	if (reps == null) return fallback;
	if (typeof reps === 'number') return reps || fallback;
	if (reps.includes('-')) return Number(reps.split('-')[0]) || fallback;
	if (reps.toLowerCase().includes('max')) return fallback;
	return Number(reps) || fallback;
}

function alternativeToActiveSlot(
	alt: WorkoutTemplateAlternative,
	customExercises: Exercise[] = []
): ActiveWorkoutSlot['alternatives'][number] | null {
	const exercise =
		getExerciseById(alt.exerciseId) ||
		customExercises.find((ce) => ce.id === alt.exerciseId);
	if (!exercise) return null;

	const restSeconds = alt.restSeconds ?? DEFAULT_REST_BETWEEN_SETS;

	if (exercise.exerciseType === 'cardio') {
		return {
			exerciseId: exercise.id,
			exerciseName: exercise.name,
			exerciseType: 'cardio',
			durationMinutes: exercise.defaultDurationMinutes ?? 20,
			calories: exercise.defaultCalories ?? 0,
			completed: false
		};
	}

	if (exercise.exerciseType === 'stretches') {
		return {
			exerciseId: exercise.id,
			exerciseName: exercise.name,
			exerciseType: 'stretches',
			durationSeconds: exercise.defaultDurationSeconds ?? 30,
			reps: exercise.defaultRepsStretches ?? 3,
			completed: false
		};
	}

	// weights / bodyweight
	const numSets = alt.sets ?? DEFAULT_SETS;
	const timeBased = isTimeBased(exercise);

	if (timeBased) {
		const dur = alt.durationSeconds ?? exercise.defaultDurationSeconds ?? 45;
		return {
			exerciseId: exercise.id,
			exerciseName: exercise.name,
			exerciseType: exercise.exerciseType as 'weights' | 'bodyweight',
			sets: Array.from({ length: numSets }, () => ({
				reps: 0,
				weight: 0,
				rest: restSeconds,
				completed: false,
				durationSeconds: dur
			}))
		};
	}

	const numReps = parseReps(alt.reps, exercise.defaultReps ?? DEFAULT_REPS);
	return {
		exerciseId: exercise.id,
		exerciseName: exercise.name,
		exerciseType: exercise.exerciseType as 'weights' | 'bodyweight',
		sets: Array.from({ length: numSets }, () => ({
			reps: numReps,
			weight: 0,
			rest: restSeconds,
			completed: false
		}))
	};
}

/**
 * Convert a WorkoutTemplate to ActiveWorkoutSlot[] ready for the active workout store.
 */
export function templateToActiveSlots(
	template: WorkoutTemplate,
	customExercises: Exercise[] = []
): ActiveWorkoutSlot[] {
	return template.slots
		.map((slot): ActiveWorkoutSlot | null => {
			const alts = slot.alternatives
				.map((alt) => alternativeToActiveSlot(alt, customExercises))
				.filter((a): a is NonNullable<typeof a> => a !== null);

			if (alts.length === 0) return null;

			return {
				alternatives: alts,
				// Single-alternative slots are auto-chosen; multi-alternative slots wait for user pick
				chosenIndex: alts.length === 1 ? 0 : null
			};
		})
		.filter((s): s is ActiveWorkoutSlot => s !== null);
}

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

	// UPPER PUSH — all chest regions, three delt heads, all three tricep heads
	{
		id: 'upper-push',
		name: 'Upper Push',
		description:
			'Chest (upper/mid/lower + fly), shoulders (all three heads), triceps (long + lateral/medial) — eight lifts',
		muscleGroups: ['chest', 'shoulders', 'triceps'],
		slots: [
			// Slot 1: Mid/sternal chest — horizontal press
			{
				alternatives: [
					{
						exerciseId: 'dumbbell-bench-press',
						sets: 3,
						reps: '6-8',
						restSeconds: 120,
						notes: 'Mid/sternal chest; heavy compound'
					},
					{
						exerciseId: 'bench-press',
						sets: 3,
						reps: '6-8',
						restSeconds: 120,
						notes: 'Barbell; heavier loading, same mid-chest target'
					},
					{
						exerciseId: 'machine-chest-press',
						sets: 3,
						reps: '10-12',
						restSeconds: 90,
						notes: 'Fixed path; good for high-rep isolation'
					},
					{
						exerciseId: 'cable-chest-press',
						sets: 3,
						reps: '10-12',
						restSeconds: 90,
						notes: 'Constant tension throughout full ROM'
					},
					{
						exerciseId: 'push-ups',
						sets: 3,
						reps: 'max reps',
						restSeconds: 60,
						notes: 'Bodyweight horizontal push'
					}
				]
			},
			// Slot 2: Upper/clavicular chest — incline press
			{
				alternatives: [
					{
						exerciseId: 'incline-dumbbell-bench-press',
						sets: 3,
						reps: '8-10',
						restSeconds: 90,
						notes: '30-45°; clavicular chest fibers'
					},
					{
						exerciseId: 'incline-bench-press',
						sets: 3,
						reps: '8-10',
						restSeconds: 90,
						notes: 'Barbell incline; heavier loading'
					},
					{
						exerciseId: 'incline-machine-press',
						sets: 3,
						reps: '10-12',
						restSeconds: 90,
						notes: 'Machine; controlled path for upper chest'
					},
					{
						exerciseId: 'decline-push-up',
						sets: 3,
						reps: 'max reps',
						restSeconds: 60,
						notes: 'Feet elevated; bodyweight upper chest'
					},
					{
						exerciseId: 'low-to-high-cable-fly',
						sets: 3,
						reps: '12-15',
						restSeconds: 60,
						notes: 'Constant tension; best cable option for upper chest'
					}
				]
			},
			// Slot 3: Lower/costal chest — chest dips
			{
				alternatives: [
					{
						exerciseId: 'chest-dips',
						sets: 3,
						reps: 'max reps',
						restSeconds: 90,
						notes: 'Torso forward ~30°; lower pec + lateral/medial tricep'
					},
					{
						exerciseId: 'decline-barbell-press',
						sets: 3,
						reps: '8-10',
						restSeconds: 90,
						notes: 'Decline angle; most direct lower pec loading'
					},
					{
						exerciseId: 'decline-dumbbell-press',
						sets: 3,
						reps: '10-12',
						restSeconds: 90,
						notes: 'Decline; greater ROM per side'
					},
					{
						exerciseId: 'high-to-low-cable-fly',
						sets: 3,
						reps: '12-15',
						restSeconds: 60,
						notes: 'Cable from high anchor; isolates lower costal fibers'
					},
					{
						exerciseId: 'decline-dumbbell-fly',
						sets: 3,
						reps: '12-15',
						restSeconds: 60,
						notes: 'Decline fly; lower pec stretch + adduction'
					}
				]
			},
			// Slot 4: Chest adduction/stretch — fly
			{
				alternatives: [
					{
						exerciseId: 'dumbbell-flyes',
						sets: 3,
						reps: '10-12',
						restSeconds: 60,
						notes: 'Mid chest; full stretch at long muscle length'
					},
					{
						exerciseId: 'cable-crossovers',
						sets: 3,
						reps: '12-15',
						restSeconds: 60,
						notes: 'Constant tension through full adduction ROM'
					},
					{
						exerciseId: 'pec-deck',
						sets: 3,
						reps: '12-15',
						restSeconds: 60,
						notes: 'Machine; consistent resistance curve, great isolation'
					},
					{
						exerciseId: 'incline-dumbbell-fly',
						sets: 3,
						reps: '10-12',
						restSeconds: 60,
						notes: 'Shifts stretch to upper/clavicular chest'
					}
				]
			},
			// Slot 5: Anterior delt — overhead press
			{
				alternatives: [
					{
						exerciseId: 'dumbbell-shoulder-press',
						sets: 3,
						reps: '8-10',
						restSeconds: 90,
						notes: 'Anterior delts; seated or standing'
					},
					{
						exerciseId: 'overhead-press',
						sets: 3,
						reps: '6-8',
						restSeconds: 120,
						notes: 'Barbell OHP; highest load ceiling'
					},
					{
						exerciseId: 'arnold-press',
						sets: 3,
						reps: '10-12',
						restSeconds: 90,
						notes: 'Rotation adds broader anterior + medial delt recruitment'
					},
					{
						exerciseId: 'machine-shoulder-press',
						sets: 3,
						reps: '10-12',
						restSeconds: 90,
						notes: 'Fixed path; stable option under fatigue'
					}
				]
			},
			// Slot 6: Medial delt — lateral raise
			{
				alternatives: [
					{
						exerciseId: 'lateral-raises',
						sets: 3,
						reps: '12-15',
						restSeconds: 60,
						notes: 'Medial delt isolation'
					},
					{
						exerciseId: 'cable-lateral-raise',
						sets: 3,
						reps: '12-15',
						restSeconds: 60,
						notes: 'Constant tension at bottom of ROM; single arm'
					},
					{
						exerciseId: 'machine-lateral-raise',
						sets: 3,
						reps: '12-15',
						restSeconds: 60,
						notes: 'Most consistent resistance curve'
					},
					{
						exerciseId: 'upright-row',
						sets: 3,
						reps: '12-15',
						restSeconds: 60,
						notes: 'Wide grip; medial delt + upper traps'
					}
				]
			},
			// Slot 7: Posterior delt — rear delt fly
			{
				alternatives: [
					{
						exerciseId: 'rear-delt-flyes',
						sets: 3,
						reps: '12-15',
						restSeconds: 60,
						notes: 'Posterior delts; bent-over dumbbell'
					},
					{
						exerciseId: 'reverse-pec-deck',
						sets: 3,
						reps: '15',
						restSeconds: 60,
						notes: 'Machine; best isolation, no balance demand'
					},
					{
						exerciseId: 'cable-rear-delt-fly',
						sets: 3,
						reps: '15',
						restSeconds: 60,
						notes: 'Single arm cable; constant tension on posterior delt'
					},
					{
						exerciseId: 'face-pulls',
						sets: 3,
						reps: '15-20',
						restSeconds: 60,
						notes: 'Also trains external rotators; shoulder health bonus'
					}
				]
			},
			// Slot 8: Tricep long head — overhead extension
			{
				alternatives: [
					{
						exerciseId: 'overhead-tricep-extension',
						sets: 3,
						reps: '10-12',
						restSeconds: 60,
						notes: 'Long head; shoulder flexion maximises stretch'
					},
					{
						exerciseId: 'skull-crushers',
						sets: 3,
						reps: '10-12',
						restSeconds: 60,
						notes: 'Barbell; heavy loading, long head stretch on flat bench'
					},
					{
						exerciseId: 'dumbbell-skull-crushers',
						sets: 3,
						reps: '10-12',
						restSeconds: 60,
						notes: 'Greater ROM per arm; addresses imbalances'
					},
					{
						exerciseId: 'cable-overhead-tricep-extension',
						sets: 3,
						reps: '12-15',
						restSeconds: 60,
						notes: 'Constant tension on long head throughout'
					},
					{
						exerciseId: 'single-arm-overhead-tricep-extension',
						sets: 3,
						reps: '12-15',
						restSeconds: 60,
						notes: 'Unilateral; fixes left/right imbalances'
					}
				]
			}
		]
	},

	// UPPER PULL — all back regions, all three bicep heads, brachialis/brachioradialis
	{
		id: 'upper-pull',
		name: 'Upper Pull',
		description:
			'Back (upper lats, lower lats, rhomboids/traps, posterior delt) + biceps (long head, short head, brachialis) — eight lifts',
		muscleGroups: ['back', 'biceps', 'forearms'],
		slots: [
			// Slot 1: Vertical pull — upper lats, width
			{
				alternatives: [
					{
						exerciseId: 'pull-ups',
						sets: 3,
						reps: 'max reps',
						restSeconds: 120,
						notes: 'Vertical pull — upper lats, teres major; assisted or band if needed'
					},
					{
						exerciseId: 'lat-pulldown',
						sets: 3,
						reps: '8-10',
						restSeconds: 90,
						notes: 'Same vertical pull pattern, loadable'
					},
					{
						exerciseId: 'neutral-grip-pull-up',
						sets: 3,
						reps: 'max reps',
						restSeconds: 120,
						notes: 'Palms facing — shifts emphasis to lower lats and brachialis'
					}
				]
			},
			// Slot 2: Horizontal pull — rhomboids, middle traps, thickness
			{
				alternatives: [
					{
						exerciseId: 'one-arm-dumbbell-row',
						sets: 3,
						reps: '8-10',
						restSeconds: 90,
						notes: 'Full ROM — elbow past torso for complete rhomboid/middle-trap activation'
					},
					{
						exerciseId: 'barbell-row',
						sets: 3,
						reps: '6-8',
						restSeconds: 120,
						notes: 'Heavy horizontal pull; retract scapulae at top'
					},
					{
						exerciseId: 'seated-cable-row',
						sets: 3,
						reps: '10-12',
						restSeconds: 90,
						notes: 'Constant tension; close-grip targets lower lats too'
					},
					{
						exerciseId: 't-bar-row',
						sets: 3,
						reps: '8-10',
						restSeconds: 90,
						notes: 'Chest supported option; heavy mid-back loading'
					},
					{
						exerciseId: 'chest-supported-row',
						sets: 3,
						reps: '10-12',
						restSeconds: 90,
						notes: 'No lower-back involvement — pure rhomboid and mid-trap isolation'
					}
				]
			},
			// Slot 3: Lower lat isolation — straight-arm (no bicep drive)
			{
				alternatives: [
					{
						exerciseId: 'straight-arm-pulldown',
						sets: 3,
						reps: '12-15',
						restSeconds: 60,
						notes: 'Arms locked straight — isolates lower lats through shoulder extension alone'
					},
					{
						exerciseId: 'dumbbell-pullover',
						sets: 3,
						reps: '12-15',
						restSeconds: 60,
						notes: 'Full overhead stretch — lower lats + serratus anterior'
					}
				]
			},
			// Slot 4: Posterior chain — rear delt, external rotators, lower/middle traps
			{
				alternatives: [
					{
						exerciseId: 'face-pulls',
						sets: 3,
						reps: '15-20',
						restSeconds: 60,
						notes: 'Pull to forehead with external rotation — posterior delt + infraspinatus + lower traps'
					},
					{
						exerciseId: 'rear-delt-flyes',
						sets: 3,
						reps: '12-15',
						restSeconds: 60,
						notes: 'Bent-over fly — posterior delt isolation'
					},
					{
						exerciseId: 'reverse-pec-deck',
						sets: 3,
						reps: '15',
						restSeconds: 60,
						notes: 'Machine — best posterior delt isolation, no balance demand'
					},
					{
						exerciseId: 'band-pull-apart',
						sets: 3,
						reps: '15-20',
						restSeconds: 45,
						notes: 'Bodyweight — posterior delt and external rotators; great shoulder health'
					}
				]
			},
			// Slot 5: Bicep overall — both heads, supinated
			{
				alternatives: [
					{
						exerciseId: 'dumbbell-curl',
						sets: 3,
						reps: '10-12',
						restSeconds: 60,
						notes: 'Standing supinated — full ROM, both heads'
					},
					{
						exerciseId: 'barbell-curl',
						sets: 3,
						reps: '8-10',
						restSeconds: 60,
						notes: 'Barbell — heavier loading, bilateral'
					},
					{
						exerciseId: 'ez-bar-curl',
						sets: 3,
						reps: '10-12',
						restSeconds: 60,
						notes: 'Semi-supinated grip — easier on wrists, hits both heads'
					},
					{
						exerciseId: 'cable-curl',
						sets: 3,
						reps: '12-15',
						restSeconds: 60,
						notes: 'Constant tension throughout; squeeze at top'
					}
				]
			},
			// Slot 6: Bicep long head — arms behind body, maximum stretch
			{
				alternatives: [
					{
						exerciseId: 'incline-dumbbell-curl',
						sets: 3,
						reps: '8-10',
						restSeconds: 60,
						notes: 'Bench at 45-60°, arms hang behind torso — maximum long-head stretch'
					}
				]
			},
			// Slot 7: Bicep short head — arms in front, peak contraction
			{
				alternatives: [
					{
						exerciseId: 'concentration-curl',
						sets: 3,
						reps: '10-12',
						restSeconds: 60,
						notes: 'Elbow braced on thigh — best short-head and peak isolation'
					},
					{
						exerciseId: 'preacher-curl',
						sets: 3,
						reps: '10-12',
						restSeconds: 60,
						notes: 'Arm supported in front — short head emphasis, removes cheat'
					}
				]
			},
			// Slot 8: Brachialis + brachioradialis — neutral/reverse grip
			{
				alternatives: [
					{
						exerciseId: 'hammer-curl',
						sets: 3,
						reps: '10-12',
						restSeconds: 60,
						notes: 'Neutral grip — brachialis and brachioradialis'
					},
					{
						exerciseId: 'reverse-curl',
						sets: 3,
						reps: '12-15',
						restSeconds: 60,
						notes: 'Pronated grip — brachioradialis and forearm extensors'
					},
					{
						exerciseId: 'cross-body-hammer-curl',
						sets: 3,
						reps: '12-15',
						restSeconds: 60,
						notes: 'Curl across body — emphasises brachialis over brachioradialis'
					},
					{
						exerciseId: 'cable-hammer-curl',
						sets: 3,
						reps: '12-15',
						restSeconds: 60,
						notes: 'Rope attachment — constant tension on brachialis and brachioradialis'
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

/** Build a lean alternative (exercise metadata only — no sets). */
function templateAltToSlotAlt(
	alt: WorkoutTemplateAlternative,
	customExercises: Exercise[] = []
): ActiveWorkoutSlot['alternatives'][number] | null {
	const exercise =
		getExerciseById(alt.exerciseId) ||
		customExercises.find((ce) => ce.id === alt.exerciseId);
	if (!exercise) return null;

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

	// weights / bodyweight — sets live at slot level, not here
	return {
		exerciseId: exercise.id,
		exerciseName: exercise.name,
		exerciseType: exercise.exerciseType as 'weights' | 'bodyweight'
	};
}

/**
 * Convert a WorkoutTemplate to ActiveWorkoutSlot[] ready for the active workout store.
 *
 * Sets are built from the PRIMARY alternative's settings and stored at the slot
 * level. Each set is stamped with the primary exercise's id/name. Switching to an
 * alternative mid-workout updates the exerciseId/exerciseName on uncompleted sets
 * only, so completed sets permanently record which exercise was actually performed.
 */
export function templateToActiveSlots(
	template: WorkoutTemplate,
	customExercises: Exercise[] = []
): ActiveWorkoutSlot[] {
	return template.slots
		.map((slot): ActiveWorkoutSlot | null => {
			const alts = slot.alternatives
				.map((alt) => templateAltToSlotAlt(alt, customExercises))
				.filter((a): a is NonNullable<typeof a> => a !== null);

			if (alts.length === 0) return null;

			// Build slot-level sets from the primary alternative
			const primaryTemplateAlt = slot.alternatives[0];
			const primaryExercise =
				getExerciseById(primaryTemplateAlt.exerciseId) ||
				customExercises.find((ce) => ce.id === primaryTemplateAlt.exerciseId);

			if (!primaryExercise) return null;

			const restSeconds = primaryTemplateAlt.restSeconds ?? DEFAULT_REST_BETWEEN_SETS;

			// Cardio / stretches: no slot-level sets
			if (primaryExercise.exerciseType === 'cardio' || primaryExercise.exerciseType === 'stretches') {
				return { alternatives: alts, currentExerciseIndex: 0, sets: [] };
			}

			const numSets = primaryTemplateAlt.sets ?? DEFAULT_SETS;
			const timeBased = isTimeBased(primaryExercise);

			if (timeBased) {
				const dur = primaryTemplateAlt.durationSeconds ?? primaryExercise.defaultDurationSeconds ?? 45;
				return {
					alternatives: alts,
					currentExerciseIndex: 0,
					sets: Array.from({ length: numSets }, () => ({
						reps: 0,
						weight: 0,
						rest: restSeconds,
						completed: false,
						exerciseId: primaryExercise.id,
						exerciseName: primaryExercise.name,
						durationSeconds: dur
					}))
				};
			}

			const numReps = parseReps(primaryTemplateAlt.reps, primaryExercise.defaultReps ?? DEFAULT_REPS);
			return {
				alternatives: alts,
				currentExerciseIndex: 0,
				sets: Array.from({ length: numSets }, () => ({
					reps: numReps,
					weight: 0,
					rest: restSeconds,
					completed: false,
					exerciseId: primaryExercise.id,
					exerciseName: primaryExercise.name
				}))
			};
		})
		.filter((s): s is ActiveWorkoutSlot => s !== null);
}

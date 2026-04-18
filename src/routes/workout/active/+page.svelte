<script lang="ts">
	/**
	 * Active Workout Page
	 *
	 * Orchestrates the in-progress workout session. All UI state lives here;
	 * all persistence goes through `activeWorkout` store → sessionStorage.
	 *
	 * Key concepts:
	 *  - A workout is an ordered list of SLOTS.
	 *  - Each slot has 1..N alternatives (exercise pool) and a currentExerciseIndex.
	 *  - Sets live at the SLOT level. Each set carries its own exerciseId/exerciseName,
	 *    so switching alternatives mid-slot is non-destructive: completed sets keep
	 *    their original exercise; only uncompleted sets are re-stamped.
	 *  - Circuit mode: same set-index across all slots in a "round".
	 *  - Straight mode: all sets of one slot before moving to the next.
	 */

	import { onMount } from 'svelte';
	import { get } from 'svelte/store';
	import { goto } from '$app/navigation';
	import { isTimeBased, exercises as allExercises, type Exercise } from '$lib/data/exercises';
	import { saveWorkout, getLastSetsForExercise } from '$lib/services/workouts';
	import { toast } from '$lib/stores/toast';
	import RestTimer from '$lib/components/RestTimer.svelte';
	import ExerciseDetail from '$lib/components/ExerciseDetail.svelte';
	import ExerciseEditor from '$lib/components/ExerciseEditor.svelte';
	import {
		activeWorkout,
		type ActiveWorkoutSet,
		type ActiveWorkoutSlot,
		type ActiveSlotAlternative
	} from '$lib/stores/active-workout';
	import { loadCustomExercises, findExercise, type CustomExercise } from '$lib/services/exercises';
	import { convertWeight, getWeightUnitLabel, kgToLbs, lbsToKg } from '$lib/utils/weight-conversion';
	import { unitPreference } from '$lib/stores/unit-preference';
	import {
		DEFAULT_REST_BETWEEN_EXERCISES,
		DEFAULT_SETS,
		DEFAULT_REPS,
		DEFAULT_REST_BETWEEN_SETS
	} from '$lib/data/config';
	import {
		Check, X, Info, ChevronLeft, ChevronRight, Plus, Trash2,
		Search, RefreshCw, LayoutList, Timer, GripVertical
	} from 'lucide-svelte';

	// ─── Core state ────────────────────────────────────────────────────────────
	let workoutName = $state('');
	let slots = $state<ActiveWorkoutSlot[]>([]);
	let workoutNotes = $state('');
	let energyLevel = $state<number | null>(null);
	let mood = $state<string>('');
	let restDurationBetweenExercises = $state(DEFAULT_REST_BETWEEN_EXERCISES);
	let workoutMode = $state<'straight' | 'circuit'>('straight');

	let currentSlotIndex = $state(0);
	let currentSetIndex = $state(0);

	let workoutStartTime = $state<Date | null>(null);
	let workoutDuration = $state(0);
	let durationInterval: ReturnType<typeof setInterval> | null = null;

	// UI state
	let showRestTimer = $state(false);
	let isRestBetweenExercises = $state(false);
	let showOverview = $state(false);
	let showInstructions = $state(false);
	let showExerciseDetail = $state(false);
	let showExercisePicker = $state(false);
	let showExerciseEditor = $state(false);
	let editorReturnToPicker = $state(false);
	let showSwapPicker = $state(false);
	let exercisePickerSearch = $state('');
	let isSaving = $state(false);
	let overviewReopenAfterAdd = $state(false);
	let overviewDragFrom = $state<number | null>(null);
	let overviewDragOver = $state<number | null>(null);

	// Autofill
	let previousSetData = $state<Record<string, Array<{ reps: number; weight: number }>>>({});

	// Raw string state for weight input to allow intermediate decimal typing (e.g. "40.")
	let weightRaw = $state('');
	let weightInputFocused = $state(false);
	$effect(() => {
		if (!weightInputFocused) weightRaw = currentSet ? displayWeight(currentSet.weight) : '';
	});

	// Cardio / set timers
	let cardioTimerSeconds = $state(0);
	let cardioTimerInterval: ReturnType<typeof setInterval> | null = null;
	let cardioTimerRunning = $state(false);

	let customExercises = $state<CustomExercise[]>([]);
	const currentUnit = $derived($unitPreference);
	const weightLabel = $derived(getWeightUnitLabel(currentUnit));

	// ─── Derived helpers ────────────────────────────────────────────────────────

	/** The currently selected alternative (exercise) for this slot */
	const currentAlt = $derived<ActiveSlotAlternative | null>(
		slots[currentSlotIndex]
			? (slots[currentSlotIndex].alternatives[slots[currentSlotIndex].currentExerciseIndex] ?? null)
			: null
	);

	/** Exercise record for the currently selected alternative (used for instructions/detail) */
	const currentExercise = $derived<Exercise | null>(
		currentAlt ? (findExercise(currentAlt.exerciseId, customExercises) ?? null) : null
	);

	/** The set being viewed/edited — lives at slot level */
	const currentSet = $derived(
		slots[currentSlotIndex] && (currentAlt?.exerciseType === 'weights' || currentAlt?.exerciseType === 'bodyweight')
			? (slots[currentSlotIndex].sets[currentSetIndex] ?? null)
			: null
	);

	/**
	 * The exercise for the CURRENT SET (may differ from currentAlt when the user
	 * navigates back to a completed set done with a previous alternative).
	 */
	const currentSetExercise = $derived<Exercise | null>(
		currentSet
			? (findExercise(currentSet.exerciseId, customExercises) ?? null)
			: currentExercise
	);

	const isTimeBased_ = $derived(currentSetExercise ? isTimeBased(currentSetExercise) : false);

	const totalSlots = $derived(slots.length);

	const allComplete = $derived(
		slots.every((slot) => {
			const alt = slot.alternatives[slot.currentExerciseIndex];
			if (!alt) return false;
			if (alt.exerciseType === 'weights' || alt.exerciseType === 'bodyweight') {
				return slot.sets.length > 0 && slot.sets.every((s) => s.completed);
			}
			return (alt as any).completed === true;
		})
	);

	const completedSetsInSlot = $derived.by(() => {
		const slot = slots[currentSlotIndex];
		if (!slot || !currentAlt || (currentAlt.exerciseType !== 'weights' && currentAlt.exerciseType !== 'bodyweight')) return 0;
		return slot.sets.filter((s) => s.completed).length;
	});

	const totalSetsInSlot = $derived.by(() => {
		const slot = slots[currentSlotIndex];
		if (!slot || !currentAlt || (currentAlt.exerciseType !== 'weights' && currentAlt.exerciseType !== 'bodyweight')) return 1;
		return slot.sets.length;
	});

	const pickerExercises = $derived.by(() => {
		const all = [...allExercises, ...customExercises];
		if (!exercisePickerSearch.trim()) return all.slice(0, 40);
		const q = exercisePickerSearch.toLowerCase();
		return all.filter((ex) => ex.name.toLowerCase().includes(q) || ex.muscleGroups.some((m) => m.toLowerCase().includes(q))).slice(0, 40);
	});

	// ─── Mount ─────────────────────────────────────────────────────────────────

	onMount(async () => {
		customExercises = await loadCustomExercises();

		const payload = get(activeWorkout);
		if (!payload || payload.slots.length === 0) {
			goto('/log');
			return;
		}

		workoutName = payload.name;
		workoutNotes = payload.notes;
		energyLevel = payload.energyLevel;
		mood = payload.mood;
		restDurationBetweenExercises = payload.restDurationBetweenExercises;
		workoutMode = payload.workoutMode ?? 'straight';
		slots = payload.slots.map((s) => ({ ...s, alternatives: s.alternatives.map((a) => ({ ...a })) }));

		initPosition();
		workoutStartTime = new Date();
		startDurationTimer();

		// Autofill in background for each slot's primary exercise
		slots.forEach((slot, si) => {
			const alt = slot.alternatives[slot.currentExerciseIndex];
			if (alt && (alt.exerciseType === 'weights' || alt.exerciseType === 'bodyweight')) {
				fetchAndAutofill(alt.exerciseId, si);
			}
		});
	});

	// Persist slots to store on every change
	$effect(() => {
		if (slots.length === 0) return;
		activeWorkout.update((p) => ({
			...p,
			slots,
			workoutMode,
			notes: workoutNotes,
			energyLevel,
			mood
		}));
	});

	// Start/stop cardio timer based on current alternative type
	$effect(() => {
		if (currentAlt?.exerciseType === 'cardio' && !cardioTimerRunning) {
			startCardioTimer();
		} else if (currentAlt?.exerciseType !== 'cardio' && cardioTimerRunning) {
			stopCardioTimer();
		}
	});

	$effect(() => {
		return () => {
			if (durationInterval) clearInterval(durationInterval);
			if (cardioTimerInterval) clearInterval(cardioTimerInterval);
		};
	});

	// ─── Timer helpers ──────────────────────────────────────────────────────────

	function startDurationTimer() {
		if (durationInterval) return;
		durationInterval = setInterval(() => {
			workoutDuration = workoutStartTime ? Math.floor((Date.now() - workoutStartTime.getTime()) / 1000) : 0;
		}, 1000);
	}

	function startCardioTimer() {
		if (cardioTimerInterval) clearInterval(cardioTimerInterval);
		cardioTimerSeconds = 0;
		cardioTimerRunning = true;
		cardioTimerInterval = setInterval(() => { cardioTimerSeconds++; }, 1000);
	}

	function stopCardioTimer() {
		if (cardioTimerInterval) { clearInterval(cardioTimerInterval); cardioTimerInterval = null; }
		cardioTimerRunning = false;
	}

	function formatDuration(s: number): string {
		const h = Math.floor(s / 3600);
		const m = Math.floor((s % 3600) / 60);
		const sec = s % 60;
		return h > 0
			? `${h}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
			: `${m}:${String(sec).padStart(2, '0')}`;
	}

	// ─── Alternative switching ───────────────────────────────────────────────────

	/**
	 * Switch the current slot to a different alternative.
	 * Completed sets keep their original exerciseId unchanged.
	 * Uncompleted sets are re-stamped with the new exercise so they autofill correctly.
	 */
	function switchToAlternative(index: number) {
		const slot = slots[currentSlotIndex];
		if (!slot || index === slot.currentExerciseIndex) return;
		const newAlt = slot.alternatives[index];
		if (!newAlt) return;
		const newId = newAlt.exerciseId;
		const newName = newAlt.exerciseName ?? newAlt.exerciseId;
		slots = slots.map((s, si) => {
			if (si !== currentSlotIndex) return s;
			return {
				...s,
				currentExerciseIndex: index,
				sets: s.sets.map((set) =>
					set.completed ? set : { ...set, exerciseId: newId, exerciseName: newName }
				)
			};
		});
		if (newAlt.exerciseType === 'weights' || newAlt.exerciseType === 'bodyweight') {
			fetchAndAutofill(newId, currentSlotIndex);
		}
	}

	// ─── Position initialisation ─────────────────────────────────────────────────

	function initPosition() {
		if (workoutMode === 'straight') {
			for (let si = 0; si < slots.length; si++) {
				const slot = slots[si];
				const alt = slot.alternatives[slot.currentExerciseIndex];
				if (!alt) continue;
				if (alt.exerciseType === 'weights' || alt.exerciseType === 'bodyweight') {
					const firstIncomplete = slot.sets.findIndex((s) => !s.completed);
					if (firstIncomplete !== -1) { currentSlotIndex = si; currentSetIndex = firstIncomplete; return; }
				} else if (!(alt as any).completed) {
					currentSlotIndex = si; currentSetIndex = 0; return;
				}
			}
		} else {
			// Circuit: find first incomplete by round
			const maxSets = Math.max(...slots.map((s) => {
				const a = s.alternatives[s.currentExerciseIndex];
				return (a?.exerciseType === 'weights' || a?.exerciseType === 'bodyweight') ? s.sets.length : 1;
			}), 0);
			for (let setIdx = 0; setIdx < maxSets; setIdx++) {
				for (let si = 0; si < slots.length; si++) {
					const slot = slots[si];
					const alt = slot.alternatives[slot.currentExerciseIndex];
					if (!alt) continue;
					if ((alt.exerciseType === 'weights' || alt.exerciseType === 'bodyweight') && setIdx < slot.sets.length && !slot.sets[setIdx].completed) {
						currentSlotIndex = si; currentSetIndex = setIdx; return;
					}
				}
			}
		}
		currentSlotIndex = 0; currentSetIndex = 0;
	}

	// ─── Set mutation ───────────────────────────────────────────────────────────

	function updateSetField(field: 'reps' | 'weight' | 'rest' | 'completed' | 'durationSeconds', value: number | boolean) {
		slots = slots.map((slot, si) => {
			if (si !== currentSlotIndex) return slot;
			return {
				...slot,
				sets: slot.sets.map((set, setIdx) =>
					setIdx === currentSetIndex ? { ...set, [field]: value } : set
				)
			};
		});
	}

	function updateCardioField(field: 'durationMinutes' | 'calories', value: number) {
		slots = slots.map((slot, si) => {
			if (si !== currentSlotIndex) return slot;
			const ci = slot.currentExerciseIndex;
			return {
				...slot,
				alternatives: slot.alternatives.map((alt, ai) =>
					ai === ci && alt.exerciseType === 'cardio' ? { ...alt, [field]: value } : alt
				)
			};
		});
	}

	function markCurrentCompleted() {
		slots = slots.map((slot, si) => {
			if (si !== currentSlotIndex) return slot;
			const ci = slot.currentExerciseIndex;
			return {
				...slot,
				alternatives: slot.alternatives.map((alt, ai) => {
					if (ai !== ci) return alt;
					if (alt.exerciseType === 'cardio' || alt.exerciseType === 'stretches') {
						return { ...alt, completed: true };
					}
					return alt;
				})
			};
		});
	}

	// ─── Set completion ─────────────────────────────────────────────────────────

	function completeSet() {
		if (!currentAlt) return;

		if (currentAlt.exerciseType === 'weights' || currentAlt.exerciseType === 'bodyweight') {
			updateSetField('completed', true);
			if (workoutMode === 'circuit') advanceCircuit();
			else advanceStraight();
		} else {
			// Cardio / stretches
			markCurrentCompleted();
			advanceStraight();
		}
	}

	function advanceStraight() {
		showRestTimer = false; isRestBetweenExercises = false;
		// Next incomplete set in current slot
		const currentSlot = slots[currentSlotIndex];
		if (currentAlt?.exerciseType === 'weights' || currentAlt?.exerciseType === 'bodyweight') {
			const nextSet = currentSlot.sets.findIndex((s, i) => i > currentSetIndex && !s.completed);
			if (nextSet !== -1) {
				if (restDurationBetweenExercises > 0) { showRestTimer = true; isRestBetweenExercises = true; }
				else { currentSetIndex = nextSet; }
				return;
			}
		}
		// Move to next slot
		for (let si = currentSlotIndex + 1; si < slots.length; si++) {
			const slot = slots[si];
			const alt = slot.alternatives[slot.currentExerciseIndex];
			if (!alt) { currentSlotIndex = si; currentSetIndex = 0; return; }
			if (alt.exerciseType === 'weights' || alt.exerciseType === 'bodyweight') {
				const first = slot.sets.findIndex((s) => !s.completed);
				if (first !== -1) {
					if (restDurationBetweenExercises > 0) { showRestTimer = true; isRestBetweenExercises = true; }
					else { currentSlotIndex = si; currentSetIndex = first; }
					return;
				}
			} else if (!(alt as any).completed) {
				if (restDurationBetweenExercises > 0) { showRestTimer = true; isRestBetweenExercises = true; }
				else { currentSlotIndex = si; currentSetIndex = 0; }
				return;
			}
		}
		if (allComplete) finishWorkout(true);
	}

	function advanceCircuit() {
		showRestTimer = false; isRestBetweenExercises = false;
		// Same set index, next slot
		for (let si = currentSlotIndex + 1; si < slots.length; si++) {
			const slot = slots[si];
			const alt = slot.alternatives[slot.currentExerciseIndex];
			if (!alt || ((alt.exerciseType === 'weights' || alt.exerciseType === 'bodyweight') && currentSetIndex < slot.sets.length && !slot.sets[currentSetIndex].completed)) {
				if (restDurationBetweenExercises > 0) { showRestTimer = true; isRestBetweenExercises = true; }
				else { currentSlotIndex = si; }
				return;
			}
		}
		// Next round
		const nextSet = currentSetIndex + 1;
		for (let si = 0; si < slots.length; si++) {
			const slot = slots[si];
			const alt = slot.alternatives[slot.currentExerciseIndex];
			if (!alt) continue;
			if ((alt.exerciseType === 'weights' || alt.exerciseType === 'bodyweight') && nextSet < slot.sets.length && !slot.sets[nextSet].completed) {
				if (restDurationBetweenExercises > 0) { showRestTimer = true; isRestBetweenExercises = true; }
				else { currentSlotIndex = si; currentSetIndex = nextSet; }
				return;
			}
		}
		if (allComplete) finishWorkout(true);
	}

	function onRestComplete() {
		showRestTimer = false;
		isRestBetweenExercises = false;
		if (workoutMode === 'straight') resumeStraight();
		else resumeCircuit();
	}

	function resumeStraight() {
		const currentSlot = slots[currentSlotIndex];
		if (currentAlt?.exerciseType === 'weights' || currentAlt?.exerciseType === 'bodyweight') {
			const next = currentSlot.sets.findIndex((s, i) => i > currentSetIndex && !s.completed);
			if (next !== -1) { currentSetIndex = next; return; }
		}
		for (let si = currentSlotIndex + 1; si < slots.length; si++) {
			const slot = slots[si];
			const alt = slot.alternatives[slot.currentExerciseIndex];
			if (!alt) { currentSlotIndex = si; currentSetIndex = 0; return; }
			if (alt.exerciseType === 'weights' || alt.exerciseType === 'bodyweight') {
				const first = slot.sets.findIndex((s) => !s.completed);
				if (first !== -1) { currentSlotIndex = si; currentSetIndex = first; return; }
			} else if (!(alt as any).completed) {
				currentSlotIndex = si; currentSetIndex = 0; return;
			}
		}
	}

	function resumeCircuit() {
		for (let si = currentSlotIndex + 1; si < slots.length; si++) {
			const slot = slots[si];
			const alt = slot.alternatives[slot.currentExerciseIndex];
			if (!alt || ((alt.exerciseType === 'weights' || alt.exerciseType === 'bodyweight') && currentSetIndex < slot.sets.length && !slot.sets[currentSetIndex].completed)) {
				currentSlotIndex = si; return;
			}
		}
		const nextSet = currentSetIndex + 1;
		for (let si = 0; si < slots.length; si++) {
			const slot = slots[si];
			const alt = slot.alternatives[slot.currentExerciseIndex];
			if (!alt) continue;
			if ((alt.exerciseType === 'weights' || alt.exerciseType === 'bodyweight') && nextSet < slot.sets.length && !slot.sets[nextSet].completed) {
				currentSlotIndex = si; currentSetIndex = nextSet; return;
			}
		}
	}

	// ─── Autofill ──────────────────────────────────────────────────────────────

	async function fetchAndAutofill(exerciseId: string, slotIdx: number) {
		if (previousSetData[exerciseId] !== undefined) { applyAutofill(exerciseId, slotIdx); return; }
		const data = await getLastSetsForExercise(exerciseId);
		if (data) { previousSetData = { ...previousSetData, [exerciseId]: data }; applyAutofill(exerciseId, slotIdx); }
	}

	function applyAutofill(exerciseId: string, slotIdx: number) {
		const prev = previousSetData[exerciseId];
		if (!prev || prev.length === 0) return;
		slots = slots.map((slot, si) => {
			if (si !== slotIdx) return slot;
			let exerciseSetIdx = 0;
			return {
				...slot,
				sets: slot.sets.map((set) => {
					if (set.exerciseId !== exerciseId) return set;
					const idx = exerciseSetIdx++;
					if (set.weight !== 0) return set;
					const p = prev[idx] ?? prev[prev.length - 1];
					return { ...set, reps: p.reps, weight: p.weight };
				})
			};
		});
	}

	// ─── Add exercise mid-workout ────────────────────────────────────────────────

	function addExerciseMidWorkout(exercise: Exercise) {
		const timeBased = isTimeBased(exercise);
		const maxSets = Math.max(...slots.map((s) => {
			const a = s.alternatives[s.currentExerciseIndex];
			return (a?.exerciseType === 'weights' || a?.exerciseType === 'bodyweight') ? s.sets.length : 1;
		}), DEFAULT_SETS);

		let newAlt: ActiveSlotAlternative;
		let newSets: ActiveWorkoutSet[] = [];

		if (exercise.exerciseType === 'cardio') {
			newAlt = { exerciseId: exercise.id, exerciseName: exercise.name, exerciseType: 'cardio', durationMinutes: exercise.defaultDurationMinutes ?? 20, calories: exercise.defaultCalories ?? 0, completed: false };
		} else if (exercise.exerciseType === 'stretches') {
			newAlt = { exerciseId: exercise.id, exerciseName: exercise.name, exerciseType: 'stretches', durationSeconds: exercise.defaultDurationSeconds ?? 30, reps: exercise.defaultRepsStretches ?? 3, completed: false };
		} else {
			newAlt = { exerciseId: exercise.id, exerciseName: exercise.name, exerciseType: exercise.exerciseType as 'weights' | 'bodyweight' };
			newSets = Array.from({ length: maxSets }, () => ({
				reps: timeBased ? 0 : (exercise.defaultReps ?? DEFAULT_REPS),
				weight: 0,
				rest: exercise.defaultRestSeconds ?? DEFAULT_REST_BETWEEN_SETS,
				completed: false,
				exerciseId: exercise.id,
				exerciseName: exercise.name,
				...(timeBased ? { durationSeconds: exercise.defaultDurationSeconds ?? 45 } : {})
			}));
		}
		slots = [...slots, { alternatives: [newAlt], currentExerciseIndex: 0, sets: newSets }];
		showExercisePicker = false; exercisePickerSearch = '';
		if (overviewReopenAfterAdd) { showOverview = true; overviewReopenAfterAdd = false; }
		toast.success(`${exercise.name} added`);
		if (exercise.exerciseType === 'weights' || exercise.exerciseType === 'bodyweight') {
			fetchAndAutofill(exercise.id, slots.length - 1);
		}
	}

	function openAddExerciseFromOverview() {
		overviewReopenAfterAdd = true;
		showExercisePicker = true;
	}

	function closeAddExercisePicker() {
		showExercisePicker = false;
		exercisePickerSearch = '';
		if (overviewReopenAfterAdd) {
			showOverview = true;
			overviewReopenAfterAdd = false;
		}
	}

	function reorderSlots(from: number, to: number) {
		if (from === to || from < 0 || to < 0 || from >= slots.length || to >= slots.length) return;
		const next = [...slots];
		const [item] = next.splice(from, 1);
		next.splice(to, 0, item);
		slots = next;

		let ci = currentSlotIndex;
		if (ci === from) {
			currentSlotIndex = to;
		} else if (from < ci && to >= ci) {
			currentSlotIndex = ci - 1;
		} else if (from > ci && to <= ci) {
			currentSlotIndex = ci + 1;
		}
	}

	function deleteSlotAt(si: number) {
		if (slots.length <= 1) {
			toast.error('Keep at least one exercise in this workout');
			return;
		}
		if (!confirm('Remove this exercise from the workout?')) return;

		const next = slots.filter((_, i) => i !== si);
		slots = next;

		if (currentSlotIndex >= next.length) {
			currentSlotIndex = next.length - 1;
		} else if (si < currentSlotIndex) {
			currentSlotIndex = currentSlotIndex - 1;
		}
	}

	function onOverviewDragStart(si: number, e: DragEvent) {
		overviewDragFrom = si;
		e.dataTransfer?.setData('text/plain', String(si));
		if (e.dataTransfer) e.dataTransfer.effectAllowed = 'move';
	}

	function onOverviewDragEnd() {
		overviewDragFrom = null;
		overviewDragOver = null;
	}

	function onOverviewDragOver(si: number, e: DragEvent) {
		e.preventDefault();
		if (e.dataTransfer) e.dataTransfer.dropEffect = 'move';
		overviewDragOver = si;
	}

	function onOverviewDrop(si: number, e: DragEvent) {
		e.preventDefault();
		const raw = e.dataTransfer?.getData('text/plain');
		const from = raw !== '' && raw != null ? parseInt(raw, 10) : overviewDragFrom;
		if (from == null || Number.isNaN(from)) return;
		reorderSlots(from, si);
		onOverviewDragEnd();
	}

	// ─── Save ──────────────────────────────────────────────────────────────────

	/** Persist only sets explicitly completed in-session; strip autofill from incomplete sets. */
	function strengthSetForSave(s: ActiveWorkoutSet) {
		if (s.completed) {
			return {
				reps: s.reps,
				weight: s.weight,
				rest: s.rest,
				completed: true,
				...(s.durationSeconds != null ? { durationSeconds: s.durationSeconds } : {})
			};
		}
		return {
			reps: 0,
			weight: 0,
			rest: s.rest,
			completed: false,
			...(s.durationSeconds != null ? { durationSeconds: 0 } : {})
		};
	}

	async function finishWorkout(skipConfirm = false) {
		if (isSaving) return;
		if (!skipConfirm && !confirm('Finish and save this workout?')) return;
		isSaving = true;
		try {
			// For weights/bodyweight: group each slot's sets by exerciseId so mixed-exercise
			// slots produce one workout_exercises row per exercise (order preserved).
			const exercisesToSave = slots.flatMap((slot, i): { exercise_id: string; exercise_order: number; sets: unknown }[] => {
				const alt = slot.alternatives[slot.currentExerciseIndex];
				if (!alt) return [];

				if (alt.exerciseType === 'cardio') {
					return [{
						exercise_id: alt.exerciseId,
						exercise_order: i * 100,
						sets: (alt as any).completed
							? { type: 'cardio' as const, durationMinutes: (alt as any).durationMinutes, calories: (alt as any).calories, completed: true }
							: { type: 'cardio' as const, durationMinutes: 0, calories: 0, completed: false }
					}];
				}
				if (alt.exerciseType === 'stretches') {
					return [{
						exercise_id: alt.exerciseId,
						exercise_order: i * 100,
						sets: (alt as any).completed
							? { type: 'stretches' as const, durationSeconds: (alt as any).durationSeconds, reps: (alt as any).reps, completed: true }
							: { type: 'stretches' as const, durationSeconds: 0, reps: 0, completed: false }
					}];
				}

				// Weights/bodyweight: group sets by exerciseId, preserving order of first appearance
				const grouped = new Map<string, { sets: ActiveWorkoutSet[]; order: number }>();
				let orderIdx = 0;
				for (const set of slot.sets) {
					if (!grouped.has(set.exerciseId)) {
						grouped.set(set.exerciseId, { sets: [], order: orderIdx++ });
					}
					grouped.get(set.exerciseId)!.sets.push(set);
				}
				return Array.from(grouped.entries()).map(([exId, { sets, order }]) => ({
					exercise_id: exId,
					exercise_order: i * 100 + order,
					sets: sets.map((s) => strengthSetForSave(s))
				}));
			});

			const workoutId = await saveWorkout(
				{ name: workoutName || 'Workout', date: workoutStartTime?.toISOString() ?? new Date().toISOString(), duration_minutes: Math.ceil(workoutDuration / 60), notes: workoutNotes || null, energy_level: energyLevel, mood: mood || null },
				exercisesToSave
			);
			activeWorkout.clear();
			goto(`/workout/${workoutId}`);
		} catch {
			toast.error('Failed to save workout');
		} finally {
			isSaving = false;
		}
	}

	// ─── Navigation helpers ─────────────────────────────────────────────────────

	function goToSlot(si: number) {
		showRestTimer = false; isRestBetweenExercises = false; showOverview = false;
		currentSlotIndex = si;
		const slot = slots[si];
		if (!slot) { currentSetIndex = 0; return; }
		const alt = slot.alternatives[slot.currentExerciseIndex];
		if (!alt) { currentSetIndex = 0; return; }
		if (alt.exerciseType === 'weights' || alt.exerciseType === 'bodyweight') {
			const first = slot.sets.findIndex((s) => !s.completed);
			currentSetIndex = first !== -1 ? first : 0;
		} else {
			currentSetIndex = 0;
		}
	}

	function displayWeight(w: number): string {
		if (currentUnit === 'lbs') return String(Math.round(kgToLbs(w) * 10) / 10);
		return String(w);
	}

	function parseWeight(v: string): number {
		const f = parseFloat(v) || 0;
		if (currentUnit === 'lbs') return Math.round(lbsToKg(f) * 10000) / 10000;
		return f;
	}

	function swapExerciseInSlot(exercise: Exercise) {
		// If the exercise is already an alternative, just switch to it
		const slot = slots[currentSlotIndex];
		let altIndex = slot.alternatives.findIndex((a) => a.exerciseId === exercise.id);
		let newAlternatives = slot.alternatives;

		if (altIndex === -1) {
			// Add as a new alternative
			let newAlt: ActiveSlotAlternative;
			if (exercise.exerciseType === 'cardio') {
				newAlt = { exerciseId: exercise.id, exerciseName: exercise.name, exerciseType: 'cardio', durationMinutes: exercise.defaultDurationMinutes ?? 20, calories: exercise.defaultCalories ?? 0, completed: false };
			} else if (exercise.exerciseType === 'stretches') {
				newAlt = { exerciseId: exercise.id, exerciseName: exercise.name, exerciseType: 'stretches', durationSeconds: exercise.defaultDurationSeconds ?? 30, reps: exercise.defaultRepsStretches ?? 3, completed: false };
			} else {
				newAlt = { exerciseId: exercise.id, exerciseName: exercise.name, exerciseType: exercise.exerciseType as 'weights' | 'bodyweight' };
			}
			newAlternatives = [...slot.alternatives, newAlt];
			altIndex = newAlternatives.length - 1;
		}

		const newId = exercise.id;
		const newName = exercise.name;
		slots = slots.map((s, si) => {
			if (si !== currentSlotIndex) return s;
			return {
				...s,
				alternatives: newAlternatives,
				currentExerciseIndex: altIndex,
				sets: s.sets.map((set) =>
					set.completed ? set : { ...set, exerciseId: newId, exerciseName: newName }
				)
			};
		});
		showSwapPicker = false;
		toast.success(`Swapped to ${exercise.name}`);
		if (exercise.exerciseType === 'weights' || exercise.exerciseType === 'bodyweight') {
			fetchAndAutofill(exercise.id, currentSlotIndex);
		}
	}
</script>

<svelte:head>
	<title>{workoutName || 'Workout'} — Fit Check</title>
</svelte:head>

<div class="flex min-h-screen flex-col bg-[var(--color-background)]">

	<!-- ── Sticky Header ─────────────────────────────────────────────────────── -->
	<div class="sticky top-0 z-20 border-b border-[var(--color-border)] bg-[var(--color-background)]/95 backdrop-blur-sm">
		<div class="mx-auto flex max-w-md items-center gap-3 px-4 py-3">
			<!-- Back / finish -->
			<button
				type="button"
				onclick={() => finishWorkout(false)}
				class="flex-shrink-0 text-[var(--color-muted)] hover:text-[var(--color-foreground)]"
				title="Save & finish"
			>
				<ChevronLeft class="h-5 w-5" />
			</button>

			<!-- Workout name + timer -->
			<div class="min-w-0 flex-1">
				<p class="truncate text-sm font-semibold text-[var(--color-foreground)]">{workoutName || 'Workout'}</p>
				<p class="text-xs tabular-nums text-[var(--color-muted)]">{formatDuration(workoutDuration)}</p>
			</div>

			<!-- Mode toggle pill -->
			<div class="flex flex-shrink-0 overflow-hidden rounded-full border border-[var(--color-border)] bg-[var(--color-card)]">
				{#each [['straight', 'Straight'], ['circuit', 'Circuit']] as [mode, label]}
					<button
						onclick={() => (workoutMode = mode as 'straight' | 'circuit')}
						class="px-2.5 py-1 text-xs font-medium transition-colors
							{workoutMode === mode ? 'bg-[var(--color-primary)] text-white' : 'text-[var(--color-muted)]'}"
					>
						{label}
					</button>
				{/each}
			</div>

			<!-- Overview -->
			<button onclick={() => (showOverview = !showOverview)} class="flex-shrink-0 text-[var(--color-muted)] hover:text-[var(--color-foreground)]">
				<LayoutList class="h-5 w-5" />
			</button>
		</div>
	</div>

	<!-- ── Main content ──────────────────────────────────────────────────────── -->
	<div class="mx-auto w-full max-w-md flex-1 px-4 pb-32">

		{#if currentAlt}
			<!-- Slot header -->
			<div class="mt-5 mb-4">
				<div class="mb-1 flex items-center gap-2">
					<span class="text-xs font-semibold uppercase tracking-widest text-[var(--color-muted)]">
						Exercise {currentSlotIndex + 1} of {totalSlots}
						{#if currentAlt.exerciseType === 'weights' || currentAlt.exerciseType === 'bodyweight'}
							· Set {currentSetIndex + 1} of {totalSetsInSlot}
						{/if}
					</span>
				</div>

				<div class="flex items-center gap-2">
					<h2 class="flex-1 text-2xl font-bold text-[var(--color-foreground)]">
						{currentSet?.exerciseName ?? currentAlt.exerciseName ?? currentAlt.exerciseId}
					</h2>
					<button onclick={() => (showInstructions = true)} class="text-[var(--color-muted)] hover:text-[var(--color-foreground)]">
						<Info class="h-5 w-5" />
					</button>
					{#if slots[currentSlotIndex].alternatives.length > 1}
						<button
							onclick={() => (showSwapPicker = true)}
							class="rounded-full border border-[var(--color-border)] px-2 py-1 text-xs text-[var(--color-muted)] hover:text-[var(--color-primary)]"
							title="Swap exercise"
						>
							<RefreshCw class="h-3.5 w-3.5" />
						</button>
					{/if}
				</div>

				<!-- Alternative pills — switch which exercise upcoming sets will use -->
				{#if slots[currentSlotIndex].alternatives.length > 1}
					<div class="mt-1 flex gap-1">
						{#each slots[currentSlotIndex].alternatives as alt, i}
							<button
								onclick={() => switchToAlternative(i)}
								class="rounded-full px-2 py-0.5 text-xs transition-colors
									{slots[currentSlotIndex].currentExerciseIndex === i ? 'bg-[var(--color-primary)]/15 text-[var(--color-primary)] font-medium' : 'text-[var(--color-muted)] hover:text-[var(--color-foreground)]'}"
							>
								{alt.exerciseName ?? `Alt ${i + 1}`}
							</button>
						{/each}
					</div>
				{/if}
			</div>

			<!-- ── Weights / Bodyweight ─────────────────────────────────────────── -->
			{#if currentAlt.exerciseType === 'weights' || currentAlt.exerciseType === 'bodyweight'}
				{#if currentSet}
					<!-- Previous set hint -->
					{@const prevSets = previousSetData[currentSet.exerciseId]}
					{#if prevSets && prevSets[currentSetIndex]}
						<p class="mb-3 text-xs text-[var(--color-muted)]">
							Last time: {displayWeight(prevSets[currentSetIndex].weight)}{weightLabel} × {prevSets[currentSetIndex].reps}
						</p>
					{/if}

					<!-- Set inputs -->
					{#if isTimeBased_}
						<div class="mb-4 flex items-center justify-center gap-4">
							<div class="flex-1 text-center">
								<p class="mb-2 text-sm font-medium text-[var(--color-muted)]">Duration (s)</p>
								<input
									type="number" min="0"
									value={currentSet.durationSeconds ?? 0}
									oninput={(e) => updateSetField('durationSeconds', parseInt((e.target as HTMLInputElement).value) || 0)}
									class="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] py-4 text-center text-3xl font-bold text-[var(--color-foreground)] focus:border-[var(--color-primary)] focus:outline-none"
								/>
							</div>
						</div>
					{:else}
						<div class="mb-4 grid grid-cols-2 gap-3">
							<div>
								<p class="mb-2 text-center text-sm font-medium text-[var(--color-muted)]">{weightLabel}</p>
								<input
									type="text" inputmode="decimal" min="0"
									value={weightRaw}
									onfocus={() => { weightInputFocused = true; }}
									oninput={(e) => {
										weightRaw = (e.target as HTMLInputElement).value;
										const f = parseFloat(weightRaw);
										if (!isNaN(f)) updateSetField('weight', parseWeight(weightRaw));
									}}
									onblur={() => {
										updateSetField('weight', parseWeight(weightRaw));
										weightInputFocused = false;
									}}
									class="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] py-4 text-center text-3xl font-bold text-[var(--color-foreground)] focus:border-[var(--color-primary)] focus:outline-none"
								/>
							</div>
							<div>
								<p class="mb-2 text-center text-sm font-medium text-[var(--color-muted)]">Reps</p>
								<input
									type="number" min="0"
									value={currentSet.reps}
									oninput={(e) => updateSetField('reps', parseInt((e.target as HTMLInputElement).value) || 0)}
									class="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] py-4 text-center text-3xl font-bold text-[var(--color-foreground)] focus:border-[var(--color-primary)] focus:outline-none"
								/>
							</div>
						</div>
					{/if}

					<!-- Complete Set CTA -->
					<button
						onclick={completeSet}
						class="mb-4 flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--color-primary)] py-4 text-lg font-bold text-white shadow-lg transition-all active:scale-[0.97]"
					>
						<Check class="h-6 w-6" />
						Complete Set {currentSetIndex + 1}
					</button>

					<!-- Sets history — each set shows which exercise it was done with -->
					{@const slotSets = slots[currentSlotIndex].sets}
					{#if slotSets.length > 1}
						<div class="space-y-1.5">
							<p class="text-xs font-semibold uppercase tracking-wide text-[var(--color-muted)]">This workout</p>
							{#each slotSets as set, si}
								{@const setExercise = findExercise(set.exerciseId, customExercises)}
								{@const setTimeBased = setExercise ? isTimeBased(setExercise) : false}
								<button
									onclick={() => { currentSetIndex = si; }}
									class="flex w-full items-center gap-3 rounded-lg px-3 py-2 transition-colors
										{si === currentSetIndex ? 'bg-[var(--color-primary)]/10 border border-[var(--color-primary)]/30' : 'bg-[var(--color-card)]'}"
								>
									<span class="w-14 text-left text-xs text-[var(--color-muted)]">Set {si + 1}</span>
									{#if set.completed}
										<span class="flex-1 text-sm text-[var(--color-foreground)]">
											{setTimeBased ? `${set.durationSeconds ?? 0}s` : `${displayWeight(set.weight)}${weightLabel} × ${set.reps}`}
										</span>
										<span class="text-xs text-[var(--color-muted)]">{set.exerciseName}</span>
										<Check class="h-4 w-4 flex-shrink-0 text-[var(--color-accent)]" />
									{:else}
										<span class="flex-1 text-xs text-[var(--color-muted)]">{set.exerciseName}</span>
									{/if}
								</button>
							{/each}
						</div>
					{/if}

					<div class="mt-3 flex justify-end">
						<button
							type="button"
							onclick={() => finishWorkout(false)}
							disabled={isSaving}
							class="rounded-full border border-[var(--color-border)] bg-[var(--color-card)] px-3 py-1.5 text-xs font-semibold text-[var(--color-primary)] transition-colors hover:bg-[var(--color-primary)]/10 disabled:opacity-50"
						>
							{isSaving ? 'Saving…' : 'Complete workout'}
						</button>
					</div>
				{/if}

			<!-- ── Cardio ───────────────────────────────────────────────────────── -->
			{:else if currentAlt.exerciseType === 'cardio'}
				<div class="mb-5 space-y-4">
					<div class="fitness-card text-center">
						<p class="mb-1 text-xs text-[var(--color-muted)]">Elapsed</p>
						<p class="text-4xl font-bold tabular-nums text-[var(--color-foreground)]">
							{Math.floor(cardioTimerSeconds / 60)}:{String(cardioTimerSeconds % 60).padStart(2, '0')}
						</p>
					</div>
					<div class="grid grid-cols-2 gap-3">
						<div class="fitness-card">
							<p class="mb-2 text-xs text-[var(--color-muted)]">Duration (min)</p>
							<input type="number" min="0" value={currentAlt.durationMinutes}
								oninput={(e) => updateCardioField('durationMinutes', parseFloat((e.target as HTMLInputElement).value) || 0)}
								class="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-card-hover)] px-3 py-2 text-xl font-bold text-[var(--color-foreground)] focus:outline-none"
							/>
						</div>
						<div class="fitness-card">
							<p class="mb-2 text-xs text-[var(--color-muted)]">Calories</p>
							<input type="number" min="0" value={currentAlt.calories}
								oninput={(e) => updateCardioField('calories', parseFloat((e.target as HTMLInputElement).value) || 0)}
								class="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-card-hover)] px-3 py-2 text-xl font-bold text-[var(--color-foreground)] focus:outline-none"
							/>
						</div>
					</div>
				</div>
				<button onclick={completeSet} class="flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--color-primary)] py-4 text-lg font-bold text-white">
					<Check class="h-6 w-6" /> Done
				</button>
				<div class="mt-3 flex justify-end">
					<button
						type="button"
						onclick={() => finishWorkout(false)}
						disabled={isSaving}
						class="rounded-full border border-[var(--color-border)] bg-[var(--color-card)] px-3 py-1.5 text-xs font-semibold text-[var(--color-primary)] transition-colors hover:bg-[var(--color-primary)]/10 disabled:opacity-50"
					>
						{isSaving ? 'Saving…' : 'Complete workout'}
					</button>
				</div>

			<!-- ── Stretches ───────────────────────────────────────────────────── -->
			{:else if currentAlt.exerciseType === 'stretches'}
				<div class="mb-5 space-y-4">
					<div class="grid grid-cols-2 gap-3">
						<div class="fitness-card">
							<p class="mb-2 text-xs text-[var(--color-muted)]">Duration (s)</p>
							<input type="number" min="0" value={currentAlt.durationSeconds}
								class="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-card-hover)] px-3 py-2 text-xl font-bold text-[var(--color-foreground)] focus:outline-none"
							/>
						</div>
						<div class="fitness-card">
							<p class="mb-2 text-xs text-[var(--color-muted)]">Reps</p>
							<input type="number" min="0" value={currentAlt.reps}
								class="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-card-hover)] px-3 py-2 text-xl font-bold text-[var(--color-foreground)] focus:outline-none"
							/>
						</div>
					</div>
				</div>
				<button onclick={completeSet} class="flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--color-primary)] py-4 text-lg font-bold text-white">
					<Check class="h-6 w-6" /> Done
				</button>
				<div class="mt-3 flex justify-end">
					<button
						type="button"
						onclick={() => finishWorkout(false)}
						disabled={isSaving}
						class="rounded-full border border-[var(--color-border)] bg-[var(--color-card)] px-3 py-1.5 text-xs font-semibold text-[var(--color-primary)] transition-colors hover:bg-[var(--color-primary)]/10 disabled:opacity-50"
					>
						{isSaving ? 'Saving…' : 'Complete workout'}
					</button>
				</div>
			{/if}
		{/if}
	</div>

	<!-- ── Slot navigation bar ───────────────────────────────────────────────── -->
	<div class="fixed bottom-16 left-0 right-0 z-10 border-t border-[var(--color-border)] bg-[var(--color-card)]">
		<div class="mx-auto flex max-w-md items-center justify-between px-4 py-2">
			<button
				onclick={() => { if (currentSlotIndex > 0) goToSlot(currentSlotIndex - 1); }}
				disabled={currentSlotIndex === 0}
				class="rounded-lg p-2 text-[var(--color-muted)] transition-colors hover:text-[var(--color-foreground)] disabled:opacity-30"
			>
				<ChevronLeft class="h-5 w-5" />
			</button>

			<!-- Slot dots -->
			<div class="flex gap-1.5">
				{#each slots as slot, i}
					{@const slotAlt = slot.alternatives[slot.currentExerciseIndex]}
					{@const isDone = slotAlt ? (
						(slotAlt.exerciseType === 'weights' || slotAlt.exerciseType === 'bodyweight')
							? slot.sets.length > 0 && slot.sets.every(s => s.completed)
							: (slotAlt as any).completed
					) : false}
					<button onclick={() => goToSlot(i)} class="h-2 rounded-full transition-all {i === currentSlotIndex ? 'w-6 bg-[var(--color-primary)]' : isDone ? 'w-2 bg-[var(--color-accent)]' : 'w-2 bg-[var(--color-border)]'}"></button>
				{/each}
			</div>

			<div class="flex items-center gap-2">
				<button
					onclick={() => (showExercisePicker = true)}
					class="rounded-lg p-2 text-[var(--color-muted)] hover:text-[var(--color-foreground)]"
					title="Add exercise"
				>
					<Plus class="h-5 w-5" />
				</button>
				<button
					onclick={() => { if (currentSlotIndex < totalSlots - 1) goToSlot(currentSlotIndex + 1); }}
					disabled={currentSlotIndex >= totalSlots - 1}
					class="rounded-lg p-2 text-[var(--color-muted)] transition-colors hover:text-[var(--color-foreground)] disabled:opacity-30"
				>
					<ChevronRight class="h-5 w-5" />
				</button>
			</div>
		</div>
	</div>

</div>

<!-- ── Rest Timer (full-screen overlay) ─────────────────────────────────── -->
{#if showRestTimer}
	<div class="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[var(--color-background)]/97 backdrop-blur-sm">
		<p class="mb-6 text-sm font-semibold uppercase tracking-widest text-[var(--color-muted)]">Rest</p>
		<RestTimer
			duration={restDurationBetweenExercises}
			autoStart={true}
			onComplete={onRestComplete}
			onSkip={onRestComplete}
		/>
		<button onclick={onRestComplete} class="mt-8 rounded-full border border-[var(--color-border)] px-6 py-2.5 text-sm font-medium text-[var(--color-muted)] hover:text-[var(--color-foreground)]">
			Skip rest
		</button>
	</div>
{/if}

<!-- ── Overview sheet ────────────────────────────────────────────────────── -->
{#if showOverview}
	<div class="fixed inset-0 z-40 flex flex-col bg-[var(--color-background)]">
		<div class="border-b border-[var(--color-border)] px-4 py-4">
			<div class="flex items-center justify-between gap-3">
				<h2 class="min-w-0 flex-1 text-lg font-bold text-[var(--color-foreground)]">Workout Overview</h2>
				<div class="flex flex-shrink-0 items-center gap-1">
					<button
						type="button"
						onclick={openAddExerciseFromOverview}
						class="rounded-lg p-2 text-[var(--color-muted)] hover:text-[var(--color-primary)]"
						title="Add exercise"
						aria-label="Add exercise"
					>
						<Plus class="h-5 w-5" />
					</button>
					<button
						type="button"
						onclick={() => (showOverview = false)}
						class="rounded-lg p-2 text-[var(--color-muted)] hover:text-[var(--color-foreground)]"
						title="Close overview"
						aria-label="Close overview"
					>
						<X class="h-5 w-5" />
					</button>
				</div>
			</div>
		</div>
		<div class="flex-1 overflow-y-auto px-4 py-4 space-y-2" role="list" aria-label="Exercises in this workout">
			{#each slots as slot, si}
				{@const ci = slot.currentExerciseIndex}
				{@const alt = slot.alternatives[ci] ?? null}
				{@const isDone = alt ? (
					(alt.exerciseType === 'weights' || alt.exerciseType === 'bodyweight')
						? slot.sets.length > 0 && slot.sets.every(s => s.completed)
						: (alt as any).completed
				) : false}
				<div
					class="fitness-card flex items-stretch gap-1 transition-all
						{si === currentSlotIndex ? 'border-[var(--color-primary)]/60' : ''}
						{overviewDragOver === si ? 'ring-2 ring-[var(--color-primary)]/50' : ''}"
					ondragover={(e) => onOverviewDragOver(si, e)}
					ondrop={(e) => onOverviewDrop(si, e)}
					role="listitem"
				>
					<span
						class="flex cursor-grab touch-none items-center px-1.5 text-[var(--color-muted)] active:cursor-grabbing hover:text-[var(--color-foreground)]"
						draggable="true"
						ondragstart={(e) => onOverviewDragStart(si, e)}
						ondragend={onOverviewDragEnd}
						title="Drag to reorder"
						role="button"
						tabindex="0"
						aria-label="Drag to reorder"
					>
						<GripVertical class="h-5 w-5 shrink-0" />
					</span>
					<button
						type="button"
						onclick={() => goToSlot(si)}
						class="min-w-0 flex-1 py-3 pr-1 text-left"
					>
						<div class="flex items-center gap-3">
							<span class="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold
								{isDone ? 'bg-[var(--color-accent)]/20 text-[var(--color-accent)]' : si === currentSlotIndex ? 'bg-[var(--color-primary)] text-white' : 'bg-[var(--color-card-hover)] text-[var(--color-muted)]'}">
								{si + 1}
							</span>
							<div class="min-w-0 flex-1">
								<p class="truncate font-medium text-[var(--color-foreground)]">
									{alt ? (alt.exerciseName ?? alt.exerciseId) : (slot.alternatives[0]?.exerciseName ?? '—')}
								</p>
								{#if alt && (alt.exerciseType === 'weights' || alt.exerciseType === 'bodyweight')}
									<p class="text-xs text-[var(--color-muted)]">{slot.sets.filter(s => s.completed).length}/{slot.sets.length} sets</p>
								{/if}
							</div>
							{#if isDone}<Check class="h-4 w-4 flex-shrink-0 text-[var(--color-accent)]" />{/if}
						</div>
					</button>
					<button
						type="button"
						onclick={(e) => { e.stopPropagation(); deleteSlotAt(si); }}
						class="flex shrink-0 items-center justify-center px-3 py-3 text-[var(--color-muted)] hover:text-[var(--color-danger)]"
						title="Remove exercise"
						aria-label="Remove exercise"
					>
						<Trash2 class="h-5 w-5" />
					</button>
				</div>
			{/each}

			<div class="pt-4">
				<button
					onclick={() => finishWorkout(false)}
					disabled={isSaving}
					class="w-full rounded-xl bg-[var(--color-primary)] py-3 font-bold text-white disabled:opacity-50"
				>
					{isSaving ? 'Saving…' : 'Finish Workout'}
				</button>
			</div>
		</div>
	</div>
{/if}

<!-- ── Exercise picker (add mid-workout) ─────────────────────────────────── -->
{#if showExercisePicker}
	<div class="fixed inset-0 z-[45] flex flex-col bg-[var(--color-background)]">
		<div class="border-b border-[var(--color-border)] px-4 py-3">
			<div class="flex items-center gap-3">
				<button type="button" onclick={closeAddExercisePicker} class="text-[var(--color-muted)]" aria-label="Back"><ChevronLeft class="h-5 w-5" /></button>
				<h2 class="flex-1 font-semibold text-[var(--color-foreground)]">Add Exercise</h2>
				<button onclick={() => { editorReturnToPicker = true; showExercisePicker = false; showExerciseEditor = true; }} class="text-xs text-[var(--color-primary)]">+ Create</button>
			</div>
			<div class="relative mt-3">
				<Search class="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-muted)]" />
				<input bind:value={exercisePickerSearch} type="text" placeholder="Search…" autofocus
					class="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-card)] py-2.5 pl-9 pr-4 text-sm text-[var(--color-foreground)] focus:border-[var(--color-primary)] focus:outline-none"
				/>
			</div>
		</div>
		<div class="flex-1 overflow-y-auto px-4 py-3 space-y-2">
			{#each pickerExercises as ex}
				<button onclick={() => addExerciseMidWorkout(ex)} class="fitness-card w-full text-left hover:border-[var(--color-primary)]/40">
					<div class="flex items-center justify-between">
						<div><p class="font-medium text-[var(--color-foreground)]">{ex.name}</p><p class="text-xs text-[var(--color-muted)]">{ex.muscleGroups.slice(0,2).join(', ')}</p></div>
						<Plus class="h-4 w-4 text-[var(--color-primary)]" />
					</div>
				</button>
			{/each}
		</div>
	</div>
{/if}

<!-- ── Exercise Detail (info) ────────────────────────────────────────────── -->
{#if showInstructions && currentExercise}
	<ExerciseDetail exercise={currentExercise} onClose={() => (showInstructions = false)} />
{/if}

<!-- ── Exercise Editor ───────────────────────────────────────────────────── -->
{#if showExerciseEditor}
	<ExerciseEditor
		exercise={null}
		isCustom={true}
		onClose={() => { showExerciseEditor = false; if (editorReturnToPicker) { editorReturnToPicker = false; showExercisePicker = true; } }}
		onSave={async () => {
			editorReturnToPicker = false;
			const before = new Set(customExercises.map((e) => e.id));
			customExercises = await loadCustomExercises();
			const created = customExercises.find((e) => !before.has(e.id));
			if (created) addExerciseMidWorkout(created);
			showExerciseEditor = false;
		}}
	/>
{/if}

<!-- ── Swap picker ───────────────────────────────────────────────────────── -->
{#if showSwapPicker}
	<div class="fixed inset-0 z-40 flex flex-col bg-[var(--color-background)]">
		<div class="border-b border-[var(--color-border)] px-4 py-3">
			<div class="flex items-center gap-3">
				<button onclick={() => (showSwapPicker = false)} class="text-[var(--color-muted)]"><ChevronLeft class="h-5 w-5" /></button>
				<h2 class="flex-1 font-semibold text-[var(--color-foreground)]">Swap Exercise</h2>
			</div>
			<div class="relative mt-3">
				<Search class="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-muted)]" />
				<input bind:value={exercisePickerSearch} type="text" placeholder="Search…" autofocus
					class="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-card)] py-2.5 pl-9 pr-4 text-sm text-[var(--color-foreground)] focus:border-[var(--color-primary)] focus:outline-none"
				/>
			</div>
		</div>
		<div class="flex-1 overflow-y-auto px-4 py-3 space-y-2">
			{#each pickerExercises as ex}
				<button onclick={() => swapExerciseInSlot(ex)} class="fitness-card w-full text-left hover:border-[var(--color-primary)]/40">
					<div class="flex items-center justify-between">
						<div><p class="font-medium text-[var(--color-foreground)]">{ex.name}</p><p class="text-xs text-[var(--color-muted)]">{ex.muscleGroups.slice(0,2).join(', ')}</p></div>
						<RefreshCw class="h-4 w-4 text-[var(--color-primary)]" />
					</div>
				</button>
			{/each}
		</div>
	</div>
{/if}

/**
 * Comprehensive Exercise Library
 * Pre-populated with 100+ exercises covering all major muscle groups
 * Each exercise includes: name, muscle groups, equipment, default reps/sets, instructions
 */

export interface Exercise {
	id: string;
	name: string;
	muscleGroups: string[];
	equipment: string;
	defaultSets: number;
	defaultReps: number;
	defaultRestSeconds: number;
	instructions: string;
	imageUrl?: string;
	videoUrl?: string; // YouTube video URL for exercise demonstration
}

export const exercises: Exercise[] = [
	// CHEST EXERCISES
	{
		id: 'bench-press',
		name: 'Bench Press',
		muscleGroups: ['chest', 'triceps', 'shoulders'],
		equipment: 'Barbell',
		defaultSets: 4,
		defaultReps: 8,
		defaultRestSeconds: 120,
		instructions: 'Lie on bench, lower bar to chest, press up explosively'
	},
	{
		id: 'incline-bench-press',
		name: 'Incline Bench Press',
		muscleGroups: ['chest', 'triceps', 'shoulders'],
		equipment: 'Barbell',
		defaultSets: 3,
		defaultReps: 10,
		defaultRestSeconds: 90,
		instructions: 'Bench at 30-45° angle, press bar from upper chest'
	},
	{
		id: 'dumbbell-flyes',
		name: 'Dumbbell Flyes',
		muscleGroups: ['chest'],
		equipment: 'Dumbbells',
		defaultSets: 3,
		defaultReps: 12,
		defaultRestSeconds: 60,
		instructions: 'Arms wide arc, feel chest stretch at bottom'
	},
	{
		id: 'push-ups',
		name: 'Push-ups',
		muscleGroups: ['chest', 'triceps', 'shoulders'],
		equipment: 'Bodyweight',
		defaultSets: 3,
		defaultReps: 15,
		defaultRestSeconds: 60,
		instructions: 'Keep core tight, full range of motion'
	},
	{
		id: 'dips',
		name: 'Dips',
		muscleGroups: ['chest', 'triceps', 'shoulders'],
		equipment: 'Dip Bar',
		defaultSets: 3,
		defaultReps: 10,
		defaultRestSeconds: 90,
		instructions: 'Lower until shoulders below elbows, press up'
	},
	{
		id: 'cable-crossovers',
		name: 'Cable Crossovers',
		muscleGroups: ['chest'],
		equipment: 'Cable Machine',
		defaultSets: 3,
		defaultReps: 12,
		defaultRestSeconds: 60,
		instructions: 'Cross arms at bottom, squeeze chest'
	},
	{
		id: 'dumbbell-bench-press',
		name: 'Dumbbell Bench Press',
		muscleGroups: ['chest', 'triceps', 'shoulders'],
		equipment: 'Dumbbells',
		defaultSets: 4,
		defaultReps: 8,
		defaultRestSeconds: 120,
		instructions: 'Lower dumbbells to chest, press up explosively',
		videoUrl: 'https://www.youtube.com/watch?v=O7ECGhZj_Hc'
	},
	{
		id: 'incline-dumbbell-bench-press',
		name: 'Incline Dumbbell Bench Press',
		muscleGroups: ['chest', 'triceps', 'shoulders'],
		equipment: 'Dumbbells',
		defaultSets: 3,
		defaultReps: 10,
		defaultRestSeconds: 90,
		instructions: 'Bench at 30-45° angle, press dumbbells from upper chest',
		videoUrl: 'https://www.youtube.com/watch?v=qSmo-8QapTg'
	},

	// BACK EXERCISES
	{
		id: 'deadlift',
		name: 'Deadlift',
		muscleGroups: ['back', 'glutes', 'hamstrings', 'core'],
		equipment: 'Barbell',
		defaultSets: 4,
		defaultReps: 5,
		defaultRestSeconds: 180,
		instructions: 'Hinge at hips, keep back straight, drive through heels'
	},
	{
		id: 'barbell-row',
		name: 'Barbell Row',
		muscleGroups: ['back', 'biceps'],
		equipment: 'Barbell',
		defaultSets: 4,
		defaultReps: 8,
		defaultRestSeconds: 120,
		instructions: 'Pull to lower chest, squeeze lats at top'
	},
	{
		id: 'pull-ups',
		name: 'Pull-ups',
		muscleGroups: ['back', 'biceps'],
		equipment: 'Pull-up Bar',
		defaultSets: 3,
		defaultReps: 8,
		defaultRestSeconds: 120,
		instructions: 'Full hang to chin over bar, controlled negative'
	},
	{
		id: 'lat-pulldown',
		name: 'Lat Pulldown',
		muscleGroups: ['back', 'biceps'],
		equipment: 'Cable Machine',
		defaultSets: 4,
		defaultReps: 10,
		defaultRestSeconds: 90,
		instructions: 'Pull to upper chest, lean back slightly'
	},
	{
		id: 't-bar-row',
		name: 'T-Bar Row',
		muscleGroups: ['back', 'biceps'],
		equipment: 'T-Bar Machine',
		defaultSets: 3,
		defaultReps: 10,
		defaultRestSeconds: 90,
		instructions: 'Pull to chest, squeeze shoulder blades'
	},
	{
		id: 'seated-cable-row',
		name: 'Seated Cable Row',
		muscleGroups: ['back', 'biceps'],
		equipment: 'Cable Machine',
		defaultSets: 3,
		defaultReps: 12,
		defaultRestSeconds: 60,
		instructions: 'Pull to lower chest, squeeze lats'
	},
	{
		id: 'one-arm-dumbbell-row',
		name: 'One-Arm Dumbbell Row',
		muscleGroups: ['back', 'biceps'],
		equipment: 'Dumbbells',
		defaultSets: 4,
		defaultReps: 8,
		defaultRestSeconds: 90,
		instructions: 'Bent over, pull dumbbell to hip, each side'
	},
	{
		id: 'face-pulls',
		name: 'Face Pulls',
		muscleGroups: ['back', 'shoulders'],
		equipment: 'Cable Machine',
		defaultSets: 3,
		defaultReps: 15,
		defaultRestSeconds: 60,
		instructions: 'Pull to face level, external rotation at end'
	},

	// SHOULDER EXERCISES
	{
		id: 'overhead-press',
		name: 'Overhead Press',
		muscleGroups: ['shoulders', 'triceps'],
		equipment: 'Barbell',
		defaultSets: 4,
		defaultReps: 8,
		defaultRestSeconds: 120,
		instructions: 'Press from shoulders to overhead, core tight'
	},
	{
		id: 'dumbbell-shoulder-press',
		name: 'Dumbbell Shoulder Press',
		muscleGroups: ['shoulders', 'triceps'],
		equipment: 'Dumbbells',
		defaultSets: 3,
		defaultReps: 10,
		defaultRestSeconds: 90,
		instructions: 'Press up and slightly forward, full range',
		videoUrl: 'https://youtu.be/0JfYxMRsUCQ?si=zPg-sDFum_lMsuzz'
	},
	{
		id: 'lateral-raises',
		name: 'Lateral Raises',
		muscleGroups: ['shoulders'],
		equipment: 'Dumbbells',
		defaultSets: 3,
		defaultReps: 15,
		defaultRestSeconds: 60,
		instructions: 'Raise to shoulder height, slight lean forward',
		videoUrl: 'https://youtu.be/XPPfnSEATJA?si=Kw5hEZGSSqiD02FB'
	},
	{
		id: 'rear-delt-flyes',
		name: 'Rear Delt Flyes',
		muscleGroups: ['shoulders'],
		equipment: 'Dumbbells',
		defaultSets: 3,
		defaultReps: 12,
		defaultRestSeconds: 60,
		instructions: 'Bent over, raise arms wide, squeeze rear delts'
	},
	{
		id: 'rear-delt-fly',
		name: 'Rear Delt Fly',
		muscleGroups: ['shoulders'],
		equipment: 'Dumbbells',
		defaultSets: 3,
		defaultReps: 15,
		defaultRestSeconds: 60,
		instructions: 'Bent over, raise arms wide, target rear delts'
	},
	{
		id: 'arnold-press',
		name: 'Arnold Press',
		muscleGroups: ['shoulders', 'triceps'],
		equipment: 'Dumbbells',
		defaultSets: 3,
		defaultReps: 10,
		defaultRestSeconds: 90,
		instructions: 'Start with palms facing, rotate and press'
	},

	// ARM EXERCISES - BICEPS
	{
		id: 'barbell-curl',
		name: 'Barbell Curl',
		muscleGroups: ['biceps'],
		equipment: 'Barbell',
		defaultSets: 3,
		defaultReps: 10,
		defaultRestSeconds: 60,
		instructions: 'Curl to full contraction, control negative'
	},
	{
		id: 'dumbbell-curl',
		name: 'Dumbbell Curl',
		muscleGroups: ['biceps'],
		equipment: 'Dumbbells',
		defaultSets: 3,
		defaultReps: 12,
		defaultRestSeconds: 60,
		instructions: 'Alternate or together, full range of motion'
	},
	{
		id: 'hammer-curl',
		name: 'Hammer Curl',
		muscleGroups: ['biceps', 'forearms'],
		equipment: 'Dumbbells',
		defaultSets: 3,
		defaultReps: 12,
		defaultRestSeconds: 60,
		instructions: 'Neutral grip, curl up, targets brachialis'
	},
	{
		id: 'cable-curl',
		name: 'Cable Curl',
		muscleGroups: ['biceps'],
		equipment: 'Cable Machine',
		defaultSets: 3,
		defaultReps: 12,
		defaultRestSeconds: 60,
		instructions: 'Constant tension, squeeze at top'
	},
	{
		id: 'preacher-curl',
		name: 'Preacher Curl',
		muscleGroups: ['biceps'],
		equipment: 'Barbell',
		defaultSets: 3,
		defaultReps: 10,
		defaultRestSeconds: 60,
		instructions: 'Isolated bicep work, controlled tempo'
	},

	// ARM EXERCISES - TRICEPS
	{
		id: 'close-grip-bench',
		name: 'Close Grip Bench Press',
		muscleGroups: ['triceps', 'chest'],
		equipment: 'Barbell',
		defaultSets: 3,
		defaultReps: 10,
		defaultRestSeconds: 90,
		instructions: 'Hands shoulder-width, focus on triceps'
	},
	{
		id: 'tricep-dips',
		name: 'Tricep Dips',
		muscleGroups: ['triceps', 'shoulders'],
		equipment: 'Dip Bar',
		defaultSets: 3,
		defaultReps: 12,
		defaultRestSeconds: 90,
		instructions: 'Keep body upright, focus on triceps'
	},
	{
		id: 'overhead-tricep-extension',
		name: 'Overhead Tricep Extension',
		muscleGroups: ['triceps'],
		equipment: 'Dumbbell',
		defaultSets: 3,
		defaultReps: 12,
		defaultRestSeconds: 60,
		instructions: 'Extend overhead, full stretch and contraction'
	},
	{
		id: 'tricep-pushdown',
		name: 'Tricep Pushdown',
		muscleGroups: ['triceps'],
		equipment: 'Cable Machine',
		defaultSets: 3,
		defaultReps: 12,
		defaultRestSeconds: 60,
		instructions: 'Push down to full extension, squeeze'
	},
	{
		id: 'skull-crushers',
		name: 'Skull Crushers',
		muscleGroups: ['triceps'],
		equipment: 'Barbell',
		defaultSets: 3,
		defaultReps: 10,
		defaultRestSeconds: 60,
		instructions: 'Lower to forehead, extend fully'
	},
	{
		id: 'dumbbell-skull-crushers',
		name: 'Dumbbell Skull Crushers',
		muscleGroups: ['triceps'],
		equipment: 'Dumbbells',
		defaultSets: 3,
		defaultReps: 12,
		defaultRestSeconds: 90,
		instructions: 'Lower dumbbells to forehead, extend elbows',
		videoUrl: 'https://youtu.be/N5ImCU0mcpo?si=L2ShX2DFzPF0FmZw'
	},

	// LEG EXERCISES - QUADRICEPS
	{
		id: 'squat',
		name: 'Barbell Squat',
		muscleGroups: ['quadriceps', 'glutes', 'hamstrings', 'core'],
		equipment: 'Barbell',
		defaultSets: 4,
		defaultReps: 8,
		defaultRestSeconds: 180,
		instructions: 'Depth to parallel, drive through heels, chest up'
	},
	{
		id: 'goblet-squat',
		name: 'Goblet Squat',
		muscleGroups: ['quadriceps', 'glutes', 'core'],
		equipment: 'Dumbbells',
		defaultSets: 4,
		defaultReps: 8,
		defaultRestSeconds: 120,
		instructions: 'Hold dumbbell at chest, squat deep, keep chest up',
		videoUrl: 'https://www.youtube.com/watch?v=Xjo_fY9Hl9w'
	},
	{
		id: 'dumbbell-front-squat',
		name: 'Dumbbell Front Squat',
		muscleGroups: ['quadriceps', 'glutes', 'core'],
		equipment: 'Dumbbells',
		defaultSets: 3,
		defaultReps: 8,
		defaultRestSeconds: 90,
		instructions: 'Hold dumbbells at shoulders, squat with upright torso'
	},
	{
		id: 'front-squat',
		name: 'Front Squat',
		muscleGroups: ['quadriceps', 'glutes', 'core'],
		equipment: 'Barbell',
		defaultSets: 3,
		defaultReps: 8,
		defaultRestSeconds: 180,
		instructions: 'Bar on front delts, more quad focus'
	},
	{
		id: 'leg-press',
		name: 'Leg Press',
		muscleGroups: ['quadriceps', 'glutes'],
		equipment: 'Leg Press Machine',
		defaultSets: 4,
		defaultReps: 12,
		defaultRestSeconds: 120,
		instructions: 'Full range of motion, don\'t lock knees'
	},
	{
		id: 'leg-extension',
		name: 'Leg Extension',
		muscleGroups: ['quadriceps'],
		equipment: 'Leg Extension Machine',
		defaultSets: 3,
		defaultReps: 15,
		defaultRestSeconds: 60,
		instructions: 'Isolated quad work, squeeze at top'
	},
	{
		id: 'bulgarian-split-squat',
		name: 'Bulgarian Split Squat',
		muscleGroups: ['quadriceps', 'glutes'],
		equipment: 'Dumbbells',
		defaultSets: 3,
		defaultReps: 10,
		defaultRestSeconds: 90,
		instructions: 'Rear foot elevated, deep lunge position'
	},
	{
		id: 'lunges',
		name: 'Walking Lunges',
		muscleGroups: ['quadriceps', 'glutes'],
		equipment: 'Dumbbells',
		defaultSets: 3,
		defaultReps: 12,
		defaultRestSeconds: 90,
		instructions: 'Step forward, back knee nearly touches ground'
	},

	// LEG EXERCISES - HAMSTRINGS
	{
		id: 'romanian-deadlift',
		name: 'Romanian Deadlift',
		muscleGroups: ['hamstrings', 'glutes', 'back'],
		equipment: 'Barbell',
		defaultSets: 3,
		defaultReps: 10,
		defaultRestSeconds: 120,
		instructions: 'Hinge at hips, feel hamstring stretch'
	},
	{
		id: 'dumbbell-romanian-deadlift',
		name: 'Dumbbell Romanian Deadlift',
		muscleGroups: ['hamstrings', 'glutes', 'back'],
		equipment: 'Dumbbells',
		defaultSets: 4,
		defaultReps: 8,
		defaultRestSeconds: 120,
		instructions: 'Hinge at hips with dumbbells, stretch hamstrings'
	},
	{
		id: 'leg-curl',
		name: 'Leg Curl',
		muscleGroups: ['hamstrings'],
		equipment: 'Leg Curl Machine',
		defaultSets: 3,
		defaultReps: 12,
		defaultRestSeconds: 60,
		instructions: 'Curl to full contraction, control negative'
	},
	{
		id: 'stiff-leg-deadlift',
		name: 'Stiff Leg Deadlift',
		muscleGroups: ['hamstrings', 'glutes'],
		equipment: 'Barbell',
		defaultSets: 3,
		defaultReps: 10,
		defaultRestSeconds: 120,
		instructions: 'Minimal knee bend, focus on hamstring stretch'
	},
	{
		id: 'good-mornings',
		name: 'Good Mornings',
		muscleGroups: ['hamstrings', 'glutes', 'back'],
		equipment: 'Barbell',
		defaultSets: 3,
		defaultReps: 10,
		defaultRestSeconds: 90,
		instructions: 'Hinge at hips, keep back straight'
	},

	// LEG EXERCISES - GLUTES
	{
		id: 'hip-thrust',
		name: 'Hip Thrust',
		muscleGroups: ['glutes', 'hamstrings'],
		equipment: 'Barbell',
		defaultSets: 3,
		defaultReps: 12,
		defaultRestSeconds: 90,
		instructions: 'Drive hips up, squeeze glutes at top'
	},
	{
		id: 'glute-bridge',
		name: 'Glute Bridge',
		muscleGroups: ['glutes', 'hamstrings'],
		equipment: 'Bodyweight',
		defaultSets: 3,
		defaultReps: 15,
		defaultRestSeconds: 60,
		instructions: 'Lift hips, squeeze glutes, hold at top'
	},
	{
		id: 'cable-kickback',
		name: 'Cable Kickback',
		muscleGroups: ['glutes'],
		equipment: 'Cable Machine',
		defaultSets: 3,
		defaultReps: 15,
		defaultRestSeconds: 60,
		instructions: 'Kick back against cable, squeeze glute'
	},

	// CALVES
	{
		id: 'calf-raise',
		name: 'Standing Calf Raise',
		muscleGroups: ['calves'],
		equipment: 'Calf Raise Machine',
		defaultSets: 4,
		defaultReps: 15,
		defaultRestSeconds: 45,
		instructions: 'Full range of motion, stretch and contract'
	},
	{
		id: 'seated-calf-raise',
		name: 'Seated Calf Raise',
		muscleGroups: ['calves'],
		equipment: 'Seated Calf Machine',
		defaultSets: 3,
		defaultReps: 15,
		defaultRestSeconds: 45,
		instructions: 'Targets soleus, full stretch'
	},

	// CORE EXERCISES
	{
		id: 'plank',
		name: 'Plank',
		muscleGroups: ['core'],
		equipment: 'Bodyweight',
		defaultSets: 3,
		defaultReps: 1,
		defaultRestSeconds: 60,
		instructions: 'Hold 60 seconds, keep body straight'
	},
	{
		id: 'crunches',
		name: 'Crunches',
		muscleGroups: ['core'],
		equipment: 'Bodyweight',
		defaultSets: 3,
		defaultReps: 20,
		defaultRestSeconds: 45,
		instructions: 'Curl up, don\'t pull on neck'
	},
	{
		id: 'russian-twists',
		name: 'Russian Twists',
		muscleGroups: ['core'],
		equipment: 'Bodyweight',
		defaultSets: 3,
		defaultReps: 20,
		defaultRestSeconds: 45,
		instructions: 'Rotate torso, keep feet off ground'
	},
	{
		id: 'leg-raises',
		name: 'Leg Raises',
		muscleGroups: ['core'],
		equipment: 'Bodyweight',
		defaultSets: 3,
		defaultReps: 15,
		defaultRestSeconds: 60,
		instructions: 'Lift legs to 90°, control descent'
	},
	{
		id: 'mountain-climbers',
		name: 'Mountain Climbers',
		muscleGroups: ['core', 'shoulders'],
		equipment: 'Bodyweight',
		defaultSets: 3,
		defaultReps: 20,
		defaultRestSeconds: 45,
		instructions: 'Alternate knees, keep core tight'
	},
	{
		id: 'ab-wheel',
		name: 'Ab Wheel Rollout',
		muscleGroups: ['core'],
		equipment: 'Ab Wheel',
		defaultSets: 3,
		defaultReps: 10,
		defaultRestSeconds: 90,
		instructions: 'Roll out slowly, keep core engaged'
	},
	{
		id: 'hanging-leg-raises',
		name: 'Hanging Leg Raises',
		muscleGroups: ['core'],
		equipment: 'Pull-up Bar',
		defaultSets: 3,
		defaultReps: 12,
		defaultRestSeconds: 90,
		instructions: 'Hang from bar, raise legs to parallel'
	},
	{
		id: 'hanging-knee-raises',
		name: 'Hanging Knee Raises',
		muscleGroups: ['core'],
		equipment: 'Pull-up Bar',
		defaultSets: 3,
		defaultReps: 15,
		defaultRestSeconds: 90,
		instructions: 'Hang from bar, raise knees to chest'
	},
	{
		id: 'dead-bug',
		name: 'Dead Bug',
		muscleGroups: ['core'],
		equipment: 'Bodyweight',
		defaultSets: 3,
		defaultReps: 1,
		defaultRestSeconds: 60,
		instructions: 'Lie on back, alternate arm and leg extensions, hold 30-45 seconds'
	},
	{
		id: 'hollow-hold',
		name: 'Hollow Hold',
		muscleGroups: ['core'],
		equipment: 'Bodyweight',
		defaultSets: 3,
		defaultReps: 1,
		defaultRestSeconds: 60,
		instructions: 'Lie on back, lift shoulders and legs, hold 30-45 seconds'
	},
	{
		id: 'back-extension',
		name: 'Back Extension',
		muscleGroups: ['back', 'glutes', 'hamstrings'],
		equipment: 'Back Extension Machine',
		defaultSets: 3,
		defaultReps: 12,
		defaultRestSeconds: 90,
		instructions: 'Hinge at hips, extend back against resistance'
	},
	{
		id: 'reverse-hyper',
		name: 'Reverse Hyper',
		muscleGroups: ['glutes', 'hamstrings', 'back'],
		equipment: 'Reverse Hyper Machine',
		defaultSets: 3,
		defaultReps: 12,
		defaultRestSeconds: 90,
		instructions: 'Lying face down, raise legs behind body'
	},
	{
		id: 'cable-woodchoppers',
		name: 'Cable Woodchoppers',
		muscleGroups: ['core', 'obliques'],
		equipment: 'Cable Machine',
		defaultSets: 3,
		defaultReps: 10,
		defaultRestSeconds: 60,
		instructions: 'Pull cable diagonally across body, each side'
	},
	{
		id: 'hanging-knee-raises',
		name: 'Hanging Knee Raises',
		muscleGroups: ['core'],
		equipment: 'Pull-up Bar',
		defaultSets: 3,
		defaultReps: 15,
		defaultRestSeconds: 90,
		instructions: 'Hang from bar, raise knees to chest'
	},
	{
		id: 'dead-bug',
		name: 'Dead Bug',
		muscleGroups: ['core'],
		equipment: 'Bodyweight',
		defaultSets: 3,
		defaultReps: 1,
		defaultRestSeconds: 60,
		instructions: 'Lie on back, alternate arm and leg extensions, hold 30-45 seconds'
	},
	{
		id: 'hollow-hold',
		name: 'Hollow Hold',
		muscleGroups: ['core'],
		equipment: 'Bodyweight',
		defaultSets: 3,
		defaultReps: 1,
		defaultRestSeconds: 60,
		instructions: 'Lie on back, lift shoulders and legs, hold 30-45 seconds'
	},
	{
		id: 'back-extension',
		name: 'Back Extension',
		muscleGroups: ['back', 'glutes', 'hamstrings'],
		equipment: 'Back Extension Machine',
		defaultSets: 3,
		defaultReps: 12,
		defaultRestSeconds: 90,
		instructions: 'Hinge at hips, extend back against resistance'
	},
	{
		id: 'reverse-hyper',
		name: 'Reverse Hyper',
		muscleGroups: ['glutes', 'hamstrings', 'back'],
		equipment: 'Reverse Hyper Machine',
		defaultSets: 3,
		defaultReps: 12,
		defaultRestSeconds: 90,
		instructions: 'Lying face down, raise legs behind body'
	},
	{
		id: 'cable-woodchoppers',
		name: 'Cable Woodchoppers',
		muscleGroups: ['core', 'obliques'],
		equipment: 'Cable Machine',
		defaultSets: 3,
		defaultReps: 10,
		defaultRestSeconds: 60,
		instructions: 'Pull cable diagonally across body, each side'
	},

	// FOREARMS
	{
		id: 'wrist-curl',
		name: 'Wrist Curl',
		muscleGroups: ['forearms'],
		equipment: 'Barbell',
		defaultSets: 3,
		defaultReps: 15,
		defaultRestSeconds: 45,
		instructions: 'Curl wrists up, full range'
	},
	{
		id: 'reverse-wrist-curl',
		name: 'Reverse Wrist Curl',
		muscleGroups: ['forearms'],
		equipment: 'Barbell',
		defaultSets: 3,
		defaultReps: 15,
		defaultRestSeconds: 45,
		instructions: 'Overhand grip, curl up'
	},
	{
		id: 'farmer-walk',
		name: 'Farmer\'s Walk',
		muscleGroups: ['forearms', 'core', 'traps'],
		equipment: 'Dumbbells',
		defaultSets: 3,
		defaultReps: 1,
		defaultRestSeconds: 120,
		instructions: 'Walk 50 feet, grip strength focus'
	},

	// COMPOUND MOVEMENTS
	{
		id: 'clean-and-press',
		name: 'Clean and Press',
		muscleGroups: ['full body'],
		equipment: 'Barbell',
		defaultSets: 3,
		defaultReps: 5,
		defaultRestSeconds: 180,
		instructions: 'Explosive movement, full body power'
	},
	{
		id: 'thrusters',
		name: 'Thrusters',
		muscleGroups: ['full body'],
		equipment: 'Barbell',
		defaultSets: 3,
		defaultReps: 10,
		defaultRestSeconds: 120,
		instructions: 'Squat to overhead press, fluid motion'
	},
	{
		id: 'burpees',
		name: 'Burpees',
		muscleGroups: ['full body'],
		equipment: 'Bodyweight',
		defaultSets: 3,
		defaultReps: 10,
		defaultRestSeconds: 90,
		instructions: 'Squat, plank, push-up, jump up'
	},

	// CARDIO/ENDURANCE
	{
		id: 'running',
		name: 'Running',
		muscleGroups: ['legs', 'cardio'],
		equipment: 'None',
		defaultSets: 1,
		defaultReps: 1,
		defaultRestSeconds: 0,
		instructions: 'Track distance and time'
	},
	{
		id: 'cycling',
		name: 'Cycling',
		muscleGroups: ['legs', 'cardio'],
		equipment: 'Bike',
		defaultSets: 1,
		defaultReps: 1,
		defaultRestSeconds: 0,
		instructions: 'Track distance, time, and resistance'
	},
	{
		id: 'rowing',
		name: 'Rowing',
		muscleGroups: ['full body', 'cardio'],
		equipment: 'Rowing Machine',
		defaultSets: 3,
		defaultReps: 1,
		defaultRestSeconds: 120,
		instructions: 'Full stroke, drive with legs'
	},
	{
		id: 'jump-rope',
		name: 'Jump Rope',
		muscleGroups: ['legs', 'cardio'],
		equipment: 'Jump Rope',
		defaultSets: 3,
		defaultReps: 1,
		defaultRestSeconds: 60,
		instructions: 'Track time or reps'
	}
];

// Helper functions
export function getExercisesByMuscleGroup(muscleGroup: string): Exercise[] {
	return exercises.filter((ex) => ex.muscleGroups.includes(muscleGroup.toLowerCase()));
}

export function getExercisesByEquipment(equipment: string): Exercise[] {
	return exercises.filter((ex) => ex.equipment.toLowerCase() === equipment.toLowerCase());
}

export function searchExercises(query: string): Exercise[] {
	const lowerQuery = query.toLowerCase();
	return exercises.filter(
		(ex) =>
			ex.name.toLowerCase().includes(lowerQuery) ||
			ex.muscleGroups.some((mg) => mg.toLowerCase().includes(lowerQuery)) ||
			ex.equipment.toLowerCase().includes(lowerQuery)
	);
}

export function getExerciseById(id: string): Exercise | undefined {
	return exercises.find((ex) => ex.id === id);
}

/**
 * Get exercise by ID with override merged (async)
 * Use this when you need the user's customized version
 */
export async function getExerciseByIdWithOverride(
	id: string
): Promise<Exercise | undefined> {
	const exercise = getExerciseById(id);
	if (!exercise) return undefined;

	const { mergeExerciseWithOverride, getExerciseOverride } = await import(
		'$lib/utils/exercise-overrides'
	);
	const override = await getExerciseOverride(id);
	return mergeExerciseWithOverride(exercise, override);
}

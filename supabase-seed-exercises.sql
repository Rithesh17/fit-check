-- Seed Exercises into Supabase
-- Run this in Supabase SQL Editor after creating the exercises table
-- This inserts all exercises from the TypeScript exercise library

INSERT INTO exercises (id, name, muscle_groups, equipment, default_sets, default_reps, default_rest_seconds, instructions) VALUES
-- CHEST
('bench-press', 'Bench Press', ARRAY['chest', 'triceps', 'shoulders'], 'Barbell', 4, 8, 120, 'Lie on bench, lower bar to chest, press up explosively'),
('incline-bench-press', 'Incline Bench Press', ARRAY['chest', 'triceps', 'shoulders'], 'Barbell', 3, 10, 90, 'Bench at 30-45° angle, press bar from upper chest'),
('dumbbell-flyes', 'Dumbbell Flyes', ARRAY['chest'], 'Dumbbells', 3, 12, 60, 'Arms wide arc, feel chest stretch at bottom'),
('push-ups', 'Push-ups', ARRAY['chest', 'triceps', 'shoulders'], 'Bodyweight', 3, 15, 60, 'Keep core tight, full range of motion'),
('dips', 'Dips', ARRAY['chest', 'triceps', 'shoulders'], 'Dip Bar', 3, 10, 90, 'Lower until shoulders below elbows, press up'),
('cable-crossovers', 'Cable Crossovers', ARRAY['chest'], 'Cable Machine', 3, 12, 60, 'Cross arms at bottom, squeeze chest'),

-- BACK
('deadlift', 'Deadlift', ARRAY['back', 'glutes', 'hamstrings', 'core'], 'Barbell', 4, 5, 180, 'Hinge at hips, keep back straight, drive through heels'),
('barbell-row', 'Barbell Row', ARRAY['back', 'biceps'], 'Barbell', 4, 8, 120, 'Pull to lower chest, squeeze lats at top'),
('pull-ups', 'Pull-ups', ARRAY['back', 'biceps'], 'Pull-up Bar', 3, 8, 120, 'Full hang to chin over bar, controlled negative'),
('lat-pulldown', 'Lat Pulldown', ARRAY['back', 'biceps'], 'Cable Machine', 4, 10, 90, 'Pull to upper chest, lean back slightly'),
('t-bar-row', 'T-Bar Row', ARRAY['back', 'biceps'], 'T-Bar Machine', 3, 10, 90, 'Pull to chest, squeeze shoulder blades'),
('seated-cable-row', 'Seated Cable Row', ARRAY['back', 'biceps'], 'Cable Machine', 3, 12, 60, 'Pull to lower chest, squeeze lats'),
('face-pulls', 'Face Pulls', ARRAY['back', 'shoulders'], 'Cable Machine', 3, 15, 60, 'Pull to face level, external rotation at end'),

-- SHOULDERS
('overhead-press', 'Overhead Press', ARRAY['shoulders', 'triceps'], 'Barbell', 4, 8, 120, 'Press from shoulders to overhead, core tight'),
('dumbbell-shoulder-press', 'Dumbbell Shoulder Press', ARRAY['shoulders', 'triceps'], 'Dumbbells', 3, 10, 90, 'Press up and slightly forward, full range'),
('lateral-raises', 'Lateral Raises', ARRAY['shoulders'], 'Dumbbells', 3, 15, 60, 'Raise to shoulder height, slight lean forward'),
('rear-delt-flyes', 'Rear Delt Flyes', ARRAY['shoulders'], 'Dumbbells', 3, 12, 60, 'Bent over, raise arms wide, squeeze rear delts'),
('arnold-press', 'Arnold Press', ARRAY['shoulders', 'triceps'], 'Dumbbells', 3, 10, 90, 'Start with palms facing, rotate and press'),

-- BICEPS
('barbell-curl', 'Barbell Curl', ARRAY['biceps'], 'Barbell', 3, 10, 60, 'Curl to full contraction, control negative'),
('dumbbell-curl', 'Dumbbell Curl', ARRAY['biceps'], 'Dumbbells', 3, 12, 60, 'Alternate or together, full range of motion'),
('hammer-curl', 'Hammer Curl', ARRAY['biceps', 'forearms'], 'Dumbbells', 3, 12, 60, 'Neutral grip, curl up, targets brachialis'),
('cable-curl', 'Cable Curl', ARRAY['biceps'], 'Cable Machine', 3, 12, 60, 'Constant tension, squeeze at top'),
('preacher-curl', 'Preacher Curl', ARRAY['biceps'], 'Barbell', 3, 10, 60, 'Isolated bicep work, controlled tempo'),

-- TRICEPS
('close-grip-bench', 'Close Grip Bench Press', ARRAY['triceps', 'chest'], 'Barbell', 3, 10, 90, 'Hands shoulder-width, focus on triceps'),
('tricep-dips', 'Tricep Dips', ARRAY['triceps', 'shoulders'], 'Dip Bar', 3, 12, 90, 'Keep body upright, focus on triceps'),
('overhead-tricep-extension', 'Overhead Tricep Extension', ARRAY['triceps'], 'Dumbbell', 3, 12, 60, 'Extend overhead, full stretch and contraction'),
('tricep-pushdown', 'Tricep Pushdown', ARRAY['triceps'], 'Cable Machine', 3, 12, 60, 'Push down to full extension, squeeze'),
('skull-crushers', 'Skull Crushers', ARRAY['triceps'], 'Barbell', 3, 10, 60, 'Lower to forehead, extend fully'),

-- LEGS - QUADRICEPS
('squat', 'Barbell Squat', ARRAY['quadriceps', 'glutes', 'hamstrings', 'core'], 'Barbell', 4, 8, 180, 'Depth to parallel, drive through heels, chest up'),
('front-squat', 'Front Squat', ARRAY['quadriceps', 'glutes', 'core'], 'Barbell', 3, 8, 180, 'Bar on front delts, more quad focus'),
('leg-press', 'Leg Press', ARRAY['quadriceps', 'glutes'], 'Leg Press Machine', 4, 12, 120, 'Full range of motion, don''t lock knees'),
('leg-extension', 'Leg Extension', ARRAY['quadriceps'], 'Leg Extension Machine', 3, 15, 60, 'Isolated quad work, squeeze at top'),
('bulgarian-split-squat', 'Bulgarian Split Squat', ARRAY['quadriceps', 'glutes'], 'Dumbbells', 3, 10, 90, 'Rear foot elevated, deep lunge position'),
('lunges', 'Walking Lunges', ARRAY['quadriceps', 'glutes'], 'Dumbbells', 3, 12, 90, 'Step forward, back knee nearly touches ground'),

-- LEGS - HAMSTRINGS
('romanian-deadlift', 'Romanian Deadlift', ARRAY['hamstrings', 'glutes', 'back'], 'Barbell', 3, 10, 120, 'Hinge at hips, feel hamstring stretch'),
('leg-curl', 'Leg Curl', ARRAY['hamstrings'], 'Leg Curl Machine', 3, 12, 60, 'Curl to full contraction, control negative'),
('stiff-leg-deadlift', 'Stiff Leg Deadlift', ARRAY['hamstrings', 'glutes'], 'Barbell', 3, 10, 120, 'Minimal knee bend, focus on hamstring stretch'),
('good-mornings', 'Good Mornings', ARRAY['hamstrings', 'glutes', 'back'], 'Barbell', 3, 10, 90, 'Hinge at hips, keep back straight'),

-- LEGS - GLUTES
('hip-thrust', 'Hip Thrust', ARRAY['glutes', 'hamstrings'], 'Barbell', 3, 12, 90, 'Drive hips up, squeeze glutes at top'),
('glute-bridge', 'Glute Bridge', ARRAY['glutes', 'hamstrings'], 'Bodyweight', 3, 15, 60, 'Lift hips, squeeze glutes, hold at top'),
('cable-kickback', 'Cable Kickback', ARRAY['glutes'], 'Cable Machine', 3, 15, 60, 'Kick back against cable, squeeze glute'),

-- CALVES
('calf-raise', 'Standing Calf Raise', ARRAY['calves'], 'Calf Raise Machine', 4, 15, 45, 'Full range of motion, stretch and contract'),
('seated-calf-raise', 'Seated Calf Raise', ARRAY['calves'], 'Seated Calf Machine', 3, 15, 45, 'Targets soleus, full stretch'),

-- CORE
('plank', 'Plank', ARRAY['core'], 'Bodyweight', 3, 1, 60, 'Hold 60 seconds, keep body straight'),
('crunches', 'Crunches', ARRAY['core'], 'Bodyweight', 3, 20, 45, 'Curl up, don''t pull on neck'),
('russian-twists', 'Russian Twists', ARRAY['core'], 'Bodyweight', 3, 20, 45, 'Rotate torso, keep feet off ground'),
('leg-raises', 'Leg Raises', ARRAY['core'], 'Bodyweight', 3, 15, 60, 'Lift legs to 90°, control descent'),
('mountain-climbers', 'Mountain Climbers', ARRAY['core', 'shoulders'], 'Bodyweight', 3, 20, 45, 'Alternate knees, keep core tight'),
('ab-wheel', 'Ab Wheel Rollout', ARRAY['core'], 'Ab Wheel', 3, 10, 90, 'Roll out slowly, keep core engaged'),
('hanging-leg-raises', 'Hanging Leg Raises', ARRAY['core'], 'Pull-up Bar', 3, 12, 90, 'Hang from bar, raise legs to parallel'),

-- FOREARMS
('wrist-curl', 'Wrist Curl', ARRAY['forearms'], 'Barbell', 3, 15, 45, 'Curl wrists up, full range'),
('reverse-wrist-curl', 'Reverse Wrist Curl', ARRAY['forearms'], 'Barbell', 3, 15, 45, 'Overhand grip, curl up'),
('farmer-walk', 'Farmer''s Walk', ARRAY['forearms', 'core', 'traps'], 'Dumbbells', 3, 1, 120, 'Walk 50 feet, grip strength focus'),

-- COMPOUND
('clean-and-press', 'Clean and Press', ARRAY['full body'], 'Barbell', 3, 5, 180, 'Explosive movement, full body power'),
('thrusters', 'Thrusters', ARRAY['full body'], 'Barbell', 3, 10, 120, 'Squat to overhead press, fluid motion'),
('burpees', 'Burpees', ARRAY['full body'], 'Bodyweight', 3, 10, 90, 'Squat, plank, push-up, jump up'),

-- CARDIO
('running', 'Running', ARRAY['legs', 'cardio'], 'None', 1, 1, 0, 'Track distance and time'),
('cycling', 'Cycling', ARRAY['legs', 'cardio'], 'Bike', 1, 1, 0, 'Track distance, time, and resistance'),
('rowing', 'Rowing', ARRAY['full body', 'cardio'], 'Rowing Machine', 3, 1, 120, 'Full stroke, drive with legs'),
('jump-rope', 'Jump Rope', ARRAY['legs', 'cardio'], 'Jump Rope', 3, 1, 60, 'Track time or reps')
ON CONFLICT (id) DO NOTHING;

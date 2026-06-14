-- ============================================================================
-- Global exercise library (user_id = null -> readable by everyone, owned by no one)
-- primary_muscle keys map to the dashboard body map model.
-- ============================================================================
insert into public.exercises (name, category, equipment, primary_muscle, intensity)
values
  -- Chest
  ('Barbell Bench Press',   'Chest',     'Barbell',    'chest',      0.90),
  ('Incline Bench Press',   'Chest',     'Barbell',    'chest',      0.82),
  ('Incline DB Press',      'Chest',     'Dumbbell',   'chest',      0.70),
  ('Flat DB Press',         'Chest',     'Dumbbell',   'chest',      0.72),
  ('Cable Fly',             'Chest',     'Cable',      'chest',      0.50),
  ('Pec Deck',              'Chest',     'Machine',    'chest',      0.55),
  ('Push-Up',               'Chest',     'Bodyweight', 'chest',      0.45),
  ('Dips',                  'Chest',     'Bodyweight', 'chest',      0.65),
  -- Back
  ('Deadlift',              'Back',      'Barbell',    'lowerback',  0.95),
  ('Pull-Up',               'Back',      'Bodyweight', 'lats',       0.85),
  ('Chin-Up',               'Back',      'Bodyweight', 'lats',       0.80),
  ('Barbell Row',           'Back',      'Barbell',    'lats',       0.80),
  ('Pendlay Row',           'Back',      'Barbell',    'lats',       0.78),
  ('Lat Pulldown',          'Back',      'Cable',      'lats',       0.65),
  ('Seated Cable Row',      'Back',      'Cable',      'lats',       0.62),
  ('Single-Arm DB Row',     'Back',      'Dumbbell',   'lats',       0.60),
  ('Face Pull',             'Back',      'Cable',      'reardelts',  0.45),
  ('Hyperextension',        'Back',      'Bodyweight', 'lowerback',  0.50),
  -- Legs
  ('Back Squat',            'Legs',      'Barbell',    'quads',      0.95),
  ('Front Squat',           'Legs',      'Barbell',    'quads',      0.88),
  ('Romanian Deadlift',     'Legs',      'Barbell',    'hamstrings', 0.85),
  ('Leg Press',             'Legs',      'Machine',    'quads',      0.70),
  ('Bulgarian Split Squat', 'Legs',      'Dumbbell',   'quads',      0.72),
  ('Walking Lunge',         'Legs',      'Dumbbell',   'glutes',     0.68),
  ('Leg Extension',         'Legs',      'Machine',    'quads',      0.55),
  ('Lying Leg Curl',        'Legs',      'Machine',    'hamstrings', 0.58),
  ('Hip Thrust',            'Legs',      'Barbell',    'glutes',     0.80),
  ('Standing Calf Raise',   'Legs',      'Machine',    'calves',     0.55),
  ('Seated Calf Raise',     'Legs',      'Machine',    'calves',     0.50),
  -- Shoulders
  ('Overhead Press',        'Shoulders', 'Barbell',    'frontdelts', 0.80),
  ('Seated DB Press',       'Shoulders', 'Dumbbell',   'frontdelts', 0.72),
  ('Arnold Press',          'Shoulders', 'Dumbbell',   'frontdelts', 0.70),
  ('Lateral Raise',         'Shoulders', 'Dumbbell',   'frontdelts', 0.45),
  ('Cable Lateral Raise',   'Shoulders', 'Cable',      'frontdelts', 0.45),
  ('Rear Delt Fly',         'Shoulders', 'Dumbbell',   'reardelts',  0.42),
  ('Upright Row',           'Shoulders', 'Barbell',    'traps',      0.55),
  ('Barbell Shrug',         'Shoulders', 'Barbell',    'traps',      0.60),
  -- Arms
  ('Barbell Curl',          'Arms',      'Barbell',    'biceps',     0.60),
  ('Dumbbell Curl',         'Arms',      'Dumbbell',   'biceps',     0.55),
  ('Hammer Curl',           'Arms',      'Dumbbell',   'biceps',     0.55),
  ('Preacher Curl',         'Arms',      'Machine',    'biceps',     0.52),
  ('Cable Curl',            'Arms',      'Cable',      'biceps',     0.50),
  ('Triceps Pushdown',      'Arms',      'Cable',      'triceps',    0.50),
  ('Overhead Triceps Ext',  'Arms',      'Dumbbell',   'triceps',    0.52),
  ('Skull Crusher',         'Arms',      'Barbell',    'triceps',    0.58),
  ('Close-Grip Bench',      'Arms',      'Barbell',    'triceps',    0.70),
  ('Wrist Curl',            'Arms',      'Dumbbell',   'forearms',   0.40),
  -- Core
  ('Hanging Leg Raise',     'Core',      'Bodyweight', 'abs',        0.55),
  ('Cable Crunch',          'Core',      'Cable',      'abs',        0.55),
  ('Plank',                 'Core',      'Bodyweight', 'abs',        0.45),
  ('Russian Twist',         'Core',      'Bodyweight', 'obliques',   0.45),
  ('Ab Wheel Rollout',      'Core',      'Other',      'abs',        0.60),
  ('Sit-Up',                'Core',      'Bodyweight', 'abs',        0.40),
  -- Cardio
  ('Treadmill Run',         'Cardio',    'Machine',    'quads',      0.60),
  ('Outdoor Run',           'Cardio',    'Bodyweight', 'quads',      0.62),
  ('Rowing Erg',            'Cardio',    'Machine',    'lats',       0.65),
  ('Cycling',               'Cardio',    'Machine',    'quads',      0.58),
  ('Stair Climber',         'Cardio',    'Machine',    'glutes',     0.55),
  ('Jump Rope',             'Cardio',    'Other',      'calves',     0.50),
  ('Elliptical',            'Cardio',    'Machine',    'quads',      0.45),
  ('Incline Walk',          'Cardio',    'Machine',    'calves',     0.40)
on conflict do nothing;

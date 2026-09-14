/**
 * Anchor Workout Split Presets Library
 * Battle-tested training architectures for various goals, frequencies, and experience levels.
 */

export const WORKOUT_PRESETS = [
  {
    id: 'ppl-6day',
    name: 'Push / Pull / Legs (PPL)',
    tagline: 'High-frequency hypertrophy gold standard',
    daysPerWeek: 6,
    difficulty: 'Intermediate / Advanced',
    description: 'The premier bodybuilding and strength split. Trains every muscle group twice per week with dedicated push, pull, and leg days followed by an active recovery rest day.',
    schedule: {
      0: { isRest: true, name: 'Rest', exercises: [] },
      1: {
        isRest: false,
        name: 'Push A (Chest & Triceps)',
        exercises: [
          { id: 'ppl-1', name: 'Barbell Bench Press', sets: 4, reps: 8, weight: '' },
          { id: 'ppl-2', name: 'Incline Dumbbell Press', sets: 3, reps: 10, weight: '' },
          { id: 'ppl-3', name: 'Standing Overhead Press', sets: 3, reps: 8, weight: '' },
          { id: 'ppl-4', name: 'Cable Lateral Raise', sets: 4, reps: 12, weight: '' },
          { id: 'ppl-5', name: 'Tricep Rope Pushdown', sets: 3, reps: 12, weight: '' }
        ]
      },
      2: {
        isRest: false,
        name: 'Pull A (Back & Biceps)',
        exercises: [
          { id: 'ppl-6', name: 'Barbell Deadlift', sets: 3, reps: 5, weight: '' },
          { id: 'ppl-7', name: 'Chest-Supported Row', sets: 4, reps: 8, weight: '' },
          { id: 'ppl-8', name: 'Neutral-Grip Lat Pulldown', sets: 3, reps: 10, weight: '' },
          { id: 'ppl-9', name: 'Face Pulls', sets: 3, reps: 15, weight: '' },
          { id: 'ppl-10', name: 'Incline Dumbbell Curl', sets: 3, reps: 10, weight: '' }
        ]
      },
      3: {
        isRest: false,
        name: 'Legs A (Quads & Calves)',
        exercises: [
          { id: 'ppl-11', name: 'Barbell Back Squat', sets: 4, reps: 6, weight: '' },
          { id: 'ppl-12', name: 'Romanian Deadlift', sets: 3, reps: 8, weight: '' },
          { id: 'ppl-13', name: 'Leg Press', sets: 3, reps: 12, weight: '' },
          { id: 'ppl-14', name: 'Leg Extension', sets: 3, reps: 12, weight: '' },
          { id: 'ppl-15', name: 'Standing Calf Raise', sets: 4, reps: 15, weight: '' }
        ]
      },
      4: {
        isRest: false,
        name: 'Push B (Shoulders & Chest)',
        exercises: [
          { id: 'ppl-16', name: 'Overhead Barbell Press', sets: 4, reps: 6, weight: '' },
          { id: 'ppl-17', name: 'Dumbbell Flat Bench Press', sets: 3, reps: 10, weight: '' },
          { id: 'ppl-18', name: 'Dips (Weighted)', sets: 3, reps: 10, weight: '' },
          { id: 'ppl-19', name: 'Dumbbell Lateral Raise', sets: 4, reps: 15, weight: '' },
          { id: 'ppl-20', name: 'Overhead Tricep Extension', sets: 3, reps: 12, weight: '' }
        ]
      },
      5: {
        isRest: false,
        name: 'Pull B (Upper Back & Rear Delts)',
        exercises: [
          { id: 'ppl-21', name: 'Weighted Pull-ups', sets: 4, reps: 6, weight: '' },
          { id: 'ppl-22', name: 'Barbell Bent-Over Row', sets: 4, reps: 8, weight: '' },
          { id: 'ppl-23', name: 'Seated Cable Row', sets: 3, reps: 12, weight: '' },
          { id: 'ppl-24', name: 'Reverse Pec Deck Fly', sets: 3, reps: 15, weight: '' },
          { id: 'ppl-25', name: 'Barbell Bicep Curl', sets: 3, reps: 10, weight: '' }
        ]
      },
      6: {
        isRest: false,
        name: 'Legs B (Hamstrings & Posterior Chain)',
        exercises: [
          { id: 'ppl-26', name: 'Front Squat', sets: 3, reps: 8, weight: '' },
          { id: 'ppl-27', name: 'Barbell Hip Thrust', sets: 4, reps: 10, weight: '' },
          { id: 'ppl-28', name: 'Seated Leg Curl', sets: 3, reps: 12, weight: '' },
          { id: 'ppl-29', name: 'Walking Lunges', sets: 3, reps: 12, weight: '' },
          { id: 'ppl-30', name: 'Hanging Leg Raise', sets: 3, reps: 15, weight: '' }
        ]
      }
    }
  },
  {
    id: 'upper-lower-4day',
    name: 'Upper / Lower Split',
    tagline: 'Optimal strength-to-hypertrophy balance',
    daysPerWeek: 4,
    difficulty: 'All Levels',
    description: 'Alternates upper body and lower body days with built-in mid-week and weekend rest days. Incredible recovery, progressive overload tracking, and joint longevity.',
    schedule: {
      0: { isRest: true, name: 'Rest', exercises: [] },
      1: {
        isRest: false,
        name: 'Upper Body A (Power & Heavy Comp)',
        exercises: [
          { id: 'ul-1', name: 'Barbell Bench Press', sets: 4, reps: 6, weight: '' },
          { id: 'ul-2', name: 'Barbell Row', sets: 4, reps: 6, weight: '' },
          { id: 'ul-3', name: 'Standing Overhead Press', sets: 3, reps: 8, weight: '' },
          { id: 'ul-4', name: 'Lat Pulldown', sets: 3, reps: 10, weight: '' },
          { id: 'ul-5', name: 'Skull Crushers', sets: 3, reps: 10, weight: '' }
        ]
      },
      2: {
        isRest: false,
        name: 'Lower Body A (Squat Emphasis)',
        exercises: [
          { id: 'ul-6', name: 'Barbell Back Squat', sets: 4, reps: 6, weight: '' },
          { id: 'ul-7', name: 'Romanian Deadlift', sets: 3, reps: 8, weight: '' },
          { id: 'ul-8', name: 'Leg Press', sets: 3, reps: 10, weight: '' },
          { id: 'ul-9', name: 'Lying Leg Curl', sets: 3, reps: 12, weight: '' },
          { id: 'ul-10', name: 'Standing Calf Raise', sets: 4, reps: 15, weight: '' }
        ]
      },
      3: { isRest: true, name: 'Mid-Week Rest', exercises: [] },
      4: {
        isRest: false,
        name: 'Upper Body B (Hypertrophy & Pump)',
        exercises: [
          { id: 'ul-11', name: 'Incline Dumbbell Press', sets: 4, reps: 10, weight: '' },
          { id: 'ul-12', name: 'Pull-ups', sets: 4, reps: 8, weight: '' },
          { id: 'ul-13', name: 'Dumbbell Shoulder Press', sets: 3, reps: 10, weight: '' },
          { id: 'ul-14', name: 'Cable Lateral Raise', sets: 4, reps: 15, weight: '' },
          { id: 'ul-15', name: 'Incline Dumbbell Curl', sets: 3, reps: 12, weight: '' }
        ]
      },
      5: {
        isRest: false,
        name: 'Lower Body B (Deadlift Emphasis)',
        exercises: [
          { id: 'ul-16', name: 'Conventional Deadlift', sets: 3, reps: 5, weight: '' },
          { id: 'ul-17', name: 'Bulgarian Split Squat', sets: 3, reps: 10, weight: '' },
          { id: 'ul-18', name: 'Leg Extension', sets: 3, reps: 12, weight: '' },
          { id: 'ul-19', name: 'Seated Calf Raise', sets: 4, reps: 15, weight: '' },
          { id: 'ul-20', name: 'Cable Woodchoppers', sets: 3, reps: 15, weight: '' }
        ]
      },
      6: { isRest: true, name: 'Rest', exercises: [] }
    }
  },
  {
    id: 'arnold-split-6day',
    name: 'Arnold Golden Era Split',
    tagline: 'Antagonistic superset volume architecture',
    daysPerWeek: 6,
    difficulty: 'Advanced',
    description: 'The iconic high-volume bodybuilding split designed by Arnold Schwarzenegger. Pairs opposing muscle groups (Chest & Back, Shoulders & Arms, Legs) for massive pump and dense hypertrophy.',
    schedule: {
      0: { isRest: true, name: 'Rest', exercises: [] },
      1: {
        isRest: false,
        name: 'Chest & Back A',
        exercises: [
          { id: 'arn-1', name: 'Barbell Flat Bench Press', sets: 4, reps: 8, weight: '' },
          { id: 'arn-2', name: 'Wide-Grip Pull-ups', sets: 4, reps: 8, weight: '' },
          { id: 'arn-3', name: 'Incline Barbell Bench', sets: 4, reps: 10, weight: '' },
          { id: 'arn-4', name: 'T-Bar Row', sets: 4, reps: 8, weight: '' },
          { id: 'arn-5', name: 'Dumbbell Pullover', sets: 3, reps: 12, weight: '' }
        ]
      },
      2: {
        isRest: false,
        name: 'Shoulders & Arms A',
        exercises: [
          { id: 'arn-6', name: 'Seated Military Press', sets: 4, reps: 8, weight: '' },
          { id: 'arn-7', name: 'Standing Lateral Raise', sets: 4, reps: 12, weight: '' },
          { id: 'arn-8', name: 'Barbell Bicep Curl', sets: 4, reps: 10, weight: '' },
          { id: 'arn-9', name: 'Close-Grip Bench Press', sets: 4, reps: 10, weight: '' },
          { id: 'arn-10', name: 'Cable Hammer Curl', sets: 3, reps: 12, weight: '' }
        ]
      },
      3: {
        isRest: false,
        name: 'Legs & Lower Back A',
        exercises: [
          { id: 'arn-11', name: 'Barbell Back Squat', sets: 5, reps: 8, weight: '' },
          { id: 'arn-12', name: 'Straight-Leg Deadlift', sets: 4, reps: 10, weight: '' },
          { id: 'arn-13', name: 'Leg Press', sets: 4, reps: 12, weight: '' },
          { id: 'arn-14', name: 'Lying Leg Curl', sets: 4, reps: 12, weight: '' },
          { id: 'arn-15', name: 'Donkey Calf Raise', sets: 5, reps: 15, weight: '' }
        ]
      },
      4: {
        isRest: false,
        name: 'Chest & Back B',
        exercises: [
          { id: 'arn-16', name: 'Incline Dumbbell Press', sets: 4, reps: 10, weight: '' },
          { id: 'arn-17', name: 'Barbell Bent-Over Row', sets: 4, reps: 8, weight: '' },
          { id: 'arn-18', name: 'Dips (Chest Leaned)', sets: 3, reps: 12, weight: '' },
          { id: 'arn-19', name: 'Seated Cable Row', sets: 4, reps: 10, weight: '' },
          { id: 'arn-20', name: 'Cable Crossover Fly', sets: 3, reps: 15, weight: '' }
        ]
      },
      5: {
        isRest: false,
        name: 'Shoulders & Arms B',
        exercises: [
          { id: 'arn-21', name: 'Arnold Dumbbell Press', sets: 4, reps: 10, weight: '' },
          { id: 'arn-22', name: 'Bent-Over Rear Delt Fly', sets: 4, reps: 15, weight: '' },
          { id: 'arn-23', name: 'Preacher Curl', sets: 4, reps: 10, weight: '' },
          { id: 'arn-24', name: 'Overhead Tricep Extension', sets: 4, reps: 12, weight: '' },
          { id: 'arn-25', name: 'Concentration Curl', sets: 3, reps: 12, weight: '' }
        ]
      },
      6: {
        isRest: false,
        name: 'Legs & Abs B',
        exercises: [
          { id: 'arn-26', name: 'Front Squat', sets: 4, reps: 8, weight: '' },
          { id: 'arn-27', name: 'Walking Dumbbell Lunge', sets: 3, reps: 12, weight: '' },
          { id: 'arn-28', name: 'Leg Extension', sets: 4, reps: 15, weight: '' },
          { id: 'arn-29', name: 'Seated Leg Curl', sets: 4, reps: 12, weight: '' },
          { id: 'arn-30', name: 'Hanging Leg Raise', sets: 4, reps: 20, weight: '' }
        ]
      }
    }
  },
  {
    id: 'full-body-3day',
    name: 'Full Body Foundational (3-Day)',
    tagline: 'Maximum compound efficiency & athletic recovery',
    daysPerWeek: 3,
    difficulty: 'Beginner / Busy Athlete',
    description: 'Three non-consecutive training days focusing on heavy multi-joint compound lifts. Proven for busy professionals, athletes with high cardio volume, or beginners establishing neural adaptation.',
    schedule: {
      0: { isRest: true, name: 'Rest', exercises: [] },
      1: {
        isRest: false,
        name: 'Full Body A (Squat & Press Focus)',
        exercises: [
          { id: 'fb-1', name: 'Barbell Back Squat', sets: 3, reps: 6, weight: '' },
          { id: 'fb-2', name: 'Barbell Bench Press', sets: 3, reps: 8, weight: '' },
          { id: 'fb-3', name: 'Chest-Supported Row', sets: 3, reps: 8, weight: '' },
          { id: 'fb-4', name: 'Dumbbell Lateral Raise', sets: 3, reps: 12, weight: '' },
          { id: 'fb-5', name: 'Plank Hold (60s)', sets: 3, reps: 1, weight: '' }
        ]
      },
      2: { isRest: true, name: 'Active Recovery', exercises: [] },
      3: {
        isRest: false,
        name: 'Full Body B (Deadlift & Overhead Focus)',
        exercises: [
          { id: 'fb-6', name: 'Barbell Deadlift', sets: 3, reps: 5, weight: '' },
          { id: 'fb-7', name: 'Standing Overhead Press', sets: 3, reps: 6, weight: '' },
          { id: 'fb-8', name: 'Pull-ups / Lat Pulldown', sets: 3, reps: 8, weight: '' },
          { id: 'fb-9', name: 'Dumbbell Walking Lunge', sets: 3, reps: 10, weight: '' },
          { id: 'fb-10', name: 'Barbell Bicep Curl', sets: 3, reps: 10, weight: '' }
        ]
      },
      4: { isRest: true, name: 'Active Recovery', exercises: [] },
      5: {
        isRest: false,
        name: 'Full Body C (Hypertrophy & Pump)',
        exercises: [
          { id: 'fb-11', name: 'Leg Press', sets: 3, reps: 10, weight: '' },
          { id: 'fb-12', name: 'Incline Dumbbell Bench', sets: 3, reps: 10, weight: '' },
          { id: 'fb-13', name: 'Barbell Bent-Over Row', sets: 3, reps: 8, weight: '' },
          { id: 'fb-14', name: 'Dips / Tricep Pushdown', sets: 3, reps: 12, weight: '' },
          { id: 'fb-15', name: 'Hanging Knee Raise', sets: 3, reps: 15, weight: '' }
        ]
      },
      6: { isRest: true, name: 'Rest', exercises: [] }
    }
  },
  {
    id: 'bro-split-5day',
    name: 'Classic 5-Day Muscle Split',
    tagline: 'Dedicated single muscle group specialization',
    daysPerWeek: 5,
    difficulty: 'Intermediate',
    description: 'Each major muscle group gets its own dedicated session per week. Maximizes local muscular fatigue and mind-muscle connection with high localized volume.',
    schedule: {
      0: { isRest: true, name: 'Rest', exercises: [] },
      1: {
        isRest: false,
        name: 'Chest Specialization',
        exercises: [
          { id: 'bro-1', name: 'Barbell Flat Bench Press', sets: 4, reps: 8, weight: '' },
          { id: 'bro-2', name: 'Incline Dumbbell Press', sets: 4, reps: 10, weight: '' },
          { id: 'bro-3', name: 'Weighted Chest Dips', sets: 3, reps: 10, weight: '' },
          { id: 'bro-4', name: 'Cable Chest Fly', sets: 3, reps: 15, weight: '' }
        ]
      },
      2: {
        isRest: false,
        name: 'Back & Lats',
        exercises: [
          { id: 'bro-5', name: 'Conventional Deadlift', sets: 3, reps: 5, weight: '' },
          { id: 'bro-6', name: 'Barbell Bent Row', sets: 4, reps: 8, weight: '' },
          { id: 'bro-7', name: 'Wide Lat Pulldown', sets: 3, reps: 10, weight: '' },
          { id: 'bro-8', name: 'Seated Cable Row', sets: 3, reps: 12, weight: '' }
        ]
      },
      3: {
        isRest: false,
        name: 'Shoulders & Traps',
        exercises: [
          { id: 'bro-9', name: 'Standing Overhead Press', sets: 4, reps: 8, weight: '' },
          { id: 'bro-10', name: 'Dumbbell Lateral Raise', sets: 4, reps: 12, weight: '' },
          { id: 'bro-11', name: 'Face Pulls', sets: 3, reps: 15, weight: '' },
          { id: 'bro-12', name: 'Barbell Shrugs', sets: 4, reps: 12, weight: '' }
        ]
      },
      4: {
        isRest: false,
        name: 'Legs & Calves',
        exercises: [
          { id: 'bro-13', name: 'Barbell Back Squat', sets: 4, reps: 8, weight: '' },
          { id: 'bro-14', name: 'Romanian Deadlift', sets: 3, reps: 10, weight: '' },
          { id: 'bro-15', name: 'Leg Extension', sets: 3, reps: 12, weight: '' },
          { id: 'bro-16', name: 'Lying Leg Curl', sets: 3, reps: 12, weight: '' },
          { id: 'bro-17', name: 'Standing Calf Raise', sets: 4, reps: 15, weight: '' }
        ]
      },
      5: {
        isRest: false,
        name: 'Arms (Biceps & Triceps)',
        exercises: [
          { id: 'bro-18', name: 'Close-Grip Bench Press', sets: 4, reps: 8, weight: '' },
          { id: 'bro-19', name: 'Barbell Bicep Curl', sets: 4, reps: 8, weight: '' },
          { id: 'bro-20', name: 'Tricep Rope Pushdown', sets: 3, reps: 12, weight: '' },
          { id: 'bro-21', name: 'Incline Dumbbell Curl', sets: 3, reps: 10, weight: '' },
          { id: 'bro-22', name: 'Overhead Cable Extension', sets: 3, reps: 12, weight: '' }
        ]
      },
      6: { isRest: true, name: 'Rest', exercises: [] }
    }
  },
  {
    id: 'minimalist-30m',
    name: 'Minimalist 30-Min Power',
    tagline: 'High-density, time-efficient compound power',
    daysPerWeek: 3,
    difficulty: 'All Levels',
    description: 'Designed for maximal output in under 30 minutes. Uses high-intensity compound pairings with minimal downtime to deliver strength preservation and conditioning.',
    schedule: {
      0: { isRest: true, name: 'Rest', exercises: [] },
      1: {
        isRest: false,
        name: 'Heavy Push & Pull A',
        exercises: [
          { id: 'min-1', name: 'Barbell Bench Press', sets: 3, reps: 5, weight: '' },
          { id: 'min-2', name: 'Weighted Pull-ups', sets: 3, reps: 6, weight: '' },
          { id: 'min-3', name: 'Dumbbell Lateral Raise', sets: 3, reps: 12, weight: '' }
        ]
      },
      2: { isRest: true, name: 'Recovery', exercises: [] },
      3: {
        isRest: false,
        name: 'Heavy Legs & Core B',
        exercises: [
          { id: 'min-4', name: 'Barbell Back Squat', sets: 3, reps: 5, weight: '' },
          { id: 'min-5', name: 'Romanian Deadlift', sets: 3, reps: 8, weight: '' },
          { id: 'min-6', name: 'Hanging Leg Raise', sets: 3, reps: 12, weight: '' }
        ]
      },
      4: { isRest: true, name: 'Recovery', exercises: [] },
      5: {
        isRest: false,
        name: 'Total Power C',
        exercises: [
          { id: 'min-7', name: 'Standing Overhead Press', sets: 3, reps: 6, weight: '' },
          { id: 'min-8', name: 'Barbell Deadlift', sets: 3, reps: 5, weight: '' },
          { id: 'min-9', name: 'Push-ups (To Failure)', sets: 2, reps: 20, weight: '' }
        ]
      },
      6: { isRest: true, name: 'Rest', exercises: [] }
    }
  }
];

// Common standard movements library for quick autocompletion / addition in live sessions
export const POPULAR_EXERCISES = [
  'Barbell Bench Press',
  'Incline Dumbbell Press',
  'Dumbbell Shoulder Press',
  'Standing Overhead Press',
  'Barbell Back Squat',
  'Front Squat',
  'Barbell Deadlift',
  'Romanian Deadlift',
  'Pull-ups',
  'Chin-ups',
  'Lat Pulldown',
  'Barbell Row',
  'Chest-Supported Row',
  'Seated Cable Row',
  'Dips',
  'Cable Lateral Raise',
  'Dumbbell Lateral Raise',
  'Face Pulls',
  'Tricep Pushdown',
  'Skull Crushers',
  'Barbell Bicep Curl',
  'Incline Dumbbell Curl',
  'Hammer Curls',
  'Leg Press',
  'Leg Extension',
  'Leg Curl',
  'Bulgarian Split Squat',
  'Calf Raise',
  'Hanging Leg Raise',
  'Ab Wheel Rollout',
  'Hip Thrust'
];

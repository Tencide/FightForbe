/**
 * Rule-based plan generators that turn a user profile (goals + body comp +
 * preferences) into a workout or meal plan. Pure functions — no DB access.
 */

const FOCUS_DAYS = {
  striking: ['Striking', 'Strength (Lower)', 'Striking & Conditioning', 'Active recovery', 'Sparring & footwork', 'Strength (Upper)', 'Cardio + mobility'],
  grappling: ['Grappling drills', 'Strength (Pull)', 'Live rolling', 'Active recovery', 'Grappling & conditioning', 'Strength (Push)', 'Cardio + mobility'],
  'all-around': ['Striking', 'Strength (Lower)', 'Grappling', 'Active recovery', 'Conditioning circuit', 'Strength (Upper)', 'Cardio + mobility'],
  strength: ['Strength (Lower)', 'Cardio', 'Strength (Push)', 'Active recovery', 'Strength (Pull)', 'Conditioning circuit', 'Cardio + mobility'],
};

const SESSION_BLOCKS = {
  Striking: [
    '10 min jump rope warmup (alternate single + double-unders)',
    '4×3 min heavy bag — jab/cross/hook combos',
    '3×3 min shadow boxing focusing on footwork',
    '3×30 sec speed bag, 30 sec rest',
    '5 min cooldown + neck mobility',
  ],
  'Striking & Conditioning': [
    '10 min jump rope',
    '5×3 min heavy bag w/ 1 min active recovery',
    '4 rounds: 30s burpees, 30s rest',
    '3×3 min shadow boxing',
    '5 min cooldown',
  ],
  'Sparring & footwork': [
    '15 min dynamic warmup',
    '4 rounds light-contact sparring (3 min on, 1 min off)',
    '3×3 min footwork drills (cone work)',
    '2×60 sec wall sit',
    '10 min stretch',
  ],
  'Strength (Lower)': [
    'Back squat — 4×6 @ 75-80% 1RM',
    'Romanian deadlift — 3×8',
    'Walking lunges — 3×10/leg w/ dumbbells',
    'Leg curl + calf raise superset — 3×12',
    '10 min cooldown + foam roll quads/hams',
  ],
  'Strength (Upper)': [
    'Bench press — 4×6',
    'Bent-over row — 4×8',
    'Overhead press — 3×8',
    'Pull-ups — 3×AMRAP',
    'Triceps + biceps superset — 3×12',
  ],
  'Strength (Push)': [
    'Bench press — 4×6',
    'Overhead press — 3×8',
    'Incline DB press — 3×10',
    'Triceps dip — 3×AMRAP',
    'Lateral raise — 3×12',
  ],
  'Strength (Pull)': [
    'Deadlift — 4×5',
    'Pull-ups — 4×AMRAP (weighted if you can)',
    'Bent-over row — 3×8',
    'Face pull — 3×15',
    'Bicep curl — 3×10',
  ],
  Grappling: [
    '10 min mobility + neck warmup',
    '20 min technique drilling (focus position)',
    '5×3 min positional rolls',
    '3×30 sec hip escape drill',
    '10 min cooldown stretch',
  ],
  'Grappling drills': [
    '15 min warmup + breakfalls',
    '20 min specific drilling (takedowns or guard)',
    '4 rounds positional sparring',
    '5 min hip mobility',
  ],
  'Live rolling': [
    '10 min dynamic warmup',
    '6 rounds 5 min live rolling',
    '5 min cooldown stretching',
  ],
  'Conditioning circuit': [
    '5 rounds for time:',
    '  • 20 burpees',
    '  • 15 box jumps',
    '  • 10 dumbbell snatches/arm',
    '  • 200m run',
    'Goal: under 25 min for intermediate, under 20 advanced',
  ],
  Cardio: [
    '30-45 min steady-state run @ 70% max HR',
    'OR 20 min interval bike (1 min hard, 1 min easy)',
    '10 min cooldown walk',
  ],
  'Cardio + mobility': [
    '20 min easy zone-2 cardio (bike or row)',
    '20 min full-body mobility flow',
    '10 min stretch / breathwork',
  ],
  'Active recovery': [
    'Light walk 30-45 min',
    '15 min mobility flow (CARs)',
    'Optional: sauna or contrast shower',
  ],
};

/**
 * Build a 7-day workout plan from a user profile.
 * Returns { title, description, content }.
 */
function generateWorkoutPlan(profile = {}) {
  const goal = ['cut', 'maintain', 'bulk'].includes(profile.goalType)
    ? profile.goalType
    : 'maintain';
  const days = Math.max(3, Math.min(6, Number(profile.daysPerWeek) || 4));
  const focus = FOCUS_DAYS[profile.trainingFocus] ? profile.trainingFocus : 'all-around';
  const exp = ['beginner', 'intermediate', 'advanced'].includes(profile.experienceLevel)
    ? profile.experienceLevel
    : 'intermediate';

  const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const template = FOCUS_DAYS[focus];

  // Pick training days evenly spread across the week
  const trainSlots = pickTrainingDays(days);
  const restNote = exp === 'beginner'
    ? 'Beginner — keep RPE around 6-7. Add weight only when last set looks clean.'
    : exp === 'advanced'
    ? 'Advanced — push to RPE 8-9 on top sets. Track loads weekly.'
    : 'Intermediate — RPE 7-8 most working sets.';

  const intensityNote = goal === 'cut'
    ? 'Cut phase — keep strength volume, add 1-2 conditioning circuits/week. Calorie deficit will limit recovery, prioritize sleep.'
    : goal === 'bulk'
    ? 'Bulk phase — heavy strength bias, lower-intensity cardio (zone 2). Don\'t skip the mobility days.'
    : 'Maintenance — balanced mix. Use the rest days for skill work or active recovery.';

  const lines = [
    `Goals: ${goal} · ${days} days/week · focus on ${focus} · ${exp} level`,
    '',
    intensityNote,
    restNote,
    '',
    '── Weekly schedule ──',
    '',
  ];

  for (let i = 0; i < 7; i++) {
    const isTraining = trainSlots.has(i);
    const blockName = isTraining ? template[i % template.length] : 'Rest day';
    lines.push(`${dayNames[i]} — ${blockName}`);
    if (isTraining) {
      const block = SESSION_BLOCKS[blockName] || [];
      for (const item of block) {
        lines.push(`  • ${item}`);
      }
    } else {
      lines.push('  • Full recovery — light walking, hydration, mobility (10-15 min)');
    }
    lines.push('');
  }

  const title = `Auto plan: ${capitalize(goal)} (${days}d/wk · ${focus})`;
  const description = `Auto-generated from your profile — adjust the loads to match where you actually are this week.`;

  return { title, description, content: lines.join('\n').trimEnd() };
}

function pickTrainingDays(count) {
  if (count >= 6) return new Set([0, 1, 2, 4, 5, 6]);
  if (count === 5) return new Set([0, 1, 3, 4, 5]);
  if (count === 4) return new Set([0, 1, 3, 5]);
  return new Set([0, 2, 4]);
}

function capitalize(s) {
  return s ? s[0].toUpperCase() + s.slice(1) : s;
}

/**
 * Compute calories + macros from a profile.
 * Returns { title, description, targetCalories, proteinG, carbsG, fatG, notes }.
 */
function generateMealPlan(profile = {}) {
  const sex = ['male', 'female', 'other'].includes(profile.sex) ? profile.sex : 'male';
  const age = clampNum(profile.ageYears, 14, 90, 25);
  const heightIn = clampNum(profile.heightIn, 48, 84, 68);
  const weightLb = clampNum(profile.currentWeightLb, 80, 400, 170);
  const days = clampNum(profile.daysPerWeek, 0, 7, 4);
  const goal = ['cut', 'maintain', 'bulk'].includes(profile.goalType)
    ? profile.goalType
    : 'maintain';
  const dietary = profile.dietary || 'none';

  const heightCm = heightIn * 2.54;
  const weightKg = weightLb * 0.453592;

  const sexAdj = sex === 'female' ? -161 : sex === 'other' ? -78 : 5;
  const bmr = 10 * weightKg + 6.25 * heightCm - 5 * age + sexAdj;

  const activityMap = [1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 1.8, 1.9];
  const tdee = bmr * activityMap[days];

  let calories;
  if (goal === 'cut') calories = Math.round(tdee - 500);
  else if (goal === 'bulk') calories = Math.round(tdee + 350);
  else calories = Math.round(tdee);

  const proteinPerLb = goal === 'cut' ? 1.1 : 1.0;
  const proteinG = Math.round(weightLb * proteinPerLb);
  const fatG = Math.round(weightLb * (goal === 'cut' ? 0.35 : 0.4));
  const remainingCal = calories - proteinG * 4 - fatG * 9;
  const carbsG = Math.max(0, Math.round(remainingCal / 4));

  const notesLines = [
    `BMR: ${Math.round(bmr)} kcal · TDEE: ${Math.round(tdee)} kcal · Goal: ${goal}.`,
    `Protein at ${proteinPerLb} g/lb body weight. Adjust ±200 kcal based on weekly weight trend.`,
  ];

  if (goal === 'cut') {
    notesLines.push('On training days, carb-load around the workout. Save fat for non-training days.');
  } else if (goal === 'bulk') {
    notesLines.push('Aim for slow gain (0.5 lb/week). Add a calorie-dense liquid (whole milk, smoothie) if appetite is the limiter.');
  } else {
    notesLines.push('Re-evaluate every 2-3 weeks. Bump or cut 200 kcal if the scale moves the wrong way.');
  }

  if (dietary === 'vegetarian') {
    notesLines.push('Vegetarian — lean on eggs, dairy, tofu, lentils. Watch B12 and iron.');
  } else if (dietary === 'vegan') {
    notesLines.push('Vegan — combine grains + legumes for complete protein. Supplement B12.');
  } else if (dietary === 'halal') {
    notesLines.push('Halal — chicken, fish, halal red meats. Avoid alcohol-derived flavorings.');
  } else if (dietary === 'kosher') {
    notesLines.push('Kosher — separate meat/dairy. Plenty of fish + parve protein options.');
  }

  const title = `Auto: ${capitalize(goal)} ${calories} kcal`;
  const description = `Auto-generated from your profile (${weightLb} lb, ${heightIn}" tall, ${days} d/wk training).`;

  return {
    title,
    description,
    targetCalories: calories,
    proteinG,
    carbsG,
    fatG,
    notes: notesLines.join('\n'),
  };
}

function clampNum(v, min, max, fallback) {
  const n = Number(v);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(min, Math.min(max, n));
}

function profileSufficient(profile) {
  if (!profile) return false;
  return Boolean(
    profile.currentWeightLb &&
      profile.heightIn &&
      profile.ageYears &&
      profile.sex &&
      profile.goalType
  );
}

module.exports = { generateWorkoutPlan, generateMealPlan, profileSufficient };

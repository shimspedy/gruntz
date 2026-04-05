import { UserProgress } from '../types';

/**
 * AI Engine Abstraction Layer — Dual LLM Architecture
 *
 * Two-tier model strategy:
 * - GPT-4o-mini: Chat coaching + plan generation (fast, cheap)
 * - GPT-4o: Vision-based form analysis (photo/video, on-demand)
 *
 * To activate OpenAI:
 * 1. npm install openai
 * 2. Set EXPO_PUBLIC_AI_PROVIDER='openai' in .env
 * 3. Set EXPO_PUBLIC_OPENAI_API_KEY in .env
 * 4. The engine will auto-switch to API calls
 *
 * Cost estimate: ~$5-15/month for 1,000 active users
 *   - GPT-4o-mini (~$0.15/1M input tokens) handles 95% of requests
 *   - GPT-4o (~$2.50/1M input tokens) only for photo analysis
 */

// ─── Configuration ──────────────────────────────────────────────

type AIProvider = 'local' | 'openai';

const AI_PROVIDER: AIProvider = (process.env.EXPO_PUBLIC_AI_PROVIDER as AIProvider) || 'local';
const OPENAI_API_KEY = process.env.EXPO_PUBLIC_OPENAI_API_KEY || '';

/** GPT-4o-mini for text tasks (chat, plans) — fast & cheap */
const TEXT_MODEL = 'gpt-4o-mini';

/** GPT-4o for vision tasks (form analysis from photos) — powerful */
const VISION_MODEL = 'gpt-4o';

const SYSTEM_PROMPT = `You are a military fitness coach named "Gruntz Coach". You speak in a direct, motivational military style. You are knowledgeable about calisthenics, running, rucking, swimming, and tactical fitness. Keep responses concise (2-4 sentences). Never recommend exercises that could cause injury without proper form. Always encourage users but be honest about areas for improvement.`;

const VISION_SYSTEM_PROMPT = `You are a military fitness form analyst. Analyze the provided exercise photo and assess form quality. Be specific about what is correct and what needs improvement. Respond in JSON format with: { "tips": [{ "area": string, "issue": string, "fix": string, "priority": "high"|"medium"|"low" }], "overallScore": number (0-100), "encouragement": string }`;

// ─── Types ──────────────────────────────────────────────────────

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
}

export interface GeneratedPlan {
  name: string;
  description: string;
  weeklySchedule: PlanDay[];
  estimatedDuration: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
}

export interface PlanDay {
  day: number;
  title: string;
  focus: string;
  exercises: PlanExercise[];
  estimatedMinutes: number;
}

export interface PlanExercise {
  name: string;
  sets: number;
  reps?: number;
  duration?: string;
  rest: string;
  notes?: string;
}

export interface FormAnalysis {
  exerciseName: string;
  overallScore: number; // 0-100
  tips: FormTip[];
  encouragement: string;
}

export interface FormTip {
  area: string;
  issue: string;
  fix: string;
  priority: 'high' | 'medium' | 'low';
}

// ─── Chat Engine ────────────────────────────────────────────────

export async function sendChatMessage(
  userMessage: string,
  history: ChatMessage[],
  progress: UserProgress,
): Promise<string> {
  if (AI_PROVIDER === 'openai' && OPENAI_API_KEY) {
    return sendOpenAIChat(userMessage, history, progress);
  }
  return localChatResponse(userMessage, progress);
}

/** Rule-based chat — swap for OpenAI later */
function localChatResponse(message: string, progress: UserProgress): string {
  const lower = message.toLowerCase();

  // Greeting
  if (lower.match(/^(hey|hi|hello|sup|yo|what'?s up)/)) {
    if (progress.streak_days > 0) {
      return `Good to see you, warrior. ${progress.streak_days}-day streak and counting. What do you need?`;
    }
    return "Welcome back. Ready to put in work? Ask me anything about your training.";
  }

  // Streak questions
  if (lower.includes('streak')) {
    if (progress.streak_days >= 7) return `${progress.streak_days} days straight. That's discipline. Keep it going — consistency is the weapon.`;
    if (progress.streak_days > 0) return `You're at ${progress.streak_days} days. Build it to 7 and you'll see real momentum. Don't break the chain.`;
    return "No active streak right now. Start today's mission and we build from zero. Everyone starts somewhere.";
  }

  // Recovery / rest questions
  if (lower.match(/recover|rest|sore|tired|fatigue|sleep/)) {
    return "Recovery is part of the mission. Hydrate (half your bodyweight in oz), stretch 10 min, get 7-8 hours of sleep. If you're really sore, do active recovery — walk, foam roll, light stretching. Don't skip it.";
  }

  // Nutrition
  if (lower.match(/eat|nutrition|diet|protein|meal|food|calories/)) {
    return "For military fitness: aim for 1g protein per pound of bodyweight, complex carbs before training, and don't skip meals. Hydration is non-negotiable. Eat real food — if it didn't grow or have a mother, think twice.";
  }

  // Running / cardio
  if (lower.match(/run|cardio|mile|pace|speed|endurance/)) {
    if (progress.endurance_score < 40) {
      return "Your endurance needs work. Start with 3x/week runs — easy pace, build a base. Week 1: 1.5 miles. Add 0.25 miles each week. Don't chase speed yet, chase consistency.";
    }
    return "For speed improvement: interval training 2x/week. 400m repeats at goal pace with 90-sec rest. One long easy run per week. Your endurance score shows you have the base — time to sharpen it.";
  }

  // Strength / push-ups / pull-ups
  if (lower.match(/strength|push.?up|pull.?up|muscle|strong|lift|weight/)) {
    if (progress.strength_score < 40) {
      return "Build your foundation. Push-ups: do 3 sets to failure every other day. Track your max. Add 1-2 reps per week. Pull-ups: start with dead hangs (30 sec), then negatives (lower slowly from top). It compounds fast.";
    }
    return "At your level, focus on progressive overload. Slow tempo push-ups (3 sec down, 1 sec up), weighted pull-ups or archer variations, and pistol squat progressions. Quality over quantity now.";
  }

  // Rucking
  if (lower.match(/ruck|hike|weight.*(walk|carry)|pack/)) {
    return "Start with 20-25 lbs, 2-3 miles, 15 min/mile pace. Add 5 lbs every 2 weeks, not distance. Keep your back straight, shorten your stride. Military rule: never ruck two days in a row. Your feet and joints will thank you.";
  }

  // Motivation / struggle
  if (lower.match(/motivat|quit|give up|can't|hard|struggle|doubt|fail/)) {
    return "Every operator has dark days. The mission isn't about how you feel — it's about showing up anyway. One rep, one step, one day at a time. You signed up for this because easy wasn't the goal. Now prove it.";
  }

  // Level / rank / progress
  if (lower.match(/level|rank|xp|progress|how.*(do|am).*(i|doing)/)) {
    return `You're Level ${progress.current_level}, rank ${progress.current_rank}, with ${progress.current_xp.toLocaleString()} XP. ${progress.workouts_completed} missions completed. ${progress.streak_days > 0 ? `🔥 ${progress.streak_days}-day streak.` : 'Start a streak today.'} Keep stacking missions and the rank will follow.`;
  }

  // Form tips
  if (lower.match(/form|technique|proper|correct|how to/)) {
    return "Good form beats high reps every time. Slow it down — 2 seconds up, 2 seconds down. If your form breaks, that's your true rep max for today. Film yourself and compare to the exercise detail page. Which exercise do you need help with?";
  }

  // Plan / schedule
  if (lower.match(/plan|schedule|week|routine|program/)) {
    return "Your current program is already periodized for you. Hit the daily missions in order — they're designed to build on each other. If you want a custom plan for a specific goal, use the Plan Generator from this screen.";
  }

  // Default catch-all
  const catchAll = [
    "Stay focused. What's your specific question about training?",
    "I'm here to help you get stronger. Ask me about exercises, nutrition, recovery, or your progress.",
    "Good question. Tell me more about what you're trying to achieve and I'll give you a specific plan.",
    `With ${progress.workouts_completed} missions under your belt, you're making progress. What do you need help with next?`,
  ];
  return catchAll[Math.floor(Math.random() * catchAll.length)];
}

// ─── Plan Generator ─────────────────────────────────────────────

export async function generateCustomPlan(
  goalDescription: string,
  progress: UserProgress,
  daysPerWeek: number,
): Promise<GeneratedPlan> {
  if (AI_PROVIDER === 'openai' && OPENAI_API_KEY) {
    return generateOpenAIPlan(goalDescription, progress, daysPerWeek);
  }
  return localGeneratePlan(goalDescription, progress, daysPerWeek);
}

function localGeneratePlan(goal: string, progress: UserProgress, daysPerWeek: number): GeneratedPlan {
  const lower = goal.toLowerCase();

  // Determine focus from goal description
  let focus: 'strength' | 'endurance' | 'balanced' | 'tactical' = 'balanced';
  if (lower.match(/run|cardio|endurance|mile|speed|marathon/)) focus = 'endurance';
  else if (lower.match(/strength|push.?up|pull.?up|muscle|strong|bench|lift/)) focus = 'strength';
  else if (lower.match(/military|ruck|tactical|combat|pt test|apft|acft/)) focus = 'tactical';

  // Determine difficulty from user level
  const difficulty = progress.current_level <= 3 ? 'beginner' : progress.current_level <= 8 ? 'intermediate' : 'advanced';

  const templates: Record<string, PlanDay[]> = {
    strength: [
      { day: 1, title: 'Upper Push', focus: 'Chest & Shoulders', estimatedMinutes: 40, exercises: [
        { name: 'Push-Ups', sets: 4, reps: difficulty === 'beginner' ? 10 : difficulty === 'intermediate' ? 20 : 30, rest: '60s' },
        { name: 'Diamond Push-Ups', sets: 3, reps: difficulty === 'beginner' ? 6 : 12, rest: '60s' },
        { name: 'Pike Push-Ups', sets: 3, reps: difficulty === 'beginner' ? 6 : 10, rest: '60s' },
        { name: 'Plank', sets: 3, duration: '45s', rest: '30s' },
      ]},
      { day: 2, title: 'Lower Body', focus: 'Legs & Core', estimatedMinutes: 35, exercises: [
        { name: 'Squats', sets: 4, reps: difficulty === 'beginner' ? 15 : 25, rest: '60s' },
        { name: 'Lunges', sets: 3, reps: 12, rest: '45s', notes: 'Each leg' },
        { name: 'Calf Raises', sets: 3, reps: 20, rest: '30s' },
        { name: 'Flutter Kicks', sets: 3, reps: 20, rest: '30s', notes: '4-count' },
      ]},
      { day: 3, title: 'Upper Pull', focus: 'Back & Biceps', estimatedMinutes: 40, exercises: [
        { name: 'Pull-Ups', sets: difficulty === 'beginner' ? 5 : 4, reps: difficulty === 'beginner' ? 1 : difficulty === 'intermediate' ? 8 : 12, rest: '90s', notes: difficulty === 'beginner' ? 'Negatives if needed' : undefined },
        { name: 'Inverted Rows', sets: 3, reps: 12, rest: '60s' },
        { name: 'Superman Holds', sets: 3, duration: '30s', rest: '30s' },
        { name: 'Dead Hangs', sets: 3, duration: '30s', rest: '45s' },
      ]},
    ],
    endurance: [
      { day: 1, title: 'Easy Run', focus: 'Aerobic Base', estimatedMinutes: 30, exercises: [
        { name: 'Easy Pace Run', sets: 1, duration: difficulty === 'beginner' ? '20 min' : '30 min', rest: 'N/A', notes: 'Conversational pace' },
        { name: 'Dynamic Stretching', sets: 1, duration: '5 min', rest: 'N/A' },
      ]},
      { day: 2, title: 'Intervals', focus: 'Speed & VO2 Max', estimatedMinutes: 35, exercises: [
        { name: 'Warm-Up Jog', sets: 1, duration: '10 min', rest: 'N/A' },
        { name: '400m Repeats', sets: difficulty === 'beginner' ? 4 : difficulty === 'intermediate' ? 6 : 8, duration: 'Goal pace', rest: '90s' },
        { name: 'Cool-Down Jog', sets: 1, duration: '5 min', rest: 'N/A' },
      ]},
      { day: 3, title: 'Long Run', focus: 'Endurance', estimatedMinutes: 45, exercises: [
        { name: 'Long Slow Distance', sets: 1, duration: difficulty === 'beginner' ? '25 min' : '40 min', rest: 'N/A', notes: 'Easy pace, build duration weekly' },
      ]},
    ],
    tactical: [
      { day: 1, title: 'PT Test Prep', focus: 'Push-Ups, Sit-Ups, Run', estimatedMinutes: 45, exercises: [
        { name: 'Push-Ups (Max Set)', sets: 3, reps: 0, rest: '2 min', notes: 'Go to failure each set' },
        { name: 'Sit-Ups (Max Set)', sets: 3, reps: 0, rest: '2 min', notes: 'Go to failure each set' },
        { name: '1.5 Mile Run', sets: 1, duration: 'Best effort', rest: 'N/A' },
      ]},
      { day: 2, title: 'Ruck March', focus: 'Load Bearing', estimatedMinutes: 50, exercises: [
        { name: 'Ruck March', sets: 1, duration: difficulty === 'beginner' ? '30 min / 2mi' : '45 min / 4mi', rest: 'N/A', notes: `${difficulty === 'beginner' ? '20' : '35'} lbs, 15 min/mile pace` },
        { name: 'Post-Ruck Stretching', sets: 1, duration: '10 min', rest: 'N/A' },
      ]},
      { day: 3, title: 'Combat Circuit', focus: 'Full Body Power', estimatedMinutes: 40, exercises: [
        { name: 'Burpees', sets: 4, reps: 10, rest: '60s' },
        { name: 'Mountain Climbers', sets: 4, duration: '30s', rest: '30s' },
        { name: 'Ammo Can Press', sets: 4, reps: 12, rest: '60s', notes: '30 lb weight' },
        { name: 'Sprint Intervals', sets: 6, duration: '20s on / 40s off', rest: '40s' },
      ]},
    ],
    balanced: [
      { day: 1, title: 'Upper Body Strength', focus: 'Push & Pull', estimatedMinutes: 40, exercises: [
        { name: 'Push-Ups', sets: 4, reps: difficulty === 'beginner' ? 10 : 20, rest: '60s' },
        { name: 'Pull-Ups', sets: 3, reps: difficulty === 'beginner' ? 3 : 8, rest: '90s' },
        { name: 'Dips', sets: 3, reps: difficulty === 'beginner' ? 6 : 12, rest: '60s' },
        { name: 'Plank', sets: 3, duration: '45s', rest: '30s' },
      ]},
      { day: 2, title: 'Cardio & Core', focus: 'Endurance', estimatedMinutes: 35, exercises: [
        { name: 'Run', sets: 1, duration: difficulty === 'beginner' ? '15 min' : '25 min', rest: 'N/A' },
        { name: 'Flutter Kicks', sets: 3, reps: 20, rest: '30s' },
        { name: 'Mountain Climbers', sets: 3, duration: '30s', rest: '30s' },
        { name: 'Bicycle Crunches', sets: 3, reps: 20, rest: '30s' },
      ]},
      { day: 3, title: 'Lower Body & Power', focus: 'Legs & Explosiveness', estimatedMinutes: 40, exercises: [
        { name: 'Squats', sets: 4, reps: 20, rest: '60s' },
        { name: 'Lunges', sets: 3, reps: 12, rest: '45s', notes: 'Each leg' },
        { name: 'Box Jumps', sets: 3, reps: 10, rest: '60s', notes: 'Or jump squats' },
        { name: 'Calf Raises', sets: 3, reps: 25, rest: '30s' },
      ]},
    ],
  };

  const baseDays = templates[focus];
  // Fit to requested days per week — repeat or trim
  const weeklySchedule: PlanDay[] = [];
  for (let i = 0; i < daysPerWeek; i++) {
    const template = baseDays[i % baseDays.length];
    weeklySchedule.push({ ...template, day: i + 1 });
  }

  const focusNames: Record<string, string> = {
    strength: 'Strength Builder',
    endurance: 'Endurance Protocol',
    tactical: 'Tactical Readiness',
    balanced: 'Balanced Operator',
  };

  return {
    name: focusNames[focus],
    description: `Custom ${difficulty} plan built for: "${goal}". ${daysPerWeek} days/week, ${focus} focus.`,
    weeklySchedule,
    estimatedDuration: '4-6 weeks',
    difficulty,
  };
}

// ─── Form Analysis ──────────────────────────────────────────────

export async function analyzeForm(
  exerciseName: string,
  _imageBase64?: string, // Ready for AI vision API
): Promise<FormAnalysis> {
  if (AI_PROVIDER === 'openai' && OPENAI_API_KEY && _imageBase64) {
    return analyzeFormOpenAI(exerciseName, _imageBase64);
  }
  return localFormAnalysis(exerciseName);
}

function localFormAnalysis(exerciseName: string): FormAnalysis {
  const lower = exerciseName.toLowerCase();

  const formGuides: Record<string, FormAnalysis> = {
    'push-up': {
      exerciseName: 'Push-Up',
      overallScore: 0, // 0 = not scored (no image)
      tips: [
        { area: 'Hands', issue: 'Wide hand placement', fix: 'Place hands directly under shoulders, fingers spread', priority: 'high' },
        { area: 'Core', issue: 'Hips sagging', fix: 'Squeeze glutes and brace core — body should be a plank', priority: 'high' },
        { area: 'Elbows', issue: 'Elbows flaring out', fix: 'Keep elbows at 45° angle, not 90°', priority: 'medium' },
        { area: 'Neck', issue: 'Looking up or down', fix: 'Neutral neck — look at a spot 6 inches ahead of hands', priority: 'low' },
        { area: 'Depth', issue: 'Partial range of motion', fix: 'Chest should touch the ground or come within 2 inches', priority: 'high' },
      ],
      encouragement: 'The push-up is the king of military fitness. Master this and everything else gets easier.',
    },
    'pull-up': {
      exerciseName: 'Pull-Up',
      overallScore: 0,
      tips: [
        { area: 'Grip', issue: 'Grip too narrow/wide', fix: 'Hands shoulder-width apart, overhand grip', priority: 'high' },
        { area: 'Start', issue: 'Not fully extending', fix: 'Start from a dead hang — full arm extension', priority: 'high' },
        { area: 'Path', issue: 'Swinging or kipping', fix: 'Pull straight up — chin clearly over bar. No swing.', priority: 'high' },
        { area: 'Shoulders', issue: 'Shrugging', fix: 'Pull shoulders down and back before pulling up', priority: 'medium' },
        { area: 'Core', issue: 'Legs swinging', fix: 'Cross ankles, squeeze glutes, keep body tight', priority: 'medium' },
      ],
      encouragement: 'Pull-ups separate the operators from the recruits. Each rep is earned.',
    },
    'squat': {
      exerciseName: 'Squat',
      overallScore: 0,
      tips: [
        { area: 'Depth', issue: 'Not deep enough', fix: 'Hip crease below knee line — thighs at least parallel', priority: 'high' },
        { area: 'Knees', issue: 'Knees caving in', fix: 'Push knees out over toes, track with foot direction', priority: 'high' },
        { area: 'Heels', issue: 'Heels rising', fix: 'Weight through mid-foot to heel. If heels rise, widen stance', priority: 'high' },
        { area: 'Back', issue: 'Rounding forward', fix: 'Chest up, look forward, brace core. Slight forward lean is OK', priority: 'medium' },
        { area: 'Feet', issue: 'Narrow stance', fix: 'Feet shoulder-width or slightly wider, toes 15-30° out', priority: 'low' },
      ],
      encouragement: 'Strong legs carry the mission. Every squat builds the foundation.',
    },
    'plank': {
      exerciseName: 'Plank',
      overallScore: 0,
      tips: [
        { area: 'Hips', issue: 'Hips too high or sagging', fix: 'Straight line from ears to ankles. Squeeze glutes.', priority: 'high' },
        { area: 'Shoulders', issue: 'Shoulders behind elbows', fix: 'Elbows directly under shoulders', priority: 'high' },
        { area: 'Breathing', issue: 'Holding breath', fix: 'Breathe steadily. Exhale to engage deep core.', priority: 'medium' },
        { area: 'Neck', issue: 'Looking up', fix: 'Neutral spine — look at ground between hands', priority: 'low' },
      ],
      encouragement: 'A strong plank = a strong core = a strong operator. Hold the line.',
    },
    'lunge': {
      exerciseName: 'Lunge',
      overallScore: 0,
      tips: [
        { area: 'Knee', issue: 'Front knee past toes', fix: 'Step far enough forward that knee stays over ankle', priority: 'high' },
        { area: 'Back Knee', issue: 'Not lowering enough', fix: 'Back knee should nearly touch the ground', priority: 'medium' },
        { area: 'Torso', issue: 'Leaning forward', fix: 'Keep torso upright, core braced', priority: 'medium' },
        { area: 'Balance', issue: 'Wobbling', fix: 'Widen your stance side-to-side. Look straight ahead.', priority: 'low' },
      ],
      encouragement: 'Lunges build single-leg strength that translates directly to the field.',
    },
    'burpee': {
      exerciseName: 'Burpee',
      overallScore: 0,
      tips: [
        { area: 'Chest', issue: 'Not touching ground', fix: 'Full chest-to-ground, then push up explosively', priority: 'high' },
        { area: 'Jump', issue: 'Weak finish', fix: 'Jump with full hip extension, hands above ears', priority: 'medium' },
        { area: 'Pace', issue: 'Resting at bottom', fix: 'Touch and go — minimize time on ground', priority: 'medium' },
        { area: 'Landing', issue: 'Hard landing', fix: 'Land soft on balls of feet, absorb with knees', priority: 'low' },
      ],
      encouragement: 'Burpees are the great equalizer. Love them or hate them, they make you better.',
    },
  };

  // Find best match
  for (const [key, analysis] of Object.entries(formGuides)) {
    if (lower.includes(key)) {
      return analysis;
    }
  }

  // Generic response
  return {
    exerciseName,
    overallScore: 0,
    tips: [
      { area: 'General', issue: 'Range of motion', fix: 'Use full range of motion on every rep. Partial reps = partial results.', priority: 'high' },
      { area: 'Tempo', issue: 'Moving too fast', fix: 'Control the movement: 2 seconds up, 2 seconds down', priority: 'medium' },
      { area: 'Breathing', issue: 'Inconsistent breathing', fix: 'Exhale on effort (push/pull), inhale on return', priority: 'medium' },
    ],
    encouragement: 'Good form first, then add reps and intensity. That is how operators are built.',
  };
}

// ─── OpenAI Implementation (upgrade here) ───────────────────────
//
// Install: npm install openai
// Then uncomment the implementation blocks below
//

async function sendOpenAIChat(
  message: string,
  history: ChatMessage[],
  progress: UserProgress,
): Promise<string> {
  // ── GPT-4o-mini — fast text model for coaching chat ──
  //
  // import OpenAI from 'openai';
  // const client = new OpenAI({ apiKey: OPENAI_API_KEY });
  // const messages = [
  //   { role: 'system' as const, content: SYSTEM_PROMPT },
  //   { role: 'system' as const, content: `User stats: Level ${progress.current_level}, ${progress.current_rank}, ${progress.streak_days}-day streak, STR ${progress.strength_score}/100, END ${progress.endurance_score}/100, ${progress.workouts_completed} workouts` },
  //   ...history.slice(-10).map(m => ({ role: m.role as 'user' | 'assistant', content: m.content })),
  //   { role: 'user' as const, content: message },
  // ];
  // const response = await client.chat.completions.create({
  //   model: TEXT_MODEL,  // gpt-4o-mini
  //   messages,
  //   max_tokens: 300,
  //   temperature: 0.7,
  // });
  // return response.choices[0].message.content || 'No response';
  void SYSTEM_PROMPT;
  void TEXT_MODEL;
  return localChatResponse(message, progress);
}

async function generateOpenAIPlan(
  goal: string,
  progress: UserProgress,
  daysPerWeek: number,
): Promise<GeneratedPlan> {
  // ── GPT-4o-mini — structured JSON plan generation ──
  //
  // import OpenAI from 'openai';
  // const client = new OpenAI({ apiKey: OPENAI_API_KEY });
  // const response = await client.chat.completions.create({
  //   model: TEXT_MODEL,  // gpt-4o-mini
  //   response_format: { type: 'json_object' },
  //   messages: [
  //     { role: 'system', content: 'Generate a workout plan as JSON matching: { name, description, weeklySchedule: [{ day, title, focus, exercises: [{ name, sets, reps?, duration?, rest, notes? }], estimatedMinutes }], estimatedDuration, difficulty }' },
  //     { role: 'user', content: `Goal: ${goal}\nDays per week: ${daysPerWeek}\nUser level: ${progress.current_level}, rank: ${progress.current_rank}` },
  //   ],
  //   max_tokens: 2000,
  //   temperature: 0.6,
  // });
  // return JSON.parse(response.choices[0].message.content || '{}');
  void TEXT_MODEL;
  return localGeneratePlan(goal, progress, daysPerWeek);
}

async function analyzeFormOpenAI(
  exerciseName: string,
  imageBase64: string,
): Promise<FormAnalysis> {
  // ── GPT-4o — vision model for photo-based form analysis ──
  //
  // import OpenAI from 'openai';
  // const client = new OpenAI({ apiKey: OPENAI_API_KEY });
  // const response = await client.chat.completions.create({
  //   model: VISION_MODEL,  // gpt-4o (vision capable)
  //   response_format: { type: 'json_object' },
  //   messages: [
  //     { role: 'system', content: VISION_SYSTEM_PROMPT },
  //     { role: 'user', content: [
  //       { type: 'text', text: `Analyze form for: ${exerciseName}` },
  //       { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${imageBase64}` } },
  //     ]},
  //   ],
  //   max_tokens: 1000,
  // });
  // const parsed = JSON.parse(response.choices[0].message.content || '{}');
  // return { exerciseName, ...parsed };
  void VISION_MODEL;
  void VISION_SYSTEM_PROMPT;
  void imageBase64;
  return localFormAnalysis(exerciseName);
}

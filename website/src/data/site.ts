export const site = {
  name: 'Gruntz',
  domain: 'gruntzfit.com',
  url: 'https://gruntzfit.com',
  title: 'Gruntz — Military Fitness & PT Test Training App',
  description:
    'Train like a soldier. Gruntz gives you a daily military fitness program, PT test readiness tracking for the Army AFT, Marine PFT, Navy PRT and Air Force PT, a fast workout log and 412 exercise videos.',
  tagline: 'Military fitness, one mission a day.',
  price: '$4.99/month',
  trialDays: 15,
  supportEmail: 'johnnyhashim@gmail.com',
  updated: 'April 17, 2026',
  appStoreUrl: 'https://apps.apple.com/us/app/gruntz/id6761699137',
  appIds: {
    ios: 'com.gruntz.fitness',
    android: 'com.gruntz.fitness',
  },
} as const;

export const navLinks = [
  { label: 'Home', href: '/' },
  { label: 'Features', href: '/#features' },
  { label: 'FAQ', href: '/#faq' },
  { label: 'Support', href: '/support' },
] as const;

/** Real product numbers only — no download or rating claims. */
export const heroStats = [
  { value: '412', label: 'Exercise videos' },
  { value: '8', label: 'Fitness tests' },
  { value: '7', label: 'Ranks to earn' },
  { value: `${site.trialDays}`, label: 'Days free' },
] as const;

export const steps = [
  {
    step: '01',
    title: 'Know exactly where you stand',
    copy:
      'Log your event scores for the Army Fitness Test, Marine PFT and CFT, Navy PRT, Air Force PT and more. Gruntz turns them into one readiness score and shows the event holding you back.',
    photo: '/photos/p08.jpg',
    alt: 'Recruits doing push-ups in formation',
  },
  {
    step: '02',
    title: 'Follow a mission, not a mood',
    copy:
      'Structured 8-week programs put today’s workout in front of you the moment you open the app. Show up, do the work, keep the streak alive.',
    photo: '/photos/p39.jpg',
    alt: 'Soldier walking a coastal trail with a ruck',
  },
  {
    step: '03',
    title: 'Train every rep the right way',
    copy:
      'A custom video for all 412 movements, with the muscles worked, step-by-step form and the mistakes to avoid. Fewer injuries, more progress.',
    photo: '/photos/p84.jpg',
    alt: 'Athlete doing pull-ups in a dark gym',
  },
] as const;

export const audiences = [
  {
    chip: 'Recruits & candidates',
    title: 'Ship ready',
    copy: 'Build the base for basic training, OCS or selection and walk in already passing your test.',
    photo: '/photos/p60.jpg',
    alt: 'Group holding a plank together outdoors',
  },
  {
    chip: 'Service members',
    title: 'Stay test ready',
    copy: 'Keep your score up year round with a plan that targets your weakest event.',
    photo: '/photos/p71.jpg',
    alt: 'Athlete doing a bear crawl on grass',
  },
  {
    chip: 'Tactical athletes',
    title: 'Built for hard days',
    copy: 'Police, fire and anyone who trains for a job where fitness is not optional.',
    photo: '/photos/p64.jpg',
    alt: 'Coach leading a group through push-ups',
  },
] as const;

export const features = [
  {
    icon: 'target',
    name: 'Daily program',
    short: 'Today’s mission is ready when you are',
    headline: 'A structured program that tells you exactly what to do today.',
    copy: 'Pick a program and Gruntz lines up every session for the next 8 weeks. Open the app, start the mission, done.',
    screen: '/app/train.jpg',
  },
  {
    icon: 'gauge',
    name: 'Test readiness',
    short: 'Your score for every service test',
    headline: 'See how ready you are for test day — as a single number.',
    copy: 'Track each event against the standard, count down to your test date and train the event that moves your score most.',
    screen: '/app/test.jpg',
  },
  {
    icon: 'list',
    name: 'Workout log',
    short: 'Log sets in a tap, rest timer built in',
    headline: 'The fastest way to log weight, reps and time.',
    copy: 'Check off each set, let the rest timer run, and add or swap exercises without leaving the workout.',
    screen: '/app/log.jpg',
  },
  {
    icon: 'play',
    name: 'Exercise videos',
    short: '412 movements with form and muscles',
    headline: 'A custom video for every movement you will ever do.',
    copy: 'Search by name, muscle or equipment. Every exercise shows the muscles worked, the steps and the common mistakes.',
    screen: '/app/detail.jpg',
  },
  {
    icon: 'calendar',
    name: 'Workout planner',
    short: 'Build and schedule your own workouts',
    headline: 'Plan your own workouts and put them on your training days.',
    copy: 'Pick exercises from the full library, set sets, reps and rest, and see the muscle split before you start.',
    screen: '/app/routine.jpg',
  },
  {
    icon: 'badge',
    name: 'Ranks & streaks',
    short: 'Climb from Recruit to Apex',
    headline: 'Earn your rank. Every session counts toward the next one.',
    copy: 'XP, levels, achievements and a muscle map of everything you have trained keep you coming back tomorrow.',
    screen: '/app/ranks.jpg',
  },
] as const;

export const privacyHighlights = [
  'The app is local-first: your training data stays on your device.',
  'No third-party advertising SDKs are used.',
  'Billing and entitlement checks run through RevenueCat and the app stores.',
  'Location and motion permissions are used only for fitness features that need them.',
] as const;

export const faqItems = [
  {
    question: 'Which fitness tests does Gruntz support?',
    answer:
      'The Army Fitness Test (AFT), Marine Corps PFT and CFT, Navy PRT, Air Force and Space Force assessments, Coast Guard PFT prep, and a general tactical readiness test. Always confirm the current standards with your service.',
  },
  {
    question: 'Do I need gym equipment?',
    answer:
      'No. The library covers bodyweight, dumbbell, kettlebell, barbell, band and machine movements, and you can build workouts around whatever you have.',
  },
  {
    question: 'How much does it cost?',
    answer: `New users get ${site.trialDays} days of full access. After that, Gruntz Pro is ${site.price}, billed through the App Store. Cancel anytime in your App Store settings.`,
  },
  {
    question: 'Does it work offline?',
    answer:
      'Yes. Workouts, exercise videos and your progress live on your device, so you can train in the field or a basement gym with no signal.',
  },
  {
    question: 'Is Gruntz affiliated with the military?',
    answer:
      'No. Gruntz is an independent training app and is not affiliated with or endorsed by the U.S. Department of Defense or any military branch.',
  },
] as const;

export const site = {
  name: 'Gruntz',
  domain: 'gruntzfit.com',
  url: 'https://gruntzfit.com',
  title: 'Gruntz | Daily Tactical Fitness Missions',
  description:
    'Gruntz turns selection prep, readiness blocks, and hard-event training into one clear daily mission with streaks, XP, training cards, and simple membership pricing.',
  tagline: 'Daily tactical prep missions that keep the streak alive.',
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
  { label: 'Mission Flow', href: '/#mission-flow' },
  { label: 'Screens', href: '/#screens' },
  { label: 'Pricing', href: '/#pricing' },
  { label: 'Privacy', href: '/privacy-policy' },
] as const;

export const statChips = [
  `${site.trialDays}-day full access`,
  site.price,
  'Local-first core loop',
  'Built for iPhone and Android',
] as const;

export const audienceCards = [
  {
    label: 'Selection Prep',
    title: 'Structure for people chasing hard standards.',
    copy:
      'Use Gruntz to stay inside a daily rhythm when you are preparing for selection, military readiness, or tactical schools.',
  },
  {
    label: 'Readiness',
    title: 'One mission per day beats vague motivation.',
    copy:
      'The app keeps the work tight: today’s mission, your streak, your XP, and the next block of progress.',
  },
  {
    label: 'Hybrid Events',
    title: 'Useful for OCR, rucks, and hard-event training.',
    copy:
      'Programs, movement cards, and run tracking stay focused on adherence instead of bloated wellness dashboards.',
  },
] as const;

export const missionSteps = [
  {
    step: '01',
    title: 'Pick the program',
    copy: 'Start with Raider or Recon and lock in the training lane that fits the mission.',
  },
  {
    step: '02',
    title: 'Load today’s work',
    copy: 'Open the command center, pull today’s mission, and move straight into the session.',
  },
  {
    step: '03',
    title: 'Log the result',
    copy: 'Complete the work, record the effort, and keep the streak moving forward.',
  },
  {
    step: '04',
    title: 'Track the intel',
    copy: 'XP, rank, history, and movement cards make it easy to see what is improving and what is lagging.',
  },
] as const;

export const screenshotSlides = [
  {
    src: '/screenshots/01-home.png',
    label: 'Command Center',
    title: 'Home stays focused on today.',
    copy: 'Mission status, level progress, and target areas stay visible without burying the user in extra UI.',
  },
  {
    src: '/screenshots/02-missions.png',
    label: 'Reference Cards',
    title: 'Training content is one tap away.',
    copy: 'Workout cards, movement breakdowns, and mission support content live in a dedicated reference area.',
  },
  {
    src: '/screenshots/03-progress.png',
    label: 'Progress Intel',
    title: 'XP, streaks, reps, and focus areas.',
    copy: 'Progress is tied to completed work, not vague wellness trends.',
  },
  {
    src: '/screenshots/04-profile.png',
    label: 'Operator Profile',
    title: 'Membership, settings, and identity in one place.',
    copy: 'Profile surfaces program switching, reminders, support actions, and account-level status clearly.',
  },
  {
    src: '/screenshots/05-daily-mission.png',
    label: 'Daily Mission',
    title: 'The workout flow is direct and task-driven.',
    copy: 'Users can move through exercises, progression, and completion without leaving the mission context.',
  },
] as const;

export const featureCards = [
  {
    eyebrow: 'Today',
    title: 'Daily missions built around adherence.',
    copy:
      'Gruntz is intentionally narrow. The product is meant to get someone into today’s work quickly and back tomorrow.',
    tone: 'lime',
    size: 'wide',
  },
  {
    eyebrow: 'Progress',
    title: 'XP, rank, streaks, and mission history.',
    copy:
      'The progress model rewards consistency and makes it obvious when volume, streak, or total reps are slipping.',
    tone: 'cyan',
    size: 'normal',
  },
  {
    eyebrow: 'Programs',
    title: 'Raider and Recon training paths.',
    copy:
      'Program selection and progression are part of the core loop instead of being buried in settings or static PDFs.',
    tone: 'orange',
    size: 'normal',
  },
  {
    eyebrow: 'Tracking',
    title: 'Run and ruck support when it matters.',
    copy:
      'Distance, pace, steps, and elevation are available for run-tracker sessions without turning the app into a generic activity feed.',
    tone: 'lime',
    size: 'normal',
  },
  {
    eyebrow: 'Content',
    title: 'Workout cards and movement references.',
    copy:
      'Movement support is built in so users can review the day’s work, reference cards, and unlock progression without leaving the app.',
    tone: 'cyan',
    size: 'wide',
  },
  {
    eyebrow: 'Pricing',
    title: 'Straight pricing with one simple monthly plan.',
    copy:
      'New users get a 15-day full-access window. After that, premium access continues through Gruntz Pro at $4.99 per month.',
    tone: 'orange',
    size: 'normal',
  },
] as const;

export const privacyHighlights = [
  'The current app is primarily local-first for core training data.',
  'No third-party advertising SDKs are used in the current build.',
  'Billing and entitlement checks run through RevenueCat and the app stores.',
  'Location and motion permissions are used only for fitness features that need them.',
] as const;

export const faqItems = [
  {
    question: 'Does Gruntz require an account to use the core training loop?',
    answer:
      'The current build is designed as a local-first app. Core progress, settings, and mission state are stored on the device instead of requiring a mandatory social or cloud account for basic use.',
  },
  {
    question: 'What data leaves the device?',
    answer:
      'The main external service in the current app flow is RevenueCat for subscriptions and entitlements. Apple App Store or Google Play also handle transaction processing for in-app purchases.',
  },
  {
    question: 'Why does the app ask for location or motion access?',
    answer:
      'Location is used when someone chooses to track a run or ruck. Motion-related sensors such as pedometer and barometer support workout and run-tracker metrics where available.',
  },
  {
    question: 'Which links should I use for App Store review fields?',
    answer:
      'Use the homepage for marketing, /privacy-policy for the privacy policy, and /support for the support URL. Terms live at /terms-of-use for subscription and legal reference.',
  },
] as const;

import { site } from '../data/site';

export const languages = { en: 'EN', es: 'ES' } as const;
export type Lang = keyof typeof languages;
export const defaultLang: Lang = 'en';

/** English lives at the root, other languages under their prefix: ('es', '/#faq') -> '/es/#faq'. */
export function localePath(lang: Lang, path = '/') {
  if (lang === defaultLang) return path;
  return `/${lang}${path}`;
}

const screens = {
  train: '/app/train.jpg',
  test: '/app/test.jpg',
  log: '/app/log.jpg',
  detail: '/app/detail.jpg',
  routine: '/app/routine.jpg',
  ranks: '/app/ranks.jpg',
};

const en = {
  meta: {
    title: 'Gruntz — Military Fitness & PT Test Training App',
    description:
      'Train like a soldier. Gruntz gives you a daily military fitness program, PT test readiness tracking for the Army AFT, Marine PFT, Navy PRT and Air Force PT, a fast workout log and 412 exercise videos.',
    ogLocale: 'en_US',
  },
  nav: { home: 'Home', features: 'Features', faq: 'FAQ', support: 'Support', download: 'Download', language: 'Language' },
  hero: {
    eyebrow: 'Military fitness app',
    title: 'Train like a soldier. Pass your PT test.',
    lede: 'A daily program, a readiness score for your service’s fitness test, and a workout log built for hard days — all in one app.',
    priceNote: `${site.trialDays} days free, then ${site.price}`,
    chipRank: { title: 'Operator', sub: 'Level 18 · 12-day streak' },
    chipTest: { title: 'Army Fitness Test', sub: '78% ready · 24 days out' },
    badgeAlt: 'Download on the App Store',
    builtBy: 'Built by a former U.S. Marine',
  },
  stats: [
    { value: '412', label: 'Exercise videos' },
    { value: '8', label: 'Fitness tests' },
    { value: '7', label: 'Ranks to earn' },
    { value: `${site.trialDays}`, label: 'Days free' },
  ],
  stepsHead: {
    title: 'Mission ready',
    accent: 'in 3 steps',
    sub: 'The three things that get people through test day: knowing the gap, showing up, and training right.',
    label: 'Step',
    cta: `Start your ${site.trialDays} days free`,
    ctaNote: 'No commitment. Cancel anytime in your App Store settings.',
  },
  steps: [
    {
      title: 'Know exactly where you stand',
      copy: 'Log your event scores for the Army Fitness Test, Marine PFT and CFT, Navy PRT, Air Force PT and more. Gruntz turns them into one readiness score and shows the event holding you back.',
      photo: '/photos/p08.jpg',
      alt: 'Recruits doing push-ups in formation',
    },
    {
      title: 'Follow a mission, not a mood',
      copy: 'Structured 8-week programs put today’s workout in front of you the moment you open the app. Show up, do the work, keep the streak alive.',
      photo: '/photos/p39.jpg',
      alt: 'Soldier walking a trail with a ruck',
    },
    {
      title: 'Train every rep the right way',
      copy: 'A custom video for all 412 movements, with the muscles worked, step-by-step form and the mistakes to avoid. Fewer injuries, more progress.',
      photo: '/photos/p84.jpg',
      alt: 'Athlete doing pull-ups in a dark gym',
    },
  ],
  audienceHead: {
    title: 'Built for people',
    accent: 'who can’t fail the test',
    sub: 'Whether you ship next month or test every six months, Gruntz keeps you on standard.',
  },
  audiences: [
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
  ],
  founder: {
    eyebrow: 'Built by a Marine',
    title: 'Made by someone who’s been there.',
    copy: 'Gruntz was built by a former U.S. Marine who knows what it takes to be ready on test day — and what it feels like when you are not. Every feature earned its place on real training days: no fluff, just the work that moves your score.',
    note: 'Gruntz is independent and is not affiliated with or endorsed by the U.S. military.',
  },
  featuresHead: {
    title: 'Everything you need',
    accent: 'in one app',
    sub: 'From today’s workout to test day, without five different apps.',
    listTitle: 'Main features',
    listSub: 'Tap a feature to see it in the app',
    counter: 'Feature',
    screenAlt: 'screen in the Gruntz app',
    tablistLabel: 'Gruntz features',
  },
  features: [
    {
      icon: 'target',
      name: 'Daily program',
      short: 'Today’s mission is ready when you are',
      headline: 'A structured program that tells you exactly what to do today.',
      copy: 'Pick a program and Gruntz lines up every session for the next 8 weeks. Open the app, start the mission, done.',
      screen: screens.train,
    },
    {
      icon: 'gauge',
      name: 'Test readiness',
      short: 'Your score for every service test',
      headline: 'See how ready you are for test day — as a single number.',
      copy: 'Track each event against the standard, count down to your test date and train the event that moves your score most.',
      screen: screens.test,
    },
    {
      icon: 'list',
      name: 'Workout log',
      short: 'Log sets in a tap, rest timer built in',
      headline: 'The fastest way to log weight, reps and time.',
      copy: 'Check off each set, let the rest timer run, and add or swap exercises without leaving the workout.',
      screen: screens.log,
    },
    {
      icon: 'play',
      name: 'Exercise videos',
      short: '412 movements with form and muscles',
      headline: 'A custom video for every movement you will ever do.',
      copy: 'Search by name, muscle or equipment. Every exercise shows the muscles worked, the steps and the common mistakes.',
      screen: screens.detail,
    },
    {
      icon: 'calendar',
      name: 'Workout planner',
      short: 'Build and schedule your own workouts',
      headline: 'Plan your own workouts and put them on your training days.',
      copy: 'Pick exercises from the full library, set sets, reps and rest, and see the muscle split before you start.',
      screen: screens.routine,
    },
    {
      icon: 'badge',
      name: 'Ranks & streaks',
      short: 'Climb from Recruit to Apex',
      headline: 'Earn your rank. Every session counts toward the next one.',
      copy: 'XP, levels, achievements and a muscle map of everything you have trained keep you coming back tomorrow.',
      screen: screens.ranks,
    },
  ],
  faqHead: { title: 'Questions,', accent: 'answered' },
  faq: [
    {
      q: 'Which fitness tests does Gruntz support?',
      a: 'The Army Fitness Test (AFT), Marine Corps PFT and CFT, Navy PRT, Air Force and Space Force assessments, Coast Guard PFT prep, and a general tactical readiness test. Always confirm the current standards with your service.',
    },
    {
      q: 'Do I need gym equipment?',
      a: 'No. The library covers bodyweight, dumbbell, kettlebell, barbell, band and machine movements, and you can build workouts around whatever you have.',
    },
    {
      q: 'How much does it cost?',
      a: `New users get ${site.trialDays} days of full access. After that, Gruntz Pro is ${site.price}, billed through the App Store. Cancel anytime in your App Store settings.`,
    },
    {
      q: 'Does it work offline?',
      a: 'Yes. Workouts, exercise videos and your progress live on your device, so you can train in the field or a basement gym with no signal.',
    },
    {
      q: 'Is the app available in Spanish?',
      a: 'The app itself is in English today. This website is available in English and Spanish.',
    },
    {
      q: 'Is Gruntz affiliated with the military?',
      a: 'No. Gruntz is an independent training app and is not affiliated with or endorsed by the U.S. Department of Defense or any military branch. It was built by a former U.S. Marine.',
    },
  ],
  cta: {
    pill: 'Report for duty',
    title: 'Your mission starts today',
    sub: 'Download Gruntz, pick your test and get today’s workout in under a minute.',
    checks: [`${site.trialDays} days free`, 'Cancel anytime', 'Works offline'],
    fine: `Gruntz Pro is ${site.price} after the free period, billed through the App Store.`,
  },
  footer: {
    tagline: 'Military fitness, one mission a day.',
    disclaimer: 'Built by a former U.S. Marine. Not affiliated with or endorsed by the U.S. Department of Defense or any military branch.',
    appStore: 'App Store',
    support: 'Support',
    privacy: 'Privacy Policy',
    terms: 'Terms of Use',
    contact: 'Contact',
    photos: 'Photos: Unsplash',
  },
};

export type Content = typeof en;

const es: Content = {
  meta: {
    title: 'Gruntz — App de entrenamiento militar y pruebas físicas',
    description:
      'Entrena como un soldado. Gruntz te da un programa diario de acondicionamiento militar, seguimiento de tu preparación para el AFT del Ejército, el PFT de los Marines, el PRT de la Marina y la prueba de la Fuerza Aérea, un registro de entrenamientos rápido y 412 videos de ejercicios.',
    ogLocale: 'es_US',
  },
  nav: { home: 'Inicio', features: 'Funciones', faq: 'Preguntas', support: 'Soporte', download: 'Descargar', language: 'Idioma' },
  hero: {
    eyebrow: 'App de entrenamiento militar',
    title: 'Entrena como un soldado. Aprueba tu prueba física.',
    lede: 'Un programa diario, una puntuación de preparación para la prueba física de tu rama y un registro de entrenamientos hecho para los días duros, todo en una sola app.',
    priceNote: `${site.trialDays} días gratis, luego ${site.price.replace('/month', '/mes')}`,
    chipRank: { title: 'Operator', sub: 'Nivel 18 · racha de 12 días' },
    chipTest: { title: 'Prueba física del Ejército', sub: '78 % listo · faltan 24 días' },
    badgeAlt: 'Descárgalo en el App Store',
    builtBy: 'Creada por un exmarine de EE. UU.',
  },
  stats: [
    { value: '412', label: 'Videos de ejercicios' },
    { value: '8', label: 'Pruebas físicas' },
    { value: '7', label: 'Rangos por ganar' },
    { value: `${site.trialDays}`, label: 'Días gratis' },
  ],
  stepsHead: {
    title: 'Listo para la misión',
    accent: 'en 3 pasos',
    sub: 'Las tres cosas que te llevan a aprobar: saber qué te falta, presentarte cada día y entrenar bien.',
    label: 'Paso',
    cta: `Empieza tus ${site.trialDays} días gratis`,
    ctaNote: 'Sin compromiso. Cancela cuando quieras desde los ajustes del App Store.',
  },
  steps: [
    {
      title: 'Sabe exactamente dónde estás',
      copy: 'Registra tus marcas en la prueba física del Ejército (AFT), el PFT y CFT de los Marines, el PRT de la Marina, la prueba de la Fuerza Aérea y más. Gruntz las convierte en una sola puntuación de preparación y te muestra qué evento te está frenando.',
      photo: '/photos/p08.jpg',
      alt: 'Reclutas haciendo flexiones en formación',
    },
    {
      title: 'Sigue una misión, no tu estado de ánimo',
      copy: 'Programas estructurados de 8 semanas ponen el entrenamiento de hoy frente a ti en cuanto abres la app. Preséntate, haz el trabajo y mantén viva la racha.',
      photo: '/photos/p39.jpg',
      alt: 'Soldado caminando por un sendero con su mochila',
    },
    {
      title: 'Haz cada repetición correctamente',
      copy: 'Un video propio para los 412 ejercicios, con los músculos que trabajas, la técnica paso a paso y los errores que debes evitar. Menos lesiones, más progreso.',
      photo: '/photos/p84.jpg',
      alt: 'Atleta haciendo dominadas en un gimnasio oscuro',
    },
  ],
  audienceHead: {
    title: 'Hecho para quienes',
    accent: 'no pueden reprobar',
    sub: 'Ya sea que te vayas el próximo mes o tengas prueba cada seis meses, Gruntz te mantiene en el estándar.',
  },
  audiences: [
    {
      chip: 'Reclutas y aspirantes',
      title: 'Listo para partir',
      copy: 'Construye la base para el entrenamiento básico, la escuela de oficiales o una selección y llega aprobando tu prueba.',
      photo: '/photos/p60.jpg',
      alt: 'Grupo haciendo una plancha al aire libre',
    },
    {
      chip: 'Militares en servicio',
      title: 'Siempre listo para la prueba',
      copy: 'Mantén tu puntuación todo el año con un plan que ataca tu evento más débil.',
      photo: '/photos/p71.jpg',
      alt: 'Atleta gateando como oso sobre el césped',
    },
    {
      chip: 'Atletas tácticos',
      title: 'Hecho para los días duros',
      copy: 'Policías, bomberos y cualquiera que entrene para un trabajo donde la condición física no es opcional.',
      photo: '/photos/p64.jpg',
      alt: 'Entrenador guiando a un grupo en flexiones',
    },
  ],
  founder: {
    eyebrow: 'Creada por un Marine',
    title: 'Hecha por alguien que ya pasó por eso.',
    copy: 'Gruntz fue creada por un exmarine de EE. UU. que sabe lo que se necesita para estar listo el día de la prueba, y lo que se siente cuando no lo estás. Cada función se ganó su lugar en días de entrenamiento reales: sin relleno, solo el trabajo que sube tu puntuación.',
    note: 'Gruntz es independiente y no está afiliada ni respaldada por las fuerzas armadas de EE. UU.',
  },
  featuresHead: {
    title: 'Todo lo que necesitas',
    accent: 'en una sola app',
    sub: 'Del entrenamiento de hoy al día de la prueba, sin cinco apps distintas.',
    listTitle: 'Funciones principales',
    listSub: 'Toca una función para verla en la app',
    counter: 'Función',
    screenAlt: 'pantalla en la app Gruntz',
    tablistLabel: 'Funciones de Gruntz',
  },
  features: [
    {
      icon: 'target',
      name: 'Programa diario',
      short: 'La misión de hoy te espera',
      headline: 'Un programa estructurado que te dice exactamente qué hacer hoy.',
      copy: 'Elige un programa y Gruntz organiza cada sesión de las próximas 8 semanas. Abre la app, empieza la misión y listo.',
      screen: screens.train,
    },
    {
      icon: 'gauge',
      name: 'Preparación para la prueba',
      short: 'Tu puntuación para cada rama',
      headline: 'Mira qué tan listo estás para el día de la prueba, en un solo número.',
      copy: 'Compara cada evento con el estándar, lleva la cuenta regresiva a tu fecha y entrena el evento que más sube tu puntuación.',
      screen: screens.test,
    },
    {
      icon: 'list',
      name: 'Registro de entrenamientos',
      short: 'Registra series en un toque, con temporizador',
      headline: 'La forma más rápida de registrar peso, repeticiones y tiempo.',
      copy: 'Marca cada serie, deja correr el temporizador de descanso y agrega o cambia ejercicios sin salir del entrenamiento.',
      screen: screens.log,
    },
    {
      icon: 'play',
      name: 'Videos de ejercicios',
      short: '412 ejercicios con técnica y músculos',
      headline: 'Un video propio para cada ejercicio que vas a hacer.',
      copy: 'Busca por nombre, músculo o equipo. Cada ejercicio muestra los músculos que trabaja, los pasos y los errores comunes.',
      screen: screens.detail,
    },
    {
      icon: 'calendar',
      name: 'Planificador',
      short: 'Crea y programa tus propios entrenamientos',
      headline: 'Planifica tus entrenamientos y colócalos en tus días de entrenamiento.',
      copy: 'Elige ejercicios de toda la biblioteca, define series, repeticiones y descanso, y mira el reparto muscular antes de empezar.',
      screen: screens.routine,
    },
    {
      icon: 'badge',
      name: 'Rangos y rachas',
      short: 'Sube de Recruit a Apex',
      headline: 'Gánate tu rango. Cada sesión cuenta para el siguiente.',
      copy: 'XP, niveles, logros y un mapa muscular de todo lo que has entrenado te hacen volver mañana.',
      screen: screens.ranks,
    },
  ],
  faqHead: { title: 'Preguntas', accent: 'frecuentes' },
  faq: [
    {
      q: '¿Qué pruebas físicas incluye Gruntz?',
      a: 'La prueba física del Ejército (AFT), el PFT y CFT de los Marines, el PRT de la Marina, las evaluaciones de la Fuerza Aérea y la Fuerza Espacial, la preparación para el PFT de la Guardia Costera y una prueba general de preparación táctica. Confirma siempre los estándares vigentes con tu rama.',
    },
    {
      q: '¿Necesito equipo de gimnasio?',
      a: 'No. La biblioteca incluye ejercicios con peso corporal, mancuernas, pesas rusas, barra, bandas y máquinas, y puedes armar tus entrenamientos con lo que tengas.',
    },
    {
      q: '¿Cuánto cuesta?',
      a: `Los usuarios nuevos tienen ${site.trialDays} días de acceso completo. Después, Gruntz Pro cuesta ${site.price.replace('/month', '/mes')}, cobrado a través del App Store. Cancela cuando quieras desde los ajustes del App Store.`,
    },
    {
      q: '¿Funciona sin conexión?',
      a: 'Sí. Los entrenamientos, los videos y tu progreso están en tu dispositivo, así que puedes entrenar en el campo o en un gimnasio sin señal.',
    },
    {
      q: '¿La app está en español?',
      a: 'Por ahora la app está en inglés. Este sitio web está disponible en inglés y en español.',
    },
    {
      q: '¿Gruntz está afiliada a las fuerzas armadas?',
      a: 'No. Gruntz es una app de entrenamiento independiente y no está afiliada ni respaldada por el Departamento de Defensa de EE. UU. ni por ninguna rama militar. Fue creada por un exmarine de EE. UU.',
    },
  ],
  cta: {
    pill: 'Preséntate al servicio',
    title: 'Tu misión empieza hoy',
    sub: 'Descarga Gruntz, elige tu prueba y ten el entrenamiento de hoy en menos de un minuto.',
    checks: [`${site.trialDays} días gratis`, 'Cancela cuando quieras', 'Funciona sin conexión'],
    fine: `Gruntz Pro cuesta ${site.price.replace('/month', '/mes')} después del periodo gratuito, cobrado a través del App Store.`,
  },
  footer: {
    tagline: 'Entrenamiento militar, una misión al día.',
    disclaimer: 'Creada por un exmarine de EE. UU. No afiliada ni respaldada por el Departamento de Defensa de EE. UU. ni por ninguna rama militar.',
    appStore: 'App Store',
    support: 'Soporte',
    privacy: 'Privacidad (inglés)',
    terms: 'Términos de uso (inglés)',
    contact: 'Contacto',
    photos: 'Fotos: Unsplash',
  },
};

export const content: Record<Lang, Content> = { en, es };

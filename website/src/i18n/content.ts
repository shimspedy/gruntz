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
  train: '/app/train-current.webp',
  test: '/app/test-current.webp',
  log: '/app/log.jpg',
  detail: '/app/detail.jpg',
  routine: '/app/routine.jpg',
  ranks: '/app/ranks-current.webp',
};

const en = {
  meta: {
    title: 'Gruntz — Military Fitness & PT Test Training App',
    description:
      'Military fitness for all six U.S. branches. Follow your daily plan, log sets, earn XP, and track fitness-test events with Gruntz.',
    ogLocale: 'en_US',
  },
  nav: { home: 'Home', features: 'Features', faq: 'FAQ', support: 'Support', download: 'Download', language: 'Language' },
  hero: {
    eyebrow: 'Military fitness app',
    title: 'Your workout. Already planned.',
    lede: 'Follow your daily plan, log every set, and earn XP as you train. Track fitness-test events for all six U.S. military branches.',
    priceNote: `${site.trialDays} days of full access included. Subscription required afterward.`,
    chipRank: { title: 'XP & streaks', sub: 'Progress you earn' },
    chipTest: { title: 'Six U.S. branches', sub: 'Log your test events' },
    badgeAlt: 'Download on the App Store',
    builtBy: 'Built by a former U.S. Marine',
  },
  stats: [
    { value: 'Hundreds', label: 'Exercise demos' },
    { value: '8', label: 'Tests & benchmarks' },
    { value: '7', label: 'Ranks to earn' },
    { value: `${site.trialDays}`, label: 'Days included' },
  ],
  stepsHead: {
    title: 'Make training',
    accent: 'a daily routine',
    sub: 'Choose your plan, complete the session, and keep a record of the work.',
    label: 'Step',
    cta: 'Download Gruntz',
    ctaNote: `${site.trialDays} days included. See the App Store for current subscription pricing.`,
  },
  steps: [
    {
      title: 'Choose your training plan',
      copy: 'Find a program for your goals, schedule, and equipment. Open Gruntz to see your next session.',
      photo: '/photos/p08.jpg',
      alt: 'Recruits doing push-ups in formation',
    },
    {
      title: 'Log the work as you go',
      copy: 'Record weight, reps, and time. Check off completed sets and use the rest timer between them.',
      photo: '/photos/p39.jpg',
      alt: 'Soldier walking a trail with a ruck',
    },
    {
      title: 'See what you have earned',
      copy: 'Completed sessions add to your XP and training history. Build your streak and work toward your next rank.',
      photo: '/photos/p84.jpg',
      alt: 'Athlete doing pull-ups in a dark gym',
    },
  ],
  audienceHead: {
    title: 'A plan for',
    accent: 'your next training day',
    sub: 'Build a foundation, prepare for service, or keep your training routine going.',
  },
  audiences: [
    {
      chip: 'Recruits & candidates',
      title: 'Build your base',
      copy: 'Prepare for basic training, OCS, or selection with structured sessions and a record of your progress.',
      photo: '/photos/p60.jpg',
      alt: 'Group holding a plank together outdoors',
    },
    {
      chip: 'Service members',
      title: 'Keep test prep in view',
      copy: 'Save event results, compare progress checks, and see your biggest logged gap to a target.',
      photo: '/photos/p71.jpg',
      alt: 'Athlete doing a bear crawl on grass',
    },
    {
      chip: 'Tactical athletes',
      title: 'Keep showing up',
      copy: 'Follow a plan or build your own workouts. Keep your training history together as your goals change.',
      photo: '/photos/p64.jpg',
      alt: 'Coach leading a group through push-ups',
    },
  ],
  founder: {
    eyebrow: 'Built by a former U.S. Marine',
    title: 'Made for the work you put in.',
    copy: 'Gruntz brings structured training, a workout log, and your progress into one place. Choose your next session, record the work, and see what changes over time.',
    note: 'Gruntz is independent and is not affiliated with or endorsed by the U.S. military.',
  },
  featuresHead: {
    title: 'Your plan, your log,',
    accent: 'your progress',
    sub: 'See the tools you will use before, during, and after a session.',
    listTitle: 'Main features',
    listSub: 'Tap a feature to see it in the app',
    counter: 'Feature',
    screenAlt: 'screen in the Gruntz app',
    tablistLabel: 'Gruntz features',
  },
  features: [
    {
      icon: 'target',
      name: 'Daily plan',
      short: 'Your next session, ready to follow',
      headline: 'Pick a plan. See today’s workout.',
      copy: 'Choose a program for your goals, schedule, and equipment. Gruntz puts the next session in front of you when you open the app.',
      screen: screens.train,
    },
    {
      icon: 'gauge',
      name: 'Test progress',
      short: 'Track your logged fitness-test events',
      headline: 'See where your test events stand.',
      copy: 'Save results, compare progress checks, and see your biggest logged gap to a target. The preparation benchmark is an estimate; verify official standards with your service.',
      screen: screens.test,
    },
    {
      icon: 'list',
      name: 'Workout log',
      short: 'Sets, reps, and rest in one place',
      headline: 'Log every set while you train.',
      copy: 'Record weight, reps, and time. Run the rest timer and add or swap exercises without leaving your session.',
      screen: screens.log,
    },
    {
      icon: 'play',
      name: 'Exercise videos',
      short: 'Hundreds of demos with form guidance',
      headline: 'See the movement before your next set.',
      copy: 'Browse exercise demos with muscles worked, form steps, and common mistakes. Search by name, muscle, or equipment.',
      screen: screens.detail,
    },
    {
      icon: 'calendar',
      name: 'Workout planner',
      short: 'Build and schedule your own workouts',
      headline: 'Build a workout around your training day.',
      copy: 'Choose exercises, set your reps and rest, and schedule the workout. See the muscle split before you start.',
      screen: screens.routine,
    },
    {
      icon: 'badge',
      name: 'Ranks & streaks',
      short: 'Climb from Recruit to Apex',
      headline: 'Turn completed sessions into XP and ranks.',
      copy: 'Build your streak, unlock achievements, and see your training on the muscle map. Your completed work stays in your history.',
      screen: screens.ranks,
    },
  ],
  faqHead: { title: 'Questions,', accent: 'answered' },
  faq: [
    {
      q: 'Which fitness tests does Gruntz support?',
      a: 'You can log events for the Army AFT, Marine Corps PFT and CFT, Navy PRT, Air Force and Space Force assessments, Coast Guard PFT prep, and a general tactical benchmark. The app’s preparation estimates are not official scores. Confirm current standards with your service.',
    },
    {
      q: 'Do I need gym equipment?',
      a: 'Equipment depends on the plan you choose. Gruntz includes bodyweight, minimal-equipment, and gym options. You can also build workouts from the exercise library.',
    },
    {
      q: 'How much does it cost?',
      a: `${site.trialDays} days of full app access are included for new users. Continued Pro access requires a subscription. See the App Store for current prices and billing terms before subscribing. Manage or cancel a subscription in your App Store settings.`,
    },
    {
      q: 'Does it work offline?',
      a: 'Core workouts, bundled exercise demos, and your training log use content stored on your device. Features such as team chat, cloud backup, and subscription purchases need an internet connection.',
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
    pill: 'Your next training day',
    title: 'Start with today’s workout.',
    sub: 'Download Gruntz, choose your plan, and keep a record of the work.',
    checks: [`${site.trialDays} days included`, 'App Store billing', 'Core training offline'],
    fine: 'Subscription required after the included period. See the App Store for current pricing and terms.',
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
      'Entrenamiento físico para las seis ramas militares de EE. UU. Sigue tu plan diario, registra series, gana XP y lleva el progreso de tus pruebas con Gruntz.',
    ogLocale: 'es_US',
  },
  nav: { home: 'Inicio', features: 'Funciones', faq: 'Preguntas', support: 'Soporte', download: 'Descargar', language: 'Idioma' },
  hero: {
    eyebrow: 'App de entrenamiento militar',
    title: 'Tu entrenamiento. Ya planificado.',
    lede: 'Sigue tu plan diario, registra cada serie y gana XP al entrenar. Lleva un registro de las pruebas físicas de las seis ramas militares de EE. UU.',
    priceNote: `${site.trialDays} días de acceso completo incluidos. Después se requiere una suscripción.`,
    chipRank: { title: 'XP y rachas', sub: 'El progreso que te ganas' },
    chipTest: { title: 'Seis ramas de EE. UU.', sub: 'Registra tus pruebas físicas' },
    badgeAlt: 'Descárgalo en el App Store',
    builtBy: 'Creada por un exmarine de EE. UU.',
  },
  stats: [
    { value: 'Cientos', label: 'Demostraciones de ejercicios' },
    { value: '8', label: 'Pruebas y referencias' },
    { value: '7', label: 'Rangos por ganar' },
    { value: `${site.trialDays}`, label: 'Días incluidos' },
  ],
  stepsHead: {
    title: 'Haz del entrenamiento',
    accent: 'una rutina diaria',
    sub: 'Elige tu plan, completa la sesión y guarda un registro de tu trabajo.',
    label: 'Paso',
    cta: 'Descarga Gruntz',
    ctaNote: `${site.trialDays} días incluidos. Consulta los precios actuales de suscripción en el App Store.`,
  },
  steps: [
    {
      title: 'Elige tu plan de entrenamiento',
      copy: 'Busca un programa que se ajuste a tus objetivos, horario y equipo. Abre Gruntz para ver tu próxima sesión.',
      photo: '/photos/p08.jpg',
      alt: 'Reclutas haciendo flexiones en formación',
    },
    {
      title: 'Registra el trabajo mientras entrenas',
      copy: 'Anota peso, repeticiones y tiempo. Marca las series completadas y usa el temporizador de descanso entre ellas.',
      photo: '/photos/p39.jpg',
      alt: 'Soldado caminando por un sendero con su mochila',
    },
    {
      title: 'Mira lo que te has ganado',
      copy: 'Las sesiones completadas suman XP y quedan en tu historial. Mantén tu racha y avanza hacia el siguiente rango.',
      photo: '/photos/p84.jpg',
      alt: 'Atleta haciendo dominadas en un gimnasio oscuro',
    },
  ],
  audienceHead: {
    title: 'Un plan para',
    accent: 'tu próximo día de entrenamiento',
    sub: 'Construye una base, prepárate para el servicio o mantén tu rutina de entrenamiento.',
  },
  audiences: [
    {
      chip: 'Reclutas y aspirantes',
      title: 'Construye tu base',
      copy: 'Prepárate para el entrenamiento básico, la escuela de oficiales o una selección con sesiones estructuradas y un registro de tu progreso.',
      photo: '/photos/p60.jpg',
      alt: 'Grupo haciendo una plancha al aire libre',
    },
    {
      chip: 'Militares en servicio',
      title: 'Ten presente tu preparación',
      copy: 'Guarda tus resultados, compara controles de progreso e identifica la mayor diferencia registrada respecto a tu objetivo.',
      photo: '/photos/p71.jpg',
      alt: 'Atleta gateando como oso sobre el césped',
    },
    {
      chip: 'Atletas tácticos',
      title: 'Mantén la constancia',
      copy: 'Sigue un plan o crea tus propias sesiones. Conserva tu historial de entrenamiento mientras cambian tus objetivos.',
      photo: '/photos/p64.jpg',
      alt: 'Entrenador guiando a un grupo en flexiones',
    },
  ],
  founder: {
    eyebrow: 'Creada por un exmarine de EE. UU.',
    title: 'Hecha para el trabajo que haces.',
    copy: 'Gruntz reúne entrenamiento estructurado, un registro de sesiones y tu progreso. Elige tu próxima sesión, anota el trabajo y observa los cambios con el tiempo.',
    note: 'Gruntz es independiente y no está afiliada ni respaldada por las fuerzas armadas de EE. UU.',
  },
  featuresHead: {
    title: 'Tu plan, tu registro,',
    accent: 'tu progreso',
    sub: 'Mira las herramientas que usarás antes, durante y después de cada sesión.',
    listTitle: 'Funciones principales',
    listSub: 'Toca una función para verla en la app',
    counter: 'Función',
    screenAlt: 'pantalla en la app Gruntz',
    tablistLabel: 'Funciones de Gruntz',
  },
  features: [
    {
      icon: 'target',
      name: 'Plan diario',
      short: 'Tu próxima sesión, lista para seguir',
      headline: 'Elige un plan. Mira qué toca hoy.',
      copy: 'Elige un programa para tus objetivos, horario y equipo. Gruntz te muestra la próxima sesión al abrir la app.',
      screen: screens.train,
    },
    {
      icon: 'gauge',
      name: 'Progreso en las pruebas',
      short: 'Lleva un registro de tus pruebas físicas',
      headline: 'Mira cómo van tus pruebas físicas.',
      copy: 'Guarda resultados, compara controles de progreso e identifica la mayor diferencia respecto a tu objetivo. La referencia de preparación es una estimación; verifica los estándares oficiales con tu rama.',
      screen: screens.test,
    },
    {
      icon: 'list',
      name: 'Registro de entrenamientos',
      short: 'Series, repeticiones y descanso juntos',
      headline: 'Registra cada serie mientras entrenas.',
      copy: 'Anota peso, repeticiones y tiempo. Usa el temporizador de descanso y agrega o cambia ejercicios sin salir de la sesión.',
      screen: screens.log,
    },
    {
      icon: 'play',
      name: 'Videos de ejercicios',
      short: 'Cientos de demostraciones con técnica',
      headline: 'Mira el movimiento antes de tu próxima serie.',
      copy: 'Explora demostraciones con los músculos trabajados, pasos de técnica y errores comunes. Busca por nombre, músculo o equipo.',
      screen: screens.detail,
    },
    {
      icon: 'calendar',
      name: 'Planificador',
      short: 'Crea y programa tus propios entrenamientos',
      headline: 'Crea una sesión para tu día de entrenamiento.',
      copy: 'Elige ejercicios, define repeticiones y descanso, y programa la sesión. Mira la distribución muscular antes de empezar.',
      screen: screens.routine,
    },
    {
      icon: 'badge',
      name: 'Rangos y rachas',
      short: 'Sube de Recruit a Apex',
      headline: 'Convierte las sesiones completadas en XP y rangos.',
      copy: 'Mantén tu racha, desbloquea logros y mira tu entrenamiento en el mapa muscular. El trabajo completado queda en tu historial.',
      screen: screens.ranks,
    },
  ],
  faqHead: { title: 'Preguntas', accent: 'frecuentes' },
  faq: [
    {
      q: '¿Qué pruebas físicas incluye Gruntz?',
      a: 'Puedes registrar eventos del AFT del Ejército, el PFT y CFT de los Marines, el PRT de la Marina, las evaluaciones de la Fuerza Aérea y la Fuerza Espacial, la preparación para el PFT de la Guardia Costera y una referencia táctica general. Las estimaciones de preparación de la app no son puntuaciones oficiales. Confirma los estándares vigentes con tu rama.',
    },
    {
      q: '¿Necesito equipo de gimnasio?',
      a: 'El equipo depende del plan que elijas. Gruntz incluye opciones con peso corporal, equipo mínimo y gimnasio. También puedes crear sesiones con la biblioteca de ejercicios.',
    },
    {
      q: '¿Cuánto cuesta?',
      a: `Los usuarios nuevos tienen ${site.trialDays} días de acceso completo incluidos. Para continuar con Pro se requiere una suscripción. Consulta los precios actuales y las condiciones de cobro en el App Store antes de suscribirte. Puedes gestionar o cancelar tu suscripción en los ajustes del App Store.`,
    },
    {
      q: '¿Funciona sin conexión?',
      a: 'Los entrenamientos principales, las demostraciones incluidas y tu registro usan contenido guardado en el dispositivo. Funciones como el chat de equipo, las copias de seguridad en la nube y las compras de suscripciones necesitan conexión a internet.',
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
    pill: 'Tu próximo día de entrenamiento',
    title: 'Empieza con el entrenamiento de hoy.',
    sub: 'Descarga Gruntz, elige tu plan y guarda un registro de tu trabajo.',
    checks: [`${site.trialDays} días incluidos`, 'Cobro por el App Store', 'Entrenamiento básico sin conexión'],
    fine: 'Se requiere una suscripción después del periodo incluido. Consulta los precios actuales y las condiciones en el App Store.',
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

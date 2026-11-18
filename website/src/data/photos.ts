import type { ImageMetadata } from 'astro';
import armyKettlebells from '../assets/photos/army-kettlebells.jpg';
import armyRuck from '../assets/photos/army-ruck.jpg';
import barbellBack from '../assets/photos/barbell-back.jpg';
import deadliftSetup from '../assets/photos/deadlift-setup.jpg';
import kettlebellPushUp from '../assets/photos/kettlebell-push-up.jpg';
import groupPlank from '../assets/photos/p60.jpg';
import rucksack from '../assets/photos/p39.jpg';
import pullUpsGym from '../assets/photos/p84.jpg';
import runnerGolden from '../assets/photos/runner-golden.jpg';
import sandPortrait from '../assets/photos/sand-portrait.jpg';
import sprinterNight from '../assets/photos/sprinter-night.jpg';
import uscgPushUps from '../assets/photos/uscg-dawn-push-ups.jpg';
import usmcRopeClimb from '../assets/photos/usmc-rope-climb.jpg';

/*
  Photo sources and the rule for choosing them:
  - U.S. Department of Defense photos are public domain. We use them only where nobody is
    recognizable (backs, silhouettes, small or blurred figures), and the footer carries the
    DoD non-endorsement line. Do not add DoD photos that show a recognizable face.
  - Close-up portraits come from Unsplash and Pexels under their commercial licenses.
*/
export interface Photo {
  src: ImageMetadata;
  alt: string;
  altEs: string;
  /** object-position focal point. */
  pos: string;
  /** Credit line shown under guide photos. */
  credit?: string;
}

const dod = {
  usmcRopeClimb: {
    src: usmcRopeClimb,
    alt: 'Marine recruits climbing ropes on an obstacle course',
    altEs: 'Reclutas de los Marines trepando cuerdas en una pista de obstáculos',
    pos: '60% 40%',
    credit: 'U.S. Marine Corps photo. Use does not imply endorsement.',
  },
  armyRuck: {
    src: armyRuck,
    alt: 'Soldier seen from behind on a ruck march along a wet road at dusk',
    altEs: 'Soldado visto de espaldas en una marcha con mochila por una carretera mojada al atardecer',
    pos: '42% 32%',
    credit: 'U.S. Army photo by Pierre-Etienne Courtejoie. Use does not imply endorsement.',
  },
  armyKettlebells: {
    src: armyKettlebells,
    alt: 'Kettlebells on a turf field at dawn with soldiers training out of focus behind them',
    altEs: 'Pesas rusas sobre el césped al amanecer con soldados entrenando desenfocados al fondo',
    pos: '50% 60%',
    credit: 'U.S. Army photo by Spc. Christopher Sanchez. Use does not imply endorsement.',
  },
  uscgPushUps: {
    src: uscgPushUps,
    alt: 'Coast Guard recruit company doing push-ups at dawn',
    altEs: 'Compañía de reclutas de la Guardia Costera haciendo flexiones al amanecer',
    pos: '70% 60%',
    credit: 'U.S. Coast Guard photo by Chief Warrant Officer Donnie Brzuska. Use does not imply endorsement.',
  },
} satisfies Record<string, Photo>;

export const photos = {
  hero: {
    src: barbellBack,
    alt: 'Woman seen from behind with a loaded barbell across her shoulders in a dark gym',
    altEs: 'Mujer vista de espaldas con una barra cargada sobre los hombros en un gimnasio oscuro',
    pos: '66% 40%',
  } as Photo,
  people: [
    dod.usmcRopeClimb,
    dod.armyRuck,
    {
      src: sandPortrait,
      alt: 'Man in a sand-covered black T-shirt catching his breath after beach training',
      altEs: 'Hombre con camiseta negra cubierta de arena recuperando el aliento tras entrenar en la playa',
      pos: '50% 30%',
    },
    {
      src: deadliftSetup,
      alt: 'Woman setting up for a deadlift',
      altEs: 'Mujer preparándose para un peso muerto',
      pos: '62% 45%',
    },
  ] as Photo[],
  founder: { src: rucksack, alt: 'Outdoor training with a rucksack', altEs: 'Entrenamiento al aire libre con una mochila', pos: '50% 28%' } as Photo,
  final: { ...dod.armyKettlebells, pos: '60% 55%' } as Photo,
};

/** Optional lead photo per guide slug. */
export const guidePhotos: Record<string, Photo | undefined> = {
  'army-aft': dod.armyKettlebells,
  'air-force-pfra': { src: sprinterNight, alt: 'Runner sprinting on a track at night', altEs: '', pos: '60% 40%', credit: 'Photo: Jadon Johnson on Unsplash' },
  'coast-guard-pft': dod.uscgPushUps,
  'boot-camp-workout-plan': dod.usmcRopeClimb,
  'ruck-march-training-plan': dod.armyRuck,
  'how-to-do-more-pull-ups': { src: pullUpsGym, alt: 'Athlete doing pull-ups in a dark gym, seen from behind', altEs: '', pos: '50% 30%', credit: 'Photo: Unsplash' },
  '2-mile-run-training-plan': { src: runnerGolden, alt: 'Runner mid-stride on a track at golden hour', altEs: '', pos: '50% 55%', credit: 'Photo: Jorge Alberto Vega Barrera on Unsplash' },
  'plank-training': { src: groupPlank, alt: 'Group holding a plank together outdoors', altEs: '', pos: '50% 50%', credit: 'Photo: Unsplash' },
  'hand-release-push-ups': { src: kettlebellPushUp, alt: 'Man doing a push-up on two kettlebells on a running track', altEs: '', pos: '55% 50%', credit: 'Photo: Alora Griffiths on Unsplash' },
};

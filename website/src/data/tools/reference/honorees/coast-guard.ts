import type { Honoree } from '../../types';

/**
 * The Coast Guard's one Medal of Honor recipient. Checked against his cmohs.org page
 * (citation, rank, action date, "Awarded Posthumously") on 2026-11-18.
 * Signalman First Class is today's Petty Officer First Class (E-6).
 */
export const honorees: Honoree[] = [
  {
    branch: 'coast-guard',
    abbr: 'PO1',
    name: 'Douglas A. Munro',
    rankAtAction: 'Signalman First Class',
    conflict: 'World War II',
    year: 1942,
    story:
      'Munro was the petty officer in charge of a group of Higgins boats sent to pull a trapped battalion of nearly 500 Marines off the beach at Point Cruz, Guadalcanal. Under machine-gun fire, he led the boats in and then placed his own craft between the beach and the enemy to shield the loaded boats. He was killed as the evacuation was nearly finished, and his crew kept on until the last boat cleared the beach.',
    posthumous: true,
    source: {
      label: 'Congressional Medal of Honor Society: Douglas A. Munro',
      url: 'https://www.cmohs.org/recipients/douglas-a-munro',
    },
  },
];

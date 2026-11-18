import type { Award, Provenance } from '../../types';

/**
 * U.S. Coast Guard awards in order of precedence as worn.
 *
 * Intentionally empty: the order of precedence lives in the Coast Guard Military Medals
 * and Awards Manual (COMDTINST M1650.25 series) and the Uniform Regulations (COMDTINST
 * M1020.6 series). Neither could be read on 2026-11-18 (media.defense.gov, uscg.mil and
 * mycg.uscg.mil returned 403), and the fact rules forbid filling the list from memory or
 * third-party sites. Fill it from the manual, then set `verified`.
 */
export const awards: Award[] = [];

export const provenance: Provenance = {
  verified: '',
  sources: [
    {
      label: 'ALCOAST 256/26 (Aug 2026): AFSM for Operation Southern Guard, which cites the Medals and Awards Manual as COMDTINST 1650.25E',
      url: 'https://content.govdelivery.com/accounts/USDHSCG/bulletins/425b571',
    },
  ],
  notes:
    'No awards are listed yet. The latest edition found is COMDTINST M1650.25E, which ALCOAST 256/26 still cites in August 2026 (edition date not confirmed from the document). No later edition was found. Ribbon stripes are left out until they can be taken from The Institute of Heraldry ribbon descriptions.',
  unverified: [
    'Whole list: copy the order of precedence (personal decorations, unit awards, campaign and service medals, Coast Guard service and training ribbons, marksmanship) from the Coast Guard Military Medals and Awards Manual, COMDTINST M1650.25E, and check it against the ribbon chart in the Uniform Regulations, COMDTINST M1020.6 (latest letter). Both are on media.defense.gov, which blocked our fetcher.',
    'Edition: confirm M1650.25E is still current and look for any ALCOAST since 2016 that added or moved an award (for example new service medals or ribbons).',
    'Stripes: only add them from The Institute of Heraldry (tioh.army.mil) ribbon descriptions, converted from 1/32 inch on a 44/32 ribbon to the 35-unit scale only where the conversion is exact.',
  ],
};

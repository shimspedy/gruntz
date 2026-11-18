import type { Award, Provenance } from '../../types';

/**
 * U.S. Air Force awards in order of precedence.
 *
 * PARTIAL: only the personal decorations an Airman can receive (Air Force and
 * Department of Defense decorations) are listed. Unit awards, service and campaign
 * medals, Air Force service and training ribbons, and marksmanship ribbons are left
 * out until the order can be read from DAFMAN 36-2806 itself; see provenance.unverified.
 * Ribbon stripes are omitted.
 */
const DECORATIONS: string[] = [
  'Medal of Honor',
  'Air Force Cross',
  'Defense Distinguished Service Medal',
  'Air Force Distinguished Service Medal',
  'Silver Star',
  'Defense Superior Service Medal',
  'Legion of Merit',
  'Distinguished Flying Cross',
  "Airman's Medal",
  'Bronze Star Medal',
  'Purple Heart',
  'Defense Meritorious Service Medal',
  'Meritorious Service Medal',
  'Air Medal',
  'Air Force Aerial Achievement Medal',
  'Joint Service Commendation Medal',
  'Air Force Commendation Medal',
  'Joint Service Achievement Medal',
  'Air Force Achievement Medal',
  'Air Force Combat Action Medal',
];

export const awards: Award[] = DECORATIONS.map(
  (name, i): Award => ({ branch: 'air-force', order: i + 1, name, type: 'decoration' }),
);

export const provenance: Provenance = {
  verified: '2026-11-18',
  sources: [
    {
      label: 'The Institute of Heraldry: Ribbons, Order of Precedence (individual awards)',
      url: 'https://tioh.army.mil/Catalog/PageFlow.aspx?CategoryId=5&grp=4&menu=Decorations%20and%20Medals',
    },
  ],
  notes:
    'Names and relative order come from The Institute of Heraldry precedence list, which covers every service; the Army, Navy, Marine Corps and Coast Guard ' +
    'decorations in it were removed, leaving those an Airman can receive. DAFMAN 36-2806 (27 Oct 2022, Change 3 of 13 Aug 2025) and the AFPC ' +
    'precedence chart could not be read: e-publishing.af.mil and afpc.af.mil returned 403 to automated requests. No ribbon stripes are included.',
  unverified: [
    'Check orders 1-20 against the order of precedence in DAFMAN 36-2806 (Change 3, 13 Aug 2025) or the AFPC "Decorations and Ribbons" chart (afpc.af.mil/Portals/70/documents/RECOGNITION/Decorations and Ribbons.pdf). The order here is from the cross-service TIOH list, not the Air Force chart.',
    'Confirm the Air Force names: TIOH says "Air Force Distinguished Service Medal" and "Air Force Aerial Achievement Medal"; the Air Force chart may use "Distinguished Service Medal" and "Aerial Achievement Medal".',
    'Missing: unit awards (e.g. Presidential Unit Citation, Gallant Unit Citation, Meritorious Unit Award, Air Force Outstanding Unit Award, Organizational Excellence Award), in Air Force order. Add from DAFMAN 36-2806.',
    'Missing: service and campaign medals, including the 2022-onward "Air and Space" renamed awards (e.g. Air and Space Campaign Medal, Air and Space Overseas Ribbon). Add names and order from DAFMAN 36-2806 / DAFI 36-2903.',
    'Missing: Air Force service and training ribbons and the Small Arms Expert Marksmanship Ribbon. Add from DAFMAN 36-2806.',
    'Missing: ribbon stripes. If wanted, take colors and widths from each award page on tioh.army.mil and convert 1/32-inch widths to the 17.5-unit half ribbon.',
  ],
};

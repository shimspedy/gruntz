import type { Job, Provenance } from '../../types';

/**
 * U.S. Space Force Specialty Codes (SFSCs).
 *
 * Officer codes come from AFPC's list of Space Force officer assigned core specialties.
 * Enlisted codes are the ones carried on the July 2026 USSF enlisted promotion select
 * lists; their titles come from the Space Force specialty code crosswalk.
 */
export const jobs: Job[] = [
  // ─── Enlisted ───────────────────────────────────────────────────────────────
  { branch: 'space-force', code: '5S0X1', title: 'Space Systems Operations', field: 'Space Operations', category: 'enlisted' },
  { branch: 'space-force', code: '5C0X1D', title: 'Cyber Operations - Defensive Cyber Operations', field: 'Cyberspace', category: 'enlisted' },
  { branch: 'space-force', code: '5C0X1N', title: 'Cyber Operations - Network Operations', field: 'Cyberspace', category: 'enlisted' },
  { branch: 'space-force', code: '5C0X1R', title: 'Cyber Operations - RF Operations (SATCOM)', field: 'Cyberspace', category: 'enlisted' },
  { branch: 'space-force', code: '5C0X1S', title: 'Cyber Operations - System Operations', field: 'Cyberspace', category: 'enlisted' },
  { branch: 'space-force', code: '5I0X1', title: 'All Source Intelligence Analyst', field: 'Intelligence', category: 'enlisted' },

  // ─── Officer ────────────────────────────────────────────────────────────────
  { branch: 'space-force', code: '13A', title: 'Astronaut', field: 'Space Operations', category: 'officer' },
  { branch: 'space-force', code: '13S', title: 'Space Operations', field: 'Space Operations', category: 'officer' },
  { branch: 'space-force', code: '14N', title: 'Intelligence Operations', field: 'Intelligence', category: 'officer' },
  { branch: 'space-force', code: '17X', title: 'Cyber Operations', field: 'Cyberspace', category: 'officer' },
  { branch: 'space-force', code: '62E', title: 'Developmental Engineer', field: 'Acquisition', category: 'officer' },
  { branch: 'space-force', code: '63A', title: 'Acquisition Management', field: 'Acquisition', category: 'officer' },
];

export const provenance: Provenance = {
  verified: '2026-11-18',
  sources: [
    {
      label: 'AFPC, Officer Promotions: Space Force officer competitive categories and assigned core specialties',
      url: 'https://www.afpc.af.mil/Promotion/Officer-Promotions/',
    },
    {
      label: 'AFPC, USSF 26E5 select list (public release 16 Jul 2026), promotion SFSC column',
      url: 'https://www.afpc.af.mil/Portals/70/documents/PROMOTION/Enlisted%20Promotions/USSF%2026E5%20ALL%20PUBLIC%20SITES.pdf',
    },
    {
      label: 'AFPC, USSF 26E6 select list (public release 16 Jul 2026), promotion SFSC column',
      url: 'https://www.afpc.af.mil/Portals/70/documents/PROMOTION/Enlisted%20Promotions/USSF%2026E6%20ALL%20PUBLIC%20SITES.pdf',
    },
    {
      label: 'U.S. Space Force, USSF Specialty Code Crosswalk (enlisted, v6)',
      url: 'https://www.spaceforce.mil/LinkClick.aspx?fileticket=csSHRIrRU8c%3D&portalid=1&timestamp=1655211268589',
    },
    {
      label: 'U.S. Space Force, Interservice Transfer (IST) Program FAQs (FY27)',
      url: 'https://www.spaceforce.mil/Portals/2/Documents/Transfer/USSF_INTERSERVICE_TRANSFER_IST_PROGRAM_FREQUENTLY_ASKED_QUESTIONS_FAQs.pdf',
    },
    {
      label: 'U.S. Space Force, "Space Force to accept Air Force Reserve volunteers for part-time positions" (2 Sep 2025)',
      url: 'https://www.spaceforce.mil/News/Article-Display/Article/4290878/space-force-to-accept-air-force-reserve-volunteers-for-part-time-positions/',
    },
  ],
  notes:
    'Officer codes and titles are AFPC\'s Space Force assigned core specialties (Operations: 13A, 13S, 14N, 17X; Force Modernization: 62E, 63A). ' +
    'Enlisted 5S0X1 and the four 5C0X1 shreds (D, N, R, S) all appear on the July 2026 USSF enlisted promotion lists. Their titles come from the Space Force specialty code crosswalk, an older document. ' +
    'Senior enlisted Guardians (E-8 and E-9) hold the 5Z800 and 5Z900 SFSCs, according to the 2025 Personnel Management Act article. No official title was found for those codes, so they are left out. ' +
    'Space Force does not use warrant officers (IST FAQ).',
  unverified: [
    '5I0X1 All Source Intelligence Analyst: the IST FAQ (FY27) still lists enlisted Intelligence as a Space Force career field, but no 5I code appears on the 26E5 or 26E6 promotion lists. Check the current DAF Enlisted Classification Directory (myFSS) for the current enlisted intelligence SFSC number and title.',
    'The IST FAQ (FY27) lists Imagery Analyst as an enlisted Space Force career field. The crosswalk shows it as "5I1A", which is not in full SFSC format. Confirm the current code in the DAF Enlisted Classification Directory before adding it.',
    'The crosswalk also lists 5I2A ELINT Analyst, 5I2C COMINT Analyst, 5I4A Cyber Intel Analyst, 5I4B Analysis and Reporting, and 5I8 Targeting Analyst. These are left out because no current source was found. Confirm in the DAF Enlisted Classification Directory.',
    'The 5C0X1 shred titles (Defensive Cyber Operations, Network Operations, RF Operations (SATCOM), System Operations) are from the crosswalk. Confirm the current wording in the DAF Enlisted Classification Directory.',
    'Confirm the titles of the 5Z800 and 5Z900 senior enlisted SFSCs and decide whether to list them.',
  ],
};

import type { Job, Provenance } from '../../types';

/**
 * U.S. Coast Guard enlisted ratings, chief warrant officer specialties and officer
 * career paths, checked 2026-11-18.
 *
 * Enlisted `field`: the Coast Guard recruiting site (gocoastguard.com) tags each rating
 * with one or more career categories (Aviation, Business, STEM, Law Enforcement,
 * Communications, First Response). We list those tags as given. The older four-group
 * scheme (Deck and Ordnance, Hull and Engineering, Aviation, Administrative and
 * Scientific) could not be found on a current official page, so it is not used.
 */
const cg = 'coast-guard' as const;

const enlisted = (code: string, title: string, field: string): Job => ({
  branch: cg,
  code,
  title,
  field,
  category: 'enlisted',
});

const warrant = (code: string, title: string): Job => ({
  branch: cg,
  code,
  title,
  field: 'Chief Warrant Officer',
  category: 'warrant',
});

/** Officer career paths have no public specialty code on gocoastguard.com, so `code` is empty. */
const officer = (title: string, field: string): Job => ({
  branch: cg,
  code: '',
  title,
  field,
  category: 'officer',
});

export const jobs: Job[] = [
  // ─── Enlisted ratings (gocoastguard.com enlisted careers, plus MU and RMS) ───
  enlisted('AMT', 'Aviation Maintenance Technician', 'Aviation, STEM'),
  enlisted('AST', 'Aviation Survival Technician', 'Aviation, First Response'),
  enlisted('AET', 'Avionics Electrical Technician', 'Aviation, STEM, Communications'),
  enlisted('BM', "Boatswain's Mate", 'Business, First Response'),
  enlisted('CS', 'Culinary Specialist', 'Business'),
  enlisted('CMS', 'Cyber Mission Specialist', 'STEM, Communications'),
  enlisted('DC', 'Damage Controlman', 'STEM, First Response'),
  enlisted('DV', 'Diver', 'STEM, First Response'),
  enlisted('EM', "Electrician's Mate", 'STEM'),
  enlisted('ET', 'Electronics Technician', 'STEM, Communications'),
  enlisted('GM', "Gunner's Mate", 'Business, STEM, Law Enforcement'),
  enlisted('HS', 'Health Services Technician', 'STEM, First Response'),
  enlisted('IT', 'Information Systems Technician', 'STEM, Communications'),
  enlisted('IS', 'Intelligence Specialist', 'STEM, Law Enforcement, Communications'),
  enlisted('MK', 'Machinery Technician', 'Business, STEM, Law Enforcement, First Response'),
  enlisted('MST', 'Marine Science Technician', 'STEM, First Response'),
  enlisted('ME', 'Maritime Enforcement Specialist', 'Law Enforcement, First Response'),
  enlisted('MU', 'Musician', 'Coast Guard Band'),
  enlisted('OS', 'Operations Specialist', 'Communications, First Response'),
  enlisted('PA', 'Public Affairs Specialist', 'Business, Communications'),
  enlisted('RMS', 'Robotics Mission Specialist', 'Robotics and Autonomous Systems'),
  enlisted('SK', 'Storekeeper', 'Business'),
  enlisted('YN', 'Yeoman', 'Business'),

  // ─── Chief warrant officer specialties ───
  warrant('AVI', 'Aviation Engineering'),
  warrant('BNDM', 'Bandmaster'),
  warrant('BOSN', 'Boatswain'),
  warrant('INV', 'Criminal Investigator'),
  warrant('CMM', 'Cyber Mission Management'),
  warrant('DIV', 'Diving'),
  warrant('ELC', 'Electronics'),
  warrant('F&S', 'Finance and Supply'),
  warrant('ISM', 'Information Systems Management'),
  warrant('ISS', 'Intelligence Systems Specialist'),
  warrant('MLES', 'Maritime Law Enforcement Specialist'),
  warrant('MSSD', 'Marine Safety Specialist Deck'),
  warrant('MSSE', 'Marine Safety Specialist Engineering'),
  warrant('MSSR', 'Marine Safety Specialist Response'),
  warrant('MAT', 'Material Maintenance'),
  warrant('MED', 'Medical Administration'),
  warrant('ENG', 'Naval Engineering'),
  warrant('OSS', 'Operations Systems Specialist'),
  warrant('PERS', 'Personnel Administration'),
  warrant('INF', 'Public Information'),
  warrant('RMM', 'Robotics Mission Manager'),
  warrant('WEPS', 'Weapons'),

  // ─── Officer career paths and specialties (gocoastguard.com/careers/officer) ───
  officer('Afloat (Cutterman)', 'Afloat'),
  officer('Aviator', 'Aviation'),
  officer('Aeronautical Engineering', 'Aviation'),
  officer('Naval Engineering', 'Engineering and C5I'),
  officer('Civil Engineering', 'Engineering and C5I'),
  officer('Cyberspace', 'Engineering and C5I'),
  officer('Physicians and Physician Assistants', 'Healthcare'),
  officer('Dentistry', 'Healthcare'),
  officer('Psychology and Social Work', 'Healthcare'),
  officer('Environmental Health', 'Healthcare'),
  officer('Pharmacy', 'Healthcare'),
  officer('Nursing', 'Healthcare'),
  officer('Medical Administration', 'Healthcare'),
  officer('Vessel Inspections', 'Prevention'),
  officer('Marine Investigations', 'Prevention'),
  officer('Waterways Management', 'Prevention'),
  officer('Port and Facility Safety and Security', 'Prevention'),
  officer('Marine Safety Engineering', 'Prevention'),
  officer('Search and Rescue Coordination', 'Response'),
  officer('Maritime Law Enforcement', 'Response'),
  officer('Boat Forces Operations', 'Response'),
  officer('Marine Environmental Response', 'Response'),
  officer('Deployable Specialized Forces', 'Response'),
  officer('Emergency Management', 'Response'),
  officer('Financial Management', 'Support'),
  officer('Intelligence', 'Support'),
  officer('Law', 'Support'),
  officer('Reserve Component Manager', 'Support'),
];

export const provenance: Provenance = {
  verified: '2026-11-18',
  sources: [
    {
      label: 'GoCoastGuard.com: Enlisted careers (21 ratings and their category tags)',
      url: 'https://www.gocoastguard.com/active-duty-careers/enlisted-opportunities',
    },
    {
      label: 'ALCOAST 183/26 (22 Jun 2026): new Robotics Mission Specialist (RMS) rating and CWO Robotics Mission Manager (RMM) specialty',
      url: 'https://content.govdelivery.com/accounts/USDHSCG/bulletins/41d22f4',
    },
    {
      label: 'ALCOAST 244/26 (7 Aug 2026): RMS added to the ratings table, RMM added to the CWO specialty scope',
      url: 'https://content.govdelivery.com/accounts/USDHSCG/bulletins/423fce4',
    },
    {
      label: 'ALCGPSC 084/23 (18 Jul 2023): PY23 Active Duty CWO Appointment Board results, by specialty',
      url: 'https://content.govdelivery.com/accounts/USDHSCG/bulletins/365d61e',
    },
    {
      label: 'ALCGPSC 104/24 (6 Aug 2024): PY24 IDPL CWO Appointment Board results, incl. Cyber Mission Management (CMM)',
      url: 'https://content.govdelivery.com/accounts/USDHSCG/bulletins/3ad4e6d',
    },
    {
      label: 'ALCGPSC 024/24 (16 Feb 2024): CWO Bandmaster (BNDM) board, open to the Musician (MU) rating',
      url: 'https://content.govdelivery.com/accounts/USDHSCG/bulletins/38aeddd',
    },
    { label: 'GoCoastGuard.com: Officer careers', url: 'https://www.gocoastguard.com/careers/officer' },
    { label: 'GoCoastGuard.com: Afloat', url: 'https://www.gocoastguard.com/careers/officer/afloat' },
    { label: 'GoCoastGuard.com: Aviation', url: 'https://www.gocoastguard.com/careers/officer/aviation' },
    { label: 'GoCoastGuard.com: Engineering and C5I', url: 'https://www.gocoastguard.com/careers/officer/engineering-c5i' },
    { label: 'GoCoastGuard.com: Healthcare', url: 'https://www.gocoastguard.com/careers/officer/healthcare' },
    { label: 'GoCoastGuard.com: Prevention', url: 'https://www.gocoastguard.com/careers/officer/prevention' },
    { label: 'GoCoastGuard.com: Response', url: 'https://www.gocoastguard.com/careers/officer/response' },
    { label: 'GoCoastGuard.com: Support', url: 'https://www.gocoastguard.com/careers/officer/support' },
  ],
  notes:
    '23 enlisted ratings: the 21 on gocoastguard.com (which includes Cyber Mission Specialist), plus Musician (Coast Guard Band only, not on the recruiting list) and Robotics Mission Specialist (established June 2026). No rating merger or disestablishment was found in 2025-2026 ALCOASTs. Enlisted "field" repeats the gocoastguard.com category tags; MU and RMS have no tags there, so their field is descriptive. CWO specialty names follow the most recent board messages (ALCGPSC 084/23, 104/24, 024/24) plus RMM from ALCOAST 183/26. Officer entries are the career paths and specialties named on gocoastguard.com; they have no public specialty codes, so code is empty. Healthcare includes roles the Coast Guard fills partly through the U.S. Public Health Service. Coast Guard .mil sites (uscg.mil, dcms.uscg.mil, mycg.uscg.mil, media.defense.gov) returned 403 to our fetcher, so the directive manuals themselves could not be read.',
  unverified: [
    'Rating list: confirm against the ratings table in Enlistments, Evaluations, and Advancements, COMDTINST M1000.2 series, section 2.A.2 (as updated by ALCOAST 244/26). The manual PDF on media.defense.gov could not be fetched.',
    'Enlisted field: decide whether to show the gocoastguard.com category tags (e.g. BM is tagged "Business, First Response") or a different grouping. No current official page with the Deck/Hull/Aviation/Admin group names was found. MU field "Coast Guard Band" and RMS field "Robotics and Autonomous Systems" are our labels, not official tags.',
    'CWO specialty list: confirm against Chapter 12 "Scope of Warrant Officer Specialties" in Appointing Warrant Officers, COMDTINST 1420.1. Our list is built from board-result messages, so a specialty with no selectees in 2023-2024 (other than BNDM and RMM) could be missing.',
    'CWO names: ALCGPSC 084/23 says "Maritime Law Enforcement and Security Specialist" and "Maritime Safety Specialist Deck/Engineering/Response"; ALCGPSC 104/24 says "Maritime Law Enforcement Specialist" and "Marine Safety Specialist Response". We used the 2024 wording for all four; confirm the current names in COMDTINST 1420.1 Chapter 12.',
    'CWO cyber specialty: earlier announcements reportedly named it "CYBR"; ALCGPSC 104/24 uses "Cyber Mission Management (CMM)". Confirm the current name and abbreviation.',
    'Officer specialties: titles are the recruiting-site section names, not official officer specialty codes. If codes are wanted, find the current Coast Guard officer specialty management directive (title and number not confirmed) and take the codes from it.',
  ],
};

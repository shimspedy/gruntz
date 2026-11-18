/**
 * Long-form rank pages for the U.S. Space Force. Joins to ranks.ts on branch + abbr.
 * Prose is original. Facts come from the sources listed per entry; anything not
 * confirmed against an official source is listed in `unverified`.
 * Last checked 2026-11-18.
 */
import type { RankDetail, Source } from '../../types';

const S = {
  names: { label: 'Space Force releases service-specific rank names (Jan. 29, 2021)', url: 'https://www.spaceforce.mil/News/Article/2487814/space-force-releases-service-specific-rank-names/' },
  uniform2022: { label: 'USSF releases grooming, uniform policy updates (May 24, 2022)', url: 'https://www.spaceforce.mil/news/article/3041356/ussf-releases-grooming-uniform-policy-updates/' },
  spfi2903: { label: 'SPFI 36-2903, Space Force dress and personal appearance', url: 'https://static.e-publishing.af.mil/production/1/ussf/publication/spfi36-2903/spfi36-2903.pdf' },
  spfi2502: { label: 'SPFI 36-2502, Space Force enlisted promotion and demotion programs', url: 'https://static.e-publishing.af.mil/production/1/ussf/publication/spfi36-2502/spfi36-2502.pdf' },
  s5s7: { label: 'Space Force releases S5-S7 promotions (July 17, 2026)', url: 'https://www.spaceforce.mil/News/Article-Display/Article/4548774/space-force-releases-s5-s7-promotions/' },
  afpcEnlisted: { label: 'AFPC, Enlisted Promotions (Air Force and Space Force lists)', url: 'https://www.afpc.af.mil/Promotion/Enlisted-Promotions/' },
  framework: { label: 'USSF Core Enlisted Framework (April 2026)', url: 'https://www.spaceforce.mil/Portals/2/Documents/SAF_2026/Enlisted_Force_Development_%20Framework.pdf?ver=142lnBNQI-Z12dCL8JVTew%3D%3D' },
  museum: { label: 'National Museum of the USAF, Enlisted Guardians', url: 'https://www.nationalmuseum.af.mil/Visit/Museum-Exhibits/Fact-Sheets/Display/Article/3520106/enlisted-guardians/' },
  about: { label: 'U.S. Space Force, About the Space Force', url: 'https://www.spaceforce.mil/About-Us/Rank-Insignia/' },
  towberman: { label: 'CMSgt Towberman sworn in as first Senior Enlisted Advisor of the Space Force', url: 'https://www.spaceforce.mil/News/Article/2135959/cmsgt-towberman-sworn-in-as-the-first-senior-enlisted-advisor-for-the-us-space/' },
  towbermanBio: { label: 'Biography, Chief Master Sgt. Roger A. Towberman', url: 'https://www.spaceforce.mil/Biographies/Display/Article/2136021/roger-a-towberman/' },
  cmssfChange: { label: 'Chief Master Sergeant of the Space Force transfers responsibility', url: 'https://www.spaceforce.mil/News/Article-Display/Article/3528509/chief-master-sergeant-of-the-space-force-transfers-responsibility-in-historic-c/' },
  milestones: { label: 'U.S. Space Force, Space Force Milestones', url: 'https://www.spaceforce.mil/About-Us/History/Space-Force-Milestones/' },
  afpcOfficer: { label: 'AFPC, Officer Promotions (Space Force competitive categories)', url: 'https://www.afpc.af.mil/Promotion/Officer-Promotions/' },
  cy26a: { label: 'AFPC, Space Force field grade officer promotions, CY26A (Aug. 21, 2026)', url: 'https://www.afpc.af.mil/News/Article-Display/Article/4580020/department-of-the-air-force-releases-latest-us-space-force-field-grade-officer/' },
  tioh: { label: 'The Institute of Heraldry, Officer Insignia of Rank: Origin', url: 'https://tioh.army.mil/Catalog/Heraldry.aspx?HeraldryId=15750&CategoryId=9171&grp=2&menu=Uniformed+Services' },
  insignia: { label: 'Department of War, U.S. Military Rank Insignia', url: 'https://www.war.gov/Resources/Insignias/' },
  usc601: { label: '10 U.S.C. 601, Positions of importance and responsibility', url: 'https://uscode.house.gov/view.xhtml?req=granuleid:USC-prelim-title10-section601&num=0&edition=prelim' },
  usc517: { label: '10 U.S.C. 517, Authorized daily average: members in pay grades E-8 and E-9', url: 'https://uscode.house.gov/view.xhtml?req=granuleid:USC-prelim-title10-section517&num=0&edition=prelim' },
  wikiRank: { label: 'Wikipedia: United States Space Force rank insignia', url: 'https://en.wikipedia.org/wiki/United_States_Space_Force_rank_insignia' },
  wikiCmssf: { label: 'Wikipedia: Chief Master Sergeant of the Space Force', url: 'https://en.wikipedia.org/wiki/Chief_Master_Sergeant_of_the_Space_Force' },
  afCareerTip: { label: 'Joint Base Charleston, "Career Assistance Tip" (2011): Air Force enlisted promotion eligibility', url: 'https://www.jbcharleston.jb.mil/News/Commentaries/Display/Article/237818/career-assistance-tip/' },
  btz: { label: 'Patrick SFB, "Guardian on the Rise: Patrick SFB’s First Guardian to Achieve Below-the-Zone" (Oct. 3, 2023)', url: 'https://www.patrick.spaceforce.mil/News/Article-Display/Article/3546764/guardian-on-the-rise-patrick-sfbs-first-guardian-to-achieve-below-the-zone/' },
  bratton: { label: 'U.S. Space Force biography, Gen. Shawn N. Bratton, Vice Chief of Space Operations', url: 'https://www.spaceforce.mil/Biographies/Display/Article/2975474/shawn-n-bratton/' },
} satisfies Record<string, Source>;

const NAMES_2021 =
  'The Space Force was established on Dec. 20, 2019, and at first used Air Force enlisted titles. On Jan. 29, 2021, the service announced its own rank names, effective Feb. 1, 2021, after collecting crowdsourced feedback from the field. The four junior grades became Specialist 1 through Specialist 4, and E-5 became Sergeant; grades from Technical Sergeant up kept their Air Force titles.';

const INSIGNIA_2022 =
  'Guardians kept wearing Air Force insignia while the service designed its own. The Space Force unveiled its enlisted rank insignia on Sept. 20, 2021, and authorized them as an optional uniform item in Space Force Guidance Memorandum 2022-36-01, announced on May 24, 2022, as an outcome of the service’s first uniform board in 2021.';

const OFFICER_NAMES =
  'When the Space Force published its rank names on Jan. 29, 2021, it kept the same officer titles as the Air Force, Army and Marine Corps, effective Feb. 1, 2021. Officer insignia are the same as in those services.';


export const rankDetails: RankDetail[] = [
  // ─── Enlisted ────────────────────────────────────────────────────────────────
  {
    branch: 'space-force',
    abbr: 'Spc1',
    slug: 'specialist-1',
    summary:
      'Specialist 1 (E-1) is the entry grade for most people who enlist in the Space Force. A Specialist 1 is in basic training or initial skills training, learning to be a Guardian before joining an operational unit. Unlike the Air Force’s Airman Basic, a Specialist 1 wears a rank insignia.',
    role: [
      'Completing basic military training',
      'Attending technical training for a Space Force specialty, such as space systems operations, cyber, or intelligence',
      'Learning Guardian values: character, commitment, connection and courage',
      'Meeting fitness, dress and conduct standards',
      'Working under supervision once assigned to a first unit',
    ],
    promotion:
      'Most enlistees enter as Specialist 1. Advancement to Specialist 2 is not competitive: a Specialist 1 in good standing is promoted after a set time in grade. (In the Air Force, the matching step from Airman Basic to Airman takes six months.)',
    history: [
      NAMES_2021,
      'Before the change, the E-1 grade in the Space Force was Airman Basic, the Air Force title. The Space Force’s announcement said the preferred form of address for all four junior grades is simply "Specialist."',
    ],
    faq: [
      { q: 'Why are Space Force enlisted called Specialists?', a: 'The Space Force chose its own names in 2021, using Specialist 1 to 4 for E-1 to E-4, after collecting feedback from Guardians. The titles replaced the Air Force’s Airman ranks.' },
      { q: 'What is a Specialist 1 in the Space Force?', a: 'The lowest enlisted grade, E-1, held during basic and technical training.' },
      { q: 'How do you address a Specialist 1?', a: 'As "Specialist." "Spec1" or "Specialist 1" are also acceptable.' },
    ],
    sources: [S.names, S.museum, S.about, S.spfi2502, S.wikiRank, S.afCareerTip],
    unverified: [],
  },
  {
    branch: 'space-force',
    abbr: 'Spc2',
    slug: 'specialist-2',
    summary:
      'Specialist 2 (E-2) is the second Space Force enlisted grade. Most Specialist 2s are finishing technical training or arriving at a first unit, where they start applying their skills under supervision.',
    role: [
      'Finishing technical training or starting at a first duty station',
      'Learning the systems and procedures of a unit, such as a satellite operations or cyber squadron',
      'Completing on-the-job qualification under a trainer',
      'Supporting crew or shift operations under supervision',
      'Taking part in unit readiness and training events',
    ],
    promotion:
      'Promotion from Specialist 1 to Specialist 2 is non-competitive and follows time in grade while in good standing. (The Air Force’s matching step, Airman Basic to Airman, takes six months.)',
    history: [
      NAMES_2021,
      'Before Feb. 1, 2021, this grade was Airman (E-2), the Air Force title. ' + INSIGNIA_2022,
    ],
    faq: [
      { q: 'What does a Specialist 2 do?', a: 'Learns and begins doing the job in a first Space Force unit, under supervision.' },
      { q: 'Is Specialist 2 the same as an Air Force Airman?', a: 'Both are pay grade E-2. The Space Force renamed the grade Specialist 2 in 2021.' },
      { q: 'What insignia does a Specialist 2 wear?', a: 'The Space Force junior enlisted rank insignia, unveiled in 2021 and authorized for wear in 2022. Before then, Guardians wore Air Force stripes.' },
    ],
    sources: [S.names, S.uniform2022, S.spfi2903, S.spfi2502, S.wikiRank, S.afCareerTip],
    unverified: [],
  },
  {
    branch: 'space-force',
    abbr: 'Spc3',
    slug: 'specialist-3',
    summary:
      'Specialist 3 (E-3) is the grade where a Guardian becomes a productive member of a crew or work center. A Specialist 3 has finished initial training, is qualifying on mission systems, and works with less direct supervision.',
    role: [
      'Qualified or qualifying crew member on space, cyber or intelligence systems',
      'Performing day-to-day mission tasks with growing independence',
      'Completing upgrade training and job qualification',
      'Helping newer Specialists learn unit procedures',
      'Supporting exercises, evaluations and readiness inspections',
    ],
    promotion:
      'Promotion from Specialist 2 to Specialist 3 is non-competitive and follows time in grade while in good standing. (The Air Force’s matching step, Airman to Airman First Class, normally takes 10 months.)',
    history: [
      NAMES_2021,
      'Before Feb. 1, 2021, this grade was Airman First Class. ' + INSIGNIA_2022,
    ],
    faq: [
      { q: 'What is a Specialist 3?', a: 'A Space Force E-3, typically a newly qualified crew member or technician.' },
      { q: 'How long does it take to make Specialist 3?', a: 'It is based on time in grade and good standing, not a competitive board.' },
      { q: 'What is the Air Force equivalent of Specialist 3?', a: 'Airman First Class (A1C).' },
    ],
    sources: [S.names, S.uniform2022, S.framework, S.spfi2502, S.wikiRank, S.afCareerTip],
    unverified: [],
  },
  {
    branch: 'space-force',
    abbr: 'Spc4',
    slug: 'specialist-4',
    summary:
      'Specialist 4 (E-4) is the most senior junior enlisted grade in the Space Force. A Specialist 4 is a skilled operator or technician who trains newer Guardians and is preparing to become a Sergeant, the first NCO grade.',
    role: [
      'Fully qualified crew member or technician',
      'Training and certifying newer Specialists',
      'Acting as a shift or team lead when needed',
      'Completing leadership education required before NCO duties',
      'Competing for promotion to Sergeant',
    ],
    promotion:
      'Specialist 3s advance to Specialist 4 after meeting time-in-service and time-in-grade minimums, as Air Force Airmen First Class do on the way to Senior Airman. A Below-the-Zone program lets a limited number of standout Specialist 3s pin on Specialist 4 six months ahead of their normal date. Specialist 4s then compete for Sergeant through the Space Force’s board-based NCO process.',
    history: [
      NAMES_2021,
      'Before Feb. 1, 2021, this grade was Senior Airman. Like the Air Force’s Senior Airman, a Specialist 4 is not an NCO. ' + INSIGNIA_2022,
    ],
    faq: [
      { q: 'Is a Specialist 4 an NCO?', a: 'No. In the Space Force, NCO status begins at Sergeant (E-5).' },
      { q: 'What is the difference between a Space Force Specialist 4 and an Army Specialist?', a: 'Both are E-4 and neither is an NCO, but the Space Force numbers its Specialist grades 1 to 4, while the Army uses Specialist for E-4 only.' },
      { q: 'How does a Specialist 4 become a Sergeant?', a: 'Through a central promotion board. In the 2026 cycle, about 95 percent of eligible Specialist 4s were selected.' },
    ],
    sources: [S.names, S.uniform2022, S.s5s7, S.spfi2502, S.btz, S.wikiRank],
    unverified: [],
  },
  {
    branch: 'space-force',
    abbr: 'Sgt',
    slug: 'sergeant',
    summary:
      'Sergeant (E-5) is the first noncommissioned officer grade in the Space Force. A Sergeant leads a small team, signs off on training and is responsible for the people and work in a crew or section.',
    role: [
      'Team lead or crew supervisor in an operations squadron',
      'Trainer and evaluator for mission qualification',
      'Writing evaluations for Specialists',
      'Enforcing standards and caring for the Guardians on the team',
      'Starting the NCO team leadership phase of the enlisted career',
    ],
    promotion:
      'Sergeant is competitive. Instead of the Air Force’s testing system, the Space Force selects Sergeants through a central board that scores records. In the 2026 cycle, 405 of 424 eligible Specialist 4s (95.52 percent) were selected, with an average of 1.07 years in grade and 3.52 years in service.',
    history: [
      NAMES_2021,
      'Before Feb. 1, 2021, this grade was Staff Sergeant, the Air Force title. The Space Force chose the shorter "Sergeant." ' + INSIGNIA_2022,
    ],
    faq: [
      { q: 'Why is Space Force E-5 called Sergeant instead of Staff Sergeant?', a: 'The 2021 rank names gave E-5 the title Sergeant; the Air Force uses Staff Sergeant for the same grade.' },
      { q: 'Do Space Force Sergeants take promotion tests?', a: 'Space Force NCO promotions use central boards rather than WAPS testing.' },
      { q: 'How do you address a Sergeant?', a: '"Sergeant."' },
    ],
    sources: [S.names, S.s5s7, S.afpcEnlisted, S.spfi2502, S.framework, S.wikiRank],
    unverified: [],
  },
  {
    branch: 'space-force',
    abbr: 'TSgt',
    slug: 'technical-sergeant',
    summary:
      'Technical Sergeant (E-6) is an experienced Space Force NCO who leads a section or crew, manages training and serves as a technical authority on mission systems.',
    role: [
      'Section chief or senior crew member',
      'Standardization and evaluation or training lead',
      'Supervising Sergeants and Specialists and writing their evaluations',
      'Managing schedules, readiness and qualifications',
      'Serving in recruiting, instructor or staff positions',
    ],
    promotion:
      'Sergeants compete for Technical Sergeant at a central Space Force board. In the 2026 cycle, 242 of 324 eligible Sergeants (74.69 percent) were selected; selectees averaged 3.63 years in grade and 8.22 years in service.',
    history: [
      NAMES_2021,
      'Technical Sergeant kept its Air Force title in the 2021 change. The announcement listed "Sergeant," "Technical Sergeant" or "Tech Sergeant" as acceptable forms of address. ' + INSIGNIA_2022,
    ],
    faq: [
      { q: 'What does a Space Force Technical Sergeant do?', a: 'Leads a section or crew and is often the technical expert on a mission system.' },
      { q: 'Is a Technical Sergeant a senior NCO?', a: 'No. Senior NCO status begins at Master Sergeant (E-7).' },
      { q: 'How hard is it to make TSgt in the Space Force?', a: 'In 2026, about three in four eligible Sergeants were selected.' },
    ],
    sources: [S.names, S.s5s7, S.afpcEnlisted, S.spfi2502, S.wikiRank],
    unverified: [],
  },
  {
    branch: 'space-force',
    abbr: 'MSgt',
    slug: 'master-sergeant',
    summary:
      'Master Sergeant (E-7) is the first senior NCO grade in the Space Force and the point where the service’s enlisted framework expects Guardians to lead at the operational level, across crews and squadrons.',
    role: [
      'Squadron senior enlisted leader or operations superintendent',
      'Flight chief over several crews',
      'First sergeant',
      'Managing training programs and manning for a squadron',
      'Advising commanders on the enlisted force',
    ],
    promotion:
      'Technical Sergeants compete for Master Sergeant at a central board. In the 2026 cycle, 196 of 530 eligible (36.98 percent) were selected, with an average of 4.50 years in grade and 12.99 years in service.',
    history: [
      NAMES_2021,
      'Master Sergeant kept its Air Force title in 2021. The Space Force’s Core Enlisted Framework describes E-7 as the start of operational leadership, after the team leadership years as a Sergeant and Technical Sergeant. ' + INSIGNIA_2022,
    ],
    faq: [
      { q: 'Is Master Sergeant a senior NCO in the Space Force?', a: 'Yes, it is the first senior NCO grade.' },
      { q: 'How do you address a Master Sergeant?', a: '"Sergeant" or "Master Sergeant."' },
      { q: 'What percentage of Space Force TSgts make MSgt?', a: 'About 37 percent were selected in the 2026 cycle.' },
    ],
    sources: [S.names, S.s5s7, S.framework, S.spfi2502, S.wikiRank],
    unverified: [],
  },
  {
    branch: 'space-force',
    abbr: 'SMSgt',
    slug: 'senior-master-sergeant',
    summary:
      'Senior Master Sergeant (E-8) is a senior enlisted leader who runs enlisted operations for a squadron, Delta or large function and advises its commander.',
    role: [
      'Senior enlisted leader of a squadron or Delta staff function',
      'Superintendent for operations, maintenance or training',
      'Career field manager or staff lead at a field command',
      'First sergeant or other senior special duty',
      'Mentoring Master Sergeants for higher leadership',
    ],
    promotion:
      'Master Sergeants are considered by a central board. E-8 and E-9 numbers are limited by federal law as a share of enlisted strength, so selection is selective. AFPC publishes Space Force SMSgt lists alongside Air Force lists.',
    history: [
      NAMES_2021,
      'Senior Master Sergeant kept its Air Force title, which dates to the Military Pay Act of 1958 creating E-8. The Space Force lists "Senior" as an acceptable form of address. ' + INSIGNIA_2022,
    ],
    faq: [
      { q: 'What is a Senior Master Sergeant called?', a: '"Senior" or "Senior Master Sergeant."' },
      { q: 'Does the Space Force use the same SMSgt title as the Air Force?', a: 'Yes. Only the E-1 to E-5 titles changed in 2021.' },
      { q: 'How are Space Force SMSgts selected?', a: 'By a central promotion board.' },
    ],
    sources: [S.names, S.afpcEnlisted, S.usc517, S.spfi2502, S.wikiRank],
    unverified: [],
  },
  {
    branch: 'space-force',
    abbr: 'CMSgt',
    slug: 'chief-master-sergeant',
    summary:
      'Chief Master Sergeant (E-9) is the highest Space Force enlisted grade. Chiefs serve as senior enlisted leaders of Deltas, field commands and headquarters staffs, and advise commanders on the whole enlisted force.',
    role: [
      'Senior enlisted leader of a Delta or field command',
      'Career field manager for a Space Force specialty',
      'Senior enlisted advisor on headquarters staffs',
      'Advising commanders on readiness, discipline and enlisted policy',
      'Developing senior NCOs',
    ],
    promotion:
      'Senior Master Sergeants are considered by a central board. Federal law limits E-9s to about 1 percent of enlisted strength, keeping the grade small. AFPC lists Space Force CMSgt cycles with an "S9" designator.',
    history: [
      NAMES_2021,
      'Chief Master Sergeant kept its Air Force title, which dates to the 1958 creation of E-9. The form of address is "Chief." ' + INSIGNIA_2022,
    ],
    faq: [
      { q: 'What is the highest enlisted rank in the Space Force?', a: 'Chief Master Sergeant (E-9). One Chief serves in the separate billet of Chief Master Sergeant of the Space Force.' },
      { q: 'How do you address a Chief Master Sergeant?', a: '"Chief."' },
      { q: 'How many Chief Master Sergeants does the Space Force have?', a: 'Few; E-9 numbers are capped by law at about 1 percent of enlisted strength.' },
    ],
    sources: [S.names, S.afpcEnlisted, S.usc517, S.spfi2502, S.wikiRank],
    unverified: [],
  },
  {
    branch: 'space-force',
    abbr: 'CMSSF',
    slug: 'chief-master-sergeant-of-the-space-force',
    summary:
      'The Chief Master Sergeant of the Space Force is a single billet: the service’s senior enlisted leader and the senior enlisted advisor to the Chief of Space Operations. One Guardian holds it at a time, at a basic pay rate set separately from the E-9 table.',
    role: [
      'Advising the Chief of Space Operations on the enlisted force',
      'Shaping enlisted development, education and promotion policy',
      'Representing Guardians to Congress, other services and the public',
      'Visiting units to hear from Guardians and families',
      'Leading the network of senior enlisted leaders across the service',
    ],
    promotion:
      'There is no board or test. The Chief of Space Operations selects a Chief Master Sergeant for the billet.',
    history: [
      'Chief Master Sgt. Roger A. Towberman was sworn in on April 3, 2020, as the first Senior Enlisted Advisor of the Space Force, in a ceremony at the Pentagon where Gen. John W. Raymond, the first Chief of Space Operations, administered the oath.',
      'The 2021 rank names, effective Feb. 1, 2021, created the title Chief Master Sergeant of the Space Force (CMSSF), and Towberman became the first to hold it. Chief Master Sgt. John F. Bentivegna succeeded him as the second CMSSF at a change of responsibility ceremony on Sept. 15, 2023.',
    ],
    faq: [
      { q: 'Who was the first Chief Master Sergeant of the Space Force?', a: 'Roger A. Towberman, who became the service’s first senior enlisted leader in April 2020.' },
      { q: 'What does the CMSSF do?', a: 'Advises the Chief of Space Operations on everything affecting enlisted Guardians and represents them inside and outside the service.' },
      { q: 'How do you address the CMSSF?', a: '"Chief" or "Chief Master Sergeant of the Space Force."' },
    ],
    sources: [S.towberman, S.towbermanBio, S.cmssfChange, S.names, S.milestones, S.wikiCmssf],
    unverified: [],
  },

  // ─── Officers ────────────────────────────────────────────────────────────────
  {
    branch: 'space-force',
    abbr: '2d Lt',
    slug: 'second-lieutenant',
    summary:
      'Second Lieutenant (O-1) is the entry grade for Space Force officers. New lieutenants complete initial skills training in a core specialty, such as space operations, intelligence, cyber, engineering or acquisition, before joining a first unit. The insignia is a single gold bar.',
    role: [
      'Student in initial space operations or specialty training',
      'Crew commander or crew member in an operations squadron',
      'Developmental engineer or acquisition program officer',
      'Intelligence or cyber officer in a Delta',
      'Learning to lead enlisted Guardians',
    ],
    promotion:
      'Officers enter through the Air Force Academy, Air Force ROTC or Officer Training School. From O-1 to O-3, Space Force officers are managed in one competitive category, the Line of the Space Force (LSF), covering astronaut, space operations, intelligence, cyber, developmental engineer and acquisition specialties. Promotion to First Lieutenant is not by competitive board.',
    history: [
      OFFICER_NAMES,
      'The gold bar for Second Lieutenant was adopted by the Army in December 1917; until then the grade had no insignia.',
    ],
    faq: [
      { q: 'How do you become a Space Force officer?', a: 'Through the Air Force Academy, Air Force ROTC or Officer Training School, selecting the Space Force and a Space Force specialty.' },
      { q: 'Are Space Force officer ranks the same as the Air Force?', a: 'Yes. The titles and insignia are the same.' },
      { q: 'What do Space Force lieutenants do?', a: 'Many start as satellite or space operations crew members; others work in intelligence, cyber, engineering or acquisition.' },
    ],
    sources: [S.names, S.afpcOfficer, S.tioh, S.insignia],
    unverified: [],
  },
  {
    branch: 'space-force',
    abbr: '1st Lt',
    slug: 'first-lieutenant',
    summary:
      'First Lieutenant (O-2) is the second Space Force officer grade. First Lieutenants are qualified in their specialty and lead crews, projects or sections. The insignia is a single silver bar.',
    role: [
      'Crew commander on a satellite, missile warning or space domain awareness crew',
      'Flight commander in an operations squadron',
      'Program manager or engineer on a space acquisition program',
      'Intelligence officer supporting a Delta',
      'Supervising enlisted Guardians',
    ],
    promotion:
      'Second Lieutenants who remain fully qualified are promoted to First Lieutenant without a competitive board. They stay in the single Line of the Space Force category through Captain.',
    history: [
      OFFICER_NAMES,
      'The single bar dates to the Army’s 1836 shoulder straps; it changed from gold to silver in 1872.',
      'Typical First Lieutenant work includes command and control of satellites for missile warning, communications, and positioning, navigation and timing, as well as space domain awareness and launch range operations.',
    ],
    faq: [
      { q: 'What does a Space Force First Lieutenant do?', a: 'Often leads a crew or section, or manages part of an acquisition program.' },
      { q: 'Is a silver bar higher than a gold bar?', a: 'Yes. Silver (First Lieutenant) outranks gold (Second Lieutenant).' },
      { q: 'Is there a board for First Lieutenant?', a: 'No. It is a time-based, fully qualified promotion.' },
    ],
    sources: [S.names, S.afpcOfficer, S.tioh],
    unverified: [],
  },
  {
    branch: 'space-force',
    abbr: 'Capt',
    slug: 'captain',
    summary:
      'Captain (O-3) is the grade at which most Space Force officers become experienced experts in their field: instructors, mission commanders, flight commanders and program leads. The insignia is two joined silver bars.',
    role: [
      'Instructor or evaluator for space operations crews',
      'Flight commander in a squadron',
      'Weapons officer or tactics lead',
      'Program manager for a satellite or ground system',
      'Staff officer at a Delta or field command',
    ],
    promotion:
      'Captains are promoted on a fully qualified basis after a set time as First Lieutenants. Promotion to Major is by central selection board, where officers split into two categories: Operations (LSF-O) or Force Modernization (LSF-F).',
    history: [
      OFFICER_NAMES,
      'The Captain’s two bars were adopted with Army shoulder straps in 1836 and changed from gold to silver in 1872.',
      'Captains are the bulk of experienced Space Force operators. Many attend advanced tactics or weapons instruction before moving to staff or acquisition assignments.',
      'The Space Force is organized under the Department of the Air Force, much as the Marine Corps is under the Department of the Navy. It brought together satellite acquisition, budget and people from more than 60 organizations, and its headquarters is at the Pentagon.',
    ],
    faq: [
      { q: 'Is a Space Force Captain the same as a Navy Captain?', a: 'No. A Space Force Captain is O-3; a Navy Captain is O-6.' },
      { q: 'How do Space Force Captains get promoted to Major?', a: 'Through a central selection board within the Operations or Force Modernization category.' },
      { q: 'How many Captains made Major in 2026?', a: '238 were selected at the CY26A boards.' },
    ],
    sources: [S.names, S.afpcOfficer, S.cy26a, S.tioh],
    unverified: [],
  },
  {
    branch: 'space-force',
    abbr: 'Maj',
    slug: 'major',
    summary:
      'Major (O-4) is the first Space Force field grade. Majors serve as squadron directors of operations, senior staff officers and program leaders and are being prepared for squadron command. The insignia is a gold oak leaf.',
    role: [
      'Squadron director of operations',
      'Senior staff officer at a Delta, field command or Space Staff',
      'Program manager for a major space system',
      'Instructor at a professional military education school',
      'Joint staff officer at U.S. Space Command or another combatant command',
    ],
    promotion:
      'Captains compete at a central selection board in one of two competitive categories. Operations (LSF-O) covers astronauts, space operations, intelligence and cyber officers; Force Modernization (LSF-F) covers developmental engineers and acquisition managers. At the CY26A board, LSF-O selected 134 of 168 considered and LSF-F 104 of 129. Selectees are nominated by the President and confirmed by the Senate.',
    history: [
      OFFICER_NAMES,
      'Oak leaves were adopted for majors and lieutenant colonels in 1836; the major’s leaf became gold after an 1851 Army uniform change.',
    ],
    faq: [
      { q: 'How are Space Force Majors selected?', a: 'By a central selection board within the Operations or Force Modernization category.' },
      { q: 'What is the Major insignia?', a: 'A gold oak leaf.' },
      { q: 'Does the Space Force run its own promotion boards?', a: 'Yes. The boards are administered by the Department of the Air Force through AFPC but select Guardians separately from Airmen.' },
    ],
    sources: [S.afpcOfficer, S.cy26a, S.names, S.tioh],
    unverified: [],
  },
  {
    branch: 'space-force',
    abbr: 'Lt Col',
    slug: 'lieutenant-colonel',
    summary:
      'Lieutenant Colonel (O-5) is the grade at which most Space Force squadron commanders serve. Lieutenant Colonels lead operations, acquisition and support squadrons and senior staff divisions. The insignia is a silver oak leaf.',
    role: [
      'Squadron commander',
      'Deputy commander of a Delta',
      'Division chief on the Space Staff or at a field command',
      'Senior materiel leader for an acquisition program',
      'Senior joint staff officer',
    ],
    promotion:
      'Majors compete at a central selection board in the Operations (LSF-O) or Force Modernization (LSF-F) category. At the CY26A board, LSF-O selected 74 of 141 considered and LSF-F 57 of 138, for 131 in total. Selectees are nominated by the President and confirmed by the Senate.',
    history: [
      OFFICER_NAMES,
      'The silver leaf for lieutenant colonel dates to the Army’s 1836 shoulder straps and the 1851 color change.',
      'Below the Delta level, the squadron is the basic Space Force unit. A Lieutenant Colonel commanding an operations squadron leads the crews that run satellites, ground systems or cyber defense for a mission area.',
    ],
    faq: [
      { q: 'What does a Space Force Lieutenant Colonel do?', a: 'Most commonly commands a squadron.' },
      { q: 'How do you address a Lieutenant Colonel?', a: '"Lieutenant Colonel" or "Colonel."' },
      { q: 'How competitive is promotion to Lieutenant Colonel?', a: 'At the 2026 board roughly half of those considered in each category were selected.' },
    ],
    sources: [S.afpcOfficer, S.cy26a, S.names, S.tioh],
    unverified: [],
  },
  {
    branch: 'space-force',
    abbr: 'Col',
    slug: 'colonel',
    summary:
      'Colonel (O-6) is the senior Space Force field grade. Colonels command Deltas, lead major acquisition programs and run directorates on the Space Staff and at field commands. The insignia is a silver eagle.',
    role: [
      'Delta commander',
      'Program executive or senior materiel leader for major space systems',
      'Director or deputy director on the Space Staff',
      'Senior staff officer at U.S. Space Command',
      'Commander of a range or launch organization',
    ],
    promotion:
      'From O-6 through O-8 the Space Force again uses a single Line of the Space Force category. At the CY26A board, 68 of 173 Lieutenant Colonels considered were selected. Selectees are nominated by the President and confirmed by the Senate.',
    history: [
      OFFICER_NAMES,
      'The eagle for colonels was adopted by the Army in 1832, drawn from the eagle on the Coat of Arms of the United States.',
      'The Delta is the Space Force unit above the squadron, organized around a mission such as missile warning or space domain awareness. Delta commanders are Colonels, and the Delta is often where a Guardian’s whole operational chain of command comes together.',
    ],
    faq: [
      { q: 'What does a Space Force Colonel command?', a: 'Typically a Delta, the Space Force’s unit above the squadron level.' },
      { q: 'How many Colonels did the Space Force select in 2026?', a: '68 at the CY26A board.' },
      { q: 'What insignia does a Colonel wear?', a: 'A silver eagle.' },
    ],
    sources: [S.afpcOfficer, S.cy26a, S.names, S.tioh],
    unverified: [],
  },
  {
    branch: 'space-force',
    abbr: 'Brig Gen',
    slug: 'brigadier-general',
    summary:
      'Brigadier General (O-7) is the first general officer grade in the Space Force. One-star Guardians lead major directorates, serve as deputy commanders of field commands and run large acquisition portfolios. The insignia is one silver star.',
    role: [
      'Director on the Space Staff',
      'Deputy commander of a field command',
      'Program executive officer for major space systems',
      'Senior position at U.S. Space Command',
      'Commander of a large Space Force organization',
    ],
    promotion:
      'Colonels are selected by a general officer board within the Line of the Space Force category, nominated by the President and confirmed by the Senate.',
    history: [
      OFFICER_NAMES,
      'General officer stars date to the Continental Army order of June 18, 1780, which prescribed one star for brigadier generals.',
      'The Space Force is organized under the Department of the Air Force, much as the Marine Corps is under the Department of the Navy. It brought together satellite acquisition, budget and people from more than 60 organizations, and its headquarters is at the Pentagon.',
      'The Space Force has far fewer general officers than the older services, so each one-star billet tends to cover a broad portfolio.',
    ],
    faq: [
      { q: 'Is a Brigadier General a one-star?', a: 'Yes.' },
      { q: 'How is a Space Force general selected?', a: 'By a selection board, then presidential nomination and Senate confirmation.' },
      { q: 'How do you address a Brigadier General?', a: '"General."' },
    ],
    sources: [S.afpcOfficer, S.names, S.tioh],
    unverified: [],
  },
  {
    branch: 'space-force',
    abbr: 'Maj Gen',
    slug: 'major-general',
    summary:
      'Major General (O-8) is the two-star Space Force grade. Major Generals lead field commands or large directorates and hold senior joint positions. The insignia is two silver stars.',
    role: [
      'Commander of a field command or major organization',
      'Senior director on the Space Staff',
      'Senior positions at U.S. Space Command',
      'Leader of large space acquisition organizations',
      'Senior joint and interagency positions',
    ],
    promotion:
      'Brigadier Generals are considered by a selection board, nominated by the President and confirmed by the Senate. Major General is the highest grade reached by board; three- and four-star grades are tied to positions.',
    history: [
      OFFICER_NAMES,
      'Two stars for major generals were prescribed by the Continental Army on June 18, 1780.',
      'Above Colonel, Space Force officers compete again as one Line of the Space Force category, rather than split into operations and force modernization.',
      'The Space Force is organized under the Department of the Air Force, much as the Marine Corps is under the Department of the Navy. It brought together satellite acquisition, budget and people from more than 60 organizations, and its headquarters is at the Pentagon.',
    ],
    faq: [
      { q: 'How many stars is a Major General?', a: 'Two.' },
      { q: 'Is a Major General higher than a Brigadier General?', a: 'Yes. Brigadier General is one star; Major General is two.' },
      { q: 'Does the Space Force have Major Generals?', a: 'Yes, using the same title and insignia as the Air Force and Army.' },
    ],
    sources: [S.afpcOfficer, S.names, S.tioh, S.usc601],
    unverified: [],
  },
  {
    branch: 'space-force',
    abbr: 'Lt Gen',
    slug: 'lieutenant-general',
    summary:
      'Lieutenant General (O-9) is a three-star grade held only while serving in a position designated by law as one of importance and responsibility, such as commanding a major Space Force field command or serving as a deputy chief on the Space Staff. The insignia is three silver stars.',
    role: [
      'Commander of a major Space Force field command',
      'Deputy Chief of Space Operations on the Space Staff',
      'Senior positions at U.S. Space Command and the Joint Staff',
      'Leading the service’s largest acquisition organization',
    ],
    promotion:
      'There is no board for three-star grade. The President nominates an officer for a designated position under 10 U.S.C. 601, and the Senate confirms the officer in that grade while in the position.',
    history: [
      OFFICER_NAMES,
      'Like the other services, the Space Force ties three- and four-star grades to positions rather than permanent promotion.',
      'The Space Force is organized under the Department of the Air Force, much as the Marine Corps is under the Department of the Navy. It brought together satellite acquisition, budget and people from more than 60 organizations, and its headquarters is at the Pentagon.',
      'Because three-star grade belongs to the position, an officer leaving a three-star job without moving to another normally retires or reverts to the permanent grade.',
    ],
    faq: [
      { q: 'How many stars is a Lieutenant General?', a: 'Three.' },
      { q: 'Is Lieutenant General a permanent rank?', a: 'No. It is held while in a designated position.' },
      { q: 'How is a Space Force Lieutenant General chosen?', a: 'Nominated by the President for a specific job and confirmed by the Senate.' },
    ],
    sources: [S.usc601, S.names, S.insignia],
    unverified: [],
  },
  {
    branch: 'space-force',
    abbr: 'Gen',
    slug: 'general',
    summary:
      'General (O-10) is the four-star grade and the highest Space Force rank. The Chief of Space Operations, the service’s senior officer and a member of the Joint Chiefs of Staff, holds it, as does the Vice Chief. The insignia is four silver stars.',
    role: [
      'Chief of Space Operations, a member of the Joint Chiefs of Staff',
      'Vice Chief of Space Operations',
      'Commander of U.S. Space Command (when held by a Guardian)',
      'Advising the Secretary of the Air Force, Secretary of Defense and the President on space',
    ],
    promotion:
      'Four-star grade is tied to a designated position under 10 U.S.C. 601. The President nominates and the Senate confirms the officer for that position.',
    history: [
      'Gen. John W. Raymond became the first Chief of Space Operations when the Space Force was established on Dec. 20, 2019, and is counted as the service’s first Guardian.',
      OFFICER_NAMES,
      'The Space Force is organized under the Department of the Air Force, much as the Marine Corps is under the Department of the Navy. It brought together satellite acquisition, budget and people from more than 60 organizations, and its headquarters is at the Pentagon.',
    ],
    faq: [
      { q: 'Who leads the Space Force?', a: 'The Chief of Space Operations, a four-star General, under the civilian Secretary of the Air Force.' },
      { q: 'Who was the first Chief of Space Operations?', a: 'Gen. John W. Raymond, from the service’s founding in December 2019.' },
      { q: 'Is the Chief of Space Operations on the Joint Chiefs?', a: 'Yes.' },
    ],
    sources: [S.about, S.towberman, S.milestones, S.usc601, S.bratton],
    unverified: [],
  },
];

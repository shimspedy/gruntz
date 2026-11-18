/**
 * Long-form rank pages for the U.S. Air Force. Joins to ranks.ts on branch + abbr.
 * Prose is original. Facts come from the sources listed per entry; anything not
 * confirmed against an official source is listed in `unverified`.
 * Last checked 2026-11-18.
 */
import type { RankDetail, Source } from '../../types';

const S = {
  stripes: { label: 'Air Force, "Stripes: A brief history of Air Force enlisted ranks" (2011)', url: 'https://www.af.mil/News/Article-Display/Article/276805/stripes-a-brief-history-of-air-force-enlisted-ranks/' },
  afi2502: { label: 'AFI 36-2502, Enlisted Airman Promotion and Demotion Programs', url: 'https://static.e-publishing.af.mil/production/1/af_a1/publication/afi36-2502/afi36-2502.pdf' },
  afpcEnlisted: { label: 'AFPC, Enlisted Promotions', url: 'https://www.afpc.af.mil/Promotion/Enlisted-Promotions/' },
  btz: { label: 'Air Force, "Earn an extra stripe: Senior Airman Below the Zone"', url: 'https://www.af.mil/News/Article-Display/Article/2708869/earn-an-extra-stripe-senior-airman-below-the-zone/' },
  tigPoints: { label: 'Air Force, promotions eliminate time-in-grade and time-in-service points (2016)', url: 'https://www.af.mil/News/Article-Display/Article/1007644/air-force-promotions-eliminates-time-in-grade-time-in-service-points/' },
  snco2019: { label: 'Air Force ends promotion testing for E-7 and above (2019)', url: 'https://www.af.mil/News/Article-Display/Article/1747839/air-force-ends-promotion-testing-for-e-7-and-above/' },
  studyGuides: { label: 'USAF Enlisted Promotion Study Guides (WAPS catalogs)', url: 'https://www.studyguides.af.mil/' },
  cmsafMuseum: { label: 'National Museum of the USAF, Chief Master Sergeant of the Air Force', url: 'https://www.nationalmuseum.af.mil/Visit/Museum-Exhibits/Fact-Sheets/Display/Article/196839/chief-master-sergeant-of-the-air-force/' },
  airey: { label: 'Air Force biography, CMSAF Paul W. Airey', url: 'https://www.af.mil/About-Us/Biographies/Display/Article/107858/paul-wesley-airey/' },
  cmsafInsignia: { label: 'Air Force, "New CMSAF insignia debuts Nov. 1" (2004)', url: 'https://www.af.mil/News/Article-Display/Article/135714/new-cmsaf-insignia-debuts-nov-1/' },
  afi2109: { label: 'AFI 36-2109, Chief Master Sergeant of the Air Force, Command Chief and senior enlisted leader program', url: 'https://static.e-publishing.af.mil/production/1/af_cv/publication/afi36-2109/afi36-2109.pdf' },
  wo2024: { label: 'Air Force to re-introduce warrant officer rank (Feb. 2024)', url: 'https://www.af.mil/News/Article-Display/Article/3676887/air-force-to-re-introduce-warrant-officer-rank-other-major-changes/' },
  woGrads: { label: 'First Air Force warrant officers graduate (Dec. 2024)', url: 'https://www.af.mil/News/Article-Display/Article/3987738/first-air-force-warrant-officers-graduate-prepare-to-enter-force/' },
  wots: { label: 'Air Force Holm Center, Warrant Officer Training School', url: 'https://www.afaccessionscenter.af.mil/Holm-Center/Warrant-Officer-Program/WOTS/Cyber-WOTS/' },
  wotsSecond: { label: 'Air Force, "WOTS holds second graduation" (2025)', url: 'https://www.af.mil/News/Article-Display/Article/4123953/wots-holds-second-graduation/' },
  afgmWo: { label: 'AFGM 2026-36-2033, Air Force warrant officer guidance', url: 'https://static.e-publishing.af.mil/production/1/af_a1/publication/afgm2026-36-2033/afgm2026-36-2033.pdf' },
  afpcOfficer: { label: 'AFPC, Officer Promotions (developmental categories)', url: 'https://www.afpc.af.mil/Promotion/Officer-Promotions/' },
  devCats: { label: 'Air Force formalizes officer developmental categories (2019)', url: 'https://www.af.mil/News/Article-Display/Article/1993911/air-force-formalizes-officer-developmental-categories-effective-march-o-5-board/' },
  tioh: { label: 'The Institute of Heraldry, Officer Insignia of Rank: Origin', url: 'https://tioh.army.mil/Catalog/Heraldry.aspx?HeraldryId=15750&CategoryId=9171&grp=2&menu=Uniformed+Services' },
  insignia: { label: 'Department of War, U.S. Military Rank Insignia', url: 'https://www.war.gov/Resources/Insignias/' },
  usc601: { label: '10 U.S.C. 601, Positions of importance and responsibility', url: 'https://uscode.house.gov/view.xhtml?req=granuleid:USC-prelim-title10-section601&num=0&edition=prelim' },
  usc517: { label: '10 U.S.C. 517, Authorized daily average: members in pay grades E-8 and E-9', url: 'https://uscode.house.gov/view.xhtml?req=granuleid:USC-prelim-title10-section517&num=0&edition=prelim' },
  arnold: { label: 'Air Force biography, Gen. Henry H. Arnold', url: 'https://www.af.mil/About-Us/Biographies/Display/Article/107811/henry-h-arnold/' },
  arnoldMuseum: { label: 'National Museum of the USAF, Gen. Henry H. "Hap" Arnold', url: 'https://www.nationalmuseum.af.mil/Visit/Museum-Exhibits/Fact-Sheets/Display/Article/196848/gen-henry-h-hap-arnold/' },
  careerTip: { label: 'Joint Base Charleston, "Career Assistance Tip" (2011): enlisted promotion eligibility', url: 'https://www.jbcharleston.jb.mil/News/Commentaries/Display/Article/237818/career-assistance-tip/' },
  wikiEnlisted: { label: 'Wikipedia: United States Air Force enlisted rank insignia', url: 'https://en.wikipedia.org/wiki/United_States_Air_Force_enlisted_rank_insignia' },
  wikiAB: { label: 'Wikipedia: Airman basic', url: 'https://en.wikipedia.org/wiki/Airman_basic' },
  wikiA1C: { label: 'Wikipedia: Airman first class', url: 'https://en.wikipedia.org/wiki/Airman_first_class' },
  wikiSrA: { label: 'Wikipedia: Senior airman', url: 'https://en.wikipedia.org/wiki/Senior_airman' },
  wikiBTZ: { label: 'Wikipedia: Below the zone', url: 'https://en.wikipedia.org/wiki/Below_the_zone' },
  waps2026: { label: 'USAF Study Guides, WAPS catalog for the 2026 SSgt cycle', url: 'https://www.studyguides.af.mil/Portals/15/EPRRC/WAPS_2026_SSgt.pdf' },
  smsgt26: { label: 'AFPC, "Air Force releases Senior Master Sergeant promotion cycle statistics" (March 5, 2026)', url: 'https://www.afpc.af.mil/News/Article-Display/Article/4421561/air-force-releases-senior-master-sergeant-promotion-cycle-statistics/' },
  cmsafAug2026: { label: 'Air Force, "CMSAF announces EPME Modernization, additional enlisted force initiatives at AFSA Summit" (Aug. 11, 2026)', url: 'https://www.af.mil/News/Article-Display/Article/4569425/cmsaf-announces-epme-modernization-additional-enlisted-force-initiatives-at-afs/' },
  wikiWO: { label: 'Wikipedia: Warrant officer (United States)', url: 'https://en.wikipedia.org/wiki/Warrant_officer_(United_States)' },
  cw5: { label: 'Air Force Accessions Center, "Air Force welcomes first CW5 in 34 years" (Feb. 4, 2026)', url: 'https://www.afaccessionscenter.af.mil/News/Article-Display/Article/4397060/air-force-welcomes-first-cw5-in-34-years/' },
  wikiOfficer: { label: 'Wikipedia: United States Air Force officer rank insignia', url: 'https://en.wikipedia.org/wiki/United_States_Air_Force_officer_rank_insignia' },
  usc1370: { label: '10 U.S.C. 1370, Regular commissioned officers (retirement in grade)', url: 'https://uscode.house.gov/view.xhtml?req=granuleid:USC-prelim-title10-section1370&num=0&edition=prelim' },
  wikiGOA: { label: 'Wikipedia: General of the Army (United States)', url: 'https://en.wikipedia.org/wiki/General_of_the_Army_(United_States)' },
  wikiGAF: { label: 'Wikipedia: General of the Air Force', url: 'https://en.wikipedia.org/wiki/General_of_the_Air_Force' },
} satisfies Record<string, Source>;

const enlistedHistory1952 =
  'When the Air Force became a separate service in 1947 it kept the Army’s enlisted titles. Airmen tested the now-familiar upswept stripes at Bolling Field in March 1948, and Gen. Hoyt S. Vandenberg, then Chief of Staff, was briefed that 55 percent of 150 Airmen polled liked the design. On Feb. 20, 1950, he directed that enlisted members be called Airmen rather than Soldiers.';

export const rankDetails: RankDetail[] = [
  // ─── Enlisted ────────────────────────────────────────────────────────────────
  {
    branch: 'air-force',
    abbr: 'AB',
    slug: 'airman-basic',
    summary:
      'Airman Basic (E-1) is the entry grade for most people who enlist in the Air Force. An Airman Basic is learning the job: first at Basic Military Training at Joint Base San Antonio-Lackland, then in technical school, then under supervision at a first unit. The grade wears no stripes.',
    role: [
      'Completing Basic Military Training: drill, fitness, weapons handling, Air Force history and core values',
      'Attending technical training for an assigned Air Force Specialty Code (AFSC)',
      'Working under close supervision while earning the 3-skill (apprentice) level',
      'Meeting dress, fitness and conduct standards with no leadership responsibility yet',
      'Starting career development courses that later feed upgrade training',
    ],
    promotion:
      'Most recruits enter as Airman Basic. People who bring college credit, JROTC or Civil Air Patrol experience, or who enlist in certain programs can start at a higher grade, which the recruiter documents at enlistment. Advancement out of E-1 is not competitive: an Airman Basic who stays in good standing is promoted to Airman after six months time in grade under AFI 36-2502.',
    history: [
      enlistedHistory1952,
      'The April 24, 1952 revision of Air Force Regulation 39-36 gave the Air Force its own enlisted titles, and the E-1 grade became "basic airman." A new regulation on Feb. 5, 1959, changed the title to Airman Basic, and the grade still wore no insignia.',
      'Airman Basic has never worn an insignia of grade; the first stripe comes with promotion to Airman.',
    ],
    faq: [
      { q: 'What is an Airman Basic?', a: 'The lowest Air Force enlisted grade, E-1. It is the rank most new recruits hold during basic training and technical school. It has no insignia.' },
      { q: 'How long do you stay an Airman Basic?', a: 'Promotion to Airman (E-2) normally comes after six months in grade, as long as the Airman stays in good standing.' },
      { q: 'Can you skip Airman Basic?', a: 'Yes. Some enlistees qualify to start at E-2 or E-3 for things like college credit or JROTC. Ask a recruiter which programs apply, as the rules change.' },
    ],
    sources: [S.stripes, S.afi2502, S.insignia, S.careerTip, S.wikiAB, S.wikiA1C, S.wikiEnlisted],
    unverified: [],
  },
  {
    branch: 'air-force',
    abbr: 'Amn',
    slug: 'airman',
    summary:
      'Airman (E-2) is the second enlisted grade and the first with an insignia: a single stripe around a silver star. Most Airmen are finishing technical school or settling into a first unit, where they work under supervision and build basic job skills.',
    role: [
      'Finishing technical school or arriving at a first duty station',
      'Performing routine tasks in the career field under a trainer or supervisor',
      'Working on Career Development Courses toward the 5-skill (journeyman) level',
      'Taking part in unit details, readiness training and inspections',
      'Learning the standards of the Airman tier (E-1 to E-4)',
    ],
    promotion:
      'Promotion from Airman Basic to Airman is non-competitive. Under AFI 36-2502 an Airman Basic in good standing is promoted after six months time in grade. Some recruits enlist directly as Airman through an advanced enlistment grade program.',
    history: [
      enlistedHistory1952,
      'Under the 1952 structure, the E-2 grade was "airman third class." When the Air Staff reviewed enlisted ranks in 1967, it simplified the junior titles, and E-2 became "Airman."',
      'In 1975 the stars inside Airman-tier stripes (E-1 to E-4) were changed from silver to blue so they were hard to see. After Gen. Merrill McPeak’s 1991 recommendations, the visible star was returned to Airman insignia; the new stripes were mandatory for all by October 1997.',
    ],
    faq: [
      { q: 'What does an Airman (E-2) insignia look like?', a: 'One upswept stripe with a star in a circle at the center.' },
      { q: 'What is the difference between "Airman" the rank and "Airman" the title?', a: 'Every member of the Air Force is called an Airman. "Airman" with the abbreviation Amn is also the specific E-2 grade.' },
      { q: 'How long until an Airman makes Airman First Class?', a: 'Normally after 10 months as an Airman, provided the member stays in good standing.' },
    ],
    sources: [S.stripes, S.afi2502, S.insignia, S.careerTip],
    unverified: [],
  },
  {
    branch: 'air-force',
    abbr: 'A1C',
    slug: 'airman-first-class',
    summary:
      'Airman First Class (E-3) is the grade at which most Airmen become productive members of their work center. An A1C usually holds the 3-skill level, is working toward the 5-skill level, and is expected to know the job well enough to need less direction. The insignia is two stripes around a star.',
    role: [
      'Doing day-to-day work in the AFSC with growing independence',
      'Completing upgrade training and Career Development Courses for the 5-skill level',
      'Helping newer Airmen settle into the unit',
      'Supporting deployments, exercises and readiness inspections',
      'Preparing for Senior Airman and, for some, Below-the-Zone consideration',
    ],
    promotion:
      'Promotion from Airman to Airman First Class is non-competitive and normally comes after 10 months time in grade under AFI 36-2502. Recruits with enough college credit or certain qualifications can enlist directly as A1C. Some Airmen on six-year enlistments are promoted to A1C on completion of technical school or at a set point under the enlistment program in effect.',
    history: [
      enlistedHistory1952,
      'The 1952 structure used "airman first class" for the E-4 grade, with "airman second class" at E-3. The 1967 rank review moved the A1C title down to E-3, where it has stayed.',
      'Like the other Airman-tier grades, the A1C star was changed to blue in 1975 and made visible again under the changes recommended by Gen. Merrill McPeak in 1991, completed in 1997.',
    ],
    faq: [
      { q: 'What does A1C mean in the Air Force?', a: 'Airman First Class, the E-3 enlisted grade. It is shown by two stripes with a star.' },
      { q: 'Is Airman First Class higher than Airman?', a: 'Yes. Airman is E-2 and Airman First Class is E-3.' },
      { q: 'Can you join the Air Force as an A1C?', a: 'Some recruits can, for example with a qualifying amount of college credit. A recruiter can confirm current eligibility.' },
    ],
    sources: [S.stripes, S.afi2502, S.insignia, S.careerTip, S.wikiA1C],
    unverified: [],
  },
  {
    branch: 'air-force',
    abbr: 'SrA',
    slug: 'senior-airman',
    summary:
      'Senior Airman (E-4) is the top of the Airman tier and the grade where most Airmen become skilled journeymen. A Senior Airman is not a noncommissioned officer, but is expected to supervise informally, train others and prepare for NCO duties. The insignia is three stripes around a star.',
    role: [
      'Working at the 5-skill (journeyman) level with little supervision',
      'Training and mentoring Airmen in the work center',
      'Completing Airman Leadership School, required before taking on NCO responsibilities',
      'Serving as a shift lead, crew member or team member on deployments',
      'Testing for Staff Sergeant once eligible',
    ],
    promotion:
      'Promotion to Senior Airman is not competitive for most. Under AFI 36-2502 an Airman First Class becomes eligible after 36 months time in service and 20 months time in grade, or 28 months time in grade, whichever comes first, with the commander’s recommendation. The Below-the-Zone (BTZ) program lets commanders promote a limited share of Airmen (15 percent of the eligible population) six months early; each Airman gets one BTZ chance.',
    history: [
      enlistedHistory1952,
      'Senior Airman came out of the 1975 decision to divide the enlisted force into three tiers: Airmen (E-1 to E-4), NCOs (E-4 to E-6) and senior NCOs (E-7 to E-9). E-4 was split between Senior Airman, who was not an NCO, and Sergeant, who was. Senior Airman wore a blue star; Sergeant wore silver. The split was approved on Dec. 30, 1975, and took effect on June 1, 1976.',
      'In 1991 Chief of Staff Gen. Merrill A. McPeak eliminated the E-4 Sergeant rank, citing imbalances in the force, leaving Senior Airman as the only E-4. He also recommended returning a visible star to Airman-tier stripes; that change was mandatory by October 1997.',
    ],
    faq: [
      { q: 'What is a Senior Airman?', a: 'The E-4 grade in the Air Force: an experienced journeyman who is not yet an NCO but is expected to train and lead informally.' },
      { q: 'Is a Senior Airman an NCO?', a: 'No. In the Air Force NCO status begins at Staff Sergeant (E-5). The E-4 Sergeant rank, which was an NCO grade, ended in 1991.' },
      { q: 'What is Below the Zone?', a: 'A one-time chance to be promoted to Senior Airman six months before the normal date. Commanders select a limited share of eligible Airmen.' },
    ],
    sources: [S.stripes, S.btz, S.afi2502, S.insignia, S.careerTip, S.wikiSrA, S.wikiBTZ, S.wikiEnlisted],
    unverified: [],
  },
  {
    branch: 'air-force',
    abbr: 'SSgt',
    slug: 'staff-sergeant',
    summary:
      'Staff Sergeant (E-5) is the first noncommissioned officer grade in the Air Force. A Staff Sergeant is a trained craftsman or near-craftsman who supervises Airmen, signs off on their training and is accountable for the work of a small team. The insignia is four stripes around a star.',
    role: [
      'First-line supervisor for a small team of Airmen',
      'Writing performance evaluations and tracking upgrade training',
      'Working toward the 7-skill (craftsman) level',
      'Shift supervisor, crew chief or team lead, depending on the career field',
      'Enforcing standards and taking care of the Airmen in the section',
    ],
    promotion:
      'Staff Sergeant is competitive and decided through the Weighted Airman Promotion System (WAPS). Senior Airmen who meet minimum time-in-grade and time-in-service requirements (six months in grade and three years of service) test in the cycle; scores combine the Promotion Fitness Exam and, in many AFSCs, a Specialty Knowledge Test, plus points from the Enlisted Performance Brief promotion recommendation and decorations. Time-in-grade and time-in-service points were removed from the formula in 2016. A limited number of Airmen are promoted through the Stripes for Exceptional Performers (STEP) program. Airman Leadership School must be complete.',
    history: [
      enlistedHistory1952,
      'Staff Sergeant is one of the titles the Air Force kept from the Army when it set its own enlisted structure in 1952. From 1975 to 1991 the NCO tier started at E-4 with the Sergeant rank; after the Sergeant rank was eliminated in 1991, Staff Sergeant became the first NCO grade.',
      'The insignia, four upswept stripes around a star, follows the design approved in 1948.',
    ],
    faq: [
      { q: 'Is Staff Sergeant an NCO in the Air Force?', a: 'Yes. It is the first NCO grade. In the Air Force, E-4 Senior Airmen are not NCOs.' },
      { q: 'What is WAPS?', a: 'The Weighted Airman Promotion System. For Staff and Technical Sergeant it ranks eligible Airmen by test scores and performance points within each career field.' },
      { q: 'How long does it take to make Staff Sergeant?', a: 'It varies widely by career field and by each year’s selection rate. The minimum is three years of service and six months as a Senior Airman.' },
    ],
    sources: [S.afi2502, S.afpcEnlisted, S.tigPoints, S.studyGuides, S.waps2026, S.careerTip, S.stripes],
    unverified: [],
  },
  {
    branch: 'air-force',
    abbr: 'TSgt',
    slug: 'technical-sergeant',
    summary:
      'Technical Sergeant (E-6) is a senior NCO in all but name: an experienced craftsman who leads a section or flight element, manages training and resources, and is the technical authority in the work center. The insignia is five stripes around a star.',
    role: [
      'Section chief or NCO in charge of a work center',
      'Holding the 7-skill (craftsman) level and acting as the technical expert',
      'Managing schedules, equipment and training plans',
      'Supervising Staff Sergeants and Airmen and writing their evaluations',
      'Serving as an instructor, recruiter or in another special-duty assignment',
    ],
    promotion:
      'Promotion to Technical Sergeant runs through WAPS. Staff Sergeants with the required time in grade (23 months) and time in service (five years) test with the Promotion Fitness Exam and, where applicable, a Specialty Knowledge Test, and are scored with performance and decoration points. Selection rates vary by AFSC. Some are promoted through the STEP program. NCO Academy timing rules apply for later promotion.',
    history: [
      enlistedHistory1952,
      'Technical Sergeant is another Army-era title the Air Force kept in its 1952 enlisted structure. Under the three-tier model adopted in 1975, it is the top grade of the NCO tier.',
      'Its five-stripe insignia has kept the 1948 basic design; the senior NCO grades above it gained top chevrons instead of extra lower stripes.',
    ],
    faq: [
      { q: 'What does a Technical Sergeant do?', a: 'Leads a work section, trains and evaluates the people in it and is the go-to technical expert for the career field.' },
      { q: 'What is the difference between a Staff Sergeant and a Technical Sergeant?', a: 'Technical Sergeant is one grade higher (E-6), usually with more years and a 7-skill level, and typically leads a larger section.' },
      { q: 'Is TSgt a senior NCO?', a: 'No. Senior NCO status in the Air Force begins at Master Sergeant (E-7).' },
    ],
    sources: [S.afi2502, S.afpcEnlisted, S.studyGuides, S.careerTip, S.stripes],
    unverified: [],
  },
  {
    branch: 'air-force',
    abbr: 'MSgt',
    slug: 'master-sergeant',
    summary:
      'Master Sergeant (E-7) is the first senior NCO grade. A Master Sergeant manages people and programs rather than tasks, often as a flight chief or superintendent, and is a common pick for first sergeant duty. The insignia has five stripes below a star and one chevron above.',
    role: [
      'Flight chief, section superintendent or senior enlisted manager',
      'First sergeant, advising the commander on the health and discipline of a unit',
      'Managing budgets, manpower and training programs',
      'Mentoring NCOs and preparing them for promotion',
      'Representing the enlisted force in unit leadership meetings',
    ],
    promotion:
      'Since 2019, starting with that year’s E-9 cycle, the Air Force has not used promotion testing for E-7 to E-9. Technical Sergeants who meet the time-in-grade (24 months) and time-in-service (eight years) minimums meet a central evaluation board that scores their record, including recent evaluations and decorations, much like an officer board. Senior NCO Academy and other education gates are set in AFI 36-2502.',
    history: [
      enlistedHistory1952,
      'Master Sergeant was the top Air Force enlisted grade in the 1952 structure until the Military Pay Act of 1958 added E-8 and E-9.',
      'Under Gen. Merrill McPeak’s early-1990s recommendations, senior NCO stripes were reworked so that one stripe moved from the bottom to a chevron at the top, giving all three senior grades the same base. Master Sergeant’s single top chevron dates from that change, which was mandatory for all by October 1997.',
    ],
    faq: [
      { q: 'Is a Master Sergeant a senior NCO?', a: 'Yes. In the Air Force, Master Sergeant (E-7) is the first senior NCO grade.' },
      { q: 'Do you still test for Master Sergeant?', a: 'No. Testing for E-7 and above ended with the 2019 cycles; selection is by central evaluation board.' },
      { q: 'What is the diamond on some Master Sergeant stripes?', a: 'A diamond in the center marks a first sergeant, a special duty that Master Sergeants and above can hold. The diamond was approved in 1954.' },
    ],
    sources: [S.snco2019, S.afi2502, S.afpcEnlisted, S.careerTip, S.stripes],
    unverified: [],
  },
  {
    branch: 'air-force',
    abbr: 'SMSgt',
    slug: 'senior-master-sergeant',
    summary:
      'Senior Master Sergeant (E-8) is the second senior NCO grade. A "Senior" usually runs enlisted operations for a squadron or a large function, works directly with commanders, and shapes how Airmen are trained and employed. The insignia has five stripes below a star and two chevrons above.',
    role: [
      'Squadron or group superintendent',
      'Senior enlisted manager of a large maintenance, operations or support function',
      'First sergeant or other senior special-duty position',
      'Advising commanders on enlisted manning, discipline and training',
      'Developing Master Sergeants and NCOs for higher responsibility',
    ],
    promotion:
      'Master Sergeants with the required time in grade (20 months) and time in service (11 years) meet a central evaluation board; testing for E-8 ended under the same 2019 policy that ended it for E-7 and E-9. Law caps the number of E-8s across the force at a small share of enlisted strength, which keeps selection rates low. The Air Force published an 11.07 percent selection rate for the 2026 SMSgt cycle.',
    history: [
      enlistedHistory1952,
      'The Military Pay Act of 1958 created pay grades E-8 and E-9 for every service. The Air Force put the new grades in place with the titles Senior Master Sergeant and Chief Master Sergeant, recommended by the major commands, and added top chevrons to tell them apart.',
      'The current two-chevron design came from the early-1990s rework of senior NCO stripes, made mandatory in October 1997.',
    ],
    faq: [
      { q: 'What is a Senior Master Sergeant called?', a: 'Usually "Senior" in conversation. The abbreviation is SMSgt.' },
      { q: 'When was Senior Master Sergeant created?', a: 'The E-8 grade was created by the Military Pay Act of 1958.' },
      { q: 'How hard is it to make SMSgt?', a: 'Selection rates are low because E-8 numbers are limited by law. Recent cycles have selected around one in ten eligible Master Sergeants.' },
    ],
    sources: [S.stripes, S.snco2019, S.usc517, S.afpcEnlisted, S.smsgt26, S.careerTip],
    unverified: [],
  },
  {
    branch: 'air-force',
    abbr: 'CMSgt',
    slug: 'chief-master-sergeant',
    summary:
      'Chief Master Sergeant (E-9) is the highest Air Force enlisted grade. Chiefs lead the enlisted force at group, wing and higher levels, advise commanders and manage entire career fields. The insignia has five stripes below a star and three chevrons above.',
    role: [
      'Group or wing superintendent, or senior enlisted leader of a major function',
      'Career field manager at a major command or the Air Staff',
      'Command Chief Master Sergeant (a separate billet; see its own page)',
      'Advising commanders on readiness, discipline and enlisted policy',
      'Mentoring Senior Master Sergeants and senior NCOs',
    ],
    promotion:
      'Senior Master Sergeants with the required time in grade (21 months) and time in service (14 years) meet a central board; there has been no testing for E-9 since the 2019 cycle. By law, E-9s may make up only about 1 percent of the enlisted force, so selection is very competitive. Starting with the 2026 cycle, the Air Force uses the board’s order of merit to fill vacancies when a selectee declines.',
    history: [
      enlistedHistory1952,
      'Chief Master Sergeant was created with the E-9 grade by the Military Pay Act of 1958. The Air Force chose the title on the recommendation of its major commands.',
      'Chief stripes originally had extra chevrons on top of the older design. The early-1990s senior NCO rework gave Chiefs today’s five stripes, star and three top chevrons, required for all by October 1997.',
    ],
    faq: [
      { q: 'What is the highest enlisted rank in the Air Force?', a: 'Chief Master Sergeant (E-9). The Chief Master Sergeant of the Air Force is a single E-9 billet above all other Chiefs.' },
      { q: 'How many Chief Master Sergeants are there?', a: 'Federal law limits E-9s to about 1 percent of the enlisted force.' },
      { q: 'What are Chief Master Sergeants called?', a: 'Usually "Chief."' },
    ],
    sources: [S.stripes, S.snco2019, S.usc517, S.afi2109, S.cmsafAug2026, S.careerTip],
    unverified: [],
  },
  {
    branch: 'air-force',
    abbr: 'CCM',
    slug: 'command-chief-master-sergeant',
    summary:
      'Command Chief Master Sergeant is a position, not a separate pay grade. It is held by a Chief Master Sergeant chosen as the senior enlisted leader of a wing, numbered air force, major command or similar headquarters, who advises that commander on everything affecting the enlisted force. It has its own variant of the Chief insignia.',
    role: [
      'Senior enlisted advisor to a wing, numbered air force or major command commander',
      'Representing the enlisted force on the commander’s staff',
      'Advising on readiness, morale, discipline, training and quality of life',
      'Overseeing first sergeants and senior enlisted leaders in the command',
      'Visiting units and carrying Airmen’s concerns back to leadership',
    ],
    promotion:
      'There is no promotion to Command Chief. Chief Master Sergeants apply or are nominated, and commanders select a candidate for the billet. Under AFI 36-2109, only Chiefs holding the command chief reporting identifier (9E000) and assigned to a valid command chief position may use the title and wear the insignia; approval sits with AF/A1LE for the Regular Air Force and with the Reserve and Guard headquarters for those components.',
    history: [
      'The position grew out of the older major command senior enlisted advisers. According to a 2004 Air Force article, Chief Master Sergeant of the Air Force Eric Benken created the command chief position from those billets in November 1998 and gave it a star in the top field of the stripe.',
      'By 2004 the command chief insignia was distinctive enough that it was cited as one reason for redesigning the CMSAF stripe, so that the service’s top enlisted leader would stand out.',
    ],
    faq: [
      { q: 'Is Command Chief a rank?', a: 'No. It is a duty position held by a Chief Master Sergeant (E-9). Pay is the same as other E-9s.' },
      { q: 'How is the Command Chief insignia different?', a: 'It adds a star in the upper blue field of the Chief stripes, between the top chevrons, to mark the command billet.' },
      { q: 'What does a wing command chief do?', a: 'Advises the wing commander on the enlisted force and acts as the senior enlisted voice for the wing.' },
    ],
    sources: [S.afi2109, S.cmsafInsignia, S.wikiEnlisted],
    unverified: [],
  },
  {
    branch: 'air-force',
    abbr: 'CMSAF',
    slug: 'chief-master-sergeant-of-the-air-force',
    summary:
      'The Chief Master Sergeant of the Air Force is a single billet: the Air Force’s highest-ranking enlisted member and the senior enlisted advisor to the Chief of Staff and the Secretary of the Air Force. One Airman holds it at a time, with a unique insignia and its own basic pay rate.',
    role: [
      'Advising the Chief of Staff and Secretary on the welfare, readiness and use of the enlisted force',
      'Representing enlisted Airmen to Congress, other services and the public',
      'Shaping enlisted policy, professional military education and promotion programs',
      'Visiting units worldwide to hear from Airmen and families',
      'Leading the network of command chiefs and career field managers',
    ],
    promotion:
      'There is no promotion test or board for CMSAF. The Chief of Staff selects one Chief Master Sergeant, usually a serving command chief, from nominees. For the first selection in 1967 there were 21 major command nominees. Basic pay for the billet is set separately from the E-9 table.',
    history: [
      'Chief of Staff Gen. John P. McConnell announced the position on Oct. 24, 1966. Chief Master Sgt. Paul W. Airey became the first CMSAF on April 3, 1967, and served until July 31, 1969.',
      'The creation of CMSAF prompted a wider 1967 review of enlisted rank titles. The original CMSAF stripe surrounded the lower star with a laurel wreath.',
      'A redesigned insignia was first worn on Nov. 1, 2004, by the 14th CMSAF, Gerald R. Murray. It kept the chevrons and wreathed star and added the Great Seal of the United States and two stars in the upper field.',
    ],
    faq: [
      { q: 'Who was the first Chief Master Sergeant of the Air Force?', a: 'Paul W. Airey, who took office on April 3, 1967.' },
      { q: 'Does the CMSAF outrank officers?', a: 'No. The CMSAF is an enlisted member. The position carries great influence as the Chief of Staff’s senior enlisted advisor, but no command authority over officers.' },
      { q: 'What does the CMSAF insignia look like?', a: 'Chief stripes with a wreath around the lower star, and the Great Seal of the United States with two stars in the upper field.' },
    ],
    sources: [S.cmsafMuseum, S.airey, S.cmsafInsignia, S.stripes, S.afi2109, S.wikiEnlisted],
    unverified: [],
  },

  // ─── Warrant officers ────────────────────────────────────────────────────────
  {
    branch: 'air-force',
    abbr: 'WO1',
    slug: 'warrant-officer-1',
    summary:
      'Warrant Officer 1 (W-1) is the entry grade of the Air Force’s reintroduced warrant officer corps. Air Force warrant officers are technical specialists in information technology and cyber fields who stay hands-on in their specialty instead of moving into general management.',
    role: [
      'Technical expert in warfighting communications and IT systems (AFSC 17W)',
      'Technical expert in cyber effects and warfare operations (AFSC 17Y)',
      'Advising commanders on technical capability and risk',
      'Mentoring enlisted members in the specialty',
      'Bridging enlisted operators and commissioned officers on technical work',
    ],
    promotion:
      'Candidates apply from the enlisted force, are selected by a board, and complete the eight-week Warrant Officer Training School at Maxwell Air Force Base, Ala. Applicants for 17W needed at least 24 months of documented enterprise IT or warfighter communications experience; 17Y applicants needed senior-level proficiency in a U.S. Cyber Command work role or NSA equivalent. Depending on experience, graduates are appointed either as Warrant Officer 1 or directly as Chief Warrant Officer 2; the first class included both. Under AFGM 2026-36-2033, W-1 is appointed by warrant.',
    history: [
      'The Air Force inherited warrant officers from the Army in 1947 but stopped appointing them in 1959, as senior enlisted grades and officers absorbed their work.',
      'On Feb. 12, 2024, Chief of Staff Gen. David W. Allvin announced at the Air Force Association Warfare Symposium that warrant officers would return in IT and cyber fields. The first 30 graduates (22 active duty, six Air National Guard and two Reserve) finished WOTS on Dec. 6, 2024; a second class of 30 graduated on March 13, 2025.',
    ],
    faq: [
      { q: 'Does the Air Force have warrant officers?', a: 'Yes, again. They were reintroduced in 2024 for cyber and IT career fields after a gap of more than six decades.' },
      { q: 'How do you become an Air Force warrant officer?', a: 'Enlisted members in qualifying fields apply, are selected by a board and complete Warrant Officer Training School.' },
      { q: 'Is a Warrant Officer 1 commissioned?', a: 'No. Under current Air Force guidance W-1 is appointed by warrant; W-2 and above are commissioned.' },
    ],
    sources: [S.wo2024, S.woGrads, S.wotsSecond, S.wots, S.afgmWo, S.wikiWO],
    unverified: [],
  },
  {
    branch: 'air-force',
    abbr: 'CWO2',
    slug: 'chief-warrant-officer-2',
    summary:
      'Chief Warrant Officer 2 (W-2) is the first commissioned warrant grade in the Air Force. A CWO2 is a proven technical specialist in IT or cyber operations who leads technical work, advises commanders and trains enlisted teams.',
    role: [
      'Lead technical specialist for a cyber or communications mission',
      'Designing, securing or operating complex networks and systems',
      'Advising squadron and group leaders on technical options',
      'Developing training for enlisted operators',
      'Serving as the unit’s continuity on technical matters',
    ],
    promotion:
      'Under AFGM 2026-36-2033, W-2 through W-5 are commissioned grades. Some Warrant Officer Training School graduates are appointed directly as CWO2 on the strength of their experience, as in the first class of December 2024; others start as WO1 and move up to CWO2 after the time in grade set by current Air Force warrant officer guidance.',
    history: [
      'The Air Force carried Army warrant officers into the new service in 1947 and stopped appointing them in 1959.',
      'Warrant officers returned under the 24 decisions announced on Feb. 12, 2024, beginning with the 17W and 17Y cyber and IT specialties. The first Warrant Officer Training School class graduated on Dec. 6, 2024.',
      'The first two Warrant Officer Training School classes each graduated 30 candidates, drawn from the active duty Air Force, Air National Guard and Air Force Reserve. Classes continue on a published schedule at Maxwell.',
    ],
    faq: [
      { q: 'What is the difference between WO1 and CWO2?', a: 'W-1 is appointed by warrant; Chief Warrant Officer 2 and above are commissioned.' },
      { q: 'What jobs do Air Force warrant officers do?', a: 'For now, warfighting communications and IT systems (17W) and cyber effects and warfare operations (17Y).' },
      { q: 'Do Air Force warrant officers command units?', a: 'They are technical leaders and advisors. The program is built to keep them in their specialty rather than in command roles.' },
    ],
    sources: [S.afgmWo, S.wo2024, S.woGrads, S.wots, S.wikiWO],
    unverified: [],
  },
  {
    branch: 'air-force',
    abbr: 'CWO3',
    slug: 'chief-warrant-officer-3',
    summary:
      'Chief Warrant Officer 3 (W-3) is a senior technical grade authorized under the Air Force’s warrant officer program. Because the program restarted only in 2024, the new corps is still made up mostly of officers in the first two grades.',
    role: [
      'Senior technical advisor at group, wing or higher level',
      'Leading complex cyber or IT projects across several units',
      'Setting technical standards and procedures for the specialty',
      'Mentoring junior warrant officers',
      'Linking operational units with acquisition and engineering staffs',
    ],
    promotion:
      'Promotion to W-3 follows Air Force warrant officer guidance. Because the corps restarted in 2024, the first classes are still building the time in grade needed to compete. Experienced warrant officers can also join from another service, as the Air Force’s first active-duty CW5 did in January 2026.',
    history: [
      'Warrant grades above W-2 were part of Air Force structure in its early years, before appointments stopped in 1959.',
      'The 2024 reintroduction authorized the full W-1 to W-5 range, with the first graduates entering the force in early 2025.',
      'Air Force warrant officers in the 17W and 17Y specialties are meant to stay technical throughout their careers. At W-3, the expectation is broader influence: designing how systems are used across several units rather than running a single team.',
    ],
    faq: [
      { q: 'Are there any Air Force CWO3s?', a: 'The grade is authorized. The first classes from the reintroduced corps are still early in their warrant careers, so few would yet have the time in grade to reach it through promotion.' },
      { q: 'How is CWO3 different from CWO2?', a: 'A CWO3 has more experience and usually advises at a higher level, across more units.' },
      { q: 'Is a CWO3 an officer?', a: 'Yes. Chief warrant officers are commissioned.' },
    ],
    sources: [S.afgmWo, S.wo2024, S.woGrads, S.wikiWO, S.cw5],
    unverified: [],
  },
  {
    branch: 'air-force',
    abbr: 'CWO4',
    slug: 'chief-warrant-officer-4',
    summary:
      'Chief Warrant Officer 4 (W-4) is a senior warrant grade authorized for the reintroduced Air Force warrant officer corps. It is meant for highly experienced technical leaders who advise at senior headquarters.',
    role: [
      'Senior technical advisor to wing, numbered air force or major command leaders',
      'Shaping cyber and IT architecture and policy',
      'Overseeing technical training across a specialty',
      'Mentoring junior warrant officers and enlisted experts',
      'Representing the Air Force in joint technical work',
    ],
    promotion:
      'Promotion to W-4 follows Air Force warrant officer guidance. With the corps restarted in 2024, members of the first classes are still years from reaching it. Experienced warrant officers can also transfer in from another service, as the Air Force’s first active-duty CW5 did in January 2026.',
    history: [
      'The Air Force kept warrant grades from the Army in 1947 and ended appointments in 1959.',
      'The 2024 reintroduction authorized the full range of grades, with W-3 to W-5 expected to fill as the first cohorts gain experience.',
      'The warrant officer path was built to keep experienced cyber and IT experts in uniform. A CWO4 would have spent many years in the specialty, often more than a decade as a warrant officer after an enlisted career.',
    ],
    faq: [
      { q: 'What does a CWO4 do?', a: 'Advises senior commanders on technical matters in the specialty and guides other warrant officers.' },
      { q: 'Is CWO4 above a Chief Master Sergeant?', a: 'Warrant officers rank above all enlisted grades, but they have different roles; a Chief leads the enlisted force.' },
      { q: 'How long does it take to make CWO4?', a: 'The Air Force has not yet published timelines based on actual promotions in the new corps.' },
    ],
    sources: [S.afgmWo, S.wo2024, S.wikiWO, S.cw5],
    unverified: [],
  },
  {
    branch: 'air-force',
    abbr: 'CWO5',
    slug: 'chief-warrant-officer-5',
    summary:
      'Chief Warrant Officer 5 (W-5) is the highest warrant grade authorized for the Air Force. It is intended for master technical leaders who advise at the highest levels of the service on cyber and IT matters.',
    role: [
      'Senior technical advisor to major command or Air Staff leaders',
      'Leading the development of the warrant officer specialty',
      'Advising on force structure and training for the warrant corps',
      'Representing Air Force technical expertise in joint and interagency settings',
      'Mentoring the entire warrant officer community',
    ],
    promotion:
      'No one has yet reached W-5 through the new corps’ own promotions. The grade was first filled on active duty on Jan. 30, 2026, when Jason Godwin, an Army CW5, transferred to the Air Force to advise at Warrant Officer Training School.',
    history: [
      'The W-5 grade was created by the Warrant Officer Management Act, signed on Dec. 5, 1991, long after the Air Force had stopped appointing warrant officers. The Air Force’s last warrant officer, a Reserve CW4, was promoted to CW5 as an honor when he retired in 1992; no Airman held the grade in active service until 2026.',
      'It became part of Air Force structure with the 2024 reintroduction of warrant officers.',
      'In the other services that use it, W-5 is a small grade held by master-level technical leaders at senior headquarters. The Air Force has not published how many W-5 positions it will authorize.',
    ],
    faq: [
      { q: 'Is there a CWO5 in the Air Force?', a: 'Yes. Jason Godwin became the first active-duty Air Force CW5 when he transferred from the Army in January 2026.' },
      { q: 'What is the highest warrant officer rank?', a: 'Chief Warrant Officer 5.' },
      { q: 'Do warrant officers outrank lieutenants?', a: 'Commissioned officers (O-1 and above) are senior to warrant officers by law, though warrant officers usually have far more experience in their field.' },
    ],
    sources: [S.afgmWo, S.wo2024, S.wikiWO, S.cw5],
    unverified: [],
  },

  // ─── Officers ────────────────────────────────────────────────────────────────
  {
    branch: 'air-force',
    abbr: '2d Lt',
    slug: 'second-lieutenant',
    summary:
      'Second Lieutenant (O-1) is the entry grade for commissioned officers. New lieutenants come from the Air Force Academy, Air Force ROTC or Officer Training School and spend their first years in technical training and an initial assignment, learning to lead Airmen. The insignia is a single gold bar.',
    role: [
      'Student in initial skills training, such as pilot training or a support course',
      'Flight commander or deputy in a support or operations squadron',
      'Section officer in charge of a work center',
      'Learning to lead NCOs and Airmen and to manage resources',
      'Completing early professional development courses',
    ],
    promotion:
      'Officers are commissioned as Second Lieutenants on graduating from the Academy, AFROTC or OTS. Promotion to First Lieutenant is not by competitive board: officers who are fully qualified are promoted after about two years of service.',
    history: [
      'The Air Force kept the Army’s officer titles and insignia when it became independent in 1947.',
      'The Second Lieutenant had no grade insignia until December 1917, when the Army adopted the gold bar, following the precedent of the gold leaf already used by majors.',
    ],
    faq: [
      { q: 'How do you become a Second Lieutenant in the Air Force?', a: 'Through the Air Force Academy, Air Force ROTC at a college, or Officer Training School after a degree.' },
      { q: 'Why is the Second Lieutenant bar gold?', a: 'When the bar was adopted in 1917 it followed the gold of the major’s leaf; the gold signals the junior grade of each pair.' },
      { q: 'How long until a Second Lieutenant becomes a First Lieutenant?', a: 'About two years for officers who remain fully qualified.' },
    ],
    sources: [S.tioh, S.insignia, S.afpcOfficer, S.wikiOfficer],
    unverified: [],
  },
  {
    branch: 'air-force',
    abbr: '1st Lt',
    slug: 'first-lieutenant',
    summary:
      'First Lieutenant (O-2) is the second officer grade. A First Lieutenant has finished initial training and is gaining experience as a flight commander, section leader or crew member. The insignia is a single silver bar.',
    role: [
      'Flight commander or assistant flight commander',
      'Aircrew member gaining flying hours and qualifications',
      'Officer in charge of a section in a support squadron',
      'Project officer in acquisition or engineering units',
      'Supervising NCOs and reviewing enlisted evaluations',
    ],
    promotion:
      'Second Lieutenants are promoted to First Lieutenant without a competitive board after about two years if they remain fully qualified. Promotion to Captain also follows a set timeline for fully qualified officers.',
    history: [
      'The single bar for First Lieutenant dates to 1836, when the Army adopted shoulder straps for field wear. It was gold until 1872, when the bars of captains and first lieutenants were changed to silver to match senior officers’ silver devices.',
      'The Air Force kept the grade and insignia when it separated from the Army in 1947.',
      'Most officers spend their First Lieutenant years in their first operational assignment. For pilots, much of this period is spent in undergraduate and follow-on flying training before reaching a line squadron.',
    ],
    faq: [
      { q: 'What is a First Lieutenant in the Air Force?', a: 'The O-2 grade, held by officers typically in their second to fourth years of service.' },
      { q: 'Which is higher, a gold bar or a silver bar?', a: 'Silver. The silver bar of First Lieutenant outranks the gold bar of Second Lieutenant.' },
      { q: 'Is there a board for First Lieutenant?', a: 'No. It is a fully qualified promotion based on time in grade.' },
    ],
    sources: [S.tioh, S.insignia, S.afpcOfficer, S.wikiOfficer],
    unverified: [],
  },
  {
    branch: 'air-force',
    abbr: 'Capt',
    slug: 'captain',
    summary:
      'Captain (O-3) is the grade where most Air Force officers become experienced in their specialty: instructor pilots, mission commanders, flight commanders and program managers. The insignia is two silver bars joined together.',
    role: [
      'Aircraft commander, instructor or evaluator in flying units',
      'Flight commander leading a large team of Airmen',
      'Program manager or engineer in acquisition',
      'Staff officer at wing or headquarters level',
      'Completing Squadron Officer School',
    ],
    promotion:
      'First Lieutenants who remain fully qualified are promoted to Captain after a set period, roughly four years of commissioned service. Promotion past Captain is competitive by central board.',
    history: [
      'Two bars for Captain were adopted with Army shoulder straps in 1836. Like the First Lieutenant’s bar, they changed from gold to silver in 1872.',
      'The Air Force retained the insignia in 1947, and it is shared today with the Army, Marine Corps and Space Force.',
      'Captains usually learn which developmental category they will compete in at their first board. Pilots, combat systems officers, air battle managers and remotely piloted aircraft pilots fall under Air Operations and Special Warfare; cyber, intelligence, weather and public affairs officers under Information Warfare; engineers and acquisition managers under Force Modernization.',
    ],
    faq: [
      { q: 'How long does it take to make Captain in the Air Force?', a: 'Roughly four years from commissioning for officers who remain fully qualified.' },
      { q: 'Is an Air Force Captain the same as a Navy Captain?', a: 'No. Air Force Captain is O-3. A Navy Captain is O-6, equal to an Air Force Colonel.' },
      { q: 'What is Squadron Officer School?', a: 'The Air Force’s primary professional military education course for Captains.' },
    ],
    sources: [S.tioh, S.insignia, S.afpcOfficer, S.wikiOfficer],
    unverified: [],
  },
  {
    branch: 'air-force',
    abbr: 'Maj',
    slug: 'major',
    summary:
      'Major (O-4) is the first field grade officer rank. Majors serve as squadron directors of operations, senior staff officers and flight leaders, and are being prepared for squadron command. The insignia is a gold oak leaf.',
    role: [
      'Squadron director of operations or assistant director',
      'Senior staff officer at wing, numbered air force or major command',
      'Instructor at Air Force schools or the Academy',
      'Program element monitor or lead program manager',
      'Attending intermediate developmental education such as Air Command and Staff College',
    ],
    promotion:
      'Promotion to Major is by central selection board. Since 2019 most line officers compete within a developmental category rather than as one large group: Air Operations and Special Warfare, Combat Support, Force Modernization, Information Warfare, Nuclear and Missile Operations, and Cross Functional Operations. Each category gets its own promotion opportunity. Selectees are nominated by the President and confirmed by the Senate.',
    history: [
      'Oak leaves for majors and lieutenant colonels were adopted by the Army in 1836. When shoulder-strap borders changed in 1851, the major’s leaf became gold and the lieutenant colonel’s silver.',
      'In October 2019 the Air Force split the single Line of the Air Force promotion category, which then covered about 80 percent of officers, into six categories, first used at the March 2020 lieutenant colonel board.',
    ],
    faq: [
      { q: 'Is Major a field grade officer?', a: 'Yes. Field grade officers are Majors, Lieutenant Colonels and Colonels.' },
      { q: 'Why is the Major’s leaf gold if it ranks below silver?', a: 'The color split dates to an 1851 Army uniform change and has stayed since.' },
      { q: 'How are Air Force Majors selected?', a: 'By a central selection board within each developmental category.' },
    ],
    sources: [S.tioh, S.afpcOfficer, S.devCats],
    unverified: [],
  },
  {
    branch: 'air-force',
    abbr: 'Lt Col',
    slug: 'lieutenant-colonel',
    summary:
      'Lieutenant Colonel (O-5) is the grade at which most Air Force squadron commanders serve. A Lieutenant Colonel leads hundreds of Airmen or a major staff division. The insignia is a silver oak leaf.',
    role: [
      'Squadron commander',
      'Deputy group commander',
      'Division chief at a major command or the Air Staff',
      'Senior instructor or department head at an Air Force school',
      'Joint staff officer at a combatant command',
    ],
    promotion:
      'Promotion to Lieutenant Colonel is by central selection board within the officer’s developmental category. The first board under the new categories met in March 2020 and considered more than 2,600 officers. Selectees are nominated by the President and confirmed by the Senate. Senior developmental education usually follows.',
    history: [
      'The leaf for lieutenant colonel dates to 1836; it became silver after the 1851 change in shoulder-strap borders.',
      'The March 2020 lieutenant colonel board was the first Air Force board to use the six line developmental categories announced in 2019.',
      'Line officers compete in one of six developmental categories: Air Operations and Special Warfare (pilots, combat systems officers, air battle managers, remotely piloted aircraft pilots and special warfare officers), Combat Support, Force Modernization, Information Warfare, Nuclear and Missile Operations, and Cross Functional Operations. Judge advocates, chaplains and medical officers have their own categories.',
    ],
    faq: [
      { q: 'What does an Air Force Lieutenant Colonel do?', a: 'Most commonly commands a squadron or leads a staff division.' },
      { q: 'How do you address a Lieutenant Colonel?', a: '"Colonel" in conversation.' },
      { q: 'What insignia does a Lieutenant Colonel wear?', a: 'A silver oak leaf.' },
    ],
    sources: [S.tioh, S.devCats, S.afpcOfficer],
    unverified: [],
  },
  {
    branch: 'air-force',
    abbr: 'Col',
    slug: 'colonel',
    summary:
      'Colonel (O-6) is the senior field grade. Colonels command groups and wings, run directorates at major commands and serve as senior advisors on joint staffs. The insignia is a silver eagle.',
    role: [
      'Group commander',
      'Wing commander or vice wing commander',
      'Director or deputy director at a major command or the Air Staff',
      'Senior faculty or commandant at Air University schools',
      'Senior staff officer in joint and combatant command headquarters',
    ],
    promotion:
      'Lieutenant Colonels compete for Colonel at a central selection board within their developmental category. Selectees are nominated by the President and confirmed by the Senate. Command and senior developmental education strongly shape selection.',
    history: [
      'The eagle for colonels was adopted by the Army in 1832, taken from the eagle on the Coat of Arms of the United States, and has been worn by Air Force colonels since 1947.',
      'Since 2019 a Colonel board is run separately for each line developmental category, so a pilot competes against other Air Operations and Special Warfare officers rather than against engineers or logisticians. Each category is given its own promotion opportunity.',
      'Wing commander is the best-known Colonel billet. A wing usually includes operations, maintenance, mission support and medical groups, each led by a Colonel or Lieutenant Colonel, and a Command Chief Master Sergeant who advises the wing commander on the enlisted force.',
    ],
    faq: [
      { q: 'What is a "full bird" colonel?', a: 'An informal name for a Colonel (O-6), from the eagle insignia, to distinguish them from Lieutenant Colonels.' },
      { q: 'Does a Colonel command a wing?', a: 'Many wings are commanded by Colonels; some larger wings are commanded by Brigadier Generals.' },
      { q: 'What is the insignia of a Colonel?', a: 'A silver eagle.' },
    ],
    sources: [S.tioh, S.afpcOfficer, S.devCats],
    unverified: [],
  },
  {
    branch: 'air-force',
    abbr: 'Brig Gen',
    slug: 'brigadier-general',
    summary:
      'Brigadier General (O-7) is the first general officer grade. Brigadier Generals command large wings or serve as deputy commanders and directors at major commands, combatant commands and the Pentagon. The insignia is one silver star.',
    role: [
      'Commander of a large wing or center',
      'Deputy commander of a numbered air force',
      'Director on a major command or Air Staff headquarters',
      'Senior position in a joint or combatant command staff',
      'Program executive officer in acquisition',
    ],
    promotion:
      'Colonels are selected by a general officer promotion board, nominated by the President and confirmed by the Senate. The number of general officers is limited by law.',
    history: [
      'Stars as general officer insignia date to June 18, 1780, when the Continental Army prescribed one star for brigadier generals and two for major generals on their epaulettes.',
      'The Air Force kept the grade and insignia in 1947.',
      'A Brigadier General is often the first grade at which an officer leaves their career field and moves into broader joint or enterprise positions.',
    ],
    faq: [
      { q: 'Is a Brigadier General a one-star?', a: 'Yes. Brigadier General is the one-star grade, O-7.' },
      { q: 'How are Brigadier Generals chosen?', a: 'By a selection board, then nomination by the President and Senate confirmation.' },
      { q: 'How do you address a Brigadier General?', a: '"General."' },
    ],
    sources: [S.tioh, S.insignia],
    unverified: [],
  },
  {
    branch: 'air-force',
    abbr: 'Maj Gen',
    slug: 'major-general',
    summary:
      'Major General (O-8) is the two-star general officer grade. Major Generals command numbered air forces and large centers and serve in senior staff roles at the Pentagon and in joint commands. The insignia is two silver stars.',
    role: [
      'Commander of a numbered air force or major center',
      'Director on the Air Staff or a joint staff',
      'Vice commander of a major command',
      'Senior acquisition or program leader',
      'Senior positions in combatant commands',
    ],
    promotion:
      'Brigadier Generals are considered by a selection board, nominated by the President and confirmed by the Senate. Major General is the highest permanent grade; three- and four-star grades are tied to specific positions.',
    history: [
      'The two stars of a major general were prescribed by the Continental Army on June 18, 1780, making them among the oldest U.S. rank insignia still in use.',
      'Major Generals commonly lead numbered air forces, large centers such as acquisition or test centers, and directorates on the Air Staff and Joint Staff. Promotion from one star to two is by selection board, while three and four stars depend on nomination to a designated position.',
    ],
    faq: [
      { q: 'Is a Major General higher than a Lieutenant General?', a: 'No. Major General is two stars; Lieutenant General is three.' },
      { q: 'Why does a Major General outrank a Brigadier General but not a Lieutenant General?', a: 'The titles come from older Army usage; the number of stars is the reliable guide.' },
      { q: 'Does a Major General need Senate confirmation?', a: 'Yes.' },
    ],
    sources: [S.tioh, S.usc601],
    unverified: [],
  },
  {
    branch: 'air-force',
    abbr: 'Lt Gen',
    slug: 'lieutenant-general',
    summary:
      'Lieutenant General (O-9) is the three-star grade, held only while serving in a designated position of importance and responsibility, such as commander of a major command, a numbered air force with joint duties, or a senior Pentagon office. The insignia is three silver stars.',
    role: [
      'Commander of a major command or large component',
      'Deputy chief of staff on the Air Staff',
      'Senior joint staff or combatant command positions',
      'Director of large defense agencies',
      'Commander of a numbered air force that also serves as a joint component',
    ],
    promotion:
      'Three-star grade is not reached by a promotion board. The President nominates an officer for a specific position designated under 10 U.S.C. 601, and the Senate confirms the officer in that grade while holding the position.',
    history: [
      'The Air Force inherited the three-star grade from the Army in 1947. The grade is tied to a position by law rather than held permanently.',
      'Because three-star grade belongs to the position, an officer who leaves a three-star job without moving to another must normally retire or revert to the permanent grade. Retiring in the grade requires the Secretary of Defense to certify in writing that the officer served satisfactorily in it.',
    ],
    faq: [
      { q: 'How many stars is a Lieutenant General?', a: 'Three.' },
      { q: 'Is Lieutenant General a permanent rank?', a: 'No. It is held in a designated position. An officer may retire in the grade if the Senate approves.' },
      { q: 'How is a Lieutenant General picked?', a: 'Nominated by the President for a specific job and confirmed by the Senate.' },
    ],
    sources: [S.usc601, S.usc1370, S.insignia],
    unverified: [],
  },
  {
    branch: 'air-force',
    abbr: 'Gen',
    slug: 'general',
    summary:
      'General (O-10) is the four-star grade and the highest active Air Force rank. Four-star generals serve as Chief of Staff, Vice Chief of Staff, commanders of the largest major commands and commanders of joint combatant commands. The insignia is four silver stars.',
    role: [
      'Chief of Staff of the Air Force, a member of the Joint Chiefs of Staff',
      'Vice Chief of Staff of the Air Force',
      'Commander of a major command such as Air Combat Command',
      'Commander of a unified combatant command',
      'Chairman or Vice Chairman of the Joint Chiefs (when held by an Airman)',
    ],
    promotion:
      'Like three-star rank, four-star grade is tied to a designated position under 10 U.S.C. 601. The President nominates and the Senate confirms the officer for that position.',
    history: [
      'The Air Force inherited the four-star grade from the Army in 1947, along with the rest of the Army’s officer grade structure. General officer stars trace back to the Continental Army’s 1780 order prescribing stars for generals.',
      'A five-star grade, General of the Air Force, was held only by Henry H. Arnold and is not a current grade.',
    ],
    faq: [
      { q: 'What is the highest rank in the Air Force?', a: 'General (four stars) is the highest active rank. General of the Air Force (five stars) was held only by Hap Arnold.' },
      { q: 'Who leads the Air Force?', a: 'The Chief of Staff of the Air Force, a four-star General, under the civilian Secretary of the Air Force.' },
      { q: 'How many four-star generals does the Air Force have?', a: 'It varies with designated positions; the number is limited by law.' },
    ],
    sources: [S.usc601, S.insignia, S.arnold],
    unverified: [],
  },
  {
    branch: 'air-force',
    abbr: 'GAF',
    slug: 'general-of-the-air-force',
    summary:
      'General of the Air Force was a five-star grade held by only one person: Henry H. "Hap" Arnold, who led the Army Air Forces through World War II. It is a historical grade and is not used today.',
    role: [
      'Honor recognizing Arnold’s wartime leadership of the Army Air Forces',
      'Highest grade ever held by an Air Force officer',
      'Equivalent in precedence to General of the Army and Fleet Admiral',
      'No billets exist for the grade today',
    ],
    promotion:
      'There is no promotion path. Five-star grades in all services were created by Congress for specific wartime leaders. Arnold’s Air Force title was conferred by legislation signed by President Harry S. Truman in 1949.',
    history: [
      'Arnold commanded the Army Air Forces during World War II and was promoted to the five-star grade of General of the Army in December 1944.',
      'After the Air Force became independent, Congress made him General of the Air Force on May 7, 1949, making him the only person to hold five-star rank in two U.S. services. He died at his home in Sonoma, Calif., on Jan. 15, 1950.',
      'Other five-star grades created for World War II leaders were General of the Army and Fleet Admiral. No officer has been promoted to a five-star grade in any U.S. service since Omar Bradley became General of the Army in September 1950.',
    ],
    faq: [
      { q: 'Who was the only General of the Air Force?', a: 'Henry H. "Hap" Arnold, made General of the Air Force in 1949.' },
      { q: 'Is there a five-star general in the Air Force today?', a: 'No. The grade has not been used since Arnold.' },
      { q: 'Why was Hap Arnold given five stars?', a: 'For leading the Army Air Forces through World War II and his role in creating an independent Air Force.' },
    ],
    sources: [S.arnold, S.arnoldMuseum, S.wikiGAF, S.wikiGOA],
    unverified: [],
  },
];

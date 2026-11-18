import type { RankDetail, Source } from '../../types';

/**
 * Written content for each U.S. Marine Corps rank page. Joined to `ranks.ts` by branch + abbr.
 * All prose is original. Facts come from marines.mil, Manpower and Reserve Affairs, MARADMINs,
 * the Marine Corps History Division and federal law; anything not confirmed is in `unverified`.
 */

const S = {
  ranks: { label: 'marines.mil: Ranks', url: 'https://www.marines.mil/Ranks/' },
  sgtBelow: { label: 'Manpower and Reserve Affairs: Sergeant and Below Promotions', url: 'https://www.manpower.marines.mil/Divisions/Manpower-Management/Performance-Branch/Promotion-Section/Enlisted-Promotions/Sergeants-and-Below-Promotions/' },
  snco: { label: 'Manpower and Reserve Affairs: Staff NCO Promotions', url: 'https://www.manpower.marines.mil/Divisions/Manpower-Management/Performance-Branch/Promotion-Section/Enlisted-Promotions/Staff-NCO-Promotions/' },
  promMan: { label: 'MCO P1400.32D w/ Ch 1-2, Marine Corps Promotion Manual, Vol 2 (Enlisted)', url: 'https://www.marines.mil/portals/1/Publications/MCO%20P1400.32D%20W%20CH%201-2.pdf' },
  m222: { label: 'MARADMIN 222/26: Sergeant TIS and Staff Sergeant promotion changes', url: 'https://www.marines.mil/News/Messages/Messages-Display/Article/4487012/forthcoming-changes-to-time-in-service-requirement-for-promotion-to-sergeant-an/' },
  jepes: { label: 'MARADMIN 505/20: Junior Enlisted Performance Evaluation implementation', url: 'https://www.marines.mil/News/Messages/Messages-Display/Article/2334563/junior-enlisted-performance-evaluation-implementation/' },
  gunner27: { label: 'MARADMIN 077/26: FY27 Enlisted to CWO2 Marine Gunner Selection Board', url: 'https://www.marines.mil/News/Messages/Messages-Display/Article/4418021/fiscal-year-2027-fy27-enlisted-to-chief-warrant-officer-2-cwo2-marine-gunner-se/' },
  e8pilot: { label: 'MARADMIN: FY27 E8 Redesignation Board Pilot', url: 'https://www.marines.mil/News/Messages/Messages-Display/Article/4553680/solicitation-of-applications-to-the-fiscal-year-2027-fy27-e8-redesignation-boar/' },
  sgtMajBoard: { label: 'MARADMIN: FY27 Sergeant Major and First Sergeant SNCO Promotion Selection Board', url: 'https://www.marines.mil/News/Messages/Messages-Display/Article/4579436/fy27-sergeant-major-and-first-sergeant-staff-noncommissioned-officer-snco-promo/' },
  mgysgtSlate: { label: 'MARADMIN: FY27 Master Gunnery Sergeant high visibility billet slate', url: 'https://www.marines.mil/News/Messages/Messages-Display/Article/4515855/announcement-of-billet-vacancies-for-fiscal-year-2027-master-gunnery-sergeant-h/' },
  smmcHist: { label: 'Sergeant Major of the Marine Corps: History', url: 'https://www.smmc.marines.mil/History/' },
  bestwick: { label: 'Sergeant Major of the Marine Corps: Wilbur Bestwick', url: 'https://www.smmc.marines.mil/History/Article/553774/wilbur-bestwick/' },
  chron4764: { label: 'Marine Corps History Division: A Chronology of the U.S. Marine Corps, 1947-1964', url: 'https://www.marines.mil/Portals/1/Publications/A%20Chronology%20of%20the%20United%20States%20Marine%20Corps%201947-1964%20%20PCN%2019000318200.pdf' },
  ww1chron: { label: 'Marine Corps History Division: Chronology, World War I 1917-1919', url: 'https://www.usmcu.edu/Research/Marine-Corps-History-Division/Research-Tools-Facts-and-Figures/Chronologies-of-the-Marine-Corps/World-War-I-1917-1919/' },
  fourStar: { label: 'Marine Corps History Division: Four Star Generals of the Marine Corps', url: 'https://www.usmcu.edu/Research/Marine-Corps-History-Division/People/Four-Star-Generals-of-the-Marine-Corps/' },
  tiohOfficer: { label: 'The Institute of Heraldry: Officer Insignia of Grade (notes Marine insignia parallel the Army)', url: 'https://tioh.army.mil/Catalog/HeraldryMulti.aspx?CategoryId=9170&grp=2&menu=Uniformed+Services' },
  tiohOrigin: { label: 'The Institute of Heraldry: Officer Insignia of Rank, Origin', url: 'https://tioh.army.mil/Catalog/Heraldry.aspx?HeraldryId=15750&CategoryId=9171&grp=2&menu=Uniformed+Services' },
  tiohWarrant: { label: 'The Institute of Heraldry: Insignia of Grade, Warrant Officers (Warrant Officer Management Act)', url: 'https://tioh.army.mil/Catalog/HeraldryMulti.aspx?CategoryId=9186&grp=2&menu=Uniformed+Services' },
  uniformRegs: { label: 'MCO 1020.34H, Marine Corps Uniform Regulations', url: 'https://www.marines.mil/portals/1/Publications/MCO%201020.34H%20v2.pdf?ver=2018-06-26-094038-137' },
  usc619: { label: '10 U.S.C. 619, Eligibility for consideration for promotion', url: 'https://www.law.cornell.edu/uscode/text/10/619' },
  usc624: { label: '10 U.S.C. 624, Promotions: how made', url: 'https://www.law.cornell.edu/uscode/text/10/624' },
  usc601: { label: '10 U.S.C. 601, Positions of importance and responsibility', url: 'https://www.law.cornell.edu/uscode/text/10/601' },
  usc571: { label: '10 U.S.C. 571, Warrant officer grades (W-5 limit)', url: 'https://www.law.cornell.edu/uscode/text/10/571' },
  m389: { label: 'MARADMIN 389/26: FY27 Master Gunnery Sergeant and Master Sergeant SNCO Promotion Selection Board', url: 'https://www.marines.mil/News/Messages/Messages-Display/Article/4582041/fy27-master-gunnery-sergeant-and-master-sergeant-staff-noncommissioned-officer/' },
  sncoSched27: { label: 'MARADMIN 365/26: FY27 Staff Noncommissioned Officer Promotion Board Schedule and Policies', url: 'https://www.marines.mil/News/Messages/Messages-Display/Article/4573434/fy27-staff-noncommissioned-officer-promotion-board-schedule-and-policies/' },
  cplSgtAuth: { label: 'MARADMIN: March 2024 Regular Corporal and Sergeant Promotion Authority', url: 'https://www.marines.mil/News/Messages/Messages-Display/Article/3687067/march-2024-regular-corporal-and-sergeant-promotion-authority/' },
  ewsDep: { label: 'Marine Corps University CDET: Expeditionary Warfare School Distance Education Program', url: 'https://www.usmcu.edu/Colleges-and-Schools/College-of-Distance-Education-and-Training-CDET/Expeditionary-Warfare-School-DEP/' },
  ltcolCsb: { label: 'MARADMIN 344/26: FY27 Lieutenant Colonel Command Screening Board Results', url: 'https://www.marines.mil/News/Messages/Messages-Display/Article/4558335/fiscal-year-2027-lieutenant-colonel-command-screening-board-results/' },
  rsco: { label: 'MARADMIN: FY27 Recruiting Station Commanding Officer Selection Board Results', url: 'https://www.marines.mil/News/Messages/Messages-Display/Article/4528979/fiscal-year-2027-recruiting-station-commanding-officer-selection-board-results/' },
  mcrcWo: { label: 'Marine Corps Recruiting Command: Officer Naval and Enlisted Applicants', url: 'https://www.mcrc.marines.mil/Marine-Officer/Officer-Naval-Enlisted-Applicants/' },
  commandants: { label: 'Marine Corps History Division: Commandants of the Marine Corps', url: 'https://www.usmcu.edu/Research/Marine-Corps-History-Division/People/Commandants/' },
  wInsignia: { label: 'Wikipedia: United States Marine Corps rank insignia', url: 'https://en.wikipedia.org/wiki/United_States_Marine_Corps_rank_insignia' },
  wPfc: { label: 'Wikipedia: Private first class', url: 'https://en.wikipedia.org/wiki/Private_first_class' },
  wLcpl: { label: 'Wikipedia: Lance corporal', url: 'https://en.wikipedia.org/wiki/Lance_corporal' },
  wGysgt: { label: 'Wikipedia: Gunnery sergeant', url: 'https://en.wikipedia.org/wiki/Gunnery_sergeant' },
  wMgysgt: { label: 'Wikipedia: Master gunnery sergeant', url: 'https://en.wikipedia.org/wiki/Master_gunnery_sergeant' },
  w1stsgt: { label: 'Wikipedia: First sergeant', url: 'https://en.wikipedia.org/wiki/First_sergeant' },
  wSgtmaj: { label: 'Wikipedia: Sergeant major', url: 'https://en.wikipedia.org/wiki/Sergeant_major' },
  wSmmc: { label: 'Wikipedia: Sergeant Major of the Marine Corps', url: 'https://en.wikipedia.org/wiki/Sergeant_Major_of_the_Marine_Corps' },
  wWo: { label: 'Wikipedia: Warrant officer (United States)', url: 'https://en.wikipedia.org/wiki/Warrant_officer_(United_States)' },
  wTbs: { label: 'Wikipedia: The Basic School', url: 'https://en.wikipedia.org/wiki/The_Basic_School' },
  wDopma: { label: 'Wikipedia: Defense Officer Personnel Management Act', url: 'https://en.wikipedia.org/wiki/Defense_Officer_Personnel_Management_Act' },
  wNicholas: { label: 'Wikipedia: Samuel Nicholas', url: 'https://en.wikipedia.org/wiki/Samuel_Nicholas' },
  wLtgen: { label: 'Wikipedia: Lieutenant general (United States)', url: 'https://en.wikipedia.org/wiki/Lieutenant_general_(United_States)' },
} satisfies Record<string, Source>;

const mc = 'marine-corps' as const;

export const rankDetails: RankDetail[] = [
  // ─── Enlisted ────────────────────────────────────────────────────────────────
  {
    branch: mc,
    abbr: 'Pvt',
    slug: 'private',
    summary:
      "Private (E-1) is the starting rank for most Marines. Privates have no rank insignia; they are recruits in training or new Marines just out of recruit training and learning their military occupational specialty.",
    role: [
      'Recruit at Marine Corps Recruit Depot Parris Island or San Diego',
      'Student at the School of Infantry and an MOS school',
      'Junior rifleman or member of a fire team in a first unit',
      'Learns and lives the Marine Corps standards of conduct, drill and uniform',
      'Takes the physical and combat fitness tests and qualifies on the rifle range',
    ],
    promotion:
      "Most enlistees begin as privates. Some qualify through recruiting programs to enlist at a higher grade, such as private first class, and a recruit can be meritoriously promoted at recruit training. A private needs six months in grade and six months of service, counted from the first day of the month of entry on active duty, to be promoted to private first class, as long as the commander judges the Marine's performance satisfactory.",
    history: [
      "Privates have made up the ranks of the Marine Corps since its founding in 1775 and its re-establishment in 1798. The grade has never carried a chevron.",
      "In the modern grade structure the private sits at E-1. Marines refer to the newest private by rank even before the Eagle, Globe and Anchor is earned at the end of recruit training.",
    ],
    faq: [
      { q: 'Do Marine privates wear rank insignia?', a: 'No. The private (E-1) has no insignia. The first chevron comes with promotion to private first class.' },
      { q: 'How long is a Marine a private?', a: 'Six months of service and time in grade is the minimum for promotion to private first class, with the commander\'s approval.' },
      { q: 'Can you join the Marines above private?', a: 'Yes. Some recruits contract for entry as a private first class, and recruits can be meritoriously promoted during training.' },
    ],
    sources: [S.ranks, S.sgtBelow, S.promMan],
    unverified: [],
  },
  {
    branch: mc,
    abbr: 'PFC',
    slug: 'private-first-class',
    summary:
      "Private First Class (E-2) is the first Marine rank with insignia, a single chevron. Most Marines reach it shortly after recruit training and hold it while finishing MOS school or settling into a first unit.",
    role: [
      'Rifleman, machine gunner, mortarman or support Marine in a fire team or section',
      'Student or new graduate of an MOS school',
      'Performs duties under the direction of lance corporals and NCOs',
      'Maintains personal weapon and gear to inspection standard',
      'Builds proficiency for promotion to lance corporal',
    ],
    promotion:
      "Promotion to PFC is by the commander, not a board. The Marine needs six months in grade and six months of service, measured from the first day of the month the Marine entered active duty, and the commander must find the Marine's performance satisfactory. Reserve privates follow the same six-month rule from the start of initial active duty for training. Some Marines enter at this grade through their enlistment contract.",
    history: [
      "The Marine Corps added private first class around the end of World War I to match the Army rank of the same name; sources differ on whether the change came in 1917 or 1918. It sits at E-2 in the Marine Corps, one grade lower than the Army PFC, because the Marine Corps keeps lance corporal as a separate E-3 rank.",
      "The single chevron is worn on the uniform sleeves of service and dress coats and as a pin-on on the collar of the utility uniform, placed as the Marine Corps Uniform Regulations prescribe.",
    ],
    faq: [
      { q: 'How long does it take to make PFC in the Marines?', a: 'Six months of service and six months in grade, with the commander\'s recommendation.' },
      { q: 'Is a Marine PFC the same as an Army PFC?', a: 'No. A Marine PFC is E-2; an Army PFC is E-3. The Marine E-3 is lance corporal.' },
      { q: 'What does the Marine PFC insignia look like?', a: 'A single chevron, with no crossed rifles.' },
    ],
    sources: [S.ranks, S.sgtBelow, S.promMan, S.uniformRegs, S.wPfc],
    unverified: [],
  },
  {
    branch: mc,
    abbr: 'LCpl',
    slug: 'lance-corporal',
    summary:
      "Lance Corporal (E-3) is the most common rank in the Marine Corps. Lance corporals are the experienced workers of fire teams and sections, often filling in for NCOs and training newer Marines.",
    role: [
      'Senior rifleman or automatic rifleman in a fire team',
      'Acting fire team leader when no corporal is present',
      'Skilled operator in an MOS such as motor transport, communications or aviation maintenance',
      'Trains and supervises privates and PFCs on routine tasks',
      'Completes the PME and training that feed the promotion score for corporal',
    ],
    promotion:
      "Promotion to LCpl is by the commander, not a board. The minimums are 8 months in grade as a PFC and 9 months of service, and the Marine must be otherwise qualified. From LCpl, the move to corporal is competitive and based on the Junior Enlisted Performance Evaluation System (JEPES) score.",
    history: [
      "Lance corporal began as a temporary appointment: from the 1830s a Marine could be named lance corporal while still paid as a private, and the title stayed in informal use until private first class made it redundant. The 1958 grade restructuring, phased in from the start of 1959, brought it back as a permanent E-3 rank.",
      "The lance corporal's chevron with crossed rifles beneath it is a distinctly Marine design. Crossed rifles were added to the E-3 through E-8 chevrons in 1959 and appear on every Marine chevron from lance corporal through gunnery sergeant and master sergeant.",
    ],
    faq: [
      { q: 'How long does it take to make lance corporal?', a: 'At least 8 months as a PFC and 9 months of service, approved by the commander.' },
      { q: 'Is a lance corporal an NCO?', a: 'No. Marine NCOs begin at corporal (E-4).' },
      { q: 'Why does the Army not have lance corporals?', a: 'The Marine Corps kept lance corporal as a separate E-3 rank; the Army uses Private First Class at E-3.' },
    ],
    sources: [S.ranks, S.sgtBelow, S.promMan, S.chron4764, S.wLcpl, S.wInsignia],
    unverified: [],
  },
  {
    branch: mc,
    abbr: 'Cpl',
    slug: 'corporal',
    summary:
      "Corporal (E-4) is the first noncommissioned officer rank in the Marine Corps. A corporal usually leads a four-Marine fire team and is directly responsible for the training, welfare and discipline of those Marines.",
    role: [
      'Fire team leader in a rifle squad',
      'Section or crew leader in a weapons, vehicle or aviation unit',
      'NCO in charge of a small shop or work center',
      'Enforces standards and conducts daily training',
      'Attends the Corporals Course and leads by example',
    ],
    promotion:
      "Promotion to Cpl is competitive. A lance corporal needs at least 12 months in grade and 12 months of service and must be PME complete. Each month, Manpower and Reserve Affairs publishes cutting scores by MOS, and Marines whose JEPES score meets the cutoff are selected. JEPES weighs warfighting, physical toughness, mental agility and command input equally. A meritorious promotion is possible at 6 months of service.",
    history: [
      "Corporals served in the Continental Marines from 1775. The grade-structure change that took effect on 1 January 1959 moved the ranks from corporal through master sergeant up one pay grade each, which is how corporal went from E-3 to E-4.",
      "In 2021 JEPES replaced the old composite score for corporal and sergeant promotions. MARADMIN 505/20 announced the change, and the first scores were run in calendar year 2021.",
    ],
    faq: [
      { q: 'How long does it take to make corporal in the Marines?', a: 'At least 12 months as a lance corporal and 12 months of service, then a JEPES score at or above the monthly cutting score for the MOS.' },
      { q: 'What is a Marine corporal\'s job?', a: 'To lead a fire team and take full responsibility for the Marines in it.' },
      { q: 'What is a cutting score?', a: 'The minimum JEPES score needed in a given MOS that month. HQMC sets it based on how many corporals the MOS needs.' },
    ],
    sources: [S.ranks, S.sgtBelow, S.jepes, S.chron4764, S.cplSgtAuth, S.wInsignia],
    unverified: [],
  },
  {
    branch: mc,
    abbr: 'Sgt',
    slug: 'sergeant',
    summary:
      "Sergeant (E-5) is the senior Marine NCO below the staff ranks. In the infantry, a sergeant leads a rifle squad made up of fire teams; in other fields, a sergeant runs a section or shop.",
    role: [
      'Rifle squad leader',
      'Section leader in a weapons, logistics or aviation unit',
      'Drill instructor or recruiter on special duty assignment',
      'Supervises and counsels corporals and lance corporals',
      'Plans and runs squad or section training',
    ],
    promotion:
      "Promotion to Sgt is competitive. A corporal needs 12 months in grade and, under MARADMIN 222/26, 30 months of service, effective 1 October 2026 for active and reserve Marines alike; older references may still show the previous 48-month rule. The Marine must be PME complete. Like corporal, selection depends on the monthly JEPES cutting score for the MOS. A meritorious promotion is possible at 18 months of service.",
    history: [
      "Sergeants have served since the Corps' founding. The 1 January 1959 grade change moved the rank to E-5, where it remains.",
      "Recent policy has shifted the timeline repeatedly. In fiscal year 2020 the service raised the time-in-service minimum for sergeant from 24 to 48 months. MARADMIN 222/26 cut it to 30 months from 1 October 2026, saying the higher bar had rewarded longevity over performance.",
    ],
    faq: [
      { q: 'How long does it take to make sergeant in the Marines?', a: 'From 1 October 2026 the minimum is 30 months of service and 12 months as a corporal, then the Marine must make the monthly cutting score.' },
      { q: 'What does a Marine sergeant do?', a: 'Leads a rifle squad or a section and trains and counsels the corporals and lance corporals in it.' },
      { q: 'Did the Marine Corps change sergeant promotions?', a: 'Yes. MARADMIN 222/26 reduced the time-in-service requirement from 48 to 30 months effective 1 October 2026.' },
    ],
    sources: [S.ranks, S.m222, S.sgtBelow, S.jepes, S.cplSgtAuth],
    unverified: [],
  },
  {
    branch: mc,
    abbr: 'SSgt',
    slug: 'staff-sergeant',
    summary:
      "Staff Sergeant (E-6) is the first staff noncommissioned officer rank. In the infantry a staff sergeant is usually a platoon sergeant; in other fields, a staff sergeant often runs a section or shop and is the career Marine the unit leans on.",
    role: [
      'Platoon sergeant in a rifle or weapons platoon',
      'Section chief or shop staff NCO in charge',
      'Drill instructor, recruiter or Marine Security Guard detachment commander',
      'Advises the platoon commander on training and discipline',
      'Mentors sergeants and corporals',
    ],
    promotion:
      "Promotion to SSgt is by an annual selection board convened by Headquarters Marine Corps. The board, a colonel as president and 20 other voting members, reviews each eligible sergeant's record and votes by intended MOS against a set number of allocations. Sergeants who have finished the Sergeants School distance program can be selected and then complete the resident Sergeants School or seminar; for FY26 selectees that window is 270 days after results. Starting with FY27 the board no longer selects alternates.",
    history: [
      "Staff sergeant became E-6 when the grade structure changed on 1 January 1959. The insignia, three chevrons with one rocker and crossed rifles, has been the same since then.",
      "The Marine Corps publishes a schedule of SNCO selection boards each fiscal year. For FY27 there are separate active-duty boards for staff sergeant, gunnery sergeant, first sergeant and sergeant major, and master sergeant and master gunnery sergeant, with reserve Marines considered by their own boards.",
    ],
    faq: [
      { q: 'How do you make staff sergeant in the Marines?', a: 'Through an annual selection board at Headquarters Marine Corps that votes on records by MOS.' },
      { q: 'What is a SNCO?', a: 'A staff noncommissioned officer, a Marine in grades E-6 through E-9.' },
      { q: 'Does the staff sergeant board pick alternates?', a: 'Not from FY27 on. MARADMIN 222/26 replaced the alternate list with an adjusted allocation model.' },
    ],
    sources: [S.ranks, S.snco, S.m222, S.sncoSched27],
    unverified: [],
  },
  {
    branch: mc,
    abbr: 'GySgt',
    slug: 'gunnery-sergeant',
    summary:
      "Gunnery Sergeant (E-7) is the senior enlisted Marine at company level after the first sergeant. The company gunnery sergeant runs logistics, training schedules and field operations, and gunnys across the Corps are known as the working heart of their units.",
    role: [
      'Company gunnery sergeant',
      'Operations chief or senior SNCO of a section',
      'Platoon sergeant in a weapons platoon',
      'Senior drill instructor or chief instructor at a school',
      'Indicates on annual evaluations whether to pursue the first sergeant or master sergeant track',
    ],
    promotion:
      "Promotion to GySgt is by an annual Headquarters Marine Corps selection board that reviews staff sergeants' records against allocations by MOS. Marines selected via sequenced PME must complete their required course before pinning on. Gunnery sergeants mark their preferred track for E-8 on their annual evaluations: first sergeant for command, master sergeant for technical leadership. The gunnery sergeant board meets once a year at Quantico on the schedule HQMC publishes for each fiscal year.",
    history: [
      "The title dates to the late 1890s and reflected the gunnery duties of Marines in ships' detachments; sources give either 1898 or the Navy Personnel Act of March 1899 as the start. It was dropped in favor of technical sergeant after World War II, and the 1958 to 1959 grade reorganization revived it and placed it at E-7.",
      "The insignia shows three chevrons and two rockers with crossed rifles between them. The bursting bomb, by contrast, belongs to the master gunnery sergeant and the Marine Gunner.",
    ],
    faq: [
      { q: 'What does a gunnery sergeant do?', a: 'Runs a company\'s logistics, training and field operations as the company gunnery sergeant, or leads a technical section.' },
      { q: 'Why are gunnery sergeants called Gunny?', a: 'Gunny is a common, respectful nickname for gunnery sergeants, used informally among Marines.' },
      { q: 'How is a gunnery sergeant promoted?', a: 'By an annual HQMC selection board.' },
    ],
    sources: [S.ranks, S.snco, S.chron4764, S.sncoSched27, S.wGysgt],
    unverified: [],
  },
  {
    branch: mc,
    abbr: 'MSgt',
    slug: 'master-sergeant',
    summary:
      "Master Sergeant (E-8) is the technical track at the E-8 grade. A master sergeant gives occupational leadership in an MOS, typically as an operations chief or senior technical advisor.",
    role: [
      'Operations chief at battalion, regiment or group',
      'Senior technical expert in an MOS',
      'Advises officers on the employment of the specialty',
      'Develops the SNCOs and NCOs in the field',
      'Candidate for the master gunnery sergeant board',
    ],
    promotion:
      "Master sergeants are selected by an annual HQMC board for master sergeant and master gunnery sergeant, separate from the first sergeant board. Meritorious promotion to master sergeant is limited to the Drill Instructor of the Year and Recruiter of the Year programs. A pilot program for FY27 allows qualified master sergeants to apply for redesignation to the first sergeant track.",
    history: [
      "Master sergeant was among the ranks moved up one pay grade when the 1958 reorganization created the E-8 and E-9 grades, taking effect from the start of 1959.",
      "Since then E-8 has had two ranks: master sergeant for technical leadership and first sergeant for command. The master sergeant wears three chevrons and three rockers with crossed rifles.",
    ],
    faq: [
      { q: 'What is the difference between a master sergeant and a first sergeant?', a: 'Both are E-8. A master sergeant is a technical leader in an MOS; a first sergeant is the senior enlisted Marine in a company.' },
      { q: 'Can a master sergeant switch to first sergeant?', a: 'Starting with FY27, a pilot board lets qualified master sergeants apply for redesignation.' },
      { q: 'Can a Marine be meritoriously promoted to master sergeant?', a: 'Only through the Drill Instructor and Recruiter of the Year programs.' },
    ],
    sources: [S.ranks, S.snco, S.e8pilot, S.chron4764, S.m389, S.wInsignia],
    unverified: [],
  },
  {
    branch: mc,
    abbr: '1stSgt',
    slug: 'first-sergeant',
    summary:
      "First Sergeant (E-8) is the command track at the E-8 grade. The first sergeant is the senior enlisted Marine in a company, battery or similar unit and the commander's advisor on discipline, administration, morale and welfare.",
    role: [
      'Senior enlisted Marine of a company, battery or detachment',
      'Advises the company commander on discipline and welfare',
      'Oversees administration and enlisted readiness',
      'Mentors the company\'s SNCOs and NCOs',
      'Represents the Marines of the company to the commander',
    ],
    promotion:
      "First sergeants are selected by the annual HQMC sergeant major and first sergeant board, which for FY27 convened on 20 October 2026 at Quantico. Meritorious promotion to first sergeant is not authorized. Selected Marines must have 24 months of obligated service from their promotion date.",
    history: [
      "The title is old in the Corps: in 1872 first sergeant replaced the earlier orderly sergeant. It was dropped in the 1947 rank realignment and restored in 1955, and by the mid-1950s Marines were being promoted to first sergeant before moving on to sergeant major, as SMMC biographies show.",
      "The first sergeant's diamond sits between three chevrons and three rockers, without crossed rifles.",
      "Gunnery sergeants choose between the first sergeant and master sergeant tracks on their annual evaluations. For FY27 the Corps opened an E-8 redesignation board pilot that lets qualified master sergeants apply to move to the first sergeant track.",
    ],
    faq: [
      { q: 'What does a Marine first sergeant do?', a: 'Serves as the senior enlisted Marine in a company and advises the commander on discipline, administration and welfare.' },
      { q: 'Is first sergeant higher than master sergeant?', a: 'Both are E-8 and paid the same. They serve on different tracks.' },
      { q: 'Can a Marine be meritoriously promoted to first sergeant?', a: 'No. Meritorious promotion to first sergeant is not authorized.' },
    ],
    sources: [S.ranks, S.snco, S.sgtMajBoard, S.smmcHist, S.w1stsgt],
    unverified: [],
  },
  {
    branch: mc,
    abbr: 'MGySgt',
    slug: 'master-gunnery-sergeant',
    summary:
      "Master Gunnery Sergeant (E-9) is the technical track at the top enlisted grade. A master gunnery sergeant, often called Master Guns, is the senior occupational specialist in an MOS and brings that expertise to regiments, divisions, wings and higher headquarters.",
    role: [
      'Senior technical advisor and operations chief at regiment, group, division, wing or MEF',
      'Recognized expert who shapes training standards and doctrine for an MOS',
      'Fills high-visibility billets that HQMC slates by name',
      'Mentors master sergeants and staff NCOs in the occupational field',
      'Advises commanders on technical readiness and the employment of equipment',
    ],
    promotion:
      "Master gunnery sergeants are selected from master sergeants by an annual Headquarters Marine Corps selection board that also handles master sergeant promotions. For FY27 that board, announced in MARADMIN 389/26, was scheduled to convene on 27 October 2026 at Quantico for about five weeks. Like other SNCO boards, it votes on records by MOS against fixed allocations, and Marines selected must have 24 months of obligated service from the promotion date. HQMC also announces slates of high-visibility billets for which master gunnery sergeants are screened.",
    history: [
      "Master gunnery sergeant first appeared in 1935. The 1958 to 1959 grade reorganization gave the rank its current form at the new E-9 grade, alongside sergeant major.",
      "The bursting bomb has been part of the insignia since 1935, when it sat with crossed rifles between three chevrons and three rockers. Today it sits between three chevrons and four rockers. The bursting bomb is an old Marine symbol for ordnance and gunnery expertise and is also worn on the collar by Marine Gunners.",
    ],
    faq: [
      { q: 'Is a sergeant major higher than a master gunnery sergeant?', a: 'Both are E-9 with the same pay. By Marine Corps precedence the sergeant major is senior, but the two serve on different tracks: command and technical.' },
      { q: 'What does a master gunnery sergeant do?', a: 'Provides technical leadership as the senior specialist in an MOS, usually at regiment level or higher.' },
      { q: 'How is a master gunnery sergeant selected?', a: 'By an annual Headquarters Marine Corps selection board for master sergeant and master gunnery sergeant.' },
    ],
    sources: [S.ranks, S.snco, S.mgysgtSlate, S.chron4764, S.m389, S.wMgysgt],
    unverified: [],
  },
  {
    branch: mc,
    abbr: 'SgtMaj',
    slug: 'sergeant-major',
    summary:
      "Sergeant Major (E-9) is the command track at the top enlisted grade. A sergeant major is the senior enlisted advisor to the commanding officer of a battalion, squadron or larger unit, responsible for discipline, administration, morale and welfare across the command.",
    role: [
      'Battalion or squadron sergeant major',
      'Sergeant major of a regiment, group, division, wing, MEF or base',
      'Advises the commanding officer on the enlisted Marines of the command',
      'Enforces standards of conduct, appearance and training',
      'Mentors first sergeants and develops the command\'s staff NCOs',
    ],
    promotion:
      "Sergeants major are selected from first sergeants by an annual Headquarters Marine Corps board that also selects first sergeants. For FY27 the board convened on 20 October 2026 at Quantico. Selection is competitive and limited by the number of command billets. Selected Marines need 24 months of obligated service from their promotion date, and meritorious promotion is not available at this grade.",
    history: [
      "Sergeant major is one of the oldest enlisted titles in American service. The Marine Corps' first sergeant major, Archibald Sommers, was appointed on 1 January 1801. The rank was abolished in 1946 and restored in 1954, according to the Sergeant Major of the Marine Corps history page.",
      "With the 1959 reorganization, sergeant major and master gunnery sergeant became the two E-9 ranks. The sergeant major's star sits between three chevrons and four rockers.",
    ],
    faq: [
      { q: 'Is a sergeant major higher than a master gunnery sergeant?', a: 'Both are E-9, but the sergeant major is senior. Sergeants major serve commanders; master gunnery sergeants provide technical leadership.' },
      { q: 'What does a Marine sergeant major do?', a: 'Serves as the senior enlisted Marine of a battalion or larger unit and advises the commanding officer on discipline and welfare.' },
      { q: 'How do you become a sergeant major in the Marines?', a: 'Serve as a first sergeant, then be selected by the annual HQMC sergeant major and first sergeant board.' },
    ],
    sources: [S.ranks, S.snco, S.sgtMajBoard, S.smmcHist, S.wSgtmaj],
    unverified: [],
  },
  {
    branch: mc,
    abbr: 'SMMC',
    slug: 'sergeant-major-of-the-marine-corps',
    summary:
      "The Sergeant Major of the Marine Corps is the senior enlisted Marine in the entire Corps, personally selected by the Commandant. Only one Marine holds the billet at a time, and the SMMC wears a unique insignia in place of the standard sergeant major chevrons.",
    role: [
      'Senior enlisted advisor to the Commandant of the Marine Corps',
      'Represents enlisted Marines to Marine Corps leadership, Congress and the public',
      'Travels to units worldwide to assess morale, training and quality of life',
      'Advises on enlisted policy, from promotions to professional military education',
      'Briefs SNCO selection boards before they begin deliberations',
    ],
    promotion:
      "The SMMC is not chosen by a board. The Commandant personally selects the SMMC, normally from among the Corps' most senior sergeants major. The billet carries a fixed rate of basic pay set apart from other E-9s.",
    history: [
      "The post of Sergeant Major of the Marine Corps was created in 1957 as the senior enlisted advisor to the Commandant, the first such post in any of the armed services. Sergeant Major Wilbur Bestwick took the newly created post on 23 May 1957 and served until he retired on 1 September 1959.",
      "The SMMC and the Marine Gunner are the only Marine billets that rate modified rank insignia. The SMMC chevrons replace the sergeant major's star with the Eagle, Globe and Anchor between two stars. That insignia was authorized in 1970; before then the SMMC wore standard sergeant major chevrons.",
    ],
    faq: [
      { q: 'Who was the first Sergeant Major of the Marine Corps?', a: 'Sergeant Major Wilbur Bestwick, who took the post on 23 May 1957.' },
      { q: 'Was the Marine Corps first to have a senior enlisted advisor?', a: 'Yes. The SMMC post, created in 1957, was the first of its kind among the armed services.' },
      { q: 'How is the Sergeant Major of the Marine Corps chosen?', a: 'The Commandant personally selects the SMMC.' },
    ],
    sources: [S.ranks, S.smmcHist, S.bestwick, S.snco, S.wSmmc],
    unverified: [],
  },

  // ─── Warrant officers ────────────────────────────────────────────────────────
  {
    branch: mc,
    abbr: 'WO',
    slug: 'warrant-officer',
    summary:
      "Warrant Officer (W-1) is the entry grade for Marine warrant officers, technical specialists drawn from the enlisted ranks. A warrant officer is appointed by a warrant approved by the Secretary of the Navy and leads and trains the Marines in a specific field.",
    role: [
      'Technical officer in fields such as supply, maintenance, communications, intelligence or ordnance',
      'Platoon or section officer in a technical unit',
      'Advises commanders on equipment, systems and procedures in the specialty',
      'Trains Marines in the MOS',
      'Completes the Warrant Officer Basic Course at The Basic School, Quantico',
    ],
    promotion:
      "Marine warrant officers come from the enlisted ranks: a sergeant (E-5) or staff NCO (E-6 to E-9), generally with at least eight years of service, can apply to a warrant officer selection board run by Marine Corps Recruiting Command. Applications require command endorsements up to the first general officer, a qualifying GT score and a physical exam. Those selected attend the Warrant Officer Basic Course, about 16 weeks at The Basic School, and then any required MOS school. Requirements by specialty are set in MCO 1040.42B and each year's board MARADMIN.",
    history: [
      "An act of Congress on 26 August 1916 created the first Marine warrant ranks, Marine Gunner and Quartermaster Clerk. The warrant program has been reshaped many times since, with different titles for technical and weapons specialists.",
      "Marine warrant insignia use scarlet enamel on a gold or silver bar, in the Corps' color, rather than the blue of the Navy or the black of the Army.",
    ],
    faq: [
      { q: 'Can a Marine become a warrant officer as a sergeant?', a: 'Yes. Sergeants and staff NCOs may apply, subject to the requirements for their intended specialty.' },
      { q: 'Is a Marine WO commissioned?', a: 'No. A warrant officer (W-1) is appointed by warrant. Marines are commissioned at Chief Warrant Officer 2.' },
      { q: 'Where do Marine warrant officers train?', a: 'At the Warrant Officer Basic Course at The Basic School, Quantico, followed by MOS training.' },
    ],
    sources: [S.ranks, S.gunner27, S.ww1chron, S.uniformRegs, S.mcrcWo, S.wWo, S.wTbs],
    unverified: [],
  },
  {
    branch: mc,
    abbr: 'CWO2',
    slug: 'chief-warrant-officer-2',
    summary:
      "Chief Warrant Officer 2 is the grade at which Marine warrant officers become commissioned officers. CWO2s serve as technical advisors and leaders in their field, and Marine Gunners enter the warrant ranks directly at this grade.",
    role: [
      'Technical advisor to a battalion or squadron commander',
      'Officer in charge of a maintenance, supply or communications section',
      'Marine Gunner (infantry weapons officer) advising on weapons employment and marksmanship',
      'Trains Marines and staff NCOs in the specialty',
      'Supervises technical programs, inspections and readiness reporting',
    ],
    promotion:
      "Warrant officers are promoted from WO to CWO2 after meeting time-in-grade requirements and are commissioned on promotion. Marine Gunners are selected directly from enlisted infantry Marines: under the FY27 board, applicants needed at least one year as a gunnery sergeant, no more than 23 years of service, a GT score of 110 and an infantry MOS (0321, 0363, 0369 or 0372). The President commissions them as CWO2 Marine Gunners after the Warrant Officer Basic Course.",
    history: [
      "On 24 March 1917, Henry Lewis Hulbert became the first Marine to wear the bursting bomb insignia of a Marine Gunner, with the recommendation of Brigadier General John A. Lejeune. Hulbert was killed at Blanc Mont Ridge in 1918.",
      "Today a Marine Gunner wears the bursting bomb on the left collar in place of the CWO insignia. Marines.mil notes that only the Marine Gunner and the SMMC rate modified rank insignia.",
    ],
    faq: [
      { q: 'What is a Marine Gunner?', a: 'A chief warrant officer who serves as an infantry weapons officer, chosen from senior infantry staff NCOs and commissioned directly as CWO2.' },
      { q: 'Is a CWO2 a commissioned officer?', a: 'Yes. Marine warrant officers are commissioned at Chief Warrant Officer 2.' },
      { q: 'How long until a WO makes CWO2?', a: 'The promotion follows a set time in grade; check the current Marine Corps officer promotion manual for the figure.' },
    ],
    sources: [S.ranks, S.gunner27, S.ww1chron, S.uniformRegs, S.wWo],
    unverified: [],
  },
  {
    branch: mc,
    abbr: 'CWO3',
    slug: 'chief-warrant-officer-3',
    summary:
      "Chief Warrant Officer 3 is a mid-career Marine warrant grade. A CWO3 is a seasoned technical officer who leads larger sections, advises commanders at regiment, group or Marine Expeditionary Unit level and develops the junior warrant officers in the field.",
    role: [
      'Senior technical officer for a regiment, aircraft group, logistics battalion or MEU',
      'Officer in charge of a large maintenance, supply, communications or ordnance section',
      'Marine Gunner at regiment level, advising on infantry weapons and marksmanship training',
      'Inspects technical programs and readiness across subordinate units',
      'Mentors warrant officers and staff NCOs in the occupational field',
    ],
    promotion:
      "Promotion to CWO3 is competitive. A selection board convened under the authority of the Secretary of the Navy reviews the records of eligible CWO2s, chiefly their fitness reports, and selects against a set number of vacancies by occupational field. Officers must meet the minimum time in grade before they are in the zone for consideration.",
    history: [
      "Marine warrant officers trace their grades to the 1916 act that created the Marine Gunner and Quartermaster Clerk. Chief warrant grades followed in 1926, and in 1949 the structure was reset as four pay grades, W-1 through W-4. W-4 stayed at the top until the Warrant Officer Management Act of 1991 added W-5.",
      "A CWO3 wears a silver bar with scarlet enamel blocks. The switch from a gold bar at W-1 and W-2 to a silver bar at W-3 and W-4 mirrors the gold-then-silver pattern of company-grade officer insignia.",
    ],
    faq: [
      { q: 'What does a CWO3 do in the Marines?', a: 'Leads a large technical section or serves as the senior expert at regiment, group or MEU level, advising commanders and developing junior warrant officers.' },
      { q: 'Is promotion to CWO3 by selection board?', a: 'Yes. Eligible CWO2s are considered by a warrant officer selection board.' },
      { q: 'What does the CWO3 insignia look like?', a: 'A silver bar with scarlet enamel blocks.' },
    ],
    sources: [S.ranks, S.uniformRegs, S.ww1chron, S.tiohWarrant, S.wWo],
    unverified: [],
  },
  {
    branch: mc,
    abbr: 'CWO4',
    slug: 'chief-warrant-officer-4',
    summary:
      "Chief Warrant Officer 4 is a senior Marine warrant grade. CWO4s serve as the senior technical experts at division, wing, logistics group and Marine Expeditionary Force level, and some advise Headquarters Marine Corps on their occupational field.",
    role: [
      'Senior technical officer on a division, wing or MEF staff',
      'Occupational field advisor or manager at Headquarters Marine Corps',
      'Leads complex technical programs that span several commands',
      'Senior Marine Gunner advising a division or MEF commander',
      'Mentors warrant officers and shapes their career development',
    ],
    promotion:
      "Promotion to CWO4 is by a warrant officer selection board convened under the authority of the Secretary of the Navy. The board compares records within each occupational field and selects only as many officers as there are projected vacancies. Minimum time in grade as a CWO3 applies. Results are released by MARADMIN, and selected officers are promoted in order of precedence as vacancies open.",
    history: [
      "For decades CWO4 was the highest warrant grade in every service. That changed when the Warrant Officer Management Act, signed on 5 December 1991, created the W-5 grade.",
      "The CWO4 wears a silver bar with more scarlet enamel blocks than the CWO3. Marines in this grade often carry knowledge of equipment and procedures that spans an entire career in one field.",
    ],
    faq: [
      { q: 'Was CWO4 once the top warrant officer grade?', a: 'Yes. It was the highest until the Warrant Officer Management Act of 1991 created CWO5.' },
      { q: 'How is a CWO4 selected?', a: 'By a warrant officer selection board that compares records within each occupational field.' },
      { q: 'Where does a Marine CWO4 usually serve?', a: 'At division, wing, MEF or Headquarters Marine Corps level.' },
    ],
    sources: [S.ranks, S.tiohWarrant, S.uniformRegs, S.wWo, S.usc571],
    unverified: [],
  },
  {
    branch: mc,
    abbr: 'CWO5',
    slug: 'chief-warrant-officer-5',
    summary:
      "Chief Warrant Officer 5 is the highest Marine warrant grade. CWO5s are master-level technical experts who advise senior commanders and Headquarters Marine Corps, and they often manage the policy and health of an entire occupational field.",
    role: [
      'Occupational field manager at Headquarters Marine Corps, such as the Marine Gunner field (0306)',
      'Senior technical advisor to a MEF or Marine Corps component commander',
      'Shapes doctrine, equipment requirements and training for a specialty',
      'Mentors warrant officers across the Corps',
      'Represents the Marine Corps on joint technical working groups',
    ],
    promotion:
      "Promotion to CWO5 is by a highly selective board. Federal law caps W-5 at 5 percent of a service's active-duty warrant officers, so only a small share of CWO4s are selected.",
    history: [
      "The Warrant Officer Management Act, signed on 5 December 1991, created the CWO5 grade across the services. Before that, CWO4 was the top of the warrant ranks.",
      "The CWO5 insignia is a silver bar with a scarlet stripe down the middle. Its layout matches the W-5 insignia of the Army, standardized in 2004 to be consistent across services that use the grade.",
      "CWO5s often run whole career fields. MARADMIN 077/26, for example, names a CWO5 Marine Gunner as the occupational field manager that interested infantry Marines should contact before applying to the gunner program.",
    ],
    faq: [
      { q: 'When did the Marine Corps get CWO5?', a: 'The grade was created by the Warrant Officer Management Act of 1991.' },
      { q: 'Is CWO5 the highest warrant officer rank?', a: 'Yes. W-5 is the top warrant grade.' },
      { q: 'What does a Marine CWO5 do?', a: 'Advises senior commanders and manages occupational fields as a master-level expert.' },
    ],
    sources: [S.ranks, S.tiohWarrant, S.gunner27, S.usc571, S.wWo],
    unverified: [],
  },

  // ─── Commissioned officers ───────────────────────────────────────────────────
  {
    branch: mc,
    abbr: '2ndLt',
    slug: 'second-lieutenant',
    summary:
      "Second Lieutenant is the entry grade for Marine commissioned officers. Every new Marine officer, whatever the future specialty, first completes The Basic School at Quantico, a course of about 28 weeks where the Corps trains each lieutenant to lead a rifle platoon.",
    role: [
      'Student at The Basic School, then at an MOS school such as the Infantry Officer Course',
      'Platoon commander in a rifle, weapons or support unit',
      'Student naval aviator in flight training',
      'Leads a platoon with the help of a staff sergeant platoon sergeant',
      'Responsible for the training, welfare and gear of the platoon',
    ],
    promotion:
      "Marine officers are commissioned through the U.S. Naval Academy, Naval ROTC, or Officer Candidates School, including enlisted commissioning programs. Federal law allows promotion to First Lieutenant after 18 months in grade, and the Marine Corps sets its own timing within that limit for officers who are fully qualified.",
    history: [
      "Marine second lieutenants wear the same gold bar adopted by the Army in December 1917. The Institute of Heraldry notes that Navy and Marine Corps officer insignia have paralleled the Army's.",
      "Marine officers wear the bar on the collar of the utility uniform and on the shoulder straps of the service and dress coats, with placement set by the Marine Corps Uniform Regulations.",
    ],
    faq: [
      { q: 'Do all Marine officers go to The Basic School?', a: 'Yes. Every newly commissioned Marine officer attends The Basic School before MOS training.' },
      { q: 'How do you become a Marine second lieutenant?', a: 'Through the Naval Academy, NROTC or Officer Candidates School.' },
      { q: 'Why is the Marine second lieutenant bar gold?', a: 'Marine officer insignia follow the Army pattern, where the gold bar for second lieutenants dates to 1917.' },
    ],
    sources: [S.ranks, S.tiohOfficer, S.usc624, S.usc619, S.uniformRegs, S.wTbs],
    unverified: [],
  },

  {
    branch: mc,
    abbr: '1stLt',
    slug: 'first-lieutenant',
    summary:
      "First Lieutenant is the second commissioned grade. Most Marine first lieutenants are experienced platoon commanders or company executive officers, while aviators spend much of this grade in flight training and their first fleet squadron.",
    role: [
      'Platoon commander with a year or more of experience',
      'Company executive officer, second in command of the company',
      'Junior staff officer in a battalion or squadron',
      'Naval aviator or naval flight officer in a fleet squadron',
      'Officer in charge of a detachment or specialized platoon',
    ],
    promotion:
      "Promotion from 2ndLt to 1stLt is not a competitive board; officers who remain fully qualified are promoted when they meet the time in grade, which federal law sets at no less than 18 months. First lieutenants are then reviewed by a captain promotion selection board, but under 10 U.S.C. 619 a first lieutenant cannot be promoted to Captain before completing two years in grade.",
    history: [
      "The first lieutenant's single bar dates to 1836, when shoulder straps were adopted in the Army, and the bar turned from gold to silver in 1872 to match the silver insignia of senior officers. Marine officer insignia have followed this pattern.",
      "Because the silver bar outranks the gold one, the order can seem backward to newcomers. The Institute of Heraldry explains that the choice came from a wish to avoid unnecessary changes rather than any plan to rank silver above gold.",
    ],
    faq: [
      { q: 'Is a first lieutenant higher than a second lieutenant?', a: 'Yes. First Lieutenant (O-2) wears a silver bar and is one grade above Second Lieutenant (O-1), who wears gold.' },
      { q: 'How long does it take to make first lieutenant in the Marines?', a: 'Promotion comes after the required time as a second lieutenant, at least 18 months under federal law, for officers who remain qualified.' },
      { q: 'What does a Marine first lieutenant do?', a: 'Leads a platoon, serves as a company executive officer or flies in a fleet squadron.' },
    ],
    sources: [S.ranks, S.tiohOfficer, S.usc619, S.usc624],
    unverified: [],
  },
  {
    branch: mc,
    abbr: 'Capt',
    slug: 'captain',
    summary:
      "Captain is the grade of company command. A Marine captain commands a rifle, weapons or support company or a battery, with a first sergeant as the senior enlisted Marine, or serves as a pilot, staff officer or instructor.",
    role: [
      'Company or battery commander',
      'Pilot or flight officer and division lead in a squadron',
      'Battalion or squadron staff officer in operations, intelligence or logistics',
      'Instructor at The Basic School, Officer Candidates School or a recruiting station',
      'Series or company commander at a recruit depot',
    ],
    promotion:
      "Promotion to Captain is by a selection board convened under the authority of the Secretary of the Navy. Under federal law a first lieutenant cannot be promoted until completing two years in grade. Captains are expected to complete the career-level professional military education for their grade: the resident Expeditionary Warfare School at Marine Corps University, or its distance or blended seminar version, which counts the same for promotion.",
    history: [
      "Two bars for captains were established in 1836 in the Army system that Marine insignia follow. The bars were gold or silver depending on the strap border, and from 1872 they have been silver.",
      "Captains have led Marines since the Revolution. Samuel Nicholas, the first commissioned officer of the Continental Marines, was made a captain in November 1775 and raised the first Marine companies.",
    ],
    faq: [
      { q: 'Is a Marine captain the same rank as a Navy captain?', a: 'No. A Marine captain is O-3, equal to a Navy lieutenant. A Navy captain is O-6, equal to a Marine colonel.' },
      { q: 'What does a Marine captain command?', a: 'A company or battery. Its size depends on the type of unit.' },
      { q: 'What school do Marine captains attend?', a: 'Expeditionary Warfare School, the career-level PME for captains.' },
    ],
    sources: [S.ranks, S.tiohOfficer, S.usc619, S.ewsDep, S.wNicholas],
    unverified: [],
  },
  {
    branch: mc,
    abbr: 'Maj',
    slug: 'major',
    summary:
      "Major is the first field-grade officer rank. Marine majors run the staffs of battalions and squadrons as executive officers and operations officers, and fill key planning roles on regiment, group and Marine Expeditionary Force staffs.",
    role: [
      'Battalion or squadron executive officer',
      'Battalion or squadron operations officer (S-3)',
      'Planner on a regiment, division, wing or MEF staff',
      'Joint staff officer at a combatant command',
      'Commanding officer of a recruiting station, chosen by a separate selection board',
    ],
    promotion:
      "Promotion to Major is by a selection board, and only part of each year group is selected. Federal law requires at least three years as a Captain before consideration. Defense Department guidance has aimed for promotion to O-4 at about ten years of commissioned service, give or take a year. Majors are expected to complete intermediate-level PME such as the Marine Corps Command and Staff College.",
    history: [
      "The leaf for majors and lieutenant colonels was introduced in 1835. From 1851, when all shoulder strap borders became gold, the major's leaf was gold and the lieutenant colonel's silver.",
      "When epaulettes were abolished in 1872, the major's gold leaf moved onto the dress uniform to tell majors from second lieutenants, and a 1912 regulation first specified an oak leaf. Marine majors wear the same gold oak leaf.",
    ],
    faq: [
      { q: 'Is a Marine major a field-grade officer?', a: 'Yes. Major is the first field-grade rank, above the company grades of lieutenant and captain.' },
      { q: 'What does a Marine major do?', a: 'Usually serves as a battalion or squadron executive or operations officer, or as a planner on a higher staff.' },
      { q: 'How long does it take to make major in the Marines?', a: 'Defense guidance has targeted about ten years of service, with at least three years as a captain required by law.' },
    ],
    sources: [S.ranks, S.tiohOfficer, S.usc619, S.wDopma, S.rsco],
    unverified: [],
  },
  {
    branch: mc,
    abbr: 'LtCol',
    slug: 'lieutenant-colonel',
    summary:
      "Lieutenant Colonel is the grade of battalion and squadron command. A Marine LtCol commands an infantry, artillery or logistics battalion or an aircraft squadron, or leads a major section on a senior staff.",
    role: [
      'Commanding officer of a battalion or squadron',
      'Executive officer of a regiment or aircraft group',
      'Senior staff officer at division, wing, MEF or HQMC',
      'Joint or service staff officer in the Pentagon',
      'Inspector-instructor or commander of a reserve unit',
    ],
    promotion:
      "Promotion to Lieutenant Colonel is by a selection board after at least three years as a Major, the federal minimum. Defense Department guidance has aimed for promotion to O-5 at about 16 years of service. Command of a battalion or squadron is a separate, highly competitive selection made by the annual Lieutenant Colonel Command Screening Board; for FY27 it screened 686 officers for 148 commands. Officers in the zone who are not selected may be considered again by later boards.",
    history: [
      "The silver leaf took its final color in 1851, when all shoulder strap borders became gold and the lieutenant colonel's leaf, which had varied between gold and silver since 1835, became silver for good.",
      "A 1912 regulation first described the leaf as an oak leaf worn point up. The Marine Corps, Army, Air Force and Space Force share the insignia.",
    ],
    faq: [
      { q: 'What does a Marine lieutenant colonel command?', a: 'A battalion or squadron, typically several hundred Marines and sailors.' },
      { q: 'Is a silver oak leaf higher than a gold oak leaf?', a: 'Yes. Silver is Lieutenant Colonel (O-5); gold is Major (O-4).' },
      { q: 'How is battalion command chosen?', a: 'By a command screening board, separate from the promotion board.' },
    ],
    sources: [S.ranks, S.tiohOfficer, S.usc619, S.wDopma, S.ltcolCsb],
    unverified: [],
  },
  {
    branch: mc,
    abbr: 'Col',
    slug: 'colonel',
    summary:
      "Colonel is the senior field-grade rank. A Marine colonel commands a regiment, an aircraft group, a Marine Expeditionary Unit or a base, or leads a major staff directorate.",
    role: [
      'Commanding officer of an infantry, artillery or logistics regiment',
      'Commanding officer of a Marine aircraft group',
      'Commanding officer of a Marine Expeditionary Unit',
      'Chief of staff of a division, wing or MEF',
      'Commander of a base or station',
    ],
    promotion:
      "Promotion to Colonel is by a selection board after at least three years as a Lieutenant Colonel, the federal minimum. Defense Department guidance has aimed for promotion to O-6 at about 22 years of service. Selection is competitive, and regimental, group and MEU command are screened separately. Most colonels have completed top-level professional education, such as a war college.",
    history: [
      "There is evidence that colonels wore the eagle by 1829, and it was formally prescribed in 1832. In 1851, when all epaulettes became gold, the colonel's eagle became silver for everyone.",
      "In 1926 the insignia was made in pairs so the eagle faced forward on both shoulders, and since 1951 the eagle's head faces the olive branch on both. Marine colonels wear the same silver eagle.",
      "The silver eagle is also the insignia of a Navy captain, the O-6 equal of a Marine colonel. That shared device is one reason Marines and sailors serving together can read each other's seniority at a glance.",
    ],
    faq: [
      { q: 'What does a Marine colonel command?', a: 'A regiment, aircraft group, MEU or base.' },
      { q: 'Is a Marine colonel equal to a Navy captain?', a: 'Yes. Both are O-6.' },
      { q: 'Why is a colonel called a bird colonel?', a: 'It is informal slang for the eagle insignia.' },
    ],
    sources: [S.ranks, S.tiohOfficer, S.usc619, S.wDopma],
    unverified: [],
  },
  {
    branch: mc,
    abbr: 'BGen',
    slug: 'brigadier-general',
    summary:
      "Brigadier General is the first Marine general officer grade. A BGen often serves as a deputy or assistant commander of a division, wing or logistics group, or commands a Marine Expeditionary Brigade, a training command or a major base.",
    role: [
      'Assistant division or wing commander',
      'Commanding general of a Marine Expeditionary Brigade',
      'Commanding general of a recruit depot or training command',
      'Director on the Headquarters Marine Corps staff',
      'Deputy commander in a joint headquarters',
    ],
    promotion:
      "Colonels are selected for BGen by a general officer selection board. The President nominates selected officers and the Senate must confirm them. Federal law requires at least one year as a Colonel, and general officer numbers are capped by law.",
    history: [
      "Stars for general officers date to 18 June 1780, when Washington prescribed one star for brigadier generals and two for major generals on the epaulette. That order began the system of officer insignia the Marine Corps shares today.",
      "For much of its history the Marine Corps had very few general officers. Jacob Zeilin, the 7th Commandant, became the Corps' first general officer outside of brevet rank when he was promoted to brigadier general on 2 March 1867. As the Corps grew in the 20th century, the brigadier general grade became the normal first step into general officer leadership.",
    ],
    faq: [
      { q: 'Does the Senate confirm Marine generals?', a: 'Yes. All general officer promotions are nominated by the President and confirmed by the Senate.' },
      { q: 'What does a Marine one-star do?', a: 'Often serves as an assistant commander of a division or wing, or commands a MEB, recruit depot or base.' },
      { q: 'How long does a colonel serve before BGen?', a: 'At least one year by law, and in practice much longer.' },
    ],
    sources: [S.ranks, S.tiohOrigin, S.usc619, S.commandants],
    unverified: [],
  },
  {
    branch: mc,
    abbr: 'MajGen',
    slug: 'major-general',
    summary:
      "Major General is the two-star grade. A Marine MajGen typically commands a Marine division, a Marine aircraft wing or a Marine logistics group, or leads a major command such as a training or systems command. Each of these commands is built to deploy, so a Marine two-star is expected to lead forces in combat as well as manage them at home station.",
    role: [
      'Commanding general of a Marine division',
      'Commanding general of a Marine aircraft wing',
      'Commanding general of a Marine logistics group',
      'Commander of a training, recruiting or systems command',
      'Senior director on a joint or HQMC staff',
    ],
    promotion:
      "Brigadier Generals are considered for MajGen by a general officer selection board. The President nominates and the Senate confirms. Federal law requires at least one year as a BGen before consideration. Because general officer numbers are capped by statute, only part of each group of brigadier generals advances to two stars.",
    history: [
      "The two stars of the major general date to Washington's order of 18 June 1780. Marine general officers have worn the same silver stars as their Army counterparts. The first Marine major general was Commandant Charles Heywood, promoted on 2 July 1902 under an act that gave the Commandant that rank.",
      "The divisions and wings that major generals command today took shape during World War II, when the Corps grew into a force of several divisions and aircraft wings.",
    ],
    faq: [
      { q: 'Is a major general higher than a lieutenant general?', a: 'No. Major General is two stars (O-8); Lieutenant General is three (O-9).' },
      { q: 'What does a Marine two-star command?', a: 'Usually a Marine division, aircraft wing or logistics group.' },
      { q: 'How is a major general selected?', a: 'By a general officer selection board, nominated by the President and confirmed by the Senate.' },
    ],
    sources: [S.ranks, S.tiohOrigin, S.usc619, S.commandants],
    unverified: [],
  },
  {
    branch: mc,
    abbr: 'LtGen',
    slug: 'lieutenant-general',
    summary:
      "Lieutenant General is the three-star grade. A Marine LtGen commands a Marine Expeditionary Force or Marine Forces component, or serves as a Deputy Commandant at Headquarters Marine Corps. A MEF is the Corps' largest standing air-ground task force, combining a division, an aircraft wing and a logistics group under one commander.",
    role: [
      'Commanding general of a Marine Expeditionary Force',
      'Commander of Marine Corps Forces for a combatant command',
      'Deputy Commandant at HQMC (for example, Manpower and Reserve Affairs)',
      'Director of a Joint Staff directorate',
      'Commander of a joint task force',
    ],
    promotion:
      "Three-star rank is tied to a position. Under 10 U.S.C. 601 the President designates positions of importance and responsibility, nominates an officer for one, and the Senate confirms. The grade is held while in the position.",
    history: [
      "The American grade of lieutenant general dates to 1798, when President John Adams appointed George Washington to it during the Quasi-War with France.",
      "In the Marine Corps the grade grew with the Corps itself. A 1942 act gave the Commandant the rank of lieutenant general, and Thomas Holcomb, the 17th Commandant, became the first Marine to hold it. He was later advanced to general on the retired list effective 1 January 1944.",
      "Because the grade belongs to the position, an officer who leaves a three-star billet without moving to another reverts to the permanent grade unless retiring. Retiring as a lieutenant general requires Senate confirmation of the officer's service in that grade.",
    ],
    faq: [
      { q: 'What does a Marine three-star command?', a: 'A Marine Expeditionary Force, a Marine Forces component or a major HQMC department.' },
      { q: 'Is lieutenant general a permanent rank?', a: 'No. It is tied to a position.' },
      { q: 'Who confirms a Marine lieutenant general?', a: 'The Senate, after the President nominates the officer for a specific position.' },
    ],
    sources: [S.ranks, S.tiohOfficer, S.usc601, S.fourStar, S.commandants, S.wLtgen],
    unverified: [],
  },
  {
    branch: mc,
    abbr: 'Gen',
    slug: 'general',
    summary:
      "General is the Marine Corps' four-star grade. The Commandant and the Assistant Commandant of the Marine Corps are four-star generals, and other Marine generals hold four stars as combatant commanders or senior joint leaders.",
    role: [
      'Commandant of the Marine Corps',
      'Assistant Commandant of the Marine Corps',
      'Commander of a combatant command',
      'Chairman or Vice Chairman of the Joint Chiefs of Staff',
      'Senior NATO or joint commander',
    ],
    promotion:
      "Four-star rank comes with a position. The President nominates an officer for a designated position under 10 U.S.C. 601, and the Senate confirms. The Commandant serves a set term as the service chief.",
    history: [
      "Thomas Holcomb, the 17th Commandant, was the first Marine to hold four-star rank, promoted from lieutenant general to general on his retirement on 1 January 1944. Alexander A. Vandegrift was appointed general on 4 April 1945 with a date of rank of 21 March 1945, the first Marine to hold four stars on active duty.",
      "An act of 7 August 1947 fixed the Commandant's grade at four-star general. On 2 June 1969 Lewis W. Walt became the first Assistant Commandant to reach four stars.",
    ],
    faq: [
      { q: 'Who was the first Marine four-star general?', a: 'Thomas Holcomb, promoted on retirement in January 1944. Alexander Vandegrift was the first on active duty, in 1945.' },
      { q: 'Is the Commandant a four-star general?', a: 'Yes. The Commandant\'s grade was fixed at general by an act of 7 August 1947.' },
      { q: 'How many four-star generals does the Marine Corps have?', a: 'At least two: the Commandant and the Assistant Commandant. Others may hold four stars in joint positions.' },
    ],
    sources: [S.ranks, S.fourStar, S.usc601, S.tiohOrigin],
    unverified: [],
  },
];

import type { RankDetail, Source } from '../../types';

/**
 * Written content for each U.S. Army rank page. Joined to `ranks.ts` by branch + abbr.
 * All prose is original. Facts come from The Institute of Heraldry, the Army Center of
 * Military History, army.mil and federal law; anything not confirmed is in `unverified`.
 */

const S = {
  tiohEnlisted: { label: 'The Institute of Heraldry: History of Enlisted Grades', url: 'https://tioh.army.mil/Catalog/HeraldryMulti.aspx?CategoryId=9168&grp=2&menu=Uniformed+Services' },
  tiohOfficer: { label: 'The Institute of Heraldry: Officer and Warrant Officer Insignia of Grade', url: 'https://tioh.army.mil/Catalog/HeraldryMulti.aspx?CategoryId=9170&grp=2&menu=Uniformed+Services' },
  tiohOrigin: { label: 'The Institute of Heraldry: Officer Insignia of Rank, Origin', url: 'https://tioh.army.mil/Catalog/Heraldry.aspx?HeraldryId=15750&CategoryId=9171&grp=2&menu=Uniformed+Services' },
  tiohWarrant: { label: 'The Institute of Heraldry: Insignia of Grade, Warrant Officers', url: 'https://tioh.army.mil/Catalog/HeraldryMulti.aspx?CategoryId=9186&grp=2&menu=Uniformed+Services' },
  armyRanks: { label: 'U.S. Army: Ranks', url: 'https://www.army.mil/ranks/' },
  ar600819: { label: 'AR 600-8-19, Enlisted Promotions and Demotions (6 March 2026)', url: 'https://armypubs.army.mil/epubs/DR_pubs/DR_a/ARN43646-AR_600-8-19-000-WEB-1.pdf' },
  hrcCos2026: { label: 'HRC memo: HQDA Promotion Point Cutoff Scores for 1 June 2026 (20 May 2026)', url: 'https://cutoffscores.com/wp-content/uploads/2026/05/HQDA-COS-2026-06-as-of-20-May-2026.pdf' },
  ar60020: { label: 'AR 600-20, Army Command Policy', url: 'https://armypubs.army.mil/epubs/DR_pubs/DR_a/ARN46266-AR_600-20-000-WEB-1.pdf' },
  wikiEnlisted: { label: 'Wikipedia: United States Army enlisted rank insignia', url: 'https://en.wikipedia.org/wiki/United_States_Army_enlisted_rank_insignia' },
  wikiSfc: { label: 'Wikipedia: Sergeant first class', url: 'https://en.wikipedia.org/wiki/Sergeant_first_class' },
  wikiSma: { label: 'Wikipedia: Sergeant Major of the Army', url: 'https://en.wikipedia.org/wiki/Sergeant_Major_of_the_Army' },
  csmCsl: { label: 'army.mil: Command Sergeant Major Centralized Selection List', url: 'https://www.army.mil/article/63407/command_sergeant_major_centralized_selection_list' },
  ruckerWo: { label: 'Fort Rucker, U.S. Army Aviation Center of Excellence: Warrant Officer applicants', url: 'https://home.army.mil/rucker/about/AVCOE/opfd/wo' },
  woDor: { label: 'army.mil: New Army directive will reset aviator warrant officer date of rank', url: 'https://www.army.mil/article/250466/new_army_directive_will_reset_aviator_warrant_officer_date_of_rank' },
  usc571: { label: '10 U.S.C. 571, Warrant officers: grades', url: 'https://www.law.cornell.edu/uscode/text/10/571' },
  usc574: { label: '10 U.S.C. 574, Warrant officer active-duty list: promotion zones', url: 'https://www.law.cornell.edu/uscode/text/10/574' },
  wikiDopma: { label: 'Wikipedia: Defense Officer Personnel Management Act', url: 'https://en.wikipedia.org/wiki/Defense_Officer_Personnel_Management_Act' },
  cap: { label: 'army.mil: Command Assessment Program aligns with Human Resources Command', url: 'https://www.army.mil/article/275918/command_assessment_program_aligns_with_human_resources_command' },
  wikiLtg: { label: 'Wikipedia: Lieutenant general (United States)', url: 'https://en.wikipedia.org/wiki/Lieutenant_general_(United_States)' },
  wikiFourStar: { label: 'Wikipedia: List of United States Army four-star generals', url: 'https://en.wikipedia.org/wiki/List_of_United_States_Army_four-star_generals' },
  wikiGa: { label: 'Wikipedia: General of the Army (United States)', url: 'https://en.wikipedia.org/wiki/General_of_the_Army_(United_States)' },
  jcsBradley: { label: 'Joint Chiefs of Staff: General of the Army Omar Nelson Bradley', url: 'https://www.jcs.mil/about/the-joint-staff/chairman/general-of-the-army-omar-nelson-bradley/' },
  smaFirst: { label: "army.mil: Army's first SMA dies", url: 'https://www.army.mil/article/75172/armys_first_sma_dies' },
  ncoHistory7: { label: 'army.mil: Army NCO History, Part 7 (Korean and Vietnam Wars)', url: 'https://www.army.mil/article/18049/army_nco_history_part_7_korean_and_vietnam_wars' },
  woCentury: { label: 'army.mil: Army Warrant Officer Corps celebrates 100 years', url: 'https://www.army.mil/article/208174/army_warrant_officer_corps_celebrates_100_years' },
  fiveStar: { label: 'U.S. Army Center of Military History: Five-Star Generals', url: 'https://history.army.mil/Research/Reference-Topics/5-Star/' },
  usc619: { label: '10 U.S.C. 619, Eligibility for consideration for promotion', url: 'https://www.law.cornell.edu/uscode/text/10/619' },
  usc624: { label: '10 U.S.C. 624, Promotions: how made', url: 'https://www.law.cornell.edu/uscode/text/10/624' },
  usc601: { label: '10 U.S.C. 601, Positions of importance and responsibility', url: 'https://www.law.cornell.edu/uscode/text/10/601' },
  dodi132013: { label: 'DoDI 1320.13, Commissioned Officer Promotion Reports', url: 'https://www.esd.whs.mil/Portals/54/Documents/DD/issuances/dodi/132013p.pdf' },
} satisfies Record<string, Source>;

const army = 'army' as const;

export const rankDetails: RankDetail[] = [
  // ─── Enlisted ────────────────────────────────────────────────────────────────
  {
    branch: army,
    abbr: 'PVT',
    slug: 'private',
    summary:
      "Private (E-1) is the rank most new Soldiers hold when they ship to Basic Combat Training. A PVT has no insignia on the uniform; the job at this stage is to learn the basics, follow orders and earn the trust of the squad.",
    role: [
      'Trainee in Basic Combat Training and then Advanced Individual Training for an assigned MOS',
      'Learns drill, marksmanship, first aid, land navigation and Army values',
      'Carries out tasks assigned by team leaders and drill sergeants',
      'Meets the Army fitness and body composition standards',
      'Joins a first unit as a junior member of a team or section',
    ],
    promotion:
      "Most enlistees enter the Army as a PVT. Some start higher under enlistment options set out in AR 601-210, such as college credit or a degree or a civilian skill the Army needs, so not every recruit ever wears this grade. There is no promotion to PVT; it is the starting point. From here, advancement to Private (PV2) is automatic once the Soldier has served six months and the commander has no reason to hold it back.",
    history: [
      "Privates have been the bulk of the Army since 1775, when Continental regiments were built mostly of privates led by sergeants and corporals. For most of Army history the private wore no grade insignia at all, and that is still true of the E-1 today.",
      "When the Army reworked its enlisted insignia on 28 May 1968, the single chevron that had belonged to the private first class was moved down to the Private E-2. That left the E-1 as the one enlisted grade with a bare sleeve and collar.",
    ],
    faq: [
      { q: 'Do Army privates wear rank insignia?', a: 'No. A Private E-1 wears no grade insignia. The first insignia, a single chevron, comes with promotion to Private E-2.' },
      { q: 'Can you join the Army above private?', a: 'Yes. The Army enlists some recruits at a higher grade based on college credit, a degree or other qualifications. A four-year degree can bring entry as a Specialist.' },
      { q: 'How long are you a private in the Army?', a: 'Promotion to Private E-2 is normally automatic at six months of service, and commanders can waive it down to four months.' },
    ],
    sources: [S.armyRanks, S.tiohEnlisted, S.ar600819],
    unverified: [],
  },
  {
    branch: army,
    abbr: 'PV2',
    slug: 'private-e-2',
    summary:
      "Private (PV2) is the E-2 grade and the first one with insignia: a single chevron. It is usually reached at the end of initial training or soon after arrival at a first unit.",
    role: [
      'Junior member of a fire team, crew or section',
      'Completes or has just completed Advanced Individual Training in an MOS',
      'Maintains assigned weapon, gear and vehicle',
      'Performs duties such as guard, details and unit tasks under supervision',
      'Builds the job skills needed for promotion to PFC',
    ],
    promotion:
      "Promotion from PVT to PV2 is decentralized and essentially automatic: AR 600-8-19 sets it at six months of time in service, and commanders may waive it to four months. The commander can stop the promotion for cause, such as a flag for adverse action. Recruits who meet certain enlistment criteria start at PV2.",
    history: [
      "For much of the 20th century the lowest grades were simply 'private', distinguished by pay rather than by sleeve insignia. After 1958, when Congress added the E-8 and E-9 grades, the E-2 private still wore nothing.",
      "On 28 May 1968 a Department of the Army message gave the single chevron to the Private E-2 and created a new chevron-and-arc for the Private First Class. The PV2 has worn one chevron ever since, as a sewn rank and later as a pin-on and patch on the combat uniform.",
    ],
    faq: [
      { q: 'What is the difference between PVT and PV2?', a: 'Both are titled Private. PVT is E-1 with no insignia; PV2 is E-2 with one chevron and slightly higher pay.' },
      { q: 'How long does it take to make PV2?', a: 'Six months of service under AR 600-8-19, with a commander waiver possible at four months.' },
      { q: 'Is PV2 promotion automatic?', a: 'Largely. The personnel system promotes eligible Soldiers unless the commander acts to stop it.' },
    ],
    sources: [S.tiohEnlisted, S.ar600819, S.armyRanks],
    unverified: [],
  },
  {
    branch: army,
    abbr: 'PFC',
    slug: 'private-first-class',
    summary:
      "Private First Class (E-3) marks a Soldier who has learned the basics and is trusted to work with less supervision. The insignia is one chevron above one rocker.",
    role: [
      'Rifleman, crew member or MOS specialist on a team',
      'Trains newer privates in routine tasks',
      'May act as a team leader for short periods when NCOs are absent',
      'Keeps individual and team equipment ready',
      'Works toward Specialist and early leader development courses',
    ],
    promotion:
      "Promotion to PFC is decentralized, approved at unit level. The baseline is 12 months time in service and 4 months time in grade as a PV2. Commanders may advance a strong Soldier on a waiver at 6 months TIS and 2 months TIG, within the unit's waiver allowance.",
    history: [
      "The Army created a 'private (first class)' title in 1866. Until 1919 a PFC wore only the branch insignia; on 22 July 1919 the Secretary of War approved a single arc for the grade.",
      "In the 1920 reorganization into numbered pay grades, the PFC became the sixth grade and wore one chevron. That lasted until 28 May 1968, when the single chevron passed to the PV2 and the PFC received the current chevron above a rocker.",
    ],
    faq: [
      { q: 'How long does it take to make PFC in the Army?', a: 'Normally 12 months of service with 4 months as a PV2. A waiver allows promotion at 6 months of service and 2 months in grade.' },
      { q: 'Is a PFC a noncommissioned officer?', a: 'No. PFC is a junior enlisted grade. The NCO ranks start at Corporal.' },
      { q: 'What does the PFC insignia look like?', a: 'One chevron with one curved rocker beneath it.' },
    ],
    sources: [S.tiohEnlisted, S.ar600819, S.armyRanks],
    unverified: [],
  },
  {
    branch: army,
    abbr: 'SPC',
    slug: 'specialist',
    summary:
      "Specialist (E-4) is the most common junior enlisted rank in the Army. It shares a pay grade with Corporal but is not a noncommissioned officer; Specialists are valued for skill in their MOS rather than for leading a team.",
    role: [
      'Experienced operator in an MOS such as medic, mechanic, signal or intelligence specialist',
      'Supervises and trains privates on specific tasks',
      'Often serves as a senior rifleman, driver, gunner or radio operator',
      'Candidate for the Basic Leader Course and promotion to Sergeant',
      'Graduates of a four-year college may enlist directly at this grade',
    ],
    promotion:
      "Promotion to SPC is decentralized. The Army lists 24 months time in service and 6 months time in grade as the standard, and commanders can promote earlier on a waiver, at 18 months of service and 3 months in grade at the soonest, within a unit waiver ceiling. A Soldier with a bachelor's degree can enlist as a Specialist. From here, the move to Sergeant is competitive: the Soldier must be recommended by the commander, appear before a promotion board and earn enough promotion points.",
    history: [
      "The Army created specialist grades on 1 July 1955 to pay technical experts without making them NCOs. The E-4 version, Specialist Third Class, wore an eagle on a shield-shaped patch with no arcs.",
      "In 1958 the titles became numbered (SP4 through SP9). SP8 and SP9 were dropped in 1965, SP7 in 1978, and SP5 and SP6 on 1 October 1985. Only the E-4 grade survived, and Specialist Four became simply Specialist.",
      "The eagle device has stayed the core of the insignia since 1956, when the Army adopted it on a patch arched at the top.",
    ],
    faq: [
      { q: 'Is a Specialist higher than a Corporal?', a: 'No. Both are E-4 with the same pay, but a Corporal is an NCO and outranks a Specialist.' },
      { q: 'How long does it take to make Specialist?', a: 'The standard is 24 months of service and 6 months as a PFC; commanders may promote on a waiver as early as 18 months of service and 3 months in grade.' },
      { q: 'Why is the Specialist rank called the E-4 mafia?', a: 'It is informal slang. Specialists are numerous and experienced but hold no NCO authority, so the nickname pokes fun at their collective influence.' },
    ],
    sources: [S.tiohEnlisted, S.armyRanks, S.ar600819, S.wikiEnlisted],
    unverified: [],
  },
  {
    branch: army,
    abbr: 'CPL',
    slug: 'corporal',
    summary:
      "Corporal (E-4) is the first noncommissioned officer rank. A Corporal leads the smallest Army teams and is responsible for the individual training, appearance and readiness of the Soldiers in that team.",
    role: [
      'Fire team leader in an infantry or combat engineer squad',
      'Crew or section lead on a weapon system or vehicle',
      'Enforces standards of uniform, hygiene and equipment for a small team',
      'Conducts individual training and checks on Soldiers daily',
      'Reports to a sergeant or staff sergeant squad leader',
    ],
    promotion:
      "Most Corporals are Specialists who are laterally appointed to CPL because they fill an NCO leadership position, such as team leader. The pay grade does not change. In the Regular Army and Army Reserve, a commander at lieutenant colonel level or above can make the appointment without a board when the Soldier is assigned to an authorized NCO position in their own MOS. The March 2026 edition of AR 600-8-19 dropped the old rule that automatically made Specialists on the Sergeant promotion list into Corporals.",
    history: [
      "Corporals are as old as the Army. A July 1775 general order at Cambridge had corporals mark their rank with a green stripe on the right shoulder, and by 1821 they wore one chevron on the right arm.",
      "In the 1920 restructuring the Corporal became the fifth grade, with two chevrons, the same insignia used today. Since 1955 the Corporal has shared a pay grade with the Specialist, with the Corporal holding NCO authority.",
    ],
    faq: [
      { q: 'What is the difference between a Corporal and a Specialist?', a: 'Same E-4 pay grade, but the Corporal is a noncommissioned officer who leads a team. A Specialist is a junior enlisted technical expert.' },
      { q: 'How do you become a Corporal in the Army?', a: 'Usually by lateral appointment from Specialist, approved by a battalion-level or higher commander, when assigned to an NCO leadership position.' },
      { q: 'Does a Corporal get paid more than a Specialist?', a: 'No. Both are paid as E-4 with the same years of service.' },
    ],
    sources: [S.armyRanks, S.tiohEnlisted, S.ar600819, S.ar60020],
    unverified: [],
  },
  {
    branch: army,
    abbr: 'SGT',
    slug: 'sergeant',
    summary:
      "Sergeant (E-5) is the Army's first-line leader. A Sergeant typically leads a team or small section and is the leader closest to the daily work of every Soldier.",
    role: [
      'Team leader in a squad or section',
      'Section chief or senior operator in a technical MOS',
      'Supervises daily tasks, training and maintenance',
      'Counsels and mentors junior Soldiers',
      'Ensures each Soldier is trained and accounted for',
    ],
    promotion:
      "Promotion to SGT is semi-centralized. A commander recommends the Soldier, who appears before a promotion board and earns points for military training, education and awards. HQDA sets monthly cutoff scores by MOS, and Soldiers at or above the cutoff are promoted. Under AR 600-8-19 (March 2026), a Specialist or Corporal can be recommended in the primary zone at 34 months of service and 10 months in grade, and pin on at 36 and 12 months; the secondary zone, for standouts, allows a board at 16 and 4 months and promotion at 18 and 6. There is no leader-course requirement to go before the board or to pin on Sergeant; the Basic Leader Course becomes mandatory for the next step, Staff Sergeant.",
    history: [
      "Sergeants were part of the Continental Army from its first months: a 1775 order directed them to wear a red stripe on the right shoulder. By 1821 they wore a chevron below the elbow, and from 1903 to 1905 the Army turned chevrons from point-down to point-up.",
      "In the 1920 reorganization, Sergeant became the fourth grade with three chevrons. After the pay grades were renumbered in 1951 and expanded in 1958, Sergeant settled at E-5 with the same three chevrons.",
    ],
    faq: [
      { q: 'How long does it take to make Sergeant in the Army?', a: 'It depends on MOS cutoff scores. The primary zone opens at about three years of service, and secondary-zone promotions can come earlier.' },
      { q: 'What does an Army Sergeant do?', a: 'Leads a team or section, trains and checks on Soldiers daily, and carries out the squad leader\'s plan.' },
      { q: 'Do you need a board to make Sergeant?', a: 'Yes. Soldiers must be recommended and appear before a local promotion board before they can be placed on the promotion list.' },
    ],
    sources: [S.ar600819, S.hrcCos2026, S.armyRanks, S.tiohEnlisted],
    unverified: [],
  },
  {
    branch: army,
    abbr: 'SSG',
    slug: 'staff-sergeant',
    summary:
      "Staff Sergeant (E-6) leads a squad, usually 8 to 16 Soldiers. A Staff Sergeant enforces standards and trains Soldiers in both their job skills and the unit's mission.",
    role: [
      'Squad leader in an infantry, armor or engineer platoon',
      'Section sergeant in a support or technical unit',
      'Drill sergeant or recruiter on a broadening assignment',
      'Plans and runs squad-level training',
      'Mentors team leaders and develops future NCOs',
    ],
    promotion:
      "Like Sergeant, SSG is a semi-centralized promotion with a command recommendation, a local board and a points-based list. Under AR 600-8-19 (March 2026), a Sergeant can be recommended in the primary zone at 70 months of service and 16 months in grade and pin on at 72 and 18 months; the secondary zone opens at 46 and 6 months for the board and 48 and 8 for pin-on. Sergeants not yet recommended are added to the list automatically at 82 months of service and 22 months in grade. The Basic Leader Course must be finished before the board and before pin-on; the Advanced Leader Course is the requirement for the next step, Sergeant First Class.",
    history: [
      "The 1920 grade structure made Staff Sergeant the third grade, wearing three chevrons over one arc. The design matches today's SSG insignia, which has stayed essentially unchanged for over a century.",
      "Since the 1958 restructuring that added the E-8 and E-9 grades, the Staff Sergeant has been E-6. Specialist Six existed beside it from 1958 until 1 October 1985.",
    ],
    faq: [
      { q: 'How many Soldiers does a Staff Sergeant lead?', a: 'Usually a squad of 8 to 16 Soldiers, though the number varies by unit type.' },
      { q: 'How long does it take to make Staff Sergeant?', a: 'Many Soldiers reach it around six years of service, though it varies widely by MOS and points.' },
      { q: 'Is Staff Sergeant a senior NCO?', a: 'No. In the Army, senior NCOs start at Sergeant First Class (E-7).' },
    ],
    sources: [S.ar600819, S.hrcCos2026, S.armyRanks, S.tiohEnlisted],
    unverified: [],
  },
  {
    branch: army,
    abbr: 'SFC',
    slug: 'sergeant-first-class',
    summary:
      "Sergeant First Class (E-7) is the first senior NCO rank. Most SFCs are platoon sergeants, the key assistant and advisor to the platoon leader and the one most responsible for the platoon's training and care.",
    role: [
      'Platoon sergeant for a platoon of roughly 16 to 44 Soldiers',
      'Senior NCO in a battalion or brigade staff section',
      'Instructor, drill sergeant leader or observer-coach-trainer',
      'Mentors a new lieutenant platoon leader',
      'Manages platoon training plans, maintenance and accountability',
    ],
    promotion:
      "Promotion to SFC is centralized. Each year a Department of the Army board reviews the records of eligible Staff Sergeants, scoring performance evaluations, assignments and schooling. Selected Soldiers receive a sequence number and pin on as vacancies open. HQDA announces the time-in-service and time-in-grade zones for each year's board, and graduation from the Advanced Leader Course is required before pin-on. The Senior Leader Course comes next, as the requirement for Master Sergeant.",
    history: [
      "A 'sergeant first class' title was used in the Army in the late 1800s and dropped in 1920. The Army revived it in 1948 in place of technical sergeant, and under the numbered pay grades of the early 1950s it was E-6. When Congress added E-8 and E-9 in 1958, Sergeant First Class moved up to E-7 with three chevrons over two arcs.",
      "The E-7 had been the senior enlisted grade before 1958, called Master Sergeant. The 1958 change created the room for today's senior NCO ladder above SFC.",
    ],
    faq: [
      { q: 'What does a Sergeant First Class do?', a: 'Most serve as platoon sergeants, running the platoon\'s training, maintenance and welfare beside the platoon leader.' },
      { q: 'Is SFC selected by a board?', a: 'Yes. Promotion to SFC is by an annual centralized Department of the Army selection board.' },
      { q: 'What is the difference between a SFC and a Master Sergeant?', a: 'A Master Sergeant is E-8, one grade higher, and usually serves as a principal NCO on a staff.' },
    ],
    sources: [S.armyRanks, S.tiohEnlisted, S.ar600819, S.wikiSfc],
    unverified: [],
  },
  {
    branch: army,
    abbr: 'MSG',
    slug: 'master-sergeant',
    summary:
      "Master Sergeant (E-8) is a senior NCO who usually serves as the principal NCO in a battalion or higher staff section. MSG shares the E-8 grade with First Sergeant, the command-focused title.",
    role: [
      'Principal NCO of a battalion or brigade staff section such as operations or logistics',
      'Senior enlisted subject matter expert in an MOS',
      'Operations sergeant in special operations units',
      'Advises staff officers on enlisted training and readiness',
      'Can be laterally appointed First Sergeant when placed in a company',
    ],
    promotion:
      "Promotion to MSG is by an annual centralized HQDA selection board that also selects for First Sergeant. Board members review evaluations, assignments and PME. HQDA announces the time-in-service and time-in-grade zones each year. Selected SFCs are promoted in sequence as the Army needs them, and must have graduated from the Senior Leader Course before they pin on.",
    history: [
      "In 1920 Master Sergeant was the first grade, the highest enlisted rank, with three chevrons tied to three arcs. The design has hardly changed since.",
      "The grade numbers were reversed in 1951, making Master Sergeant E-7. When E-8 and E-9 were added in 1958, Master Sergeant became E-8, and the old 'top' grade became a middle senior NCO rank.",
      "Between 1958 and 1965 the E-8 grade also had a Specialist Eight on paper, marked by three arcs above the eagle and one chevron below. It was discontinued in 1965, leaving Master Sergeant and First Sergeant as the only E-8 titles.",
    ],
    faq: [
      { q: 'Is a Master Sergeant the same as a First Sergeant?', a: 'Same E-8 pay grade, but a First Sergeant is the senior NCO of a company. A Master Sergeant usually works on a staff.' },
      { q: 'How do you address a Master Sergeant?', a: 'As Master Sergeant.' },
      { q: 'How is Master Sergeant selected?', a: 'By an annual centralized Department of the Army promotion board.' },
    ],
    sources: [S.armyRanks, S.tiohEnlisted, S.ar600819],
    unverified: [],
  },
  {
    branch: army,
    abbr: '1SG',
    slug: 'first-sergeant',
    summary:
      "First Sergeant (E-8) is the senior NCO of a company, battery or troop. The 1SG advises the commander, trains the enlisted Soldiers and runs the daily life of the unit.",
    role: [
      'Senior enlisted leader of a company-sized unit',
      'Advises the company commander on discipline, morale and training',
      'Oversees accountability, duty rosters and unit standards',
      'Mentors platoon sergeants and junior NCOs',
      'Leads formations and represents the enlisted Soldiers to the commander',
    ],
    promotion:
      "First Sergeant is a position as much as a rank. Soldiers reach the E-8 grade through the same centralized HQDA board that selects Master Sergeants. A Master Sergeant is appointed First Sergeant when assigned to an authorized 1SG position and wears the diamond while in it; on moving to a job that does not call for a 1SG, the Soldier goes back to the Master Sergeant title.",
    history: [
      "First sergeants appear in the Army's titles by 1861, and the role is older. The diamond, or lozenge, comes from heraldry, where it marks achievement.",
      "In 1920 the First Sergeant was placed in the second grade with three chevrons, two arcs and a lozenge. Change 3 to AR 600-35 on 22 September 1942 moved the 1SG to the first grade, with a hollow lozenge over three arcs. Since 1958 the First Sergeant has been E-8.",
    ],
    faq: [
      { q: 'Why is the First Sergeant called Top?', a: 'It is traditional slang for the senior NCO in a company, the top enlisted leader of that unit.' },
      { q: 'Does a First Sergeant outrank a Master Sergeant?', a: 'Both are E-8. By position, the First Sergeant is the senior NCO of a company, but neither commands the other by rank alone.' },
      { q: 'What does the diamond on the 1SG rank mean?', a: 'It is a lozenge from heraldry used to mark distinction, adopted for first sergeants in the 1920 insignia.' },
    ],
    sources: [S.armyRanks, S.tiohEnlisted, S.ar600819, S.wikiEnlisted],
    unverified: [],
  },
  {
    branch: army,
    abbr: 'SGM',
    slug: 'sergeant-major',
    summary:
      "Sergeant Major (E-9) is the highest enlisted grade. A Sergeant Major serves as a technical expert and senior enlisted advisor to a primary staff officer at battalion level or higher.",
    role: [
      'Operations sergeant major in a brigade or division staff',
      'Senior enlisted advisor to a primary staff officer',
      'Principal enlisted expert for a career field',
      'Instructor or leader at the Sergeants Major Academy',
      'Pool from which Command Sergeants Major are selected',
    ],
    promotion:
      "Sergeants Major are selected by a centralized HQDA board from Master Sergeants and First Sergeants. Selection is competitive and limited by the number of E-9 positions, and HQDA sets the eligibility zones each year. The Master Leader Course is required to be selected for the Sergeants Major Academy, and graduation from the Sergeants Major Course is required to pin on, though the Army can promote students conditionally while they finish it.",
    history: [
      "The sergeant major is the oldest NCO title in the regimental headquarters. The Journals of the Continental Congress in 1776 placed a sergeant-major in each battalion's headquarters, the first appearance of the title.",
      "When Congress created the E-9 grade in 1958, the Army gave Sergeant Major three chevrons over three arcs with a five-pointed star between them, as described in AR 670-5 in 1959.",
    ],
    faq: [
      { q: 'Is a Sergeant Major the highest enlisted rank?', a: 'Sergeant Major shares the E-9 grade with Command Sergeant Major and the Sergeant Major of the Army, which together are the top of the enlisted ranks.' },
      { q: 'What is the difference between a SGM and a CSM?', a: 'Both are E-9. A SGM serves a staff; a CSM is the senior enlisted leader of a command and advises the commander.' },
      { q: 'How hard is it to make Sergeant Major?', a: 'It is a board selection with few openings, so only a small share of Master Sergeants are selected.' },
    ],
    sources: [S.armyRanks, S.tiohEnlisted, S.ar600819],
    unverified: [],
  },
  {
    branch: army,
    abbr: 'CSM',
    slug: 'command-sergeant-major',
    summary:
      "Command Sergeant Major (E-9) is the senior NCO of a battalion or higher command. The CSM advises the commander and staff, enforces standards and oversees the unit's training program.",
    role: [
      'Senior enlisted leader of a battalion, brigade, division, corps or Army command',
      'Advises the commander on all enlisted matters',
      'Enforces standards across the command',
      'Shapes and supervises unit training and NCO development',
      'Leads the command\'s NCO support channel',
    ],
    promotion:
      "Command Sergeants Major are drawn from Sergeants Major and qualified Master Sergeants and First Sergeants. A centralized HQDA board produces a Centralized Selection List for battalion and brigade CSM positions, and the Army has added an assessment program for senior enlisted leaders that feeds into it. Selected Soldiers are then slated to specific commands.",
    history: [
      "The Army established the command sergeant major program in the late 1960s under Chief of Staff Gen. Harold K. Johnson, separating command positions from staff Sergeants Major. Army histories date the program to 1967; the distinct insignia followed in 1968.",
      "On 28 May 1968 a Department of the Army message authorized a new insignia for Sergeants Major serving as the principal NCO of battalion and higher: the SGM insignia with a smaller star surrounded by a wreath.",
      "The wreathed star has stayed the mark of the CSM since then. Later changes affected how it is worn rather than its design, such as the 1981 approval of shoulder marks for corporals and above on the green shirt and sweater.",
    ],
    faq: [
      { q: 'Is a Command Sergeant Major higher than a Sergeant Major?', a: 'Both are E-9. The CSM holds a command position and advises the commander directly.' },
      { q: 'What does the wreath on CSM rank mean?', a: 'The wreath around the star marks the Soldier as a command sergeant major, adopted in 1968.' },
      { q: 'How many CSMs does a unit have?', a: 'One per command at battalion level and higher.' },
    ],
    sources: [S.armyRanks, S.tiohEnlisted, S.ncoHistory7, S.csmCsl, S.cap, S.wikiEnlisted],
    unverified: [],
  },
  {
    branch: army,
    abbr: 'SMA',
    slug: 'sergeant-major-of-the-army',
    summary:
      "The Sergeant Major of the Army is the Army's top enlisted Soldier and only one holds the title at a time. The SMA advises the Chief of Staff of the Army on all enlisted matters.",
    role: [
      'Senior enlisted advisor to the Chief of Staff of the Army',
      'Represents enlisted Soldiers to Army leadership and Congress',
      'Oversees NCO professional development and standards',
      'Visits units worldwide to assess training and quality of life',
      'Leads Army enlisted policy initiatives',
    ],
    promotion:
      "The SMA is not a board promotion. The Chief of Staff of the Army chooses the SMA, normally from among serving command sergeants major. The SMA receives special basic pay set apart from other E-9s.",
    history: [
      "The idea of a single Army senior enlisted advisor was proposed in the early 1960s. On 11 July 1966, Sergeant Major William O. Wooldridge became the first Sergeant Major of the Army, and he served until August 1968.",
      "The Army authorized a distinct SMA insignia in 1979: three chevrons and three arcs with two stars between them. In 1994 the coat of arms of the United States was added between the stars, giving the current design.",
    ],
    faq: [
      { q: 'Who was the first Sergeant Major of the Army?', a: 'William O. Wooldridge, appointed on 11 July 1966.' },
      { q: 'Is the SMA the highest enlisted rank?', a: 'Yes, in the Army. The Senior Enlisted Advisor to the Chairman of the Joint Chiefs is the senior enlisted position across the services.' },
      { q: 'How is the SMA chosen?', a: 'By the Chief of Staff of the Army, from the Army\'s senior command sergeants major.' },
    ],
    sources: [S.armyRanks, S.smaFirst, S.tiohEnlisted, S.wikiSma],
    unverified: [],
  },


  // ─── Warrant officers ────────────────────────────────────────────────────────
  {
    branch: army,
    abbr: 'WO1',
    slug: 'warrant-officer-1',
    summary:
      "Warrant Officer 1 is the entry grade for Army warrant officers, the service's technical and tactical specialists. A WO1 is appointed by a warrant from the Secretary of the Army rather than commissioned, and spends a career going deep in one field instead of rotating through command.",
    role: [
      'Rotary-wing aviator flying Apache, Black Hawk or Chinook aircraft',
      'Technical specialist in fields such as cyber, intelligence, signal, maintenance or military police investigations',
      'Technical advisor to a company or detachment commander',
      'Operator and trainer on a specialized weapon or information system',
      'Manages property, maintenance programs or technical records for a unit',
    ],
    promotion:
      "Most applicants are enlisted Soldiers, often sergeants and staff sergeants with strong experience in a feeder MOS; aviation also accepts qualified civilians and Soldiers from any MOS. A selection board reviews each packet. Those selected attend Warrant Officer Candidate School, are appointed WO1 on graduation, and then complete the Warrant Officer Basic Course for their specialty before reporting to a unit. Prerequisites, such as years of experience and test scores, differ by specialty and are set by each branch proponent.",
    history: [
      "The Army Warrant Officer Corps dates its birthday to 9 July 1918, when an appropriations act created the Army Mine Planter Service in the Coast Artillery Corps. Its masters, mates and engineers held office as warrant officers. Army field clerks were redesignated as warrant officers in June 1920.",
      "Warrant officers first received an identifying collar insignia on 12 May 1921, an eagle rising on a bundle of arrows inside a wreath. Grade insignia followed on 4 September 1942: gold bars with brown enamel.",
      "On 10 June 1970 the Chief of Staff approved new, easier-to-read bars, effective 1 July 1972. Since 9 July 2004, Army warrant officers wear the insignia and colors of their basic branch, such as Aviation or Military Intelligence, instead of the eagle rising.",
    ],
    faq: [
      { q: 'Is a Warrant Officer 1 a commissioned officer?', a: 'No. A WO1 holds a warrant from the Secretary of the Army. The commission comes with promotion to Chief Warrant Officer 2.' },
      { q: 'Does a WO1 outrank a Sergeant Major?', a: 'Yes. Every warrant officer ranks above every enlisted Soldier, though a new WO1 will rely on senior NCOs for advice like any new officer.' },
      { q: 'Can a civilian become an Army warrant officer?', a: 'Yes, for aviation through the high school to flight school path. Most other warrant specialties require prior enlisted experience in a related field.' },
    ],
    sources: [S.armyRanks, S.tiohWarrant, S.woCentury, S.ruckerWo],
    unverified: [],
  },
  {
    branch: army,
    abbr: 'CW2',
    slug: 'chief-warrant-officer-2',
    summary:
      "Chief Warrant Officer 2 is the intermediate grade for Army warrant officers and the point at which they receive a commission from the President. A CW2 is a proven technician who takes on wider duties from detachment up to battalion level.",
    role: [
      'Pilot in command or air mission commander in an aviation unit',
      'Battalion-level technician in a staff section such as signal, intelligence or maintenance',
      'Supervises a technical team or shop',
      'Advises company and battalion commanders on the employment of systems in the specialty',
      'Trains junior warrant officers, NCOs and Soldiers on technical tasks',
    ],
    promotion:
      "Promotion from WO1 to CW2 is not a competitive board. Warrant officers who are fully qualified are promoted after two years of warrant officer service, and the promotion brings a commission. For aviation warrant officers commissioned since October 2021, those two years start only after flight school and the Warrant Officer Basic Course are complete. From CW2 upward, each promotion is decided by a centralized Department of the Army selection board.",
    history: [
      "The title chief warrant officer dates to Public Law 230 of 21 August 1941, which created two grades of warrant officer. The insignia approved in 1942 marked the chief warrant officer with a gold bar, brown enamel and a lengthwise gold stripe.",
      "Legislation approved on 12 October 1949 created four warrant officer grades, but the insignia drawn for them was never put into use. New designs followed in 1956 under AR 670-5, and the 1970 study produced the silver bar with squares that identifies each grade at a glance.",
    ],
    faq: [
      { q: 'Is a CW2 a commissioned officer?', a: 'Yes. Army warrant officers are commissioned when promoted to Chief Warrant Officer 2.' },
      { q: 'How long does it take to make CW2?', a: 'Two years of warrant officer service for an officer who stays fully qualified (for aviators, counted from the end of flight school and the basic course). It is not a competitive board.' },
      { q: 'How do you address a Chief Warrant Officer 2?', a: 'Formally as Chief Warrant Officer, and commonly as Chief or Mister/Ms. with the last name.' },
    ],
    sources: [S.armyRanks, S.tiohWarrant, S.tiohOrigin, S.woDor],
    unverified: [],
  },
  {
    branch: army,
    abbr: 'CW3',
    slug: 'chief-warrant-officer-3',
    summary:
      "Chief Warrant Officer 3 is an advanced-level expert and technical leader who directs and supervises others. CW3s support operations from the team or detachment level up to brigade.",
    role: [
      'Instructor pilot, maintenance test pilot or aviation safety officer',
      'Brigade-level technician or senior warrant in a battalion',
      'Supervises other warrant officers and NCOs in a technical section',
      'Integrates the specialty into the unit plan and exercises',
      'Advises commanders on readiness, risk and training in the field',
    ],
    promotion:
      "Promotion to CW3 is by selection. A centralized Department of the Army board reviews the records of eligible CW2s each year, weighing evaluations, assignments and education. Federal law bars a chief warrant officer from being considered until completing two years on active duty in the current grade, and the Warrant Officer Advanced Course is the professional education course that prepares officers for this level.",
    history: [
      "The CW3 grade traces to the 1949 law that created four warrant officer grades, though separate insignia for each did not arrive until the 1950s.",
      "The current silver bar with three black squares belongs to the family of insignia approved by the Chief of Staff on 10 June 1970 and worn from 1 July 1972. Like all Army warrant officers since 2004, a CW3 wears the insignia of a basic branch.",
    ],
    faq: [
      { q: 'What does a CW3 do?', a: 'Serves as an advanced technical leader, often the senior warrant officer in a battalion or a key expert at brigade.' },
      { q: 'Is CW3 promotion by board?', a: 'Yes. Promotion to CW3 is decided by an annual centralized Department of the Army selection board.' },
      { q: 'What school does a CW3 need?', a: 'The Warrant Officer Advanced Course is the professional education linked to this grade.' },
    ],
    sources: [S.armyRanks, S.tiohWarrant, S.usc574],
    unverified: [],
  },
  {
    branch: army,
    abbr: 'CW4',
    slug: 'chief-warrant-officer-4',
    summary:
      "Chief Warrant Officer 4 is a senior-level expert who supports units from battalion up to echelons above corps. CW4s also mentor other warrant officers and advise commanders on warrant officer matters.",
    role: [
      'Senior technical advisor on a brigade, division or corps staff',
      'Standardization instructor pilot or aviation tactical operations officer',
      'Senior warrant officer advisor to a brigade commander',
      'Develops and mentors junior warrant officers',
      'Leads complex technical programs that span several units',
    ],
    promotion:
      "Promotion to CW4 is by a centralized Department of the Army selection board. Federal law requires at least two years on active duty as a CW3 before consideration. Warrant Officer Intermediate Level Education is the professional education course aimed at this level.",
    history: [
      "On 8 April 1988 the Chief of Staff approved a Master Warrant Officer insignia for certain CW4s who completed a course at the Warrant Officer school at Fort Rucker. The first class graduated on 8 December 1988.",
      "The Master Warrant Officer title ended when the CW5 grade was created in 1991. The CW4 insignia today is a silver bar with four black squares, worn with the officer's basic branch insignia.",
      "On 24 February 2004 the Chief of Staff approved branch insignia and colors for warrant officers, a request from the Army Training and Leader Development Panel meant to fold warrant officers into the branch system of the wider officer corps. CW4s and all other warrant officers made the switch on 9 July 2004.",
    ],
    faq: [
      { q: 'What was a Master Warrant Officer?', a: 'A designation for selected CW4s who completed a senior course, approved in 1988. It was folded into the new CW5 grade in 1991.' },
      { q: 'How is CW4 selected?', a: 'By a centralized Department of the Army selection board.' },
      { q: 'At what level does a CW4 usually serve?', a: 'From battalion up to corps and higher headquarters.' },
    ],
    sources: [S.armyRanks, S.tiohWarrant, S.usc574],
    unverified: [],
  },
  {
    branch: army,
    abbr: 'CW5',
    slug: 'chief-warrant-officer-5',
    summary:
      "Chief Warrant Officer 5 is the master-level technical and tactical expert. CW5s serve from brigade up to major commands and provide leader development and counsel to both warrant and commissioned officers.",
    role: [
      'Command chief warrant officer of a division, corps or Army command',
      'Master-level technical advisor on senior staffs',
      'Shapes warrant officer policy, training and career management',
      'Mentors warrant officers across a command',
      'Represents the specialty in joint and multinational settings',
    ],
    promotion:
      "Promotion to CW5 is by a centralized Department of the Army selection board. By law, no more than 5 percent of a service's active-duty warrant officers may be CW5s, so selection is highly competitive. Officers need at least two years on active duty as a CW4 before consideration, and Warrant Officer Senior Service Education is the senior course linked to this level.",
    history: [
      "The Warrant Officer Management Act, signed on 5 December 1991, created the grade of Chief Warrant Officer 5. The Army kept the Master Warrant Officer insignia for the new grade at first.",
      "A CW5 insignia designed in 1970 for an expected future grade was finally approved by Chief of Staff Gen. Peter J. Schoomaker on 16 December 2003: a silver bar with a black line down the center. Wear began on 9 July 2004, the 86th anniversary of the corps, and the design matched the CW5 insignia of the other services.",
    ],
    faq: [
      { q: 'When was CW5 created?', a: 'By the Warrant Officer Management Act of 1991.' },
      { q: 'What does the CW5 insignia look like?', a: 'A silver bar with a single black stripe running down the middle, worn since July 2004.' },
      { q: 'Is CW5 the highest warrant officer grade?', a: 'Yes. W-5 is the top of the warrant officer grades.' },
    ],
    sources: [S.armyRanks, S.tiohWarrant, S.usc571, S.usc574],
    unverified: [],
  },

  // ─── Commissioned officers ───────────────────────────────────────────────────
  {
    branch: army,
    abbr: '2LT',
    slug: 'second-lieutenant',
    summary:
      "Second Lieutenant is the usual entry grade for Army commissioned officers. A 2LT typically leads a platoon of 16 to 44 Soldiers, working side by side with an experienced platoon sergeant.",
    role: [
      'Platoon leader in a combat, support or service unit',
      'Plans and supervises platoon training and missions',
      'Responsible for the platoon\'s equipment, maintenance and accountability',
      'Learns the trade from the platoon sergeant and company commander',
      'Completes the Basic Officer Leader Course for the assigned branch',
    ],
    promotion:
      "Officers are commissioned as 2LTs through the U.S. Military Academy at West Point, the Reserve Officers' Training Corps at a college or university, or Officer Candidate School for enlisted Soldiers and college graduates. Some professionals, such as doctors and lawyers, enter at higher grades. Federal law allows promotion to First Lieutenant after 18 months in grade, and in the Army that step is handled by the officer's chain of command for officers who are fully qualified.",
    history: [
      "In the Continental Army the junior officers were lieutenants, cornets and ensigns. Cornets and ensigns were abolished in 1800, and the grade of second lieutenant was established in their place.",
      "For more than a century the 2LT had no grade insignia; the epaulette or shoulder strap alone marked an officer. When the United States entered World War I and only the olive drab service uniform was worn, an insignia became urgent. The Army rejected a plan to give captains three bars and adopted a single gold bar for second lieutenants in December 1917, following the precedent of the major's gold leaf.",
    ],
    faq: [
      { q: 'Why is the second lieutenant bar gold?', a: 'The Army wanted to avoid changing existing insignia, so in 1917 it gave the new 2LT bar the same gold color that set the major apart from the lieutenant colonel.' },
      { q: 'How long are you a second lieutenant in the Army?', a: 'Usually about 18 months. Federal law allows promotion to First Lieutenant after 18 months in grade.' },
      { q: 'What does a second lieutenant do?', a: 'Leads a platoon. The 2LT is responsible for the platoon\'s training and missions, guided by the platoon sergeant.' },
    ],
    sources: [S.armyRanks, S.tiohOfficer, S.tiohOrigin, S.usc624],
    unverified: [],
  },
  {
    branch: army,
    abbr: '1LT',
    slug: 'first-lieutenant',
    summary:
      "First Lieutenant is the second commissioned grade. A 1LT is an experienced platoon leader who often moves on to lead a specialized platoon or serve as a company executive officer, second in command of the company.",
    role: [
      'Company executive officer, running logistics and maintenance for the commander',
      'Leader of a specialized platoon such as mortars, scouts or a fire direction center',
      'Battalion staff officer in an early assignment',
      'Platoon leader with more responsibility than a new 2LT',
      'Acts as company commander when the commander is absent',
    ],
    promotion:
      "Promotion from 2LT to 1LT comes after 18 months in grade for officers who are fully qualified, as federal law permits. The chain of command confirms the officer is ready; there is no competitive board. To become a Captain, a 1LT is considered by a Department of the Army promotion board, and federal law does not allow the promotion until the officer has two years in grade.",
    history: [
      "The first lieutenant's single bar dates to 1836, when shoulder straps were adopted for field duty. Captains received two bars and first lieutenants one, in gold or silver to contrast with the strap's border.",
      "In 1851 all strap borders became gold and the lieutenants' bars stayed gold. In 1872 epaulettes were abolished and the bars of captains and first lieutenants were changed from gold to silver to match the silver insignia of senior officers. The single silver bar has marked the 1LT ever since.",
    ],
    faq: [
      { q: 'Is a first lieutenant higher than a second lieutenant?', a: 'Yes. First Lieutenant (O-2) is one grade above Second Lieutenant (O-1), even though silver looks less impressive than gold.' },
      { q: 'Why is the 1LT bar silver?', a: 'In 1872 the Army changed captains\' and first lieutenants\' bars from gold to silver to match senior officers\' silver insignia.' },
      { q: 'How long until a 1LT makes Captain?', a: 'At least two years as a 1LT under federal law, plus selection by a Department of the Army board.' },
    ],
    sources: [S.armyRanks, S.tiohOfficer, S.usc619, S.usc624],
    unverified: [],
  },
  {
    branch: army,
    abbr: 'CPT',
    slug: 'captain',
    summary:
      "Captain is the grade of company command. A CPT commands a company, battery or troop of 60 to 200 Soldiers with a first sergeant as the senior NCO, and often serves as a battalion or brigade staff officer before or after command.",
    role: [
      'Company, battery or troop commander',
      'Battalion or brigade staff officer in operations, intelligence or logistics',
      'Instructor at a branch school, ROTC program or West Point',
      'Small-group leader or observer-controller at a training center',
      'Specialized officer in medicine, law or chaplaincy',
    ],
    promotion:
      "Promotion to CPT is by a Department of the Army board that considers First Lieutenants; federal law does not allow the promotion until an officer has two years in grade. Captains then attend the Captains Career Course for their branch, which prepares them for company command and staff work.",
    history: [
      "In July 1775 Washington's orders had captains wear yellow or buff cockades to set them apart from other officers. In 1780 captains were marked by an epaulette on the right shoulder, and in 1821 by a gold or silver chevron above the elbow.",
      "The two bars came in 1836 with the shoulder strap. They were gold or silver to contrast with the strap's border, became gold in 1851, and changed to silver in 1872 when epaulettes were abolished, so they would match the insignia of senior officers.",
    ],
    faq: [
      { q: 'How many Soldiers does an Army captain command?', a: 'Usually a company, battery or troop of about 60 to 200 Soldiers.' },
      { q: 'Is an Army captain the same as a Navy captain?', a: 'No. An Army captain is O-3. A Navy captain is O-6, equal to an Army colonel.' },
      { q: 'How long does it take to make captain in the Army?', a: 'At least three and a half years of commissioned service under federal law: 18 months as a 2LT, then two years as a 1LT, plus selection by a board.' },
    ],
    sources: [S.armyRanks, S.tiohOfficer, S.usc619],
    unverified: [],
  },
  {
    branch: army,
    abbr: 'MAJ',
    slug: 'major',
    summary:
      "Major is the first field-grade officer rank. Majors are the primary staff officers for brigades and task forces, running personnel, intelligence, operations and logistics, and they serve as battalion executive officers and operations officers.",
    role: [
      'Battalion executive officer or operations officer (S3)',
      'Primary staff officer at brigade, such as S2 intelligence or S4 logistics',
      'Planner on a division or corps staff',
      'Instructor at the Command and General Staff College or a branch school',
      'Joint staff officer at a combatant command',
    ],
    promotion:
      "Promotion to MAJ is competitive and decided by a Department of the Army selection board. Federal law requires at least three years as a Captain before consideration. Defense Department guidance has aimed to promote officers to O-4 at about ten years of service, with a selection opportunity of about 80 percent. Majors complete Intermediate Level Education, such as the Command and General Staff Officer Course.",
    history: [
      "Field officers were first marked in 1775 by red or pink hat cockades. The leaf was introduced in the General Regulations of 1835 for both lieutenant colonels and majors, in gold or silver depending on the strap border, so both grades wore both colors for a time.",
      "In 1851 all strap borders became gold, so the major's leaf became gold and the lieutenant colonel's silver. When epaulettes were abolished in 1872, the major's gold leaf moved to the dress uniform to tell majors from second lieutenants. A 1912 regulation first specified that the leaf was an oak leaf.",
    ],
    faq: [
      { q: 'Is a major higher than a captain?', a: 'Yes. Major (O-4) is one grade above Captain (O-3) and is the first field-grade rank.' },
      { q: 'Why is the major\'s leaf gold?', a: 'Since 1851, when all shoulder strap borders became gold, the major has worn a gold leaf and the lieutenant colonel a silver one.' },
      { q: 'How long does it take to make major?', a: 'Defense guidance has targeted about ten years of service, with at least three years as a captain required by law.' },
    ],
    sources: [S.armyRanks, S.tiohOfficer, S.usc619, S.dodi132013, S.wikiDopma],
    unverified: [],
  },
  {
    branch: army,
    abbr: 'LTC',
    slug: 'lieutenant-colonel',
    summary:
      "Lieutenant Colonel is the grade of battalion command. An LTC typically commands a battalion of 300 to 1,000 Soldiers, and others serve as senior staff officers at division, corps and joint headquarters.",
    role: [
      'Battalion or squadron commander',
      'Brigade executive officer or deputy commander',
      'Division or corps staff section chief',
      'Senior joint or Army staff officer in the Pentagon',
      'Professor of military science at a ROTC program',
    ],
    promotion:
      "Promotion to LTC is by a Department of the Army selection board after at least three years as a Major, the federal minimum. Defense Department guidance has aimed for promotion to O-5 at about 16 years of service with a selection opportunity of about 70 percent. Battalion command is a separate, highly competitive selection: candidates go through the Battalion Commander Assessment Program, part of the Army's Command Assessment Program, and a centralized board builds the Centralized Selection List of future commanders.",
    history: [
      "The silver leaf took shape between 1835 and 1851. In 1835 both lieutenant colonels and majors wore a leaf whose color depended on the border of the shoulder strap. When all borders became gold in 1851, the lieutenant colonel's leaf became silver for good.",
      "The 1912 regulation described it as an oak leaf worn point up. The silver oak leaf is shared today by the Army, Marine Corps, Air Force and Space Force, and its Navy equivalent is worn by commanders.",
    ],
    faq: [
      { q: 'What does a lieutenant colonel do in the Army?', a: 'Most command a battalion of several hundred Soldiers or lead a major staff section at division or above.' },
      { q: 'Is a silver oak leaf higher than a gold one?', a: 'Yes. The silver oak leaf is Lieutenant Colonel (O-5); the gold oak leaf is Major (O-4).' },
      { q: 'How long does it take to make lieutenant colonel?', a: 'Defense guidance has targeted about 16 years of service, with at least three years as a major.' },
    ],
    sources: [S.armyRanks, S.tiohOfficer, S.usc619, S.dodi132013, S.wikiDopma, S.cap],
    unverified: [],
  },
  {
    branch: army,
    abbr: 'COL',
    slug: 'colonel',
    summary:
      "Colonel is the senior field-grade rank. A COL typically commands a brigade of 1,500 to 3,200 Soldiers or leads a major staff agency at division level and above.",
    role: [
      'Brigade commander',
      'Chief of staff of a division',
      'Director of a major staff section at corps, Army or joint level',
      'Garrison commander of an Army installation',
      'Senior faculty or department head at a war college',
    ],
    promotion:
      "Promotion to COL is by a Department of the Army selection board after at least three years as a Lieutenant Colonel, the federal minimum. Defense Department guidance has aimed for promotion to O-6 at about 22 years of service with a selection opportunity of about 50 percent. Brigade command is a separate and very selective centralized choice. Most colonels have completed Senior Service College, such as the Army War College.",
    history: [
      "Colonels were first marked by red or pink hat cockades in 1775. There is evidence of colonels wearing the eagle as rank insignia by 1829, and in 1832 the eagle was formally initiated: gold for infantry colonels on silver epaulettes and silver for all others.",
      "In 1851 all epaulettes became gold, so the colonel's eagle became silver for everyone. In 1926 the insignia was made in pairs so the eagle's head faced forward on each shoulder. Since 1951 the eagle faces the olive branch on both sides, and the so-called war eagle facing the arrows is no longer authorized.",
    ],
    faq: [
      { q: 'Why is a colonel called a full bird?', a: 'It is slang for the colonel\'s silver eagle, which separates a colonel from a lieutenant colonel.' },
      { q: 'What does an Army colonel command?', a: 'Usually a brigade of about 1,500 to 3,200 Soldiers.' },
      { q: 'Is the colonel\'s eagle supposed to face a certain way?', a: 'Yes. Since 1951 the eagle\'s head faces the olive branch on both the left and right insignia.' },
    ],
    sources: [S.armyRanks, S.tiohOfficer, S.tiohOrigin, S.usc619, S.dodi132013, S.wikiDopma],
    unverified: [],
  },
  {
    branch: army,
    abbr: 'BG',
    slug: 'brigadier-general',
    summary:
      "Brigadier General is the first general officer grade. A BG usually serves as a deputy commander of a division, helping the commanding general plan and coordinate operations, or leads a major staff directorate or command.",
    role: [
      'Deputy commanding general of a division',
      'Commander of a training center, school or support command',
      'Director on the Army Staff or a joint staff',
      'Assistant adjutant general in a state National Guard',
      'Chief of staff of a corps or Army service component command',
    ],
    promotion:
      "Colonels are selected for BG by a general officer selection board. The President nominates selected officers and the Senate must confirm them. Federal law requires at least one year as a Colonel, and the number of general officers is capped by law, so selection is extremely competitive.",
    history: [
      "The first general officer insignia, set by a general order of 14 July 1775, was a pink ribbon worn across the breast by major and brigadier generals. The star arrived on 18 June 1780, when Washington prescribed one star on each epaulette for brigadier generals and two for major generals.",
      "That 1780 order is the start of the present system of officer insignia. The single silver star has marked the brigadier general ever since, and today it is worn on the collar, shoulder or chest depending on the uniform.",
    ],
    faq: [
      { q: 'What does a one-star general do?', a: 'Often serves as a deputy commander of a division or leads a school, center or staff directorate.' },
      { q: 'Does the Senate confirm brigadier generals?', a: 'Yes. All general officer promotions are nominated by the President and confirmed by the Senate.' },
      { q: 'Why is it called brigadier general?', a: 'The title comes from the officer who historically commanded a brigade. Today brigades are commanded by colonels.' },
    ],
    sources: [S.armyRanks, S.tiohOfficer, S.tiohOrigin, S.usc619],
    unverified: [],
  },
  {
    branch: army,
    abbr: 'MG',
    slug: 'major-general',
    summary:
      "Major General is the two-star grade. An MG typically commands a division of 10,000 to 16,000 Soldiers, or leads a major command, center or Army staff organization.",
    role: [
      'Commanding general of a division',
      'Commander of a Center of Excellence or major support command',
      'Senior director on the Army Staff or Joint Staff',
      'Adjutant general of a state National Guard',
      'Deputy commander of a corps or Army command',
    ],
    promotion:
      "Brigadier Generals are considered for MG by a general officer selection board. As with all general officers, the President nominates and the Senate confirms. Federal law requires at least one year as a BG before consideration. The total number of general officers is capped by statute, so only part of each group of brigadier generals advances to two stars, and the rest retire at one star.",
    history: [
      "Major generals were among the Continental Army's first general officers in 1775, marked by a pink ribbon. On 18 June 1780 Washington ordered that major generals wear two stars on each epaulette.",
      "The two silver stars have been the major general's mark ever since. Today the grade is most closely linked with command of an Army division.",
    ],
    faq: [
      { q: 'Is a major general higher than a lieutenant general?', a: 'No. Major General is two stars (O-8); Lieutenant General is three stars (O-9). The names are a holdover from older titles.' },
      { q: 'What does a two-star general command?', a: 'Usually an Army division of about 10,000 to 16,000 Soldiers.' },
      { q: 'How is a major general chosen?', a: 'By a general officer selection board, nominated by the President and confirmed by the Senate.' },
    ],
    sources: [S.armyRanks, S.tiohOfficer, S.tiohOrigin, S.usc619],
    unverified: [],
  },
  {
    branch: army,
    abbr: 'LTG',
    slug: 'lieutenant-general',
    summary:
      "Lieutenant General is the three-star grade. An LTG typically commands a corps of 20,000 to 40,000 Soldiers, or an Army command, or holds a senior joint or Army Staff position.",
    role: [
      'Commanding general of an Army corps',
      'Commander of an Army service component command',
      'Deputy Chief of Staff on the Army Staff',
      'Director of a Joint Staff directorate or defense agency',
      'Superintendent of the U.S. Military Academy',
    ],
    promotion:
      "Three- and four-star grades are tied to positions, not boards. Under 10 U.S.C. 601, the President designates positions of importance and responsibility, nominates an officer for one, and the Senate confirms. The officer holds the grade while in the position and must be confirmed again to retire at that grade. An officer who leaves a three-star position without moving to another one reverts to the permanent grade, normally major general.",
    history: [
      "The three stars were established in 1798 for the rank of lieutenant general, to be worn by the Commander-in-Chief, George Washington. After Washington the grade lapsed for long periods.",
      "Ulysses S. Grant was promoted to lieutenant general in 1864 to command all Union armies. Since World War II the grade has been used routinely for corps and senior staff positions.",
    ],
    faq: [
      { q: 'What does a three-star general command?', a: 'Usually a corps of 20,000 to 40,000 Soldiers, or a major Army command.' },
      { q: 'Is lieutenant general a permanent rank?', a: 'No. It is tied to a position. If the officer leaves the position, the grade goes with it unless the officer is reassigned or retires in grade.' },
      { q: 'Who confirms a lieutenant general?', a: 'The Senate, after the President nominates the officer for a specific position.' },
    ],
    sources: [S.armyRanks, S.tiohOfficer, S.usc601, S.wikiLtg],
    unverified: [],
  },
  {
    branch: army,
    abbr: 'GEN',
    slug: 'general',
    summary:
      "General is the four-star grade and the Army's senior active commissioned rank. Generals lead the Army as Chief of Staff and Vice Chief, command Army major commands and serve as combatant commanders for joint forces.",
    role: [
      'Chief of Staff or Vice Chief of Staff of the Army',
      'Commanding general of an Army command such as Forces Command',
      'Combatant commander of a geographic or functional command',
      'Chairman or Vice Chairman of the Joint Chiefs of Staff',
      'Chief of the National Guard Bureau',
    ],
    promotion:
      "Like three-star rank, four stars come with a position. The President nominates an officer for a designated position under 10 U.S.C. 601, and the Senate confirms. Most four-star generals have more than 30 years of service.",
    history: [
      "Congress established the grade of General by an act of 25 July 1866, and Ulysses S. Grant was the first Army officer to hold it and wear four silver stars. William T. Sherman held the title from 1869 until he retired in 1884, and Philip Sheridan held it for the last months of his life in 1888.",
      "After World War I, Congress created the title General of the Armies for John J. Pershing, who wore four stars and was the only person appointed to it in that era. Four-star rank became routine during and after World War II.",
    ],
    faq: [
      { q: 'Is General the highest rank in the Army?', a: 'It is the highest grade in use today. General of the Army (five stars) was created for World War II and has not been held by anyone since Omar Bradley died in 1981.' },
      { q: 'Who was the first four-star general?', a: 'Ulysses S. Grant, after Congress created the grade in July 1866.' },
      { q: 'How many years does it take to become a general?', a: 'Most four-star generals have over 30 years of service.' },
    ],
    sources: [S.armyRanks, S.tiohOfficer, S.usc601, S.wikiFourStar, S.wikiGa],
    unverified: [],
  },
  {
    branch: army,
    abbr: 'GA',
    slug: 'general-of-the-army',
    summary:
      "General of the Army is a five-star grade created for World War II. It is not a current grade: five men held it, and no one has been appointed since 1950.",
    role: [
      'Highest military command authority in a major war',
      'Allied supreme commander in a theater',
      'Senior military advisor to the President and Secretary of War',
      'Coordinated with Navy fleet admirals, the five-star grade created at the same time',
      'Placed U.S. commanders on equal footing with Allied field marshals',
    ],
    promotion:
      "There is no normal path to General of the Army. Each appointment requires a specific act of Congress. The grade was created on 14 December 1944 for no more than four officers, and a separate act was needed in 1950 to appoint Omar Bradley.",
    history: [
      "Public Law 482 of the 78th Congress, approved 14 December 1944, created the temporary grade of General of the Army. George C. Marshall (16 December), Douglas MacArthur (18 December), Dwight D. Eisenhower (20 December) and Henry H. Arnold (21 December) were appointed that month. The grade was made permanent on 23 March 1946, and Arnold was later redesignated General of the Air Force.",
      "An act approved on 15 September 1950 allowed the President to appoint Omar N. Bradley, then Chairman of the Joint Chiefs, and he received his fifth star later that month. Bradley died in 1981, and no one has held the grade since.",
      "The insignia is five silver stars in a circle with the gold coat of arms of the United States above. It is distinct from the older title General of the Armies, held by John J. Pershing.",
    ],
    faq: [
      { q: 'Who were the five-star generals of the Army?', a: 'George C. Marshall, Douglas MacArthur, Dwight D. Eisenhower, Henry H. Arnold and Omar N. Bradley.' },
      { q: 'Is General of the Army still a rank?', a: 'It remains in law but no one has been appointed since 1950, and it would require an act of Congress.' },
      { q: 'What is the difference between General of the Army and General of the Armies?', a: 'General of the Army is the five-star World War II grade. General of the Armies is a separate senior title created after World War I for John J. Pershing.' },
    ],
    sources: [S.fiveStar, S.tiohOfficer, S.armyRanks, S.wikiGa, S.jcsBradley],
    unverified: [],
  },
];

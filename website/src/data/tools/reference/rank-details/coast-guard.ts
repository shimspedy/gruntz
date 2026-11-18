import type { RankDetail } from '../../types';

/**
 * Per-rank pages for the U.S. Coast Guard, checked 2026-11-18. Joined to ranks.ts on
 * branch + abbr. Prose is original. Anything not confirmed against an official source is
 * listed in the entry's `unverified` array instead of being guessed.
 */

const HIST = 'https://www.history.uscg.mil';
const GOV = 'https://content.govdelivery.com/accounts/USDHSCG/bulletins';
const WIKI = 'https://en.wikipedia.org/wiki';

const S = {
  chiefs: { label: 'CG Historian\'s Office, The Long Blue Line: Hail to the Chiefs! 100 years of Coast Guard chief petty officers', url: `${HIST}/Research/THE-LONG-BLUE-LINE/Article/2925493/the-long-blue-line-hail-to-the-chiefs100-years-of-coast-guard-chief-petty-offic/` },
  chiefsReprint: { label: 'The Maritime Executive, 100 Years of Coast Guard Chief Petty Officers (reprint of the CG Historian\'s Office article)', url: 'https://maritime-executive.com/editorials/100-years-of-coast-guard-chief-petty-officers-1' },
  calhoun: { label: 'CG Historian\'s Office, Master Chief Charles L. Calhoun', url: `${HIST}/Browse-by-Topic/Notable-People/All/Article/1776787/master-chief-charles-l-calhoun/` },
  calhounCutter: { label: 'Atlantic Area, USCGC Calhoun history', url: 'https://www.atlanticarea.uscg.mil/Our-Organization/Area-Cutters/CGCCALHOUN/History/' },
  mcpocg: { label: 'uscg.mil, Master Chief Petty Officer of the Coast Guard', url: 'https://www.uscg.mil/Leadership/Senior-Leadership/MCPOCG/' },
  faq: { label: 'CG Historian\'s Office, Frequently Asked Questions', url: `${HIST}/Frequently-Asked-Questions/` },
  commandants: { label: 'CG Historian\'s Office, Commandants', url: `${HIST}/browse-by-topic/notable-people/commandants/` },
  waesche: { label: 'CG Historian\'s Office, Admiral Russell R. Waesche', url: `${HIST}/Browse-by-Topic/Notable-People/All/Article/1762609/admiral-russell-r-waesche/` },
  cotp: { label: 'CG Historian\'s Office, The Long Blue Line: the Espionage Act, supporting Coast Guard port security', url: `${HIST}/Research/THE-LONG-BLUE-LINE/Article/2939209/the-long-blue-line-the-espionage-act-supporting-coast-guard-port-security-for-1` },
  uniform1916: { label: 'CG Historian\'s Office, 1916 Coast Guard Uniform Regulations (transcribed)', url: 'https://media.defense.gov/2022/Apr/01/2002968207/-1/-1/0/1916_USCG_UNIFORM_REGS_TRANSCRIBED.PDF' },
  manual: { label: 'COMDTINST M1000.2C, Enlistments, Evaluations, and Advancements', url: 'https://media.defense.gov/2020/Feb/06/2002245088/-1/-1/0/CIM_1000_2C.PDF' },
  oneSwe: { label: 'MyCG: 1-SWE is coming, beginning May 2022', url: 'https://www.mycg.uscg.mil/News/Article/2819565/1swe-is-coming-beginning-may-2022/' },
  acn11021: { label: 'ACN 110/21, policy changes supporting the implementation of one servicewide exam (1-SWE)', url: `${GOV}/2f84de7` },
  aSchool: { label: 'ALCOAST 473/23, removal of the time-in-grade requirement for graduates of A-school', url: `${GOV}/37d6228` },
  map: { label: 'ALCOAST 053/24, update to the Meritorious Advancement Program', url: `${GOV}/3884f6e` },
  map26: { label: 'ALCOAST 066/26, continuation of previous update to the Meritorious Advancement Program', url: `${GOV}/40bb193` },
  mcap: { label: 'CG Personnel Service Center, 2023 Master Chief Advancement Panel cutoffs', url: 'https://dcms.uscg.mil/ppc/news/Article/3513718/2023-master-chief-advancement-panel-mcap-cutoffs' },
  mcapAnnounce: { label: 'ALCGENL 220/19, Master Chief Advancement Panel announcement', url: `${GOV}/26f6015` },
  rscap: { label: 'ALCOAST 258/25, 2025 Reserve Senior Chief Advancement Panel (R-SCAP) announcement', url: `${GOV}/3e3e10b` },
  rpanels26: { label: 'ALCGRSV 047/26, 2026 Reserve Master Chief and Senior Chief Advancement Panels announcement', url: `${GOV}/4243e3f` },
  rfmc: { label: 'ALCGENL 130/23, AY24 solicitation for Rating Force Master Chiefs', url: `${GOV}/35f3cc3` },
  cwoBoard: { label: 'ALCGRSV 006/25, PY25 Reserve CWO appointment board timelines', url: 'https://www.dcms.uscg.mil/Portals/10/CG-1/PPC/006-25_ALCGRSV.pdf' },
  cwoCutoffs: { label: 'ALCGPSC 160/24, revised cutoffs for appointment to warrant grade', url: 'https://dcms.uscg.mil/ppc/news/Article/3981409/alcgpsc-16024-subj-revised-cutoffs-for-appointment-to-warrant-grade' },
  cwoResults: { label: 'ALCGPSC 084/23, PY23 active duty CWO appointment board results (specialty list)', url: `${GOV}/365d61e` },
  cwoToLt: { label: 'ALCGOFF 074/23, PY24 CWO to LT selection board solicitation', url: `${GOV}/36a10c6` },
  fagan: { label: 'Coast Guard news release: first woman service chief takes command', url: `${GOV}/31a5484` },
  hqReorg: { label: 'MyCG: USCG HQ is reorganizing to better serve the nation\'s finest fighting force', url: 'https://www.mycg.uscg.mil/News/Article/4226097/uscg-hq-is-reorganizing-to-better-serve-the-nations-finest-fighting-force/' },
  districts: { label: 'Federal Register, Renaming of U.S. Coast Guard Districts (2 October 2025)', url: 'https://www.federalregister.gov/documents/2025/10/02/2025-19282/renaming-of-us-coast-guard-districts' },
  title14: { label: 'Title 14, U.S. Code (Coast Guard)', url: 'https://uscode.house.gov/browse/prelim@title14&edition=prelim' },
  usc2121: { label: '14 U.S.C. 2121, Officers: promotion (Cornell LII)', url: 'https://www.law.cornell.edu/uscode/text/14/2121' },
  dfas: { label: 'DFAS Basic Pay: Enlisted, note on senior enlisted advisor billets', url: 'https://www.dfas.mil/Military-Members/payentitlements/Pay-Tables/Basic-Pay/EM/' },
  insignia: { label: 'U.S. Military Rank Insignia', url: 'https://www.war.gov/Resources/Insignias/' },
  navyUniform: { label: 'U.S. Navy Uniform Regulations 4101, sleeve and shoulder board insignia (pattern shared by the Coast Guard)', url: 'https://www.mynavyhr.navy.mil/References/US-Navy-Uniforms/Uniform-Regulations/Chapter-4/4101' },
  goCG: { label: 'GoCoastGuard.com, Hiring incentives', url: 'https://gocoastguard.com/hiring-incentives' },
  capeMay75: { label: 'DVIDS, Training Center Cape May celebrates 75 years of recruit training', url: 'https://www.dvidshub.net/news/445891/training-center-cape-may-celebrates-75-years-recruit-training' },
  secondCenter: { label: 'Military Times, Coast Guard selects Alabama as site of second recruit training center (5 March 2026)', url: 'https://www.militarytimes.com/news/your-military/2026/03/05/coast-guard-selects-alabama-as-site-of-second-recruit-training-center/' },
  wEnlisted: { label: 'Wikipedia: List of United States Coast Guard enlisted ranks', url: `${WIKI}/List_of_United_States_Coast_Guard_enlisted_ranks` },
  wOfficer: { label: 'Wikipedia: United States Coast Guard officer rank insignia', url: `${WIKI}/United_States_Coast_Guard_officer_rank_insignia` },
  wMcpocg: { label: 'Wikipedia: Master Chief Petty Officer of the Coast Guard', url: `${WIKI}/Master_Chief_Petty_Officer_of_the_Coast_Guard` },
  wCmc: { label: 'Wikipedia: Command master chief petty officer', url: `${WIKI}/Command_master_chief_petty_officer` },
  wWarrant: { label: 'Wikipedia: Warrant officer (United States)', url: `${WIKI}/Warrant_officer_(United_States)` },
  wRcs: { label: 'Wikipedia: United States Revenue Cutter Service', url: `${WIKI}/United_States_Revenue_Cutter_Service` },
  wLtjg: { label: 'Wikipedia: Lieutenant (junior grade)', url: `${WIKI}/Lieutenant_(junior_grade)` },
  wRearAdm: { label: 'Wikipedia: Rear admiral (United States)', url: `${WIKI}/Rear_admiral_(United_States)` },
  wOrg: { label: 'Wikipedia: Organization of the United States Coast Guard', url: `${WIKI}/Organization_of_the_United_States_Coast_Guard` },
  wCotp: { label: 'Wikipedia: Captain of the Port', url: `${WIKI}/Captain_of_the_Port` },
  wWaesche: { label: 'Wikipedia: Russell R. Waesche', url: `${WIKI}/Russell_R._Waesche` },
  wCommandant: { label: 'Wikipedia: Commandant of the Coast Guard', url: `${WIKI}/Commandant_of_the_Coast_Guard` },
  wVice: { label: 'Wikipedia: Vice Commandant of the Coast Guard', url: `${WIKI}/Vice_Commandant_of_the_Coast_Guard` },
  wFagan: { label: 'Wikipedia: Linda L. Fagan', url: `${WIKI}/Linda_L._Fagan` },
} as const;

const cg = 'coast-guard' as const;

export const rankDetails: RankDetail[] = [
  // ─── Enlisted ────────────────────────────────────────────────────────────────
  {
    branch: cg,
    abbr: 'SR',
    slug: 'seaman-recruit',
    summary:
      'Seaman Recruit is the Coast Guard\'s entry enlisted grade, E-1. Enlisted Coast Guardsmen who come in without prior service go through recruit training at Training Center Cape May, New Jersey, and most hold this grade there.',
    role: [
      'Completes recruit training: drill, seamanship, firefighting, first aid, swim qualification and physical fitness',
      'Learns Coast Guard history, core values (Honor, Respect, Devotion to Duty) and rank structure',
      'Takes part in recruit company duties and inspections',
      'Picks an apprenticeship path and, for some, an "A" school before graduation',
      'Builds the record that a commanding officer uses to recommend advancement',
    ],
    promotion:
      'Advancement from E-1 to E-2 depends on time in grade, completion of required training and a commanding officer\'s recommendation, under the enlisted advancement rules in COMDTINST M1000.2. Recruits who bring college credit, JROTC or ROTC time, or certain scouting awards may be authorized to advance to a higher grade, up to E-3, after boot camp.',
    history: [
      'Coast Guard enlisted titles follow the Navy\'s. The service adopted the Navy\'s enlisted and officer rank structure in 1920, five years after the Revenue Cutter Service and the Life-Saving Service merged to form the Coast Guard in 1915.',
      'Unlike the Navy, the Coast Guard has only one E-1 title, Seaman Recruit, and it carries no collar device. The seaman, fireman and airman paths separate at E-2.',
      'Recruit training at Cape May began in 1948, and since Training Center Alameda stopped training recruits in 1982, Cape May has been the service\'s single recruit training center. In March 2026 the Coast Guard chose a former college campus in Birmingham, Alabama, as the site of a second recruit training center to handle a larger flow of recruits.',
    ],
    faq: [
      {
        q: 'Where is Coast Guard boot camp?',
        a: 'Training Center Cape May in New Jersey, the only recruit training center since 1982. A second center in Birmingham, Alabama, was selected in 2026.',
      },
      {
        q: 'Do all Coast Guard recruits start as E-1?',
        a: 'Most do. Recruits with qualifying college credit, JROTC or ROTC time, or certain scouting awards may be authorized a higher grade after boot camp. The enlistment contract states it.',
      },
      {
        q: 'Is there a Fireman Recruit in the Coast Guard?',
        a: 'No. Every Coast Guard E-1 is a Seaman Recruit. The fireman and airman titles start at E-2.',
      },
    ],
    sources: [S.faq, S.manual, S.chiefs, S.goCG, S.capeMay75, S.secondCenter, S.wEnlisted],
    unverified: [],
  },
  {
    branch: cg,
    abbr: 'SA',
    slug: 'seaman-apprentice',
    summary:
      'Seaman Apprentice is pay grade E-2. Most Coast Guardsmen at this grade have just left boot camp and reported to a cutter, small-boat station or air station, where they learn the basics of the service\'s missions on the job.',
    role: [
      'Stands deck watches and serves as a crew member on cutters and small boats',
      'Helps with line handling, boat launch and recovery, and deck maintenance',
      'Qualifies in damage control, firefighting and basic boat crew duties',
      'Studies for a rating and gathers the hands-on experience needed for "A" school',
      'Supports search and rescue, law enforcement and buoy-tending missions as a crew member',
    ],
    promotion:
      'Advancement to Seaman (E-3) is based on time in grade, completion of required training, and the commanding officer\'s recommendation under COMDTINST M1000.2. Getting into an "A" school matters most for the step after that: since ALCOAST 473/23, graduates no longer wait on time in grade before advancing to E-4.',
    history: [
      'The E-2 apprentice title came to the Coast Guard with the Navy rate structure the service adopted in 1920.',
      'The grade is marked by two diagonal stripes. Fireman Apprentice and Airman Apprentice are the engineering and aviation versions of the same grade.',
      'Non-rated Coast Guardsmen have long learned their trade aboard cutters and at stations before going to "A" school, a practice that makes the first tour an important part of training.',
    ],
    faq: [
      {
        q: 'What does a Coast Guard E-2 do?',
        a: 'Works as a crew member on a cutter, boat station or air station, learning seamanship and the unit\'s missions while working toward a rating.',
      },
      {
        q: 'How do you choose a Coast Guard rating?',
        a: 'Through an "A" school list or by striking for a rating at a unit. Many members choose after seeing ratings up close in their first tour.',
      },
      {
        q: 'Is Seaman Apprentice the same in the Navy and Coast Guard?',
        a: 'The title and pay grade are the same, and so are the two diagonal stripes.',
      },
    ],
    sources: [S.manual, S.aSchool, S.faq, S.wEnlisted],
    unverified: [],
  },
  {
    branch: cg,
    abbr: 'SN',
    slug: 'seaman',
    summary:
      'Seaman is pay grade E-3, the top non-rated grade in the Coast Guard. A Seaman is a qualified crew member who handles routine tasks independently and is usually waiting for, or preparing for, an "A" school in a chosen rating.',
    role: [
      'Qualifies as boat crew member, deckhand or helmsman',
      'Stands lookout, helm and in-port security watches',
      'Supports law enforcement boardings and search and rescue',
      'Trains newly arrived junior members in unit routines',
      'Prepares for "A" school or strikes for a rating',
    ],
    promotion:
      'Advancement to Petty Officer Third Class (E-4) normally comes with completion of an "A" school. Since ALCOAST 473/23 (29 November 2023), "A" school graduates who are otherwise eligible meet the advancement requirements at graduation, so they can be advanced to E-4 without waiting on time in grade. Some members instead qualify for a rating by striking, learning it on the job at a unit.',
    history: [
      'The E-3 Seaman title came to the Coast Guard with the Navy rate structure adopted in 1920.',
      'The grade wears three diagonal stripes. A member who has been designated as a striker for a rating wears that rating\'s specialty mark above the stripes.',
      'Before the 2023 change, "A" school graduates still had to meet a time-in-grade requirement before advancing, which could delay the move to petty officer.',
    ],
    faq: [
      {
        q: 'Does a Coast Guard E-3 have to take an exam to make E-4?',
        a: 'Generally no. Advancement to E-4 comes with completing an "A" school or qualifying as a striker, not a servicewide exam.',
      },
      {
        q: 'What is "A" school?',
        a: 'The technical school for a Coast Guard rating, such as Boatswain\'s Mate, Aviation Survival Technician or Maritime Enforcement Specialist.',
      },
      {
        q: 'How long does it take to make E-4 in the Coast Guard?',
        a: 'It depends mostly on when a member gets an "A" school seat. Wait times vary a lot by rating.',
      },
    ],
    sources: [S.aSchool, S.manual, S.wEnlisted],
    unverified: [],
  },
  {
    branch: cg,
    abbr: 'PO3',
    slug: 'petty-officer-third-class',
    summary:
      'Petty Officer Third Class is pay grade E-4, the first petty officer grade. A Coast Guard PO3 has finished training in a rating and is now doing the technical work of that rating while starting to lead junior members.',
    role: [
      'Performs rating work: boat operations, engineering, aviation maintenance, administrative or law enforcement duties',
      'Qualifies as boat crew, coxswain trainee or boarding team member',
      'Supervises small teams of non-rated members',
      'Trains junior members in the rating',
      'Completes the requirements to compete for E-5',
    ],
    promotion:
      'To advance to E-5, a PO3 must meet time in grade, finish rating performance qualifications and required courses, earn a "Ready" advancement recommendation from the commanding officer and take the servicewide exam (SWE). Candidates are ranked by a final multiple that combines the exam score with performance marks, service time, awards and other factors. Since May 2022 active-duty members compete through a single exam each May.',
    history: [
      'Coast Guard petty officer classes follow the Navy pattern, which the Coast Guard adopted with the rest of the Navy rate structure in 1920.',
      'The rating badge shows a perched eagle above the rating mark and one chevron, the same layout the Navy uses.',
      'The move to one annual servicewide exam in May 2022 ended the separate November exam for petty officers competing for E-5 and E-6; the chief and senior chief exams were already given once a year.',
    ],
    faq: [
      {
        q: 'What is the Coast Guard servicewide exam?',
        a: 'The written exam for each rating used to rank petty officers for advancement to E-5 and higher. It is now given once a year.',
      },
      {
        q: 'What is a final multiple in the Coast Guard?',
        a: 'The total score used to rank advancement candidates, combining exam score with performance, service time, awards and other points.',
      },
      {
        q: 'How is a Coast Guard rate abbreviated?',
        a: 'By rating plus class, such as BM3 for Boatswain\'s Mate Third Class.',
      },
    ],
    sources: [S.manual, S.oneSwe, S.acn11021, S.chiefs, S.wEnlisted],
    unverified: [],
  },
  {
    branch: cg,
    abbr: 'PO2',
    slug: 'petty-officer-second-class',
    summary:
      'Petty Officer Second Class is pay grade E-5. A PO2 is an experienced rated member who leads teams, can qualify for key operational roles such as coxswain or boarding officer, and is trusted with mission-critical tasks.',
    role: [
      'Can serve as coxswain, boarding officer or crew lead in the field',
      'Supervises maintenance and operations in the rating',
      'Trains junior petty officers and non-rated members',
      'Stands supervisory watches aboard cutters and stations',
      'Writes and reviews input for junior members\' evaluations',
    ],
    promotion:
      'Advancement to E-6 follows the same SWE process as E-5: eligibility (time in grade, courses, "Ready" recommendation), the annual servicewide exam and ranking by final multiple against vacancies. Senior commanders can also advance an outstanding E-4, E-5 or E-6 one grade under the Meritorious Advancement Program, within yearly quotas set by ALCOAST 053/24 and reissued unchanged in ALCOAST 066/26; only the Commandant or Vice Commandant may meritoriously advance a member to E-7.',
    history: [
      'Second Class petty officer has been part of the Coast Guard structure since the 1920 adoption of Navy rates.',
      'The rating badge carries two chevrons under the eagle and rating mark.',
      'Second Class petty officers do much of the hands-on leading in the service\'s small-boat work, where coxswain and boarding qualifications carry real responsibility.',
    ],
    faq: [
      {
        q: 'What is the Meritorious Advancement Program?',
        a: 'A program that lets senior commanders advance an outstanding member outside the exam process, within quotas the Coast Guard sets by message.',
      },
      {
        q: 'How often is the Coast Guard advancement exam given?',
        a: 'Once a year for active-duty members, each May, since 2022.',
      },
      {
        q: 'What is a coxswain?',
        a: 'The qualified operator in charge of a Coast Guard boat and its crew.',
      },
    ],
    sources: [S.manual, S.oneSwe, S.map, S.map26],
    unverified: [],
  },
  {
    branch: cg,
    abbr: 'PO1',
    slug: 'petty-officer-first-class',
    summary:
      'Petty Officer First Class is pay grade E-6, the senior petty officer grade below chief. First Class petty officers lead divisions, serve as senior coxswains and supervisors, and often serve as second in command at small units.',
    role: [
      'Serves as executive petty officer at small-boat stations or aids-to-navigation teams',
      'Leads a division aboard a cutter',
      'Serves as senior coxswain, boarding officer or supervisor',
      'Manages training and qualifications across a work center',
      'Mentors petty officers preparing for chief',
    ],
    promotion:
      'Advancement from E-6 to Chief Petty Officer (E-7) requires time in grade, required courses, a commanding officer\'s recommendation and the servicewide exam, with candidates ranked by final multiple. Chief warrant officer appointment is normally open to chiefs and above; a PO1 can apply only as a chief selectee in the top half of the E-7 advancement list.',
    history: [
      'First Class petty officer has been part of the Coast Guard\'s enlisted structure since 1920.',
      'The badge carries three chevrons under the eagle and rating mark.',
      'Small units such as stations and aids-to-navigation teams have long relied on senior petty officers for leadership, giving PO1s more responsibility than in many other services.',
    ],
    faq: [
      {
        q: 'What is an executive petty officer?',
        a: 'The second in command at a small Coast Guard unit, such as a station, usually a PO1 or chief.',
      },
      {
        q: 'Can a PO1 become a warrant officer?',
        a: 'Only in a narrow case: a PO1 who has been selected for chief and sits in the top half of the E-7 list may apply. Most applicants are chiefs.',
      },
      {
        q: 'Is a Coast Guard PO1 the same as a Navy PO1?',
        a: 'Same pay grade, title and sleeve badge layout.',
      },
    ],
    sources: [S.manual, S.oneSwe, S.cwoBoard, S.wWarrant, S.chiefs],
    unverified: [],
  },
  {
    branch: cg,
    abbr: 'CPO',
    slug: 'chief-petty-officer',
    summary:
      'Chief Petty Officer is pay grade E-7 and the start of the chiefs\' mess. Coast Guard chiefs are senior technical experts and leaders who run divisions and often command small units such as boat stations.',
    role: [
      'Serves as officer in charge of a small-boat station or aids-to-navigation team',
      'Leads a department or division aboard a cutter, or commands a smaller cutter',
      'Serves as technical expert for a rating at sector or district level',
      'Advises officers on personnel, training and readiness',
      'Mentors petty officers and junior officers',
    ],
    promotion:
      'Advancement to chief is by the servicewide exam and final multiple, ranked against vacancies in each rating. Candidates must meet time in grade, finish the required leadership and rating courses, and hold a "Ready" recommendation from the commanding officer. The exam is given once a year, and the Coast Guard publishes cutoffs showing how far down each rating\'s list it advanced. Everyone advancing to chief also attends the Chief Petty Officer Academy, founded in 1982 and based at Training Center Petaluma, California, since 1985.',
    history: [
      'The Coast Guard created the chief petty officer rate on 18 May 1920 with General Order 43, part of its adoption of the Navy\'s rank structure. Who was first advanced to chief has never been firmly established.',
      'Coast Guard chiefs wear a fouled anchor with a silver Coast Guard shield on its shank as the collar device, in place of the Navy\'s "USN" letters.',
      'The Coast Guard marked 100 years of chief petty officers in 2020. Chiefs in the service have long held commands that other services give to officers, most visibly as officers in charge of small-boat stations and aids-to-navigation teams.',
    ],
    faq: [
      {
        q: 'When did the Coast Guard create chief petty officer?',
        a: 'On 18 May 1920, by General Order 43.',
      },
      {
        q: 'Does a Coast Guard chief command anything?',
        a: 'Yes. Chiefs often serve as officers in charge of small boat stations and aids-to-navigation teams, and some command smaller cutters.',
      },
      {
        q: 'What is the difference between Navy and Coast Guard chief insignia?',
        a: 'The Coast Guard anchor carries the service shield; the Navy anchor carries "USN."',
      },
    ],
    sources: [S.chiefs, S.chiefsReprint, S.manual, S.oneSwe, S.wEnlisted, S.wOrg],
    unverified: [],
  },
  {
    branch: cg,
    abbr: 'SCPO',
    slug: 'senior-chief-petty-officer',
    summary:
      'Senior Chief Petty Officer is pay grade E-8. Senior chiefs run larger units and departments, act as senior enlisted advisors at sectors and other mid-level commands, and set the standard for the chiefs below them.',
    role: [
      'Serves as officer in charge of larger boat stations and specialized units',
      'Leads an engineering, deck or operations department aboard a major cutter',
      'Serves as rating subject-matter expert or enlisted advisor at sector, district or headquarters level',
      'Oversees enlisted training, qualification and evaluation programs across several work centers',
      'Coaches new chiefs and prepares petty officers for the chiefs\' mess',
    ],
    promotion:
      'For active-duty members, advancement from chief to senior chief still runs through the servicewide exam: a chief who meets time in grade, finishes the required courses and holds a "Ready" recommendation sits for the annual exam and is ranked by final multiple against the vacancies in the rating. Reserve chiefs no longer take an exam; since 2025 they are reviewed by the Reserve Senior Chief Advancement Panel (R-SCAP).',
    history: [
      'Public Law 85-422, signed on 20 May 1958, created the senior chief and master chief pay grades. The Coast Guard followed the Navy in titling them Senior Chief and Master Chief Petty Officer, so its chiefs\' mess grew from one grade to three.',
      'A senior chief wears the fouled anchor and Coast Guard shield on the collar with a single star above it, and the sleeve badge adds one star above the eagle.',
      'Because the Coast Guard is small, a senior chief is often the most experienced member of a rating in an entire region.',
    ],
    faq: [
      {
        q: 'Does the Coast Guard use an exam for senior chief?',
        a: 'For active-duty members, yes: the servicewide exam and final multiple. Reserve members go before a records panel instead.',
      },
      {
        q: 'How is a Coast Guard senior chief addressed?',
        a: 'As "Senior Chief," or "Senior Chief" plus last name.',
      },
      {
        q: 'What does the star above a senior chief\'s anchor mean?',
        a: 'It marks the E-8 grade. A master chief wears two stars.',
      },
    ],
    sources: [S.chiefs, S.chiefsReprint, S.manual, S.oneSwe, S.rscap, S.rpanels26, S.wEnlisted],
    unverified: [],
  },
  {
    branch: cg,
    abbr: 'MCPO',
    slug: 'master-chief-petty-officer',
    summary:
      'Master Chief Petty Officer is pay grade E-9, the top enlisted grade. Coast Guard master chiefs are the senior experts in their ratings and fill the service\'s highest enlisted leadership and advisory roles.',
    role: [
      'Serves as rating force master chief, the senior expert and advocate for a whole rating',
      'Leads departments at major units, training centers and headquarters',
      'Serves as officer in charge of large stations or specialized units',
      'Provides the pool for command master chief and senior enlisted leadership positions',
      'Represents the enlisted force on boards, panels and policy reviews',
    ],
    promotion:
      'Advancement to E-9 no longer uses the servicewide exam. Under the Master Chief Advancement Panel (MCAP), announced in ALCGENL 220/19 and convened every year since 2020, a panel reviews the records of all eligible active-duty senior chiefs. The Coast Guard publishes an eligibility list each cycle and later issues cutoffs showing how many were advanced in each rating. Reserve senior chiefs compete on a separate Reserve Master Chief Advancement Panel, held since 2021.',
    history: [
      'The E-9 grade dates from the 1958 pay law that also created E-8. The Coast Guard adopted the Navy title Master Chief Petty Officer.',
      'A master chief wears the fouled anchor and shield with two stars on the collar, and two stars above the eagle on the sleeve badge.',
      'Replacing the E-9 exam with a records panel shifted the decision toward a member\'s long-term performance rather than a single test.',
    ],
    faq: [
      {
        q: 'What is the Master Chief Advancement Panel?',
        a: 'The annual board that reviews senior chiefs\' records and selects them for advancement to E-9. It replaced the E-9 servicewide exam in 2020.',
      },
      {
        q: 'What is the highest enlisted rank in the Coast Guard?',
        a: 'Master Chief Petty Officer (E-9). One master chief serves as Master Chief Petty Officer of the Coast Guard.',
      },
      {
        q: 'What is a rating force master chief?',
        a: 'A master chief who serves as the senior expert and advocate for one rating, such as Boatswain\'s Mate or Machinery Technician, and advises leadership on it.',
      },
    ],
    sources: [S.mcapAnnounce, S.mcap, S.rpanels26, S.rfmc, S.manual, S.chiefs, S.wEnlisted],
    unverified: [],
  },
  {
    branch: cg,
    abbr: 'CMC',
    slug: 'command-master-chief-petty-officer',
    summary:
      'Command Master Chief is a leadership position held by a master chief, not a separate pay grade. A Coast Guard CMC is the senior enlisted advisor to the commander of a sector, district, area or other major command.',
    role: [
      'Advises the commander on the morale, welfare, training and discipline of the enlisted workforce',
      'Leads the command\'s chiefs\' mess and senior enlisted network',
      'Visits stations, cutters and air stations to hear members\' concerns',
      'Oversees enlisted programs such as sponsorship, recognition and family support',
      'Links the command\'s members to the Master Chief Petty Officer of the Coast Guard',
    ],
    promotion:
      'Command master chiefs are designated by the Commandant or the Master Chief Petty Officer of the Coast Guard and assigned to a CMC billet. The member keeps the E-9 pay grade; the position adds authority and distinctive insignia, not a promotion.',
    history: [
      'Command master chief billets give commanders below the Commandant a senior enlisted advisor of their own, mirroring at each command the role the MCPOCG plays for the whole service.',
      'Commandant-designated ("gold badge") CMCs wear a sleeve badge with a silver Coast Guard shield in place of a rating mark; at area level the stars and shield are gold. They also wear a command senior enlisted leader identification badge.',
      'Coast Guard CMCs often cover a wide geographic area with many small units, so travel to stations and cutters is a large part of the job.',
    ],
    faq: [
      {
        q: 'Is command master chief a rank in the Coast Guard?',
        a: 'No. It is a position held by an E-9 master chief.',
      },
      {
        q: 'Who does a Coast Guard CMC work for?',
        a: 'The commander of the unit, such as a sector commander or district commander.',
      },
      {
        q: 'What is the difference between a CMC and the MCPOCG?',
        a: 'A CMC advises one commander. The MCPOCG advises the Commandant and represents the whole enlisted force.',
      },
    ],
    sources: [S.mcpocg, S.chiefs, S.wCmc, S.wEnlisted],
    unverified: [],
  },
  {
    branch: cg,
    abbr: 'MCPOCG',
    slug: 'master-chief-petty-officer-of-the-coast-guard',
    summary:
      'The Master Chief Petty Officer of the Coast Guard is the single most senior enlisted member of the service. The MCPOCG advises the Commandant on all matters affecting enlisted members and their families.',
    role: [
      'Senior enlisted advisor to the Commandant of the Coast Guard',
      'Speaks for enlisted members on pay, housing, advancement and quality of life',
      'Testifies before Congress on enlisted issues',
      'Leads the Coast Guard\'s command master chiefs',
      'Represents the Coast Guard enlisted force at home and abroad',
    ],
    promotion:
      'There is one MCPOCG at a time, appointed by the Commandant from among the service\'s master chiefs. The billet has its own basic pay rate, set by law for the senior enlisted advisors of each service and paid regardless of length of service, as listed by DFAS.',
    history: [
      'The office dates to 1969. Master Chief Charles L. Calhoun was named the first MCPOCG on 27 August 1969 and held the post until 1 August 1973.',
      'The MCPOCG wears insignia set apart from those of other master chiefs, marking the one enlisted member who speaks for the whole force.',
      'The National Security Cutter USCGC Calhoun (WMSL 759), commissioned in April 2024, is named for the first MCPOCG; the class is named for notable figures in Coast Guard history.',
      'Phillip N. Waldron became the 15th MCPOCG on 25 July 2025.',
    ],
    faq: [
      {
        q: 'Who was the first Master Chief Petty Officer of the Coast Guard?',
        a: 'Master Chief Charles L. Calhoun, from 1969 to 1973.',
      },
      {
        q: 'When was the MCPOCG office created?',
        a: 'In 1969. Calhoun took office on 27 August that year.',
      },
      {
        q: 'Does the Coast Guard Reserve have its own master chief?',
        a: 'Yes, the Master Chief Petty Officer of the Coast Guard Reserve Force advises on the reserve force.',
      },
    ],
    sources: [S.mcpocg, S.calhoun, S.calhounCutter, S.chiefs, S.dfas, S.wMcpocg, S.wEnlisted],
    unverified: [],
  },

  // ─── Warrant officers ────────────────────────────────────────────────────────
  {
    branch: cg,
    abbr: 'CWO2',
    slug: 'chief-warrant-officer-2',
    summary:
      'Chief Warrant Officer 2 is the entry warrant grade in the Coast Guard, which does not use W-1. CWO2s are former senior enlisted members appointed for their technical skill, and they serve as specialists and leaders in fields such as boatswain (BOSN) and naval engineering.',
    role: [
      'Serves as technical specialist in one of about twenty warrant specialties, such as boatswain, naval engineering, aviation engineering or finance and supply',
      'Leads divisions aboard cutters and at shore units',
      'Serves as commanding officer of some small units, such as stations and smaller cutters',
      'Advises commanding officers on technical and operational matters',
      'Mentors chiefs and petty officers in the specialty',
    ],
    promotion:
      'Enlisted members apply to the annual chief warrant officer appointment board. Applicants are normally chiefs or above; a PO1 qualifies only as a chief selectee in the top half of the E-7 list. The commanding officer\'s recommendation is the key requirement. Those selected are appointed directly to CWO2 as vacancies occur, following the cutoffs the Coast Guard publishes.',
    history: [
      'Warrant officers are older than the Coast Guard itself: the Revenue Cutter Service\'s 1908 uniform regulations covered them, and the Coast Guard\'s 1916 regulations set insignia for boatswains, gunners, machinists and carpenters.',
      'Coast Guard warrant insignia are close to the Navy\'s, with a gold bar with blue enamel breaks for CWO2, but the Coast Guard shield sits between the rank stripe and the specialty mark on sleeves and shoulder boards.',
      'The Coast Guard appoints its warrants directly to W-2. A CWO5 grade was authorized in 1994, but the service has never promoted anyone to it.',
    ],
    faq: [
      {
        q: 'Does the Coast Guard have Warrant Officer 1?',
        a: 'No. Coast Guard warrants are appointed at Chief Warrant Officer 2.',
      },
      {
        q: 'How do you become a Coast Guard warrant officer?',
        a: 'By applying to the annual CWO appointment board, normally as a chief petty officer or above, with a commanding officer\'s recommendation.',
      },
      {
        q: 'What is a BOSN?',
        a: 'A boatswain chief warrant officer, the specialty for deck operations, seamanship and boat forces.',
      },
    ],
    sources: [S.cwoBoard, S.cwoCutoffs, S.cwoResults, S.uniform1916, S.wWarrant, S.wOfficer, S.insignia],
    unverified: [],
  },
  {
    branch: cg,
    abbr: 'CWO3',
    slug: 'chief-warrant-officer-3',
    summary:
      'Chief Warrant Officer 3 is pay grade W-3. A CWO3 has several years as a warrant behind them and moves into larger technical programs, senior staff jobs and, in specialties such as boatswain, leadership of operational units.',
    role: [
      'Runs a technical department or program at a major cutter, air station, base or training center',
      'Serves on district, area or headquarters staffs as the subject-matter expert for a specialty',
      'Leads or serves as second in command of units where the billet is coded for a warrant officer',
      'Inspects, assesses and certifies programs such as engineering, ordnance or boat forces at other units',
      'Mentors CWO2s and the chiefs who are preparing to apply for warrant',
    ],
    promotion:
      'Promotion from CWO2 to CWO3 is by a selection board convened under Title 14. The board reads officer evaluation reports and selects against the number of openings in each specialty. Coast Guard warrant officers serve under the same promotion and retirement framework as other Coast Guard officers, adjusted for warrant grades.',
    history: [
      'The W-3 grade is part of the numbered warrant structure the Coast Guard shares with the Navy, with the same titles, pay grades and collar bars.',
      'A CWO3 wears a silver bar with blue enamel breaks; on sleeves and shoulder boards the Coast Guard shield sits between the rank stripe and the specialty mark.',
      'Coast Guard warrant specialties have grown with the service\'s missions. Alongside boatswain and naval engineering, recent appointment boards have selected warrants in fields such as criminal investigation, diving, intelligence systems, maritime law enforcement and information systems.',
    ],
    faq: [
      {
        q: 'How long does it take to make CWO3 in the Coast Guard?',
        a: 'Usually several years after appointment as CWO2. The timing follows openings in each specialty and the board\'s results.',
      },
      {
        q: 'Is a CWO3 senior to an ensign?',
        a: 'No. Ensigns and above outrank chief warrant officers, though an experienced CWO3 is often the more seasoned leader.',
      },
      {
        q: 'What is a specialty device?',
        a: 'The small emblem on a warrant officer\'s uniform that shows the technical field, such as crossed anchors for boatswain.',
      },
    ],
    sources: [S.title14, S.cwoBoard, S.cwoResults, S.wOfficer, S.wWarrant, S.insignia],
    unverified: [],
  },
  {
    branch: cg,
    abbr: 'CWO4',
    slug: 'chief-warrant-officer-4',
    summary:
      'Chief Warrant Officer 4 is pay grade W-4, the highest warrant grade the Coast Guard uses. CWO4s are the service\'s most experienced technical officers and fill senior specialty roles across the fleet and at headquarters.',
    role: [
      'Serves as the senior technical advisor to a commanding officer or major staff',
      'Manages service-wide programs within a specialty',
      'Leads assessment and standardization teams that visit units',
      'Advises on manning, training and the career path of the specialty',
      'Mentors warrant officers and senior enlisted members across the community',
    ],
    promotion:
      'CWO3s compete for CWO4 before a selection board that compares records within each specialty and selects against openings. Because the Coast Guard does not use the W-5 grade, CWO4 is the last warrant promotion; warrants who want to go further can compete for a commission as a lieutenant through the CWO-to-LT selection board.',
    history: [
      'W-4 has been the top warrant grade the Coast Guard actually fills. A CWO5 grade was authorized for the service in 1994, but no Coast Guard warrant officer has been promoted to it.',
      'A CWO4 wears a silver bar with blue enamel breaks, distinguished from the CWO3 bar by its pattern of breaks, and the specialty device on the uniform.',
      'Many of the Coast Guard\'s operational traditions in boat forces, engineering and aviation maintenance have been carried by its senior warrant officers, who came up through the enlisted ranks in those fields.',
    ],
    faq: [
      {
        q: 'Does the Coast Guard have CWO5?',
        a: 'The grade was authorized in 1994, but the Coast Guard has never used it. CWO4 is the highest warrant grade in practice.',
      },
      {
        q: 'Can a Coast Guard warrant officer become a commissioned officer?',
        a: 'Yes. The annual CWO-to-LT selection board picks warrants for appointment as lieutenants.',
      },
      {
        q: 'How do you tell CWO3 and CWO4 bars apart?',
        a: 'Both are silver with blue enamel. The layout of the blue breaks differs; the uniform regulations show each one.',
      },
    ],
    sources: [S.title14, S.cwoBoard, S.cwoToLt, S.wWarrant, S.wOfficer, S.insignia],
    unverified: [],
  },

  // ─── Commissioned officers ───────────────────────────────────────────────────
  {
    branch: cg,
    abbr: 'ENS',
    slug: 'ensign',
    summary:
      'Ensign is pay grade O-1, the first commissioned officer rank in the Coast Guard. Most new ensigns report to a cutter as a deck watch officer or begin flight training, sector response work or engineering assignments.',
    role: [
      'Qualifies as deck watch officer, standing watch on the bridge of a cutter',
      'Serves as a division officer leading enlisted members and chiefs',
      'Works as a boarding officer or response officer at a sector',
      'Begins naval flight training as a student aviator',
      'Works toward an officer specialty such as cutterman, aviation, response or prevention',
    ],
    promotion:
      'Officers are commissioned as ensigns through the U.S. Coast Guard Academy in New London, Connecticut, Officer Candidate School (also held at the Academy), or direct commission programs. Under 14 U.S.C. 2121, an ensign found fully qualified may be promoted to Lieutenant (junior grade) after at least 12 months of active service in grade, with the exact timing set by Coast Guard policy.',
    history: [
      'The Coast Guard adopted the Navy\'s officer rank titles, including ensign, in 1920. Before that, Revenue Cutter Service officers were captains and first, second and third lieutenants. Russell Waesche, a future Commandant, was commissioned a third lieutenant, the grade that matched ensign, in 1906 after finishing the Revenue Cutter Service\'s School of Instruction, the forerunner of the Coast Guard Academy.',
      'Coast Guard ensigns wear one gold bar on the collar and a single half-inch gold stripe on the sleeves and shoulder boards, with a gold Coast Guard shield where a Navy line officer would wear a star.',
      'Because the Coast Guard is small, ensigns often take on real operational responsibility, such as standing watch as the officer in charge of a cutter\'s navigation, within their first months.',
    ],
    faq: [
      {
        q: 'How do you become a Coast Guard officer?',
        a: 'Through the Coast Guard Academy, Officer Candidate School, or a direct commission program for specialists such as lawyers or aviators.',
      },
      {
        q: 'How long until a Coast Guard ensign makes LTJG?',
        a: 'The law sets a minimum of 12 months in grade; Coast Guard policy sets the actual point, and the officer must be found fully qualified.',
      },
      {
        q: 'Is a Coast Guard ensign the same rank as a Navy ensign?',
        a: 'Yes. Both are O-1; the Coast Guard uniform shows the service shield instead of a star.',
      },
    ],
    sources: [S.waesche, S.chiefs, S.usc2121, S.wWaesche, S.wRcs, S.wOfficer, S.navyUniform, S.insignia],
    unverified: [],
  },
  {
    branch: cg,
    abbr: 'LTJG',
    slug: 'lieutenant-junior-grade',
    summary:
      'Lieutenant (junior grade) is pay grade O-2. Coast Guard LTJGs are qualified officers who stand senior watches, lead divisions and boarding teams, and in some cases command patrol boats.',
    role: [
      'Serves as officer of the deck or senior deck watch officer on a cutter',
      'Leads a division or department aboard a small or medium cutter',
      'Commands some patrol boats',
      'Serves as boarding officer, response officer or investigator at a sector',
      'Flies as a copilot in Coast Guard aircraft',
    ],
    promotion:
      'Promotion from LTJG to Lieutenant is handled under Title 14 and Coast Guard promotion policy for officers found fully qualified. Unlike promotion to O-4 and above, it does not require Senate confirmation.',
    history: [
      'The rank of lieutenant (junior grade) came to the Coast Guard with the Navy officer titles adopted in 1920. In the Navy, the title replaced the older rank of master on 3 March 1883.',
      'The insignia is one silver bar on the collar and one half-inch stripe with a quarter-inch stripe above it on the sleeves and shoulder boards, under the Coast Guard shield.',
      'Command of patrol boats by junior officers gives young Coast Guard officers a chance at command early in their careers.',
    ],
    faq: [
      {
        q: 'Can a Coast Guard LTJG command a ship?',
        a: 'Some patrol boats are commanded by lieutenants (junior grade).',
      },
      {
        q: 'How do you address a Coast Guard LTJG?',
        a: 'As "Lieutenant" plus last name.',
      },
      {
        q: 'Is the Coast Guard LTJG the same as the Navy LTJG?',
        a: 'Same grade and title; the Coast Guard shows its shield on the uniform.',
      },
    ],
    sources: [S.faq, S.title14, S.usc2121, S.wLtjg, S.wOrg, S.navyUniform, S.insignia],
    unverified: [],
  },
  {
    branch: cg,
    abbr: 'LT',
    slug: 'lieutenant',
    summary:
      'Lieutenant is pay grade O-3. Coast Guard lieutenants are experienced junior officers who command patrol cutters, fly as aircraft commanders, lead sector departments and serve in senior positions aboard larger ships.',
    role: [
      'Commands a patrol boat or other smaller cutter',
      'Serves as a department head or operations officer on a larger cutter',
      'Flies as aircraft commander on helicopters or fixed-wing aircraft',
      'Leads a sector branch for response, prevention or waterways management',
      'Serves as instructor at the Academy or training centers',
    ],
    promotion:
      'Promotion to Lieutenant Commander is the first truly competitive step for Coast Guard officers. A selection board convened under Title 14 reviews officer evaluation reports, qualifications and assignments and selects the best-qualified lieutenants against the number of O-4 openings. Officers who are repeatedly passed over can be required to leave active duty under Title 14.',
    history: [
      'Lieutenant has been a Coast Guard title since the service adopted Navy officer ranks in 1920; Revenue Cutter Service officers had used first, second and third lieutenant before that.',
      'The insignia is two silver bars joined, and two half-inch stripes on the sleeves and shoulder boards with the Coast Guard shield.',
      'A Coast Guard lieutenant equals an Army, Air Force or Marine captain, which often confuses people outside the sea services.',
    ],
    faq: [
      {
        q: 'Is a Coast Guard lieutenant the same as an Army lieutenant?',
        a: 'No. A Coast Guard lieutenant is O-3, equal to an Army captain.',
      },
      {
        q: 'Do Coast Guard lieutenants command cutters?',
        a: 'Yes, patrol boats and other smaller cutters.',
      },
      {
        q: 'How long does a Coast Guard officer spend as a lieutenant?',
        a: 'Usually several years, until selected for lieutenant commander.',
      },
    ],
    sources: [S.faq, S.title14, S.wRcs, S.wOrg, S.navyUniform, S.insignia],
    unverified: [],
  },
  {
    branch: cg,
    abbr: 'LCDR',
    slug: 'lieutenant-commander',
    summary:
      'Lieutenant Commander is pay grade O-4, the first mid-grade officer rank. Coast Guard LCDRs command some mid-size cutters, serve as executive officers of larger cutters, and lead key departments at sectors and air stations.',
    role: [
      'Commands some mid-size cutters',
      'Serves as executive officer of a larger cutter',
      'Leads response or prevention departments at sectors',
      'Serves as operations officer at air stations',
      'Fills staff jobs in planning, budget and policy at districts and headquarters',
    ],
    promotion:
      'Lieutenant commanders are considered for Commander by a statutory board under Title 14, which is more selective than the O-4 board. Boards weigh leadership in command and operational billets, officer evaluation reports, and professional and graduate education. Selected officers are confirmed by the Senate, and a separate screening decides who gets command of larger cutters and units.',
    history: [
      'Lieutenant commander came to the Coast Guard with the Navy officer titles adopted in 1920.',
      'The insignia is a gold oak leaf, and two half-inch stripes with a quarter-inch stripe between them on the sleeves, with the Coast Guard shield.',
      'Lieutenant commanders hold many of the Coast Guard\'s most hands-on mid-grade jobs, sitting between the junior officers who stand watches and fly aircraft and the commanders and captains who lead sectors and large cutters.',
    ],
    faq: [
      {
        q: 'What is the Army equivalent of LCDR?',
        a: 'Major.',
      },
      {
        q: 'Is a gold oak leaf higher than silver?',
        a: 'No. Gold oak leaf is O-4; silver oak leaf is O-5.',
      },
      {
        q: 'Do Coast Guard LCDRs command ships?',
        a: 'Yes, some cutters are commanded by lieutenant commanders.',
      },
    ],
    sources: [S.faq, S.title14, S.wOrg, S.navyUniform, S.insignia],
    unverified: [],
  },
  {
    branch: cg,
    abbr: 'CDR',
    slug: 'commander',
    summary:
      'Commander is pay grade O-5. In the Coast Guard, commanders lead medium endurance cutters and many shore units, and serve as deputies and department heads at sectors, districts and headquarters.',
    role: [
      'Commands a medium endurance cutter',
      'Commands a shore unit or some air stations',
      'Serves as executive officer of a National Security Cutter',
      'Serves as deputy sector commander, responsible for daily operations across a port region',
      'Leads offices and programs at district, area and headquarters staffs',
    ],
    promotion:
      'Commanders are selected for Captain by a statutory board under Title 14, which considers command performance, staff work and evaluation reports against a limited number of O-6 openings. Selected officers are nominated by the President and confirmed by the Senate. Command assignments are screened separately from promotion.',
    history: [
      'The title came to the Coast Guard with the Navy officer ranks adopted in 1920.',
      'Coast Guard commanders wear a silver oak leaf on the collar and three half-inch gold stripes on the sleeves and shoulder boards, with the service shield above.',
      'As with the Navy, the officer in command of a Coast Guard cutter is called "Captain" aboard, whatever the officer\'s actual rank, so a commander in command of a cutter is addressed that way by the crew.',
    ],
    faq: [
      {
        q: 'What is the Army equivalent of a Coast Guard commander?',
        a: 'Lieutenant colonel.',
      },
      {
        q: 'Why is a commander called "Captain" on a cutter?',
        a: 'By sea-service custom, whoever commands a vessel is its captain, regardless of rank.',
      },
      {
        q: 'Is commander the same as Commandant?',
        a: 'No. Commander is a rank (O-5). The Commandant is the four-star admiral who leads the Coast Guard.',
      },
    ],
    sources: [S.faq, S.title14, S.wOrg, S.navyUniform, S.insignia],
    unverified: [],
  },
  {
    branch: cg,
    abbr: 'CAPT',
    slug: 'captain',
    summary:
      'Captain is pay grade O-6, the senior officer rank below flag officer. Coast Guard captains command sectors, the largest cutters and major shore installations, and they serve as chiefs of staff and senior staff leaders.',
    role: [
      'Commands a sector, usually with authority as Captain of the Port for a region\'s waterways',
      'Commands a National Security Cutter or another of the service\'s largest cutters',
      'Commands major training centers, bases and air stations',
      'Serves as chief of staff to a district or area commander',
      'Leads major offices at Coast Guard headquarters',
    ],
    promotion:
      'Captains compete for selection to Rear Admiral (lower half), the first flag rank, before a board. Selectees are nominated by the President and confirmed by the Senate. Only a small share of captains are selected because the number of Coast Guard flag officers is capped by law.',
    history: [
      'The Revenue Cutter Service used the title captain for its senior officers from 1799, and the Coast Guard kept it as an O-6 rank when it adopted Navy titles in 1920.',
      'The insignia is a silver eagle on the collar and four half-inch gold stripes on the sleeves, with the Coast Guard shield.',
      'The Captain of the Port title, usually held by sector commanders, began in World War I, when the Commandant named senior officers in New York, Philadelphia, Norfolk and Sault Ste. Marie to enforce the 1917 Espionage Act\'s port security rules.',
    ],
    faq: [
      {
        q: 'What is a Captain of the Port?',
        a: 'The Coast Guard officer, usually the sector commander, who has legal authority over the safety and security of a port area.',
      },
      {
        q: 'Is a Coast Guard captain the same as an Army captain?',
        a: 'No. A Coast Guard captain is O-6, equal to an Army colonel.',
      },
      {
        q: 'What comes after captain in the Coast Guard?',
        a: 'Rear Admiral (lower half), O-7.',
      },
    ],
    sources: [S.faq, S.cotp, S.title14, S.wRcs, S.wCotp, S.wOrg, S.navyUniform, S.insignia],
    unverified: [],
  },
  {
    branch: cg,
    abbr: 'RDML',
    slug: 'rear-admiral-lower-half',
    summary:
      'Rear Admiral (lower half) is pay grade O-7, the first of the Coast Guard\'s flag officer ranks. One-star admirals lead regional commands, run major headquarters directorates and serve as deputy commanders, often with authority that spans thousands of miles of coastline.',
    role: [
      'Commands a Coast Guard district, directing search and rescue, law enforcement and port security in that region',
      'Leads a directorate or assistant commandant\'s office at Coast Guard headquarters',
      'Serves as deputy commander or chief of staff at one of the two area commands',
      'Directs major acquisition programs, such as new cutter or aircraft classes',
      'Works with other federal agencies, foreign coast guards and navies on shared missions',
    ],
    promotion:
      'A board reviews the records of eligible captains and recommends officers for flag rank. The President nominates those selected and the Senate must confirm them. The law caps the total number of Coast Guard flag officers, so selection is very limited, and one-star officers must be selected again by a board to reach two stars.',
    history: [
      'For most of its early history the Coast Guard had very few flag officers. By the 1930s the Commandant held the rank of rear admiral; Russell Waesche, for example, became Commandant as a rear admiral on 14 June 1936.',
      'During World War II the Navy and Coast Guard used a temporary one-star commodore rank. The permanent one-star grade was briefly called commodore admiral and then commodore in the early 1980s, and Public Law 99-145 renamed it rear admiral (lower half) on 8 November 1985.',
      'The insignia is one silver star on the collar and shoulder boards, and a single two-inch gold stripe on the sleeves under the Coast Guard shield.',
      'In 2025 the Coast Guard dropped its numbered districts for regional names, such as Northeast District for the former First District, without changing district boundaries.',
    ],
    faq: [
      {
        q: 'What does "lower half" mean?',
        a: 'It separates the one-star grade (O-7) from the two-star rear admiral (O-8). In conversation both are simply "Admiral."',
      },
      {
        q: 'How many admirals does the Coast Guard have?',
        a: 'A few dozen at most. The total is limited by law and is small compared with the other armed services.',
      },
      {
        q: 'Who commands a Coast Guard district?',
        a: 'A rear admiral, either one-star or two-star depending on the district.',
      },
    ],
    sources: [S.waesche, S.commandants, S.title14, S.districts, S.wWaesche, S.wRearAdm, S.wOrg, S.navyUniform, S.insignia],
    unverified: [],
  },
  {
    branch: cg,
    abbr: 'RADM',
    slug: 'rear-admiral',
    summary:
      'Rear Admiral is pay grade O-8, a two-star flag officer. Coast Guard rear admirals command districts, lead major headquarters functions, and serve as superintendent of the Coast Guard Academy.',
    role: [
      'Commands one of the larger or busier Coast Guard districts',
      'Serves as Superintendent of the U.S. Coast Guard Academy',
      'Leads an assistant commandant\'s directorate at headquarters',
      'Directs the service\'s cyber, intelligence or acquisition organizations',
      'Represents the Coast Guard on interagency and international bodies',
    ],
    promotion:
      'One-star admirals are considered for two-star rank by a selection board. The President nominates selected officers and the Senate confirms them.',
    history: [
      'Rear admiral was the first flag rank held by Coast Guard officers. William E. Reynolds, Commandant from 1919, was the first Coast Guard officer promoted to rear admiral, and Russell Waesche took office as Commandant with that rank in 1936.',
      'The rank title comes from the age of sail, when the rear admiral commanded the rear division of a fleet. The Coast Guard took it from the Navy, where Congress created the rank on 16 July 1862.',
      'The insignia is two silver stars on the collar and shoulder boards, and on the sleeves a two-inch gold stripe with a half-inch stripe above, under the Coast Guard shield.',
    ],
    faq: [
      {
        q: 'Who runs the Coast Guard Academy?',
        a: 'The Superintendent, a Coast Guard rear admiral.',
      },
      {
        q: 'What is the Army equivalent of a Coast Guard rear admiral?',
        a: 'Major general.',
      },
      {
        q: 'Why is it called "rear" admiral?',
        a: 'In the days of sailing fleets, the admiral\'s junior deputy commanded the ships at the rear of the line.',
      },
    ],
    sources: [S.commandants, S.waesche, S.title14, S.wCommandant, S.wRearAdm, S.wOrg, S.navyUniform, S.insignia],
    unverified: [],
  },
  {
    branch: cg,
    abbr: 'VADM',
    slug: 'vice-admiral',
    summary:
      'Vice Admiral is pay grade O-9, a three-star flag officer. In the Coast Guard, vice admirals command the Atlantic and Pacific Areas, which divide the service\'s operations between them, and lead deputy commandant organizations at headquarters.',
    role: [
      'Commands Coast Guard Atlantic Area or Pacific Area',
      'Serves as Deputy Commandant for Operations, overseeing the service\'s missions',
      'Leads one of the headquarters deputy commandant directorates for people and for ships, aircraft and systems, which replaced the single Mission Support directorate in July 2025',
      'Takes on joint and interagency leadership roles, including with the Department of Homeland Security and the Department of Defense',
      'Advises the Commandant as a member of the service\'s senior leadership',
    ],
    promotion:
      'Vice admiral is tied to specific positions. The President nominates an officer for a three-star position and the Senate confirms the appointment. An officer usually holds the grade only while serving in the position, and keeping it in retirement requires approval.',
    history: [
      'The Coast Guard\'s first vice admiral was its Commandant during World War II: Russell Waesche was promoted to vice admiral on 10 March 1942, and later became the service\'s first full admiral.',
      'The Vice Commandant was a vice admiral until 2016, when the post was raised to four stars. The area commanders and deputy commandants remain the service\'s three-star positions, and the 2025 Force Design 2028 reorganization reshaped headquarters and cut the number of flag officer billets.',
      'The insignia is three silver stars on the collar and shoulder boards, and on the sleeves a two-inch gold stripe with two half-inch stripes above, under the Coast Guard shield.',
    ],
    faq: [
      {
        q: 'What are the Coast Guard\'s Atlantic and Pacific Areas?',
        a: 'The two operational commands that divide the Coast Guard\'s operating forces by geography. Each is normally led by a vice admiral.',
      },
      {
        q: 'Who was the Coast Guard\'s first vice admiral?',
        a: 'Commandant Russell R. Waesche, promoted on 10 March 1942.',
      },
      {
        q: 'What is the Army equivalent of vice admiral?',
        a: 'Lieutenant general.',
      },
    ],
    sources: [S.waesche, S.commandants, S.hqReorg, S.title14, S.wWaesche, S.wVice, S.wOrg, S.navyUniform, S.insignia],
    unverified: [],
  },
  {
    branch: cg,
    abbr: 'ADM',
    slug: 'admiral',
    summary:
      'Admiral is pay grade O-10, the highest Coast Guard rank. Two officers hold it: the Commandant of the Coast Guard, who leads the service, and the Vice Commandant, the service\'s second in command.',
    role: [
      'As Commandant, leads the Coast Guard and answers to the Secretary of Homeland Security (and to the Secretary of the Navy if the service operates under the Navy in wartime)',
      'Works with the Joint Chiefs of Staff and combatant commanders when the Coast Guard supports military operations',
      'As Vice Commandant, runs the service day to day and acts for the Commandant when needed',
      'Sets the Coast Guard\'s budget, force structure and strategy with Congress and the administration',
      'Represents the Coast Guard with foreign coast guards and navies',
    ],
    promotion:
      'Four-star rank is tied to the two positions. The President nominates the Commandant and the Vice Commandant, and the Senate must confirm them. Officers are normally selected from the service\'s vice admirals.',
    history: [
      'Russell R. Waesche became the Coast Guard\'s first four-star admiral on 4 April 1945, near the end of World War II. He had led the service since 1936 and retired at the end of 1945. Since 1960, every Commandant has been appointed in the grade of admiral.',
      'The Coast Guard Authorization Act of 2015 raised the Vice Commandant from vice admiral to admiral, effective in May 2016, giving the Coast Guard two four-star officers. In June 2021 Linda Fagan became Vice Commandant and the first woman to reach four-star rank in the Coast Guard, and on 1 June 2022 she became Commandant, the first woman to lead a U.S. armed service. She was relieved on 21 January 2025.',
      'Kevin Lunday served as acting Commandant from January 2025 and became the 28th Commandant on 15 January 2026; Thomas G. Allan Jr. became Vice Commandant in February 2026.',
      'The insignia is four silver stars on the collar and shoulder boards, and on the sleeves a two-inch gold stripe with three half-inch stripes above, under the Coast Guard shield.',
    ],
    faq: [
      {
        q: 'What is the highest rank in the Coast Guard?',
        a: 'Admiral (O-10), held by the Commandant and the Vice Commandant. The Coast Guard has never had a five-star officer.',
      },
      {
        q: 'Who was the first four-star admiral in the Coast Guard?',
        a: 'Russell R. Waesche, promoted on 4 April 1945.',
      },
      {
        q: 'Who was the first woman to lead the Coast Guard?',
        a: 'Admiral Linda Fagan, who became Commandant on 1 June 2022.',
      },
    ],
    sources: [S.waesche, S.commandants, S.fagan, S.title14, S.wWaesche, S.wCommandant, S.wVice, S.wFagan, S.navyUniform, S.insignia],
    unverified: [],
  },
];

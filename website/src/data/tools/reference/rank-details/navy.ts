import type { RankDetail } from '../../types';

/**
 * Per-rank pages for the U.S. Navy, checked 2026-11-18. Joined to ranks.ts on branch + abbr.
 * Prose is original. Anything not confirmed against an official source is listed in the
 * entry's `unverified` array instead of being guessed.
 */

const NHHC = 'https://www.history.navy.mil';
const ROOM = `${NHHC}/research/library/online-reading-room/title-list-alphabetically`;
const NAMES = `${ROOM}/w/naval-traditions-names-of-rank`;
const HR = 'https://www.mynavyhr.navy.mil';

const S = {
  ranks: { label: 'NHHC, Ranks (browse by topic)', url: `${NHHC}/browse-by-topic/organization-and-administration/ranks.html` },
  enlisted: { label: 'NHHC, Enlisted Personnel: history of Navy rates', url: `${NHHC}/browse-by-topic/organization-and-administration/ranks/enlisted-personnel.html` },
  ratings: { label: 'NHHC, Ratings and the Evolution of Jobs in the Navy', url: `${ROOM}/u/ratings-and-the-evolution-of-jobs-in-the-navy.html` },
  petty: { label: 'NHHC, Naval Traditions: Petty Officer', url: `${NAMES}/enlisted-ranks/petty-officer.html` },
  badges: { label: 'NHHC, Petty Officer Rating Badge Locations and Eagle Designs', url: `${ROOM}/u/uniforms-usnavy/petty-officer-rating-badge-locations-and-eagle-designs.html` },
  cpoHistory: { label: 'NHHC, History of the Chief Petty Officer', url: `${ROOM}/h/history-of-the-chief-petty-officer.html` },
  cpoCommunity: { label: 'NHHC, Chief Petty Officers', url: `${NHHC}/browse-by-topic/communities/chief-petty-officers.html` },
  cpoBlog: { label: 'Navy history blog: Silent Professionals, history of the rank of Chief Petty Officer', url: 'https://usnhistory.navylive.dodlive.mil/Recent/Article-View/Article/2686340/silent-professionals-history-of-the-rank-of-chief-petty-officer' },
  mcpons: { label: 'NHHC, Master Chief Petty Officers of the Navy', url: `${NHHC}/browse-by-topic/people/master-chief-petty-officers.html` },
  plackett: { label: 'NHHC, MCPON William H. Plackett biography', url: `${NHHC}/browse-by-topic/people/master-chief-petty-officers/plackett-bio/plackett.html` },
  black: { label: 'NHHC, MCPON Delbert D. Black biography', url: `${NHHC}/browse-by-topic/people/master-chief-petty-officers/black-bio.html` },
  warrantHistory: { label: 'NHHC, History of Warrant Officers in the U.S. Navy', url: `${NAMES}/history-of-warrant-officers-in-the-us-navy.html` },
  warrantBlog: { label: 'Navy history blog: The History of Navy Rank, Warrant Officers', url: 'https://usnhistory.navylive.dodlive.mil/Recent/Article/2686991/the-history-of-navy-rank-warrant-officers' },
  officerBlog: { label: 'Navy history blog: The History of Navy Rank, the Officer Corps', url: 'https://usnhistory.navylive.dodlive.mil/Recent/Article-View/Article/2686906' },
  officer: { label: 'NHHC, Naval Traditions: Officer ranks', url: `${NAMES}/officer.html` },
  lieutenant: { label: 'NHHC, Naval Traditions: Lieutenant', url: `${NAMES}/officer/lieutenant.html` },
  commander: { label: 'NHHC, Naval Traditions: Commander', url: `${NAMES}/officer/commander.html` },
  captain: { label: 'NHHC, Naval Traditions: Navy Captain', url: `${NAMES}/officer/navy-captain.html` },
  commodore: { label: 'NHHC, Naval Traditions: Commodore', url: `${NAMES}/officer/commodore.html` },
  admiral: { label: 'NHHC, Naval Traditions: Admiral', url: `${NAMES}/officer/admiral.html` },
  insignia: { label: 'NHHC, Insignias of the U.S. Navy Uniform', url: `${ROOM}/u/uniforms-usnavy/insignias-us-navy-uniform.html` },
  fleetAdmirals: { label: 'Navy history blog: Fleet admirals are elite band of naval brothers', url: 'https://usnhistory.navylive.dodlive.mil/Recent/Article-View/Article/2686393/fleet-admirals-are-elite-band-of-naval-brothers' },
  advManual: { label: 'BUPERSINST 1430.16 series, Advancement Manual for Enlisted Personnel', url: `${HR}/Portals/55/Reference/Instructions/BUPERS/BUPERSINST%201430.16.pdf` },
  advancement: { label: 'MyNavy HR, Enlisted Advancement', url: `${HR}/Career-Management/Community-Management/Enlisted-Career-Admin/Advancement/` },
  apprentice: { label: 'MyNavy HR, Apprentice Advancements (E-1 to E-4)', url: `${HR}/Career-Management/Community-Management/Enlisted-Career-Admin/Advancement/Apprentice-Advancements/` },
  nav16823: { label: 'MyNavy HR fact sheet, NAVADMIN 168/23 (time-in-service advancement to E-4)', url: `${HR}/Portals/55/Messages/NAVADMIN/FACT_SHEETS/Fact_Sheet_NAV_168_23.pdf` },
  nav25524: { label: 'MyNavy HR fact sheet, NAVADMIN 255/24 (Billet Based Advancement)', url: `${HR}/Portals/55/Messages/NAVADMIN/FACT_SHEETS/Fact_Sheet_NAV_255_24.pdf` },
  nav11225: { label: 'MyNavy HR fact sheet, NAVADMIN 112/25 (Senior Enlisted Marketplace and BBA)', url: `${HR}/Portals/55/Messages/NAVADMIN/FACT_SHEETS/Fact_Sheet_NAV_112_25.pdf` },
  nav10025: { label: 'NAVADMIN 100/25, FY-26 Chief Petty Officer selection boards', url: `${HR}/Portals/55/Messages/NAVADMIN/NAV2025/NAV25100.pdf` },
  ldoCwo: { label: 'MyNavy HR, LDO/CWO Guidebook, Chapter 1', url: `${HR}/Portals/55/Career/OCM/Active/LDOCWO/LDO_CWO%20GUIDEBOOK_CHAPTER_1_JUNE_2023.pdf` },
  nav14018: { label: 'NAVADMIN 140/18, Modification of the Navy Cyber Warrant Officer Program', url: `${HR}/Portals/55/Messages/NAVADMIN/NAV2018/NAV18140.txt` },
  wo1First: { label: 'navy.mil: NIOC Georgia Sailor selected to Warrant Officer 1, Navy\'s first since 1975', url: 'https://www.navy.mil/Press-Office/News-Stories/Article/2240092/nioc-georgia-sailor-selected-to-warrant-officer-1-navys-first-since-1975/' },
  cyberWarrant: { label: 'navy.mil: Navy expands cyber warrant program', url: 'https://www.navy.mil/Press-Office/News-Stories/Article/2249639/navy-expands-cyber-warrant-program/' },
  title10Promo: { label: '10 U.S.C. chapter 36, promotion of active-duty officers (Cornell LII)', url: 'https://www.law.cornell.edu/uscode/text/10/subtitle-A/part-II/chapter-36' },
  title10Sec601: { label: '10 U.S.C. 601, positions of importance and responsibility (Cornell LII)', url: 'https://www.law.cornell.edu/uscode/text/10/601' },
  title10Sec571: { label: '10 U.S.C. 571, warrant officer grades and the W-5 limit (Cornell LII)', url: 'https://www.law.cornell.edu/uscode/text/10/571' },
  title10Sec8033: { label: '10 U.S.C. 8033, Chief of Naval Operations (Cornell LII)', url: 'https://www.law.cornell.edu/uscode/text/10/8033' },
  dfas: { label: 'DFAS Basic Pay: Enlisted, note on senior enlisted advisor billets', url: 'https://www.dfas.mil/Military-Members/payentitlements/Pay-Tables/Basic-Pay/EM/' },
  warGovInsignia: { label: 'U.S. Military Rank Insignia', url: 'https://www.war.gov/Resources/Insignias/' },
  uniformSleeve: { label: 'MyNavy HR, Navy Uniform Regulations 4101: Sleeve insignia', url: `${HR}/References/US-Navy-Uniforms/Uniform-Regulations/Chapter-4/4101` },
  uniformGroupRate: { label: 'MyNavy HR, Navy Uniform Regulations 4222: Group rate marks', url: `${HR}/References/US-Navy-Uniforms/Uniform-Regulations/Chapter-4/4222/` },
  netcFaq: { label: 'NETC, Advancement FAQs (time in rate and exam eligibility)', url: 'https://www.netc.navy.mil/Commands/Naval-Education-and-Training-Professional-Development-Center/Advancement-FAQs/' },
  sbe: { label: 'navy.mil: Thousands of Sailors now board eligible for chief', url: 'https://www.navy.mil/Press-Office/News-Stories/Article/2260540/thousands-of-sailors-now-board-eligible-for-chief/' },
  nav07526: { label: 'NAVADMIN 075/26, FY-27 Chief Petty Officer selection and screen boards', url: `${HR}/Portals/55/Messages/NAVADMIN/NAV2026/NAV26075.pdf` },
  nav15226: { label: 'NAVADMIN 152/26, Executive Support Technician WO and CWO community', url: `${HR}/Portals/55/Messages/NAVADMIN/NAV2026/NAV26152.pdf` },
  sem: { label: 'MyNavy HR, Senior Enlisted Marketplace', url: `${HR}/Career-Management/Detailing/Enlisted/Senior-Enlisted-Marketplace/` },
  cpoBirthday: { label: 'NAVSEA: SERMC celebrates the birthday of the Chief Petty Officer', url: 'https://www.navsea.navy.mil/Media/News/Article/1145334/sermc-celebrates-the-birthday-of-the-chief-petty-officer/' },
  cpoNine: { label: 'Navy Medicine: A past remembered, a present respected at NMRTC Bremerton', url: 'https://www.med.navy.mil/Media/News/Article/4142739/a-past-remembered-a-present-respected-at-nmrtc-bremerton/' },
  zumwalt: { label: 'NHHC, Admiral Elmo R. Zumwalt Jr.', url: `${NHHC}/browse-by-topic/people/chiefs-of-naval-operations/admiral-elmo-r--zumwalt-jr-.html` },
  bumedForce: { label: 'DVIDS: Force 50 retrospective, Force Master Chief of Navy Medicine', url: 'https://www.dvidshub.net/news/401222/force-50-retrospective-force-master-chief-navy-medicine' },
  ddg119: { label: 'navy.mil: USS Delbert D. Black joins the fleet', url: 'https://www.navy.mil/Press-Office/Press-Releases/display-pressreleases/Article/2362503/us-navy-guided-missile-destroyer-uss-delbert-d-black-joins-the-fleet/' },
  wikiEnlisted: { label: 'Wikipedia: List of United States Navy enlisted rates', url: 'https://en.wikipedia.org/wiki/List_of_United_States_Navy_enlisted_rates' },
  wikiCpo: { label: 'Wikipedia: Chief petty officer (United States)', url: 'https://en.wikipedia.org/wiki/Chief_petty_officer_(United_States)' },
  wikiCmdcm: { label: 'Wikipedia: Command master chief petty officer', url: 'https://en.wikipedia.org/wiki/Command_master_chief_petty_officer' },
  wikiCob: { label: 'Wikipedia: Chief of the boat', url: 'https://en.wikipedia.org/wiki/Chief_of_the_boat' },
  wikiMcpon: { label: 'Wikipedia: Master Chief Petty Officer of the Navy', url: 'https://en.wikipedia.org/wiki/Master_Chief_Petty_Officer_of_the_Navy' },
  wikiPlackett: { label: 'Wikipedia: William H. Plackett', url: 'https://en.wikipedia.org/wiki/William_H._Plackett' },
  wikiWarrant: { label: 'Wikipedia: Warrant officer (United States)', url: 'https://en.wikipedia.org/wiki/Warrant_officer_(United_States)' },
  wikiEnsign: { label: 'Wikipedia: Ensign (rank)', url: 'https://en.wikipedia.org/wiki/Ensign_(rank)' },
  wikiLtjg: { label: 'Wikipedia: Lieutenant (junior grade)', url: 'https://en.wikipedia.org/wiki/Lieutenant_(junior_grade)' },
  wikiLt: { label: 'Wikipedia: Lieutenant (navy)', url: 'https://en.wikipedia.org/wiki/Lieutenant_(navy)' },
  wikiLcdr: { label: 'Wikipedia: Lieutenant commander (United States)', url: 'https://en.wikipedia.org/wiki/Lieutenant_commander_(United_States)' },
  wikiCdr: { label: 'Wikipedia: Commander (United States)', url: 'https://en.wikipedia.org/wiki/Commander_(United_States)' },
  wikiCommodore: { label: 'Wikipedia: Commodore (United States)', url: 'https://en.wikipedia.org/wiki/Commodore_(United_States)' },
  wikiRadm: { label: 'Wikipedia: Rear admiral (United States)', url: 'https://en.wikipedia.org/wiki/Rear_admiral_(United_States)' },
  wikiVadmList: { label: 'Wikipedia: List of United States Navy vice admirals on active duty before 1960', url: 'https://en.wikipedia.org/wiki/List_of_United_States_Navy_vice_admirals_on_active_duty_before_1960' },
  wikiAdm: { label: 'Wikipedia: Admiral (United States)', url: 'https://en.wikipedia.org/wiki/Admiral_(United_States)' },
  wikiFadm: { label: 'Wikipedia: Fleet admiral (United States)', url: 'https://en.wikipedia.org/wiki/Fleet_admiral_(United_States)' },
} as const;

const navy = 'navy' as const;

export const rankDetails: RankDetail[] = [
  // ─── Enlisted ────────────────────────────────────────────────────────────────
  {
    branch: navy,
    abbr: 'SR',
    slug: 'seaman-recruit',
    summary:
      "Seaman Recruit is the Navy's entry pay grade, E-1, and the rate most enlisted Sailors hold while they go through boot camp at Recruit Training Command, Great Lakes, Illinois. The title follows the apprenticeship a recruit is headed for, so the same grade is also called Fireman Recruit, Airman Recruit, Constructionman Recruit or Hospitalman Recruit.",
    role: [
      'Completes recruit training: drill, swimming qualification, basic seamanship, firefighting and damage control',
      'Learns Navy customs, uniform standards, rank recognition and the chain of command',
      'Reports to an "A" school for rating training or straight to a first command as an undesignated Sailor',
      'Stands basic watches and does the cleaning, maintenance and working-party jobs every new Sailor shares',
      'Builds the record (qualifications, conduct, fitness) that a commanding officer weighs before recommending advancement',
    ],
    promotion:
      "A Seaman Recruit becomes a Seaman Apprentice (E-2) under the time-in-service system the Navy adopted on 1 July 2024 (NAVADMIN 168/23). The bar is 9 months of total service plus the commanding officer's recommendation for retention and promotion; the advancement is then made automatically in the Navy's personnel system, with no exam. Some recruits skip E-1 entirely because their enlistment contract credits them with an advanced pay grade.",
    history: [
      'The numbered enlisted pay grades used today came from the Career Compensation Act of 1949, which sorted the Navy\'s many older apprentice titles into a common E-1 through E-7 scale shared with the other services.',
      'The Navy marks its apprentice grades with diagonal stripes, called group rate marks, whose color shows the apprenticeship; hospitalmen, for example, wear white stripes on blue uniforms. E-2s wear two stripes and E-3s three. Since 1996 Seaman Recruits have worn no rate insignia at all.',
      'Under the 2024 rules, nobody stays an E-1 long. Advancement through the first three grades now runs on a fixed clock instead of exams, so the rate is mostly the boot camp and first-months grade.',
    ],
    faq: [
      {
        q: 'Do all Navy recruits start as an E-1?',
        a: 'No. Most do, but enlistment programs can credit a recruit with E-2 or E-3 from day one, for example for college credit or certain youth programs. Your recruiter writes the starting grade into the contract.',
      },
      {
        q: 'Why is it called Fireman Recruit or Airman Recruit instead of Seaman Recruit?',
        a: 'The Navy names the apprentice grades after the broad field a Sailor is headed for: deck and administrative work (seaman), engineering (fireman), aviation (airman), Seabees (constructionman) and medical (hospitalman). The pay grade is the same E-1.',
      },
      {
        q: 'How long until a Seaman Recruit makes E-2?',
        a: 'At 9 months of total service, as long as the commanding officer recommends the Sailor for promotion. It happens automatically.',
      },
    ],
    sources: [S.enlisted, S.apprentice, S.nav16823, S.ratings, S.uniformGroupRate, S.wikiEnlisted],
    unverified: [],
  },
  {
    branch: navy,
    abbr: 'SA',
    slug: 'seaman-apprentice',
    summary:
      'Seaman Apprentice is pay grade E-2, the second of the Navy\'s three apprentice grades. A Sailor at this grade is usually finishing "A" school or settling in at a first ship, squadron or shore command, and is still learning the trade as much as doing it.',
    role: [
      'Attends or finishes "A" school, the technical course for a rating such as boatswain\'s mate, electronics technician or hospital corpsman',
      'Works under petty officers on deck maintenance, line handling, mess decks, engineering or flight-line duties, depending on the apprenticeship',
      'Qualifies for basic watch stations and general damage-control duties aboard ship',
      'Starts personal qualification standards (PQS) for the workcenter and warfare program',
      'Undesignated Sailors explore ratings and work toward striking for one',
    ],
    promotion:
      'Advancement to Seaman (E-3) is by time in service. Since 1 July 2024 a Sailor advances to E-3 at 18 months of total service, counted from the start of enlistment rather than from the date of making E-2, provided the commanding officer recommends it. The system makes the change automatically; there is no exam or board.',
    history: [
      'Seaman Apprentice, like the other apprentice titles, took its present place in the numbered pay grade system created by the Career Compensation Act of 1949.',
      'The grade is shown by two diagonal stripes in the group rate color for the Sailor\'s apprenticeship. The same E-2 grade is called Fireman Apprentice (FA), Airman Apprentice (AA), Constructionman Apprentice (CA) or Hospitalman Apprentice (HA) in the other fields.',
      'For decades E-2 and E-3 depended on completing courses and, at times, written tests. NAVADMIN 168/23 replaced that with fixed time-in-service steps starting in July 2024.',
    ],
    faq: [
      {
        q: 'Is Seaman Apprentice the same as Airman Apprentice?',
        a: 'Same pay grade (E-2), different apprenticeship. Airman Apprentices are headed for aviation ratings, Seaman Apprentices for deck, operations and administrative ratings.',
      },
      {
        q: 'What is a "striker"?',
        a: 'An apprentice Sailor working toward a specific rating on the job rather than through "A" school. Strikers learn from rated Sailors in the workcenter until they are designated in that rating.',
      },
      {
        q: 'When does an E-2 make E-3 in the Navy?',
        a: 'At 18 months of total service with a commanding officer\'s recommendation. It is not 18 months after making E-2.',
      },
    ],
    sources: [S.enlisted, S.apprentice, S.nav16823, S.ratings],
    unverified: [],
  },
  {
    branch: navy,
    abbr: 'SN',
    slug: 'seaman',
    summary:
      'Seaman is pay grade E-3, the top apprentice grade and the last step before becoming a petty officer. A Seaman is expected to be qualified, dependable and able to do routine jobs without close supervision, and many are already working in their rating.',
    role: [
      'Carries out routine maintenance on equipment and spaces under the Planned Maintenance System',
      'Stands qualified watches such as lookout, helm, messenger or roving security',
      'Serves as a working member of a damage-control or firefighting team',
      'Works in a rating as a designated Sailor (for example, Boatswain\'s Mate Seaman) or strikes for one',
      'Trains newly reported Seaman Recruits and Seaman Apprentices in the division',
    ],
    promotion:
      'Since 1 July 2024 the Navy advances Sailors from E-3 to Petty Officer Third Class (E-4) at 30 months of total service with the commanding officer\'s recommendation. No exam is needed, E-4 advancement is no longer limited by quotas, and the older E-4 eligibility rules were dropped. Before that change, E-4 required passing the Navy-wide advancement exam; the exam now starts with the competition for E-5. Commands can still advance top performers to E-4 early through the Meritorious Advancement Program.',
    history: [
      'Seaman is one of the oldest titles in the Navy; the Continental Navy carried seamen and ordinary seamen on its rolls in 1775. In 1949 the Career Compensation Act fixed Seaman at what is now the E-3 pay grade.',
      'The insignia is three diagonal stripes in the group rate color. A Sailor who has a rating but is not yet a petty officer wears the rating\'s specialty mark above the stripes and uses a combined title such as Gunner\'s Mate Seaman.',
      'The 2024 shift to time-in-service advancement made E-3 a fixed waypoint: Sailors now know the month they will make petty officer as long as they keep their commanding officer\'s recommendation.',
    ],
    faq: [
      {
        q: 'Is a Navy E-3 a petty officer?',
        a: 'No. Petty officer starts at E-4. An E-3 is a Seaman, Fireman, Airman, Constructionman or Hospitalman.',
      },
      {
        q: 'Does an E-3 have to take an exam to make E-4?',
        a: 'Not anymore. Since July 2024 E-4 comes at 30 months of total service with a commanding officer\'s recommendation.',
      },
      {
        q: 'What does "designated" mean for a Seaman?',
        a: 'It means the Sailor has been formally assigned a rating, usually by finishing "A" school or being approved as a striker. A designated Seaman wears the rating mark above the stripes.',
      },
    ],
    sources: [S.enlisted, S.apprentice, S.nav16823, S.ratings, S.advManual],
    unverified: [],
  },
  {
    branch: navy,
    abbr: 'PO3',
    slug: 'petty-officer-third-class',
    summary:
      'Petty Officer Third Class is pay grade E-4 and the first of the Navy\'s petty officer rates. It is the point where a Sailor becomes a junior leader: still doing the hands-on work of the rating, but now responsible for the Sailors working alongside.',
    role: [
      'Performs and documents maintenance and operations in the rating, from radar repair to aircraft refueling to pharmacy work',
      'Supervises small work teams of non-rated Sailors on a job or watch',
      'Stands more responsible watches, such as petty officer of the watch in port',
      'Trains junior Sailors on qualification standards and safety procedures',
      'Begins taking the Navy-wide advancement exam for E-5',
    ],
    promotion:
      'Most Sailors now reach E-4 through the time-in-service system adopted on 1 July 2024: 30 months of total service and a commanding officer\'s recommendation. To move up to E-5 a Third Class must serve the minimum time in rate (12 months at E-4, per NETC\'s advancement guidance), pass the rating\'s advancement exam (or the Rating Knowledge Exam in Billet Based Advancement ratings) and score high enough on the final multiple score, which combines exam results with performance evaluations and other points. Some ratings advance through Billet Based Advancement, and commands can advance top performers through the Meritorious Advancement Program.',
    history: [
      'The Navy created three classes of petty officer in 1885, giving structure to a title that had been used loosely since the Continental Navy. Chief petty officer was added on top in 1893.',
      'The petty officer badge, an eagle above a rating specialty mark and chevrons, goes back to the eagle-and-anchor device prescribed in the 1841 uniform regulations; specialty marks followed in 1866. Sailors have long called the badge a "crow."',
      'For many years badges were worn on the right or left sleeve depending on the rating. A 1948 change to the uniform regulations moved every rating badge to the left sleeve, and right-arm rates were formally disestablished on 2 April 1949. On 29 September 2016 the Navy announced it would drop rating titles in favor of generic ones and reversed the decision that December after Sailors objected.',
    ],
    faq: [
      {
        q: 'What is the difference between a rate and a rating in the Navy?',
        a: 'A rate is the pay grade (E-4, E-5 and so on). A rating is the job specialty (Machinist\'s Mate, Yeoman). Sailors combine them, so a Machinist\'s Mate Third Class is "MM3".',
      },
      {
        q: 'Why are some chevrons red and some gold?',
        a: 'Red chevrons are standard. Gold chevrons and a gold rating badge are worn by Sailors with at least 12 years of continuous service. Until 2019 those 12 years also had to be free of disciplinary marks.',
      },
      {
        q: 'How do you address a Petty Officer Third Class?',
        a: 'As "Petty Officer" plus last name, or by rate and name, such as "BM3 Smith."',
      },
    ],
    sources: [S.petty, S.badges, S.enlisted, S.apprentice, S.nav16823, S.advManual, S.nav25524, S.netcFaq, S.wikiEnlisted, S.wikiCpo],
    unverified: [],
  },
  {
    branch: navy,
    abbr: 'PO2',
    slug: 'petty-officer-second-class',
    summary:
      'Petty Officer Second Class is pay grade E-5. Second Class petty officers are the experienced hands of a workcenter: technically skilled, qualified on key watches, and often leading a small team or running a piece of the division\'s work.',
    role: [
      'Leads a work team or shift and checks the quality of maintenance and paperwork',
      'Serves as workcenter supervisor or assistant in smaller divisions',
      'Stands supervisory watches, such as engineering or combat systems watch stations',
      'Runs training for the division and signs off qualification standards',
      'Writes input for junior Sailors\' evaluations and mentors them on advancement',
    ],
    promotion:
      'Advancement from E-4 to E-5 is competitive. A Third Class must serve at least 12 months in rate, hold the commanding officer\'s recommendation and take the rating exam. Selections are made in rank order of the final multiple score (FMS), which combines the exam standard score with performance mark average and other factors defined in BUPERSINST 1430.16, against the number of vacancies in each rating. Ratings in Billet Based Advancement advance Sailors who are selected for an E-5 billet and pass the Rating Knowledge Exam. Meritorious Advancement Program seasons let commands advance a limited number of top Sailors outside the exam cycle.',
    history: [
      'Second Class petty officer was one of the three classes the Navy created in 1885. Its badge shows two chevrons under the eagle and specialty mark.',
      'Navy-wide written exams, scored and ranked centrally, became the normal route to petty officer grades in the 20th century and remain the basis of advancement to E-5 and E-6 today, alongside newer billet-based and meritorious paths.',
      'The final multiple score formula has been rebalanced several times through revisions of the advancement manual, BUPERSINST 1430.16, changing how much weight goes to the exam, evaluations and other points such as awards and earlier passed-but-not-advanced results.',
    ],
    faq: [
      {
        q: 'How hard is it to make E-5 in the Navy?',
        a: 'It depends on the rating. Advancement quotas follow each rating\'s vacancies, so some ratings advance a large share of test-takers and others only a small one. Navy advancement results show the numbers by rating each cycle.',
      },
      {
        q: 'What is the final multiple score?',
        a: 'The ranking number for exam-based advancement. It combines the exam standard score with evaluation marks and other points; Sailors are advanced in FMS order until the rating\'s quota is filled.',
      },
      {
        q: 'What is the Meritorious Advancement Program?',
        a: 'A program that lets commanding officers advance a set number of their best Sailors to E-5 or E-6 without waiting on exam results, during announced seasons each year.',
      },
    ],
    sources: [S.petty, S.advManual, S.advancement, S.nav25524, S.nav11225, S.netcFaq],
    unverified: [],
  },
  {
    branch: navy,
    abbr: 'PO1',
    slug: 'petty-officer-first-class',
    summary:
      'Petty Officer First Class is pay grade E-6, the senior petty officer rate below chief. First Class petty officers run workcenters and divisions day to day, train the next generation of petty officers, and are the pool from which the Navy selects its chiefs.',
    role: [
      'Serves as workcenter supervisor or leading petty officer (LPO) of a division',
      'Plans and tracks maintenance, training and qualifications for the division',
      'Stands senior enlisted watches, for example engineering officer of the watch or in-port duty section leader',
      'Acts for the chief when the chief is away and briefs officers on the division\'s readiness',
      'Runs the First Class Petty Officer Association\'s mentoring and command events',
    ],
    promotion:
      'Advancement from E-5 to E-6 follows the same exam-based system as E-5: 36 months in rate, a commanding officer\'s recommendation, the rating exam and a final multiple score ranked against vacancies. Billet Based Advancement and the Meritorious Advancement Program also lead to E-6 in eligible ratings. From E-6 the path changes: after another 36 months in rate a First Class takes the E-7 exam, and those who score high enough become selection-board eligible for chief.',
    history: [
      'First Class petty officer was created in 1885 as the top of the new three-class structure. When the chief petty officer rate was established on 1 April 1893, First Class became the grade just beneath it.',
      'The First Class badge carries three chevrons under the eagle and specialty mark. A chief\'s badge adds an arc, or "rocker," over the chevrons.',
      'Because chiefs are chosen from First Class petty officers, Navy records and selection boards have treated sustained leadership at E-6 as the main test of readiness for the chiefs\' mess.',
    ],
    faq: [
      {
        q: 'What is an LPO?',
        a: 'The leading petty officer, usually the senior First Class in a division. The LPO runs the division\'s daily work and reports to the chief.',
      },
      {
        q: 'How long do you have to be an E-6 before going up for chief?',
        a: 'At least 36 months in rate before taking the E-7 exam. After that, how long it takes depends on exam scores, evaluations and the board.',
      },
      {
        q: 'Is a First Class petty officer an NCO?',
        a: 'The Navy uses "petty officer" rather than NCO, but E-4 to E-6 petty officers fill the role other services give to noncommissioned officers.',
      },
    ],
    sources: [S.petty, S.cpoCommunity, S.advManual, S.advancement, S.nav25524, S.netcFaq, S.wikiCpo],
    unverified: [],
  },
  {
    branch: navy,
    abbr: 'CPO',
    slug: 'chief-petty-officer',
    summary:
      'Chief Petty Officer is pay grade E-7 and the first of the Navy\'s three chief grades. Chiefs are the technical experts and senior enlisted leaders of their divisions, and the Navy treats the move from First Class to chief as the biggest change in an enlisted career.',
    role: [
      'Serves as division leading chief petty officer (LCPO), responsible for the division\'s Sailors, work and readiness',
      'Acts as the technical authority for the rating aboard the command',
      'Advises the division officer and department head on personnel and maintenance',
      'Trains junior officers as well as enlisted Sailors',
      'Sits on command boards and as a member of the chief petty officers\' mess',
    ],
    promotion:
      'Making chief has two stages. First, an E-6 with at least 36 months in rate and the commanding officer\'s recommendation takes the E-7 advancement exam. Under the long-standing rule, roughly the top 60 percent of each rating by final multiple score (which for E-7 combines evaluations and the exam) become selection-board eligible. Second, a board reviews each eligible Sailor\'s full record, with weight on sustained performance and leadership. Since fiscal year 2026 most active-duty candidates go through a Senior Enlisted Marketplace screening board and advance as they are matched to chief billets, while exempt communities such as submarine and nuclear ratings still use a traditional selection board. The boards are announced each year by NAVADMIN. Selectees go through a period of CPO initiation training before they pin on anchors.',
    history: [
      'The Navy established the chief petty officer rate on 1 April 1893, under General Order 409 of 25 February 1893. The new rate covered nine ratings at first, among them master-at-arms, boatswain\'s mate, gunner\'s mate, quartermaster, yeoman and apothecary.',
      'The chief\'s rating badge adds an arc over three chevrons, and a fouled anchor with the letters "USN" became the chief\'s collar and cap device. Chiefs also changed into a uniform much like an officer\'s, with khakis for working dress.',
      'Each year chiefs mark 1 April as the birthday of the chief petty officer and recall the history of the mess, which the Navy calls the backbone of its enlisted force.',
    ],
    faq: [
      {
        q: 'How long does it take to make chief in the Navy?',
        a: 'It varies a lot by rating and by Sailor. Most chiefs are selected somewhere in their second decade of service; selection depends on exam eligibility, evaluations and the board.',
      },
      {
        q: 'What do the letters USN on a chief\'s anchor mean?',
        a: 'They stand for United States Navy. Chiefs pass along informal meanings too, but USN is the official reading.',
      },
      {
        q: 'Do you salute a chief petty officer?',
        a: 'No. Chiefs are enlisted, so they are not saluted, but they are addressed as "Chief" and given clear respect.',
      },
    ],
    sources: [S.cpoHistory, S.cpoCommunity, S.cpoBlog, S.advManual, S.nav10025, S.nav07526, S.nav11225, S.sbe, S.netcFaq, S.cpoBirthday, S.cpoNine, S.wikiCpo],
    unverified: [],
  },
  {
    branch: navy,
    abbr: 'SCPO',
    slug: 'senior-chief-petty-officer',
    summary:
      'Senior Chief Petty Officer is pay grade E-8. Senior chiefs lead departments or large divisions, mentor the chiefs below them, and often serve as the senior enlisted leader of smaller commands.',
    role: [
      'Serves as department leading chief petty officer (DLCPO) on ships, squadrons and shore commands',
      'Acts as senior enlisted leader of small commands and detachments',
      'Manages enlisted manning, training plans and evaluations across a department',
      'Advises department heads and the executive officer on enlisted matters',
      'Coaches new chiefs through their first years in the mess',
    ],
    promotion:
      'There is no exam for E-8. A chief petty officer with at least three years in rate who meets the other eligibility rules in BUPERSINST 1430.16 is considered by the annual senior chief board, which reviews the full record against vacancies in each rating. A commanding officer can withhold the recommendation. Under the Senior Enlisted Marketplace, Sailors screened by the board advance as they are matched to the E-8 billets they will fill.',
    history: [
      'The Military Pay Act of 1958 created the E-8 and E-9 pay grades for all services, and the Navy established Senior Chief and Master Chief Petty Officer on 1 June 1958, giving the chiefs\' mess three grades instead of one. The first selectees advanced in 1959 and 1960.',
      'A senior chief\'s rating badge adds one star above the eagle, and the collar anchor carries one silver star above it.',
      'Both E-8 and E-9 are filled by boards that read each chief\'s record rather than by a Navy-wide exam.',
    ],
    faq: [
      {
        q: 'Do you need to take a test to make senior chief?',
        a: 'No. Advancement to E-8 and E-9 is by selection board only, based on the Sailor\'s record.',
      },
      {
        q: 'How is a senior chief addressed?',
        a: '"Senior Chief," or "Senior Chief" plus last name.',
      },
      {
        q: 'What does the star on a senior chief\'s anchor mean?',
        a: 'It marks the E-8 grade. One star means senior chief, two stars mean master chief.',
      },
    ],
    sources: [S.cpoCommunity, S.cpoHistory, S.advManual, S.nav11225, S.sem, S.netcFaq, S.wikiEnlisted, S.wikiCpo],
    unverified: [],
  },
  {
    branch: navy,
    abbr: 'MCPO',
    slug: 'master-chief-petty-officer',
    summary:
      'Master Chief Petty Officer is pay grade E-9, the highest enlisted pay grade. Master chiefs are the most senior technical and enlisted leaders in their ratings, and they fill the Navy\'s top enlisted leadership jobs at commands, fleets and headquarters.',
    role: [
      'Serves as department or command senior enlisted leader',
      'Acts as rating lead or enlisted community manager for a rating Navy-wide',
      'Advises commanding officers and staffs on manning, training and enlisted policy',
      'Leads the chiefs\' mess at larger commands',
      'Feeds the pool for command master chief, fleet and force master chief positions',
    ],
    promotion:
      'Like E-8, advancement to E-9 is by board with no exam. A senior chief with at least three years in rate who meets the other eligibility rules is reviewed by the annual master chief board against each rating\'s vacancies, and under the Senior Enlisted Marketplace screened Sailors advance as they take E-9 billets. Master chiefs face service limits on how long they can serve, set by the Navy\'s high-year tenure policy.',
    history: [
      'The E-9 pay grade was created with E-8 by the Military Pay Act of 1958, and the Navy titled it Master Chief Petty Officer.',
      'The master chief\'s badge has two stars above the eagle, and the collar anchor carries two silver stars. Master chiefs in leadership billets add further marks, covered on the command, fleet and force master chief pages.',
      'In some fields, related ratings merge into a single rating at the top of the enlisted ladder, so one master chief can oversee Sailors from several related specialties.',
    ],
    faq: [
      {
        q: 'What is the highest enlisted rank in the Navy?',
        a: 'Master Chief Petty Officer, E-9. The single most senior enlisted Sailor holds the Master Chief Petty Officer of the Navy billet, which is also E-9.',
      },
      {
        q: 'How many years does it take to make master chief?',
        a: 'Most master chiefs have well over 15 years in. There is no fixed timeline; it depends on board selection.',
      },
      {
        q: 'What is the difference between a master chief and a command master chief?',
        a: 'Same pay grade. A command master chief is a master chief selected for the job of senior enlisted leader of a command.',
      },
    ],
    sources: [S.cpoCommunity, S.advManual, S.ratings, S.sem, S.wikiEnlisted, S.wikiCpo],
    unverified: [],
  },
  {
    branch: navy,
    abbr: 'CMDCM',
    slug: 'command-master-chief-petty-officer',
    summary:
      'Command Master Chief is a leadership billet, not a separate pay grade: a master chief chosen to be the senior enlisted leader of a ship, squadron, submarine or shore command. The CMDCM works directly for the commanding officer and speaks for the crew.',
    role: [
      'Advises the commanding officer on morale, discipline, training and welfare of the crew',
      'Leads the command\'s chiefs\' mess',
      'Oversees enlisted programs such as sponsorship, career development and command awards',
      'Takes part in the command triad with the commanding and executive officers',
      'Represents the command\'s enlisted Sailors to higher headquarters and to Navy families',
    ],
    promotion:
      'A master chief applies to the command senior enlisted leader program and is screened by its annual selection board; senior chiefs can be selected the same way as command senior chiefs (CMDCS), a rating the Navy formalized in 2015. Selectees then move between command tours. The billet is assigned rather than promoted into, and the Sailor keeps the E-9 pay grade.',
    history: [
      'The Navy set up its command master chief program in 1971, one of a series of enlisted leadership changes under Chief of Naval Operations Adm. Elmo Zumwalt.',
      'On the sleeve badge, a command master chief keeps the two silver stars above the eagle but wears a silver star in place of the rating specialty mark. The collar device and an identification badge also mark the billet.',
    ],
    faq: [
      {
        q: 'Is command master chief a rank?',
        a: 'No. It is a position held by an E-9. The Sailor\'s pay grade does not change.',
      },
      {
        q: 'What is the difference between a CMC and a COB?',
        a: 'On a submarine the senior enlisted advisor to the commanding officer is the Chief of the Boat (COB), the equivalent of a command master chief or command senior chief. A COB can be a senior chief or a master chief.',
      },
      {
        q: 'What does the star on the CMC badge mean?',
        a: 'It identifies the wearer as a command senior enlisted leader rather than a master chief working in a rating.',
      },
    ],
    sources: [S.mcpons, S.cpoCommunity, S.zumwalt, S.wikiCmdcm, S.wikiCob, S.wikiEnlisted, S.warGovInsignia],
    unverified: [],
  },
  {
    branch: navy,
    abbr: 'FLTCM/FORCM',
    slug: 'fleet-force-master-chief-petty-officer',
    summary:
      'Fleet and Force Master Chief are leadership billets for the most senior master chiefs below the MCPON. A fleet master chief advises a fleet commander, and a force master chief advises a type commander or major organization such as Navy Medicine or the surface, submarine or air forces.',
    role: [
      'Serves as senior enlisted leader to a fleet, type commander or major shore organization',
      'Advises a flag officer on enlisted readiness, training, quality of life and policy',
      'Leads and mentors the command master chiefs in that fleet or force',
      'Carries Sailors\' concerns from the waterfront to Navy leadership and the MCPON',
      'Takes part in Navy-wide enlisted policy reviews and boards',
    ],
    promotion:
      'These jobs go to experienced command master chiefs who have already proven themselves as a command\'s senior enlisted leader. As with CMDCM, the billet is assigned rather than promoted into, and the Sailor remains an E-9.',
    history: [
      'Fleet and force master chief billets grew out of the 1971 reforms that also created the command master chief program. On 20 July 1971, for example, Adm. Elmo Zumwalt created 23 senior enlisted positions, among them the master chief billet at the Bureau of Medicine and Surgery that later became the Force Master Chief of Navy Medicine.',
      'Fleet and force master chiefs wear gold stars instead of silver: the fleet master chief sleeve badge shows two gold stars above the eagle and a gold star in place of the rating specialty mark.',
      'The billets also became a proving ground for the Navy\'s top enlisted job. William H. Plackett, for example, served as Fleet Master Chief of the U.S. Atlantic Fleet before becoming MCPON in 1985.',
    ],
    faq: [
      {
        q: 'What is the difference between a fleet and a force master chief?',
        a: 'A fleet master chief serves a fleet commander, such as U.S. Pacific Fleet. A force master chief serves a type commander or functional organization, such as Naval Surface Forces or Navy Medicine.',
      },
      {
        q: 'Is a fleet master chief higher in rank than a master chief?',
        a: 'Not in pay grade; both are E-9. The billet carries more responsibility and seniority.',
      },
      {
        q: 'How many fleet and force master chiefs are there?',
        a: 'The number follows the Navy\'s organization. Recent counts give four fleet master chiefs and about 16 force master chiefs.',
      },
    ],
    sources: [S.mcpons, S.cpoCommunity, S.plackett, S.bumedForce, S.wikiCmdcm, S.wikiEnlisted, S.wikiPlackett],
    unverified: [],
  },
  {
    branch: navy,
    abbr: 'MCPON',
    slug: 'master-chief-petty-officer-of-the-navy',
    summary:
      'The Master Chief Petty Officer of the Navy is the single most senior enlisted Sailor in the Navy. The MCPON advises the Chief of Naval Operations on matters affecting enlisted Sailors and their families and travels the fleet to hear from Sailors directly.',
    role: [
      'Senior enlisted advisor to the Chief of Naval Operations and the Navy\'s civilian leaders',
      'Speaks for enlisted Sailors on pay, advancement, training, housing and quality-of-life issues',
      'Testifies before Congress on enlisted matters',
      'Leads the Navy\'s fleet and force master chiefs',
      'Represents the Navy\'s enlisted force at ceremonies and with other services',
    ],
    promotion:
      'There is one MCPON at a time. The Chief of Naval Operations appoints the MCPON from among the Navy\'s senior master chiefs to a two-year term, which the CNO can renew for a second two years. The billet carries its own basic pay rate, listed by DFAS for the senior enlisted advisors of each service.',
    history: [
      'The office was created in 1967. On 13 January 1967 the Secretary of the Navy announced Master Chief Gunner\'s Mate Delbert D. Black as the first holder, at first under the title Senior Enlisted Advisor of the Navy; on 28 April 1967 the title became Master Chief Petty Officer of the Navy.',
      'Black served until 1 April 1971. A guided-missile destroyer, USS Delbert D. Black (DDG 119), was named for him and commissioned in September 2020.',
      'Black added a third star above the eagle on the rating badge to set the office apart, and the third star was carried onto the cap and collar anchor as well. The office later gained its own identification badge, first worn by MCPON Thomas Crow.',
    ],
    faq: [
      {
        q: 'Who was the first MCPON?',
        a: 'Master Chief Gunner\'s Mate Delbert D. Black, announced on 13 January 1967.',
      },
      {
        q: 'Does the MCPON outrank officers?',
        a: 'No. The MCPON is enlisted, but the office carries great influence and precedence among enlisted Sailors.',
      },
      {
        q: 'How long does a MCPON serve?',
        a: 'The appointment is a two-year term that the Chief of Naval Operations can renew once, so up to about four years.',
      },
    ],
    sources: [S.black, S.mcpons, S.dfas, S.ddg119, S.wikiMcpon],
    unverified: [],
  },

  // ─── Warrant officers ────────────────────────────────────────────────────────
  {
    branch: navy,
    abbr: 'WO1',
    slug: 'warrant-officer-1',
    summary:
      'Warrant Officer 1 is the Navy\'s entry warrant grade, W-1, and today it is used only in a few small programs: the cyber warrant officer program and, since 2026, the executive support technician community. A WO1 is a technical specialist appointed from the enlisted ranks, most often to work in offensive and defensive cyberspace operations.',
    role: [
      'Performs and leads technical work in cyberspace operations, such as network analysis and defense',
      'Serves on cyber mission teams and at information warfare commands',
      'Gives commanders expert advice on cyber tools and capabilities',
      'Trains enlisted cryptologic technicians in hands-on cyber skills',
      'Develops into a chief warrant officer in the cyber specialty',
    ],
    promotion:
      'Sailors apply through the Navy\'s in-service procurement boards for limited duty officers and warrant officers, which announce eligible pay grades and service limits each year by NAVADMIN. Selectees are appointed by warrant, not by commission. A cyber WO1 can later be commissioned as a Chief Warrant Officer 2 after meeting time-in-grade and total-service minimums.',
    history: [
      'The Navy stopped appointing W-1 warrant officers in 1975, and for decades its warrant officers entered at W-2.',
      'The Secretary of the Navy approved a cyber warrant officer designator in 2010, at first only in the CWO2 to CWO5 grades. NAVADMIN 140/18, issued in June 2018, brought back the W-1 grade for cyber specialists, and the first appointments followed late that year, the first Navy WO1s in more than four decades. NAVADMIN 152/26 in June 2026 added a second WO1 entry point, for executive support technicians.',
      'Navy W-1 and W-2 officers wear a gold bar with blue breaks, along with a specialty device in place of a line officer\'s star.',
    ],
    faq: [
      {
        q: 'Does the Navy still have Warrant Officer 1?',
        a: 'Yes, but only in a few programs: cyber warrant officers and, since 2026, executive support technicians. Most other Navy warrants enter at Chief Warrant Officer 2.',
      },
      {
        q: 'Is a warrant officer enlisted or an officer?',
        a: 'An officer. A WO1 is appointed by warrant; CWO2 and above are commissioned.',
      },
      {
        q: 'Who can apply for cyber warrant officer?',
        a: 'Enlisted Sailors with the right cyber background and pay grade, as listed in the yearly LDO/CWO procurement NAVADMIN.',
      },
    ],
    sources: [S.nav14018, S.wo1First, S.cyberWarrant, S.nav15226, S.ldoCwo, S.warrantHistory, S.wikiWarrant],
    unverified: [],
  },
  {
    branch: navy,
    abbr: 'CWO2',
    slug: 'chief-warrant-officer-2',
    summary:
      'Chief Warrant Officer 2 is the usual entry grade for Navy warrant officers. CWO2s are former senior enlisted Sailors commissioned as officers for their technical mastery, and they serve as hands-on experts in fields such as ship engineering, aviation maintenance, ordnance and information systems.',
    role: [
      'Serves as division officer for a technical division aboard ship or ashore',
      'Leads maintenance programs such as main propulsion, aviation maintenance or weapons',
      'Advises department heads and the commanding officer as the technical expert',
      'Supervises chiefs and petty officers in complex technical work',
      'Qualifies for officer watch stations aboard ship',
    ],
    promotion:
      'Most Navy warrant officers come from chief, senior chief and master chief petty officers with at least 14 years of service, selected by the annual LDO/CWO in-service procurement board. Exact pay grade and years-of-service limits are listed in the yearly NAVADMIN and in the LDO/CWO Guidebook, and a few programs, such as flying CWO, have their own rules. Selectees are commissioned directly as CWO2 after officer training.',
    history: [
      'Warrant officers date to the Continental Navy, which issued its first warrant on 23 December 1775. Early warrant officers included boatswains, gunners, carpenters, masters and surgeons: specialists trusted with a ship\'s technical work rather than its command.',
      'Senior warrant officers could later be commissioned as chief boatswains, chief gunners and similar titles, the origin of the "chief warrant officer" name. The Career Compensation Act of 1949 grouped warrants into W-1 to W-4 pay grades for all services, and the Warrant Officer Management Act of 1991 added W-5.',
      'CWO2 wears a gold bar with blue enamel breaks on the collar and a specialty device on the sleeve and shoulder boards.',
    ],
    faq: [
      {
        q: 'What is the difference between an LDO and a CWO?',
        a: 'Both come from the enlisted ranks. A chief warrant officer stays a technical specialist; a limited duty officer is a commissioned officer who manages broader programs in a field and can rise to commander or captain.',
      },
      {
        q: 'Do you salute a chief warrant officer?',
        a: 'Yes. Chief warrant officers are commissioned officers and are saluted.',
      },
      {
        q: 'How is a CWO addressed?',
        a: '"Mister" or "Ms." plus last name, or "Warrant Officer" or "Chief Warrant Officer" plus last name.',
      },
    ],
    sources: [S.ldoCwo, S.warrantHistory, S.warrantBlog, S.wikiWarrant],
    unverified: [],
  },
  {
    branch: navy,
    abbr: 'CWO3',
    slug: 'chief-warrant-officer-3',
    summary:
      'Chief Warrant Officer 3 is pay grade W-3. A CWO3 is a proven warrant officer who takes on larger technical programs, more senior advisory roles, and often department-level responsibility in a specialty.',
    role: [
      'Leads larger technical divisions or acts as a department head in a specialty',
      'Runs command programs such as maintenance, ordnance safety or communications security',
      'Serves on type commander and fleet staffs as a subject-matter expert',
      'Inspects and certifies programs at other commands',
      'Mentors CWO2s and chiefs preparing for warrant',
    ],
    promotion:
      'Promotion from CWO2 to CWO3 is by an annual officer selection board convened under Title 10, which reviews fitness reports against the number of vacancies in each warrant specialty. Selection opportunity and timing are set each year by the Navy.',
    history: [
      'The W-3 grade sits in the four-step warrant structure set up by the Career Compensation Act of 1949, which the Navy used until W-5 was added in the 1990s.',
      'A CWO3 wears a silver bar with blue enamel breaks, and the specialty device on the sleeve and shoulder boards identifies the field, such as an engineering or ordnance mark.',
      'Navy warrant specialties have been merged and renamed many times as technology changed; older specialties such as sailmaker disappeared long ago, while cyber and information systems specialties are recent additions.',
    ],
    faq: [
      {
        q: 'How long does it take to make CWO3?',
        a: 'Usually several years after appointment to CWO2. The board sets the timing based on vacancies in the specialty.',
      },
      {
        q: 'What does the specialty device on a warrant officer\'s uniform show?',
        a: 'The technical field, worn in place of a line officer\'s star. Each specialty has its own device.',
      },
      {
        q: 'Is a CWO3 a commander?',
        a: 'Not usually. Navy chief warrant officers are used mainly as technical specialists and division leaders whose authority comes from their expertise, not as commanding officers.',
      },
    ],
    sources: [S.ldoCwo, S.warrantHistory, S.title10Promo, S.wikiWarrant],
    unverified: [],
  },
  {
    branch: navy,
    abbr: 'CWO4',
    slug: 'chief-warrant-officer-4',
    summary:
      'Chief Warrant Officer 4 is pay grade W-4. CWO4s are senior technical officers with deep experience in their specialty, filling key staff, maintenance and program management roles across the fleet.',
    role: [
      'Serves as senior technical advisor to a commanding officer or major staff',
      'Manages fleet-wide or force-wide programs in a specialty',
      'Leads inspection and assessment teams',
      'Advises on manning and training for the specialty',
      'Mentors junior warrant officers and limited duty officers',
    ],
    promotion:
      'Promotion to CWO4 is by selection board, which compares records within each warrant specialty and selects against vacancies. Fitness reports from demanding CWO3 billets, such as department head or staff expert tours, carry the most weight. Officers who are passed over repeatedly may be required to retire under the warrant officer service limits in Title 10.',
    history: [
      'W-4 was the senior warrant grade from 1949 until the Warrant Officer Management Act of 1991 authorized W-5.',
      'A CWO4 wears a silver bar with blue enamel breaks, distinguished from the CWO3 bar by the pattern of breaks.',
      'Warrant officers and limited duty officers who came up from the enlisted ranks are known across the Navy as "Mustangs," and the community keeps its own history and traditions through Navy training commands.',
    ],
    faq: [
      {
        q: 'How do you tell CWO3 and CWO4 bars apart?',
        a: 'Both are silver with blue enamel; the pattern of breaks differs. Check the uniform regulations figure for exact layouts.',
      },
      {
        q: 'What comes after CWO4 in the Navy?',
        a: 'CWO5, a small grade for the most senior warrant officers.',
      },
      {
        q: 'Do CWOs retire at a set age?',
        a: 'Warrant officers face service limits under Title 10 and Navy policy, depending on grade.',
      },
    ],
    sources: [S.ldoCwo, S.warrantHistory, S.title10Promo, S.wikiWarrant],
    unverified: [],
  },
  {
    branch: navy,
    abbr: 'CWO5',
    slug: 'chief-warrant-officer-5',
    summary:
      'Chief Warrant Officer 5 is pay grade W-5, the top of the warrant officer ranks. Only a small number of Navy warrants reach it, and they hold the most senior technical and advisory positions in their specialties.',
    role: [
      'Serves as senior technical advisor at fleet and headquarters level',
      'Leads specialty programs Navy-wide',
      'Advises on warrant officer manning, training and policy',
      'Mentors warrant officers across the specialty',
      'Represents the specialty in joint and interagency work',
    ],
    promotion:
      'Promotion to CWO5 is by selection board, and federal law (10 U.S.C. 571) caps W-5s at 5 percent of a service\'s active-duty warrant officers. Only the most competitive CWO4s are selected, usually those who have already held the senior technical billets in their specialty. Because openings are so few, a CWO4 may be eligible for several years without a W-5 vacancy in the specialty.',
    history: [
      'The Warrant Officer Management Act of 1991 authorized a W-5 grade for the services, and the Navy added CWO5 to its warrant structure afterward.',
      'A CWO5 wears a silver bar with a single blue stripe down the middle, a design shared with the other services\' W-5 grade.',
      'Because the grade is capped by law, selection to CWO5 is among the most competitive promotions in the Navy, and many warrant officers retire as CWO4.',
    ],
    faq: [
      {
        q: 'How many CWO5s does the Navy have?',
        a: 'Very few. By law, W-5s can make up no more than 5 percent of the Navy\'s active-duty warrant officers.',
      },
      {
        q: 'What does a CWO5 bar look like?',
        a: 'A silver bar with a thin blue stripe running down the center.',
      },
      {
        q: 'When did the Navy first have CWO5s?',
        a: 'Only after the Warrant Officer Management Act of 1991 created the grade for all services.',
      },
    ],
    sources: [S.ldoCwo, S.warrantHistory, S.warGovInsignia, S.title10Sec571, S.wikiWarrant],
    unverified: [],
  },

  // ─── Commissioned officers ───────────────────────────────────────────────────
  {
    branch: navy,
    abbr: 'ENS',
    slug: 'ensign',
    summary:
      'Ensign is pay grade O-1, the first rank of a commissioned Navy officer. Most ensigns are in training for their warfare specialty, such as surface warfare, aviation or submarines, or serving as division officers on their first ship.',
    role: [
      'Attends specialty training: flight school, nuclear power school or surface warfare training',
      'Serves as division officer, responsible for a group of enlisted Sailors and their chief',
      'Stands junior officer watches such as junior officer of the deck',
      'Works toward a warfare qualification',
      'Learns from the division chief, the department head and the executive officer',
    ],
    promotion:
      'Ensigns are commissioned through the U.S. Naval Academy, Naval ROTC or Officer Candidate School, among other programs. Promotion to Lieutenant (junior grade) normally comes after about two years in grade for officers who are fully qualified, under the rules in Title 10, chapter 36.',
    history: [
      'Congress created the rank of ensign in the Navy in July 1862, when it reorganized the officer corps during the Civil War; ensign replaced the old title of passed midshipman. The title comes from the old word for a flag and the junior officer who carried it.',
      'Navy ensigns wear one gold bar on the collar and a single half-inch gold stripe on sleeves and shoulder boards, with a gold star above for line officers or a staff corps device for staff officers.',
      'Every Navy officer, from the newest division officer to the Chief of Naval Operations, starts at this grade or passes through its equivalent.',
    ],
    faq: [
      {
        q: 'How do you become a Navy ensign?',
        a: 'Through the Naval Academy, Naval ROTC, Officer Candidate School or a direct commission program. A four-year degree is required.',
      },
      {
        q: 'How long until an ensign makes LTJG?',
        a: 'About two years from commissioning for most officers.',
      },
      {
        q: 'Does an ensign outrank a chief?',
        a: 'Yes, in military rank. In practice, new ensigns are expected to learn from their chiefs.',
      },
    ],
    sources: [S.officer, S.officerBlog, S.insignia, S.title10Promo, S.wikiEnsign, S.wikiLtjg],
    unverified: [],
  },
  {
    branch: navy,
    abbr: 'LTJG',
    slug: 'lieutenant-junior-grade',
    summary:
      'Lieutenant (junior grade), pay grade O-2, is the second Navy officer rank. LTJGs are usually still division officers, now with enough experience to take on harder divisions and to finish their warfare qualifications.',
    role: [
      'Serves as division officer with larger or more complex responsibilities',
      'Qualifies as officer of the deck, engineering officer of the watch or aircraft commander',
      'Earns a warfare specialty pin: surface warfare, submarine or naval aviator',
      'Acts as assistant department head on some ships',
      'Supervises and evaluates enlisted Sailors and junior ensigns',
    ],
    promotion:
      'An LTJG is eligible for promotion to Lieutenant after at least two years at O-2, roughly four years after commissioning. Promotion to O-3 is nearly certain for officers who are fully qualified: Defense Department guidance expects at least 95 percent of them to be promoted. The real test at this stage is earning a warfare qualification on time, since officers who fail to qualify can be moved out of their community.',
    history: [
      'The grade was earlier titled "master." On 3 March 1883 it was renamed lieutenant (junior grade), keeping the same place between ensign and lieutenant.',
      'The insignia is one silver bar on the collar and one half-inch stripe plus one quarter-inch stripe on the sleeves and shoulder boards.',
      'For most officers, the LTJG years are when they pin on a warfare device, such as the surface warfare officer pin or naval aviator wings, the mark that they are qualified in their community.',
    ],
    faq: [
      {
        q: 'What does "junior grade" mean?',
        a: 'It marks the lower of two lieutenant grades. A lieutenant (junior grade) is O-2; a full lieutenant is O-3.',
      },
      {
        q: 'How is a lieutenant (junior grade) addressed?',
        a: 'As "Lieutenant" plus last name. The "junior grade" is used only in writing.',
      },
      {
        q: 'Is a silver bar higher than a gold bar?',
        a: 'Yes. Gold (ensign) is O-1 and silver (LTJG) is O-2.',
      },
    ],
    sources: [S.lieutenant, S.officerBlog, S.insignia, S.title10Promo, S.wikiLtjg, S.wikiLt],
    unverified: [],
  },
  {
    branch: navy,
    abbr: 'LT',
    slug: 'lieutenant',
    summary:
      'Lieutenant is pay grade O-3. Navy lieutenants are warfare-qualified officers who serve as senior division officers, department heads on smaller ships, aircraft commanders and instructors.',
    role: [
      'Serves as department head on smaller ships or as a senior division officer',
      'Flies as a qualified aircraft commander or mission commander',
      'Stands officer of the deck and tactical action officer watches',
      'Teaches at training commands and the Naval Academy',
      'Prepares for department head school or post-graduate education',
    ],
    promotion:
      'Lieutenants compete for promotion to Lieutenant Commander through a statutory selection board, the first real competitive promotion in a Navy officer\'s career. Boards review fitness reports and qualifications against the number of O-4 openings in each officer community.',
    history: [
      'Lieutenant is one of the Navy\'s original ranks, used since the Continental Navy in 1775. In the early Navy, lieutenants were the only commissioned line officers below master commandant and captain.',
      'Two silver bars joined together mark the rank on the collar, and two half-inch stripes on the sleeves and shoulder boards.',
      'A Navy lieutenant is equal in grade to an Army, Air Force or Marine captain, which is why the Navy rank of captain is much more senior than the Army one.',
    ],
    faq: [
      {
        q: 'Is a Navy lieutenant the same as an Army lieutenant?',
        a: 'No. A Navy lieutenant (O-3) equals an Army captain. Army lieutenants match Navy ensigns and LTJGs.',
      },
      {
        q: 'How long are you a lieutenant in the Navy?',
        a: 'At least three years, and usually about five to six. Defense Department guidance puts promotion to lieutenant commander at roughly 9 to 11 years of commissioned service, and the board decides the rest.',
      },
      {
        q: 'How do you pronounce lieutenant?',
        a: 'In the U.S. Navy, "loo-TEN-ant."',
      },
    ],
    sources: [S.lieutenant, S.officerBlog, S.insignia, S.title10Promo, S.wikiLt, S.wikiLcdr],
    unverified: [],
  },
  {
    branch: navy,
    abbr: 'LCDR',
    slug: 'lieutenant-commander',
    summary:
      'Lieutenant Commander is pay grade O-4, the first of the Navy\'s mid-grade officer ranks. LCDRs fill department head jobs on large ships, executive officer roles in squadrons and key staff positions.',
    role: [
      'Serves as department head aboard destroyers, cruisers, carriers and amphibious ships',
      'Serves as executive officer of smaller ships or squadrons',
      'Serves on fleet and joint staffs as a planner or operations officer',
      'Commands small ships or units in some communities',
      'Completes joint professional military education and graduate degrees',
    ],
    promotion:
      'Selection to Lieutenant Commander is made by a statutory promotion board. Under the Defense Officer Personnel Management Act framework, the Department of Defense sets planning goals for promotion opportunity and timing to O-4, O-5 and O-6; for O-4 the guidance is that 70 to 90 percent of lieutenants be promoted, at 9 to 11 years of commissioned service. Boards select the best-qualified officers within each community\'s quota. Selected officers must be confirmed by the Senate.',
    history: [
      'Congress created the lieutenant commander rank in July 1862, during the Civil War reorganization of the Navy\'s officer corps.',
      'The insignia is a gold oak leaf on the collar and two half-inch stripes with a quarter-inch stripe between them on the sleeves and shoulder boards.',
      'Lieutenant commanders do not wear the gold oak-leaf visor embroidery, nicknamed "scrambled eggs," that begins at commander. The custom traces to the rank\'s origin as "lieutenant commanding," and it keeps O-4 visually closer to the junior officers.',
    ],
    faq: [
      {
        q: 'Is a gold oak leaf higher than a silver one?',
        a: 'No. Gold oak leaf is O-4; silver oak leaf is O-5.',
      },
      {
        q: 'When does a Navy officer make LCDR?',
        a: 'Most around the 10-year mark, though it depends on the community and the board.',
      },
      {
        q: 'What is the Army equivalent of LCDR?',
        a: 'Major.',
      },
    ],
    sources: [S.officer, S.officerBlog, S.insignia, S.title10Promo, S.wikiLcdr],
    unverified: [],
  },
  {
    branch: navy,
    abbr: 'CDR',
    slug: 'commander',
    summary:
      'Commander is pay grade O-5. It is the rank at which most Navy officers get their first command at sea or ashore: destroyers, submarines, aviation squadrons and many shore units are led by commanders.',
    role: [
      'Commands a destroyer, submarine, aviation squadron or shore command',
      'Serves as executive officer of a large ship such as a carrier or amphibious assault ship',
      'Leads divisions on fleet, Navy headquarters and joint staffs',
      'Serves as a senior instructor or program manager',
      'Represents the Navy in joint and interagency billets',
    ],
    promotion:
      'Selection to Commander is by statutory board under Title 10, and it is more competitive than O-4: the board compares lieutenant commanders\' fitness reports, department head and executive officer performance, and joint and education credit. Officers are also screened for command by separate boards, so making commander and getting a command are two different steps. Selections are confirmed by the Senate.',
    history: [
      'The rank grew out of the British "master and commander" and was used in the U.S. Navy as master commandant before it was renamed commander in 1838.',
      'U.S. Navy commanders began wearing silver oak leaves in 1862. Three half-inch gold stripes on the sleeves and shoulder boards mark the rank.',
      'A commander in command of a ship is addressed as "Captain" aboard, by long custom, because the person in command of a ship is its captain regardless of rank. Commanders leading squadrons or shore units are more often called "Skipper."',
    ],
    faq: [
      {
        q: 'Why is a commander called "Captain" on a ship?',
        a: 'Navy custom calls the commanding officer of a ship its captain, whatever the officer\'s rank.',
      },
      {
        q: 'What is the Army equivalent of a Navy commander?',
        a: 'Lieutenant colonel.',
      },
      {
        q: 'Does every commander get a command?',
        a: 'No. Command is screened separately, and some commanders serve in staff jobs instead.',
      },
    ],
    sources: [S.commander, S.officerBlog, S.insignia, S.title10Promo, S.wikiCdr],
    unverified: [],
  },
  {
    branch: navy,
    abbr: 'CAPT',
    slug: 'captain',
    summary:
      'Captain is pay grade O-6, the senior Navy officer rank below the admirals. Captains command large ships such as aircraft carriers and amphibious assault ships, air wings, major shore installations and destroyer squadrons.',
    role: [
      'Commands an aircraft carrier, large amphibious ship, cruiser or submarine tender',
      'Commands air wings, destroyer squadrons and major naval bases',
      'Leads major divisions on Navy and joint staffs',
      'Serves as chief of staff to a flag officer',
      'Serves as naval attaché or senior instructor',
    ],
    promotion:
      'Captains are selected by statutory board from commanders, with promotion opportunity set within Department of Defense planning goals. Only a fraction of commanders are selected, and successful command as a commander is usually the deciding factor. Major command, such as an aircraft carrier or air wing, is screened separately. Selections are confirmed by the Senate.',
    history: [
      'Captain was the highest rank in the U.S. Navy from 1775 until 1857, when Congress created the temporary flag officer title, and remained the top permanent rank until rear admiral was created in 1862.',
      'The insignia is a silver eagle on the collar, and four half-inch stripes on the sleeves and shoulder boards.',
      'Early Navy captains such as John Paul Jones and the captains of the original six frigates built the reputation of the rank.',
    ],
    faq: [
      {
        q: 'Is a Navy captain the same as an Army captain?',
        a: 'No. A Navy captain is O-6, equal to an Army colonel. An Army captain is O-3, equal to a Navy lieutenant.',
      },
      {
        q: 'Who commands an aircraft carrier?',
        a: 'A Navy captain, usually a naval aviator.',
      },
      {
        q: 'What comes after captain in the Navy?',
        a: 'Rear Admiral (lower half), O-7.',
      },
    ],
    sources: [S.captain, S.officerBlog, S.insignia, S.title10Promo, S.wikiCommodore],
    unverified: [],
  },
  {
    branch: navy,
    abbr: 'RDML',
    slug: 'rear-admiral-lower-half',
    summary:
      'Rear Admiral (lower half) is pay grade O-7, the first flag officer rank. One-star admirals command carrier strike groups, expeditionary strike groups, regions and major shore commands, and lead divisions on high-level staffs.',
    role: [
      'Commands a carrier strike group or expeditionary strike group',
      'Commands Navy regions and major shore commands',
      'Leads directorates on fleet, Navy and joint staffs',
      'Serves as deputy commander of larger organizations',
      'Represents the Navy in international and interagency settings',
    ],
    promotion:
      'Captains are selected for flag rank by a selection board, then nominated by the President and confirmed by the Senate. The number of flag officers is limited by law.',
    history: [
      'Commodore became a permanent Navy rank in July 1862, was left off the active list by an 1899 act, and was revived in 1943 for wartime use, with promotions ending in 1947. In the early 1980s the one-star grade came back, briefly titled commodore admiral and then commodore, and in 1985 Congress (Public Law 99-145) replaced it with rear admiral (lower half).',
      'The insignia is one silver star on the collar. On the sleeves the grade wears a single two-inch gold stripe.',
      'Both one-star and two-star admirals are titled "Rear Admiral" when addressed; the "lower half" is used only for the grade.',
    ],
    faq: [
      {
        q: 'What does "lower half" mean?',
        a: 'It separates the one-star grade (O-7) from the two-star rear admiral (O-8). Both are called "Admiral."',
      },
      {
        q: 'Is a commodore the same as a one-star admiral?',
        a: 'The grade was called commodore in some periods. Today "commodore" is used only informally for the commander of some groups of ships or squadrons.',
      },
      {
        q: 'How many admirals does the Navy have?',
        a: 'The number is capped by law and changes over time.',
      },
    ],
    sources: [S.commodore, S.admiral, S.officerBlog, S.insignia, S.uniformSleeve, S.wikiCommodore, S.wikiRadm],
    unverified: [],
  },
  {
    branch: navy,
    abbr: 'RADM',
    slug: 'rear-admiral',
    summary:
      'Rear Admiral is pay grade O-8, a two-star flag officer. Rear admirals command type commands and task forces, run major Navy programs and large shore organizations, and lead major parts of the Navy and joint staffs.',
    role: [
      'Commands type commands, task forces and major shore organizations',
      'Leads major directorates on Navy and joint staffs',
      'Runs major acquisition or research programs',
      'Serves as deputy commander of fleets and joint commands',
      'Leads Navy schools such as the Naval War College',
    ],
    promotion:
      'Two-star admirals are selected by a board that reviews the records of one-star admirals, then nominated by the President and confirmed by the Senate. Not every one-star is selected; some retire after a single flag tour. The total number of Navy flag officers on active duty is capped by law, so each promotion depends on an opening.',
    history: [
      'Congress created the rank of rear admiral on 16 July 1862, in recognition of David Farragut\'s capture of New Orleans that spring. Farragut was among the first officers to hold it.',
      'The insignia is two silver stars, and a two-inch stripe with a half-inch stripe on the sleeves.',
      'The title comes from the British navy, where a fleet was split into van, center and rear squadrons and the most junior admiral took the rear. Before 1862 the U.S. Navy had avoided the word admiral altogether and used captain and the temporary title flag officer for its senior commanders.',
    ],
    faq: [
      {
        q: 'Why is it called "rear" admiral?',
        a: 'In the age of sail, the admiral\'s deputies commanded the van and rear of the fleet. The rear admiral led the rear division.',
      },
      {
        q: 'Who was the first U.S. Navy rear admiral?',
        a: 'David Farragut was among the first rear admirals in 1862.',
      },
      {
        q: 'What is the Army equivalent of rear admiral?',
        a: 'Major general.',
      },
    ],
    sources: [S.admiral, S.officerBlog, S.insignia, S.uniformSleeve, S.wikiRadm, S.wikiCommodore],
    unverified: [],
  },
  {
    branch: navy,
    abbr: 'VADM',
    slug: 'vice-admiral',
    summary:
      'Vice Admiral is pay grade O-9, a three-star flag officer. Vice admirals command numbered fleets and large Navy organizations and serve as deputy chiefs on the Navy and joint staffs.',
    role: [
      'Commands numbered fleets such as 3rd, 5th, 6th and 7th Fleets',
      'Commands type commanders and major shore commands',
      'Serves as deputy chief of naval operations',
      'Leads major joint staff positions',
      'Serves as superintendent of the Naval Academy',
    ],
    promotion:
      'Vice admiral is a positional grade: an officer holds it while assigned to a position the President designates as carrying three stars under 10 U.S.C. 601. Candidates are usually two-star admirals, though the law allows others. The Senate must confirm both the appointment and, later, retirement in the grade.',
    history: [
      'Congress created the rank of vice admiral in December 1864 for David Farragut, after his victory at Mobile Bay; most records date his promotion to 21 December 1864.',
      'The insignia is three silver stars, and a two-inch stripe with two half-inch stripes on the sleeves.',
      'After Farragut, the Navy went long stretches with no vice admiral at all. The grade became a regular part of the Navy only in the 20th century, as numbered fleets and large staffs created positions that called for three stars.',
    ],
    faq: [
      {
        q: 'Who was the first U.S. Navy vice admiral?',
        a: 'David Farragut, in 1864.',
      },
      {
        q: 'Does a vice admiral keep the rank after leaving the job?',
        a: 'Not automatically. The grade is tied to the position. To retire as a vice admiral, the officer must be nominated for retirement in that grade and confirmed by the Senate; otherwise the officer retires at the highest permanent grade, usually rear admiral.',
      },
      {
        q: 'What is the Army equivalent of vice admiral?',
        a: 'Lieutenant general.',
      },
    ],
    sources: [S.admiral, S.officerBlog, S.title10Sec601, S.insignia, S.wikiVadmList, S.wikiAdm],
    unverified: [],
  },
  {
    branch: navy,
    abbr: 'ADM',
    slug: 'admiral',
    summary:
      'Admiral is pay grade O-10, the highest active Navy rank in peacetime. Four-star admirals serve as Chief of Naval Operations, Vice Chief, fleet commanders and combatant commanders.',
    role: [
      'Serves as Chief of Naval Operations or Vice Chief of Naval Operations',
      'Commands U.S. Pacific Fleet or U.S. Fleet Forces Command',
      'Commands combatant commands such as U.S. Indo-Pacific Command',
      'Serves as Chairman or Vice Chairman of the Joint Chiefs of Staff',
      'Leads Naval Reactors',
    ],
    promotion:
      'Like vice admiral, four-star rank is tied to a position designated under 10 U.S.C. 601. The President nominates an officer, usually a vice admiral, for a specific four-star job, and the Senate confirms. The Chief of Naval Operations is appointed for a four-year term under 10 U.S.C. 8033, and the Senate votes on each four-star nomination separately.',
    history: [
      'Congress created the rank of admiral on 25 July 1866 for David Farragut, the first U.S. Navy admiral.',
      'The insignia is four silver stars, and a two-inch stripe with three half-inch stripes on the sleeves.',
      'When Farragut died in 1870, David Dixon Porter succeeded him; after Porter\'s death in 1891 no one was promoted to the grade. Congress authorized George Dewey\'s unique title of Admiral of the Navy in 1899, and in 1915 it authorized an admiral for each of the Atlantic, Pacific and Asiatic Fleets, bringing four-star rank back for the Navy\'s senior commanders.',
    ],
    faq: [
      {
        q: 'Who was the first four-star admiral in the U.S. Navy?',
        a: 'David Farragut, in 1866.',
      },
      {
        q: 'What is the highest rank in the Navy today?',
        a: 'Admiral (O-10). Fleet admiral, a five-star rank, is historical.',
      },
      {
        q: 'How many four-star admirals does the Navy have?',
        a: 'A handful at any time; the number is set by law and by the positions in use.',
      },
    ],
    sources: [S.admiral, S.officerBlog, S.title10Sec601, S.title10Sec8033, S.insignia, S.wikiAdm],
    unverified: [],
  },
  {
    branch: navy,
    abbr: 'FADM',
    slug: 'fleet-admiral',
    summary:
      'Fleet Admiral is a five-star rank created during World War II and held by only four officers. It is not a current grade; no one has been appointed since 1945.',
    role: [
      'Leahy: chief of staff to the President as Commander in Chief, presiding over the wartime Joint Chiefs',
      'King: Commander in Chief, U.S. Fleet, and Chief of Naval Operations',
      'Nimitz: Commander in Chief, Pacific Fleet and Pacific Ocean Areas',
      'Halsey: commander of the Third Fleet in the Pacific',
      'Gave U.S. commanders standing equal to British admirals of the fleet in combined planning',
    ],
    promotion:
      'There is no path to fleet admiral today. Congress authorized the grade on 14 December 1944 (Public Law 78-482) for wartime command, the President nominated the four officers and the Senate confirmed them. A 1946 law let fleet admirals keep full pay and allowances for life. No one has been appointed since 1945, and a new appointment would need new action by Congress.',
    history: [
      'Congress approved the five-star rank on 14 December 1944. William D. Leahy received it on 15 December, Ernest J. King on 17 December and Chester W. Nimitz on 19 December 1944; William F. Halsey Jr. got his fifth star on 11 December 1945.',
      'The insignia is five silver stars arranged in a pentagon, and a two-inch stripe with four half-inch stripes on the sleeves.',
      'Under a 1946 law the four kept full pay and allowances for life, though all of them eventually stepped back from active service. The last surviving Navy fleet admiral, Nimitz, died on 20 February 1966.',
    ],
    faq: [
      {
        q: 'Who were the Navy\'s fleet admirals?',
        a: 'William D. Leahy, Ernest J. King, Chester W. Nimitz and William F. Halsey Jr.',
      },
      {
        q: 'Can the Navy appoint a fleet admiral today?',
        a: 'Only if Congress authorizes it again.',
      },
      {
        q: 'Is fleet admiral higher than admiral?',
        a: 'Yes. Fleet admiral is a five-star rank above four-star admiral.',
      },
    ],
    sources: [S.fleetAdmirals, S.admiral, S.officerBlog, S.wikiFadm],
    unverified: [],
  },
];

import type { Guide } from './types';

/*
  Fitness-test guides. Every fact here was checked on the `verified` date against the
  sources listed on each guide. Rules for edits:
  - Do not reproduce age/sex score tables. Link to the official chart instead.
  - Anything that could not be confirmed from an official release is worded as
    "check the official guide" rather than stated as a number.
  - Gruntz never gives official scores. Do not write "pass", "official score" or "guaranteed".
*/

const VERIFIED = '2026-11-17';

const SOURCE = {
  armyAft: { label: 'U.S. Army: Army Fitness Test (army.mil/aft)', url: 'https://www.army.mil/aft/' },
  armyChart: { label: 'U.S. Army: AFT scoring scales (PDF)', url: 'https://www.army.mil/e2/downloads/rv7/aft/AFT_Scoring_Scales_250601.pdf' },
  oneSource: { label: 'Military OneSource: Meeting military fitness standards', url: 'https://www.militaryonesource.mil/military-life-cycle/new-to-the-military/getting-settled/meeting-military-fitness-standards/' },
  usmcStandards: { label: 'U.S. Marine Corps: PFT and CFT standards', url: 'https://www.fitness.marines.mil/PFT-CFT_Standards17/' },
  usmcRelease: { label: 'U.S. Marine Corps release: updated physical fitness standards (DVIDS)', url: 'https://www.dvidshub.net/news/554807/marine-corps-announces-updated-physical-fitness-standards' },
  navyHub: { label: 'MyNavy HR: Physical Readiness Program', url: 'https://www.mynavyhr.navy.mil/Support-Services/Culture-Resilience/Physical-Readiness/' },
  afpc: { label: 'Air Force Personnel Center: Fitness Program', url: 'https://www.afpc.af.mil/Career-Management/Fitness-Program/' },
  afRelease: { label: 'U.S. Air Force release: Air Force updates physical fitness program', url: 'https://myairforcebenefits.us.af.mil/Air-Force-updates-physical-fitness-program' },
  ussfGuidance: { label: 'U.S. Space Force: further guidance on physical fitness', url: 'https://www.spaceforce.mil/News/Article-Display/Article/4371955/space-force-publishes-further-guidance-on-physical-fitness/' },
  uscg168: { label: 'U.S. Coast Guard: ALCOAST 168/26', url: 'https://content.govdelivery.com/accounts/USDHSCG/bulletins/41b3aea' },
  uscg174: { label: 'U.S. Coast Guard: ALCOAST 174/26 (COMDTINST 6100.1)', url: 'https://content.govdelivery.com/accounts/USDHSCG/bulletins/41c58e1' },
};

const NOT_MEDICAL =
  'This is general training information, not medical advice and not official guidance. Build up gradually, and get sharp or lasting pain checked before you train through it.';

export const testGuides: Guide[] = [
  {
    slug: 'army-aft',
    kind: 'test',
    name: 'Army AFT',
    branch: 'U.S. Army',
    metaTitle: 'Army Fitness Test (AFT): Events, Scoring, How to Train',
    description:
      'The five AFT events in order, how the 300 general and 350 combat standards work, what changed from the ACFT, and how to train for each event.',
    h1: 'Army Fitness Test (AFT): events, scoring and training',
    lede: 'The Army Fitness Test replaced the ACFT as the test of record on June 1, 2025. It has five events, two scoring standards, and a separate field test for combat specialties.',
    summary: 'Five events, a 300-point general standard and a 350-point combat standard.',
    verified: VERIFIED,
    facts: [
      { label: 'Events', value: '5' },
      { label: 'Run', value: '2 miles' },
      { label: 'Test of record since', value: 'June 1, 2025' },
      { label: 'Standards', value: '300 general, 350 combat' },
    ],
    sections: [
      {
        id: 'events',
        title: 'The five AFT events in order',
        blocks: [
          { type: 'p', text: 'The AFT is taken in a fixed order. Each event is scored from 0 to 100 points, so the maximum total is 500.' },
          {
            type: 'table',
            head: ['Order', 'Event', 'What you do'],
            rows: [
              ['1', '3 repetition maximum deadlift (MDL)', 'Three controlled reps with a 60 lb hex bar plus plates'],
              ['2', 'Hand-release push-up, arm extension (HRP)', 'As many reps as you can in 2 minutes'],
              ['3', 'Sprint-drag-carry (SDC)', 'Five 50 m shuttles with a 90 lb sled and two 40 lb kettlebells'],
              ['4', 'Plank (PLK)', 'Hold a forearm plank for time'],
              ['5', 'Two-mile run (2MR)', 'Two miles for time'],
            ],
            caption: 'Event list from army.mil/aft. Points for each result depend on age, and on sex for the general standard.',
          },
        ],
      },
      {
        id: 'scoring',
        title: 'How the AFT is scored',
        blocks: [
          { type: 'p', text: 'Every soldier needs at least 60 points in each event. What changes is the total you need and which table you are scored on.' },
          {
            type: 'list',
            items: [
              '**General standard:** a total of 300 or more, with at least 60 in each event. Scored on tables that are normed by sex and age. This applies to combat-enabling specialties.',
              '**Combat standard:** a total of 350 or more, with at least 60 in each event. Scored on a sex-neutral, age-normed table. It took effect January 1, 2026 for the active component and June 1, 2026 for the Reserve and National Guard.',
              '**Permanent profiles:** soldiers with a permanent profile are scored on the events they can take, and the Army publishes the specific rules for them. Check the current directive with your unit.',
            ],
          },
          { type: 'p', text: 'A soldier who fails retests within 90 days in the active component and AGR, or within 180 days in the Guard and Reserve.' },
          { type: 'note', text: 'Point tables vary by age and sex and can be revised. Use the [official AFT scoring scales](https://www.army.mil/e2/downloads/rv7/aft/AFT_Scoring_Scales_250601.pdf) for your numbers, not a third-party chart.' },
        ],
      },
      {
        id: 'combat-mos',
        title: 'Which specialties fall under the combat standard',
        blocks: [
          { type: 'p', text: 'The Army lists 21 combat specialties that are held to the 350-point standard:' },
          { type: 'p', text: '11A, 11B, 11C, 11Z, 12A, 12B, 13A, 13F, 18A, 180A, 18B, 18C, 18D, 18E, 18F, 18Z, 19A, 19C, 19D, 19K and 19Z.' },
          { type: 'p', text: 'If your MOS is not on that list you are scored on the general standard. The list can change, so confirm it on [army.mil/aft](https://www.army.mil/aft/).' },
        ],
      },
      {
        id: 'aft-vs-acft',
        title: 'AFT vs ACFT: what changed',
        blocks: [
          {
            type: 'list',
            items: [
              'The ACFT had six events. The AFT has five: the standing power throw was removed.',
              'The AFT adds the higher, sex-neutral combat standard for the 21 combat specialties.',
              'The remaining events, their order and the 0 to 100 scale per event carried over.',
            ],
          },
          { type: 'p', text: 'If you trained for the ACFT, your deadlift, push-up, sprint-drag-carry, plank and run work all still applies.' },
        ],
      },
      {
        id: 'combat-field-test',
        title: 'The Army Combat Field Test',
        blocks: [
          { type: 'p', text: 'In 2026 the Army added a separate Combat Field Test for 24 combat specialties: the 21 above plus 12D, 89D and 89E. It is phased in from April 17, 2026 and counts for record from April 17, 2027.' },
          { type: 'p', text: 'It is done in uniform and boots, as one continuous effort to be finished in 30 minutes or less:' },
          {
            type: 'list',
            ordered: true,
            items: [
              '1-mile run',
              '30 dead-stop push-ups',
              '100 m sprint',
              '16 lifts of a 40 lb sandbag onto a 65-inch platform',
              '50 m carry of two 40 lb water cans',
              '50 m movement drill: 25 m high crawl and 25 m rush',
              'A final 1-mile run',
            ],
          },
          { type: 'p', text: 'It is often shortened to "CFT". That is a different test from the [Marine Corps CFT](/fitness-tests/marine-corps-cft/).' },
        ],
      },
      {
        id: 'training',
        title: 'How to train for each event',
        blocks: [
          {
            type: 'list',
            items: [
              '**Deadlift:** lift twice a week. One day of heavier sets of 3 to 5 on the hex bar, one lighter day of Romanian deadlifts or kettlebell swings. Add weight in small steps and keep every rep clean.',
              '**Hand-release push-ups:** practice the exact test rep, including the arm extension on the ground. See the [hand-release push-up guide](/training/hand-release-push-ups/) for a two-minute pacing plan.',
              '**Sprint-drag-carry:** once a week, rehearse the full sequence or its parts: sled drags, lateral shuffles, and 50 m carries with two kettlebells. Grip and legs both give out here, so train carries under fatigue.',
              '**Plank:** short, frequent holds beat one long hold a week. The [plank guide](/training/plank-training/) has a progression.',
              '**Two-mile run:** three runs a week covers most people: one interval day, one tempo day and one easy longer run. Use the [2-mile run plan](/training/2-mile-run-training-plan/).',
            ],
          },
          { type: 'p', text: 'Run a full practice test every four to six weeks, in order and with honest rest between events, so the run happens on tired legs the way it will on test day. In Gruntz you can log each AFT event after a practice test and see which one sits furthest from your own target.' },
          { type: 'note', text: NOT_MEDICAL },
        ],
      },
    ],
    faq: [
      { q: 'What is a passing AFT score?', a: 'At least 60 points in each of the five events, with a total of 300 or more on the general standard or 350 or more on the combat standard. Which standard applies depends on your MOS.' },
      { q: 'What happened to the standing power throw?', a: 'It was dropped when the AFT replaced the ACFT on June 1, 2025. The other five events stayed.' },
      { q: 'Is the AFT scored differently by age and sex?', a: 'The general standard uses tables normed by both age and sex. The combat standard is sex-neutral and normed by age only. The [official scoring scales](https://www.army.mil/e2/downloads/rv7/aft/AFT_Scoring_Scales_250601.pdf) have the numbers.' },
      { q: 'What is the Army Combat Field Test?', a: 'A separate seven-part field test for 24 combat specialties, done in uniform and boots in 30 minutes or less. It is phased in from April 2026 and counts for record from April 2027. It does not replace the AFT.' },
      { q: 'What happens if I fail the AFT?', a: 'You retest within 90 days if you are active component or AGR, or within 180 days in the Guard and Reserve. Your chain of command can tell you what applies between tests.' },
      { q: 'Does Gruntz give me an official AFT score?', a: 'No. Gruntz records the event results you enter and compares them with your own targets. Official scoring comes from the Army tables and your graders.' },
    ],
    sources: [SOURCE.armyAft, SOURCE.armyChart, SOURCE.oneSource],
    related: ['training/2-mile-run-training-plan', 'training/hand-release-push-ups', 'training/plank-training', 'training/ruck-march-training-plan'],
  },

  {
    slug: 'marine-corps-pft',
    kind: 'test',
    name: 'Marine Corps PFT',
    branch: 'U.S. Marine Corps',
    metaTitle: 'Marine Corps PFT: Events, Scoring and How to Train',
    description:
      'Pull-ups or push-ups, plank and 3-mile run: how the Marine PFT is scored out of 300, the 2026 combat arms rule, and how to train each event.',
    h1: 'Marine Corps PFT: events, scoring and training',
    lede: 'The Physical Fitness Test is three events worth up to 100 points each: pull-ups or push-ups, a plank, and a 3-mile run. Marines run it in the first half of the year.',
    summary: 'Pull-ups or push-ups, plank and a 3-mile run, scored out of 300.',
    verified: VERIFIED,
    facts: [
      { label: 'Events', value: '3' },
      { label: 'Run', value: '3 miles' },
      { label: 'Maximum score', value: '300' },
      { label: 'PFT season', value: 'January 1 to June 30' },
    ],
    sections: [
      {
        id: 'events',
        title: 'The three PFT events',
        blocks: [
          {
            type: 'table',
            head: ['Event', 'What you do', 'Points'],
            rows: [
              ['Pull-ups or push-ups', 'Maximum reps. You choose one of the two', 'Up to 100'],
              ['Plank', 'Hold a forearm plank for time', 'Up to 100'],
              ['3-mile run', 'Three miles for time', 'Up to 100'],
            ],
            caption: 'Points for a given result depend on age and sex. The Marine Corps publishes the tables.',
          },
          { type: 'p', text: 'Each event has a minimum you must meet. Missing the minimum in one event fails the test even if the total looks fine.' },
        ],
      },
      {
        id: 'scoring',
        title: 'How the PFT is scored',
        blocks: [
          { type: 'p', text: 'The three event scores are added for a total out of 300. The tables are normed by age and sex, and totals are grouped into classes. The class cut-offs and the per-event minimums are set in the Marine Corps order and its charts, so read them from the [official PFT and CFT standards page](https://www.fitness.marines.mil/PFT-CFT_Standards17/) and not from memory or an old chart.' },
          { type: 'note', text: 'We do not reproduce the score tables here. They vary by age and sex, and the Marine Corps has revised them more than once.' },
        ],
      },
      {
        id: 'pull-ups-or-push-ups',
        title: 'Pull-ups or push-ups',
        blocks: [
          { type: 'p', text: 'You pick one upper-body event. Pull-ups are the event that can earn the full 100 points, so a Marine chasing a maximum score trains pull-ups. Push-ups are an accepted alternative, and they are scored on their own table.' },
          { type: 'p', text: 'If you cannot do a pull-up yet, start now anyway. The [pull-up progression](/training/how-to-do-more-pull-ups/) takes you from hangs and negatives to your first rep, then builds volume.' },
        ],
      },
      {
        id: 'combat-arms-2026',
        title: 'The 2026 combat arms standard',
        blocks: [
          { type: 'p', text: 'From January 1, 2026, Marines in combat arms specialties are scored on the male age-normed PFT tables regardless of sex, and are expected to reach 210 points, which is 70 percent. The Marine Corps announced the change in late 2025.' },
          { type: 'p', text: 'Marines outside the combat arms are scored as before. The release describes remedial training and possible career effects for combat arms Marines who fall short, with details left to follow-on guidance. Ask your command which specialties are covered and what currently applies.' },
        ],
      },
      {
        id: 'pft-and-cft',
        title: 'PFT and CFT through the year',
        blocks: [
          { type: 'p', text: 'The PFT is an annual requirement run from January 1 to June 30. The [Combat Fitness Test](/fitness-tests/marine-corps-cft/) is the second annual test and is scored out of 300 as well. Together they make up most of what a Marine is physically graded on.' },
        ],
      },
      {
        id: 'training',
        title: 'How to train for each event',
        blocks: [
          {
            type: 'list',
            items: [
              '**Pull-ups:** train them three or four days a week with several easy sets rather than one all-out set. Stop each set a rep or two short of failure and add total reps week over week. Full plan: [how to do more pull-ups](/training/how-to-do-more-pull-ups/).',
              '**Push-ups, if you choose them:** two or three sessions a week of submaximal sets, plus one timed effort every week or two.',
              '**Plank:** several short holds on most days build more than one long hold. Use the [plank progression](/training/plank-training/).',
              '**3-mile run:** three or four runs a week. One interval day such as 6 x 800 m, one tempo run of 15 to 20 minutes, and one or two easy runs of 3 to 5 miles. The [2-mile plan](/training/2-mile-run-training-plan/) explains how to stretch the same structure to 3 miles.',
            ],
          },
          { type: 'p', text: 'Test the full PFT in order about once a month. Pull-ups first changes how the plank feels, and both change the run. Gruntz lets you log each PFT event and track the gap between your result and your own target.' },
          { type: 'note', text: NOT_MEDICAL },
        ],
      },
    ],
    faq: [
      { q: 'How many pull-ups do I need for a perfect PFT?', a: 'The number for 100 points depends on your age and sex. Read it from the [official Marine Corps standards](https://www.fitness.marines.mil/PFT-CFT_Standards17/) for your age group.' },
      { q: 'Can I do push-ups instead of pull-ups?', a: 'Yes. You choose pull-ups or push-ups. Push-ups are scored on their own table and cannot earn as many points as pull-ups, so a maximum PFT score needs pull-ups.' },
      { q: 'How long is the PFT plank?', a: 'The minimum and maximum hold times are set in the Marine Corps charts. Check the current chart, since the times have been revised since the plank replaced crunches.' },
      { q: 'When is PFT season?', a: 'January 1 to June 30 each year.' },
      { q: 'What changed in 2026?', a: 'Combat arms Marines are now scored on the male age-normed tables regardless of sex and are expected to reach 210 points. Other Marines are scored as before.' },
      { q: 'Does Gruntz tell me my official PFT score?', a: 'No. Gruntz records the event results you enter and compares them with your own targets. Official scores come from Marine Corps tables and your monitors.' },
    ],
    sources: [SOURCE.usmcStandards, SOURCE.usmcRelease, SOURCE.oneSource],
    related: ['fitness-tests/marine-corps-cft', 'training/how-to-do-more-pull-ups', 'training/plank-training', 'training/2-mile-run-training-plan'],
  },

  {
    slug: 'marine-corps-cft',
    kind: 'test',
    name: 'Marine Corps CFT',
    branch: 'U.S. Marine Corps',
    metaTitle: 'Marine Corps CFT: Events, Scoring and Training Guide',
    description:
      'Movement to contact, ammo can lifts and maneuver under fire: what each CFT event involves, how the 300-point test is scored, and how to prepare.',
    h1: 'Marine Corps CFT: events, scoring and training',
    lede: 'The Combat Fitness Test is three events done in boots and utilities: an 880-yard run, two minutes of ammo can lifts, and a maneuver-under-fire course.',
    summary: 'Movement to contact, ammo can lifts and maneuver under fire, in boots and utilities.',
    verified: VERIFIED,
    facts: [
      { label: 'Events', value: '3' },
      { label: 'Run', value: '880 yards' },
      { label: 'Ammo can', value: '30 lb' },
      { label: 'Maximum score', value: '300' },
    ],
    sections: [
      {
        id: 'events',
        title: 'The three CFT events',
        blocks: [
          {
            type: 'table',
            head: ['Event', 'What you do'],
            rows: [
              ['Movement to contact (MTC)', 'A timed 880-yard run in boots and utilities'],
              ['Ammunition can lifts (ACL)', 'Press a 30 lb ammo can overhead as many times as you can in 2 minutes'],
              ['Maneuver under fire (MANUF)', 'A timed course of sprints, crawls, agility runs, a buddy drag and carry, ammo can carries and a grenade toss'],
            ],
            caption: 'Event descriptions from Military OneSource and the Marine Corps standards page.',
          },
          { type: 'p', text: 'The CFT is short and intense. All three events are over in a few minutes of work each, which is why pacing mistakes cost so much.' },
        ],
      },
      {
        id: 'maneuver-under-fire',
        title: 'Maneuver under fire, step by step',
        blocks: [
          { type: 'p', text: 'MANUF is the event that surprises people. It strings together several different movements with no rest, and it is run with a partner of similar size.' },
          {
            type: 'list',
            items: [
              'Sprint from the prone, then drop into crawls',
              'Run through an agility section',
              'Drag and then carry your partner',
              'Carry two ammo cans back through the course',
              'Throw a dummy grenade at a marked target',
              'Finish with the ammo cans',
            ],
          },
          { type: 'p', text: 'The exact distances, the order and the penalties for a missed grenade throw are defined in the Marine Corps order. Walk the course with your unit before you run it for score.' },
        ],
      },
      {
        id: 'scoring',
        title: 'How the CFT is scored',
        blocks: [
          { type: 'p', text: 'Each event is worth up to 100 points for a total out of 300. Tables are normed by age and sex, each event has a minimum, and totals are grouped into classes in the same way as the PFT. Read your numbers from the [official PFT and CFT standards page](https://www.fitness.marines.mil/PFT-CFT_Standards17/).' },
        ],
      },
      {
        id: 'cft-vs-pft',
        title: 'CFT vs PFT',
        blocks: [
          { type: 'p', text: 'The [PFT](/fitness-tests/marine-corps-pft/) measures general fitness in PT gear: pull-ups or push-ups, a plank and a 3-mile run. The CFT measures short, hard, loaded work in boots and utilities. Marines take both each year, and training for one does not fully cover the other.' },
          { type: 'p', text: 'The Army also has a "CFT", the Combat Field Test introduced in 2026. It is a different test, described in the [Army AFT guide](/fitness-tests/army-aft/).' },
        ],
      },
      {
        id: 'training',
        title: 'How to train for each event',
        blocks: [
          {
            type: 'list',
            items: [
              '**Movement to contact:** 880 yards is two laps of a track. Train it with 400 m and 200 m repeats at faster than goal pace, with equal rest, once a week. Do some of them in boots on grass once your running base is solid.',
              '**Ammo can lifts:** practice the exact movement with a 30 lb can or a dumbbell held the same way. Two sessions a week of timed sets such as 4 x 45 seconds, building to a full 2 minutes. Add overhead presses and push presses for strength.',
              '**Maneuver under fire:** train the pieces under fatigue. Sandbag or partner drags, farmer carries with two 30 lb loads, low crawls, and short shuttles, strung into 2 to 3 minute circuits with full rest between rounds.',
            ],
          },
          { type: 'p', text: 'Keep two or three easy runs a week going in CFT season. The events are short, but the aerobic base is what lets you recover between them. In Gruntz you can log each CFT event result and compare it with your own target.' },
          { type: 'note', text: NOT_MEDICAL },
        ],
      },
    ],
    faq: [
      { q: 'What is on the CFT?', a: 'Three events: movement to contact (a timed 880-yard run), ammunition can lifts (a 30 lb can pressed overhead for 2 minutes) and maneuver under fire (a timed course with crawls, a buddy drag, ammo can carries and a grenade toss).' },
      { q: 'How heavy is the ammo can?', a: '30 pounds.' },
      { q: 'How long is movement to contact?', a: '880 yards, which is about two laps of a standard track, run in boots and utilities.' },
      { q: 'What is a passing CFT score?', a: 'You need the minimum in each event for your age and sex, and the total places you in a class. The numbers are in the [official standards](https://www.fitness.marines.mil/PFT-CFT_Standards17/).' },
      { q: 'Is the Marine CFT the same as the Army CFT?', a: 'No. The Army Combat Field Test, introduced in 2026, is a separate seven-part test for Army combat specialties.' },
    ],
    sources: [SOURCE.usmcStandards, SOURCE.oneSource, SOURCE.usmcRelease],
    related: ['fitness-tests/marine-corps-pft', 'training/how-to-do-more-pull-ups', 'training/ruck-march-training-plan', 'fitness-tests/army-aft'],
  },

  {
    slug: 'navy-prt',
    kind: 'test',
    name: 'Navy PRT',
    branch: 'U.S. Navy',
    metaTitle: 'Navy PRT 2026: Events, Cardio Options and How to Train',
    description:
      'Push-ups, forearm plank and a 1.5-mile run or approved alternate cardio. How the Navy PRT is scored, what changed for 2026, and how to prepare.',
    h1: 'Navy PRT: events, cardio options and training',
    lede: 'The Physical Readiness Test is push-ups, a forearm plank and a 1.5-mile run or an approved alternate cardio event. It is one half of the Navy PFA.',
    summary: 'Push-ups, forearm plank and a 1.5-mile run or approved alternate cardio.',
    verified: VERIFIED,
    facts: [
      { label: 'Events', value: '3' },
      { label: 'Run', value: '1.5 miles' },
      { label: 'Push-ups', value: '2 minutes' },
      { label: 'Part of', value: 'The PFA, with the BCA' },
    ],
    sections: [
      {
        id: 'pfa-prt-bca',
        title: 'PFA, PRT and BCA: which is which',
        blocks: [
          {
            type: 'list',
            items: [
              '**PFA**, the Physical Fitness Assessment, is the whole requirement.',
              '**BCA**, the Body Composition Assessment, is the measurement half.',
              '**PRT**, the Physical Readiness Test, is the exercise half. That is what this page covers.',
            ],
          },
        ],
      },
      {
        id: 'events',
        title: 'The three PRT events',
        blocks: [
          {
            type: 'table',
            head: ['Event', 'What you do'],
            rows: [
              ['Push-ups', 'As many correct reps as you can in 2 minutes'],
              ['Forearm plank', 'Hold for time'],
              ['Cardio', 'A 1.5-mile run, or an approved alternate cardio event'],
            ],
            caption: 'Event list from Military OneSource and the Navy Physical Readiness Program.',
          },
        ],
      },
      {
        id: 'alternate-cardio',
        title: 'Alternate cardio options',
        blocks: [
          { type: 'p', text: 'The Navy allows alternate cardio events in place of the run, such as a swim, a stationary bike or a rower. They are offered at the commanding officer\'s discretion, so not every command runs every option.' },
          { type: 'p', text: 'Published lists of the options differ between sources and have changed between guide revisions. Before you train for an alternate, confirm two things with your command fitness leader: that the option is offered at your command, and the exact distance or time in the current Guide 5 on the [MyNavy HR Physical Readiness page](https://www.mynavyhr.navy.mil/Support-Services/Culture-Resilience/Physical-Readiness/).' },
        ],
      },
      {
        id: 'scoring',
        title: 'How the PRT is scored',
        blocks: [
          { type: 'p', text: 'Each event is scored on tables normed by age and sex, and your results place you in a category: Outstanding, Excellent, Good, Satisfactory or Probationary. To pass the PRT you need Probationary or better in all three events.' },
          { type: 'note', text: 'Cut scores for each category are in the official guides and are not reproduced here. They vary by age and sex.' },
        ],
      },
      {
        id: 'changes-2026',
        title: 'What changed for 2026',
        blocks: [
          { type: 'p', text: 'The Navy announced several changes at the end of 2025. As reported from those announcements:' },
          {
            type: 'list',
            items: [
              'Two PFA cycles a year: January 1 to June 30 and July 1 to December 31.',
              'A reset of earlier PFA failures for career purposes, with new rules on repeated failures going forward.',
              'A body composition assessment based on waist-to-height ratio.',
            ],
          },
          { type: 'p', text: 'The Navy revised its Physical Readiness guides again during 2026. Treat the current NAVADMIN and guides as the authority, and ask your command fitness leader what applies to your cycle.' },
        ],
      },
      {
        id: 'training',
        title: 'How to train for each event',
        blocks: [
          {
            type: 'list',
            items: [
              '**Push-ups:** three sessions a week. Do several sets at about half to two thirds of your best, and once every week or two do a full timed 2-minute effort to practice pacing and resting in the up position.',
              '**Forearm plank:** train it most days in short holds, and extend the total time gradually. The [plank guide](/training/plank-training/) has a week-by-week progression.',
              '**1.5-mile run:** three runs a week. One interval day such as 6 x 400 m at faster than goal pace, one tempo run of 10 to 15 minutes, and one easy run of 2 to 4 miles. The [2-mile run plan](/training/2-mile-run-training-plan/) shows how to adapt it to 1.5 miles.',
              '**Alternate cardio:** if you will test on the bike, rower or in the pool, do most of your cardio training on that same equipment.',
            ],
          },
          { type: 'p', text: 'Run a mock PRT in order every four to six weeks. Gruntz lets you log push-ups, plank and cardio results and see which one is furthest from your own target.' },
          { type: 'note', text: NOT_MEDICAL },
        ],
      },
    ],
    faq: [
      { q: 'What is a passing PRT score?', a: 'Probationary or better in all three events. The numbers behind each category depend on your age and sex and are in the Navy\'s official guides.' },
      { q: 'Can I row, swim or bike instead of running?', a: 'The Navy allows alternate cardio, but only where the commanding officer offers it. Confirm the options and the exact standard with your command fitness leader.' },
      { q: 'How long is the Navy plank?', a: 'The times for each scoring category vary by age and sex. Read them from the current Guide 5 on the MyNavy HR site.' },
      { q: 'How many PFA cycles are there in 2026?', a: 'Two, according to the Navy\'s announcements for 2026: January to June and July to December.' },
      { q: 'What is the BCA?', a: 'The Body Composition Assessment, the measurement half of the PFA. The PRT is the exercise half.' },
      { q: 'Does Gruntz give me an official PRT score?', a: 'No. Gruntz records the results you enter and compares them with your own targets. Official scoring comes from the Navy guides and your command fitness leader.' },
    ],
    sources: [SOURCE.navyHub, SOURCE.oneSource],
    related: ['training/plank-training', 'training/2-mile-run-training-plan', 'training/boot-camp-workout-plan', 'fitness-tests/coast-guard-pft'],
  },

  {
    slug: 'air-force-pfra',
    kind: 'test',
    name: 'Air Force PFRA',
    branch: 'U.S. Air Force',
    metaTitle: 'Air Force PT Test 2026 (PFRA): Events, Scoring, Training',
    description:
      'The new Air Force fitness test explained: 2-mile run or HAMR, strength and core options, waist-to-height score, key dates, and how to train.',
    h1: 'Air Force PT test 2026: the PFRA explained',
    lede: 'The Air Force replaced its old fitness assessment with the Physical Fitness Readiness Assessment in 2026. It has four scored components, a 2-mile run, and it is taken every six months.',
    summary: 'Four scored components worth 100 points, with a 2-mile run or HAMR.',
    verified: VERIFIED,
    facts: [
      { label: 'Scored components', value: '4' },
      { label: 'Cardio', value: '2-mile run or 20 m HAMR' },
      { label: 'Frequency', value: 'Every 6 months' },
      { label: 'Scored testing began', value: 'July 1, 2026' },
    ],
    sections: [
      {
        id: 'timeline',
        title: 'What changed and when',
        blocks: [
          { type: 'p', text: 'Many pages about this test are out of date, because the plan changed after it was first announced.' },
          {
            type: 'list',
            items: [
              '**September 2025:** the Air Force announced the new program, with testing paused from January 1, 2026 and scored tests planned from September 2026.',
              '**February 26, 2026:** an updated memo moved the dates. Diagnostic testing ran from March 1, 2026.',
              '**July 1, 2026:** official scored testing began.',
            ],
          },
          { type: 'p', text: 'You will see the test called the PFRA, the PFA and simply the PT test. They refer to the same assessment. The old 1.5-mile run test is gone.' },
        ],
      },
      {
        id: 'components',
        title: 'The four scored components',
        blocks: [
          {
            type: 'table',
            head: ['Component', 'Points', 'Options'],
            rows: [
              ['Cardiorespiratory', '50', '2-mile run, or 20 m HAMR shuttle'],
              ['Waist-to-height ratio', '20', 'Measured, not an exercise'],
              ['Muscular strength', '15', '1 minute of push-ups, or 2 minutes of hand-release push-ups'],
              ['Core endurance', '15', '1 minute of sit-ups, 2 minutes of cross-leg reverse crunches, or a forearm plank'],
            ],
            caption: 'Point weights from the Air Force release. Options as published with the 2026 guidance. Confirm both on the AFPC fitness page.',
          },
          { type: 'p', text: 'You pick one option in each exercise component. Airmen test every six months regardless of their last score.' },
        ],
      },
      {
        id: 'run-or-hamr',
        title: '2-mile run vs HAMR',
        blocks: [
          { type: 'p', text: 'The HAMR is a 20-meter shuttle run to audio beeps that get faster each level. You run until you can no longer reach the line in time. It suits people who pace well off a signal and can change direction efficiently. The 2-mile run suits people with a steady aerobic engine.' },
          { type: 'p', text: 'Under the February 2026 update, Airmen choose between the two at each test. Earlier guidance required a 2-mile run at least once a year, so check the current rule on the [AFPC fitness page](https://www.afpc.af.mil/Career-Management/Fitness-Program/) before you plan a whole year around the HAMR.' },
        ],
      },
      {
        id: 'waist-to-height',
        title: 'Waist-to-height ratio',
        blocks: [
          { type: 'p', text: 'Body composition is scored as your waist measurement divided by your height. A ratio of 0.55 or higher is rated high risk and does not meet the standard. The measurement can be taken up to five days before the exercise components.' },
          { type: 'p', text: 'This component is worth 20 of the 100 points, which is more than strength or core on their own.' },
        ],
      },
      {
        id: 'scoring',
        title: 'How the PFRA is scored',
        blocks: [
          { type: 'p', text: 'The four components add up to 100 points, and each one has its own minimum. Charts are normed by age and sex, and separate charts exist for some career fields such as special warfare and EOD. Scores are now recorded on performance briefs.' },
          { type: 'note', text: 'The Air Force revised its scoring charts in March 2026. Use the charts on the [AFPC fitness page](https://www.afpc.af.mil/Career-Management/Fitness-Program/) for your composite minimum and component numbers.' },
        ],
      },
      {
        id: 'training',
        title: 'How to train for each component',
        blocks: [
          {
            type: 'list',
            items: [
              '**2-mile run:** half of your score sits here. Three runs a week: intervals, a tempo run and an easy longer run. Follow the [2-mile run plan](/training/2-mile-run-training-plan/).',
              '**HAMR:** practice the actual shuttle with the audio at least every other week. Add 20 m repeats with sharp turns, and keep one steady run a week for the base.',
              '**Push-ups or hand-release push-ups:** try both early and pick the one that scores better for you, then train only that. The [hand-release guide](/training/hand-release-push-ups/) covers form and two-minute pacing.',
              '**Core:** the same advice applies. Test sit-ups, reverse crunches and the plank once, choose, and train your choice. The [plank guide](/training/plank-training/) has a progression.',
              '**Waist-to-height:** this one moves slowly. Consistent training and eating habits over months matter more than anything you do in test week.',
            ],
          },
          { type: 'p', text: 'In Gruntz you can log your run, strength and core results after each practice test and track the gap to your own target.' },
          { type: 'note', text: NOT_MEDICAL },
        ],
      },
    ],
    faq: [
      { q: 'Is the 2-mile run mandatory?', a: 'The cardio component is mandatory, and it is either the 2-mile run or the 20 m HAMR shuttle. Under the February 2026 update Airmen choose at each test. Confirm the current rule with your unit fitness program manager.' },
      { q: 'When did scored testing start?', a: 'July 1, 2026. Tests from March 1, 2026 were diagnostic.' },
      { q: 'What is the HAMR?', a: 'A 20-meter shuttle run paced by audio beeps that speed up each level. Your score is how far into the test you get.' },
      { q: 'How is waist-to-height scored?', a: 'Waist divided by height. It is worth 20 points, and a ratio of 0.55 or higher does not meet the standard.' },
      { q: 'How often do Airmen test?', a: 'Every six months, regardless of the previous score.' },
      { q: 'Is it called the PFA or the PFRA?', a: 'The current name is the Physical Fitness Readiness Assessment, PFRA. People still say PFA or PT test, and they mean the same assessment.' },
    ],
    sources: [SOURCE.afpc, SOURCE.afRelease, SOURCE.oneSource],
    related: ['fitness-tests/space-force-hpa', 'training/2-mile-run-training-plan', 'training/hand-release-push-ups', 'training/plank-training'],
  },

  {
    slug: 'space-force-hpa',
    kind: 'test',
    name: 'Space Force HPA',
    branch: 'U.S. Space Force',
    metaTitle: 'Space Force Fitness Test (HPA): Events and How to Train',
    description:
      'What Guardians test on in 2026: 2-mile run or HAMR, push-up and core options, twice-a-year HPAs, and how to train for each component.',
    h1: 'Space Force Human Performance Assessment (HPA)',
    lede: 'Guardians take a Human Performance Assessment twice a year. It covers cardio, strength, core endurance and body composition, with a choice of exercise in each.',
    summary: 'Twice a year: cardio, strength, core endurance and body composition.',
    verified: VERIFIED,
    facts: [
      { label: 'Frequency', value: 'Twice a year' },
      { label: 'Cardio', value: '2-mile run or 20 m HAMR' },
      { label: 'In effect for all Guardians', value: 'January 1, 2026' },
      { label: 'Body composition', value: 'Waist-to-height ratio' },
    ],
    sections: [
      {
        id: 'what-it-is',
        title: 'What the HPA is',
        blocks: [
          { type: 'p', text: 'The Space Force does have a fitness test. Since January 1, 2026 every Guardian takes two Human Performance Assessments a year. That includes Guardians who were previously exempt because they took part in the service\'s wearable fitness study.' },
        ],
      },
      {
        id: 'components',
        title: 'Components and options',
        blocks: [
          {
            type: 'table',
            head: ['Component', 'Options'],
            rows: [
              ['Cardio', '2-mile run, or 20 m HAMR shuttle'],
              ['Strength', '1 minute of push-ups, or 2 minutes of hand-release push-ups'],
              ['Core endurance', '1 minute of sit-ups, 2 minutes of cross-leg reverse crunches, or a timed forearm plank'],
              ['Body composition', 'Waist-to-height ratio'],
            ],
            caption: 'Component list from Military OneSource and Space Force guidance.',
          },
          { type: 'p', text: 'At least one of your two HPAs each year has to use the 2-mile run for cardio. The other can use the HAMR.' },
        ],
      },
      {
        id: 'scoring',
        title: 'How the HPA is scored',
        blocks: [
          { type: 'p', text: 'Under [SPFMAN 36-2905](https://static.e-publishing.af.mil/production/1/sf_s1/publication/spfman36-2905/spfman36-2905.pdf) (Change 3, April 2026), cardio is worth 60 points, strength 20 and core endurance 20, and a Guardian needs the minimum in each component and a composite of 75 or more out of 100. The point charts themselves sit in the myFitness app rather than in a public document, so get the current chart from your unit, and read the [Space Force guidance](https://www.spaceforce.mil/News/Article-Display/Article/4371955/space-force-publishes-further-guidance-on-physical-fitness/) for the policy itself.' },
          { type: 'p', text: 'HPA results are now recorded on performance reports.' },
        ],
      },
      {
        id: 'vs-air-force',
        title: 'How it differs from the Air Force test',
        blocks: [
          { type: 'p', text: 'The exercise options are the same as the [Air Force PFRA](/fitness-tests/air-force-pfra/): the same run or shuttle, the same strength choices and the same core choices. The differences are in the rules around them. The Space Force requires the 2-mile run in at least one of the two yearly assessments, and it scores under its own manual and its own categories.' },
        ],
      },
      {
        id: 'training',
        title: 'How to train for each component',
        blocks: [
          {
            type: 'list',
            items: [
              '**2-mile run:** you will run it at least once a year, so train for it year-round. Three runs a week: intervals, a tempo run and an easy longer run. Use the [2-mile run plan](/training/2-mile-run-training-plan/).',
              '**HAMR:** rehearse the real shuttle with the audio, and add short 20 m repeats with turns.',
              '**Strength:** try both push-up formats once, choose the better one, and train it two or three times a week. See the [hand-release push-up guide](/training/hand-release-push-ups/).',
              '**Core:** pick between sit-ups, reverse crunches and the plank the same way. The [plank guide](/training/plank-training/) has a progression.',
            ],
          },
          { type: 'p', text: 'With two assessments a year there is never a long off-season. A steady three or four sessions a week keeps you ready for both. Gruntz lets you log each component after a practice test and see which one is furthest from your own target.' },
          { type: 'note', text: NOT_MEDICAL },
        ],
      },
    ],
    faq: [
      { q: 'Does the Space Force have a PT test?', a: 'Yes. It is the Human Performance Assessment, taken twice a year by all Guardians since January 1, 2026.' },
      { q: 'Is the 2-mile run required?', a: 'At least one of your two yearly HPAs has to use the 2-mile run. The other can use the 20 m HAMR shuttle.' },
      { q: 'How is the HPA different from the Air Force test?', a: 'The exercise options match. The Space Force sets its own scoring under its own manual and requires the 2-mile run once a year.' },
      { q: 'Do wearables replace the test?', a: 'No. Guardians in the wearable study were previously exempt, but since January 1, 2026 they take the HPA like everyone else.' },
      { q: 'Does Gruntz give me an official HPA score?', a: 'No. Gruntz records the results you enter and compares them with your own targets. Official scoring comes from the Space Force.' },
    ],
    sources: [SOURCE.ussfGuidance, SOURCE.oneSource],
    related: ['fitness-tests/air-force-pfra', 'training/2-mile-run-training-plan', 'training/hand-release-push-ups', 'training/plank-training'],
  },

  {
    slug: 'coast-guard-pft',
    kind: 'test',
    name: 'Coast Guard PFT',
    branch: 'U.S. Coast Guard',
    metaTitle: 'Coast Guard Fitness Test 2026: PFT Events and Training',
    description:
      'The Coast Guard\'s first service-wide PFT: one minute of push-ups, forearm plank and a cardio event. Timeline, scoring basics and how to train.',
    h1: 'Coast Guard PFT: events, timeline and training',
    lede: 'The Coast Guard introduced its first service-wide Physical Fitness Test in 2026. It became a requirement on July 1, 2026, after nine months of practice assessments.',
    summary: 'The first service-wide Coast Guard test: push-ups, plank and a cardio event.',
    verified: VERIFIED,
    facts: [
      { label: 'Required since', value: 'July 1, 2026' },
      { label: 'Frequency', value: 'Twice a year' },
      { label: 'Events', value: 'Push-ups, plank, cardio' },
      { label: 'Program', value: 'Physical Readiness Program' },
    ],
    sections: [
      {
        id: 'why-now',
        title: 'Why there is now a service-wide test',
        blocks: [
          { type: 'p', text: 'Until 2026 the Coast Guard tested fitness by job, such as boat crews and rescue swimmers, and had no single test for everyone. The Physical Readiness Program changed that. Its instruction, COMDTINST 6100.1, was promulgated in June 2026.' },
          { type: 'p', text: 'Older pages that describe a Coast Guard test with sit-ups and a sit-and-reach are describing the previous arrangement.' },
        ],
      },
      {
        id: 'timeline',
        title: 'Timeline',
        blocks: [
          {
            type: 'list',
            items: [
              '**Before July 1, 2026:** nine months of assessments with no administrative consequences.',
              '**July 1, 2026:** the first mandatory PFT requirement began. Scores are recorded in Direct Access from this date.',
              '**From 2027:** results appear on officer evaluations.',
              '**From 2028:** results appear on enlisted evaluations.',
            ],
          },
          { type: 'p', text: 'The PFT is semi-annual. Some communities may replace one of the two with a sex-neutral community fitness test, starting with aviation survival technicians.' },
        ],
      },
      {
        id: 'events',
        title: 'The three events',
        blocks: [
          {
            type: 'table',
            head: ['Event', 'What you do'],
            rows: [
              ['Push-ups', 'As many as you can in 1 minute'],
              ['Forearm plank', 'Hold for time'],
              ['Cardio', 'A 1.5-mile run, with row and swim alternatives'],
            ],
            caption: 'Events as reported from Coast Guard announcements. The test is based on the existing boat crew standard.',
          },
          { type: 'p', text: 'Reports of the swim alternative disagree on its format, so confirm the cardio options and their distances with your unit before you train for one.' },
        ],
      },
      {
        id: 'scoring',
        title: 'How it is scored, and where the standards live',
        blocks: [
          { type: 'p', text: 'Each event is graded on tables normed by age and sex. The score charts are in [COMDTINST 6100.1](https://media.defense.gov/2026/Jun/16/2003949424/-1/-1/0/CI_6100_1.PDF), which is public. For a quick estimate, use the [Coast Guard PFT calculator](/tools/coast-guard/pft-calculator/), and confirm the current chart with your unit.' },
          { type: 'note', text: 'The public announcements are [ALCOAST 168/26](https://content.govdelivery.com/accounts/USDHSCG/bulletins/41b3aea) and [ALCOAST 174/26](https://content.govdelivery.com/accounts/USDHSCG/bulletins/41c58e1). They cover the timeline and policy, not the score tables.' },
        ],
      },
      {
        id: 'training',
        title: 'How to train for each event',
        blocks: [
          {
            type: 'list',
            items: [
              '**Push-ups, 1 minute:** one minute rewards speed and clean reps more than endurance. Train three times a week with sets of about half your best, and practice a full 60-second effort every week or two.',
              '**Forearm plank:** short holds on most days. Follow the [plank progression](/training/plank-training/).',
              '**1.5-mile run:** three runs a week: 400 m repeats, a short tempo run and one easy run of 2 to 4 miles. The [2-mile run plan](/training/2-mile-run-training-plan/) shows how to adapt it to 1.5 miles.',
              '**Row or swim:** if you plan to test on an alternative, do most of your cardio in that mode and learn to hold an even pace.',
            ],
          },
          { type: 'p', text: 'New to structured training, or heading to Cape May? Start with the [boot camp workout plan](/training/boot-camp-workout-plan/). In Gruntz you can log each PFT event and track the gap to your own target.' },
          { type: 'note', text: NOT_MEDICAL },
        ],
      },
    ],
    faq: [
      { q: 'Does the Coast Guard have a PT test now?', a: 'Yes. A service-wide Physical Fitness Test became a requirement on July 1, 2026 under the new Physical Readiness Program.' },
      { q: 'When did it become mandatory?', a: 'July 1, 2026. Assessments before that date carried no administrative consequences.' },
      { q: 'Can I swim or row instead of running?', a: 'Row and swim alternatives to the 1.5-mile run have been announced. Confirm the exact options and distances with your unit.' },
      { q: 'How often is the test?', a: 'Twice a year. Some communities can substitute one with their own community fitness test.' },
      { q: 'Where is the official score chart?', a: 'In COMDTINST 6100.1, published on media.defense.gov. The [Coast Guard PFT calculator](/tools/coast-guard/pft-calculator/) uses those charts for an unofficial estimate.' },
      { q: 'Does Gruntz give me an official Coast Guard score?', a: 'No. Gruntz records the results you enter and compares them with your own targets. Official scoring comes from the Coast Guard.' },
    ],
    sources: [SOURCE.uscg168, SOURCE.uscg174],
    related: ['fitness-tests/navy-prt', 'training/plank-training', 'training/boot-camp-workout-plan', 'training/2-mile-run-training-plan'],
  },
];

/** Cross-branch comparison for the hub page. One row per test, facts only from the guides above. */
export const comparison = {
  head: ['Test', 'Branch', 'Events', 'Cardio', 'How often'],
  rows: [
    ['[Army AFT](/fitness-tests/army-aft/)', 'Army', 'Deadlift, hand-release push-ups, sprint-drag-carry, plank, run', '2-mile run', 'Set by component and unit'],
    ['[Marine Corps PFT](/fitness-tests/marine-corps-pft/)', 'Marine Corps', 'Pull-ups or push-ups, plank, run', '3-mile run', 'Yearly, January to June'],
    ['[Marine Corps CFT](/fitness-tests/marine-corps-cft/)', 'Marine Corps', 'Movement to contact, ammo can lifts, maneuver under fire', '880-yard run', 'Yearly'],
    ['[Navy PRT](/fitness-tests/navy-prt/)', 'Navy', 'Push-ups, forearm plank, cardio', '1.5-mile run or approved alternate', 'Two cycles in 2026'],
    ['[Air Force PFRA](/fitness-tests/air-force-pfra/)', 'Air Force', 'Cardio, strength, core, waist-to-height', '2-mile run or 20 m HAMR', 'Every 6 months'],
    ['[Space Force HPA](/fitness-tests/space-force-hpa/)', 'Space Force', 'Cardio, strength, core, body composition', '2-mile run or 20 m HAMR', 'Twice a year'],
    ['[Coast Guard PFT](/fitness-tests/coast-guard-pft/)', 'Coast Guard', 'Push-ups, forearm plank, cardio', '1.5-mile run, row or swim', 'Twice a year'],
  ],
};

export const hubFaq = [
  { q: 'Which branch has the hardest fitness test?', a: 'There is no fair single answer, because the tests measure different things. The Marine Corps runs the longest distance at 3 miles and adds a second test in boots. The Army test has the most events and the only maximal lift. The Air Force and Space Force weight cardio most heavily.' },
  { q: 'Which tests include a plank?', a: 'The Army AFT, Marine Corps PFT, Navy PRT and Coast Guard PFT all require a plank. In the Air Force PFRA and Space Force HPA it is one of the core options. See the [plank guide](/training/plank-training/).' },
  { q: 'Which branches use a 2-mile run?', a: 'The Army, and the Air Force and Space Force as one of two cardio options. The Navy and Coast Guard use 1.5 miles and the Marine Corps PFT uses 3 miles.' },
  { q: 'Do standards differ by age and sex?', a: 'In most cases yes. The exceptions are the sex-neutral combat standards, such as the Army combat standard and the Marine Corps combat arms rule. Always read your numbers from the official chart for your branch.' },
  { q: 'Can Gruntz tell me if I will pass?', a: 'No. Gruntz records the event results you enter and compares them with your own targets. It is not an official score and not a prediction of passing.' },
];

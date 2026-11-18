import type { Guide } from './types';

export const trainingGuides: Guide[] = [
  {
    slug: 'boot-camp-workout-plan',
    kind: 'training',
    name: 'Boot camp prep',
    metaTitle: 'How to Prepare for Boot Camp: 8-Week Workout Plan',
    description:
      'A practical plan to get in shape before basic training: running base, push-ups, pull-ups, core and rucking, plus what each branch tests first.',
    h1: 'How to get in shape for boot camp',
    lede: "Recruit training is easier to learn from when you are not also fighting your own fitness. This plan builds a running base, calisthenics volume and time on your feet over eight weeks, with rest built in.",
    summary: 'An 8-week running, calisthenics and rucking plan to arrive at basic training ready to work.',
    verified: '2026-11-17',
    facts: [
      { label: 'Plan length', value: '8 weeks' },
      { label: 'Training days', value: '5 per week' },
      { label: 'Rest days', value: '2 per week' },
      { label: 'Equipment', value: 'Running shoes, pull-up bar, backpack' },
    ],
    sections: [
      {
        id: 'what-each-branch-tests',
        title: 'What each branch tests',
        blocks: [
          {
            type: 'p',
            text: "Every branch runs its own fitness test, and the events decide what your training should favor. Scoring depends on age and sex and the standards change, so use the linked guides for current numbers and confirm the entry requirements for your ship date with your recruiter.",
          },
          {
            type: 'list',
            items: [
              "**Army:** the [Army AFT](/fitness-tests/army-aft/) includes hand-release push-ups, a plank and a 2-mile run.",
              "**Marine Corps:** the [Marine Corps PFT](/fitness-tests/marine-corps-pft/) is pull-ups or push-ups, a plank and a 3-mile run. Marines also take the [CFT](/fitness-tests/marine-corps-cft/).",
              "**Navy:** the [Navy PRT](/fitness-tests/navy-prt/) includes a plank and a 1.5-mile run.",
              "**Air Force:** the [Air Force PFRA](/fitness-tests/air-force-pfra/) uses a 2-mile run or the 20 m HAMR shuttle, plus strength and core components.",
              "**Space Force:** the [Space Force HPA](/fitness-tests/space-force-hpa/) uses a 2-mile run or the 20 m HAMR shuttle, plus strength and core components.",
              "**Coast Guard:** the [Coast Guard PFT](/fitness-tests/coast-guard-pft/) includes a plank and a 1.5-mile run.",
            ],
          },
          {
            type: 'p',
            text: "The first assessment you take on arrival may not be the same as your branch's test of record. Ask your recruiter exactly what you will be tested on in the first week, then train for that and for the full test. The [fitness test hub](/fitness-tests/) lists all six.",
          },
        ],
      },
      {
        id: 'how-long-you-need',
        title: 'How long you need',
        blocks: [
          {
            type: 'p',
            text: "Eight weeks is enough to make a real difference if you can already jog for ten minutes and do a few push-ups. If you are starting further back, give yourself longer and repeat weeks rather than skipping ahead.",
          },
          {
            type: 'list',
            items: [
              "**Cannot run 10 minutes without stopping:** plan on 12 to 16 weeks. Repeat weeks 1 and 2 of the running table until they feel easy.",
              "**Can run 1.5 miles and do 10 or more push-ups:** the 8-week plan as written fits you.",
              "**Already training four days a week:** start at week 3 and spend the extra time on your weakest test event.",
              "**Less than four weeks out:** do not cram. Run easy three times a week, do sub-maximal push-ups and planks, and arrive rested.",
            ],
          },
        ],
      },
      {
        id: 'weekly-structure',
        title: 'Weekly structure',
        blocks: [
          {
            type: 'p',
            text: "Five training days and two rest days. Hard days alternate with easier ones so your legs and shoulders recover between sessions. Move the days to fit your week, but keep at least one full rest day before the long session.",
          },
          {
            type: 'table',
            head: ['Day', 'Session', 'What to do'],
            rows: [
              ['Monday', 'Easy run + calisthenics', 'Easy run from the table, then push-up, pull-up and core sets'],
              ['Tuesday', 'Speed day', 'Warm up 10 minutes, speed session from the table, walk 5 minutes'],
              ['Wednesday', 'Calisthenics + legs', 'Push-ups, pull-ups, squats, lunges, planks. No running'],
              ['Thursday', 'Easy run', 'Easy run, then 10 minutes of core work'],
              ['Friday', 'Rest', 'Walk, stretch, sleep'],
              ['Saturday', 'Long run or ruck', 'Long run most weeks. Swap for a ruck walk every second week'],
              ['Sunday', 'Rest', 'Full rest day'],
            ],
            caption: 'One week of the 8-week plan',
          },
          {
            type: 'p',
            text: "You can log these sessions and your practice test events in Gruntz so you can see what changed from week to week.",
          },
        ],
      },
      {
        id: 'running-progression',
        title: 'Running progression',
        blocks: [
          {
            type: 'p',
            text: "Most of your running should be easy, at a pace where you could speak in full sentences. Easy miles build the base. One faster session a week from week 3 teaches you test pace. If a week feels too hard, repeat it before moving on.",
          },
          {
            type: 'table',
            head: ['Week', 'Easy runs (Mon, Thu)', 'Speed day (Tue)', 'Long run (Sat)'],
            rows: [
              ['1', '20 min: run 2 min, walk 1 min', 'Easy 20 min run/walk', '25 min run/walk'],
              ['2', '20 min: run 3 min, walk 1 min', 'Easy 20 min run/walk', '30 min run/walk'],
              ['3', '20 min continuous', '6 x 1 min brisk, 2 min walk between', '30 min'],
              ['4', '25 min', '6 x 400 m at goal test pace, 2 min rest', '35 min'],
              ['5', '25 min', '4 x 800 m at goal test pace, 3 min rest', '40 min'],
              ['6', '30 min', '20 min steady, comfortably hard', '45 min'],
              ['7', '30 min', '5 x 800 m at goal test pace, 2 min 30 s rest', '45 to 50 min'],
              ['8', '20 min', 'Time trial at your test distance', '30 min easy'],
            ],
            caption: '8-week running progression',
          },
          {
            type: 'p',
            text: "For a full interval and tempo plan built around one test distance, use the [2-mile run training plan](/training/2-mile-run-training-plan/). It also covers how to adapt for 1.5 and 3 miles.",
          },
        ],
      },
      {
        id: 'calisthenics-progression',
        title: 'Calisthenics progression',
        blocks: [
          {
            type: 'p',
            text: "Test your maximum once in week 1: push-ups in good form, pull-ups from a dead hang, and one plank hold. Then train below that limit. Sets at about half your maximum, repeated often, add reps faster than going to failure every session.",
          },
          {
            type: 'list',
            items: [
              "**Push-ups:** 5 sets at half your max, 60 to 90 seconds rest, three days a week. Add one rep per set each week. Army, Air Force and Space Force recruits should practice the [hand-release push-up](/training/hand-release-push-ups/).",
              "**Pull-ups:** if you have none, do 5 slow negatives and 3 dead hangs of 20 seconds, three days a week. If you have some, follow [how to do more pull-ups](/training/how-to-do-more-pull-ups/).",
              "**Plank:** 4 holds at half your max, twice a week, building as shown in the [plank training guide](/training/plank-training/).",
              "**Legs:** 3 x 15 bodyweight squats, 3 x 10 lunges per leg and 3 x 15 calf raises on Wednesday.",
              "**Core:** 3 x 10 dead bugs per side and 3 x 20 flutter kicks after each easy run.",
            ],
          },
          {
            type: 'p',
            text: "Retest in week 4 and week 8, and reset your working sets from the new numbers. Do not test more often than that.",
          },
        ],
      },
      {
        id: 'rucking-and-time-on-feet',
        title: 'Rucking and time on feet',
        blocks: [
          {
            type: 'p',
            text: "Recruit training means long days standing, marching and carrying gear. Hours on your feet matter as much as gym fitness. A loaded walk every second Saturday prepares your feet, hips and shoulders without the impact of extra running.",
          },
          {
            type: 'list',
            items: [
              "Start with 10 to 15 lb in a snug backpack for 2 miles at a brisk walk.",
              "Add either a mile or 5 lb each time, never both.",
              "Cap it at about 4 miles and 25 lb before you ship. You will build the rest there.",
              "Walk, do not run, under load.",
              "On weekdays, stand and walk more: take stairs, walk 30 minutes on rest days.",
            ],
          },
          {
            type: 'p',
            text: "If load carriage is a large part of your pipeline, the [ruck march training plan](/training/ruck-march-training-plan/) has a longer progression.",
          },
        ],
      },
      {
        id: 'swimming-for-navy-and-coast-guard',
        title: 'Swimming for Navy and Coast Guard',
        blocks: [
          {
            type: 'p',
            text: "Navy and Coast Guard recruit training both include swim qualification. The requirements are set by each service, so ask your recruiter for the current ones. Other pipelines may include water training too. If you are not comfortable in deep water, fix that before you ship, because it is much harder to learn under time pressure.",
          },
          {
            type: 'list',
            items: [
              "Swim twice a week for 20 to 30 minutes in place of one easy run.",
              "Practice jumping in feet first, surfacing calmly and floating on your back.",
              "Build to treading water for 5 minutes without touching the wall.",
              "Build to 50 yards of continuous swimming with any stroke, then 100.",
              "If you cannot swim, take lessons now. Always swim where a lifeguard is on duty.",
            ],
          },
        ],
      },
      {
        id: 'common-mistakes',
        title: 'Common mistakes',
        blocks: [
          {
            type: 'list',
            items: [
              "**Starting too hard.** Doubling your running in week 1 is the usual way people get hurt before they ship. Increase weekly running time by about 10 percent.",
              "**Maxing out every day.** Test every four weeks. Train below your limit in between.",
              "**Skipping rest days.** Fitness is built while you recover. Keep both rest days.",
              "**Training only the fun events.** Put your weakest event first in the session, when you are fresh.",
              "**Sloppy reps.** Practice to the form your branch tests. Reps that would not count on the test do not count in training.",
              "**Arriving exhausted.** Cut volume by half in the final week and sleep.",
            ],
          },
          {
            type: 'note',
            text: "This is general training information, not medical advice. If you have a health condition or have been inactive, talk to a doctor before starting. Stop and get checked for sharp pain or pain that does not go away.",
          },
        ],
      },
    ],
    faq: [
      {
        q: 'How fit do I need to be before boot camp?',
        a: "Fit enough to meet your branch's entry requirements with room to spare, and to train every day without breaking down. As a personal training target, not an official standard, aim to run for 30 minutes without stopping and to do several sets of push-ups and planks in good form. Check the current requirements with your recruiter and in the [fitness test guides](/fitness-tests/).",
      },
      {
        q: 'How many push-ups should I be able to do?',
        a: "The required number depends on your branch, age and sex, and it changes, so read the guide for your test. A sensible training target is to be comfortably above your branch's minimum, in strict form, when you are already tired. Being able to do 5 sets of 15 to 20 clean push-ups with a minute of rest is a solid place to arrive.",
      },
      {
        q: 'How far should I be able to run?',
        a: "At least your test distance without stopping, at a controlled pace: 1.5 miles for Navy and Coast Guard, 2 miles for Army, Air Force and Space Force, 3 miles for the Marine Corps. A good training target is to run 30 to 45 minutes easy, which covers more than any of those distances.",
      },
      {
        q: 'Is 8 weeks enough?',
        a: "It is enough to build a base if you can already jog 10 minutes and train consistently. It is not enough to go from fully inactive to confident. If you are starting from zero, take 12 to 16 weeks and repeat the early weeks.",
      },
      {
        q: 'Should I train in boots?',
        a: "Run in running shoes. If you own boots, walking and rucking in them once a week helps your feet adapt, but there is no need to buy a pair for this. You will be issued boots at recruit training, so the goal now is tougher feet and stronger legs, not matching the gear.",
      },
    ],
    sources: [],
    related: [
      'training/2-mile-run-training-plan',
      'training/how-to-do-more-pull-ups',
      'training/ruck-march-training-plan',
      'fitness-tests/army-aft',
    ],
  },
  {
    slug: 'ruck-march-training-plan',
    kind: 'training',
    name: 'Ruck march plan',
    metaTitle: 'Ruck March Training Plan: Build to 12 Miles Week by Week',
    description:
      'How to train for a ruck march: starting weight, pace, weekly progression to 12 miles, foot care, and the strength work that keeps you moving.',
    h1: 'Ruck march training plan',
    lede: "Rucking is walking fast with a loaded pack. It rewards patience: build distance and weight slowly, look after your feet, and the miles come.",
    summary: 'A 12-week progression from 3 miles to 12, with pace, packing, foot care and strength work.',
    verified: '2026-11-17',
    facts: [
      { label: 'Plan length', value: '12 weeks' },
      { label: 'Rucks per week', value: '1 to 2' },
      { label: 'Starting load', value: 'About 10 to 15% of bodyweight' },
      { label: 'Training pace', value: '15 to 17 min per mile' },
    ],
    sections: [
      {
        id: 'what-a-ruck-standard-looks-like',
        title: 'What a ruck standard looks like',
        blocks: [
          {
            type: 'p',
            text: "There is no single military ruck standard. Distance, load, time limit, terrain and what counts toward the pack weight are set by the unit, school or course you are attending, and they change. A timed march of several miles under a set load is a common format, and 12 miles is a distance many soldiers and Marines train toward.",
          },
          {
            type: 'p',
            text: "Get the actual standard in writing from your unit or the course's published guidance before you plan. Ask four things: the distance, the time limit, the pack weight, and whether that weight is measured dry, before water and food. Then set your training load and goal pace from those answers.",
          },
          {
            type: 'p',
            text: "Rucking is separate from your branch's fitness test. For those events, see the [fitness test guides](/fitness-tests/).",
          },
        ],
      },
      {
        id: 'starting-weight-and-pace',
        title: 'Starting weight and pace',
        blocks: [
          {
            type: 'p',
            text: "Start lighter than you think you need. A pack at about 10 to 15 percent of your bodyweight is enough for the first weeks. For many people that is 15 to 25 lb. Your joints, feet and shoulders adapt more slowly than your lungs, so the load should feel easy at first.",
          },
          {
            type: 'list',
            items: [
              "**Pace:** walk at 15 to 17 minutes per mile. A 15-minute mile is a common training benchmark and is a fast walk, not a stroll.",
              "**Stride:** shorter and quicker, not longer. Overstriding under load is hard on shins and hips.",
              "**Posture:** tall chest, slight forward lean from the ankles, arms swinging.",
              "**Surface:** start on flat, even ground. Add hills and trails after week 4.",
            ],
          },
          {
            type: 'p',
            text: "Time every ruck and note the load. Pace per mile at a known weight is the number that tells you whether you are improving. You can log each ruck in Gruntz alongside your other sessions.",
          },
        ],
      },
      {
        id: 'week-by-week-progression',
        title: 'Week-by-week progression',
        blocks: [
          {
            type: 'p',
            text: "The plan changes one thing at a time: distance or load, never both in the same week. Every fourth week is lighter so your body can catch up. The loads below are examples that finish at 35 lb. If your standard uses a different weight, scale the column so the final three weeks are at your required load.",
          },
          {
            type: 'table',
            head: ['Week', 'Long ruck', 'Load', 'Short ruck (optional)'],
            rows: [
              ['1', '3 miles', '20 lb', '2 miles at 20 lb'],
              ['2', '4 miles', '20 lb', '2 miles at 20 lb'],
              ['3', '4 miles', '25 lb', '3 miles at 20 lb'],
              ['4', '3 miles (lighter week)', '25 lb', 'None'],
              ['5', '5 miles', '25 lb', '3 miles at 25 lb'],
              ['6', '6 miles', '25 lb', '3 miles at 30 lb'],
              ['7', '6 miles', '30 lb', '3 miles at 30 lb'],
              ['8', '4 miles (lighter week)', '30 lb', 'None'],
              ['9', '8 miles', '30 lb', '3 miles at 35 lb'],
              ['10', '8 miles', '35 lb', '4 miles at 35 lb'],
              ['11', '10 miles', '35 lb', '3 miles at 35 lb'],
              ['12', '12 miles', '35 lb', 'None. Walk 2 miles unloaded early in the week'],
            ],
            caption: '12-week build to 12 miles. Example loads, adjust to your standard',
          },
          {
            type: 'p',
            text: "If you miss the pace or finish a week with sore joints rather than tired muscles, repeat that week. If your event is on a fixed date, count back from it and leave 7 to 10 days between your last long ruck and the event.",
          },
        ],
      },
      {
        id: 'how-often-to-ruck',
        title: 'How often to ruck',
        blocks: [
          {
            type: 'p',
            text: "One long ruck a week is the core of the plan. A second, shorter ruck helps once the first month is behind you. More than two loaded sessions a week adds wear faster than it adds fitness for most people.",
          },
          {
            type: 'list',
            items: [
              "**Long ruck:** once a week, with a rest day before and after.",
              "**Short ruck:** once a week, at least two days away from the long one.",
              "**Running:** two or three easy runs of 20 to 40 minutes without a pack. Running fitness carries over to ruck pace. The [2-mile run training plan](/training/2-mile-run-training-plan/) covers the faster work.",
              "**Strength:** two sessions a week, described below.",
              "**Rest:** at least one day with no training at all.",
            ],
          },
        ],
      },
      {
        id: 'packing-and-fit',
        title: 'Packing and fit',
        blocks: [
          {
            type: 'p',
            text: "A badly packed ruck feels heavier than it is. The aim is a load that sits high, close to your spine and does not move.",
          },
          {
            type: 'list',
            items: [
              "Put the heaviest items high and against the frame, between your shoulder blades.",
              "Fill empty space with soft items so nothing shifts or bounces.",
              "Tighten the shoulder straps until the pack rides high on your back, not on your lower back.",
              "Use the sternum strap. Use the hip belt if your standard allows it, to move weight to your hips.",
              "Weigh the packed ruck on a scale. Guessing leads to training too light or too heavy.",
              "Carry water on top of the required weight unless you are told otherwise.",
            ],
            ordered: false,
          },
          {
            type: 'p',
            text: "Train with the pack and boots you will use for the event once you are past the first few weeks. Small problems such as a strap that rubs show up at mile 6, not mile 2.",
          },
        ],
      },
      {
        id: 'foot-care',
        title: 'Foot care',
        blocks: [
          {
            type: 'p',
            text: "Feet end more rucks than fitness does. Most blisters come from moisture, friction and boots that have not been broken in.",
          },
          {
            type: 'list',
            items: [
              "Break boots in with 20 or more miles of walking before a long ruck.",
              "Wear wool-blend or synthetic socks, not cotton. Many people add a thin liner sock underneath.",
              "Keep toenails trimmed short and straight.",
              "Lace boots snugly over the instep so your heel does not slide.",
              "Stop at the first hot spot and tape or cover it. Waiting turns it into a blister.",
              "Carry dry socks on rucks of 8 miles or more and change at the halfway point.",
              "After each ruck, wash and dry your feet and let boots air out.",
            ],
          },
        ],
      },
      {
        id: 'strength-work',
        title: 'Strength work',
        blocks: [
          {
            type: 'p',
            text: "Stronger legs, hips and trunk make a given load a smaller share of what you can handle. Two sessions a week of 30 to 40 minutes is enough. Pick weights that leave two reps in reserve, and add load in small steps.",
          },
          {
            type: 'table',
            head: ['Exercise', 'Sets x reps', 'Why'],
            rows: [
              ['Goblet or back squat', '3 x 8', 'Leg strength for hills and long miles'],
              ['Romanian deadlift', '3 x 8', 'Hamstrings, glutes and lower back'],
              ['Step-ups', '3 x 10 per leg', 'Single-leg strength for climbs'],
              ['Walking lunges', '3 x 10 per leg', 'Hips and balance'],
              ['Calf raises', '3 x 15', 'Calves and ankles'],
              ['Rows or pull-ups', '3 x 8', 'Upper back to hold the pack'],
              ['Suitcase carry', '3 x 40 m per side', 'Trunk stiffness under load'],
              ['Plank', '3 holds', 'Core endurance'],
            ],
            caption: 'Strength session, twice a week',
          },
          {
            type: 'p',
            text: "For the plank holds, use the progression in the [plank training guide](/training/plank-training/). For upper-back work, see [how to do more pull-ups](/training/how-to-do-more-pull-ups/).",
          },
          {
            type: 'note',
            text: "This is general training information, not medical advice. Load carriage is demanding on feet, knees, hips and back. Stop and get checked for sharp pain, numbness or pain that does not go away with rest.",
          },
        ],
      },
    ],
    faq: [
      {
        q: 'How much weight should a beginner ruck?',
        a: "About 10 to 15 percent of your bodyweight, which for many people is 15 to 25 lb. Walk 2 to 3 miles with it and see how your feet and shoulders feel the next day. Add 5 lb at a time, and only in weeks where the distance stays the same.",
      },
      {
        q: 'What is a good 12-mile ruck time?',
        a: "It depends on the load and the standard you are training for, which your unit or school sets. A common training benchmark is a 15-minute mile, which works out to 3 hours for 12 miles. Treat that as a pace to train toward, and confirm the actual time and weight you will be held to.",
      },
      {
        q: 'How often should I ruck?',
        a: "Once or twice a week. One long ruck builds the distance and an optional short ruck keeps the skill. Fill the other days with easy running, strength work and rest.",
      },
      {
        q: 'Should I run with a ruck?',
        a: "Not as a training habit. Running under load multiplies the impact on your knees, shins and back. Build speed by walking faster and by running without a pack. If your event rewards a shuffle on flats and downhills, practice it in short stretches late in the plan, not every week.",
      },
      {
        q: 'How do I avoid blisters?',
        a: "Keep feet dry, reduce friction and deal with hot spots early. That means broken-in boots that fit, non-cotton socks, a sock change on long rucks and tape on any spot that starts to rub. Building distance gradually also lets the skin toughen.",
      },
    ],
    sources: [],
    related: [
      'training/boot-camp-workout-plan',
      'training/2-mile-run-training-plan',
      'training/plank-training',
      'fitness-tests/marine-corps-cft',
    ],
  },
  {
    slug: 'how-to-do-more-pull-ups',
    kind: 'training',
    name: 'More pull-ups',
    metaTitle: 'How to Do More Pull-Ups: From Zero to 20 for the PFT',
    description:
      'A pull-up progression for Marine PFT prep and beyond: getting your first rep, building volume, and the weekly structure that adds reps.',
    h1: 'How to do more pull-ups',
    lede: "Pull-ups respond to frequent, clean practice below your limit. This guide covers the first rep, the climb to 10, the push to 20 and a weekly template for each stage.",
    summary: 'A staged pull-up progression from zero to 20, with weekly templates for each level.',
    verified: '2026-11-17',
    facts: [
      { label: 'Sessions per week', value: '3' },
      { label: 'Working sets', value: 'About half your max' },
      { label: 'Retest', value: 'Every 3 to 4 weeks' },
      { label: 'Equipment', value: 'Pull-up bar, optional band' },
    ],
    sections: [
      {
        id: 'pull-ups-on-the-marine-pft',
        title: 'Pull-ups on the Marine PFT',
        blocks: [
          {
            type: 'p',
            text: "The Marine Corps PFT has three events: pull-ups or push-ups, a plank and a 3-mile run. Pull-ups are the upper-body event most Marines train for. How many points each rep is worth depends on your age and sex, and the tables are revised from time to time.",
          },
          {
            type: 'p',
            text: "For current scoring and the form rules, read the [Marine Corps PFT guide](/fitness-tests/marine-corps-pft/). For the other two events, see the [plank training guide](/training/plank-training/) and the [2-mile run training plan](/training/2-mile-run-training-plan/), which explains how to adapt the plan for 3 miles.",
          },
        ],
      },
      {
        id: 'getting-your-first-pull-up',
        title: 'Getting your first pull-up',
        blocks: [
          {
            type: 'p',
            text: "If you cannot do one yet, train the pieces: hanging, pulling your shoulder blades down, and lowering under control. Lowering is the fastest route, because you are stronger on the way down than on the way up.",
          },
          {
            type: 'list',
            items: [
              "**Dead hang:** 3 holds of 20 to 30 seconds. Builds grip and shoulder tolerance.",
              "**Scapular pulls:** from a hang, pull your shoulders down and back without bending your elbows. 3 x 8.",
              "**Negatives:** step or jump to the top with your chin over the bar, then lower for 5 seconds. 5 single reps, 60 seconds rest.",
              "**Band-assisted pull-ups:** 4 x 5 with a band that makes the fifth rep hard but clean.",
              "**Inverted rows:** 3 x 8 under a low bar, body straight.",
            ],
          },
          {
            type: 'p',
            text: "Train three days a week with a day off between. Try one unassisted pull-up at the start of each week, when you are fresh. When your negatives last 8 to 10 seconds, the first rep is usually close.",
          },
        ],
      },
      {
        id: 'from-1-to-10',
        title: 'From 1 to 10',
        blocks: [
          {
            type: 'p',
            text: "At this stage the goal is more total reps per week, all of them clean. Going to failure limits you to a handful of reps per session. Sets at about half your max let you do far more.",
          },
          {
            type: 'list',
            items: [
              "**Half-max sets:** if your max is 4, do sets of 2. Aim for 8 to 10 sets with 90 seconds rest.",
              "**Ladders:** 1 rep, rest, 2 reps, rest, 3 reps, rest. Repeat the ladder 2 or 3 times. Stop a ladder one rung before you would fail.",
              "**Spread practice:** if you have a bar at home, do one set at half your max several times through the day, with at least an hour between sets.",
              "**One max set a week:** on the last session of the week, do a single all-out set to see where you are.",
            ],
          },
          {
            type: 'p',
            text: "Add about 10 percent to your weekly total each week for three weeks, then take a lighter week at roughly two thirds of the volume. Retest after the lighter week and reset your set size.",
          },
        ],
      },
      {
        id: 'from-10-to-20',
        title: 'From 10 to 20',
        blocks: [
          {
            type: 'p',
            text: "Past 10 reps, progress slows and volume alone stops working. You need three kinds of sessions: one for strength, one for volume and one for the max set itself.",
          },
          {
            type: 'list',
            items: [
              "**Weighted pull-ups:** 4 x 5 with 10 to 25 lb in a pack or on a belt. Extra strength makes bodyweight reps a smaller effort. Add 2.5 to 5 lb when all four sets are clean.",
              "**Density work:** one set at 40 percent of your max every minute for 10 minutes. With a max of 12, that is sets of 5, or 50 reps in 10 minutes.",
              "**Pyramids:** 1-2-3-4-5-4-3-2-1 with rest equal to the time the set took. Add a rung when you finish it cleanly.",
              "**Max sets:** two all-out sets, 5 minutes apart, once a week.",
            ],
          },
          {
            type: 'p',
            text: "Bodyweight matters here. Every pound you carry is a pound you lift on each rep, so a steady, healthy bodyweight helps as much as any program.",
          },
        ],
      },
      {
        id: 'weekly-templates',
        title: 'Weekly templates',
        blocks: [
          {
            type: 'p',
            text: "Pick the row that matches your current max. Train on three non-consecutive days, for example Monday, Wednesday and Friday. Stay on a row until your retest moves you to the next one.",
          },
          {
            type: 'table',
            head: ['Current max', 'Day 1', 'Day 2', 'Day 3'],
            rows: [
              [
                '0',
                'Negatives 5 x 1 (5 s lower), dead hang 3 x 20 s',
                'Band-assisted 4 x 5, inverted rows 3 x 8',
                'Negatives 6 x 1, scapular pulls 3 x 8',
              ],
              [
                '1 to 5',
                '8 to 10 sets at half max, 90 s rest',
                'Ladders of 1-2-3, or singles if your max is under 3',
                'One max set, 3 negatives, inverted rows 3 x 10',
              ],
              [
                '6 to 12',
                '5 sets at 60% of max, 2 min rest',
                'Pyramid 1-2-3-4-3-2-1',
                'One max set, rest 5 min, 3 sets at half max',
              ],
              [
                '13 or more',
                'Weighted 4 x 5, 3 min rest',
                '40% of max every minute for 10 min',
                'Two max sets 5 min apart, then 2 sets at half max',
              ],
            ],
            caption: 'Three sessions a week by level',
          },
          {
            type: 'p',
            text: "Log each session's sets and your weekly max set. You can record them in Gruntz and track the pull-up event with your other PFT results.",
          },
        ],
      },
      {
        id: 'mistakes',
        title: 'Mistakes',
        blocks: [
          {
            type: 'list',
            items: [
              "**Training to failure every session.** It caps your volume and leaves your elbows sore. Save all-out sets for once a week.",
              "**Half reps.** Start each rep from straight arms and finish with your chin clearly over the bar. Partial reps in training become uncounted reps on a test.",
              "**Kipping and swinging.** Momentum hides weakness. Pause for a moment at the bottom of each rep.",
              "**No rest days.** Tendons adapt more slowly than muscle. Three or four sessions a week is plenty.",
              "**Adding too much too fast.** Doubling volume in a week is a common cause of elbow and shoulder pain. Increase by about 10 percent.",
              "**Ignoring the rest of the back.** Rows, hangs and scapular pulls support the pull-up. Keep them in.",
            ],
          },
          {
            type: 'note',
            text: "This is general training information, not medical advice. Stop and get checked for sharp pain or for elbow or shoulder pain that persists between sessions.",
          },
        ],
      },
      {
        id: 'grip-and-bar-notes',
        title: 'Grip and bar notes',
        blocks: [
          {
            type: 'p',
            text: "Small details of grip and setup change how many reps you get.",
          },
          {
            type: 'list',
            items: [
              "**Grip width:** hands just outside shoulder width suits most people. Very wide grips shorten the range and stress the shoulders.",
              "**Overhand or underhand:** train the grip you will test with most of the time, and use the other for variety.",
              "**Thumbs:** wrapping your thumb around the bar gives a more secure hold as you tire.",
              "**Bar thickness:** a thicker bar is harder to hold. If your test bar is thick, practice on one.",
              "**Chalk and calluses:** chalk helps on a slick bar where it is allowed. File calluses flat so they do not tear.",
              "**Grip endurance:** finish two sessions a week with one long dead hang, building toward 60 seconds.",
            ],
          },
        ],
      },
    ],
    faq: [
      {
        q: 'How long does it take to get to 20 pull-ups?',
        a: "It varies a lot with starting point, bodyweight and consistency. Many people who can already do 8 to 10 need several months of steady training to reach 20, and from zero it often takes most of a year. Gains come quickly at first and slow down as the number climbs, so judge progress over months, not weeks.",
      },
      {
        q: 'How often should I train pull-ups?',
        a: "Three sessions a week on non-consecutive days works for most people. Short sub-maximal sets on other days are fine if your elbows and shoulders feel good. If they ache, drop back to three.",
      },
      {
        q: 'Do chin-ups count on the PFT?',
        a: "Grip rules are set in the current Marine Corps order and can change, so check it or ask your unit before you rely on one grip. The [Marine Corps PFT guide](/fitness-tests/marine-corps-pft/) links to the official reference. In training, practice the grip you plan to use on test day.",
      },
      {
        q: 'Why am I stuck at the same number?',
        a: "The usual causes are too little weekly volume, going to failure too often, or not enough recovery. Change one thing: add sets at half your max, switch one day to weighted reps, or take a lighter week and retest. Check your bodyweight trend as well.",
      },
      {
        q: 'Do assisted machines help?',
        a: "They help you practice the movement, but they stabilize your body for you, so the carryover is limited. Negatives and band-assisted reps on a real bar transfer better. Use the machine if it is what you have, and add hangs and negatives beside it.",
      },
    ],
    sources: [],
    related: [
      'fitness-tests/marine-corps-pft',
      'training/plank-training',
      'training/boot-camp-workout-plan',
      'training/hand-release-push-ups',
    ],
  },
  {
    slug: '2-mile-run-training-plan',
    kind: 'training',
    name: '2-mile run plan',
    metaTitle: '2-Mile Run Training Plan: Get Faster for Your PT Test',
    description:
      'Intervals, tempo runs and easy miles laid out week by week to cut your 2-mile time for the Army AFT, Air Force PFRA or Space Force HPA.',
    h1: '2-mile run training plan',
    lede: "A faster 2-mile comes from three things done every week: intervals at goal pace, one sustained tempo effort and enough easy running to support both.",
    summary: 'An 8-week interval, tempo and easy-run plan with a goal-pace table for the 2-mile test run.',
    verified: '2026-11-17',
    facts: [
      { label: 'Plan length', value: '8 weeks' },
      { label: 'Runs per week', value: '4' },
      { label: 'Hard sessions', value: '2 per week' },
      { label: 'On a 400 m track', value: '8 laps plus about 19 m' },
    ],
    sections: [
      {
        id: 'which-tests-use-2-miles',
        title: 'Which tests use 2 miles',
        blocks: [
          {
            type: 'p',
            text: "Three services test at 2 miles. The others use a different distance, and the same training works with small changes.",
          },
          {
            type: 'list',
            items: [
              "**Army:** the [Army AFT](/fitness-tests/army-aft/) ends with a 2-mile run.",
              "**Air Force:** the [Air Force PFRA](/fitness-tests/air-force-pfra/) cardio component is a 2-mile run or the 20 m HAMR shuttle.",
              "**Space Force:** the [Space Force HPA](/fitness-tests/space-force-hpa/) cardio component is a 2-mile run or the 20 m HAMR shuttle.",
              "**Navy and Coast Guard:** the [Navy PRT](/fitness-tests/navy-prt/) and [Coast Guard PFT](/fitness-tests/coast-guard-pft/) use 1.5 miles.",
              "**Marine Corps:** the [Marine Corps PFT](/fitness-tests/marine-corps-pft/) uses 3 miles.",
            ],
          },
          {
            type: 'p',
            text: "Time standards and points depend on age and sex and are revised, so take your target time from the guide for your test, not from memory.",
          },
        ],
      },
      {
        id: 'find-your-goal-pace',
        title: 'Find your goal pace',
        blocks: [
          {
            type: 'p',
            text: "Run a 2-mile time trial on a track or a flat measured route, rested and warmed up. That is your current time. For this 8-week block, set a goal a little faster than that, not the time you wish you had. A goal 30 to 60 seconds faster is realistic for many runners. Retest and reset after the block.",
          },
          {
            type: 'table',
            head: ['2-mile goal', 'Per mile', 'Per 800 m', 'Per 400 m'],
            rows: [
              ['20:00', '10:00', '4:58', '2:29'],
              ['19:00', '9:30', '4:43', '2:22'],
              ['18:00', '9:00', '4:28', '2:14'],
              ['17:00', '8:30', '4:14', '2:07'],
              ['16:00', '8:00', '3:59', '1:59'],
              ['15:00', '7:30', '3:44', '1:52'],
              ['14:00', '7:00', '3:29', '1:44'],
              ['13:00', '6:30', '3:14', '1:37'],
              ['12:00', '6:00', '2:59', '1:29'],
            ],
            caption: 'Goal pace splits, rounded to the nearest second',
          },
          {
            type: 'p',
            text: "Two miles is 3,219 m, which is 8 laps of a 400 m track plus about 19 m. The lap splits above account for that, so they are slightly quicker than dividing your goal time by eight.",
          },
        ],
      },
      {
        id: 'the-three-run-types',
        title: 'The three run types',
        blocks: [
          {
            type: 'list',
            items: [
              "**Intervals:** repeats of 400 m to 1 mile at goal pace with rest between. They teach your legs and lungs exactly what test pace feels like. Hit the split, not faster.",
              "**Tempo:** 15 to 20 minutes at a comfortably hard effort, about 30 to 45 seconds per mile slower than goal pace. You can say a few words but not hold a conversation. Tempo runs raise the pace you can hold before fatigue builds.",
              "**Easy runs:** 20 to 45 minutes at a pace where you can talk in full sentences. They build the aerobic base that the hard days depend on. Most runners do these too fast.",
            ],
          },
          {
            type: 'p',
            text: "Before either hard session, jog 10 minutes and do four 20-second pickups. Afterward, jog or walk 5 to 10 minutes.",
          },
        ],
      },
      {
        id: '8-week-plan',
        title: '8-week plan',
        blocks: [
          {
            type: 'p',
            text: "Four runs a week: intervals on Tuesday, an easy 20 to 30 minutes on Wednesday or Thursday, tempo on Friday and a long easy run on Sunday. Keep a rest day or an easy day between hard sessions. If you currently run fewer than three days a week, spend three or four weeks on easy running first.",
          },
          {
            type: 'table',
            head: ['Week', 'Interval day', 'Tempo day', 'Long easy run'],
            rows: [
              ['1', '6 x 400 m at goal pace, 90 s rest', '2 x 8 min, 2 min jog between', '30 min'],
              ['2', '8 x 400 m at goal pace, 90 s rest', '15 min continuous', '35 min'],
              ['3', '4 x 800 m at goal pace, 2 min 30 s rest', '2 x 10 min, 2 min jog between', '40 min'],
              ['4', '2-mile time trial (replaces intervals)', '15 min, relaxed', '30 min'],
              ['5', '5 x 800 m at goal pace, 2 min rest', '20 min continuous', '40 min'],
              ['6', '3 x 1,200 m at goal pace, 3 min rest', '20 min continuous', '45 min'],
              ['7', '2 x 1 mile at goal pace, 4 min rest', '15 min continuous', '40 min'],
              ['8', '4 x 400 m at goal pace, full recovery', 'None', 'Test day'],
            ],
            caption: '8-week 2-mile plan. Add one easy run of 20 to 30 minutes each week',
          },
          {
            type: 'p',
            text: "After the week 4 time trial, reset your goal pace if you ran faster than expected. If you cannot hold goal pace through a session, the goal is too ambitious for now. Slow the splits by 2 to 3 seconds per lap and finish the workout. You can log each run and your time trials in Gruntz to see the trend.",
          },
        ],
      },
      {
        id: 'test-week-taper-and-pacing',
        title: 'Test-week taper and pacing',
        blocks: [
          {
            type: 'p',
            text: "In the final week, keep the pace and cut the amount. Do the short 400 m session four or five days out, run easy for 20 minutes two days out, and rest or walk the day before.",
          },
          {
            type: 'list',
            ordered: true,
            items: [
              "Warm up with 5 to 10 minutes of easy jogging and a few short pickups if the test format allows it.",
              "Run the first lap at goal pace, no more than 2 or 3 seconds fast. Going out hard is the most common reason for a slow finish.",
              "Hold even splits through laps 2 to 5. Check your watch at each lap.",
              "Laps 5 and 6 are where pace slips. Focus on quick, relaxed steps and steady breathing.",
              "Push the final 600 m and run all the way through the line.",
            ],
          },
          {
            type: 'p',
            text: "If your run follows other events, as it does on the Army AFT, practice running on tired legs at least twice. Do your interval session after a short strength circuit.",
          },
        ],
      },
      {
        id: 'adapting-for-1-5-and-3-miles',
        title: 'Adapting for 1.5 and 3 miles',
        blocks: [
          {
            type: 'p',
            text: "The structure stays the same. Change the goal pace, the length of the repeats and the long run.",
          },
          {
            type: 'list',
            items: [
              "**1.5 miles (Navy, Coast Guard):** run the same 400 m and 800 m sessions at your 1.5-mile goal pace, which will be a few seconds per lap faster. Replace the 2 x 1 mile session with 3 x 1,000 m. A long run of 30 to 40 minutes is enough. On a 400 m track, 1.5 miles is 6 laps plus about 14 m.",
              "**3 miles (Marine Corps):** you need more volume. Build the long run to 50 to 60 minutes, extend tempo runs to 20 to 25 minutes and favor longer repeats such as 5 x 1,000 m and 3 x 1 mile at 3-mile goal pace.",
              "**20 m HAMR shuttle:** keep the easy and tempo running, and swap one interval day for shuttle practice on a marked 20 m course so you learn the turns. Use the [Air Force PFRA guide](/fitness-tests/air-force-pfra/) for the protocol.",
            ],
          },
          {
            type: 'p',
            text: "New to running, or getting ready to ship? Start with the gentler build in the [boot camp workout plan](/training/boot-camp-workout-plan/).",
          },
          {
            type: 'note',
            text: "This is general training information, not medical advice. Increase running gradually, keep your rest days, and stop and get checked for sharp pain, chest pain, dizziness or pain that does not settle.",
          },
        ],
      },
    ],
    faq: [
      {
        q: 'How fast can I improve my 2-mile time?',
        a: "It depends on your starting point. Newer runners often see large changes in a first 8-week block, simply from running consistently. Trained runners improve in smaller steps. Set a modest goal for one block, retest and repeat. No plan can promise a specific time.",
      },
      {
        q: 'How many days a week should I run?',
        a: "Four works well for most people: two hard sessions and two easy runs. Three is enough if you keep the interval day, the tempo day and one long easy run. More than five adds little for a 2-mile test unless you already have years of running behind you.",
      },
      {
        q: 'What pace should my intervals be?',
        a: "Your goal 2-mile pace, using the split table above. Running intervals much faster than goal pace turns the session into a sprint workout and makes it harder to recover for the tempo day. The last repeat should be hard but still on pace.",
      },
      {
        q: 'Should I run more than 2 miles in training?',
        a: "Yes. A weekly long run of 30 to 45 minutes and easy runs of 20 to 30 minutes build the aerobic base that makes 2 miles feel shorter. Most of your weekly distance should be easy running.",
      },
      {
        q: 'How do I pace test day?',
        a: "Aim for even splits. Know your goal time per lap or per mile, run the first lap on that pace and resist the fast start. Hold steady through the middle, then push the last 600 m.",
      },
    ],
    sources: [],
    related: [
      'fitness-tests/army-aft',
      'fitness-tests/air-force-pfra',
      'fitness-tests/space-force-hpa',
      'training/boot-camp-workout-plan',
    ],
  },
  {
    slug: 'plank-training',
    kind: 'training',
    name: 'Plank training',
    metaTitle: 'How to Hold a Plank Longer: Training for Your PT Test',
    description:
      'The plank is on the Army, Marine Corps, Navy and Coast Guard tests. Form standards, common faults and a progression to add time.',
    h1: 'How to hold a plank longer',
    lede: "A long plank is trained, not gutted out. Practice strict form in repeated holds below your limit, add time gradually, and strengthen the muscles that give out first.",
    summary: 'Test-standard plank form, the reasons holds fail, and an 8-week progression to add time.',
    verified: '2026-11-17',
    facts: [
      { label: 'Plan length', value: '8 weeks' },
      { label: 'Sessions per week', value: '3' },
      { label: 'Working holds', value: '50 to 90% of your max' },
      { label: 'Used by', value: 'Required on 4 tests, optional on 2' },
    ],
    sections: [
      {
        id: 'which-tests-use-the-plank',
        title: 'Which tests use the plank',
        blocks: [
          {
            type: 'p',
            text: "The forearm plank is now the core event on most U.S. military fitness tests.",
          },
          {
            type: 'list',
            items: [
              "**Required event:** the [Army AFT](/fitness-tests/army-aft/), [Marine Corps PFT](/fitness-tests/marine-corps-pft/), [Navy PRT](/fitness-tests/navy-prt/) and [Coast Guard PFT](/fitness-tests/coast-guard-pft/).",
              "**One of the core options:** the [Air Force PFRA](/fitness-tests/air-force-pfra/) and [Space Force HPA](/fitness-tests/space-force-hpa/) core component.",
            ],
          },
          {
            type: 'p',
            text: "Each service sets its own minimum and maximum times, and they vary by age and sex and change over time. Take your target from the guide for your test, then train to beat it with a margin.",
          },
        ],
      },
      {
        id: 'test-standard-form',
        title: 'Test-standard form',
        blocks: [
          {
            type: 'p',
            text: "The details differ slightly between services, and each service's guide defines the exact position, the faults and how many corrections you get. The general position is the same everywhere.",
          },
          {
            type: 'list',
            items: [
              "Forearms on the ground, elbows directly under your shoulders.",
              "Feet together or up to about hip width apart, weight on your toes.",
              "A straight line from head to shoulders to hips to heels.",
              "Hips level: not sagging toward the ground and not piked up.",
              "Head neutral, eyes on the ground between your hands.",
              "Knees straight and off the ground for the whole hold.",
            ],
          },
          {
            type: 'p',
            text: "Train in the strictest version of this position. Film a hold from the side once a week or have someone watch your hips. What feels straight often is not.",
          },
        ],
      },
      {
        id: 'why-planks-fail',
        title: 'Why planks fail',
        blocks: [
          {
            type: 'p',
            text: "Knowing what gives out first tells you what to train.",
          },
          {
            type: 'list',
            items: [
              "**Hips sag.** The abdominals tire and the lower back takes over. This is the most common fault and usually the one that ends a test.",
              "**Shoulders burn.** Holding your chest up off your forearms is shoulder work. If your shoulders fail before your trunk, you need more time in the position and more upper-body endurance.",
              "**Hips rise.** Piking takes load off the abdominals. It feels like relief and is called as a fault.",
              "**Breath holding.** Bracing without breathing spikes effort. You tire sooner and start to shake.",
              "**Loose glutes and legs.** Squeezing your glutes and thighs locks the hips in place and shares the load.",
              "**Clock watching.** Staring at the timer makes every second longer. Break the hold into chunks instead.",
            ],
          },
        ],
      },
      {
        id: 'progression-plan',
        title: 'Progression plan',
        blocks: [
          {
            type: 'p',
            text: "Start with a max hold in strict form and stop the clock at the first form break, not when you collapse. Call that time your max. Every working hold is a percentage of it. With a max of 2:00, 50 percent is 1:00 and 70 percent is 1:24. Train three days a week with a day between.",
          },
          {
            type: 'table',
            head: ['Week', 'Session A', 'Session B (hard-tension holds)', 'Session C'],
            rows: [
              ['1', '4 x 50% of max, 60 s rest', '6 x 20 s, 40 s rest', '3 x 60%, 90 s rest'],
              ['2', '5 x 50%, 60 s rest', '6 x 20 s, 40 s rest', '3 x 65%, 90 s rest'],
              ['3', '4 x 60%, 60 s rest', '8 x 20 s, 40 s rest', '3 x 70%, 2 min rest'],
              ['4', 'Retest max, then 2 x 50%', '6 x 20 s, 40 s rest', 'Rest'],
              ['5', '4 x 60% of new max, 60 s rest', '8 x 25 s, 35 s rest', '3 x 70%, 2 min rest'],
              ['6', '5 x 60%, 60 s rest', '8 x 25 s, 35 s rest', '2 x 80%, 3 min rest'],
              ['7', '3 x 70%, 90 s rest', '6 x 30 s, 30 s rest', '1 x 90%'],
              ['8', '2 x 50%, early in the week', 'None', 'Test or retest'],
            ],
            caption: '8-week plank progression. Percentages are of your most recent max hold',
          },
          {
            type: 'p',
            text: "In Session B, hold a normal plank but squeeze everything as hard as you can: fists, glutes, thighs, and pull your elbows toward your toes. Twenty seconds should feel long. These short, tense holds build the stiffness that keeps your hips from sagging late in a test.",
          },
          {
            type: 'p',
            text: "You can log your holds and retests in Gruntz and track the plank with your other test events.",
          },
        ],
      },
      {
        id: 'accessory-work',
        title: 'Accessory work',
        blocks: [
          {
            type: 'p',
            text: "Add two or three of these after your plank sets, twice a week. They train the same job from other angles and take about 10 minutes.",
          },
          {
            type: 'list',
            items: [
              "**Dead bug:** 3 x 8 per side, lower back pressed to the ground.",
              "**Side plank:** 3 x 30 seconds per side.",
              "**Hollow hold:** 3 x 20 to 30 seconds.",
              "**Body saw:** in a plank with feet on a towel or sliders, rock forward and back. 3 x 8.",
              "**Glute bridge:** 3 x 12, with a 2-second squeeze at the top.",
              "**Scapular push-ups:** 2 x 12, for the shoulders that hold you up.",
              "**Farmer carry:** 3 x 40 m with a weight in each hand.",
            ],
          },
          {
            type: 'p',
            text: "Push-up training also builds the shoulder endurance a long plank needs. See [hand-release push-ups](/training/hand-release-push-ups/), and for the pulling side, [how to do more pull-ups](/training/how-to-do-more-pull-ups/).",
          },
        ],
      },
      {
        id: 'test-day-tactics',
        title: 'Test-day tactics',
        blocks: [
          {
            type: 'list',
            ordered: true,
            items: [
              "Set your elbows under your shoulders before the clock starts. A stretched-out position is harder to hold.",
              "Squeeze your glutes and thighs from the first second, not when it starts to hurt.",
              "Breathe slowly and steadily behind the brace: in through the nose, out through the mouth.",
              "Break the hold into 30-second blocks and think only about the current one.",
              "If you get a correction, fix it at once. Do not argue with it in your head.",
              "When the shaking starts, re-squeeze your glutes and push your forearms into the ground. Shaking is not a fault.",
            ],
          },
          {
            type: 'p',
            text: "If the plank comes after other events on your test, practice it tired at least a few times: do a session after push-ups or a run.",
          },
          {
            type: 'note',
            text: "This is general training information, not medical advice. Stop and get checked for sharp pain, or for lower back or shoulder pain that persists after training.",
          },
        ],
      },
    ],
    faq: [
      {
        q: 'How long should I be able to hold a plank?',
        a: "It depends on your test. Minimum and maximum times vary by service, age and sex, and they are revised, so check the guide for your test: [Army AFT](/fitness-tests/army-aft/), [Marine Corps PFT](/fitness-tests/marine-corps-pft/), [Navy PRT](/fitness-tests/navy-prt/), [Coast Guard PFT](/fitness-tests/coast-guard-pft/), [Air Force PFRA](/fitness-tests/air-force-pfra/) or [Space Force HPA](/fitness-tests/space-force-hpa/). In training, aim to hold your target time with strict form and some margin.",
      },
      {
        q: 'How often should I train planks?',
        a: "Three sessions a week with a day between is enough for most people. Planks recover faster than heavy lifting, but daily max holds stall progress. Keep most holds below your limit and test every four weeks.",
      },
      {
        q: 'What ends a plank on a test?',
        a: "In general, the event ends when you can no longer hold the required position, for example when your knees, hips or anything other than forearms and toes touch the ground, or when you do not correct a fault after being warned. The exact faults and the number of warnings are defined by each service, so read your test's guide.",
      },
      {
        q: 'Is the plank easier than sit-ups?',
        a: "It is different. The plank is a sustained hold that tests endurance and position, while sit-ups are repeated movement that leans heavily on the hip flexors. Some people find the plank easier and some find it harder. Either way it responds well to a few weeks of structured practice.",
      },
    ],
    sources: [],
    related: [
      'fitness-tests/navy-prt',
      'fitness-tests/marine-corps-pft',
      'fitness-tests/army-aft',
      'training/hand-release-push-ups',
    ],
  },
  {
    slug: 'hand-release-push-ups',
    kind: 'training',
    name: 'Hand-release push-ups',
    metaTitle: 'Hand-Release Push-Ups: Form, Standards and Training',
    description:
      'How to do hand-release push-ups to test standard, the mistakes that cost reps, and a plan to raise your two-minute score.',
    h1: 'Hand-release push-ups: form and training',
    lede: "The hand-release push-up starts every rep from a dead stop on the ground, so there is no bounce to help you. Clean technique and a steady pace matter as much as strength.",
    summary: 'Step-by-step form, the faults that cost reps, two-minute pacing and a 6-week training plan.',
    verified: '2026-11-17',
    facts: [
      { label: 'Event length', value: '2 minutes' },
      { label: 'Plan length', value: '6 weeks' },
      { label: 'Sessions per week', value: '3' },
      { label: 'Equipment', value: 'None' },
    ],
    sections: [
      {
        id: 'which-tests-use-them',
        title: 'Which tests use them',
        blocks: [
          {
            type: 'list',
            items: [
              "**Army:** the [Army AFT](/fitness-tests/army-aft/) includes the hand-release push-up with arm extension, for 2 minutes.",
              "**Air Force:** the [Air Force PFRA](/fitness-tests/air-force-pfra/) offers a 2-minute hand-release push-up as an option in the strength component.",
              "**Space Force:** the [Space Force HPA](/fitness-tests/space-force-hpa/) offers a 2-minute hand-release push-up as an option in the strength component.",
            ],
          },
          {
            type: 'p',
            text: "The hand movement at the bottom and the rules on resting are not identical across services. Learn the version in your own test's guide and practice that one. Required reps and scoring vary by age and sex and are revised.",
          },
        ],
      },
      {
        id: 'the-rep-step-by-step',
        title: 'The rep, step by step',
        blocks: [
          {
            type: 'p',
            text: "This describes the arm-extension version in general terms. Your service's guide is the authority on exact hand and foot placement.",
          },
          {
            type: 'list',
            ordered: true,
            items: [
              "**Start on the ground.** Lie face down with your hands flat under your shoulders, feet together or slightly apart, toes on the ground.",
              "**Push up as one unit.** Press until your elbows are fully straight. Shoulders, hips and legs rise together in a straight line.",
              "**Lower as one unit.** Bend your elbows and lower until your chest, hips and thighs are on the ground.",
              "**Release.** Without moving your head, body or legs, slide your arms straight out to the sides until they are fully extended.",
              "**Reset.** Bring your hands back under your shoulders. That completes one rep.",
            ],
          },
          {
            type: 'p',
            text: "Keep your glutes and abdominals tight the whole time. A rigid body is what lets the chest and hips leave the ground together.",
          },
        ],
      },
      {
        id: 'faults',
        title: 'Faults',
        blocks: [
          {
            type: 'p',
            text: "These are the usual reasons a rep is not counted. The exact list and the consequences are defined in each service's guide.",
          },
          {
            type: 'list',
            items: [
              "**Snaking.** The chest rises first and the hips follow. This is the most common fault and comes from a loose trunk.",
              "**No lockout.** Elbows stay slightly bent at the top, often when you rush.",
              "**Short release.** Arms do not reach full extension, or hands do not clearly leave the push-up position.",
              "**Moving the feet or lifting a leg** to shift position during the event.",
              "**Hips piked or sagging** in the top position.",
              "**Resting in a position that is not allowed.** Tests define where you may pause. Resting any other way can end the event.",
            ],
          },
          {
            type: 'p',
            text: "Have someone grade a set for you, or film it from the side. Count only the reps a strict grader would count, and use that number as your score.",
          },
        ],
      },
      {
        id: 'pacing-two-minutes',
        title: 'Pacing two minutes',
        blocks: [
          {
            type: 'p',
            text: "Two minutes is 120 seconds, and each rep takes longer than a regular push-up because of the release. A steady rhythm you can hold beats a fast start followed by long pauses. Pick the cadence that matches your goal.",
          },
          {
            type: 'table',
            head: ['Cadence', 'Reps in 2 minutes', 'Reps per 30 s'],
            rows: [
              ['One rep every 4 s', '30', '7 to 8'],
              ['One rep every 3 s', '40', '10'],
              ['One rep every 2.5 s', '48', '12'],
              ['One rep every 2 s', '60', '15'],
            ],
            caption: 'Steady cadence and the score it produces if you never stop',
          },
          {
            type: 'list',
            items: [
              "Nobody holds a perfect cadence for the full two minutes. Plan short pauses before you need them.",
              "Go out slightly ahead of your target cadence for the first 30 seconds, then settle.",
              "Take brief rests of 3 to 5 seconds in the allowed position, early and often, instead of one long rest after you hit failure.",
              "Never go to complete failure before the last 15 seconds. A failed rep costs more time than a short pause.",
              "Breathe out on every push.",
            ],
          },
        ],
      },
      {
        id: 'training-plan',
        title: 'Training plan',
        blocks: [
          {
            type: 'p',
            text: "Start with a strict 2-minute test. That number is your score, and working sets are a percentage of it. With a score of 30, a set at 40 percent is 12 reps. Train three days a week with a day between.",
          },
          {
            type: 'table',
            head: ['Week', 'Day 1: volume', 'Day 2: intervals', 'Day 3: strength or test'],
            rows: [
              ['1', '5 x 40% of score, 90 s rest', '8 rounds: 20 s work, 40 s rest', '3 x 8 slow push-ups (3 s lower), 3 x 10 rows'],
              ['2', '5 x 45%, 90 s rest', '10 rounds: 20 s work, 40 s rest', '3 x 10 slow push-ups, 3 x 10 rows'],
              ['3', '6 x 45%, 90 s rest', '8 rounds: 30 s work, 30 s rest', '1 minute at goal cadence, then 2 x 50%'],
              ['4', '4 x 40% (lighter week)', '6 rounds: 20 s work, 40 s rest', 'Full 2-minute retest'],
              ['5', '5 x 50% of new score, 90 s rest', '10 rounds: 30 s work, 30 s rest', '90 s at goal cadence, rest 3 min, 60 s at goal cadence'],
              ['6', '3 x 40%, early in the week', '6 rounds: 20 s work, 40 s rest, easy', 'Test'],
            ],
            caption: '6-week hand-release push-up plan',
          },
          {
            type: 'p',
            text: "Do every rep in the plan as a full hand-release rep, apart from the slow push-ups on Day 3. In the interval rounds, work at your goal cadence and stop each round with a rep or two in reserve. You can log these sets and your 2-minute tests in Gruntz.",
          },
          {
            type: 'p',
            text: "Twice a week, add 3 x 30 seconds of plank and 3 x 10 rows or band pull-aparts. A stiff trunk fixes snaking, and upper-back work balances the pressing. The [plank training guide](/training/plank-training/) has a full progression.",
          },
        ],
      },
      {
        id: 'regular-vs-hand-release',
        title: 'Regular vs hand-release',
        blocks: [
          {
            type: 'list',
            items: [
              "**No rebound.** A regular push-up uses the stretch at the bottom to help the next rep. The hand-release version starts each rep from rest on the ground, which makes the first few inches the hardest part.",
              "**Full range every time.** Chest to the ground and elbows locked removes any doubt about depth.",
              "**Slower reps.** The release adds time, so your 2-minute score will be lower than your regular push-up count.",
              "**More upper back.** Extending and returning the arms works the muscles between your shoulder blades.",
              "**More trunk demand.** Lifting your whole body off the ground as one piece takes a strong brace.",
            ],
          },
          {
            type: 'p',
            text: "Train both. Regular and slow push-ups build pressing strength, and hand-release reps build the specific skill and pacing. If you are getting ready to ship, the [boot camp workout plan](/training/boot-camp-workout-plan/) shows how to fit this next to running.",
          },
          {
            type: 'note',
            text: "This is general training information, not medical advice. Add volume gradually, and stop and get checked for sharp pain or for wrist, elbow or shoulder pain that persists.",
          },
        ],
      },
    ],
    faq: [
      {
        q: 'What counts as a hand-release push-up?',
        a: "In general, a rep counts when you lower your body to the ground as one unit, complete the hand release your test requires, and push back up as one unit to fully straight elbows. On the Army AFT the release is an arm extension out to the sides. Check your own test's guide for the exact wording.",
      },
      {
        q: 'How many do I need?',
        a: "It varies by service, age and sex, and the tables change. See the [Army AFT](/fitness-tests/army-aft/), [Air Force PFRA](/fitness-tests/air-force-pfra/) or [Space Force HPA](/fitness-tests/space-force-hpa/) guide for current standards, then set a training goal comfortably above the number you need.",
      },
      {
        q: 'Are they harder than regular push-ups?',
        a: "For most people, yes, rep for rep. You lose the rebound at the bottom, every rep covers the full range and each one takes longer. Expect a lower count than your regular push-ups until you have practiced the movement for a few weeks.",
      },
      {
        q: 'How do I pace two minutes?',
        a: "Pick a cadence that matches your goal, such as one rep every 3 seconds for 40 reps, and practice it with a timer. Start slightly ahead of that pace, take short planned pauses in the allowed rest position, and avoid hitting failure before the final 15 seconds.",
      },
    ],
    sources: [],
    related: [
      'fitness-tests/army-aft',
      'fitness-tests/air-force-pfra',
      'fitness-tests/space-force-hpa',
      'training/plank-training',
    ],
  },
];

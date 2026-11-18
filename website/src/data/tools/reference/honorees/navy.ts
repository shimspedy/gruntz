import type { Honoree } from '../../types';

/**
 * Navy Medal of Honor recipients, grouped by the rank held at the time of the action.
 * Facts checked against each recipient's page on cmohs.org (citation, rank, action date,
 * "Awarded Posthumously") on 2026-11-18. Historical ratings are mapped to today's pay grade
 * only where the grade is plainly the same (e.g. Pharmacist's Mate Third Class -> PO3).
 * WWII "Rear Admiral" was a single grade then; those recipients are listed under RADM.
 */
const cmohs = (name: string, slug: string) => ({
  label: `Congressional Medal of Honor Society: ${name}`,
  url: `https://www.cmohs.org/recipients/${slug}`,
});

export const honorees: Honoree[] = [
  // ─── SN (E-3) ────────────────────────────────────────────────────────────────
  {
    branch: 'navy',
    abbr: 'SN',
    name: 'David G. Ouellet',
    rankAtAction: 'Seaman',
    conflict: 'Vietnam War',
    year: 1967,
    story:
      'Ouellet was the forward machine gunner on River Patrol Boat 124 on the Mekong River when he saw an enemy grenade falling toward the boat. He ran the length of the boat shouting a warning, pushed his boat captain down to safety, and put himself between the grenade and his shipmates. He took most of the blast and was killed, and the crew around him was spared.',
    posthumous: true,
    source: cmohs('David G. Ouellet', 'david-g-ouellet'),
  },
  {
    branch: 'navy',
    abbr: 'SN',
    name: 'Francis C. Hammond',
    rankAtAction: 'Hospitalman',
    conflict: 'Korean War',
    year: 1953,
    story:
      'Hammond was a corpsman with the 1st Marine Division during a night counterattack on a contested outpost near Sanae-dong. Badly wounded himself, he kept treating Marines through four hours of mortar, artillery and infantry assault. When the unit was ordered to pull back, he stayed to help the relieving corpsmen until enemy mortar fire killed him.',
    posthumous: true,
    source: cmohs('Francis C. Hammond', 'francis-c-hammond'),
  },

  // ─── PO3 (E-4) ───────────────────────────────────────────────────────────────
  {
    branch: 'navy',
    abbr: 'PO3',
    name: 'Jack Williams',
    rankAtAction: "Pharmacist's Mate Third Class",
    conflict: 'World War II',
    year: 1945,
    story:
      'On Iwo Jima with the 3d Battalion, 28th Marines, Williams dragged a wounded Marine into a shallow hole and shielded him with his own body while giving first aid. Shot three times, he finished treating that Marine, dressed his own wounds, and then cared for another casualty. He was struck by a sniper while finally heading to the rear and died of his wounds.',
    posthumous: true,
    source: cmohs('Jack Williams', 'jack-williams'),
  },
  {
    branch: 'navy',
    abbr: 'PO3',
    name: 'William R. Charette',
    rankAtAction: 'Hospital Corpsman Third Class',
    conflict: 'Korean War',
    year: 1953,
    story:
      'During a night fight for an outpost near the Panmunjom corridor, Charette threw himself on a wounded Marine when a grenade landed beside them, taking the blast himself. With his helmet and aid kit torn away, he made bandages from his own clothing, gave his armored vest to a wounded Marine, and stood up in the trench under fire to treat another. He was credited with saving many lives and later rose to master chief.',
    posthumous: false,
    source: cmohs('William R. Charette', 'william-r-charette'),
  },
  {
    branch: 'navy',
    abbr: 'PO3',
    name: 'Marvin G. Shields',
    rankAtAction: 'Construction Mechanic Third Class',
    conflict: 'Vietnam War',
    year: 1965,
    story:
      'Shields was a Seabee at the Special Forces camp at Dong Xoai when a Viet Cong regiment attacked. Wounded twice, he kept carrying ammunition, returning fire and moving a more badly hurt man to safety for hours. He then volunteered to go with his commander and knock out an enemy machine gun with a rocket launcher, and was mortally wounded on the way back.',
    posthumous: true,
    source: cmohs('Marvin G. Shields', 'marvin-g-shields'),
  },
  {
    branch: 'navy',
    abbr: 'PO3',
    name: 'Robert R. Ingram',
    rankAtAction: 'Hospital Corpsman Third Class',
    conflict: 'Vietnam War',
    year: 1966,
    story:
      'Ingram was the corpsman with the point platoon of C Company, 1st Battalion, 7th Marines when about 100 North Vietnamese regulars opened fire and cut the platoon down. He was shot four times, once through the hand, yet kept crawling across open ground to treat the wounded and gather ammunition until sunset. His actions saved many Marines that day.',
    posthumous: false,
    source: cmohs('Robert R. Ingram', 'robert-r-ingram'),
  },
  {
    branch: 'navy',
    abbr: 'PO3',
    name: 'Wayne M. Caron',
    rankAtAction: 'Hospital Corpsman Third Class',
    conflict: 'Vietnam War',
    year: 1968,
    story:
      'Caron was a platoon corpsman with the 7th Marines when his unit came under heavy fire in an open rice field. Hit in the arm and then the leg, he kept going, saving one badly wounded Marine and crawling to treat another. He was still trying to reach a third when an enemy rocket killed him.',
    posthumous: true,
    source: cmohs('Wayne M. Caron', 'wayne-m-caron'),
  },

  // ─── PO2 (E-5) ───────────────────────────────────────────────────────────────
  {
    branch: 'navy',
    abbr: 'PO2',
    name: 'Michael A. Monsoor',
    rankAtAction: 'Master-at-Arms Second Class',
    conflict: 'Operation Iraqi Freedom',
    year: 2006,
    story:
      'Monsoor was a SEAL machine gunner in a rooftop sniper overwatch position in Ar Ramadi. An insurgent grenade bounced off his chest and landed in front of him; he was the only one who could have escaped it. He threw himself on the grenade instead, saving the two teammates beside him.',
    posthumous: true,
    source: cmohs('Michael A. Monsoor', 'michael-a-monsoor'),
  },
  {
    branch: 'navy',
    abbr: 'PO2',
    name: 'George E. Wahlen',
    rankAtAction: "Pharmacist's Mate Second Class",
    conflict: 'World War II',
    year: 1945,
    story:
      'Wahlen was a corpsman with the 2d Battalion, 26th Marines on Iwo Jima. Wounded on 26 February, he stayed in the fight, treating 14 casualties in a neighboring platoon under heavy fire, and refused evacuation after a second wound. On 3 March, wounded a third time and unable to walk, he crawled 50 yards to treat another Marine.',
    posthumous: false,
    source: cmohs('George E. Wahlen', 'george-e-wahlen'),
  },
  {
    branch: 'navy',
    abbr: 'PO2',
    name: 'Owen F. Hammerberg',
    rankAtAction: "Boatswain's Mate Second Class",
    conflict: 'World War II',
    year: 1945,
    story:
      'Hammerberg was a Navy diver at West Loch, Pearl Harbor, when two divers were trapped by a cave-in under a sunken landing ship buried in mud. Working in total darkness, he freed the first man, then tunneled farther to reach the second just as another collapse pinned him across his shipmate, shielding him. Both divers were saved; Hammerberg died 18 hours after going in.',
    posthumous: true,
    source: cmohs('Owen F. Hammerberg', 'owen-f-hammerberg'),
  },
  {
    branch: 'navy',
    abbr: 'PO2',
    name: 'Donald E. Ballard',
    rankAtAction: 'Hospital Corpsman Second Class',
    conflict: 'Vietnam War',
    year: 1968,
    story:
      'Ballard was a corpsman with M Company, 3d Battalion, 4th Marines when the company was ambushed in Quang Tri Province. As he prepared a wounded Marine for evacuation, an enemy soldier threw a grenade beside the group, and Ballard threw himself on it. When it failed to explode, he got up and went back to treating casualties.',
    posthumous: false,
    source: cmohs('Donald E. Ballard', 'donald-e-ballard'),
  },
  {
    branch: 'navy',
    abbr: 'PO2',
    name: 'David R. Ray',
    rankAtAction: 'Hospital Corpsman Second Class',
    conflict: 'Vietnam War',
    year: 1969,
    story:
      'Ray was the corpsman for an artillery battery of the 11th Marines when a battalion-size enemy force broke through the wire at Phu Loc 6. Seriously wounded, he kept moving between gun pits to treat Marines and fought off two attackers himself. After running out of ammunition he was fatally wounded, and his last act was to cover a wounded Marine from a grenade.',
    posthumous: true,
    source: cmohs('David R. Ray', 'david-r-ray'),
  },

  // ─── PO1 (E-6) ───────────────────────────────────────────────────────────────
  {
    branch: 'navy',
    abbr: 'PO1',
    name: 'Robert R. Scott',
    rankAtAction: "Machinist's Mate First Class",
    conflict: 'World War II',
    year: 1941,
    story:
      'At Pearl Harbor, a torpedo flooded the compartment aboard USS California where Scott manned the air compressor that fed the ship\'s guns. The rest of the crew left, but Scott stayed at his station to keep air going to the guns for as long as they were firing. He died there.',
    posthumous: true,
    source: cmohs('Robert R. Scott', 'robert-r-scott'),
  },
  {
    branch: 'navy',
    abbr: 'PO1',
    name: 'John H. Willis',
    rankAtAction: "Pharmacist's Mate First Class",
    conflict: 'World War II',
    year: 1945,
    story:
      'Willis was a platoon corpsman with the 3d Battalion, 27th Marines on Iwo Jima. Wounded and sent to the aid station, he returned to the front without being released and crawled into a shell hole to give a wounded Marine plasma during a counterattack. He threw back eight enemy grenades before a ninth exploded in his hand and killed him.',
    posthumous: true,
    source: cmohs('John H. Willis', 'john-h-willis'),
  },
  {
    branch: 'navy',
    abbr: 'PO1',
    name: 'Francis J. Pierce',
    rankAtAction: "Pharmacist's Mate First Class",
    conflict: 'World War II',
    year: 1945,
    story:
      'Pierce was a corpsman with the 2d Battalion, 24th Marines on Iwo Jima. When a stretcher party was cut down by fire, he took charge, drew the enemy\'s fire in the open, killed a shooter in a cave, and carried two wounded Marines back across 200 feet of fire-swept ground. The next morning he led a patrol to the sniper position and was seriously wounded while treating another Marine.',
    posthumous: false,
    source: cmohs('Francis J. Pierce', 'francis-j-pierce'),
  },
  {
    branch: 'navy',
    abbr: 'PO1',
    name: 'James E. Williams',
    rankAtAction: "Boatswain's Mate First Class",
    conflict: 'Vietnam War',
    year: 1966,
    story:
      'Williams was boat captain and patrol officer of River Patrol Boat 105 on the Mekong when his two-boat patrol ran into a much larger enemy force of junks and sampans. Over a three-hour fight he exposed himself again and again to direct fire, pressed the attack, and after dark turned on his searchlights to keep going. The patrol destroyed or captured 65 enemy boats.',
    posthumous: false,
    source: cmohs('James E. Williams', 'james-e-williams'),
  },

  // ─── CPO (E-7) ───────────────────────────────────────────────────────────────
  {
    branch: 'navy',
    abbr: 'CPO',
    name: 'John W. Finn',
    rankAtAction: 'Aviation Chief Ordnanceman',
    conflict: 'World War II',
    year: 1941,
    story:
      'When Japanese planes struck Naval Air Station Kaneohe Bay on 7 December 1941, Finn set up a .50-caliber machine gun on an exposed part of the parking ramp and fired back through the strafing and bombing. He was wounded many times and left his gun only when ordered to. After first aid he went back to help rearm the squadron\'s planes.',
    posthumous: false,
    source: cmohs('John W. Finn', 'john-w-finn'),
  },
  {
    branch: 'navy',
    abbr: 'CPO',
    name: 'Peter Tomich',
    rankAtAction: 'Chief Watertender',
    conflict: 'World War II',
    year: 1941,
    story:
      'Tomich was in the engineering plant of USS Utah when the ship was hit and began to capsize at Pearl Harbor. He stayed at his post until every boiler was secured and all of his fireroom crew had gotten out. He lost his life doing it.',
    posthumous: true,
    source: cmohs('Peter Tomich', 'peter-tomich'),
  },
  {
    branch: 'navy',
    abbr: 'CPO',
    name: 'Edward C. Byers Jr.',
    rankAtAction: 'Chief Petty Officer',
    conflict: 'Operation Enduring Freedom',
    year: 2012,
    story:
      'Byers was a SEAL on a hostage rescue mission in Afghanistan. As the breacher, he stood in the doorway under fire tearing down layers of heavy blankets, then rushed in after the first assaulter fell. He fought two guards, found the American hostage by his voice, covered him with his own body and pinned another guard with his bare hands, saving the hostage and several teammates.',
    posthumous: false,
    source: cmohs('Edward C. Byers Jr.', 'edward-c-byers-jr'),
  },

  // ─── SCPO (E-8) ──────────────────────────────────────────────────────────────
  {
    branch: 'navy',
    abbr: 'SCPO',
    name: 'Britt K. Slabinski',
    rankAtAction: 'Senior Chief Special Warfare Operator',
    conflict: 'Operation Enduring Freedom',
    year: 2002,
    story:
      'Slabinski led a SEAL reconnaissance team onto Takur Ghar, a 10,000-foot mountain, where enemy fire crippled their helicopter and threw one teammate onto the peak. He brought the team back to rescue him, charged and cleared one bunker, and fought a second at close range while directing air strikes. Over the next 14 hours he carried a wounded teammate through deep snow and kept the team fighting until it was extracted.',
    posthumous: false,
    source: cmohs('Britt K. Slabinski', 'britt-k-slabinski'),
  },

  // ─── ENS (O-1) ───────────────────────────────────────────────────────────────
  {
    branch: 'navy',
    abbr: 'ENS',
    name: 'Herbert C. Jones',
    rankAtAction: 'Ensign',
    conflict: 'World War II',
    year: 1941,
    story:
      'At Pearl Harbor, after USS California\'s ammunition hoists were knocked out, Jones organized and led a party carrying ammunition by hand to the antiaircraft guns. He was fatally wounded by a bomb. When two men tried to carry him out of the burning area, he ordered them to leave him and get clear.',
    posthumous: true,
    source: cmohs('Herbert C. Jones', 'herbert-c-jones'),
  },
  {
    branch: 'navy',
    abbr: 'ENS',
    name: 'Francis C. Flaherty',
    rankAtAction: 'Ensign',
    conflict: 'World War II',
    year: 1941,
    story:
      'When USS Oklahoma began to capsize at Pearl Harbor and the order came to abandon ship, Flaherty stayed in a gun turret holding a flashlight so the rest of the turret crew could see their way out. He gave his life so they could escape.',
    posthumous: true,
    source: cmohs('Francis C. Flaherty', 'francis-c-flaherty'),
  },
  {
    branch: 'navy',
    abbr: 'ENS',
    name: 'John J. Parle',
    rankAtAction: 'Ensign',
    conflict: 'World War II',
    year: 1943,
    story:
      'Parle was in charge of small boats aboard USS LST-375 for the invasion of Sicily when a smoke pot ignited in a boat loaded with explosives and ammunition. To keep the blast from giving away the assault, he climbed in, put out a burning fuse, and threw the smoke pot overboard with his hands. He died a week later from the smoke he inhaled.',
    posthumous: true,
    source: cmohs('John J. Parle', 'john-j-parle'),
  },

  // ─── LTJG (O-2) ──────────────────────────────────────────────────────────────
  {
    branch: 'navy',
    abbr: 'LTJG',
    name: 'Donald A. Gary',
    rankAtAction: 'Lieutenant (junior grade)',
    conflict: 'World War II',
    year: 1945,
    story:
      'When USS Franklin was torn by explosions off Japan, Gary found several hundred men trapped in a smoke-filled mess compartment. He searched dark, wrecked passageways until he found a way out, then went back three times to lead them all to safety. He also led firefighting parties and got steam up in a boiler to help save the ship.',
    posthumous: false,
    source: cmohs('Donald A. Gary', 'donald-a-gary'),
  },
  {
    branch: 'navy',
    abbr: 'LTJG',
    name: 'Thomas J. Hudner Jr.',
    rankAtAction: 'Lieutenant (junior grade)',
    conflict: 'Korean War',
    year: 1950,
    story:
      'Near the Chosin Reservoir, Hudner\'s squadron mate, Ensign Jesse Brown, was shot down and trapped alive in his burning plane behind enemy lines. Hudner deliberately crash-landed his own aircraft beside him, packed snow against the fuselage to hold back the flames, and called for a rescue helicopter. He stayed and fought the cold and fire until there was no hope left.',
    posthumous: false,
    source: cmohs('Thomas J. Hudner Jr.', 'thomas-j-hudner'),
  },
  {
    branch: 'navy',
    abbr: 'LTJG',
    name: 'Clyde E. Lassen',
    rankAtAction: 'Lieutenant (junior grade)',
    conflict: 'Vietnam War',
    year: 1968,
    story:
      'Lassen flew a rescue helicopter into North Vietnam at night to pick up two downed aviators on a steep, wooded hill. After hitting a tree when the flares ran out and failing on two more attempts, he went in again and turned on his own landing lights, giving away his position, so the men could reach him. He landed on USS Jouett with about five minutes of fuel left.',
    posthumous: false,
    source: cmohs('Clyde E. Lassen', 'clyde-e-lassen'),
  },
  {
    branch: 'navy',
    abbr: 'LTJG',
    name: 'Joseph R. Kerrey',
    rankAtAction: 'Lieutenant (junior grade)',
    conflict: 'Vietnam War',
    year: 1969,
    story:
      'Kerrey led a SEAL team up a 350-foot cliff to reach an enemy camp on an island in Nha Trang Bay. As they came down on the camp, a grenade exploded at his feet and badly wounded him. He kept directing both elements of his team, caught the enemy in a crossfire, and ran the extraction until he was evacuated.',
    posthumous: false,
    source: cmohs('Joseph R. Kerrey', 'joseph-r-kerrey'),
  },

  // ─── LT (O-3) ────────────────────────────────────────────────────────────────
  {
    branch: 'navy',
    abbr: 'LT',
    name: 'Edward H. "Butch" O\'Hare',
    rankAtAction: 'Lieutenant',
    conflict: 'World War II',
    year: 1942,
    story:
      'Flying with Fighting Squadron 3, O\'Hare found himself alone between USS Lexington and a formation of nine enemy bombers. He attacked them again and again at close range, shooting down five and damaging a sixth before they could release their bombs. His action likely saved the carrier from serious damage.',
    posthumous: false,
    source: cmohs('Edward H. "Butch" O\'Hare', 'edward-henry-butch-ohare'),
  },
  {
    branch: 'navy',
    abbr: 'LT',
    name: 'Thomas R. Norris',
    rankAtAction: 'Lieutenant',
    conflict: 'Vietnam War',
    year: 1972,
    story:
      'Over several days in April 1972, Norris led patrols deep into enemy-held Quang Tri Province to rescue two downed pilots. After bringing out the first, he and one Vietnamese partner disguised themselves as fishermen, traveled all night by sampan, and found the second pilot at dawn. Under machine-gun fire on the way back, he called in an air strike and smoke to get everyone to safety.',
    posthumous: false,
    source: cmohs('Thomas R. Norris', 'thomas-r-norris'),
  },
  {
    branch: 'navy',
    abbr: 'LT',
    name: 'Michael P. Murphy',
    rankAtAction: 'Lieutenant',
    conflict: 'Operation Enduring Freedom',
    year: 2005,
    story:
      'Murphy led a four-man SEAL reconnaissance team near Asadabad that was surrounded by 30 to 40 Taliban fighters. With every man wounded and the radio unable to reach out from the terrain, he moved into the open to make the call for help, knowing it exposed him. He passed the team\'s position and kept fighting until he was killed.',
    posthumous: true,
    source: cmohs('Michael P. Murphy', 'michael-p-murphy'),
  },

  // ─── LCDR (O-4) ──────────────────────────────────────────────────────────────
  {
    branch: 'navy',
    abbr: 'LCDR',
    name: 'Bruce A. Van Voorhis',
    rankAtAction: 'Lieutenant Commander',
    conflict: 'World War II',
    year: 1943,
    story:
      'To head off a surprise Japanese attack, Van Voorhis volunteered for a 700-mile night flight with no escort to Greenwich Island in the Solomons. Under heavy fire and pursued by fighters, he made six low-level attacks that destroyed the enemy radio station and several aircraft. He was caught in the blast of his own bombs and crashed in the lagoon.',
    posthumous: true,
    source: cmohs('Bruce A. Van Voorhis', 'bruce-a-van-voorhis'),
  },
  {
    branch: 'navy',
    abbr: 'LCDR',
    name: "Joseph T. O'Callahan",
    rankAtAction: 'Lieutenant Commander (Chaplain Corps)',
    conflict: 'World War II',
    year: 1945,
    story:
      'O\'Callahan was the chaplain of USS Franklin when Japanese aircraft set the carrier ablaze off Kobe. Through exploding bombs and rockets, he cared for the wounded and dying, led firefighting crews onto the flight deck, and helped dump live ammunition and flood a magazine.',
    posthumous: false,
    source: cmohs("Joseph T. O'Callahan", 'joseph-t-ocallahan'),
  },
  {
    branch: 'navy',
    abbr: 'LCDR',
    name: 'Michael J. Estocin',
    rankAtAction: 'Lieutenant Commander',
    conflict: 'Vietnam War',
    year: 1967,
    story:
      'Over Haiphong in April 1967, Estocin flew ahead of strike groups to knock out surface-to-air missile sites. On 20 April a missile badly damaged his plane, but he went back to attack and then made a fiery arrested landing on USS Ticonderoga with almost no fuel. On 26 April another missile hit him, and he still fired his missiles at the site before his burning aircraft left the area.',
    posthumous: true,
    source: cmohs('Michael J. Estocin', 'michael-j-estocin'),
  },

  // ─── CDR (O-5) ───────────────────────────────────────────────────────────────
  {
    branch: 'navy',
    abbr: 'CDR',
    name: 'Howard W. Gilmore',
    rankAtAction: 'Commander',
    conflict: 'World War II',
    year: 1943,
    story:
      'Gilmore commanded the submarine USS Growler when an enemy gunboat tried to ram her at night; he rammed it instead. Under heavy machine-gun fire, he cleared the bridge, sent his men below first, and was cut down by the gunfire. His last order was to take the boat down, and the crew brought the damaged Growler home.',
    posthumous: true,
    source: cmohs('Howard W. Gilmore', 'howard-w-gilmore'),
  },
  {
    branch: 'navy',
    abbr: 'CDR',
    name: 'Samuel D. Dealey',
    rankAtAction: 'Commander',
    conflict: 'World War II',
    year: 1944,
    story:
      'As commander of USS Harder on her fifth war patrol, Dealey sank five Japanese destroyers in five close-range torpedo attacks, including "down-the-throat" shots at ships charging straight at him. He operated within sight of a major Japanese fleet base off Tawi Tawi.',
    posthumous: true,
    source: cmohs('Samuel D. Dealey', 'samuel-d-dealey'),
  },
  {
    branch: 'navy',
    abbr: 'CDR',
    name: 'David McCampbell',
    rankAtAction: 'Commander',
    conflict: 'World War II',
    year: 1944,
    story:
      'McCampbell commanded Air Group 15 from USS Essex. On 19 June 1944 he shot down seven enemy planes attacking the fleet, and on 24 October, with a single wingman, he took on a formation of about 60 aircraft, shot down nine, and broke up the attack before any reached the fleet.',
    posthumous: false,
    source: cmohs('David McCampbell', 'david-mccampbell'),
  },
  {
    branch: 'navy',
    abbr: 'CDR',
    name: "Richard H. O'Kane",
    rankAtAction: 'Commander',
    conflict: 'World War II',
    year: 1944,
    story:
      'On USS Tang\'s last war patrol, O\'Kane drove his submarine on the surface into the middle of two heavily escorted convoys on back-to-back nights and sank ship after ship at close range. He fired his last torpedoes into what remained of the convoy before Tang herself went down.',
    posthumous: false,
    source: cmohs("Richard H. O'Kane", 'richard-h-okane'),
  },
  {
    branch: 'navy',
    abbr: 'CDR',
    name: 'Eugene B. Fluckey',
    rankAtAction: 'Commander',
    conflict: 'World War II',
    year: 1945,
    story:
      'Commanding USS Barb off the China coast, Fluckey tracked down more than 30 enemy ships sheltering in Namkwan Harbor in January 1945. He took his submarine into shallow, mined and uncharted water, fired his last forward torpedoes and four more from the stern into the anchored ships, and then ran out at full speed to safety.',
    posthumous: false,
    source: cmohs('Eugene B. Fluckey', 'eugene-b-fluckey'),
  },

  // ─── CAPT (O-6) ──────────────────────────────────────────────────────────────
  {
    branch: 'navy',
    abbr: 'CAPT',
    name: 'Mervyn S. Bennion',
    rankAtAction: 'Captain',
    conflict: 'World War II',
    year: 1941,
    story:
      'Bennion commanded USS West Virginia at Pearl Harbor. Mortally wounded on the bridge, he kept his attention on fighting and saving his ship and objected to being carried away from his post.',
    posthumous: true,
    source: cmohs('Mervyn S. Bennion', 'mervyn-s-bennion'),
  },
  {
    branch: 'navy',
    abbr: 'CAPT',
    name: 'Franklin Van Valkenburgh',
    rankAtAction: 'Captain',
    conflict: 'World War II',
    year: 1941,
    story:
      'Van Valkenburgh commanded USS Arizona at Pearl Harbor and fought his ship until a bomb hit the bridge and the forward magazines exploded. He was killed in the explosion.',
    posthumous: true,
    source: cmohs('Franklin Van Valkenburgh', 'franklin-van-valkenburgh'),
  },
  {
    branch: 'navy',
    abbr: 'CAPT',
    name: 'James B. Stockdale',
    rankAtAction: 'Captain',
    conflict: 'Vietnam War',
    year: 1969,
    story:
      'Stockdale was the senior naval officer among the prisoners of war in North Vietnam and led their resistance to interrogation and propaganda. Facing a new round of torture, he wounded himself nearly to death to show his captors he would die rather than give in. The treatment of all the prisoners eased afterward.',
    posthumous: false,
    source: cmohs('James B. Stockdale', 'james-b-stockdale'),
  },

  // ─── RADM (O-8) ──────────────────────────────────────────────────────────────
  {
    branch: 'navy',
    abbr: 'RADM',
    name: 'Isaac C. Kidd',
    rankAtAction: 'Rear Admiral',
    conflict: 'World War II',
    year: 1941,
    story:
      'Kidd commanded Battleship Division One from his flagship, USS Arizona. When the attack on Pearl Harbor began he went to the bridge and directed the fight as senior officer afloat until Arizona blew up.',
    posthumous: true,
    source: cmohs('Isaac C. Kidd', 'isaac-c-kidd'),
  },
  {
    branch: 'navy',
    abbr: 'RADM',
    name: 'Norman Scott',
    rankAtAction: 'Rear Admiral',
    conflict: 'World War II',
    year: 1942,
    story:
      'Off Savo Island in October 1942, Scott\'s force intercepted a Japanese task force headed for Guadalcanal and sank or drove it off. A month later he led his ships into a close-range night battle against a stronger force and was killed in the bombardment. Both actions helped turn back the Japanese push on Guadalcanal.',
    posthumous: true,
    source: cmohs('Norman Scott', 'norman-scott'),
  },
  {
    branch: 'navy',
    abbr: 'RADM',
    name: 'Daniel J. Callaghan',
    rankAtAction: 'Rear Admiral',
    conflict: 'World War II',
    year: 1942,
    story:
      'On the night of 12 to 13 November 1942, Callaghan led an outgunned American force against a Japanese fleet moving on Guadalcanal. He directed the close-range fight from the bridge of USS San Francisco until he was killed there. The battle helped stop the Japanese offensive.',
    posthumous: true,
    source: cmohs('Daniel J. Callaghan', 'daniel-j-callaghan'),
  },
];

import type { Honoree } from '../../types';

/**
 * U.S. Air Force Medal of Honor recipients (1947 on; Army Air Corps and Army Air Forces
 * recipients belong to the Army), grouped by the rank held at the time of the action.
 * Facts checked against each recipient's page on cmohs.org (citation, rank, action date,
 * "Awarded Posthumously") on 2026-11-18.
 * William H. Pitsenbarger (Airman First Class, April 1966) is left out on purpose: before the
 * 1967 enlisted grade change, Airman First Class was pay grade E-4, so it does not map cleanly
 * to today's A1C (E-3). John L. Levitow's action (February 1969) came after the change.
 */
const cmohs = (name: string, slug: string) => ({
  label: `Congressional Medal of Honor Society: ${name}`,
  url: `https://www.cmohs.org/recipients/${slug}`,
});

export const honorees: Honoree[] = [
  // ─── A1C (E-3) ───────────────────────────────────────────────────────────────
  {
    branch: 'air-force',
    abbr: 'A1C',
    name: 'John L. Levitow',
    rankAtAction: 'Airman First Class',
    conflict: 'Vietnam War',
    year: 1969,
    story:
      'Levitow was a loadmaster on an AC-47 gunship over Long Binh when a mortar round hit the wing and wounded everyone in the cargo compartment. With more than 40 shrapnel wounds, he saw a live flare rolling loose in the aisle, threw himself on it, dragged it to the open door and pushed it out just before it ignited. He saved the aircraft and its entire crew.',
    posthumous: false,
    source: cmohs('John L. Levitow', 'john-l-levitow'),
  },

  // ─── TSgt (E-6) ──────────────────────────────────────────────────────────────
  {
    branch: 'air-force',
    abbr: 'TSgt',
    name: 'John A. Chapman',
    rankAtAction: 'Technical Sergeant',
    conflict: 'Operation Enduring Freedom',
    year: 2002,
    story:
      'Chapman was a combat controller with a SEAL team on Takur Ghar when a teammate fell from their ambushed helicopter into an enemy position. Going back up the mountain to rescue him, Chapman charged through thigh-deep snow and cleared one enemy bunker, then left cover to attack a second machine-gun position firing on his team. Mortally wounded, he kept fighting until he was killed.',
    posthumous: true,
    source: cmohs('John A. Chapman', 'john-a-chapman'),
  },

  // ─── CMSgt (E-9) ─────────────────────────────────────────────────────────────
  {
    branch: 'air-force',
    abbr: 'CMSgt',
    name: 'Richard L. Etchberger',
    rankAtAction: 'Chief Master Sergeant',
    conflict: 'Vietnam War',
    year: 1968,
    story:
      'Etchberger led a team of radar technicians at the secret site Lima Site 85 in Laos when enemy troops overran it. With most of his crew dead or wounded and little combat training, he held off the attackers with a rifle while calling in air strikes and rescue. He loaded three wounded men into rescue slings under fire and was killed by ground fire as he was finally hoisted aboard.',
    posthumous: true,
    source: cmohs('Richard L. Etchberger', 'richard-l-etchberger'),
  },

  // ─── 1st Lt (O-2) ────────────────────────────────────────────────────────────
  {
    branch: 'air-force',
    abbr: '1st Lt',
    name: 'James P. Fleming',
    rankAtAction: 'First Lieutenant',
    conflict: 'Vietnam War',
    year: 1968,
    story:
      'Fleming flew a UH-1F helicopter to pull out a six-man Special Forces patrol about to be overrun near Duc Co, after another helicopter had already been shot down. He balanced his aircraft on a riverbank with the tail hanging over the water, and when the patrol could not reach him, came back low on fuel to try again. He held position as fire broke through his windscreen and flew everyone out.',
    posthumous: false,
    source: cmohs('James P. Fleming', 'james-p-fleming'),
  },

  // ─── Capt (O-3) ──────────────────────────────────────────────────────────────
  {
    branch: 'air-force',
    abbr: 'Capt',
    name: 'John S. Walmsley Jr.',
    rankAtAction: 'Captain',
    conflict: 'Korean War',
    year: 1951,
    story:
      'Flying a B-26 at night over Korea, Walmsley disabled a high-priority enemy supply train and, out of ammunition, used his aircraft\'s searchlight to guide another bomber onto it. He flew low down the valley with the light on, drawing heavy antiaircraft fire, so the other crew could see the target. The train was destroyed, and Walmsley\'s plane was hit and crashed into the mountains.',
    posthumous: true,
    source: cmohs('John S. Walmsley Jr.', 'john-s-walmsley-jr'),
  },
  {
    branch: 'air-force',
    abbr: 'Capt',
    name: 'Hilliard A. Wilbanks',
    rankAtAction: 'Captain',
    conflict: 'Vietnam War',
    year: 1967,
    story:
      'Wilbanks was a forward air controller in an unarmed light plane when he found an enemy force waiting to ambush a South Vietnamese Ranger battalion near Dalat. With no strike aircraft able to arrive in time, he made repeated treetop passes over the enemy, firing a rifle out of his side window to draw their fire away from the Rangers. The Rangers got clear, and Wilbanks was mortally wounded on his final pass.',
    posthumous: true,
    source: cmohs('Hilliard A. Wilbanks', 'hilliard-a-wilbanks'),
  },
  {
    branch: 'air-force',
    abbr: 'Capt',
    name: 'Gerald O. Young',
    rankAtAction: 'Captain',
    conflict: 'Vietnam War',
    year: 1967,
    story:
      'Young commanded a rescue helicopter on a night mission to save an Army reconnaissance team near Khe Sanh after two helicopters had already been lost. He hovered under heavy fire until the last survivors were aboard; his aircraft was then shot down and burned. Badly burned, he helped a wounded man, led the enemy away, and refused rescue for 17 hours because the enemy was setting a trap for rescue aircraft.',
    posthumous: false,
    source: cmohs('Gerald O. Young', 'gerald-o-young'),
  },
  {
    branch: 'air-force',
    abbr: 'Capt',
    name: 'Lance P. Sijan',
    rankAtAction: 'Captain',
    conflict: 'Vietnam War',
    year: 1967,
    story:
      'After ejecting over North Vietnam, Sijan evaded capture for more than six weeks while badly injured and starving. Once captured, he overpowered a guard and crawled into the jungle before being taken again. Tortured in prison, he gave his captors no information and spoke of escape until he died.',
    posthumous: true,
    source: cmohs('Lance P. Sijan', 'lance-p-sijan'),
  },
  {
    branch: 'air-force',
    abbr: 'Capt',
    name: 'Steven L. Bennett',
    rankAtAction: 'Captain',
    conflict: 'Vietnam War',
    year: 1972,
    story:
      'With no air or artillery support available, Bennett strafed an enemy force massing to attack friendly troops until a missile badly damaged his aircraft. His observer\'s parachute had been shredded, so instead of ejecting, Bennett chose to ditch in the Gulf of Tonkin, a landing no pilot of that aircraft type had survived. The observer escaped and was rescued; Bennett was trapped and killed.',
    posthumous: true,
    source: cmohs('Steven L. Bennett', 'steven-l-bennett'),
  },

  // ─── Maj (O-4) ───────────────────────────────────────────────────────────────
  {
    branch: 'air-force',
    abbr: 'Maj',
    name: 'Louis J. Sebille',
    rankAtAction: 'Major',
    conflict: 'Korean War',
    year: 1950,
    story:
      'Sebille\'s F-51 was badly damaged by antiaircraft fire while attacking enemy troops, artillery and armor threatening friendly ground forces near Hanchang. Rather than bail out or crash-land, he turned back into the guns and dove on the target to his death.',
    posthumous: true,
    source: cmohs('Louis J. Sebille', 'louis-j-sebille'),
  },
  {
    branch: 'air-force',
    abbr: 'Maj',
    name: 'George A. Davis Jr.',
    rankAtAction: 'Major',
    conflict: 'Korean War',
    year: 1952,
    story:
      'Leading only two F-86s near the Yalu River, Davis attacked a formation of about 12 MiG-15s heading for friendly fighter-bombers. He shot down two, then slowed down to go after a third instead of escaping, and was shot down and killed. His attack broke up the enemy formation and let the fighter-bombers finish their mission.',
    posthumous: true,
    source: cmohs('George A. Davis Jr.', 'george-a-davis'),
  },
  {
    branch: 'air-force',
    abbr: 'Maj',
    name: 'Bernard F. Fisher',
    rankAtAction: 'Major',
    conflict: 'Vietnam War',
    year: 1966,
    story:
      'During the siege of the Special Forces camp at A Shau, Fisher saw a fellow pilot crash-land on the airstrip. He landed on the debris-covered runway under fire, picked up the downed pilot, and took off again with 19 bullet holes in his aircraft.',
    posthumous: false,
    source: cmohs('Bernard F. Fisher', 'bernard-f-fisher'),
  },
  {
    branch: 'air-force',
    abbr: 'Maj',
    name: 'Leo K. Thorsness',
    rankAtAction: 'Major',
    conflict: 'Vietnam War',
    year: 1967,
    story:
      'On a missile-suppression mission over North Vietnam, Thorsness destroyed two surface-to-air missile sites, then circled to protect his downed wingman\'s crew and shot down a MiG-17. Low on fuel, he returned alone to drive four more MiGs away from the rescue helicopters. He then landed at a forward base so that another aircraft, even lower on fuel, could use the tanker.',
    posthumous: false,
    source: cmohs('Leo K. Thorsness', 'leo-k-thorsness'),
  },
  {
    branch: 'air-force',
    abbr: 'Maj',
    name: 'George E. "Bud" Day',
    rankAtAction: 'Major',
    conflict: 'Vietnam War',
    year: 1967,
    story:
      'Shot down over North Vietnam with a badly broken arm, Day was captured and tortured, then escaped and made his way south on foot, eating berries and raw frogs. He crossed the Ben Hai River into the demilitarized zone before being shot and recaptured. Back in prison he kept resisting, which helped protect aviators still flying against the enemy.',
    posthumous: false,
    source: cmohs('George E. "Bud" Day', 'george-everette-bud-day'),
  },

  // ─── Lt Col (O-5) ────────────────────────────────────────────────────────────
  {
    branch: 'air-force',
    abbr: 'Lt Col',
    name: 'Joe M. Jackson',
    rankAtAction: 'Lieutenant Colonel',
    conflict: 'Vietnam War',
    year: 1968,
    story:
      'As the Special Forces camp at Kham Duc was being overrun, Jackson volunteered to land his C-123 to rescue a three-man Air Force combat control team left behind. He brought the aircraft down on a burning, debris-strewn strip under heavy fire, and a rocket landed in front of his nose without exploding. With the team aboard, he took off through the enemy fire.',
    posthumous: false,
    source: cmohs('Joe M. Jackson', 'joe-m-jackson'),
  },
];

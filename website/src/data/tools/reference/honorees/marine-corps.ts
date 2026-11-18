import type { Honoree } from '../../types';

/**
 * U.S. Marine Corps Medal of Honor recipients, grouped by the rank held at the time of the action.
 * Every entry was checked against its Congressional Medal of Honor Society recipient page
 * (rank at action, date, posthumous flag, citation) on 2026-11-18. Stories are written fresh
 * from the citations. Recipients whose citation names a different rank than the rank held at the
 * time of the action (e.g. "then" ranks or later promotions written into the citation) were left out.
 */

const src = (slug: string) => ({
  label: 'Congressional Medal of Honor Society',
  url: `https://www.cmohs.org/recipients/${slug}`,
});

const m = (h: Omit<Honoree, 'branch'>): Honoree => ({ branch: 'marine-corps', ...h });

export const honorees: Honoree[] = [
  // ─── Private ───────────────────────────────────────────────────────────────
  m({
    abbr: 'Pvt',
    name: 'John J. Kelly',
    rankAtAction: 'Private',
    conflict: 'World War I',
    year: 1918,
    story:
      'At Blanc Mont Ridge, France, Private Kelly ran about 100 yards ahead of the front line, through the friendly artillery barrage, to attack a German machine-gun nest. He killed the gunner with a grenade, shot another crewman with his pistol, and came back through the barrage with eight prisoners. He received both the Army and Navy Medals of Honor for the same act.',
    posthumous: false,
    source: src('john-j-kelly'),
  }),
  m({
    abbr: 'Pvt',
    name: 'Wilson D. Watson',
    rankAtAction: 'Private',
    conflict: 'World War II',
    year: 1945,
    story:
      "An automatic rifleman on Iwo Jima, Private Watson rushed a pillbox that had stopped his squad, kept its defenders pinned with his BAR, and destroyed it with a grenade. He then charged to the crest of a hill and held it alone under grenade and mortar fire for about 15 minutes, killing 60 enemy soldiers before his ammunition ran out and his platoon reached him.",
    posthumous: false,
    source: src('wilson-d-watson'),
  }),
  m({
    abbr: 'Pvt',
    name: 'Franklin E. Sigler',
    rankAtAction: 'Private',
    conflict: 'World War II',
    year: 1945,
    story:
      'When his squad leader fell on Iwo Jima, Private Sigler took charge and led a charge on a gun position that had held up his company for days, wiping out its crew with grenades. Badly wounded while climbing to attack more guns firing from caves above, he refused evacuation, directed fire onto the cave entrances, and carried wounded squad mates to safety.',
    posthumous: false,
    source: src('franklin-e-sigler'),
  }),
  m({
    abbr: 'Pvt',
    name: 'Hector A. Cafferata Jr.',
    rankAtAction: 'Private',
    conflict: 'Korean War',
    year: 1950,
    story:
      "At Toktong Pass, after the rest of his fire team became casualties, Private Cafferata fought alone to close a gap in his company's line, killing 15 attackers and forcing the rest back so reinforcements could move up. Later that morning he grabbed a grenade that landed among wounded Marines and threw it clear, losing part of a finger, and kept fighting until a sniper's bullet forced his evacuation.",
    posthumous: false,
    source: src('hector-a-cafferata-jr'),
  }),

  // ─── Private First Class ─────────────────────────────────────────────────────
  m({
    abbr: 'PFC',
    name: 'Jacklyn H. Lucas',
    rankAtAction: 'Private First Class',
    conflict: 'World War II',
    year: 1945,
    story:
      'On the second day of the Iwo Jima landing, Private First Class Lucas and three other Marines were ambushed in a ravine and two grenades landed in front of them. He threw himself on one and pulled the other beneath him, taking both blasts to shield his companions, who then drove off the enemy patrol. He survived his wounds.',
    posthumous: false,
    source: src('jacklyn-h-lucas'),
  }),
  m({
    abbr: 'PFC',
    name: 'Harold Gonsalves',
    rankAtAction: 'Private First Class',
    conflict: 'World War II',
    year: 1945,
    story:
      "Serving as acting scout sergeant with an artillery forward observation team on Okinawa, Private First Class Gonsalves moved up to the front lines with his commanding officer under heavy fire. When a Japanese grenade landed among the group, he dove on it and took the full blast, protecting the officer and another Marine at the cost of his life.",
    posthumous: true,
    source: src('harold-gonsalves'),
  }),
  m({
    abbr: 'PFC',
    name: 'William B. Baugh',
    rankAtAction: 'Private First Class',
    conflict: 'Korean War',
    year: 1950,
    story:
      'During a night ambush of a motorized column on the road from Koto-ri to Hagaru-ri, a grenade landed in the truck carrying Private First Class Baugh and his antitank squad. He shouted a warning and threw himself on it, saving the men around him, and died of his wounds a short time later.',
    posthumous: true,
    source: src('william-b-baugh'),
  }),
  m({
    abbr: 'PFC',
    name: 'James Anderson Jr.',
    rankAtAction: 'Private First Class',
    conflict: 'Vietnam War',
    year: 1967,
    story:
      "Northwest of Cam Lo, Private First Class Anderson's platoon was pinned down just 20 meters from enemy positions while trying to reach a besieged reconnaissance patrol. When a grenade rolled beside his head, he pulled it to his chest and curled around it, absorbing most of the blast and saving the Marines bunched around him.",
    posthumous: true,
    source: src('james-anderson'),
  }),
  m({
    abbr: 'PFC',
    name: 'Oscar P. Austin',
    rankAtAction: 'Private First Class',
    conflict: 'Vietnam War',
    year: 1969,
    story:
      'When a large North Vietnamese force struck his observation post west of Da Nang, Private First Class Austin ran across open ground to drag an unconscious Marine to cover. He threw himself between the wounded man and an incoming grenade, then, already injured, put himself in front of an enemy soldier aiming at his comrade and was mortally wounded.',
    posthumous: true,
    source: src('oscar-p-austin'),
  }),

  // ─── Lance Corporal ──────────────────────────────────────────────────────────
  m({
    abbr: 'LCpl',
    name: 'Joe C. Paul',
    rankAtAction: 'Lance Corporal',
    conflict: 'Vietnam War',
    year: 1965,
    story:
      'Near Chu Lai, five wounded Marines lay exposed in front of their platoon as Viet Cong forces hit them with white phosphorus rifle grenades. Lance Corporal Paul ran across the rice paddies, put himself between the wounded and the enemy, and kept firing to draw the attack away until they could be evacuated. Critically wounded, he stayed in place firing until he collapsed.',
    posthumous: true,
    source: src('joe-c-paul'),
  }),
  m({
    abbr: 'LCpl',
    name: 'Kenneth L. Worley',
    rankAtAction: 'Lance Corporal',
    conflict: 'Vietnam War',
    year: 1968,
    story:
      'Lance Corporal Worley was with a night ambush patrol in a house in the hamlet of Bo Ban when the platoon leader shouted that grenades had landed inside. He threw himself on the grenade nearest him and his comrades and took the full blast, saving them from serious injury.',
    posthumous: true,
    source: src('kenneth-l-worley'),
  }),
  m({
    abbr: 'LCpl',
    name: 'Jose F. Jimenez',
    rankAtAction: 'Lance Corporal',
    conflict: 'Vietnam War',
    year: 1969,
    story:
      "A fire team leader south of Da Nang, Lance Corporal Jimenez charged concealed North Vietnamese positions when his unit came under heavy attack, silencing an antiaircraft weapon and destroying a trench position from about 10 feet away. He kept pressing the assault under concentrated fire until he was mortally wounded.",
    posthumous: true,
    source: src('jose-f-jimenez'),
  }),
  m({
    abbr: 'LCpl',
    name: 'William Kyle Carpenter',
    rankAtAction: 'Lance Corporal',
    conflict: 'Operation Enduring Freedom',
    year: 2010,
    story:
      'Lance Corporal Carpenter and another Marine were manning a rooftop post at Patrol Base Dakota in Marjah, Afghanistan, when enemy fighters threw grenades and one landed inside their sandbagged position. He moved toward it to shield his fellow Marine and took the brunt of the blast. He was severely wounded but survived, and his comrade lived.',
    posthumous: false,
    source: src('william-k-carpenter'),
  }),

  // ─── Corporal ────────────────────────────────────────────────────────────────
  m({
    abbr: 'Cpl',
    name: 'Tony Stein',
    rankAtAction: 'Corporal',
    conflict: 'World War II',
    year: 1945,
    story:
      'On D-day at Iwo Jima, Corporal Stein used an improvised aircraft machine gun to cover his platoon, then stood up to draw enemy fire and charged pillboxes one after another, killing 20 enemy soldiers. Running low on ammunition, he made eight trips back to the beach under fire, helping a wounded man back on each one.',
    posthumous: true,
    source: src('tony-stein'),
  }),
  m({
    abbr: 'Cpl',
    name: 'Hershel W. "Woody" Williams',
    rankAtAction: 'Corporal',
    conflict: 'World War II',
    year: 1945,
    story:
      'When tanks could not clear a path through the pillboxes and mines on Iwo Jima, Corporal Williams went forward with only four riflemen covering him and fought for four hours, returning again and again for demolition charges and fresh flamethrowers. He knocked out one position after another, including one he silenced by putting his flamethrower through its air vent.',
    posthumous: false,
    source: src('hershel-woodrow-woody-williams'),
  }),
  m({
    abbr: 'Cpl',
    name: 'Duane E. Dewey',
    rankAtAction: 'Corporal',
    conflict: 'Korean War',
    year: 1952,
    story:
      'Near Panmunjom, Corporal Dewey, a machine gunner, was already wounded and being treated by a corpsman during a night attack when a grenade landed close by. He pulled the corpsman to the ground, shouted a warning to the Marines around him, and smothered the grenade with his body. He survived.',
    posthumous: false,
    source: src('duane-e-dewey'),
  }),
  m({
    abbr: 'Cpl',
    name: 'Jason L. Dunham',
    rankAtAction: 'Corporal',
    conflict: 'Operation Iraqi Freedom',
    year: 2004,
    story:
      'In Karabilah, Iraq, Corporal Dunham led his squad toward an ambush on his battalion commander\'s convoy. While his Marines searched vehicles, an insurgent attacked him; in the struggle the man released a grenade, and Dunham covered it with his helmet and body, saving at least two fellow Marines. He died of his wounds eight days later.',
    posthumous: true,
    source: src('jason-l-dunham'),
  }),
  m({
    abbr: 'Cpl',
    name: 'Dakota L. Meyer',
    rankAtAction: 'Corporal',
    conflict: 'Operation Enduring Freedom',
    year: 2009,
    story:
      'When a patrol was ambushed by more than 50 fighters near Ganjgal, Afghanistan, and four U.S. team members were cut off, Corporal Meyer took the exposed gunner\'s position on a gun-truck and drove into the kill zone again and again. On those trips he and his driver brought out about two dozen Afghan soldiers, and he kept going back after being wounded to search for the missing Americans.',
    posthumous: false,
    source: src('dakota-l-meyer'),
  }),

  // ─── Sergeant ────────────────────────────────────────────────────────────────
  m({
    abbr: 'Sgt',
    name: 'John Basilone',
    rankAtAction: 'Sergeant',
    conflict: 'World War II',
    year: 1942,
    story:
      'On Guadalcanal, Sergeant Basilone was in charge of two sections of heavy machine guns when a Japanese assault knocked out one section, leaving only two men. He moved an extra gun into place, repaired and manned another, and held the line; later, with ammunition nearly gone and supply lines cut, he fought his way through enemy lines to bring shells to his gunners.',
    posthumous: false,
    source: src('john-manila-john-basilone'),
  }),
  m({
    abbr: 'Sgt',
    name: 'Darrell S. Cole',
    rankAtAction: 'Sergeant',
    conflict: 'World War II',
    year: 1945,
    story:
      'Leading a machine-gun section in the first wave at Iwo Jima, Sergeant Cole destroyed two enemy emplacements with grenades on the way toward Airfield No. 1. When three pillboxes stopped his unit and his gun jammed, he went forward alone with a pistol and a single grenade, making three trips under fire to destroy the strongpoint. He was killed in the action.',
    posthumous: true,
    source: src('darrell-s-cole'),
  }),
  m({
    abbr: 'Sgt',
    name: 'Daniel P. Matthews',
    rankAtAction: 'Sergeant',
    conflict: 'Korean War',
    year: 1953,
    story:
      'During a counterattack on Vegas Hill, Sergeant Matthews saw a wounded Marine lying in the open where a corpsman could not reach him. He climbed onto the rock wall around the enemy machine gun and charged it alone, killing two of its crew and silencing it, so the wounded man could be carried to safety. He died of his wounds before help arrived.',
    posthumous: true,
    source: src('daniel-p-matthews'),
  }),
  m({
    abbr: 'Sgt',
    name: 'Lawrence D. Peters',
    rankAtAction: 'Sergeant',
    conflict: 'Vietnam War',
    year: 1967,
    story:
      'During Operation Swift, Sergeant Peters led his squad against an enemy-held knoll and stood in the open to point out targets. Wounded four times, he kept directing his men and stood up in full view to draw out hidden enemy positions until he lost consciousness and died. Inspired by him, his squad regained the upper hand and pressed the attack.',
    posthumous: true,
    source: src('lawrence-d-peters'),
  }),
  m({
    abbr: 'Sgt',
    name: 'Rodney M. Davis',
    rankAtAction: 'Sergeant',
    conflict: 'Vietnam War',
    year: 1967,
    story:
      'Sergeant Davis was the right guide of a platoon pinned in a trench line by a larger North Vietnamese force in Quang Nam Province, moving man to man to encourage his Marines while firing and throwing grenades. When an enemy grenade landed among them, he threw himself on it, saving his comrades and helping his platoon hold its position.',
    posthumous: true,
    source: src('rodney-m-davis'),
  }),

  // ─── Staff Sergeant ──────────────────────────────────────────────────────────
  m({
    abbr: 'SSgt',
    name: 'William J. Bordelon',
    rankAtAction: 'Staff Sergeant',
    conflict: 'World War II',
    year: 1943,
    story:
      'An assault engineer at Tarawa, Staff Sergeant Bordelon landed under fire that killed all but four men in his amphibian tractor, then made demolition charges and knocked out two pillboxes. Wounded, he covered Marines climbing the seawall and pulled two wounded men from the water before attacking a fourth machine-gun position alone, where he was killed.',
    posthumous: true,
    source: src('william-j-bordelon'),
  }),
  m({
    abbr: 'SSgt',
    name: 'Archie Van Winkle',
    rankAtAction: 'Staff Sergeant',
    conflict: 'Korean War',
    year: 1950,
    story:
      'When enemy troops broke through the center of his line near Sudong at night, Staff Sergeant Van Winkle led a charge that let his platoon regain fire superiority. With one arm useless from a wound, he ran through heavy fire to reunite an isolated squad and, hit again by a grenade in the chest, kept giving orders until he was carried off unconscious.',
    posthumous: false,
    source: src('archie-van-winkle'),
  }),
  m({
    abbr: 'SSgt',
    name: 'Robert S. Kennemore',
    rankAtAction: 'Staff Sergeant',
    conflict: 'Korean War',
    year: 1950,
    story:
      "North of Yudam-ni, with his company's perimeter overrun at night and his platoon commander badly wounded, Staff Sergeant Kennemore took command and reorganized the defense. When a grenade landed among a machine-gun squad, he put his foot on it and absorbed the blast to protect his Marines. He survived.",
    posthumous: false,
    source: src('robert-s-kennemore'),
  }),
  m({
    abbr: 'SSgt',
    name: 'Ambrosio Guillen',
    rankAtAction: 'Staff Sergeant',
    conflict: 'Korean War',
    year: 1953,
    story:
      'Staff Sergeant Guillen led his platoon in defending an outpost at Songuch-on against an attack by roughly two enemy battalions, exposing himself to direct the fight and the care of the wounded. Critically wounded, he refused aid and kept leading until the enemy was driven off, and he died within a few hours.',
    posthumous: true,
    source: src('ambrosio-guillen'),
  }),
  m({
    abbr: 'SSgt',
    name: 'Peter S. Connor',
    rankAtAction: 'Staff Sergeant',
    conflict: 'Vietnam War',
    year: 1966,
    story:
      'Leading his platoon in Quang Ngai Province, Staff Sergeant Connor pulled the pin on a grenade to drop into an enemy spider hole and found its fuse had already started burning. Unable to reach the hole in time or throw it without hitting his own men, he held it against his body to absorb the explosion and was mortally wounded.',
    posthumous: true,
    source: src('peter-s-connor'),
  }),

  // ─── Gunnery Sergeant ────────────────────────────────────────────────────────
  m({
    abbr: 'GySgt',
    name: 'Daniel J. Daly',
    rankAtAction: 'Gunnery Sergeant',
    conflict: 'Haitian Campaign',
    year: 1915,
    story:
      'On a mounted reconnaissance out of Fort Liberte, Haiti, Gunnery Sergeant Daly\'s detachment of about 35 Marines was ambushed at night by some 400 Cacos while crossing a river. The Marines fought to a defensible spot, held it through the night, and scattered the attackers at dawn. It was the second Medal of Honor for Daly, who also earned one as a private in China in 1900.',
    posthumous: false,
    source: src('daniel-j-daly-1'),
  }),
  m({
    abbr: 'GySgt',
    name: 'Ernest A. Janson (served as Charles F. Hoffman)',
    rankAtAction: 'Gunnery Sergeant',
    conflict: 'World War I',
    year: 1918,
    story:
      'Just after his company took Hill 142 near Chateau-Thierry, Gunnery Sergeant Janson spotted 12 German soldiers with five light machine guns crawling toward his position. He raised the alarm, charged them, bayoneted the two leaders, and drove off the rest, who left their guns behind. He received both the Army and Navy Medals of Honor for the act.',
    posthumous: false,
    source: src('charles-f-hoffman'),
  }),
  m({
    abbr: 'GySgt',
    name: 'Robert G. Robinson',
    rankAtAction: 'Gunnery Sergeant',
    conflict: 'World War I',
    year: 1918,
    story:
      'An aerial observer with the 1st Marine Aviation Force, Gunnery Sergeant Robinson\'s plane was cut off and attacked by 12 enemy fighters over Pittham, Belgium. After downing one, he was shot through the elbow and his gun jammed; he cleared it with one hand and kept fighting until two more wounds made him collapse.',
    posthumous: false,
    source: src('robert-g-robinson'),
  }),
  m({
    abbr: 'GySgt',
    name: 'Robert H. McCard',
    rankAtAction: 'Gunnery Sergeant',
    conflict: 'World War II',
    year: 1944,
    story:
      'When enemy artillery knocked out his tank on Saipan, Gunnery Sergeant McCard ordered his crew out the escape hatch and covered them by throwing grenades in the open. Seriously wounded and out of grenades, he pulled a machine gun from the tank and kept firing, killing 16 enemy soldiers and giving his life so his crew could get away.',
    posthumous: true,
    source: src('robert-h-mccard'),
  }),
  m({
    abbr: 'GySgt',
    name: 'Johnny L. Canley',
    rankAtAction: 'Gunnery Sergeant',
    conflict: 'Vietnam War',
    year: 1968,
    story:
      'As company gunnery sergeant during the fight for Hue City, Gunnery Sergeant Canley took command after his commanding officer was badly wounded and led the company for three days, clearing buildings room by room. Wounded himself, he repeatedly carried wounded Marines out of the line of fire, including twice scaling a wall in full view of the enemy.',
    posthumous: false,
    source: src('johnny-l-canley'),
  }),

  // ─── First Sergeant ──────────────────────────────────────────────────────────
  m({
    abbr: '1stSgt',
    name: 'Roswell Winans',
    rankAtAction: 'First Sergeant',
    conflict: 'Dominican Campaign',
    year: 1916,
    story:
      'At Guayacanas in the Dominican Republic, after the Marine machine gunner at the front was wounded twice, First Sergeant Winans brought up a Colt machine gun and set it in a very exposed spot facing the rebel trenches. When it jammed he stood up under heavy fire to fix it, and kept firing until the enemy pulled back, even as seven men nearby were wounded and one killed.',
    posthumous: false,
    source: src('roswell-winans'),
  }),

  // ─── Second Lieutenant ───────────────────────────────────────────────────────
  m({
    abbr: '2ndLt',
    name: 'John H. Leims',
    rankAtAction: 'Second Lieutenant',
    conflict: 'World War II',
    year: 1945,
    story:
      'Commanding a company on Iwo Jima, Second Lieutenant Leims took a fortified hill, then personally strung telephone wire across open ground to his cut-off forward platoons. After pulling his men back on orders, he learned wounded Marines had been left behind and went back into the dark under machine-gun fire twice, carrying two of them to safety.',
    posthumous: false,
    source: src('john-h-leims'),
  }),
  m({
    abbr: '2ndLt',
    name: 'Robert D. Reem',
    rankAtAction: 'Second Lieutenant',
    conflict: 'Korean War',
    year: 1950,
    story:
      'Near Chinhung-ni, Second Lieutenant Reem led his platoon up a ridge three times against heavy fire and was preparing a fourth attack when an enemy grenade landed among him and his non-commissioned officers. He jumped on it and absorbed the blast so his small-unit leaders could carry on the fight.',
    posthumous: true,
    source: src('robert-d-reem'),
  }),
  m({
    abbr: '2ndLt',
    name: 'George H. Ramer',
    rankAtAction: 'Second Lieutenant',
    conflict: 'Korean War',
    year: 1951,
    story:
      'Second Lieutenant Ramer led his platoon up a steep, heavily defended hill and, though he and most of his men were wounded, took the summit with eight Marines left. When a strong counterattack came, he ordered the others to withdraw with three fatally wounded comrades, covered them alone, and held his post until he was killed.',
    posthumous: true,
    source: src('george-h-ramer'),
  }),
  m({
    abbr: '2ndLt',
    name: 'John P. Bobo',
    rankAtAction: 'Second Lieutenant',
    conflict: 'Vietnam War',
    year: 1967,
    story:
      "When a reinforced North Vietnamese company hit his company's command group in Quang Tri Province, Second Lieutenant Bobo organized the defense and got a rocket team firing on enemy machine guns. After a mortar round severed his right leg below the knee, he refused evacuation, had himself placed in a firing position with a belt as a tourniquet, and covered the group's move until he was killed.",
    posthumous: true,
    source: src('john-p-bobo'),
  }),
  m({
    abbr: '2ndLt',
    name: 'Terrence C. Graves',
    rankAtAction: 'Second Lieutenant',
    conflict: 'Vietnam War',
    year: 1968,
    story:
      'Leading an eight-man force reconnaissance patrol in Quang Tri Province, Second Lieutenant Graves called in air and artillery support through repeated firefights with a larger enemy force and was wounded himself. At the extraction site he sent the first helicopter away when he saw one wounded Marine had not boarded, and stayed behind with him to direct supporting fire.',
    posthumous: true,
    source: src('terrence-c-graves'),
  }),

  // ─── First Lieutenant ────────────────────────────────────────────────────────
  m({
    abbr: '1stLt',
    name: 'Jack Lummus',
    rankAtAction: 'First Lieutenant',
    conflict: 'World War II',
    year: 1945,
    story:
      'After two days of continuous fighting on Iwo Jima, First Lieutenant Lummus moved out ahead of his platoon to attack a network of enemy positions. Knocked down by one grenade blast and wounded in the shoulders by another, he kept going and destroyed one emplacement after another in a one-man assault.',
    posthumous: true,
    source: src('jack-lummus'),
  }),
  m({
    abbr: '1stLt',
    name: 'Baldomero Lopez',
    rankAtAction: 'First Lieutenant',
    conflict: 'Korean War',
    year: 1950,
    story:
      'Landing with the assault waves at Inchon, First Lieutenant Lopez was about to throw a grenade into a pillbox when enemy fire hit him in the shoulder and chest, and he dropped it. Too badly hurt to grip and throw it, he pulled the grenade under his body to protect his Marines.',
    posthumous: true,
    source: src('baldomero-lopez'),
  }),
  m({
    abbr: '1stLt',
    name: 'Frank S. Reasoner',
    rankAtAction: 'First Lieutenant',
    conflict: 'Vietnam War',
    year: 1965,
    story:
      'First Lieutenant Reasoner was leading a reconnaissance patrol deep in enemy territory near Da Nang when it was hit by an estimated 50 to 100 Viet Cong. He organized covering fire and silenced an automatic weapon, and when his radio operator was hit a second time, he ran through machine-gun fire to reach him and was killed.',
    posthumous: true,
    source: src('frank-s-reasoner'),
  }),
  m({
    abbr: '1stLt',
    name: 'Wesley L. Fox',
    rankAtAction: 'First Lieutenant',
    conflict: 'Vietnam War',
    year: 1969,
    story:
      'Commanding Company A in the A Shau Valley, First Lieutenant Fox was wounded along with nearly his whole command group when a large hidden force attacked. He kept directing the company, knocked out an enemy position himself, coordinated air support, and, wounded again in the final assault, refused treatment until his casualties were cared for.',
    posthumous: false,
    source: src('wesley-l-fox'),
  }),

  // ─── Captain ─────────────────────────────────────────────────────────────────
  m({
    abbr: 'Capt',
    name: 'Joseph J. Foss',
    rankAtAction: 'Captain',
    conflict: 'World War II',
    year: 1942,
    story:
      'Flying with Marine Fighting Squadron 121 at Guadalcanal, Captain Foss shot down 23 Japanese aircraft between October and November 1942, and three more in January 1943, while also leading many escort missions. He later led a small mixed flight against a much larger enemy force and broke up its attack.',
    posthumous: false,
    source: src('joseph-j-foss'),
  }),
  m({
    abbr: 'Capt',
    name: 'Louis H. Wilson Jr.',
    rankAtAction: 'Captain',
    conflict: 'World War II',
    year: 1944,
    story:
      'At Fonte Hill on Guam, Captain Wilson led his company 300 yards up open ground under heavy fire to take its objective, then took charge of other scattered units and set the night defense despite being wounded three times. He then held the position through a series of savage enemy counterattacks.',
    posthumous: false,
    source: src('louis-h-wilson'),
  }),
  m({
    abbr: 'Capt',
    name: 'William E. Barber',
    rankAtAction: 'Captain',
    conflict: 'Korean War',
    year: 1950,
    story:
      "Captain Barber's Fox Company was ordered to hold a three-mile mountain pass on the only route between Yudam-ni and Hagaru-ri near the Chosin Reservoir. Surrounded by a regiment-sized force after the first night, he asked to stand fast if supplied by air rather than withdraw, and held the pass from 28 November to 2 December 1950.",
    posthumous: false,
    source: src('william-e-barber'),
  }),
  m({
    abbr: 'Capt',
    name: 'Carl L. Sitter',
    rankAtAction: 'Captain',
    conflict: 'Korean War',
    year: 1950,
    story:
      'Captain Sitter fought his company through enemy-held ground to reinforce his battalion at Hagaru-ri, taking 25 percent casualties on the way. The next morning he led his depleted men up a frozen hill held by a regiment-sized force that overlooked the whole valley and the route of withdrawing Marines.',
    posthumous: false,
    source: src('carl-l-sitter'),
  }),
  m({
    abbr: 'Capt',
    name: 'James E. Livingston',
    rankAtAction: 'Captain',
    conflict: 'Vietnam War',
    year: 1968,
    story:
      'At Dai Do, Captain Livingston led Company E across 500 meters of open rice paddy under heavy fire to attack the fortified village, which the enemy had seized the evening before, cutting off another Marine company. He moved to wherever resistance was heaviest, encouraging his Marines and adjusting supporting fire.',
    posthumous: false,
    source: src('james-e-livingston'),
  }),

  // ─── Major ───────────────────────────────────────────────────────────────────
  m({
    abbr: 'Maj',
    name: 'Smedley D. Butler',
    rankAtAction: 'Major',
    conflict: 'Haitian Campaign',
    year: 1915,
    story:
      'Major Butler led several Marine and sailor detachments in the attack on Fort Riviere, Haiti, an old French fort held by Caco fighters. Finding a small gap in the south wall, he signaled the assault, and Marines poured through to take the fort in hand-to-hand fighting. It was his second Medal of Honor, after Vera Cruz in 1914.',
    posthumous: false,
    source: src('smedley-d-butler'),
  }),
  m({
    abbr: 'Maj',
    name: 'Kenneth D. Bailey',
    rankAtAction: 'Major',
    conflict: 'World War II',
    year: 1942,
    story:
      'Commanding a company of the 1st Marine Raider Battalion during the Japanese attack on Henderson Field, Guadalcanal, Major Bailey covered the forced withdrawal of the main line and helped reorganize the troops. Despite a severe head wound, he led his men in hand-to-hand fighting for 10 hours until the attack was beaten back and the airfield held.',
    posthumous: true,
    source: src('kenneth-d-bailey'),
  }),
  m({
    abbr: 'Maj',
    name: 'Gregory "Pappy" Boyington',
    rankAtAction: 'Major',
    conflict: 'World War II',
    year: 1943,
    story:
      'Commanding Marine Fighting Squadron 214 in the central Solomons, Major Boyington once circled the enemy airfield at Kahili with 24 fighters to dare its 60 grounded planes to come up; his pilots shot down 20 without losing one. He personally destroyed 26 enemy aircraft during his command.',
    posthumous: false,
    source: src('gregory-pappy-boyington'),
  }),
  m({
    abbr: 'Maj',
    name: 'Henry A. Courtney Jr.',
    rankAtAction: 'Major',
    conflict: 'World War II',
    year: 1945,
    story:
      'Ordered to hold for the night behind Sugar Loaf Hill on Okinawa, Major Courtney judged that attacking first was safer than waiting for a counterattack and led his small force forward, blasting caves on the way. Reinforced with 26 men and a load of grenades, he took the crest and attacked a large enemy force forming less than 100 yards away.',
    posthumous: true,
    source: src('henry-a-courtney'),
  }),

  // ─── Lieutenant Colonel ──────────────────────────────────────────────────────
  m({
    abbr: 'LtCol',
    name: 'Harold W. Bauer',
    rankAtAction: 'Lieutenant Colonel',
    conflict: 'World War II',
    year: 1942,
    story:
      'Commanding Marine Fighting Squadron 212, Lieutenant Colonel Bauer flew in the defense of Guadalcanal and shot down five enemy aircraft in two battles. After leading a 600-mile ferry flight, he spotted enemy planes attacking the USS McFarland as he came in to land, attacked the whole squadron alone, and destroyed four before lack of fuel forced him down.',
    posthumous: true,
    source: src('harold-william-indian-joe-bauer'),
  }),
  m({
    abbr: 'LtCol',
    name: 'Aquilla J. Dyess',
    rankAtAction: 'Lieutenant Colonel',
    conflict: 'World War II',
    year: 1944,
    story:
      'Commanding the 1st Battalion, 24th Marines on Namur Island, Lieutenant Colonel Dyess placed himself between the lines to point out objectives and led his advance units from the front. He was killed by machine-gun fire while standing on an antitank trench directing a flanking attack on the last enemy position.',
    posthumous: true,
    source: src('aquilla-james-big-red-dyess'),
  }),
  m({
    abbr: 'LtCol',
    name: 'Justice M. Chambers',
    rankAtAction: 'Lieutenant Colonel',
    conflict: 'World War II',
    year: 1945,
    story:
      'Landing right behind the first assault waves on Iwo Jima, Lieutenant Colonel Chambers found his battalion taking heavy losses from cliffs on its flank. He reorganized his men under fire and led them against the high ground the enemy was firing from, leading his battalion through three days of heavy fighting.',
    posthumous: false,
    source: src('justice-m-chambers'),
  }),
  m({
    abbr: 'LtCol',
    name: 'Raymond G. Davis',
    rankAtAction: 'Lieutenant Colonel',
    conflict: 'Korean War',
    year: 1950,
    story:
      "Near the Chosin Reservoir, Lieutenant Colonel Davis led his battalion eight miles over icy ridges at night to relieve a surrounded rifle company and seize the mountain pass two Marine regiments needed to get out. He held the pass, with all his wounded, until both regiments came through, then brought his battalion into Hagaru-ri intact.",
    posthumous: false,
    source: src('raymond-g-davis'),
  }),

  // ─── Colonel ─────────────────────────────────────────────────────────────────
  m({
    abbr: 'Col',
    name: 'Merritt A. Edson',
    rankAtAction: 'Colonel',
    conflict: 'World War II',
    year: 1942,
    story:
      'With about 800 Raiders and parachutists, Colonel Edson defended the ridge overlooking the Guadalcanal airfield against a major Japanese night attack. When the enemy broke through, he pulled his forward units back to a reserve line with few losses and held through repeated assaults that turned into hand-to-hand fighting.',
    posthumous: false,
    source: src('merritt-austin-red-mike-edson'),
  }),
  m({
    abbr: 'Col',
    name: 'David M. Shoup',
    rankAtAction: 'Colonel',
    conflict: 'World War II',
    year: 1943,
    story:
      'Commanding all Marine troops on Betio Island, Tarawa, Colonel Shoup was stunned by a shell and wounded in the leg soon after landing. He led his troops across the reef under heavy fire, took command of everyone ashore, and directed the fight without rest.',
    posthumous: false,
    source: src('david-m-shoup'),
  }),

  // ─── Major General ───────────────────────────────────────────────────────────
  m({
    abbr: 'MajGen',
    name: 'Alexander A. Vandegrift',
    rankAtAction: 'Major General',
    conflict: 'World War II',
    year: 1942,
    story:
      'Major General Vandegrift commanded the 1st Marine Division in the first U.S. landings in the Solomon Islands and the months of fighting that followed on Guadalcanal, eventually leading sea, land and air forces of three services. Against weather, disease and a determined enemy, his command held under constant bombardment.',
    posthumous: false,
    source: src('alexander-a-vandegrift'),
  }),
];

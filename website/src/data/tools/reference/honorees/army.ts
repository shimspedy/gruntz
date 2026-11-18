/**
 * U.S. Army Medal of Honor recipients shown on each Army rank page, keyed by the rank
 * held at the time of the action (Rank.abbr). Up to five per rank. Stories are written
 * fresh from the official citations; each source is the recipient's page on cmohs.org.
 */
import type { Honoree } from '../../types';

const cmohs = (slug: string) => ({ label: 'Congressional Medal of Honor Society', url: `https://www.cmohs.org/recipients/${slug}` });

export const honorees: Honoree[] = [
  // ─── Private (PVT) ───────────────────────────────────────────────────────────
  {
    branch: 'army', abbr: 'PVT', name: 'Jacob Parrott', rankAtAction: 'Private', conflict: 'Civil War', year: 1862,
    story: 'Parrott, of the 33d Ohio Infantry, was one of the volunteers who went nearly 200 miles into Confederate territory and seized a train at Big Shanty, Georgia, to wreck the rail line between Chattanooga and Atlanta.',
    posthumous: false, source: cmohs('jacob-parrott'),
  },
  {
    branch: 'army', abbr: 'PVT', name: 'Henry Johnson', rankAtAction: 'Private', conflict: 'World War I', year: 1918,
    story: 'Johnson, of the 369th Infantry Regiment, was on sentry duty at a forward outpost in France when the enemy attacked. When a badly wounded fellow soldier was being carried off, Johnson, gravely wounded himself, fought the two captors hand to hand with only a knife and rescued him, then kept holding back the larger enemy force.',
    posthumous: true, source: cmohs('henry-johnson'),
  },
  {
    branch: 'army', abbr: 'PVT', name: 'Joe P. Martinez', rankAtAction: 'Private', conflict: 'World War II', year: 1943,
    story: 'On Attu in the Aleutian Islands, an attack on a snow-covered mountain position had stalled under heavy fire. Martinez, an automatic rifleman, stood up and pushed forward, urging others to follow, and cleared enemy positions with his rifle and grenades as he climbed. He was mortally wounded near the top after leading the advance through the pass.',
    posthumous: true, source: cmohs('joe-p-martinez'),
  },
  {
    branch: 'army', abbr: 'PVT', name: 'George T. Sakato', rankAtAction: 'Private', conflict: 'World War II', year: 1944,
    story: 'Near Biffontaine, France, Sakato charged an enemy strongpoint and inspired his platoon to follow. When his squad leader was killed during a counterattack, he took charge of the squad and helped stop the enemy, using a captured rifle and pistol. In the action he killed 12 enemy soldiers and took four prisoners.',
    posthumous: false, source: cmohs('george-taro-joe-sakato'),
  },
  {
    branch: 'army', abbr: 'PVT', name: 'Barney F. Hajiro', rankAtAction: 'Private', conflict: 'World War II', year: 1944,
    story: 'Over three actions near Bruyeres and Biffontaine, France, in October 1944, Hajiro exposed himself to enemy fire to support attacking troops and, with one comrade, ambushed an enemy patrol. On 29 October he started an attack up a heavily defended slope and knocked out two machine-gun nests.',
    posthumous: false, source: cmohs('barney-f-hajiro'),
  },

  // ─── Private First Class (PFC) ───────────────────────────────────────────────
  {
    branch: 'army', abbr: 'PFC', name: 'Desmond T. Doss', rankAtAction: 'Private First Class', conflict: 'World War II', year: 1945,
    story: 'Doss, a company medic who would not carry a weapon, stayed on top of a 400-foot escarpment on Okinawa after heavy fire drove his battalion back. He carried the wounded one by one to the edge and lowered them down the cliff on a rope litter. Weeks later, badly wounded himself, he gave up his place on a stretcher to a more seriously hurt man.',
    posthumous: false, source: cmohs('desmond-t-doss'),
  },
  {
    branch: 'army', abbr: 'PFC', name: 'Sadao S. Munemori', rankAtAction: 'Private First Class', conflict: 'World War II', year: 1945,
    story: 'Near Seravezza, Italy, Munemori took over his squad when its leader was wounded and knocked out two machine guns with grenades in one-man attacks. As he returned to a shell crater sheltering two of his men, an enemy grenade landed there, and he threw himself on it, saving both soldiers.',
    posthumous: true, source: cmohs('sadao-s-munemori'),
  },
  {
    branch: 'army', abbr: 'PFC', name: 'Herbert K. Pililaau', rankAtAction: 'Private First Class', conflict: 'Korean War', year: 1951,
    story: 'On Heartbreak Ridge his platoon ran low on ammunition and was ordered to pull back. Pililaau volunteered to stay and cover the withdrawal, firing until his ammunition was gone, then throwing grenades and finally fighting hand to hand until he was killed.',
    posthumous: true, source: cmohs('herbert-k-pililaau'),
  },
  {
    branch: 'army', abbr: 'PFC', name: 'Milton L. Olive III', rankAtAction: 'Private First Class', conflict: 'Vietnam War', year: 1965,
    story: 'Olive was moving through the jungle with four other soldiers while chasing Viet Cong fighters when a grenade landed among them. He grabbed it and fell on it, taking the blast and saving the lives of the men around him.',
    posthumous: true, source: cmohs('milton-l-olive'),
  },
  {
    branch: 'army', abbr: 'PFC', name: 'Ross A. McGinnis', rankAtAction: 'Private First Class', conflict: 'Operation Iraqi Freedom', year: 2006,
    story: 'McGinnis was the .50-caliber gunner in a Humvee on patrol in Baghdad when an insurgent threw a grenade through the gunner\'s hatch. He shouted a warning, then dropped into the vehicle and covered the grenade with his body, saving the four other soldiers inside.',
    posthumous: true, source: cmohs('ross-a-mcginnis'),
  },

  // ─── Specialist (SPC) ────────────────────────────────────────────────────────
  {
    branch: 'army', abbr: 'SPC', name: 'Daniel Fernandez', rankAtAction: 'Specialist Fourth Class', conflict: 'Vietnam War', year: 1966,
    story: 'When his patrol was ambushed and forced back before it could reach a wounded soldier, Fernandez and three other volunteers fought their way through heavy fire to bring him in. An enemy grenade landed among them, and Fernandez threw himself on it, saving the lives of the men around him.',
    posthumous: true, source: cmohs('daniel-o-fernandez'),
  },
  {
    branch: 'army', abbr: 'SPC', name: 'Salvatore A. Giunta', rankAtAction: 'Specialist', conflict: 'Operation Enduring Freedom', year: 2007,
    story: 'When his squad was ambushed in Afghanistan, Giunta ran through heavy fire to pull his fallen squad leader to cover and treat him. Pushing forward, he saw two insurgents carrying away an American soldier and stopped them, recovering the soldier.',
    posthumous: false, source: cmohs('salvatore-a-giunta'),
  },
  {
    branch: 'army', abbr: 'SPC', name: 'Kyle J. White', rankAtAction: 'Specialist', conflict: 'Operation Enduring Freedom', year: 2007,
    story: 'White was briefly knocked unconscious by a rocket-propelled grenade when his patrol was ambushed in Afghanistan. He then crossed open ground under fire to give first aid to a wounded soldier and to a wounded Marine, and when their radios failed he found a working one to call for support.',
    posthumous: false, source: cmohs('kyle-j-white'),
  },
  {
    branch: 'army', abbr: 'SPC', name: 'Ty M. Carter', rankAtAction: 'Specialist', conflict: 'Operation Enduring Freedom', year: 2009,
    story: 'When an estimated 300 fighters attacked Combat Outpost Keating in Afghanistan, Carter ran twice through 100 meters of enemy fire to resupply ammunition. Though wounded, he then went through heavy fire to reach a critically wounded soldier pinned down in the open and gave him life-saving first aid.',
    posthumous: false, source: cmohs('ty-m-carter'),
  },

  // ─── Corporal (CPL) ──────────────────────────────────────────────────────────
  {
    branch: 'army', abbr: 'CPL', name: 'Alvin C. York', rankAtAction: 'Corporal', conflict: 'World War I', year: 1918,
    story: 'In the Argonne, after his platoon took heavy losses and three other noncommissioned officers went down, York took command. Leading seven men, he charged a machine-gun nest that was pinning down the platoon, took it, and captured four officers, 128 men and several guns.',
    posthumous: false, source: cmohs('alvin-c-york'),
  },
  {
    branch: 'army', abbr: 'CPL', name: 'Tibor Rubin', rankAtAction: 'Corporal', conflict: 'Korean War', year: 1950,
    story: 'Rubin was left behind to hold a hill alone while his unit fell back to the Pusan Perimeter, and he slowed the enemy advance for a full day. Later captured, he spent more than two years as a prisoner of war, risking his life to find food and care for fellow prisoners.',
    posthumous: false, source: cmohs('tibor-rubin'),
  },
  {
    branch: 'army', abbr: 'CPL', name: 'Mitchell Red Cloud Jr.', rankAtAction: 'Corporal', conflict: 'Korean War', year: 1950,
    story: 'Red Cloud was the first to spot Chinese troops charging his company\'s command post and gave the alarm. Badly wounded, he refused help, pulled himself up against a tree and kept firing until he was killed, which kept the enemy from overrunning his company and gained it time.',
    posthumous: true, source: cmohs('mitchell-red-cloud'),
  },
  {
    branch: 'army', abbr: 'CPL', name: 'Hiroshi H. Miyamura', rankAtAction: 'Corporal', conflict: 'Korean War', year: 1951,
    story: 'Miyamura, a machine-gun squad leader, leapt from cover and fought hand to hand with his bayonet when an enemy attack threatened to overrun his position. He then ordered his squad to fall back while he stayed behind to cover them.',
    posthumous: false, source: cmohs('hiroshi-miyamura'),
  },
  {
    branch: 'army', abbr: 'CPL', name: 'Rodolfo P. Hernandez', rankAtAction: 'Corporal', conflict: 'Korean War', year: 1951,
    story: 'On Hill 420, his platoon ran short of ammunition under a heavy attack and had to pull back. Hernandez, already wounded, kept firing until his rifle jammed, then charged the enemy with his bayonet until he fell unconscious from his wounds, briefly halting the enemy advance.',
    posthumous: false, source: cmohs('rodolfo-p-hernandez'),
  },

  // ─── Sergeant (SGT) ──────────────────────────────────────────────────────────
  {
    branch: 'army', abbr: 'SGT', name: 'William H. Carney', rankAtAction: 'Sergeant', conflict: 'Civil War', year: 1863,
    story: 'In the assault on Fort Wagner, South Carolina, Carney caught the flag when the color sergeant was shot down and planted it on the fort\'s parapet. When the troops fell back he carried the flag out, though twice badly wounded.',
    posthumous: false, source: cmohs('william-h-carney'),
  },
  {
    branch: 'army', abbr: 'SGT', name: 'William Shemin', rankAtAction: 'Sergeant', conflict: 'World War I', year: 1918,
    story: 'Near Bazoches, France, Shemin left cover three times and crossed 150 yards of open ground under machine-gun and rifle fire to rescue wounded men. After the officers and senior sergeants were hit, he took command of the platoon until he was wounded himself.',
    posthumous: true, source: cmohs('william-shemin'),
  },
  {
    branch: 'army', abbr: 'SGT', name: 'Ola L. Mize', rankAtAction: 'Sergeant', conflict: 'Korean War', year: 1953,
    story: 'Mize was defending Outpost Harry when the enemy launched a heavy attack. He went through the barrage with a medic to rescue a wounded soldier on a listening post, then set up a defense of the main position and inflicted heavy losses on the attackers.',
    posthumous: false, source: cmohs('ola-l-mize'),
  },
  {
    branch: 'army', abbr: 'SGT', name: 'Matthew O. Williams', rankAtAction: 'Sergeant', conflict: 'Operation Enduring Freedom', year: 2008,
    story: 'In Afghanistan\'s Shok Valley, the lead element of his assault force was pinned down on a sheer mountainside with several casualties. Williams led a counterattack across an icy river and up the terraced slope to reach them, then helped defend them and get the wounded out.',
    posthumous: false, source: cmohs('matthew-o-williams'),
  },

  // ─── Staff Sergeant (SSG) ────────────────────────────────────────────────────
  {
    branch: 'army', abbr: 'SSG', name: 'Ruben Rivers', rankAtAction: 'Staff Sergeant', conflict: 'World War II', year: 1944,
    story: 'Rivers, a tank commander, was badly wounded when his tank hit a mine near Guebling, France. He refused morphine and evacuation, took over another tank and kept fighting until 19 November, when his tank was hit and he was killed.',
    posthumous: true, source: cmohs('ruben-rivers'),
  },
  {
    branch: 'army', abbr: 'SSG', name: 'Roy P. Benavidez', rankAtAction: 'Staff Sergeant', conflict: 'Vietnam War', year: 1968,
    story: 'When a 12-man Special Forces team west of Loc Ninh was cut off with every member killed or wounded, Benavidez jumped from a hovering helicopter and ran to them under heavy fire. Wounded many times, he recovered classified documents, carried the wounded to the helicopters, and saved the lives of at least eight men.',
    posthumous: false, source: cmohs('roy-p-benavidez'),
  },
  {
    branch: 'army', abbr: 'SSG', name: 'David G. Bellavia', rankAtAction: 'Staff Sergeant', conflict: 'Operation Iraqi Freedom', year: 2004,
    story: 'During fighting in Iraq, a squad from Bellavia\'s platoon was trapped in a house by insurgents firing from a fortified position. He took an automatic weapon into the doorway and covered the squad as it got out, then went back into the house alone and fought the insurgents inside.',
    posthumous: false, source: cmohs('david-g-bellavia'),
  },
  {
    branch: 'army', abbr: 'SSG', name: 'Jared C. Monti', rankAtAction: 'Staff Sergeant', conflict: 'Operation Enduring Freedom', year: 2006,
    story: 'When a larger enemy force attacked his patrol in eastern Afghanistan, Monti called in artillery and organized the defense. He tried three times to reach a wounded soldier lying in the open and was mortally wounded on the last attempt.',
    posthumous: true, source: cmohs('jared-c-monti'),
  },
  {
    branch: 'army', abbr: 'SSG', name: 'Clinton L. Romesha', rankAtAction: 'Staff Sergeant', conflict: 'Operation Enduring Freedom', year: 2009,
    story: 'When an estimated 300 fighters attacked Combat Outpost Keating in Afghanistan from all sides, Romesha knocked out an enemy machine-gun team and was wounded by shrapnel while taking on a second. He then led his team forward 100 meters under heavy fire to recover the fallen and keep them out of enemy hands.',
    posthumous: false, source: cmohs('clinton-l-romesha'),
  },

  // ─── Sergeant First Class (SFC) ──────────────────────────────────────────────
  {
    branch: 'army', abbr: 'SFC', name: 'Bennie G. Adkins', rankAtAction: 'Sergeant First Class', conflict: 'Vietnam War', year: 1966,
    story: 'During a 38-hour battle at Camp A Shau, Adkins ran through heavy fire to man a mortar, carried wounded soldiers to safety and held off repeated attacks, suffering 18 wounds. After the last helicopter had left, he led a small group through 48 hours of evading the enemy until they were rescued.',
    posthumous: false, source: cmohs('bennie-g-adkins'),
  },
  {
    branch: 'army', abbr: 'SFC', name: 'Randall D. Shughart', rankAtAction: 'Sergeant First Class', conflict: 'Somalia', year: 1993,
    story: 'In Mogadishu, Shughart and Master Sergeant Gary Gordon volunteered to be put on the ground to protect four critically wounded crew members at a downed helicopter, knowing enemy fighters were closing in. They held off the attackers until they were killed, and the pilot survived.',
    posthumous: true, source: cmohs('randall-d-shughart'),
  },
  {
    branch: 'army', abbr: 'SFC', name: 'Paul R. Smith', rankAtAction: 'Sergeant First Class', conflict: 'Operation Iraqi Freedom', year: 2003,
    story: 'In Iraq, a company-sized enemy force attacked his task force while it built a holding area for prisoners. With over 100 soldiers at risk, Smith organized a defense, then manned a .50-caliber machine gun on a damaged armored vehicle and kept firing from that exposed position until he was mortally wounded.',
    posthumous: true, source: cmohs('paul-r-smith'),
  },
  {
    branch: 'army', abbr: 'SFC', name: 'Alwyn C. Cashe', rankAtAction: 'Sergeant First Class', conflict: 'Operation Iraqi Freedom', year: 2005,
    story: 'When a roadside bomb set his Bradley on fire in Iraq, Cashe pulled out the driver, and his fuel-soaked uniform caught fire. Badly burned, he went back to the burning vehicle and helped four more of his soldiers escape.',
    posthumous: true, source: cmohs('alwyn-c-cashe'),
  },
  {
    branch: 'army', abbr: 'SFC', name: 'Thomas P. Payne', rankAtAction: 'Sergeant First Class', conflict: 'Operation Inherent Resolve', year: 2015,
    story: 'During a hostage rescue raid near Hawija, Iraq, Payne led his team through one building and freed 38 hostages. He then went into a second, burning building under fire with bolt cutters, cutting the locks and going back in until 37 more hostages were freed.',
    posthumous: false, source: cmohs('thomas-p-payne'),
  },

  // ─── Master Sergeant (MSG) ───────────────────────────────────────────────────
  {
    branch: 'army', abbr: 'MSG', name: 'Woodrow W. Keeble', rankAtAction: 'Master Sergeant', conflict: 'Korean War', year: 1951,
    story: 'Keeble, acting as a platoon leader, saw the attack on Hill 765 stopped by three fortified enemy positions. He crawled forward alone and attacked the enemy positions at close range with grenades and rifle fire.',
    posthumous: true, source: cmohs('woodrow-w-keeble'),
  },
  {
    branch: 'army', abbr: 'MSG', name: 'Gary I. Gordon', rankAtAction: 'Master Sergeant', conflict: 'Somalia', year: 1993,
    story: 'In Mogadishu, Gordon and Sergeant First Class Randall Shughart asked three times to be inserted at a downed helicopter to protect its critically wounded crew. Low on ammunition, he gave some to the pilot and fought on until he was killed, and his actions saved the pilot\'s life.',
    posthumous: true, source: cmohs('gary-i-gordon'),
  },

  // ─── First Sergeant (1SG) ────────────────────────────────────────────────────
  {
    branch: 'army', abbr: '1SG', name: 'Leonard A. Funk Jr.', rankAtAction: 'First Sergeant', conflict: 'World War II', year: 1945,
    story: 'At Holzheim, Belgium, Funk\'s company took about 80 prisoners, who were left under a small guard. An enemy patrol freed them and ordered Funk to surrender; he pretended to comply, then opened fire and called on the other Americans to grab the enemy\'s weapons, and the Germans were killed, wounded or captured.',
    posthumous: false, source: cmohs('leonard-a-funk'),
  },
  {
    branch: 'army', abbr: '1SG', name: 'Maximo Yabes', rankAtAction: 'First Sergeant', conflict: 'Vietnam War', year: 1967,
    story: 'When a battalion-sized force attacked his company and grenades landed in the command post, Yabes shouted a warning and shielded others with his body. Though badly wounded, he kept firing so the command group could move, then attacked and destroyed an enemy machine gun before he was mortally wounded.',
    posthumous: true, source: cmohs('maximo-yabes'),
  },
  {
    branch: 'army', abbr: '1SG', name: 'David H. McNerney', rankAtAction: 'First Sergeant', conflict: 'Vietnam War', year: 1967,
    story: 'When a North Vietnamese battalion attacked his company and its commander was killed, McNerney took command though wounded. With no smoke grenades left, he marked the position for aircraft under fire and climbed a tree to tie an identification panel to its top branches, then refused evacuation and stayed with his men.',
    posthumous: false, source: cmohs('david-h-mcnerney'),
  },

  // ─── Sergeant Major (SGM) ────────────────────────────────────────────────────
  {
    branch: 'army', abbr: 'SGM', name: 'Abraham Cohn', rankAtAction: 'Sergeant Major', conflict: 'Civil War', year: 1864,
    story: 'Cohn, sergeant major of the 6th New Hampshire Infantry, rallied and organized scattered troops from several regiments under heavy fire in the Battle of the Wilderness. Later at Petersburg he carried orders to the front line under severe fire.',
    posthumous: false, source: cmohs('abraham-cohn'),
  },
  {
    branch: 'army', abbr: 'SGM', name: 'Christian A. Fleetwood', rankAtAction: 'Sergeant Major', conflict: 'Civil War', year: 1864,
    story: 'Fleetwood was sergeant major of the 4th U.S. Colored Infantry at Chapin\'s Farm, Virginia. After two color bearers were shot down, he took up the flag and carried it through the rest of the fight.',
    posthumous: false, source: cmohs('christian-a-fleetwood'),
  },

  // ─── Chief Warrant Officer 5 (CW5) ───────────────────────────────────────────
  {
    branch: 'army', abbr: 'CW5', name: 'Eric A. Slover', rankAtAction: 'Chief Warrant Officer Five', conflict: 'Operation Absolute Resolve', year: 2026,
    story: 'Slover flew the lead MH-47 helicopter through air defenses and a mountain valley in bad weather to land troops in Venezuela. Machine guns opened up at close range as he touched down and he was hit four times in the leg, but he held the aircraft in place until the force was off. He then positioned the helicopter so his door gunner could silence the guns firing on the troops.',
    posthumous: false, source: cmohs('eric-a-slover'),
  },

  // ─── Second Lieutenant (2LT) ─────────────────────────────────────────────────
  {
    branch: 'army', abbr: '2LT', name: 'Ernest Childers', rankAtAction: 'Second Lieutenant', conflict: 'World War II', year: 1943,
    story: 'Childers was already nursing a fractured foot when he led eight men up a hill in Italy toward enemy machine-gun nests. He killed two snipers, wiped out the crew of one nest, and with his men took out the second.',
    posthumous: false, source: cmohs('ernest-chief-childers'),
  },
  {
    branch: 'army', abbr: '2LT', name: 'Audie L. Murphy', rankAtAction: 'Second Lieutenant', conflict: 'World War II', year: 1945,
    story: 'Near Holtzwihr, France, with his company attacked by tanks and infantry, Murphy sent his men back and stayed forward directing artillery. He climbed onto a burning tank destroyer and used its machine gun to hold off the enemy for an hour, wounded in the leg, then rejoined his company and led a counterattack that drove the Germans back.',
    posthumous: false, source: cmohs('audie-l-murphy'),
  },
  {
    branch: 'army', abbr: '2LT', name: 'Daniel K. Inouye', rankAtAction: 'Second Lieutenant', conflict: 'World War II', year: 1945,
    story: 'In Italy, Inouye crawled to within five yards of a machine gun holding up his platoon and destroyed it with grenades, then took out a second. Shot by a sniper, he kept fighting until a grenade shattered his right arm, and he still refused evacuation.',
    posthumous: false, source: cmohs('daniel-k-inouye'),
  },
  {
    branch: 'army', abbr: '2LT', name: 'Darwin K. Kyle', rankAtAction: 'Second Lieutenant', conflict: 'Korean War', year: 1951,
    story: 'When his platoon was pinned down on Hill 185, Kyle moved among his men under fire to get them advancing again, then charged a machine gun alone and killed its crew. Leading a bayonet charge against another position, he was killed.',
    posthumous: true, source: cmohs('darwin-k-kyle'),
  },
  {
    branch: 'army', abbr: '2LT', name: 'Robert J. Hibbs', rankAtAction: 'Second Lieutenant', conflict: 'Vietnam War', year: 1966,
    story: 'Hibbs led a 15-man ambush patrol that set off mines against an advancing Viet Cong company, then covered his patrol from the open road. On the way back he led a charge through a second enemy company, and he was killed after going back for a wounded soldier.',
    posthumous: true, source: cmohs('robert-j-hibbs'),
  },

  // ─── First Lieutenant (1LT) ──────────────────────────────────────────────────
  {
    branch: 'army', abbr: '1LT', name: 'Arthur MacArthur Jr.', rankAtAction: 'First Lieutenant & Adjutant', conflict: 'Civil War', year: 1863,
    story: 'At Missionary Ridge, Tennessee, MacArthur seized his regiment\'s colors at a critical moment and planted them on the captured enemy works at the crest of the ridge.',
    posthumous: false, source: cmohs('arthur-macarthur'),
  },
  {
    branch: 'army', abbr: '1LT', name: 'John R. Fox', rankAtAction: 'First Lieutenant', conflict: 'World War II', year: 1944,
    story: 'Fox was a forward observer in Sommocolonia, Italy, when enemy troops took most of the town. He called artillery closer and closer, and finally onto his own position, and the fire inflicted heavy losses and delayed the enemy advance at the cost of his life.',
    posthumous: true, source: cmohs('john-r-fox'),
  },
  {
    branch: 'army', abbr: '1LT', name: 'Garlin M. Conner', rankAtAction: 'First Lieutenant', conflict: 'World War II', year: 1945,
    story: 'Near Houssen, France, Conner, just back from recovering from an earlier wound, unrolled telephone wire 400 yards through artillery fire into the path of a German counterattack backed by tanks. For three hours he stayed in that exposed spot directing artillery, at one point onto his own position, until the attack was stopped.',
    posthumous: true, source: cmohs('garlin-m-conner'),
  },
  {
    branch: 'army', abbr: '1LT', name: 'Vernon J. Baker', rankAtAction: 'First Lieutenant', conflict: 'World War II', year: 1945,
    story: 'In the attack on Castle Aghinolfi, Italy, Baker personally destroyed German machine-gun positions, an observation post and a dugout. When his company was ordered back he covered the withdrawal of the wounded, and the next night he volunteered to lead a battalion advance.',
    posthumous: false, source: cmohs('vernon-j-baker'),
  },

  // ─── Captain (CPT) ───────────────────────────────────────────────────────────
  {
    branch: 'army', abbr: 'CPT', name: 'Humbert R. Versace', rankAtAction: 'Captain', conflict: 'Vietnam War', year: 1963,
    story: 'Versace, wounded, fought until his strength and ammunition gave out before he was captured by the Viet Cong. For two years as a prisoner he led his fellow Americans, resisted interrogation and tried to escape three times, until he was executed.',
    posthumous: true, source: cmohs('humbert-roque-rocky-versace'),
  },
  {
    branch: 'army', abbr: 'CPT', name: 'Roger H. C. Donlon', rankAtAction: 'Captain', conflict: 'Vietnam War', year: 1964,
    story: 'Donlon commanded a Special Forces team when a reinforced Viet Cong battalion attacked Camp Nam Dong before dawn. Wounded several times during the five-hour battle, he moved from position to position under fire, directing the defense and helping the wounded, until the camp held.',
    posthumous: false, source: cmohs('roger-h-donlon'),
  },
  {
    branch: 'army', abbr: 'CPT', name: 'Ed W. Freeman', rankAtAction: 'Captain', conflict: 'Vietnam War', year: 1965,
    story: 'In the Ia Drang Valley, after the landing zone was closed to medical evacuation flights because of heavy fire, Freeman flew his unarmed helicopter in again and again. Over 14 missions he brought in supplies and flew out an estimated 30 seriously wounded soldiers.',
    posthumous: false, source: cmohs('ed-w-freeman'),
  },
  {
    branch: 'army', abbr: 'CPT', name: 'William D. Swenson', rankAtAction: 'Captain', conflict: 'Operation Enduring Freedom', year: 2009,
    story: 'When more than 60 fighters ambushed his team in the Afghan village of Ganjgal, Swenson called in air and artillery support and medical evacuation under fire. He then led a team in an unarmored vehicle into the kill zone to recover the wounded and the fallen.',
    posthumous: false, source: cmohs('william-d-swenson'),
  },
  {
    branch: 'army', abbr: 'CPT', name: 'Florent A. Groberg', rankAtAction: 'Captain', conflict: 'Operation Enduring Freedom', year: 2012,
    story: 'Groberg was leading a security detail in Afghanistan when he spotted a man wearing a suicide vest approaching the formation. He and another soldier pushed the bomber away, and the vest went off outside the formation, which kept the toll far lower than it would have been.',
    posthumous: false, source: cmohs('florent-a-groberg'),
  },

  // ─── Major (MAJ) ─────────────────────────────────────────────────────────────
  {
    branch: 'army', abbr: 'MAJ', name: 'Charles W. Whittlesey', rankAtAction: 'Major', conflict: 'World War I', year: 1918,
    story: 'Whittlesey\'s command was cut off from its division for five days in the Argonne Forest. Surrounded by a larger force, he held the position he had been ordered to take and kept his men together.',
    posthumous: false, source: cmohs('charles-w-whittlesey'),
  },
  {
    branch: 'army', abbr: 'MAJ', name: 'Charles S. Kettles', rankAtAction: 'Major', conflict: 'Vietnam War', year: 1967,
    story: 'Near Duc Pho, Kettles flew helicopters into heavy fire to bring in reinforcements and evacuate the wounded of an airborne unit. When he learned eight soldiers had been left behind, he flew back to the landing zone with no supporting fire and brought them out.',
    posthumous: false, source: cmohs('charles-s-kettles'),
  },
  {
    branch: 'army', abbr: 'MAJ', name: 'Patrick H. Brady', rankAtAction: 'Major', conflict: 'Vietnam War', year: 1968,
    story: 'Brady flew a medical evacuation helicopter through thick fog and heavy fire to reach wounded soldiers in enemy-held ground. Over the course of the day he used three helicopters and flew out 51 seriously wounded men.',
    posthumous: false, source: cmohs('patrick-h-brady'),
  },

  // ─── Lieutenant Colonel (LTC) ────────────────────────────────────────────────
  {
    branch: 'army', abbr: 'LTC', name: 'Theodore Roosevelt', rankAtAction: 'Lieutenant Colonel', conflict: 'Spanish-American War', year: 1898,
    story: 'With only a handful of men at first, Roosevelt led a charge up San Juan Hill in Cuba through heavy fire, urging his troops on across open ground.',
    posthumous: true, source: cmohs('theodore-roosevelt'),
  },
  {
    branch: 'army', abbr: 'LTC', name: 'Robert G. Cole', rankAtAction: 'Lieutenant Colonel', conflict: 'World War II', year: 1944,
    story: 'Cole\'s paratroopers were pinned down by heavy fire while forcing the last bridges on the road to Carentan, France, days after D-Day. He ordered a bayonet charge and led it himself, overrunning the enemy position.',
    posthumous: true, source: cmohs('robert-g-cole'),
  },
  {
    branch: 'army', abbr: 'LTC', name: 'Keith L. Ware', rankAtAction: 'Lieutenant Colonel', conflict: 'World War II', year: 1944,
    story: 'Near Sigolsheim, France, with one of his companies stopped by heavy fire, Ware went 150 yards ahead of his most forward troops to scout the enemy positions. He spent two hours out there deliberately drawing fire so the enemy would give away its positions, to give his men the courage to press the attack.',
    posthumous: false, source: cmohs('keith-l-ware'),
  },
  {
    branch: 'army', abbr: 'LTC', name: 'Don C. Faith Jr.', rankAtAction: 'Lieutenant Colonel', conflict: 'Korean War', year: 1950,
    story: 'Faith commanded a battalion surrounded east of the Chosin Reservoir. He led counterattacks to restore his lines, then directed the breakout across the frozen reservoir and the movement of trucks full of wounded, until he was mortally wounded.',
    posthumous: true, source: cmohs('don-c-faith'),
  },

  // ─── Colonel (COL) ───────────────────────────────────────────────────────────
  {
    branch: 'army', abbr: 'COL', name: 'Joshua L. Chamberlain', rankAtAction: 'Colonel', conflict: 'Civil War', year: 1863,
    story: 'At Gettysburg, Chamberlain\'s regiment held its position on Little Round Top against repeated Confederate assaults. He then took the advance position on Big Round Top.',
    posthumous: false, source: cmohs('joshua-l-chamberlain'),
  },
  {
    branch: 'army', abbr: 'COL', name: 'Demas T. Craw', rankAtAction: 'Colonel', conflict: 'World War II', year: 1942,
    story: 'During the landings in French Morocco, Craw volunteered to go ashore with the first wave and cross the lines to reach the French commander and arrange an end to the fighting. He was killed in the attempt.',
    posthumous: true, source: cmohs('demas-thurlow-nick-craw'),
  },

  // ─── Brigadier General (BG) ──────────────────────────────────────────────────
  {
    branch: 'army', abbr: 'BG', name: 'Oliver O. Howard', rankAtAction: 'Brigadier General', conflict: 'Civil War', year: 1862,
    story: 'At Fair Oaks, Virginia, Howard led the 61st New York Infantry in a charge and was hit twice in the right arm. The wounds cost him the arm.',
    posthumous: false, source: cmohs('oliver-o-howard'),
  },
  {
    branch: 'army', abbr: 'BG', name: 'Kenneth N. Walker', rankAtAction: 'Brigadier General, Air Corps', conflict: 'World War II', year: 1943,
    story: 'As commander of 5th Bomber Command in the Pacific, Walker flew with his crews on missions deep into enemy territory and developed new bombing tactics from what he learned. He led a daylight attack on shipping at Rabaul that hit nine enemy vessels, and his plane was forced down by enemy fighters.',
    posthumous: true, source: cmohs('kenneth-n-walker'),
  },
  {
    branch: 'army', abbr: 'BG', name: 'Theodore Roosevelt Jr.', rankAtAction: 'Brigadier General', conflict: 'World War II', year: 1944,
    story: 'After asking three times, Roosevelt was allowed to land with the first wave at Utah Beach on D-Day. He led group after group off the beach, over the seawall and inland under fire.',
    posthumous: true, source: cmohs('theodore-roosevelt-1'),
  },
  {
    branch: 'army', abbr: 'BG', name: 'Frederick W. Castle', rankAtAction: 'Brigadier General, Air Corps', conflict: 'World War II', year: 1944,
    story: 'Castle led more than 2,000 heavy bombers against German airfields on Christmas Eve 1944. When engine trouble and fighter attacks crippled his bomber, he would not drop his bombs over friendly troops to gain speed, and he stayed at the controls so his crew could bail out until the bomber went down.',
    posthumous: true, source: cmohs('frederick-w-castle'),
  },

  // ─── Major General (MG) ──────────────────────────────────────────────────────
  {
    branch: 'army', abbr: 'MG', name: 'Daniel E. Sickles', rankAtAction: 'Major General', conflict: 'Civil War', year: 1863,
    story: 'At Gettysburg, Sickles commanded the Union III Corps against a heavy Confederate attack. He kept contesting the enemy advance and encouraging his troops after he was severely wounded.',
    posthumous: false, source: cmohs('daniel-e-sickles'),
  },
];

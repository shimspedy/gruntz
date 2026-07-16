import type { FitnessTestType, ServiceBranch } from '../types';

export interface TestEventDefinition {
  id: string;
  name: string;
  shortName: string;
  unit: 'reps' | 'seconds' | 'pounds' | 'meters';
  direction: 'higher' | 'lower';
  baseline: number;
  target: number;
  alternatives?: string[];
}

export interface MilitaryTestDefinition {
  id: FitnessTestType;
  name: string;
  branch: ServiceBranch;
  effectiveLabel: string;
  sourceLabel: string;
  sourceUrl: string;
  events: TestEventDefinition[];
}

export const militaryTests: Record<FitnessTestType, MilitaryTestDefinition> = {
  army_aft: {
    id: 'army_aft', name: 'Army Fitness Test', branch: 'army', effectiveLabel: 'Verify against current Army policy',
    sourceLabel: 'Official Army fitness guidance', sourceUrl: 'https://www.army.mil/fitness/',
    events: [
      { id: 'deadlift', name: 'Three-Repetition Maximum Deadlift', shortName: 'Deadlift', unit: 'pounds', direction: 'higher', baseline: 140, target: 240 },
      { id: 'pushups', name: 'Hand-Release Push-Ups', shortName: 'HR Push-Ups', unit: 'reps', direction: 'higher', baseline: 10, target: 40 },
      { id: 'sdc', name: 'Sprint-Drag-Carry', shortName: 'SDC', unit: 'seconds', direction: 'lower', baseline: 210, target: 120 },
      { id: 'plank', name: 'Plank', shortName: 'Plank', unit: 'seconds', direction: 'higher', baseline: 90, target: 180 },
      { id: 'two_mile', name: 'Two-Mile Run', shortName: '2-Mile', unit: 'seconds', direction: 'lower', baseline: 1320, target: 900 },
    ],
  },
  marine_pft: {
    id: 'marine_pft', name: 'Marine Corps PFT', branch: 'marines', effectiveLabel: '2026 policy lane',
    sourceLabel: 'USMC PFT/CFT standards', sourceUrl: 'https://www.fitness.marines.mil/PFT-CFT_Standards17/',
    events: [
      { id: 'pullups', name: 'Pull-Ups', shortName: 'Pull-Ups', unit: 'reps', direction: 'higher', baseline: 3, target: 20, alternatives: ['Push-up option'] },
      { id: 'plank', name: 'Plank', shortName: 'Plank', unit: 'seconds', direction: 'higher', baseline: 90, target: 225 },
      { id: 'three_mile', name: 'Three-Mile Run', shortName: '3-Mile', unit: 'seconds', direction: 'lower', baseline: 1680, target: 1200, alternatives: ['Row option when authorized'] },
    ],
  },
  marine_cft: {
    id: 'marine_cft', name: 'Marine Corps CFT', branch: 'marines', effectiveLabel: '2026 policy lane',
    sourceLabel: 'USMC PFT/CFT standards', sourceUrl: 'https://www.fitness.marines.mil/PFT-CFT_Standards17/',
    events: [
      { id: 'movement', name: 'Movement to Contact', shortName: 'MTC', unit: 'seconds', direction: 'lower', baseline: 240, target: 150 },
      { id: 'ammo_lifts', name: 'Ammunition Can Lifts', shortName: 'Ammo Lifts', unit: 'reps', direction: 'higher', baseline: 40, target: 100 },
      { id: 'maneuver', name: 'Maneuver Under Fire', shortName: 'MANUF', unit: 'seconds', direction: 'lower', baseline: 240, target: 150 },
    ],
  },
  navy_prt: {
    id: 'navy_prt', name: 'Navy PRT', branch: 'navy', effectiveLabel: 'Verify against current PRP guides',
    sourceLabel: 'MyNavy HR Physical Readiness', sourceUrl: 'https://www.mynavyhr.navy.mil/Support-Services/Culture-Resilience/Physical-Readiness/',
    events: [
      { id: 'pushups', name: 'Push-Ups', shortName: 'Push-Ups', unit: 'reps', direction: 'higher', baseline: 20, target: 60 },
      { id: 'plank', name: 'Forearm Plank', shortName: 'Plank', unit: 'seconds', direction: 'higher', baseline: 90, target: 210 },
      { id: 'run', name: '1.5-Mile Run', shortName: '1.5-Mile', unit: 'seconds', direction: 'lower', baseline: 900, target: 600, alternatives: ['2,000 m row', '500 yd swim', '450 m swim'] },
    ],
  },
  air_force_pfra: {
    id: 'air_force_pfra', name: 'Air Force Physical Fitness Readiness Assessment', branch: 'air_force', effectiveLabel: 'Effective March 2026',
    sourceLabel: 'Official DAF fitness guidance', sourceUrl: 'https://www.afpc.af.mil/Career-Management/Fitness-Program/',
    events: [
      { id: 'pushups', name: 'Muscular Strength Event', shortName: 'Strength', unit: 'reps', direction: 'higher', baseline: 20, target: 60, alternatives: ['1-min push-ups', '2-min hand-release push-ups'] },
      { id: 'core', name: 'Core Endurance Event', shortName: 'Core', unit: 'reps', direction: 'higher', baseline: 30, target: 55, alternatives: ['Sit-ups', 'Cross-leg reverse crunch', 'Forearm plank'] },
      { id: 'two_mile', name: 'Two-Mile Run', shortName: '2-Mile', unit: 'seconds', direction: 'lower', baseline: 1320, target: 900, alternatives: ['20 m HAMR'] },
    ],
  },
  space_force_hpa: {
    id: 'space_force_hpa', name: 'Space Force Human Performance Assessment', branch: 'space_force', effectiveLabel: 'Effective January 2026',
    sourceLabel: 'Official Space Force HPA guidance', sourceUrl: 'https://www.vandenberg.spaceforce.mil/News/Article-Display/Article/4371955/space-force-publishes-further-guidance-on-physical-fitness/',
    events: [
      { id: 'pushups', name: 'Muscular Strength Event', shortName: 'Strength', unit: 'reps', direction: 'higher', baseline: 20, target: 60, alternatives: ['Tempo push-ups', 'Hand-release push-ups'] },
      { id: 'core', name: 'Core Endurance Event', shortName: 'Core', unit: 'seconds', direction: 'higher', baseline: 90, target: 210, alternatives: ['Sit-ups', 'Cross-leg reverse crunch', 'Forearm plank'] },
      { id: 'two_mile', name: 'Two-Mile Run', shortName: '2-Mile', unit: 'seconds', direction: 'lower', baseline: 1320, target: 900, alternatives: ['20 m HAMR; one annual HPA must use the 2-mile run'] },
    ],
  },
  coast_guard_pft: {
    id: 'coast_guard_pft', name: 'Coast Guard PFT Prep', branch: 'coast_guard', effectiveLabel: 'Preparation estimate',
    sourceLabel: 'Official Coast Guard readiness resources', sourceUrl: 'https://www.dcms.uscg.mil/',
    events: [
      { id: 'pushups', name: 'Push-Ups', shortName: 'Push-Ups', unit: 'reps', direction: 'higher', baseline: 20, target: 50 },
      { id: 'plank', name: 'Forearm Plank', shortName: 'Plank', unit: 'seconds', direction: 'higher', baseline: 90, target: 180 },
      { id: 'run', name: '1.5-Mile Run', shortName: '1.5-Mile', unit: 'seconds', direction: 'lower', baseline: 900, target: 660, alternatives: ['2,000 m row', '12-minute swim'] },
    ],
  },
  general_readiness: {
    id: 'general_readiness', name: 'General Tactical Readiness', branch: 'general', effectiveLabel: 'Gruntz readiness benchmark',
    sourceLabel: 'Gruntz training benchmark', sourceUrl: 'https://gruntz.app',
    events: [
      { id: 'pushups', name: 'Strict Push-Ups', shortName: 'Push-Ups', unit: 'reps', direction: 'higher', baseline: 15, target: 50 },
      { id: 'plank', name: 'Plank', shortName: 'Plank', unit: 'seconds', direction: 'higher', baseline: 60, target: 180 },
      { id: 'run', name: 'Two-Mile Run', shortName: '2-Mile', unit: 'seconds', direction: 'lower', baseline: 1320, target: 960 },
      { id: 'ruck', name: 'Four-Mile Ruck', shortName: '4-Mile Ruck', unit: 'seconds', direction: 'lower', baseline: 4800, target: 3600 },
    ],
  },
};

export const branchDefaultTest: Record<ServiceBranch, FitnessTestType> = {
  army: 'army_aft', marines: 'marine_pft', navy: 'navy_prt', air_force: 'air_force_pfra',
  space_force: 'space_force_hpa', coast_guard: 'coast_guard_pft', general: 'general_readiness',
};

export function getTestsForBranch(branch: ServiceBranch) {
  return Object.values(militaryTests).filter((test) => test.branch === branch);
}

export function getTestReadiness(test: MilitaryTestDefinition, scores: Record<string, number>) {
  const eventScores = test.events.map((event) => {
    const value = scores[event.id];
    if (!Number.isFinite(value) || value <= 0) return 0;
    const range = Math.max(Math.abs(event.target - event.baseline), 1);
    const raw = event.direction === 'higher'
      ? (value - event.baseline) / range
      : (event.baseline - value) / range;
    return Math.round(Math.max(0, Math.min(1, raw)) * 100);
  });
  return Math.round(eventScores.reduce((sum, score) => sum + score, 0) / eventScores.length);
}

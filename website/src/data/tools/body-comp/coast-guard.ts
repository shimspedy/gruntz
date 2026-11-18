/**
 * U.S. Coast Guard Body Composition Standards Program, as in force in late 2026.
 *
 * Source: COMDTINST 1020.8I, Body Composition Standards Program (31 Mar 2022), which
 * replaced the old Weight and Physical Fitness Standards manual (COMDTINST M1020.8H).
 * ALCOAST 272/26 (Sep 2026) confirms 1020.8I still governs the October 2026 screening
 * and that waist-to-height ratio is NOT used yet; COMDTINST 6100.1 (Jun 2026) replaced
 * only the "boat crew" fitness test step.
 *
 * Screening runs in order, and passing any step makes the member compliant:
 *   1. Maximum Allowable Weight (MAW): the height/weight table below.
 *   2. Maximum Allowable Body Fat (MABF): multi-site tape, chart lookup.
 *   3. Abdominal circumference (AC): at most 39.0 in (men) or 35.5 in (women).
 *   4. PRP Physical Fitness Test: an overall average evaluation mark of 5 (ALCOAST 272/26).
 *
 * Unofficial estimate only. Direct Access is the Coast Guard's system of record.
 */
import type { BodyCompStandard, HeightWeightRow, Sex } from '../types';

/** Enclosure (1), part A. Age- and sex-neutral; built on BMI 19.0 (minimum) and 27.5 (maximum). */
const screeningWeights: HeightWeightRow[] = [
  { heightIn: 58, minLb: 91, maxLb: 131 },
  { heightIn: 59, minLb: 94, maxLb: 136 },
  { heightIn: 60, minLb: 97, maxLb: 141 },
  { heightIn: 61, minLb: 100, maxLb: 145 },
  { heightIn: 62, minLb: 104, maxLb: 150 },
  { heightIn: 63, minLb: 107, maxLb: 155 },
  { heightIn: 64, minLb: 110, maxLb: 160 },
  { heightIn: 65, minLb: 114, maxLb: 165 },
  { heightIn: 66, minLb: 117, maxLb: 170 },
  { heightIn: 67, minLb: 121, maxLb: 175 },
  { heightIn: 68, minLb: 125, maxLb: 180 },
  { heightIn: 69, minLb: 128, maxLb: 186 },
  { heightIn: 70, minLb: 132, maxLb: 191 },
  { heightIn: 71, minLb: 136, maxLb: 197 },
  { heightIn: 72, minLb: 140, maxLb: 202 },
  { heightIn: 73, minLb: 144, maxLb: 208 },
  { heightIn: 74, minLb: 148, maxLb: 214 },
  { heightIn: 75, minLb: 152, maxLb: 220 },
  { heightIn: 76, minLb: 156, maxLb: 225 },
  { heightIn: 77, minLb: 160, maxLb: 231 },
  { heightIn: 78, minLb: 164, maxLb: 237 },
  { heightIn: 79, minLb: 168, maxLb: 244 },
  { heightIn: 80, minLb: 173, maxLb: 250 },
];

/** Enclosure (1), part C: maximum abdominal circumference in inches, any age. */
export const maxAbdominalCircumferenceIn: Record<Sex, number> = { male: 39.0, female: 35.5 };

export const standard: BodyCompStandard = {
  branch: 'coast-guard',
  heightWeight: [
    { sex: 'male', ageMin: 17, ageMax: 99, rows: screeningWeights },
    { sex: 'female', ageMin: 17, ageMax: 99, rows: screeningWeights },
  ],
  // Enclosure (1), part B: "less than 30", "less than 40", "40 or greater".
  bodyFatMax: [
    { sex: 'male', ageMin: 17, ageMax: 29, maxPct: 22 },
    { sex: 'male', ageMin: 30, ageMax: 39, maxPct: 24 },
    { sex: 'male', ageMin: 40, ageMax: 99, maxPct: 26 },
    { sex: 'female', ageMin: 17, ageMax: 29, maxPct: 32 },
    { sex: 'female', ageMin: 30, ageMax: 39, maxPct: 34 },
    { sex: 'female', ageMin: 40, ageMax: 99, maxPct: 36 },
  ],
  method: 'dod-multi-site',
  formula: [
    {
      sex: 'male',
      expression:
        'Circumference value = abdomen - neck (inches, rounded down to the nearest half inch); body fat % is read from the Enclosure (2) men\'s chart by circumference value and height. ' +
        'The chart agrees with %BF = 86.010 x log10(abdomen - neck) - 70.041 x log10(height) + 36.76, rounded to a whole percent.',
    },
    {
      sex: 'female',
      expression:
        'Circumference value = waist + hips - neck (inches, rounded down to the nearest half inch); body fat % is read from the Enclosure (2) women\'s charts by circumference value and height. ' +
        'The charts agree with %BF = 163.205 x log10(waist + hips - neck) - 97.684 x log10(height) - 78.387, rounded to a whole percent.',
    },
  ],
  notes: [
    'Every member is screened each April and October. For October 2026 no community is exempt, and the boat crew PFT shortcut has ended (ALCOAST 272/26).',
    'Below the minimum screening weight means a referral for a medical evaluation, not a failure.',
    'Tape measurements use a Gulick II spring-loaded tape, taken three times and recorded to the nearest half inch. Women\'s hip measurement is taken over undergarments; all others are on skin.',
    'Abdominal circumference is measured on skin just above the top of the hip bone (iliac crest) at the end of a normal breath, three times, with the closest three averaged and rounded down to the nearest half inch.',
    'If the member fails weight, body fat and AC, they may still be compliant by passing the PRP Physical Fitness Test with an overall average evaluation mark of 5 after a medical pre-screening (ALCOAST 272/26).',
    'Members more than 35 lb over their screening weight, more than 8 points over their body fat limit and more than 4 in over the AC limit are not eligible for probation and face separation unless they pass a PFT or get a medical abeyance.',
    'The Coast Guard is reviewing a waist-to-height ratio standard under the December 2025 DoD guidance, but has said it will not be used for October 2026.',
  ],
  provenance: {
    verified: '2026-11-18',
    sources: [
      {
        label: 'COMDTINST 1020.8I, Body Composition Standards Program (31 Mar 2022), Enclosures (1) and (2)',
        url: 'https://media.defense.gov/2022/Mar/31/2002967299/-1/-1/0/CI_1020_8I.PDF',
      },
      {
        label: 'ALCOAST 272/26: October 2026 body composition screening expectations',
        url: 'https://content.govdelivery.com/accounts/USDHSCG/bulletins/427ee4d',
      },
      {
        label: 'ALCOAST 079/26: 1020.8I under review for waist-to-height; existing policy stays in effect',
        url: 'https://content.govdelivery.com/accounts/USDHSCG/bulletins/40fea89',
      },
      {
        label: 'COMDTINST 6100.1, Physical Readiness Program (16 Jun 2026)',
        url: 'https://media.defense.gov/2026/Jun/16/2003949424/-1/-1/0/CI_6100_1.PDF',
      },
    ],
    notes:
      'COMDTINST 1020.8I has returned 404 on media.defense.gov since early 2025, so it was read from an Internet Archive capture of that URL (Feb 2025). ' +
      'ALCOAST 272/26 (Sep 2026) still names 1020.8I and the same four screening steps. ' +
      'The body fat charts in Enclosure (2) are images, not text. Ten cells spread across both charts were checked by hand against the two equations in `formula`, and all matched.',
    unverified: [
      'Body fat equations: 1020.8I prints only charts. The equations matched all ten spot-checked cells; check the full charts before relying on the equation instead of a chart lookup.',
      'The charts cover heights 58 to 79 inches (men\'s circumference values 13.5 to 35.0 in); confirm how values outside the charts are handled.',
      'ALCOAST 272/26 mentions "forthcoming updates" to 1020.8I. Confirm no newer change has been issued since September 2026, especially a move to waist-to-height ratio.',
      'Age bands use "less than 30", "less than 40" and "40 or greater"; confirm which date sets the member\'s age for a screening.',
    ],
  },
};

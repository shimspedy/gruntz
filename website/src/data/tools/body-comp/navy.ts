/**
 * U.S. Navy Body Composition Assessment (BCA), as in force in 2026.
 *
 * Source: Navy Physical Readiness Program Guide-4, Body Composition Assessment (JUN 2026),
 * which carries out the DoD memo "Additional Guidance on Military Fitness Standards"
 * (18 Dec 2025) and NAVADMIN 264/25. The Navy dropped both the height/weight screen and
 * the DoD one-site abdominal equation for 2026. The BCA is now two steps:
 *
 *   Step 1  waist-to-height ratio (WHtR). Within standards at 0.5499 or below.
 *   Step 2  only if Step 1 is 0.5500 or above: body fat percent read from the Guide-4
 *           tables using (height - waist) and body weight. Within standards at or below
 *           26% (men) or 36% (women), any age.
 *
 * Guide-4 publishes Step 2 only as lookup tables, not as an equation, so the tables are
 * reproduced exactly in `bodyFatTable` below (all 18,700 cells, run-length encoded and
 * checked by decoding them back against the extracted PDF text).
 *
 * Unofficial estimate only. PRIMS is the Navy's system of record.
 */
import type { BodyCompStandard, BodyMeasurements, Sex } from '../types';

/**
 * Guide-4 Table-2 (men) and Table-3 (women): estimated body fat percent.
 *
 * One row per height-minus-waist difference (inches, in 0.5 steps):
 *   [difference, lowest weight lb, highest weight lb, body fat % at lowest weight, ...steps]
 * `steps` lists each weight (lb) at which the body fat percent goes up by one point.
 * Weights outside a row's range are outside the printed table.
 */
export const bodyFatTable: Record<Sex, number[][]> = {
  male: [
    [21, 101, 120, 27, 117],
    [21.5, 101, 120, 27],
    [22, 101, 140, 26, 110, 137],
    [22.5, 101, 140, 26, 120],
    [23, 101, 160, 25, 103, 130, 158],
    [23.5, 101, 160, 25, 113, 140],
    [24, 101, 180, 25, 123, 150, 178],
    [24.5, 101, 180, 24, 106, 133, 160],
    [25, 101, 200, 24, 116, 143, 171, 198],
    [25.5, 101, 200, 24, 126, 153, 181],
    [26, 101, 220, 23, 108, 136, 163, 191, 218],
    [26.5, 101, 220, 23, 119, 146, 173, 201],
    [27, 101, 240, 23, 129, 156, 184, 211, 238],
    [27.5, 101, 240, 22, 111, 139, 166, 194, 221],
    [28, 101, 260, 22, 121, 149, 176, 204, 231, 259],
    [28.5, 101, 260, 21, 104, 131, 159, 186, 214, 241],
    [29, 101, 280, 21, 114, 142, 169, 196, 224, 251, 279],
    [29.5, 101, 280, 21, 124, 152, 179, 207, 234, 261],
    [30, 101, 300, 20, 107, 134, 162, 189, 217, 244, 272, 299],
    [30.5, 101, 300, 20, 117, 144, 172, 199, 227, 254, 282],
    [31, 101, 320, 20, 127, 155, 182, 209, 237, 264, 292, 319],
    [31.5, 101, 320, 19, 110, 137, 165, 192, 219, 247, 274, 302],
    [32, 101, 340, 19, 120, 147, 175, 202, 230, 257, 284, 312, 339],
    [32.5, 101, 340, 18, 102, 130, 157, 185, 212, 240, 267, 295, 322],
    [33, 101, 360, 18, 113, 140, 167, 195, 222, 250, 277, 305, 332, 360],
    [33.5, 101, 360, 18, 123, 150, 178, 205, 232, 260, 287, 315, 342],
    [34, 101, 380, 17, 105, 133, 160, 188, 215, 243, 270, 297, 325, 352, 380],
    [34.5, 101, 380, 17, 115, 143, 170, 198, 225, 253, 280, 308, 335, 362],
    [35, 101, 380, 17, 126, 153, 180, 208, 235, 263, 290, 318, 345, 373],
    [35.5, 101, 380, 16, 108, 136, 163, 191, 218, 245, 273, 300, 328, 355],
    [36, 121, 380, 17, 146, 173, 201, 228, 255, 283, 310, 338, 365],
    [36.5, 121, 380, 16, 128, 156, 183, 211, 238, 266, 293, 320, 348, 375],
    [37, 141, 380, 17, 166, 193, 221, 248, 276, 303, 331, 358],
    [37.5, 141, 380, 16, 149, 176, 203, 231, 258, 286, 313, 341, 368],
    [38, 161, 380, 17, 186, 214, 241, 268, 296, 323, 351, 378],
    [38.5, 161, 380, 16, 169, 196, 224, 251, 279, 306, 333, 361],
    [39, 181, 380, 17, 206, 234, 261, 289, 316, 344, 371],
    [39.5, 181, 380, 16, 189, 216, 244, 271, 299, 326, 354],
    [40, 201, 380, 17, 226, 254, 281, 309, 336, 364],
    [40.5, 201, 380, 16, 209, 237, 264, 291, 319, 346, 374],
    [41, 221, 380, 17, 247, 274, 302, 329, 356],
    [41.5, 221, 380, 16, 229, 257, 284, 312, 339, 367],
    [42, 241, 380, 17, 267, 294, 322, 349, 377],
    [42.5, 241, 380, 16, 250, 277, 304, 332, 359],
    [43, 261, 380, 17, 287, 315, 342, 369],
    [43.5, 261, 380, 16, 270, 297, 325, 352, 379],
    [44, 281, 380, 17, 307, 335, 362],
    [44.5, 281, 380, 16, 290, 317, 345, 372],
    [45, 301, 380, 17, 327, 355],
    [45.5, 301, 380, 16, 310, 338, 365],
    [46, 321, 380, 17, 348, 375],
    [46.5, 321, 380, 16, 330, 358],
    [47, 341, 380, 17, 368],
    [47.5, 341, 380, 16, 350, 378],
    [48, 361, 380, 17],
    [48.5, 361, 380, 16, 371],
  ],
  female: [
    [10.5, 61, 80, 37, 73],
    [11, 61, 80, 36, 65, 77],
    [11.5, 61, 80, 36, 69, 80],
    [12, 61, 80, 36, 72],
    [12.5, 61, 80, 35, 64, 76],
    [13, 61, 100, 35, 68, 79, 91],
    [13.5, 61, 100, 35, 71, 83, 95],
    [14, 61, 100, 34, 63, 75, 87, 99],
    [14.5, 61, 100, 34, 67, 79, 90],
    [15, 61, 100, 34, 71, 82, 94],
    [15.5, 61, 120, 33, 62, 74, 86, 98, 109],
    [16, 61, 120, 33, 66, 78, 90, 101, 113],
    [16.5, 61, 120, 33, 70, 81, 93, 105, 117],
    [17, 61, 120, 32, 62, 73, 85, 97, 109, 120],
    [17.5, 61, 120, 32, 65, 77, 89, 101, 112],
    [18, 61, 120, 32, 69, 81, 92, 104, 116],
    [18.5, 61, 140, 32, 72, 84, 96, 108, 120, 131],
    [19, 61, 140, 31, 64, 76, 88, 100, 111, 123, 135],
    [19.5, 61, 140, 31, 68, 80, 92, 103, 115, 127, 139],
    [20, 61, 140, 31, 72, 83, 95, 107, 119, 131],
    [20.5, 61, 140, 30, 64, 75, 87, 99, 111, 122, 134],
    [21, 61, 140, 30, 67, 79, 91, 102, 114, 126, 138],
    [21.5, 61, 160, 30, 71, 83, 94, 106, 118, 130, 141, 153],
    [22, 61, 160, 29, 63, 74, 86, 98, 110, 122, 133, 145, 157],
    [22.5, 61, 160, 29, 66, 78, 90, 102, 113, 125, 137, 149],
    [23, 61, 160, 29, 70, 82, 94, 105, 117, 129, 141, 152],
    [23.5, 61, 160, 28, 62, 74, 85, 97, 109, 121, 132, 144, 156],
    [24, 61, 180, 28, 66, 77, 89, 101, 113, 124, 136, 148, 160, 171],
    [24.5, 61, 180, 28, 69, 81, 93, 104, 116, 128, 140, 152, 163, 175],
    [25, 61, 180, 28, 73, 85, 96, 108, 120, 132, 143, 155, 167, 179],
    [25.5, 61, 180, 27, 65, 76, 88, 100, 112, 124, 135, 147, 159, 171],
    [26, 61, 180, 27, 68, 80, 92, 104, 115, 127, 139, 151, 162, 174],
    [26.5, 61, 200, 27, 72, 84, 96, 107, 119, 131, 143, 154, 166, 178, 190],
    [27, 61, 200, 26, 64, 76, 87, 99, 111, 123, 134, 146, 158, 170, 182, 193],
    [27.5, 61, 200, 26, 67, 79, 91, 103, 115, 126, 138, 150, 162, 173, 185, 197],
    [28, 61, 200, 26, 71, 83, 95, 106, 118, 130, 142, 154, 165, 177, 189],
    [28.5, 61, 200, 25, 63, 75, 87, 98, 110, 122, 134, 145, 157, 169, 181, 192],
    [29, 61, 200, 25, 67, 78, 90, 102, 114, 126, 137, 149, 161, 173, 184, 196],
    [29.5, 61, 220, 25, 70, 82, 94, 106, 117, 129, 141, 153, 164, 176, 188, 200, 212],
    [30, 61, 220, 24, 62, 74, 86, 97, 109, 121, 133, 145, 156, 168, 180, 192, 203, 215],
    [30.5, 61, 220, 24, 66, 78, 89, 101, 113, 125, 136, 148, 160, 172, 184, 195, 207, 219],
    [31, 61, 220, 24, 69, 81, 93, 105, 117, 128, 140, 152, 164, 175, 187, 199, 211],
    [31.5, 61, 220, 24, 73, 85, 97, 108, 120, 132, 144, 156, 167, 179, 191, 203, 214],
    [32, 81, 240, 25, 89, 100, 112, 124, 136, 147, 159, 171, 183, 194, 206, 218, 230],
    [32.5, 81, 240, 25, 92, 104, 116, 127, 139, 151, 163, 175, 186, 198, 210, 222, 233],
    [33, 81, 240, 24, 84, 96, 108, 119, 131, 143, 155, 166, 178, 190, 202, 214, 225, 237],
    [33.5, 81, 240, 24, 88, 99, 111, 123, 135, 147, 158, 170, 182, 194, 205, 217, 229],
    [34, 81, 240, 24, 91, 103, 115, 127, 138, 150, 162, 174, 186, 197, 209, 221, 233],
    [34.5, 101, 240, 25, 107, 119, 130, 142, 154, 166, 177, 189, 201, 213, 224, 236],
    [35, 101, 260, 25, 110, 122, 134, 146, 157, 169, 181, 193, 205, 216, 228, 240, 252],
    [35.5, 101, 260, 24, 102, 114, 126, 138, 149, 161, 173, 185, 196, 208, 220, 232, 244, 255],
    [36, 101, 260, 24, 106, 118, 129, 141, 153, 165, 177, 188, 200, 212, 224, 235, 247, 259],
    [36.5, 101, 260, 24, 110, 121, 133, 145, 157, 168, 180, 192, 204, 216, 227, 239, 251],
    [37, 121, 260, 25, 125, 137, 149, 160, 172, 184, 196, 207, 219, 231, 243, 254],
    [37.5, 121, 280, 25, 129, 140, 152, 164, 176, 187, 199, 211, 223, 235, 246, 258, 270],
    [38, 121, 280, 25, 132, 144, 156, 168, 179, 191, 203, 215, 226, 238, 250, 262, 274],
    [38.5, 121, 280, 24, 124, 136, 148, 159, 171, 183, 195, 207, 218, 230, 242, 254, 265, 277],
    [39, 121, 280, 24, 128, 140, 151, 163, 175, 187, 198, 210, 222, 234, 246, 257, 269],
    [39.5, 121, 280, 24, 131, 143, 155, 167, 179, 190, 202, 214, 226, 237, 249, 261, 273],
    [40, 141, 280, 25, 147, 159, 170, 182, 194, 206, 217, 229, 241, 253, 265, 276],
    [40.5, 141, 300, 25, 151, 162, 174, 186, 198, 209, 221, 233, 245, 256, 268, 280, 292],
    [41, 141, 300, 24, 142, 154, 166, 178, 189, 201, 213, 225, 237, 248, 260, 272, 284, 295],
    [41.5, 141, 300, 24, 146, 158, 170, 181, 193, 205, 217, 228, 240, 252, 264, 276, 287, 299],
    [42, 141, 300, 24, 150, 161, 173, 185, 197, 209, 220, 232, 244, 256, 267, 279, 291],
    [42.5, 161, 300, 25, 165, 177, 189, 200, 212, 224, 236, 247, 259, 271, 283, 295],
    [43, 161, 300, 25, 169, 181, 192, 204, 216, 228, 239, 251, 263, 275, 286, 298],
    [43.5, 161, 300, 25, 172, 184, 196, 208, 219, 231, 243, 255, 267, 278, 290],
    [44, 161, 300, 24, 164, 176, 188, 200, 211, 223, 235, 247, 258, 270, 282, 294],
    [44.5, 161, 300, 24, 168, 180, 191, 203, 215, 227, 239, 250, 262, 274, 286, 297],
    [45, 161, 300, 24, 172, 183, 195, 207, 219, 230, 242, 254, 266, 277, 289],
    [45.5, 181, 300, 25, 187, 199, 211, 222, 234, 246, 258, 269, 281, 293],
    [46, 181, 300, 25, 191, 202, 214, 226, 238, 249, 261, 273, 285, 297],
    [46.5, 181, 300, 24, 182, 194, 206, 218, 230, 241, 253, 265, 277, 288, 300],
    [47, 181, 300, 24, 186, 198, 210, 221, 233, 245, 257, 269, 280, 292],
    [47.5, 181, 300, 24, 190, 202, 213, 225, 237, 249, 260, 272, 284, 296],
    [48, 201, 300, 25, 205, 217, 229, 241, 252, 264, 276, 288, 299],
    [48.5, 201, 300, 25, 209, 221, 232, 244, 256, 268, 279, 291],
    [49, 201, 300, 25, 212, 224, 236, 248, 260, 271, 283, 295],
    [49.5, 201, 300, 24, 204, 216, 228, 240, 251, 263, 275, 287, 299],
    [50, 201, 300, 24, 208, 220, 232, 243, 255, 267, 279, 290],
    [50.5, 201, 300, 24, 212, 223, 235, 247, 259, 271, 282, 294],
    [51, 221, 300, 25, 227, 239, 251, 262, 274, 286, 298],
    [51.5, 221, 300, 25, 231, 242, 254, 266, 278, 290],
    [52, 221, 300, 24, 223, 234, 246, 258, 270, 281, 293],
    [52.5, 221, 300, 24, 226, 238, 250, 262, 273, 285, 297],
    [53, 221, 300, 24, 230, 242, 253, 265, 277, 289],
    [53.5, 241, 300, 25, 245, 257, 269, 281, 292],
    [54, 241, 300, 25, 249, 261, 272, 284, 296],
    [54.5, 241, 300, 25, 253, 264, 276, 288, 300],
    [55, 241, 300, 24, 244, 256, 268, 280, 292],
    [55.5, 241, 300, 24, 248, 260, 272, 283, 295],
    [56, 241, 300, 24, 252, 264, 275, 287, 299],
    [56.5, 261, 300, 25, 267, 279, 291],
    [57, 261, 300, 25, 271, 283, 294],
    [57.5, 261, 300, 24, 263, 274, 286, 298],
    [58, 261, 300, 24, 266, 278, 290],
    [58.5, 261, 300, 24, 270, 282, 294],
    [59, 281, 300, 25, 285, 297],
    [59.5, 281, 300, 25, 289],
    [60, 281, 300, 25, 293],
    [60.5, 281, 300, 24, 285, 296],
    [61, 281, 300, 24, 288, 300],
    [61.5, 281, 300, 24, 292],
  ],
};

/**
 * Reads the Guide-4 table. `heightWaistDiff` must already use the rounded height and
 * waist (half inches); `weightLb` must be rounded to the nearest pound. Returns null when
 * the combination is outside the printed table, where Guide-4 has PRIMS compute the value.
 */
export function navyBodyFatPercent(sex: Sex, heightWaistDiff: number, weightLb: number): number | null {
  const row = bodyFatTable[sex].find((r) => r[0] === heightWaistDiff);
  if (!row) return null;
  const [, wMin, wMax, base, ...steps] = row;
  if (weightLb < wMin || weightLb > wMax) return null;
  return base + steps.filter((w) => w <= weightLb).length;
}

export const standard: BodyCompStandard = {
  branch: 'navy',
  // The Navy no longer screens with height/weight tables (DoD memo of 18 Dec 2025;
  // Guide-4 JUN 2026 has no weight screen). Weight is still recorded for Step 2.
  heightWeight: [],
  bodyFatMax: [
    { sex: 'male', ageMin: 17, ageMax: 99, maxPct: 26 },
    { sex: 'female', ageMin: 17, ageMax: 99, maxPct: 36 },
  ],
  method: 'waist-to-height',
  waistToHeightMax: 0.55,
  // Cut off at four decimals: 0.5499 passes, 0.5500 goes on to the body fat table.
  waistToHeightRule: { decimals: 4, truncate: true, strictlyBelow: true },
  measureRounding: { height: 'half-up', waist: 'half-down' },
  bodyFatAfterRatio: { male: ['weight'], female: ['weight'] },
  formula: [
    {
      sex: 'male',
      expression:
        'Step 1: WHtR = waist / height, cut off (not rounded) at four decimals; 0.5499 or lower passes. ' +
        'Step 2 if 0.5500 or higher: body fat % = Guide-4 Table-2 value for (height - waist) and weight; 26% or lower passes.',
    },
    {
      sex: 'female',
      expression:
        'Step 1: WHtR = waist / height, cut off (not rounded) at four decimals; 0.5499 or lower passes. ' +
        'Step 2 if 0.5500 or higher: body fat % = Guide-4 Table-3 value for (height - waist) and weight; 36% or lower passes.',
    },
  ],
  notes: [
    'Height is taken in socks and rounded up to the nearest half inch, as Guide-4 (JUN 2026) states.',
    'Waist is measured on bare skin at the navel, parallel to the deck, at the end of a normal breath. It is taken twice and each reading rounded down to the nearest half inch; if they differ by more than an inch, a third is taken and the two closest are averaged and rounded down.',
    'Weight is taken in the Navy PT uniform without shoes, rounded to the nearest pound, with no clothing allowance.',
    'Only CFLs or ACFLs may measure, at least two of them, and there are no retests once the official BCA is done. Other methods such as skinfold calipers, underwater weighing, BMI or bioimpedance are not accepted.',
    'High-Performance BCA Exemption (Guide-1, DEC 2025): a Sailor over the body fat limit still gets an overall PFA pass with an overall PRT of Outstanding-Low or better and no event below Excellent-Medium, with all three events actually completed. The BCA is still recorded as not within standards, the Sailor still joins the Fitness Enhancement Program, and the exemption does not apply when the command has excused the PRT (DEP/OP).',
    'Sailors who fail both steps must get medical clearance before taking the PRT.',
  ],
  provenance: {
    verified: '2026-11-18',
    sources: [
      {
        label: 'Navy PRP Guide-4, Body Composition Assessment (JUN 2026)',
        url: 'https://www.mynavyhr.navy.mil/Portals/55/Support/Culture%20Resilience/Physical/Guide-4%20Body%20Composition%20Assessment.pdf',
      },
      {
        label: 'Navy PRP Guide-1, PRP Policies (DEC 2025): BCA and High-Performance BCA Exemption',
        url: 'https://www.mynavyhr.navy.mil/Portals/55/Support/Culture%20Resilience/Physical/Guide-1%20PRP%20Policies.pdf',
      },
      {
        label: 'NAVADMIN 264/25: two-step BCA for CY2026',
        url: 'https://www.mynavyhr.navy.mil/Portals/55/Messages/NAVADMIN/NAV2025/NAV25264.pdf',
      },
      {
        label: 'Under Secretary of War memo: Additional Guidance on Military Fitness Standards (18 Dec 2025)',
        url: 'https://media.defense.gov/2026/Jan/12/2003855613/-1/-1/1/ADDITIONAL-GUIDANCE-ON-MILITARY-FITNESS-STANDARDS.PDF',
      },
    ],
    notes:
      'Guide-4 JUN 2026 was the version on MyNavy HR in October 2026. mynavyhr.navy.mil refuses automated downloads, so it was read from an Internet Archive capture of the official URL (12 Oct 2026). ' +
      'The DoD one-site abdominal equation (DoDI 1308.03, 2022) is no longer the Navy method, so no such equation is given. ' +
      'For checking only: a straight line in (height - waist) and weight reproduces every cell of the women\'s table and nearly every cell of the men\'s; the few misses sit exactly on a rounding boundary. That fit is not published by the Navy and is not used here.',
    unverified: [
      'Height rounding: Guide-4 says round height up to the nearest half inch, while the DoD memo says measurements are rounded down. Confirm which the Navy applies in PRIMS.',
      'Guide-1 was revised in AUG 2026 (not retrievable); confirm the High-Performance BCA Exemption thresholds did not change.',
      'By November 2026 the plain Guide-4 URL returned 404 on MyNavy HR; confirm whether a newer Guide-4 has replaced the JUN 2026 version.',
    ],
  },
};

/** The generic step the calculator calls after a failed ratio: Guide-4 table by (height − waist) and weight. */
export function lookupBodyFat(sex: Sex, m: BodyMeasurements): number | null {
  if (m.weightLb == null || !Number.isFinite(m.weightLb)) return null;
  return navyBodyFatPercent(sex, Math.round((m.heightIn - m.waistIn) * 2) / 2, Math.round(m.weightLb));
}

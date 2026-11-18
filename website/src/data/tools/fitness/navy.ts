/**
 * U.S. Navy Physical Readiness Test (PRT), as in force for calendar year 2026.
 *
 * Every number below is transcribed from Table 4-1 ("PRT Standards Altitudes Less Than
 * 5000 Feet") of the Navy Physical Readiness Program Guide-5A, dated DEC 2025, which
 * NAVADMIN 264/25 names as the PRT reference for CY2026. The tables were extracted from
 * the PDF text programmatically and checked row by row (22 tables x 12 rows).
 *
 * Times are in seconds. Plank times are hold times (higher is better); run, row and
 * swim times are finish times (lower is better). The chart only has the 12 listed
 * rows per event, so a result between two rows earns the lower row's points.
 *
 * Unofficial estimate only. PRIMS is the Navy's system of record for scores.
 */
import type { FitnessEvent, FitnessTest, ScoreBracket } from '../types';

const pushUps: ScoreBracket[] = [
    { sex: 'male', ageMin: 17, ageMax: 19, points: [[92, 100], [91, 95], [86, 90], [82, 85], [79, 80], [76, 75], [68, 70], [60, 65], [51, 60], [49, 55], [46, 50], [42, 45]] },
    { sex: 'female', ageMin: 17, ageMax: 19, points: [[51, 100], [50, 95], [47, 90], [45, 85], [43, 80], [42, 75], [36, 70], [30, 65], [24, 60], [22, 55], [20, 50], [19, 45]] },
    { sex: 'male', ageMin: 20, ageMax: 24, points: [[87, 100], [86, 95], [81, 90], [77, 85], [74, 80], [71, 75], [64, 70], [55, 65], [47, 60], [45, 55], [42, 50], [37, 45]] },
    { sex: 'female', ageMin: 20, ageMax: 24, points: [[48, 100], [47, 95], [44, 90], [43, 85], [40, 80], [39, 75], [33, 70], [28, 65], [21, 60], [20, 55], [17, 50], [16, 45]] },
    { sex: 'male', ageMin: 25, ageMax: 29, points: [[84, 100], [82, 95], [77, 90], [73, 85], [69, 80], [67, 75], [60, 70], [51, 65], [44, 60], [41, 55], [38, 50], [34, 45]] },
    { sex: 'female', ageMin: 25, ageMax: 29, points: [[46, 100], [45, 95], [43, 90], [41, 85], [39, 80], [37, 75], [30, 70], [26, 65], [19, 60], [18, 55], [15, 50], [13, 45]] },
    { sex: 'male', ageMin: 30, ageMax: 34, points: [[80, 100], [78, 95], [74, 90], [69, 85], [67, 80], [64, 75], [57, 70], [48, 65], [41, 60], [38, 55], [35, 50], [31, 45]] },
    { sex: 'female', ageMin: 30, ageMax: 34, points: [[44, 100], [43, 95], [41, 90], [39, 85], [37, 80], [35, 75], [28, 70], [24, 65], [17, 60], [15, 55], [13, 50], [11, 45]] },
    { sex: 'male', ageMin: 35, ageMax: 39, points: [[76, 100], [74, 95], [70, 90], [65, 85], [63, 80], [60, 75], [53, 70], [44, 65], [37, 60], [35, 55], [33, 50], [27, 45]] },
    { sex: 'female', ageMin: 35, ageMax: 39, points: [[43, 100], [42, 95], [39, 90], [37, 85], [35, 80], [34, 75], [26, 70], [22, 65], [14, 60], [13, 55], [11, 50], [9, 45]] },
    { sex: 'male', ageMin: 40, ageMax: 44, points: [[72, 100], [70, 95], [67, 90], [61, 85], [59, 80], [56, 75], [50, 70], [41, 65], [34, 60], [32, 55], [29, 50], [24, 45]] },
    { sex: 'female', ageMin: 40, ageMax: 44, points: [[41, 100], [40, 95], [37, 90], [35, 85], [33, 80], [32, 75], [24, 70], [20, 65], [12, 60], [11, 55], [9, 50], [7, 45]] },
    { sex: 'male', ageMin: 45, ageMax: 49, points: [[68, 100], [66, 95], [63, 90], [57, 85], [54, 80], [52, 75], [46, 70], [37, 65], [32, 60], [28, 55], [25, 50], [21, 45]] },
    { sex: 'female', ageMin: 45, ageMax: 49, points: [[40, 100], [39, 95], [35, 90], [33, 85], [32, 80], [30, 75], [22, 70], [18, 65], [11, 60], [8, 55], [7, 50], [5, 45]] },
    { sex: 'male', ageMin: 50, ageMax: 54, points: [[64, 100], [62, 95], [59, 90], [53, 85], [51, 80], [49, 75], [43, 70], [34, 65], [30, 60], [25, 55], [23, 50], [19, 45]] },
    { sex: 'female', ageMin: 50, ageMax: 54, points: [[38, 100], [37, 95], [33, 90], [31, 85], [30, 80], [28, 75], [20, 70], [16, 65], [10, 60], [6, 55], [5, 50], [2, 45]] },
    { sex: 'male', ageMin: 55, ageMax: 59, points: [[60, 100], [59, 95], [56, 90], [52, 85], [48, 80], [46, 75], [38, 70], [32, 65], [16, 60], [14, 55], [12, 50], [10, 45]] },
    { sex: 'female', ageMin: 55, ageMax: 59, points: [[30, 100], [28, 95], [26, 90], [24, 85], [22, 80], [20, 75], [16, 70], [10, 65], [6, 60], [5, 55], [3, 50], [2, 45]] },
    { sex: 'male', ageMin: 60, ageMax: 64, points: [[57, 100], [56, 95], [52, 90], [48, 85], [46, 80], [44, 75], [32, 70], [23, 65], [14, 60], [12, 55], [10, 50], [8, 45]] },
    { sex: 'female', ageMin: 60, ageMax: 64, points: [[26, 100], [24, 95], [22, 90], [20, 85], [18, 80], [16, 75], [12, 70], [8, 65], [5, 60], [4, 55], [3, 50], [2, 45]] },
    { sex: 'male', ageMin: 65, ageMax: 99, points: [[48, 100], [46, 95], [44, 90], [41, 85], [39, 80], [36, 75], [25, 70], [18, 65], [10, 60], [8, 55], [6, 50], [4, 45]] },
    { sex: 'female', ageMin: 65, ageMax: 99, points: [[22, 100], [20, 95], [18, 90], [16, 85], [14, 80], [12, 75], [9, 70], [6, 65], [4, 60], [3, 55], [2, 50], [1, 45]] },
];

const forearmPlank: ScoreBracket[] = [
    { sex: 'male', ageMin: 17, ageMax: 19, points: [[204, 100], [199, 95], [194, 90], [184, 85], [173, 80], [163, 75], [143, 70], [122, 65], [102, 60], [92, 55], [82, 50], [71, 45]] },
    { sex: 'female', ageMin: 17, ageMax: 19, points: [[194, 100], [189, 95], [184, 90], [173, 85], [163, 80], [153, 75], [133, 70], [112, 65], [92, 60], [82, 55], [71, 50], [61, 45]] },
    { sex: 'male', ageMin: 20, ageMax: 24, points: [[200, 100], [195, 95], [190, 90], [180, 85], [170, 80], [160, 75], [140, 70], [120, 65], [100, 60], [90, 55], [80, 50], [70, 45]] },
    { sex: 'female', ageMin: 20, ageMax: 24, points: [[190, 100], [185, 95], [180, 90], [170, 85], [160, 80], [150, 75], [130, 70], [110, 65], [90, 60], [80, 55], [70, 50], [60, 45]] },
    { sex: 'male', ageMin: 25, ageMax: 29, points: [[196, 100], [191, 95], [186, 90], [176, 85], [167, 80], [157, 75], [137, 70], [118, 65], [98, 60], [88, 55], [78, 50], [69, 45]] },
    { sex: 'female', ageMin: 25, ageMax: 29, points: [[186, 100], [181, 95], [176, 90], [167, 85], [157, 80], [147, 75], [127, 70], [108, 65], [88, 60], [78, 55], [69, 50], [59, 45]] },
    { sex: 'male', ageMin: 30, ageMax: 34, points: [[192, 100], [187, 95], [182, 90], [173, 85], [163, 80], [154, 75], [134, 70], [115, 65], [96, 60], [86, 55], [77, 50], [67, 45]] },
    { sex: 'female', ageMin: 30, ageMax: 34, points: [[182, 100], [178, 95], [173, 90], [163, 85], [154, 80], [144, 75], [125, 70], [106, 65], [86, 60], [77, 55], [67, 50], [58, 45]] },
    { sex: 'male', ageMin: 35, ageMax: 39, points: [[188, 100], [184, 95], [179, 90], [169, 85], [160, 80], [151, 75], [132, 70], [113, 65], [94, 60], [85, 55], [75, 50], [66, 45]] },
    { sex: 'female', ageMin: 35, ageMax: 39, points: [[179, 100], [174, 95], [169, 90], [160, 85], [151, 80], [141, 75], [122, 70], [104, 65], [85, 60], [75, 55], [66, 50], [56, 45]] },
    { sex: 'male', ageMin: 40, ageMax: 44, points: [[184, 100], [180, 95], [175, 90], [166, 85], [157, 80], [148, 75], [129, 70], [111, 65], [92, 60], [83, 55], [74, 50], [65, 45]] },
    { sex: 'female', ageMin: 40, ageMax: 44, points: [[175, 100], [171, 95], [166, 90], [157, 85], [148, 80], [138, 75], [120, 70], [101, 65], [83, 60], [74, 55], [65, 50], [55, 45]] },
    { sex: 'male', ageMin: 45, ageMax: 49, points: [[181, 100], [176, 95], [172, 90], [163, 85], [154, 80], [145, 75], [127, 70], [108, 65], [90, 60], [81, 55], [72, 50], [63, 45]] },
    { sex: 'female', ageMin: 45, ageMax: 49, points: [[172, 100], [167, 95], [163, 90], [154, 85], [145, 80], [136, 75], [118, 70], [99, 65], [81, 60], [72, 55], [63, 50], [54, 45]] },
    { sex: 'male', ageMin: 50, ageMax: 54, points: [[177, 100], [173, 95], [168, 90], [159, 85], [151, 80], [142, 75], [124, 70], [106, 65], [89, 60], [80, 55], [71, 50], [62, 45]] },
    { sex: 'female', ageMin: 50, ageMax: 54, points: [[168, 100], [164, 95], [159, 90], [151, 85], [142, 80], [133, 75], [115, 70], [97, 65], [80, 60], [71, 55], [62, 50], [53, 45]] },
    { sex: 'male', ageMin: 55, ageMax: 59, points: [[174, 100], [169, 95], [165, 90], [156, 85], [148, 80], [139, 75], [122, 70], [104, 65], [87, 60], [78, 55], [69, 50], [61, 45]] },
    { sex: 'female', ageMin: 55, ageMax: 59, points: [[165, 100], [161, 95], [156, 90], [148, 85], [139, 80], [130, 75], [113, 70], [95, 65], [78, 60], [69, 55], [61, 50], [52, 45]] },
    { sex: 'male', ageMin: 60, ageMax: 64, points: [[170, 100], [166, 95], [162, 90], [153, 85], [145, 80], [136, 75], [119, 70], [102, 65], [85, 60], [77, 55], [68, 50], [60, 45]] },
    { sex: 'female', ageMin: 60, ageMax: 64, points: [[162, 100], [157, 95], [153, 90], [145, 85], [136, 80], [128, 75], [111, 70], [94, 65], [77, 60], [68, 55], [60, 50], [51, 45]] },
    { sex: 'male', ageMin: 65, ageMax: 99, points: [[167, 100], [163, 95], [158, 90], [150, 85], [142, 80], [133, 75], [117, 70], [100, 65], [83, 60], [75, 55], [67, 50], [58, 45]] },
    { sex: 'female', ageMin: 65, ageMax: 99, points: [[158, 100], [154, 95], [150, 90], [142, 85], [133, 80], [125, 75], [108, 70], [92, 65], [75, 60], [67, 55], [58, 50], [50, 45]] },
];

const run15Mile: ScoreBracket[] = [
    { sex: 'male', ageMin: 17, ageMax: 19, points: [[495, 100], [525, 95], [540, 90], [555, 85], [570, 80], [585, 75], [600, 70], [630, 65], [660, 60], [720, 55], [735, 50], [765, 45]] },
    { sex: 'female', ageMin: 17, ageMax: 19, points: [[569, 100], [675, 95], [690, 90], [705, 85], [720, 80], [750, 75], [765, 70], [780, 65], [810, 60], [855, 55], [885, 50], [900, 45]] },
    { sex: 'male', ageMin: 20, ageMax: 24, points: [[510, 100], [540, 95], [555, 90], [585, 85], [600, 80], [630, 75], [645, 70], [690, 65], [720, 60], [765, 55], [795, 50], [810, 45]] },
    { sex: 'female', ageMin: 20, ageMax: 24, points: [[587, 100], [675, 95], [690, 90], [735, 85], [765, 80], [795, 75], [810, 70], [825, 65], [855, 60], [900, 55], [915, 50], [930, 45]] },
    { sex: 'male', ageMin: 25, ageMax: 29, points: [[535, 100], [563, 95], [578, 90], [615, 85], [630, 80], [652, 75], [683, 70], [735, 65], [773, 60], [803, 55], [825, 50], [840, 45]] },
    { sex: 'female', ageMin: 25, ageMax: 29, points: [[617, 100], [690, 95], [705, 90], [750, 85], [780, 80], [803, 75], [840, 70], [870, 65], [893, 60], [923, 55], [945, 50], [968, 45]] },
    { sex: 'male', ageMin: 30, ageMax: 34, points: [[560, 100], [585, 95], [600, 90], [630, 85], [660, 80], [675, 75], [720, 70], [780, 65], [825, 60], [840, 55], [855, 50], [870, 45]] },
    { sex: 'female', ageMin: 30, ageMax: 34, points: [[646, 100], [705, 95], [720, 90], [765, 85], [795, 80], [810, 75], [870, 70], [915, 65], [930, 60], [945, 55], [975, 50], [1005, 45]] },
    { sex: 'male', ageMin: 35, ageMax: 39, points: [[565, 100], [593, 95], [608, 90], [638, 85], [668, 80], [683, 75], [743, 70], [803, 65], [848, 60], [863, 55], [885, 50], [900, 45]] },
    { sex: 'female', ageMin: 35, ageMax: 39, points: [[651, 100], [713, 95], [728, 90], [773, 85], [803, 80], [825, 75], [878, 70], [930, 65], [953, 60], [975, 55], [998, 50], [1020, 45]] },
    { sex: 'male', ageMin: 40, ageMax: 44, points: [[570, 100], [600, 95], [615, 90], [645, 85], [675, 80], [705, 75], [765, 70], [825, 65], [870, 60], [885, 55], [915, 50], [930, 45]] },
    { sex: 'female', ageMin: 40, ageMax: 44, points: [[656, 100], [720, 95], [735, 90], [780, 85], [810, 80], [840, 75], [885, 70], [945, 65], [975, 60], [1005, 55], [1020, 50], [1035, 45]] },
    { sex: 'male', ageMin: 45, ageMax: 49, points: [[573, 100], [608, 95], [630, 90], [668, 85], [698, 80], [728, 75], [780, 70], [848, 65], [893, 60], [915, 55], [945, 50], [968, 45]] },
    { sex: 'female', ageMin: 45, ageMax: 49, points: [[658, 100], [728, 95], [750, 90], [795, 85], [825, 80], [848, 75], [900, 70], [953, 65], [990, 60], [1013, 55], [1028, 50], [1043, 45]] },
    { sex: 'male', ageMin: 50, ageMax: 54, points: [[575, 100], [615, 95], [645, 90], [690, 85], [720, 80], [750, 75], [795, 70], [870, 65], [915, 60], [945, 55], [975, 50], [1005, 45]] },
    { sex: 'female', ageMin: 50, ageMax: 54, points: [[660, 100], [735, 95], [765, 90], [810, 85], [840, 80], [855, 75], [915, 70], [960, 65], [1005, 60], [1020, 55], [1035, 50], [1050, 45]] },
    { sex: 'male', ageMin: 55, ageMax: 59, points: [[642, 100], [669, 95], [685, 90], [717, 85], [749, 80], [792, 75], [853, 70], [914, 65], [975, 60], [993, 55], [1011, 50], [1029, 45]] },
    { sex: 'female', ageMin: 55, ageMax: 59, points: [[743, 100], [819, 95], [837, 90], [865, 85], [893, 80], [920, 75], [969, 70], [1018, 65], [1068, 60], [1083, 55], [1098, 50], [1114, 45]] },
    { sex: 'male', ageMin: 60, ageMax: 64, points: [[681, 100], [708, 95], [724, 90], [760, 85], [796, 80], [833, 75], [900, 70], [967, 65], [1034, 60], [1067, 55], [1100, 50], [1132, 45]] },
    { sex: 'female', ageMin: 60, ageMax: 64, points: [[814, 100], [890, 95], [908, 90], [934, 85], [960, 80], [985, 75], [1037, 70], [1086, 65], [1131, 60], [1148, 55], [1165, 50], [1183, 45]] },
    { sex: 'male', ageMin: 65, ageMax: 99, points: [[701, 100], [733, 95], [763, 90], [800, 85], [837, 80], [874, 75], [947, 70], [1020, 65], [1093, 60], [1140, 55], [1187, 50], [1235, 45]] },
    { sex: 'female', ageMin: 65, ageMax: 99, points: [[885, 100], [961, 95], [979, 90], [1003, 85], [1027, 80], [1050, 75], [1098, 70], [1146, 65], [1194, 60], [1213, 55], [1231, 50], [1252, 45]] },
];

const row2000m: ScoreBracket[] = [
    { sex: 'male', ageMin: 17, ageMax: 19, points: [[420, 100], [430, 95], [440, 90], [450, 85], [460, 80], [470, 75], [490, 70], [510, 65], [530, 60], [540, 55], [550, 50], [560, 45]] },
    { sex: 'female', ageMin: 17, ageMax: 19, points: [[480, 100], [490, 95], [500, 90], [510, 85], [520, 80], [530, 75], [550, 70], [580, 65], [610, 60], [620, 55], [630, 50], [640, 45]] },
    { sex: 'male', ageMin: 20, ageMax: 24, points: [[425, 100], [435, 95], [445, 90], [455, 85], [465, 80], [475, 75], [495, 70], [515, 65], [535, 60], [545, 55], [555, 50], [565, 45]] },
    { sex: 'female', ageMin: 20, ageMax: 24, points: [[485, 100], [495, 95], [505, 90], [515, 85], [525, 80], [535, 75], [555, 70], [585, 65], [615, 60], [625, 55], [635, 50], [645, 45]] },
    { sex: 'male', ageMin: 25, ageMax: 29, points: [[430, 100], [440, 95], [450, 90], [460, 85], [470, 80], [480, 75], [500, 70], [520, 65], [540, 60], [550, 55], [560, 50], [570, 45]] },
    { sex: 'female', ageMin: 25, ageMax: 29, points: [[490, 100], [500, 95], [510, 90], [520, 85], [530, 80], [540, 75], [560, 70], [590, 65], [620, 60], [630, 55], [640, 50], [650, 45]] },
    { sex: 'male', ageMin: 30, ageMax: 34, points: [[435, 100], [445, 95], [455, 90], [465, 85], [475, 80], [485, 75], [505, 70], [525, 65], [545, 60], [555, 55], [565, 50], [575, 45]] },
    { sex: 'female', ageMin: 30, ageMax: 34, points: [[495, 100], [505, 95], [515, 90], [525, 85], [535, 80], [545, 75], [565, 70], [595, 65], [625, 60], [635, 55], [645, 50], [655, 45]] },
    { sex: 'male', ageMin: 35, ageMax: 39, points: [[440, 100], [450, 95], [460, 90], [470, 85], [480, 80], [490, 75], [510, 70], [530, 65], [550, 60], [560, 55], [570, 50], [580, 45]] },
    { sex: 'female', ageMin: 35, ageMax: 39, points: [[500, 100], [510, 95], [520, 90], [530, 85], [540, 80], [550, 75], [570, 70], [600, 65], [630, 60], [640, 55], [650, 50], [660, 45]] },
    { sex: 'male', ageMin: 40, ageMax: 44, points: [[445, 100], [455, 95], [465, 90], [475, 85], [485, 80], [495, 75], [515, 70], [535, 65], [555, 60], [565, 55], [575, 50], [585, 45]] },
    { sex: 'female', ageMin: 40, ageMax: 44, points: [[505, 100], [515, 95], [525, 90], [535, 85], [545, 80], [555, 75], [575, 70], [605, 65], [635, 60], [645, 55], [655, 50], [665, 45]] },
    { sex: 'male', ageMin: 45, ageMax: 49, points: [[450, 100], [460, 95], [470, 90], [480, 85], [490, 80], [500, 75], [520, 70], [540, 65], [560, 60], [570, 55], [580, 50], [590, 45]] },
    { sex: 'female', ageMin: 45, ageMax: 49, points: [[510, 100], [520, 95], [530, 90], [540, 85], [550, 80], [560, 75], [580, 70], [610, 65], [640, 60], [650, 55], [660, 50], [670, 45]] },
    { sex: 'male', ageMin: 50, ageMax: 54, points: [[455, 100], [465, 95], [475, 90], [485, 85], [495, 80], [505, 75], [525, 70], [545, 65], [565, 60], [575, 55], [585, 50], [595, 45]] },
    { sex: 'female', ageMin: 50, ageMax: 54, points: [[515, 100], [525, 95], [535, 90], [545, 85], [555, 80], [565, 75], [585, 70], [615, 65], [645, 60], [655, 55], [665, 50], [675, 45]] },
    { sex: 'male', ageMin: 55, ageMax: 59, points: [[460, 100], [470, 95], [480, 90], [490, 85], [500, 80], [510, 75], [530, 70], [550, 65], [570, 60], [580, 55], [590, 50], [600, 45]] },
    { sex: 'female', ageMin: 55, ageMax: 59, points: [[520, 100], [530, 95], [540, 90], [550, 85], [560, 80], [570, 75], [590, 70], [620, 65], [650, 60], [660, 55], [670, 50], [680, 45]] },
    { sex: 'male', ageMin: 60, ageMax: 64, points: [[465, 100], [475, 95], [485, 90], [495, 85], [505, 80], [515, 75], [535, 70], [555, 65], [575, 60], [585, 55], [595, 50], [605, 45]] },
    { sex: 'female', ageMin: 60, ageMax: 64, points: [[525, 100], [535, 95], [545, 90], [555, 85], [565, 80], [575, 75], [595, 70], [625, 65], [655, 60], [665, 55], [675, 50], [685, 45]] },
    { sex: 'male', ageMin: 65, ageMax: 99, points: [[470, 100], [480, 95], [490, 90], [500, 85], [510, 80], [520, 75], [540, 70], [560, 65], [580, 60], [590, 55], [600, 50], [610, 45]] },
    { sex: 'female', ageMin: 65, ageMax: 99, points: [[530, 100], [540, 95], [550, 90], [560, 85], [570, 80], [580, 75], [600, 70], [630, 65], [660, 60], [670, 55], [680, 50], [690, 45]] },
];

const swim500yd: ScoreBracket[] = [
    { sex: 'male', ageMin: 17, ageMax: 19, points: [[390, 100], [405, 95], [435, 90], [465, 85], [495, 80], [510, 75], [555, 70], [630, 65], [675, 60], [705, 55], [735, 50], [765, 45]] },
    { sex: 'female', ageMin: 17, ageMax: 19, points: [[405, 100], [465, 95], [510, 90], [540, 85], [570, 80], [585, 75], [645, 70], [720, 65], [780, 60], [795, 55], [825, 50], [855, 45]] },
    { sex: 'male', ageMin: 20, ageMax: 24, points: [[390, 100], [420, 95], [450, 90], [480, 85], [495, 80], [525, 75], [570, 70], [630, 65], [690, 60], [720, 55], [735, 50], [780, 45]] },
    { sex: 'female', ageMin: 20, ageMax: 24, points: [[435, 100], [480, 95], [525, 90], [555, 85], [585, 80], [600, 75], [660, 70], [735, 65], [795, 60], [825, 55], [840, 50], [870, 45]] },
    { sex: 'male', ageMin: 25, ageMax: 29, points: [[398, 100], [428, 95], [458, 90], [488, 85], [503, 80], [533, 75], [578, 70], [638, 65], [698, 60], [728, 55], [743, 50], [788, 45]] },
    { sex: 'female', ageMin: 25, ageMax: 29, points: [[443, 100], [495, 95], [540, 90], [570, 85], [600, 80], [615, 75], [675, 70], [750, 65], [810, 60], [833, 55], [855, 50], [885, 45]] },
    { sex: 'male', ageMin: 30, ageMax: 34, points: [[405, 100], [435, 95], [465, 90], [495, 85], [510, 80], [540, 75], [585, 70], [645, 65], [705, 60], [735, 55], [750, 50], [795, 45]] },
    { sex: 'female', ageMin: 30, ageMax: 34, points: [[450, 100], [510, 95], [555, 90], [585, 85], [615, 80], [630, 75], [690, 70], [765, 65], [825, 60], [840, 55], [870, 50], [900, 45]] },
    { sex: 'male', ageMin: 35, ageMax: 39, points: [[413, 100], [443, 95], [473, 90], [503, 85], [518, 80], [548, 75], [593, 70], [653, 65], [713, 60], [743, 55], [758, 50], [803, 45]] },
    { sex: 'female', ageMin: 35, ageMax: 39, points: [[465, 100], [518, 95], [570, 90], [600, 85], [623, 80], [645, 75], [705, 70], [773, 65], [840, 60], [855, 55], [878, 50], [915, 45]] },
    { sex: 'male', ageMin: 40, ageMax: 44, points: [[420, 100], [450, 95], [480, 90], [510, 85], [525, 80], [555, 75], [600, 70], [660, 65], [720, 60], [750, 55], [765, 50], [810, 45]] },
    { sex: 'female', ageMin: 40, ageMax: 44, points: [[480, 100], [525, 95], [585, 90], [615, 85], [630, 80], [660, 75], [720, 70], [780, 65], [855, 60], [870, 55], [885, 50], [930, 45]] },
    { sex: 'male', ageMin: 45, ageMax: 49, points: [[428, 100], [458, 95], [488, 90], [518, 85], [533, 80], [563, 75], [608, 70], [668, 65], [728, 60], [758, 55], [773, 50], [818, 45]] },
    { sex: 'female', ageMin: 45, ageMax: 49, points: [[495, 100], [540, 95], [593, 90], [623, 85], [645, 80], [668, 75], [735, 70], [795, 65], [870, 60], [885, 55], [900, 50], [938, 45]] },
    { sex: 'male', ageMin: 50, ageMax: 54, points: [[435, 100], [465, 95], [495, 90], [525, 85], [540, 80], [570, 75], [615, 70], [675, 65], [735, 60], [765, 55], [780, 50], [825, 45]] },
    { sex: 'female', ageMin: 50, ageMax: 54, points: [[510, 100], [555, 95], [600, 90], [630, 85], [660, 80], [675, 75], [750, 70], [810, 65], [885, 60], [900, 55], [915, 50], [945, 45]] },
    { sex: 'male', ageMin: 55, ageMax: 59, points: [[437, 100], [467, 95], [497, 90], [530, 85], [555, 80], [587, 75], [640, 70], [695, 65], [753, 60], [780, 55], [805, 50], [835, 45]] },
    { sex: 'female', ageMin: 55, ageMax: 59, points: [[525, 100], [570, 95], [607, 90], [637, 85], [675, 80], [685, 75], [765, 70], [825, 65], [900, 60], [915, 55], [930, 50], [960, 45]] },
    { sex: 'male', ageMin: 60, ageMax: 64, points: [[440, 100], [470, 95], [500, 90], [535, 85], [570, 80], [605, 75], [660, 70], [715, 65], [770, 60], [795, 55], [820, 50], [845, 45]] },
    { sex: 'female', ageMin: 60, ageMax: 64, points: [[540, 100], [585, 95], [615, 90], [645, 85], [690, 80], [695, 75], [780, 70], [840, 65], [915, 60], [930, 55], [945, 50], [975, 45]] },
    { sex: 'male', ageMin: 65, ageMax: 99, points: [[445, 100], [475, 95], [505, 90], [545, 85], [585, 80], [630, 75], [685, 70], [740, 65], [800, 60], [820, 55], [840, 50], [855, 45]] },
    { sex: 'female', ageMin: 65, ageMax: 99, points: [[555, 100], [600, 95], [623, 90], [652, 85], [705, 80], [710, 75], [795, 70], [855, 65], [930, 60], [945, 55], [960, 50], [990, 45]] },
];

const swim450m: ScoreBracket[] = [
    { sex: 'male', ageMin: 17, ageMax: 19, points: [[380, 100], [395, 95], [425, 90], [455, 85], [485, 80], [500, 75], [545, 70], [620, 65], [665, 60], [695, 55], [725, 50], [755, 45]] },
    { sex: 'female', ageMin: 17, ageMax: 19, points: [[395, 100], [455, 95], [500, 90], [530, 85], [560, 80], [575, 75], [635, 70], [710, 65], [770, 60], [785, 55], [815, 50], [845, 45]] },
    { sex: 'male', ageMin: 20, ageMax: 24, points: [[380, 100], [410, 95], [440, 90], [470, 85], [485, 80], [515, 75], [560, 70], [620, 65], [680, 60], [710, 55], [725, 50], [770, 45]] },
    { sex: 'female', ageMin: 20, ageMax: 24, points: [[425, 100], [470, 95], [515, 90], [545, 85], [575, 80], [590, 75], [650, 70], [725, 65], [785, 60], [815, 55], [830, 50], [860, 45]] },
    { sex: 'male', ageMin: 25, ageMax: 29, points: [[388, 100], [418, 95], [448, 90], [478, 85], [493, 80], [523, 75], [568, 70], [628, 65], [688, 60], [718, 55], [733, 50], [778, 45]] },
    { sex: 'female', ageMin: 25, ageMax: 29, points: [[433, 100], [478, 95], [530, 90], [560, 85], [590, 80], [605, 75], [665, 70], [740, 65], [800, 60], [823, 55], [845, 50], [875, 45]] },
    { sex: 'male', ageMin: 30, ageMax: 34, points: [[395, 100], [425, 95], [455, 90], [485, 85], [500, 80], [530, 75], [575, 70], [635, 65], [695, 60], [725, 55], [740, 50], [785, 45]] },
    { sex: 'female', ageMin: 30, ageMax: 34, points: [[440, 100], [500, 95], [545, 90], [575, 85], [605, 80], [620, 75], [680, 70], [755, 65], [815, 60], [830, 55], [860, 50], [890, 45]] },
    { sex: 'male', ageMin: 35, ageMax: 39, points: [[403, 100], [433, 95], [463, 90], [493, 85], [508, 80], [538, 75], [583, 70], [643, 65], [703, 60], [733, 55], [748, 50], [793, 45]] },
    { sex: 'female', ageMin: 35, ageMax: 39, points: [[455, 100], [508, 95], [560, 90], [590, 85], [613, 80], [635, 75], [695, 70], [763, 65], [830, 60], [845, 55], [868, 50], [905, 45]] },
    { sex: 'male', ageMin: 40, ageMax: 44, points: [[410, 100], [440, 95], [470, 90], [500, 85], [515, 80], [545, 75], [590, 70], [650, 65], [710, 60], [740, 55], [755, 50], [800, 45]] },
    { sex: 'female', ageMin: 40, ageMax: 44, points: [[470, 100], [515, 95], [575, 90], [605, 85], [620, 80], [650, 75], [710, 70], [770, 65], [845, 60], [860, 55], [875, 50], [920, 45]] },
    { sex: 'male', ageMin: 45, ageMax: 49, points: [[418, 100], [448, 95], [478, 90], [508, 85], [523, 80], [553, 75], [598, 70], [658, 65], [718, 60], [748, 55], [763, 50], [808, 45]] },
    { sex: 'female', ageMin: 45, ageMax: 49, points: [[485, 100], [530, 95], [583, 90], [613, 85], [635, 80], [658, 75], [725, 70], [785, 65], [860, 60], [875, 55], [890, 50], [928, 45]] },
    { sex: 'male', ageMin: 50, ageMax: 54, points: [[425, 100], [455, 95], [485, 90], [515, 85], [530, 80], [560, 75], [605, 70], [665, 65], [725, 60], [755, 55], [770, 50], [815, 45]] },
    { sex: 'female', ageMin: 50, ageMax: 54, points: [[500, 100], [545, 95], [590, 90], [620, 85], [650, 80], [665, 75], [740, 70], [800, 65], [875, 60], [890, 55], [905, 50], [935, 45]] },
    { sex: 'male', ageMin: 55, ageMax: 59, points: [[427, 100], [457, 95], [487, 90], [520, 85], [545, 80], [577, 75], [630, 70], [685, 65], [743, 60], [770, 55], [795, 50], [825, 45]] },
    { sex: 'female', ageMin: 55, ageMax: 59, points: [[515, 100], [560, 95], [597, 90], [627, 85], [665, 80], [675, 75], [755, 70], [815, 65], [890, 60], [905, 55], [920, 50], [950, 45]] },
    { sex: 'male', ageMin: 60, ageMax: 64, points: [[430, 100], [460, 95], [490, 90], [525, 85], [560, 80], [595, 75], [650, 70], [705, 65], [760, 60], [785, 55], [810, 50], [835, 45]] },
    { sex: 'female', ageMin: 60, ageMax: 64, points: [[530, 100], [575, 95], [605, 90], [635, 85], [680, 80], [685, 75], [770, 70], [830, 65], [905, 60], [920, 55], [935, 50], [965, 45]] },
    { sex: 'male', ageMin: 65, ageMax: 99, points: [[435, 100], [465, 95], [495, 90], [535, 85], [575, 80], [620, 75], [675, 70], [730, 65], [790, 60], [810, 55], [830, 50], [845, 45]] },
    { sex: 'female', ageMin: 65, ageMax: 99, points: [[545, 100], [590, 95], [613, 90], [642, 85], [695, 80], [700, 75], [785, 70], [845, 65], [920, 60], [935, 55], [950, 50], [980, 45]] },
];

const run: FitnessEvent = { id: 'run-1-5-mile', name: '1.5-mile run/walk', unit: 'seconds', better: 'lower', brackets: run15Mile };
const treadmill: FitnessEvent = { id: 'treadmill-1-5-mile', name: '1.5-mile treadmill run (1% incline)', unit: 'seconds', better: 'lower', brackets: run15Mile };
const row: FitnessEvent = { id: 'row-2000m', name: '2,000 m row (Concept2)', unit: 'seconds', better: 'lower', brackets: row2000m };
const swimYards: FitnessEvent = { id: 'swim-500yd', name: '500-yard swim', unit: 'seconds', better: 'lower', brackets: swim500yd };
const swimMeters: FitnessEvent = { id: 'swim-450m', name: '450-meter swim', unit: 'seconds', better: 'lower', brackets: swim450m };

export const prt: FitnessTest = {
  id: 'prt',
  branch: 'navy',
  name: 'Physical Readiness Test',
  short: 'PRT',
  // Each event is worth 45 to 100 points. The Navy reports the overall result as the
  // category matching the average of the three event scores; the totals below are
  // three times those averages so the shared calculator can sum points.
  maxPoints: 300,
  slots: [
    {
      id: 'push-ups',
      label: 'Push-ups (2 minutes)',
      options: [{ id: 'push-ups', name: 'Push-ups', unit: 'reps', better: 'higher', brackets: pushUps }],
      minimumPoints: 45,
    },
    {
      id: 'plank',
      label: 'Forearm plank',
      options: [{ id: 'forearm-plank', name: 'Forearm plank', unit: 'seconds', better: 'higher', brackets: forearmPlank }],
      minimumPoints: 45,
    },
    {
      id: 'cardio',
      label: 'Cardio',
      options: [run, treadmill, row, swimYards, swimMeters],
      minimumPoints: 45,
    },
  ],
  // Passing is per event (Probationary, 45 points, or better in all three), not a total.
  classes: [
    { label: 'Outstanding (High)', min: 300 },
    { label: 'Outstanding (Medium)', min: 285 },
    { label: 'Outstanding (Low)', min: 270 },
    { label: 'Excellent (High)', min: 255 },
    { label: 'Excellent (Medium)', min: 240 },
    { label: 'Excellent (Low)', min: 225 },
    { label: 'Good (High)', min: 210 },
    { label: 'Good (Medium)', min: 195 },
    { label: 'Good (Low)', min: 180 },
    { label: 'Satisfactory (High)', min: 165 },
    { label: 'Satisfactory (Medium)', min: 150 },
    { label: 'Probationary', min: 135 },
  ],
  ageGroups: [
    { label: '17-19', ageMin: 17, ageMax: 19 },
    { label: '20-24', ageMin: 20, ageMax: 24 },
    { label: '25-29', ageMin: 25, ageMax: 29 },
    { label: '30-34', ageMin: 30, ageMax: 34 },
    { label: '35-39', ageMin: 35, ageMax: 39 },
    { label: '40-44', ageMin: 40, ageMax: 44 },
    { label: '45-49', ageMin: 45, ageMax: 49 },
    { label: '50-54', ageMin: 50, ageMax: 54 },
    { label: '55-59', ageMin: 55, ageMax: 59 },
    { label: '60-64', ageMin: 60, ageMax: 64 },
    { label: '65+', ageMin: 65, ageMax: 99 },
  ],
  bySex: true,
  provenance: {
    verified: '2026-11-18',
    sources: [
      {
        label: 'Navy PRP Guide-5A, Physical Readiness Test (DEC 2025), Table 4-1',
        url: 'https://www.mynavyhr.navy.mil/Portals/55/Support/Culture%20Resilience/Physical/Guide-5A%20Physical%20Readiness%20Test.pdf',
      },
      {
        label: 'Navy PRP Guide-1, PRP Policies (DEC 2025)',
        url: 'https://www.mynavyhr.navy.mil/Portals/55/Support/Culture%20Resilience/Physical/Guide-1%20PRP%20Policies.pdf',
      },
      {
        label: 'NAVADMIN 264/25, Physical Readiness Program updates for CY2026',
        url: 'https://www.mynavyhr.navy.mil/Portals/55/Messages/NAVADMIN/NAV2025/NAV25264.pdf',
      },
      {
        label: 'MyNavy HR: Physical Readiness Program',
        url: 'https://www.mynavyhr.navy.mil/Support-Services/Culture-Resilience/Physical-Readiness/',
      },
    ],
    notes:
      'Scores are from Guide-5A (DEC 2025), the PRT guide in force for 2026 and unchanged on MyNavy HR through at least October 2026. ' +
      'mynavyhr.navy.mil refuses automated downloads, so the PDF was read from Internet Archive captures of that exact URL (identical file from February to October 2026). ' +
      'Categories: Outstanding 90-100, Excellent 75-85, Good 60-70, Satisfactory 50-55, Probationary 45 (the lowest passing score). Anything below the Probationary row is a failure. ' +
      'A Sailor passes the PRT with Probationary or better in every event; a Probationary result in any event means Fitness Enhancement Program enrolment until a later PFA scores Good-Low or better in every event. ' +
      'Combat arms Sailors must reach Good-High (70) on the male chart for their age instead (Guide-1 and Guide-5B), which this calculator does not model. ' +
      'Alternate cardio is offered only when the commanding officer authorizes it for the cycle. ' +
      'The 12-minute stationary bike is scored by calories through the official PFA app, by bike model and body weight; Guide-5A prints no bike chart, so it is left out. ' +
      'Commands at 5,000 ft or higher use the separate Table 4-2, which is not included here. ' +
      'The female 17-19 and 20-24 run columns jump from 11:15 at 95 points to 9:29 and 9:47 at 100 points; that is how Guide-5A prints them.',
    unverified: [
      'Treadmill: Guide-5A sets a timed 1.5-mile treadmill test (1% incline) but prints no separate column; confirm PRIMS scores it on the 1.5-mile run column.',
      'Overall category: Guide-5A says the overall result is the category matching the average of the three event points. Confirm how PRIMS treats an average that falls between rows (e.g. 88.3); the classes here assume it takes the highest row at or below the average.',
      'Age: confirm which date sets the age group (test day or another date). Guide-1 and Guide-5A do not say.',
      'Guide-1 was revised again in AUG 2026 (not retrievable); confirm nothing in it changes PRT pass rules or categories.',
    ],
  },
};

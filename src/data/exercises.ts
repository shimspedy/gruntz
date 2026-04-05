import { Exercise, EquipmentAccess } from '../types';

// ============================================================
// MARSOC FITNESS PREPARATION LOG — COMPLETE EXERCISE DATABASE
// Based on the official MARSOC 10-Week A&S Prep Program
// Includes gym alternatives for equipment-access users
// ============================================================

export const exercises: Exercise[] = [
  // ============================
  // MOVEMENT PREPARATION (WARMUP)
  // ============================
  { id: 'ankles_hips_shoulders', name: 'Ankles-Hips-Shoulders', category: 'warmup', description: 'Left knee bent 90°, right knee on ground. Lean forward, raise hands to back of head. Twist left, pause, twist back.', sets: 1, reps: 5, rest_seconds: 0, equipment: [], equipment_access: 'none', xp_value: 5, form_tips: ['5 reps each side', 'Begin with LEFT LEG', 'Pause at each twist'] },
  { id: 'hip_bridge', name: 'Hip Bridge', category: 'warmup', description: 'Lying on back, raise hips forming an arch resting on shoulder blades. Hold 15 seconds.', sets: 1, reps: 6, rest_seconds: 0, equipment: [], equipment_access: 'none', xp_value: 5, form_tips: ['Rest on shoulder blades, NOT neck', 'Hold 15 sec at top', '6 reps'] },
  { id: 'elbow_pushups', name: 'Elbow Push-Ups', category: 'warmup', description: 'Plank on forearms. Push up keeping back straight. Do not rest on ground between reps.', sets: 1, reps: 7, rest_seconds: 0, equipment: [], equipment_access: 'none', xp_value: 5, form_tips: ['6-8 reps', 'Back straight', 'Don\'t rest on ground'] },
  { id: 'bird_dog', name: 'Bird Dog', category: 'warmup', description: 'Kneeling on all fours. Extend opposite arm and leg simultaneously. Hold 30 seconds.', sets: 1, reps: 5, rest_seconds: 0, equipment: [], equipment_access: 'none', xp_value: 5, form_tips: ['5 each side', 'Body parallel to ground', 'Hold 30 seconds'] },
  { id: 'frog_squat_warmup', name: 'Frog Squats (Warmup)', category: 'warmup', description: 'Feet wider than shoulders. Deep squat with hips back, heels on ground.', sets: 1, reps: 5, rest_seconds: 0, equipment: [], equipment_access: 'none', xp_value: 5, form_tips: ['Heels on ground', 'Hips back', 'Hands together at knee level'] },
  { id: 'worlds_greatest_stretch', name: "World's Greatest Stretch", category: 'warmup', description: 'Lunge forward, elbow to knee, grab opposite bicep. Twist and reach up.', sets: 1, reps: 5, rest_seconds: 0, equipment: [], equipment_access: 'none', xp_value: 6, form_tips: ['5 each side', 'Deep lunge', 'Full rotation'] },
  { id: 'inchworm', name: 'Inchworm', category: 'warmup', description: 'Face down, arms extended. Walk legs forward keeping hands flat. Return.', sets: 1, reps: 5, rest_seconds: 0, equipment: [], equipment_access: 'none', xp_value: 5, form_tips: ['Keep hands flat', 'Walk as far as possible', 'Legs straight'] },
  { id: 'walking_high_knees', name: 'Walking High Knees', category: 'warmup', description: 'Raise each leg to hip level while walking, pumping opposite arm.', sets: 1, reps: 10, rest_seconds: 0, equipment: [], equipment_access: 'none', xp_value: 5, form_tips: ['10 each side', 'Thigh parallel to ground', 'Back straight'] },
  { id: 'walking_quads_pulls', name: 'Walking Quads Pulls', category: 'warmup', description: 'While walking, raise lower leg back to stretch quads. Alternate sides.', sets: 1, reps: 10, rest_seconds: 0, equipment: [], equipment_access: 'none', xp_value: 5, form_tips: ['10 each side', 'Flex foot', 'Use opposite arm for balance'] },
  { id: 'cradles', name: 'Cradles', category: 'warmup', description: 'Raise leg and grasp calf with both hands. Calf parallel to ground. Balance 30 sec.', sets: 1, reps: 5, rest_seconds: 0, equipment: [], equipment_access: 'none', xp_value: 5, form_tips: ['5 each side', 'Calf parallel', 'Balance 30 sec'] },
  { id: 'backwards_hamstring', name: 'Backwards Hamstring', category: 'warmup', description: 'Bend forward, bring one leg up fully extended. Balance on one leg 30 sec.', sets: 1, reps: 5, rest_seconds: 0, equipment: [], equipment_access: 'none', xp_value: 5, form_tips: ['5 each side', 'Foot flat on ground', 'Hold 30 sec'] },
  { id: 'high_knees', name: 'High Knees', category: 'warmup', description: 'Drive each knee as high as possible, swinging opposite arm to cheek level.', duration_seconds: 15, rest_seconds: 0, equipment: [], equipment_access: 'none', xp_value: 5, form_tips: ['15 seconds', 'Fast pace', 'Drive knees high'] },
  { id: 'butt_kicks', name: 'Butt Kicks', category: 'warmup', description: 'Lift each foot to touch buttocks rapidly. Alternate legs.', duration_seconds: 15, rest_seconds: 0, equipment: [], equipment_access: 'none', xp_value: 5, form_tips: ['15 seconds', 'Heel touches buttock', 'Pump opposite arms'] },

  // ============================
  // CALISTHENICS
  // ============================
  { id: 'forward_plank', name: 'Forward Plank', category: 'core', description: 'Forearm plank. Keep body in a straight line.', duration_seconds: 60, rest_seconds: 30, equipment: [], equipment_access: 'none', xp_value: 8, form_tips: ['Body straight', 'Don\'t sag at hips', 'Breathe steadily'], progression_rules: { increment_duration: 10, frequency: 'weekly' } },
  { id: 'side_plank', name: 'Side Plank', category: 'core', description: 'Push up on forearm creating straight line from shoulder to ankle.', duration_seconds: 30, rest_seconds: 15, equipment: [], equipment_access: 'none', xp_value: 8, form_tips: ['Each side', 'Don\'t sag', 'Raise top leg for difficulty'], progression_rules: { increment_duration: 5, frequency: 'weekly' } },
  { id: 'flutter_kicks', name: 'Flutter Kicks', category: 'core', description: 'Lying on back, hands under tailbone. Legs 6-12 inches up, alternate scissor kicks.', sets: 1, reps: 20, rest_seconds: 30, equipment: [], equipment_access: 'none', xp_value: 8, form_tips: ['4-count reps', 'Legs 6-12 inches', 'Lower back pressed down'], progression_rules: { increment_reps: 5, frequency: 'weekly' } },
  { id: 'pushups', name: 'Push-Ups', category: 'calisthenics', description: 'Push up through hands keeping back straight. Full lockout at top.', sets: 1, reps: 15, rest_seconds: 60, equipment: [], equipment_access: 'none', gym_alternative_id: 'bench_press', xp_value: 10, form_tips: ['Back straight', 'Full lockout', 'Don\'t rest on ground'], progression_rules: { increment_reps: 2, frequency: 'weekly' } },
  { id: 'hand_release_pushups', name: 'Hand Release Push-Ups', category: 'calisthenics', description: 'Drop chest to ground, pull hands off ground, then push back up.', sets: 1, reps: 12, rest_seconds: 60, equipment: [], equipment_access: 'none', gym_alternative_id: 'bench_press', xp_value: 12, form_tips: ['Chest fully on ground', 'Hands completely off', 'Full push-up back up'] },
  { id: 'lunges_counter_rotation', name: 'Lunges with Counter Rotation', category: 'calisthenics', description: 'Lunge forward, rotate body toward forward knee. Return.', sets: 1, reps: 10, rest_seconds: 30, equipment: [], equipment_access: 'none', xp_value: 10, form_tips: ['Knee over toes', 'Rotate from core', 'Elbows out'] },
  { id: 'frog_squats', name: 'Frog Squats', category: 'calisthenics', description: 'Feet wider than shoulders. Squat deep, hips back, heels on ground.', sets: 1, reps: 10, duration_seconds: 60, rest_seconds: 30, equipment: [], equipment_access: 'none', xp_value: 8, form_tips: ['Heels stay on ground', 'Full depth', 'Hips back'] },
  { id: 'ammo_can_push_press', name: 'Ammo Can Push Press', category: 'calisthenics', description: 'Hold 30lb weight on upper chest. Dip then explosively press overhead.', sets: 1, reps: 10, rest_seconds: 60, equipment: ['ammo can or dumbbell'], equipment_access: 'minimal', gym_alternative_id: 'overhead_press', xp_value: 12, form_tips: ['Neutral neck', 'Dip then drive', 'Full lockout overhead'] },
  { id: 'ammo_can_thruster', name: 'Ammo Can Thruster', category: 'calisthenics', description: 'Hold 30lb weight on chest. Squat, then stand and press overhead in one movement.', sets: 1, reps: 10, rest_seconds: 60, equipment: ['ammo can or dumbbell'], equipment_access: 'minimal', gym_alternative_id: 'barbell_thruster', xp_value: 15, form_tips: ['Full squat', 'Drive through heels', 'Press at top'] },
  { id: 'ammo_can_front_squats', name: 'Ammo Can Front Squats', category: 'calisthenics', description: 'Hold 30lb weight to chest. Squat until hip crease below knee.', sets: 1, reps: 10, rest_seconds: 60, equipment: ['ammo can or dumbbell'], equipment_access: 'minimal', gym_alternative_id: 'barbell_front_squat', xp_value: 12, form_tips: ['Hip crease below knee', 'Hips and knees locked at top', 'Glutes tight'] },
  { id: 'air_squats', name: 'Air Squats', category: 'calisthenics', description: 'Deep squat with arms at shoulder height. Explode up.', sets: 1, reps: 20, rest_seconds: 45, equipment: [], equipment_access: 'none', gym_alternative_id: 'goblet_squat', xp_value: 10, form_tips: ['Arms to shoulder height', 'Heels on ground', 'Contract glutes'], progression_rules: { increment_reps: 5, frequency: 'weekly' } },
  { id: 'burpees', name: 'Burpees', category: 'calisthenics', description: 'Squat, kick back, push-up, fire legs in, jump with hands overhead.', sets: 1, reps: 10, rest_seconds: 90, equipment: [], equipment_access: 'none', xp_value: 15, form_tips: ['Full push-up', 'Explosive jump', 'Spread eagle in air'], progression_rules: { increment_reps: 2, frequency: 'weekly' } },
  { id: 'skaters', name: 'Skaters', category: 'calisthenics', description: 'Shift weight to one leg, explode laterally. Stabilize and repeat.', sets: 1, reps: 30, rest_seconds: 45, equipment: [], equipment_access: 'none', xp_value: 10, form_tips: ['Stabilize each landing', 'Pause between jumps', 'Explosive'] },
  { id: 'dumbbell_getups', name: 'Dumbbell Get-Ups', category: 'calisthenics', description: 'Lying on back holding 30lb dumbbell overhead. Progress to standing through positions.', sets: 1, reps: 10, rest_seconds: 60, equipment: ['dumbbell'], equipment_access: 'minimal', gym_alternative_id: 'turkish_getup', xp_value: 15, form_tips: ['Keep arm vertical', 'Shift to elbow, then hand', 'Pull leg under to kneeling'] },
  { id: 'sandbag_getups', name: 'Sandbag Get-Ups', category: 'calisthenics', description: 'Lying on back with sandbag on shoulder. Get up any way you can. Reverse back down.', sets: 1, reps: 10, rest_seconds: 60, equipment: ['sandbag'], equipment_access: 'minimal', gym_alternative_id: 'turkish_getup', xp_value: 15, form_tips: ['Core engaged', 'Use elbow of unloaded arm', 'Switch sides'] },
  { id: 'tire_flips', name: 'Tire Flips', category: 'calisthenics', description: 'Grip underside of tire, lift with legs, pull upright, push over explosively.', sets: 1, reps: 8, rest_seconds: 90, equipment: ['tire'], equipment_access: 'gym', gym_alternative_id: 'deadlift', xp_value: 15, form_tips: ['Chest over tire', 'Lift with legs', 'Reset each rep'] },
  { id: 'high_crawl', name: '20-Meter High Crawl', category: 'calisthenics', description: 'Hands and knees, spine straight. Move with opposite hand and knee.', distance: '20m', rest_seconds: 45, equipment: [], equipment_access: 'none', xp_value: 12, form_tips: ['Spine straight', 'Opposite hand/knee together', 'Feet flexed'] },
  { id: 'pullups', name: 'Pull-Ups', category: 'calisthenics', description: 'Dead hang, hands wider than shoulders. Pull chest to bar.', sets: 3, reps: 8, rest_seconds: 90, equipment: ['pull-up bar'], equipment_access: 'minimal', gym_alternative_id: 'lat_pulldown', xp_value: 15, form_tips: ['Full dead hang', 'Chin above bar', 'No kipping', 'Shoulder blades down and back'], progression_rules: { increment_reps: 1, frequency: 'weekly' } },
  { id: 'chinups', name: 'Chin-Ups', category: 'calisthenics', description: 'Reverse grip pull-ups. Palms face toward you.', sets: 3, reps: 8, rest_seconds: 90, equipment: ['pull-up bar'], equipment_access: 'minimal', gym_alternative_id: 'lat_pulldown', xp_value: 15, form_tips: ['Palms toward you', 'Full dead hang', 'Chin above bar'] },
  { id: 'farmers_carry', name: "Farmer's Carry", category: 'calisthenics', description: 'Deadlift two 50lb+ weights. Walk or run 50m. Avoid swaying.', sets: 5, distance: '50m', rest_seconds: 30, equipment: ['dumbbells or kettlebells'], equipment_access: 'minimal', xp_value: 15, form_tips: ['Good posture', 'Bend at knees', 'Don\'t sway loads'] },
  { id: 'partner_drags', name: 'Partner Drags', category: 'calisthenics', description: 'Drag seated partner 20m. Or use a sled.', distance: '20m', rest_seconds: 60, equipment: ['partner or sled'], equipment_access: 'none', gym_alternative_id: 'sled_drag', xp_value: 12, form_tips: ['Dead lift position', 'Stiff core', 'Walk backward'] },
  { id: 'walking_ammo_can_lunge', name: 'Walking Ammo Can Lunge', category: 'calisthenics', description: 'Hold 30lb weight in each hand. Walking lunges.', sets: 1, reps: 20, rest_seconds: 60, equipment: ['ammo cans or dumbbells'], equipment_access: 'minimal', gym_alternative_id: 'barbell_lunge', xp_value: 12, form_tips: ['Heel down on front leg', 'Shin vertical', 'Push through front heel'] },
  { id: 'broad_jumps', name: 'Broad Jumps', category: 'calisthenics', description: 'Rapid squat then explode forward. Land softly.', sets: 1, reps: 10, rest_seconds: 45, equipment: [], equipment_access: 'none', xp_value: 10, form_tips: ['Rapid squat', 'Land softly', 'Reset immediately'] },
  { id: 'knees_to_elbows', name: 'Knees to Elbows', category: 'core', description: 'Dead hang. Roll knees to elbows in one motion. Drop straight down.', sets: 1, reps: 12, rest_seconds: 60, equipment: ['pull-up bar'], equipment_access: 'minimal', gym_alternative_id: 'hanging_leg_raises', xp_value: 12, form_tips: ['Smooth motion', 'Drop feet straight', 'No swinging'] },
  { id: 'usmc_crunches', name: 'USMC Crunches', category: 'core', description: 'Lying on back, knees up, arms across abdomen. Drive upper body off ground.', sets: 1, reps: 30, rest_seconds: 60, equipment: [], equipment_access: 'none', xp_value: 8, form_tips: ['Shoulders to deck each rep', 'Use abs not momentum', 'Full ROM'], progression_rules: { increment_reps: 5, frequency: 'weekly' } },
  { id: 'walking_lunges', name: 'Walking Lunges', category: 'calisthenics', description: 'Step forward, lower to parallel, drive up. Alternate legs.', sets: 1, reps: 20, rest_seconds: 60, equipment: [], equipment_access: 'none', gym_alternative_id: 'barbell_lunge', xp_value: 10, form_tips: ['Knee over foot', 'Body straight', 'Step through'] },
  { id: 'mountain_climbers', name: 'Mountain Climbers', category: 'core', description: 'Push-up position. Drive knees to chest alternately.', sets: 1, reps: 20, rest_seconds: 45, equipment: [], equipment_access: 'none', xp_value: 10, form_tips: ['4-count', 'Keep right leg straight when left drives', 'Plank position'] },

  // ============================
  // RUNNING
  // ============================
  { id: 'run_1_5mi', name: '1.5-Mile Run', category: 'running', description: 'Run 1.5 miles at near-PFT pace.', distance: '1.5 miles', rest_seconds: 0, equipment: [], equipment_access: 'none', xp_value: 20, form_tips: ['Within 1 min of PFT pace', 'Midfoot strike', 'Relax shoulders'] },
  { id: 'run_3mi', name: '3-Mile Run', category: 'running', description: 'Run 3 miles at PFT pace.', distance: '3 miles', rest_seconds: 0, equipment: [], equipment_access: 'none', xp_value: 30, form_tips: ['PFT pace', 'Even splits', 'Focus on breathing'] },
  { id: 'sprint_200m', name: '200m Sprints', category: 'running', description: 'Sprint 200m faster than PFT pace.', sets: 9, distance: '200m', rest_seconds: 90, equipment: [], equipment_access: 'none', xp_value: 20, form_tips: ['Faster than PFT pace', 'Full recovery', 'Form when tired'] },
  { id: 'sprint_400m', name: '400m Sprints', category: 'running', description: 'Sprint 400m faster than PFT pace.', sets: 4, distance: '400m', rest_seconds: 120, equipment: [], equipment_access: 'none', xp_value: 25, form_tips: ['Faster than PFT pace', 'Full recovery', 'Maintain form'] },
  { id: 'sprint_800m', name: '800m Sprints', category: 'running', description: 'Run 800m faster than PFT pace.', sets: 3, distance: '800m', rest_seconds: 180, equipment: [], equipment_access: 'none', xp_value: 25, form_tips: ['Hard but sustainable', 'Stay relaxed', 'Negative split'] },
  { id: 'jog_100_200m', name: 'Jog 100-200m', category: 'running', description: 'Easy jog between exercises.', distance: '100-200m', rest_seconds: 0, equipment: [], equipment_access: 'none', xp_value: 5, form_tips: ['Recovery pace', 'Shake out legs'] },
  { id: 'pft_run', name: 'PFT (3-Mile Timed)', category: 'running', description: '3-mile timed run. Max effort.', distance: '3 miles', rest_seconds: 0, equipment: [], equipment_access: 'none', xp_value: 50, form_tips: ['All-out', 'Start at goal pace', 'Record time'] },

  // ============================
  // SWIMMING
  // ============================
  { id: 'swim_25m', name: 'Swim 25m', category: 'swimming', description: 'Swim 25m side stroke or breast stroke.', distance: '25m', rest_seconds: 15, equipment: ['pool'], equipment_access: 'none', xp_value: 8, form_tips: ['Side stroke or breast stroke', 'Focus on glide'] },
  { id: 'swim_50m', name: 'Swim 50m', category: 'swimming', description: 'Swim 50m.', distance: '50m', rest_seconds: 30, equipment: ['pool'], equipment_access: 'none', xp_value: 12, form_tips: ['Streamline body', 'Switch sides', 'Glide'] },
  { id: 'swim_100m', name: 'Swim 100m', category: 'swimming', description: 'Swim 100m.', distance: '100m', rest_seconds: 30, equipment: ['pool'], equipment_access: 'none', xp_value: 15, form_tips: ['Pace yourself', 'Efficient strokes'] },
  { id: 'swim_200m', name: 'Swim 200m', category: 'swimming', description: 'Swim 200m.', distance: '200m', rest_seconds: 60, equipment: ['pool'], equipment_access: 'none', xp_value: 20, form_tips: ['Steady pace', 'Stay streamlined'] },
  { id: 'swim_300m', name: 'Swim 300m (timed)', category: 'swimming', description: '300m for time. Goal: under 13 min.', distance: '300m', rest_seconds: 0, equipment: ['pool'], equipment_access: 'none', xp_value: 30, form_tips: ['Target under 13 min', 'Record time'] },
  { id: 'swim_500m', name: 'Swim 500m (timed)', category: 'swimming', description: '500m for time. Target: 15 min.', distance: '500m', rest_seconds: 0, equipment: ['pool'], equipment_access: 'none', xp_value: 40, form_tips: ['Target 15 min', 'Record time'] },
  { id: 'swim_800m', name: 'Swim 800m', category: 'swimming', description: 'Swim 800m at steady pace.', distance: '800m', rest_seconds: 0, equipment: ['pool'], equipment_access: 'none', xp_value: 35, form_tips: ['Pace yourself', 'Efficient strokes'] },
  { id: 'tread_water', name: 'Tread Water', category: 'swimming', description: 'Tread water. Build to 30 minutes.', duration_seconds: 600, rest_seconds: 0, equipment: ['pool'], equipment_access: 'none', xp_value: 20, form_tips: ['Minimal energy', 'Stay relaxed'] },
  { id: 'tread_hands_up', name: 'Tread Water (Hands Up)', category: 'swimming', description: 'Tread water holding one hand above surface. Switch hands.', duration_seconds: 30, rest_seconds: 30, equipment: ['pool'], equipment_access: 'none', xp_value: 15, form_tips: ['15 sec each hand', 'Legs only'] },
  { id: 'underwater_swim', name: 'Underwater Swim', category: 'swimming', description: 'Swim pool length underwater.', distance: 'pool length', rest_seconds: 60, equipment: ['pool'], equipment_access: 'none', xp_value: 20, form_tips: ['Streamline', 'Relax', 'Practice breath hold'] },
  { id: 'float_4min', name: '4-Min Survival Float', category: 'swimming', description: 'Float 4 min using flotation technique.', duration_seconds: 240, rest_seconds: 0, equipment: ['pool'], equipment_access: 'none', xp_value: 15, form_tips: ['Sling, splash, or blow technique'] },

  // ============================
  // RUCKING
  // ============================
  { id: 'ruck_1_2mi', name: '1-2 Mile Ruck', category: 'rucking', description: 'Ruck 1-2 miles at 13 min/mile or faster. 45lb dry.', distance: '1-2 miles', rest_seconds: 0, equipment: ['ruck (45 lbs)'], equipment_access: 'minimal', xp_value: 25, form_tips: ['Faster than 13 min/mile', 'Weight high in pack'] },
  { id: 'ruck_4mi', name: '4-Mile Ruck', category: 'rucking', description: '4 miles. Goal: under 1 hour.', distance: '4 miles', rest_seconds: 0, equipment: ['ruck (45 lbs)'], equipment_access: 'minimal', xp_value: 40, form_tips: ['1 hour or less', 'Stay hydrated'] },
  { id: 'ruck_5mi', name: '5-Mile Ruck', category: 'rucking', description: '5 miles. Goal: under 1:30.', distance: '5 miles', rest_seconds: 0, equipment: ['ruck (45 lbs)'], equipment_access: 'minimal', xp_value: 50, form_tips: ['1:30 or less'] },
  { id: 'ruck_6mi', name: '6-Mile Ruck', category: 'rucking', description: '6 miles. Goal: under 1:40.', distance: '6 miles', rest_seconds: 0, equipment: ['ruck (45 lbs)'], equipment_access: 'minimal', xp_value: 55, form_tips: ['1:40 or less'] },
  { id: 'ruck_7mi', name: '7-Mile Ruck', category: 'rucking', description: '7 miles. Goal: under 1:55.', distance: '7 miles', rest_seconds: 0, equipment: ['ruck (45 lbs)'], equipment_access: 'minimal', xp_value: 60, form_tips: ['1:55 or less'] },
  { id: 'ruck_8mi', name: '8-Mile Ruck', category: 'rucking', description: '8 miles. Goal: under 2:15. A&S max: 2hrs.', distance: '8 miles', rest_seconds: 0, equipment: ['ruck (45 lbs)'], equipment_access: 'minimal', xp_value: 65, form_tips: ['2:15 or less', 'A&S max: 2 hours'] },
  { id: 'ruck_9mi', name: '9-Mile Ruck', category: 'rucking', description: '9 miles. Goal: under 2:55.', distance: '9 miles', rest_seconds: 0, equipment: ['ruck (45 lbs)'], equipment_access: 'minimal', xp_value: 70, form_tips: ['2:55 or less'] },
  { id: 'ruck_10mi', name: '10-Mile Ruck', category: 'rucking', description: '10 miles. Goal: under 2:30.', distance: '10 miles', rest_seconds: 0, equipment: ['ruck (45 lbs)'], equipment_access: 'minimal', xp_value: 75, form_tips: ['2:30 or less'] },
  { id: 'ruck_12mi', name: '12-Mile Ruck', category: 'rucking', description: '12 miles. Goal: under 3:00. A&S record: 1:47.', distance: '12 miles', rest_seconds: 0, equipment: ['ruck (45 lbs)'], equipment_access: 'minimal', xp_value: 90, form_tips: ['3:00 or less', 'A&S record: 1:47'] },

  // ============================
  // RECOVERY / POST-WORKOUT
  // ============================
  { id: 'ais_calf', name: 'AIS Calf Stretch', category: 'recovery', description: 'Band around forefoot. Pull, flex foot, hold 2 sec.', sets: 1, reps: 10, rest_seconds: 0, equipment: ['resistance band'], equipment_access: 'minimal', xp_value: 3, form_tips: ['10 reps each side', 'Start with left'] },
  { id: 'ais_hamstring', name: 'AIS Hamstring Stretch', category: 'recovery', description: 'Band around foot. Lift leg straight, gentle pull at end range.', sets: 1, reps: 10, rest_seconds: 0, equipment: ['resistance band'], equipment_access: 'minimal', xp_value: 3, form_tips: ['Knee straight', 'Hold 2 sec'] },
  { id: 'ais_it_band', name: 'AIS IT Band Stretch', category: 'recovery', description: 'Band around foot. Pull working leg across body.', sets: 1, reps: 10, rest_seconds: 0, equipment: ['resistance band'], equipment_access: 'minimal', xp_value: 3, form_tips: ['Opposite hand', 'Shoulders on ground'] },
  { id: 'ais_groin', name: 'AIS Groin Stretch', category: 'recovery', description: 'Band on same side. Sweep leg out keeping knee straight.', sets: 1, reps: 10, rest_seconds: 0, equipment: ['resistance band'], equipment_access: 'minimal', xp_value: 3, form_tips: ['Same side hand', 'Hold 2 sec'] },
  { id: 'ais_quads', name: 'AIS Quadriceps Stretch', category: 'recovery', description: 'Lying on stomach, band over shoulder. Fire hamstring, pull gently.', sets: 1, reps: 10, rest_seconds: 0, equipment: ['resistance band'], equipment_access: 'minimal', xp_value: 3, form_tips: ['Fire glute to lift', 'Hold 2 sec'] },
  { id: 'ais_rotator_cuff', name: 'AIS Rotator Cuff', category: 'recovery', description: 'Lying on side, 90/90 position. External then internal rotation.', sets: 1, reps: 10, rest_seconds: 0, equipment: [], equipment_access: 'none', xp_value: 3, form_tips: ['Gentle assist at end range', '10 each side'] },
  { id: 'ais_thoracic', name: 'Quadruped Thoracic Spine', category: 'recovery', description: 'Hands and knees. Reach across and under, pull back across head.', sets: 1, reps: 5, rest_seconds: 0, equipment: [], equipment_access: 'none', xp_value: 3, form_tips: ['5 each side', 'Continuous motion'] },
  { id: 'ais_middle_back', name: 'AIS Middle Back', category: 'recovery', description: 'Lying on side, rotate torso to put back and arm on ground.', sets: 1, reps: 10, rest_seconds: 0, equipment: [], equipment_access: 'none', xp_value: 3, form_tips: ['Hold top knee down', 'Exhale as you rotate'] },
  { id: 'ais_triceps', name: 'AIS Triceps Stretch', category: 'recovery', description: 'Band behind back. Reach over shoulder down spine.', sets: 1, reps: 10, rest_seconds: 0, equipment: ['resistance band'], equipment_access: 'minimal', xp_value: 3, form_tips: ['Reach down spine', 'Gentle pull'] },
  { id: 'roller_full', name: 'Foam Rolling (Full Body)', category: 'recovery', description: 'Roll calf, hamstring, IT band, quads, groin, glute, back, lats, hip. 20-30 rolls each.', duration_seconds: 600, rest_seconds: 0, equipment: ['foam roller'], equipment_access: 'minimal', xp_value: 10, form_tips: ['20-30 rolls each area', 'Slow on trigger spots', 'Both sides'] },

  // ============================
  // GYM ALTERNATIVES
  // ============================
  { id: 'bench_press', name: 'Bench Press', category: 'strength', description: 'Barbell bench press. Lower to chest, press to lockout.', sets: 3, reps: 10, rest_seconds: 90, equipment: ['barbell', 'bench'], equipment_access: 'gym', xp_value: 15, form_tips: ['Feet flat', 'Touch chest', 'Full lockout'] },
  { id: 'overhead_press', name: 'Overhead Press', category: 'strength', description: 'Barbell or dumbbell press from shoulders to lockout.', sets: 3, reps: 10, rest_seconds: 90, equipment: ['barbell or dumbbells'], equipment_access: 'gym', xp_value: 15, form_tips: ['Brace core', 'Press straight up'] },
  { id: 'barbell_thruster', name: 'Barbell Thruster', category: 'strength', description: 'Front squat into overhead press.', sets: 3, reps: 10, rest_seconds: 90, equipment: ['barbell'], equipment_access: 'gym', xp_value: 18, form_tips: ['Full squat', 'Drive through heels', 'Press at top'] },
  { id: 'barbell_front_squat', name: 'Barbell Front Squat', category: 'strength', description: 'Barbell front rack, squat below parallel.', sets: 3, reps: 10, rest_seconds: 90, equipment: ['barbell'], equipment_access: 'gym', xp_value: 15, form_tips: ['Elbows high', 'Full depth'] },
  { id: 'goblet_squat', name: 'Goblet Squat', category: 'strength', description: 'Hold dumbbell at chest. Deep squat.', sets: 3, reps: 15, rest_seconds: 60, equipment: ['dumbbell or kettlebell'], equipment_access: 'gym', xp_value: 12, form_tips: ['Weight at chest', 'Elbows inside knees'] },
  { id: 'lat_pulldown', name: 'Lat Pulldown', category: 'strength', description: 'Cable lat pulldown to upper chest.', sets: 3, reps: 10, rest_seconds: 90, equipment: ['cable machine'], equipment_access: 'gym', xp_value: 12, form_tips: ['Wide grip', 'Squeeze shoulder blades'] },
  { id: 'deadlift', name: 'Deadlift', category: 'strength', description: 'Conventional barbell deadlift.', sets: 3, reps: 8, rest_seconds: 120, equipment: ['barbell'], equipment_access: 'gym', xp_value: 20, form_tips: ['Back flat', 'Drive through heels'] },
  { id: 'barbell_lunge', name: 'Barbell Walking Lunge', category: 'strength', description: 'Barbell on back, walking lunges.', sets: 3, reps: 12, rest_seconds: 90, equipment: ['barbell'], equipment_access: 'gym', xp_value: 15, form_tips: ['Bar on traps', 'Drive through front heel'] },
  { id: 'turkish_getup', name: 'Turkish Get-Up', category: 'strength', description: 'Floor to standing with weight overhead.', sets: 1, reps: 5, rest_seconds: 60, equipment: ['kettlebell'], equipment_access: 'gym', xp_value: 15, form_tips: ['Keep arm vertical', 'Deliberate positions'] },
  { id: 'sled_drag', name: 'Sled Drag', category: 'strength', description: 'Walk backward dragging sled for 20m.', distance: '20m', rest_seconds: 60, equipment: ['sled'], equipment_access: 'gym', xp_value: 12, form_tips: ['Low stance', 'Drive through legs'] },
  { id: 'hanging_leg_raises', name: 'Hanging Leg Raises', category: 'strength', description: 'Hang from bar, raise legs to 90°.', sets: 3, reps: 12, rest_seconds: 60, equipment: ['pull-up bar'], equipment_access: 'gym', xp_value: 12, form_tips: ['Control descent', 'No swinging'] },

  // ============================
  // RANGER PRE-SURT EXERCISES
  // ============================
  // Barbell Strength
  { id: 'back_squat', name: 'Back Squat', category: 'strength', description: 'Barbell on upper back. Squat below parallel, drive through heels to lockout.', sets: 4, reps: 6, rest_seconds: 120, equipment: ['barbell', 'squat rack'], equipment_access: 'gym', xp_value: 20, form_tips: ['Bar on upper traps', 'Break at hips and knees', 'Knees track over toes', 'Drive through heels', 'Full depth below parallel'] },
  { id: 'rdl', name: 'Romanian Deadlift (RDL)', category: 'strength', description: 'Hinge at hips with slight knee bend. Lower barbell along shins, squeeze glutes to return.', sets: 4, reps: 10, rest_seconds: 90, equipment: ['barbell'], equipment_access: 'gym', xp_value: 18, form_tips: ['Hinge at hips, not lower back', 'Bar stays close to body', 'Feel hamstring stretch', 'Squeeze glutes at top'] },
  { id: 'weighted_step_up', name: 'Weighted Step-Up', category: 'strength', description: 'Hold dumbbells, step onto box driving through front heel. Fully extend at top.', sets: 3, reps: 8, rest_seconds: 60, equipment: ['dumbbells', 'box/bench'], equipment_access: 'gym', xp_value: 15, form_tips: ['Drive through front heel', 'Full hip extension at top', 'Control descent', '8 reps each side'] },
  { id: 'kb_swings', name: 'Kettlebell Swings', category: 'strength', description: 'Explosive hip hinge swinging kettlebell to shoulder height. Power from hips, not arms.', sets: 3, reps: 10, rest_seconds: 60, equipment: ['kettlebell'], equipment_access: 'gym', xp_value: 15, form_tips: ['Hinge not squat', 'Snap hips forward', 'Arms are pendulums', 'Shoulder height'] },
  { id: 'lateral_lunge', name: 'Lateral Lunge', category: 'strength', description: 'Step wide to side, sit hips back, keeping other leg straight. Push back to start.', sets: 3, reps: 8, rest_seconds: 60, equipment: [], equipment_access: 'none', xp_value: 12, form_tips: ['Wide step', 'Hips back', 'Straight trailing leg', '8 reps each side'] },
  { id: 'strict_pullup', name: 'Slow & Strict Pull-Up', category: 'strength', description: 'Dead hang, pull slowly to chin above bar. 3-second descent. No kipping.', sets: 3, reps: 4, rest_seconds: 90, equipment: ['pull-up bar'], equipment_access: 'minimal', xp_value: 18, form_tips: ['Dead hang start', '3-sec eccentric', 'No kipping', 'Add weight if needed'] },
  { id: 'bent_over_rows', name: 'Bent-Over Rows', category: 'strength', description: 'Hinged forward 45°, pull barbell to lower chest. Squeeze shoulder blades.', sets: 3, reps: 10, rest_seconds: 90, equipment: ['barbell'], equipment_access: 'gym', xp_value: 15, form_tips: ['45° torso angle', 'Pull to lower chest', 'Squeeze at top', 'Control descent'] },
  { id: 'close_grip_pushups', name: 'Close Grip Push-Ups', category: 'calisthenics', description: 'Push-up with hands inside shoulder width. Targets triceps.', sets: 3, reps: 12, rest_seconds: 60, equipment: [], equipment_access: 'none', xp_value: 12, form_tips: ['Hands inside shoulders', 'Elbows tight to body', 'Full range of motion'] },
  { id: 'bent_over_reverse_flys', name: 'Bent Over Reverse Flys', category: 'strength', description: 'Hinged forward, raise light dumbbells out to sides. Squeeze rear deltoids.', sets: 3, reps: 20, rest_seconds: 60, equipment: ['light dumbbells'], equipment_access: 'gym', xp_value: 10, form_tips: ['Light weight, high reps', 'Squeeze shoulder blades', 'Controlled movement'] },
  { id: 'weighted_rear_lunges', name: 'Weighted Rear Lunges', category: 'strength', description: 'Hold dumbbells, step backward into lunge. Front knee at 90°. Drive through front heel.', sets: 4, reps: 8, rest_seconds: 60, equipment: ['dumbbells'], equipment_access: 'gym', xp_value: 15, form_tips: ['Step back, not forward', 'Front knee 90°', '8 reps each side', 'Drive through front heel'] },
  { id: 'split_squats', name: 'Split Squats', category: 'strength', description: 'Rear foot elevated on bench. Lower until front thigh parallel. Drive up.', sets: 3, reps: 8, rest_seconds: 60, equipment: ['bench'], equipment_access: 'gym', xp_value: 15, form_tips: ['Rear foot on bench', 'Upright torso', '8 reps each side', 'Control descent'] },
  { id: 'hip_thrusts', name: 'Hip Thrusts', category: 'strength', description: 'Back on bench, barbell across hips. Drive hips up to full extension. Squeeze glutes.', sets: 3, reps: 10, rest_seconds: 60, equipment: ['barbell', 'bench'], equipment_access: 'gym', xp_value: 15, form_tips: ['Back on bench', 'Drive through heels', 'Full hip extension', 'Squeeze glutes at top'] },
  { id: 'single_leg_rdl', name: 'Single-Leg RDL', category: 'strength', description: 'Stand on one leg, hinge forward with flat back. Opposite leg extends behind.', sets: 3, reps: 8, rest_seconds: 60, equipment: ['dumbbell'], equipment_access: 'gym', xp_value: 15, form_tips: ['Flat back', 'Slight knee bend', '8 reps each side', 'Hinge not round'] },
  { id: 'strict_standing_press', name: 'Strict Standing Press', category: 'strength', description: 'Barbell from front rack to overhead with no leg drive. Pure shoulder strength.', sets: 4, reps: 6, rest_seconds: 120, equipment: ['barbell'], equipment_access: 'gym', xp_value: 18, form_tips: ['No leg drive', 'Brace core', 'Press straight overhead', 'Full lockout'] },
  { id: 'inverted_rows', name: 'Inverted Rows', category: 'strength', description: 'Hang under bar or rings at 45°. Pull chest to bar keeping body straight.', sets: 4, reps: 10, rest_seconds: 60, equipment: ['bar or rings'], equipment_access: 'minimal', xp_value: 12, form_tips: ['Body straight like reverse plank', 'Pull to chest', 'Squeeze shoulder blades', 'Control descent'] },
  { id: 'dips', name: 'Dips', category: 'strength', description: 'On parallel bars, lower body until upper arms parallel to floor. Press to lockout.', sets: 3, reps: 12, rest_seconds: 60, equipment: ['dip bars'], equipment_access: 'gym', xp_value: 15, form_tips: ['Upper arms to parallel', 'Lean slightly forward for chest', 'Full lockout at top'] },
  { id: 'face_pulls', name: 'Face Pulls', category: 'strength', description: 'Cable rope at face height. Pull handles to ears, externally rotating shoulders.', sets: 3, reps: 20, rest_seconds: 60, equipment: ['cable machine', 'rope'], equipment_access: 'gym', xp_value: 10, form_tips: ['Light weight, high reps', 'Pull to ears', 'External rotation at end', 'Squeeze rear delts'] },
  { id: 'strict_situps', name: 'Strict Sit-Ups', category: 'core', description: 'Feet anchored, hands across chest. Full sit-up touching elbows to thighs.', sets: 3, reps: 30, rest_seconds: 60, equipment: [], equipment_access: 'none', xp_value: 10, form_tips: ['Feet anchored', 'Hands across chest', 'Full range from ground to up', 'Control descent'] },
  { id: 'strict_chinups', name: 'Strict Chin-Ups', category: 'strength', description: 'Underhand grip, dead hang. Pull slowly to chin above bar. No momentum.', sets: 3, reps: 6, rest_seconds: 90, equipment: ['pull-up bar'], equipment_access: 'minimal', xp_value: 18, form_tips: ['Underhand/supinated grip', 'Dead hang start', 'Controlled tempo', 'Add weight as needed'] },
  { id: 'strict_pushups', name: 'Strict Push-Ups', category: 'calisthenics', description: 'Standard push-up with perfect form. Chest to deck, full lockout. No sagging.', sets: 3, reps: 20, rest_seconds: 60, equipment: [], equipment_access: 'none', xp_value: 12, form_tips: ['Chest touches ground', 'Full lockout at top', 'Body straight', 'No sagging hips'] },
  // Ranger Prep/Warmup
  { id: 'straight_arm_pulls', name: 'Straight Arm Pulls', category: 'warmup', description: 'Straight arms, pull resistance band apart at chest height. Engage lats and rear delts.', sets: 1, reps: 5, rest_seconds: 0, equipment: ['resistance band'], equipment_access: 'minimal', xp_value: 5, form_tips: ['Arms straight', 'Chest height', 'Squeeze shoulder blades'] },
  { id: 'thoracic_rotations', name: 'Thoracic Spine Rotations', category: 'warmup', description: 'On all fours or seated, hand behind head. Rotate upper body, opening chest to ceiling.', sets: 1, reps: 8, rest_seconds: 0, equipment: [], equipment_access: 'none', xp_value: 5, form_tips: ['8 each side', 'Open chest fully', 'Hips stay square'] },
  { id: 'lat_hang_stretch', name: 'Lat Hang Stretch', category: 'warmup', description: 'Dead hang from pull-up bar to stretch lats and decompress spine.', duration_seconds: 20, rest_seconds: 0, equipment: ['pull-up bar'], equipment_access: 'minimal', xp_value: 5, form_tips: ['Relax completely', '20 seconds', 'Full dead hang'] },
  { id: 'db_curl_to_press', name: 'DB Curl to Press', category: 'warmup', description: 'Light dumbbell curl into overhead press. Warm up biceps, shoulders.', sets: 1, reps: 10, rest_seconds: 0, equipment: ['light dumbbells'], equipment_access: 'gym', xp_value: 5, form_tips: ['Light weight', 'Smooth transition', 'Full lockout overhead'] },
  { id: 'light_bent_over_row', name: 'Light Bent-Over Row', category: 'warmup', description: 'Light barbell bent-over row to warm up back and lats.', sets: 1, reps: 10, rest_seconds: 0, equipment: ['light barbell'], equipment_access: 'gym', xp_value: 5, form_tips: ['Light weight', 'Activate lats', 'Warm up movement'] },
  { id: 'light_overhead_press', name: 'Light Overhead Press', category: 'warmup', description: 'Light barbell or dumbbells pressed overhead to warm up shoulders.', sets: 1, reps: 10, rest_seconds: 0, equipment: ['light barbell or dumbbells'], equipment_access: 'gym', xp_value: 5, form_tips: ['Light weight', 'Full range', 'Warm up shoulders'] },
  { id: 'light_squat', name: 'Light Squat', category: 'warmup', description: 'Empty bar or light weight squats to warm up legs and spine.', sets: 1, reps: 6, rest_seconds: 0, equipment: ['barbell'], equipment_access: 'gym', xp_value: 5, form_tips: ['Light weight', 'Full depth', '5-6 reps'] },
  { id: 'rear_lunge_warmup', name: 'Rear Lunge (Warmup)', category: 'warmup', description: 'Bodyweight reverse lunge to warm up quads, glutes, and hip flexors.', sets: 1, reps: 10, rest_seconds: 0, equipment: [], equipment_access: 'none', xp_value: 5, form_tips: ['10 each side', 'Control step back', 'Drive through front heel'] },
  { id: 'bodyweight_hip_thrusts', name: 'Bodyweight Hip Thrusts', category: 'warmup', description: 'Shoulders on bench, drive hips up. Bodyweight only to activate glutes.', sets: 1, reps: 10, rest_seconds: 0, equipment: ['bench'], equipment_access: 'gym', xp_value: 5, form_tips: ['Squeeze glutes at top', 'Full extension', 'Activate posterior chain'] },
  // Ranger Endurance
  { id: 'run_400m_repeats', name: '400m Repeats', category: 'running', description: 'Track repeats at 5K race pace based on assessment splits.', sets: 8, distance: '400m', rest_seconds: 120, equipment: [], equipment_access: 'none', xp_value: 25, form_tips: ['Use assessment-based split times', '400m recovery walk between', 'Maintain form throughout'] },
  { id: 'run_800m_repeats', name: '800m Repeats', category: 'running', description: 'Track repeats at 5K race pace based on assessment splits.', sets: 5, distance: '800m', rest_seconds: 120, equipment: [], equipment_access: 'none', xp_value: 30, form_tips: ['Use assessment-based splits', '400m recovery walk between', 'Focus on even pacing'] },
  { id: 'run_1600m_repeats', name: '1600m Repeats', category: 'running', description: 'Track repeats at 15s/mile faster than 5-mile assessment.', sets: 2, distance: '1600m', rest_seconds: 180, equipment: [], equipment_access: 'none', xp_value: 35, form_tips: ['15s/mile faster than assessment', '400m recovery walk', 'Strong finish'] },
  { id: 'run_1000m_repeats', name: '1000m Repeats', category: 'running', description: 'Track repeats at tempo pace with recovery walks.', sets: 4, distance: '1000m', rest_seconds: 120, equipment: [], equipment_access: 'none', xp_value: 30, form_tips: ['Tempo pace', '400m recovery walk', 'Even splits'] },
  { id: 'tempo_run_short', name: 'Short Tempo Run', category: 'running', description: 'Tempo miles at 20 seconds slower than 5-mile assessment pace.', distance: '2-3 miles', rest_seconds: 0, equipment: [], equipment_access: 'none', xp_value: 30, form_tips: ['20s slower than assessment pace', 'Comfortably hard', 'Include warm-up/cool-down miles'] },
  { id: 'tempo_run_mid', name: 'Mid Tempo Run', category: 'running', description: 'Tempo miles at 40 seconds slower than 5-mile assessment pace.', distance: '3-4 miles', rest_seconds: 0, equipment: [], equipment_access: 'none', xp_value: 35, form_tips: ['40s slower than assessment pace', 'Comfortably hard', 'Include warm-up/cool-down miles'] },
  { id: 'easy_pace_run', name: 'Easy Pace Run', category: 'running', description: 'Zone 2 conversation-pace run. Usually 2 min/mile slower than assessment.', distance: '3-7 miles', rest_seconds: 0, equipment: [], equipment_access: 'none', xp_value: 25, form_tips: ['Zone 2 effort', 'Can hold conversation', '2 min/mi slower than assessment', 'Build aerobic base'] },
  { id: 'pyramid_track', name: 'Pyramid Track Workout', category: 'running', description: '200-400-600-800-800-600-400-200m with 400m recovery walks.', distance: '4000m total', rest_seconds: 120, equipment: [], equipment_access: 'none', xp_value: 35, form_tips: ['Assessment-based splits', '400m walk recovery', 'Ladder up then down'] },
  // Ranger Ruck (lighter 35# for Ranger vs 45# for MARSOC)
  { id: 'ruck_4mi_35', name: '4-Mile Ruck (35#)', category: 'rucking', description: 'Ruck 4 miles with 35lb pack. No running.', distance: '4 miles', rest_seconds: 0, equipment: ['ruck (35 lbs)'], equipment_access: 'minimal', xp_value: 35, form_tips: ['No running', 'Fast walking pace', 'Maintain posture'] },
  { id: 'ruck_5mi_35', name: '5-Mile Ruck (35#)', category: 'rucking', description: 'Ruck 5 miles with 35lb pack. No running.', distance: '5 miles', rest_seconds: 0, equipment: ['ruck (35 lbs)'], equipment_access: 'minimal', xp_value: 45, form_tips: ['No running', 'Steady pace', 'Hydrate'] },
  { id: 'ruck_6mi_35', name: '6-Mile Ruck (35#)', category: 'rucking', description: 'Ruck 6 miles with 35lb pack.', distance: '6 miles', rest_seconds: 0, equipment: ['ruck (35 lbs)'], equipment_access: 'minimal', xp_value: 50, form_tips: ['Consistent pace', 'Stay hydrated'] },
  { id: 'ruck_3mi_heavy', name: '3-Mile Heavy Ruck (55-60#)', category: 'rucking', description: 'Ruck 3 miles with 55-60lb pack. Build load tolerance.', distance: '3 miles', rest_seconds: 0, equipment: ['ruck (55-60 lbs)'], equipment_access: 'minimal', xp_value: 50, form_tips: ['Heavy load', 'Maintain posture', 'Drive through pace'] },
  { id: 'ruck_2mi_heavy', name: '2-Mile Heavy Ruck (55-60#)', category: 'rucking', description: 'Ruck 2 miles with 55-60lb pack. De-load week.', distance: '2 miles', rest_seconds: 0, equipment: ['ruck (55-60 lbs)'], equipment_access: 'minimal', xp_value: 35, form_tips: ['Heavy load, shorter distance', 'Maintain form'] },
  { id: 'ruck_4mi_35_fast', name: '4-Mile Ruck (35# Fast)', category: 'rucking', description: 'Ruck 4 miles with 35lb pack. 15-20 seconds faster per mile than normal. No running.', distance: '4 miles', rest_seconds: 0, equipment: ['ruck (35 lbs)'], equipment_access: 'minimal', xp_value: 40, form_tips: ['15-20s/mi faster', 'No running', 'Push pace'] },
  // Ranger Functional / Carry / Sled
  { id: 'sled_pull_backwards', name: 'Sled Pull (Backwards Drag)', category: 'strength', description: 'Face sled, walk backward dragging it 50m. Engages quads, back, and grip.', sets: 6, distance: '50m', rest_seconds: 60, equipment: ['sled'], equipment_access: 'gym', xp_value: 15, form_tips: ['Low stance', 'Drive through legs backward', 'Keep arms extended'] },
  { id: 'sled_push_quick', name: 'Quick Sled Push', category: 'strength', description: 'Arms extended, drive sled forward 50m as fast as possible.', sets: 6, distance: '50m', rest_seconds: 60, equipment: ['sled'], equipment_access: 'gym', xp_value: 15, form_tips: ['Body at 45°', 'Drive through legs', 'Arms extended', 'Maximum effort'] },
  { id: 'pinch_grip_plate_carry', name: 'Pinch Grip Plate Carry', category: 'strength', description: 'Pinch grip weight plates, walk 60m. Builds extreme grip strength.', sets: 6, distance: '60m', rest_seconds: 60, equipment: ['weight plates'], equipment_access: 'gym', xp_value: 15, form_tips: ['Pinch plates with fingers', 'Upright posture', 'Grip is king'] },
  { id: 'gorilla_rows', name: 'Gorilla Rows', category: 'strength', description: 'Staggered stance, pull two kettlebells alternating. Row one while bracing on other.', sets: 6, reps: 12, rest_seconds: 60, equipment: ['kettlebells'], equipment_access: 'gym', xp_value: 15, form_tips: ['Alternate sides', 'Brace on non-working KB', 'Squeeze at top'] },
  { id: 'running_buildups', name: '40-Yard Running Build-Ups', category: 'running', description: 'Progressive acceleration over 40 yards. Build to 85-90% max speed.', sets: 8, distance: '40 yards', rest_seconds: 45, equipment: [], equipment_access: 'none', xp_value: 10, form_tips: ['Focus on technique', 'Terminate at 85-90%', 'Not all-out sprints'] },
  { id: 'carry_choice_50m', name: 'Carry Choice (50m)', category: 'strength', description: 'Choose: farmers walk, racked carry, offset, suitcase, waiters walk, bottoms up, or trap bar carry.', distance: '50m', rest_seconds: 30, equipment: ['kettlebells or dumbbells'], equipment_access: 'gym', xp_value: 12, form_tips: ['Mix carry types each round', 'Maintain posture', 'Challenge grip'] },
  { id: 'sled_drag_choice_50m', name: 'Sled/Drag Choice (50m)', category: 'strength', description: 'Choose: sled push, drag, cross-over drag, lateral, bear crawl push/drag, belt attach, or backpedal.', distance: '50m', rest_seconds: 30, equipment: ['sled'], equipment_access: 'gym', xp_value: 12, form_tips: ['Vary drag style each round', 'Low center of gravity'] },
  { id: 'locomotive_choice_50m', name: 'Locomotive Choice (50m)', category: 'calisthenics', description: 'Choose: MMDs, guerilla drills, bear crawls, or high/low crawl for 50m.', distance: '50m', rest_seconds: 30, equipment: [], equipment_access: 'none', xp_value: 10, form_tips: ['Mix movement each round', 'Keep low', 'Continuous movement'] },
  { id: 'recovery_swim', name: 'Recovery Swim/Flush', category: 'swimming', description: '30 minutes easy swimming or non-impact endurance machine for recovery.', duration_seconds: 1800, rest_seconds: 0, equipment: ['pool or machine'], equipment_access: 'gym', xp_value: 15, form_tips: ['Easy effort', 'Recovery focus', 'Loosen up'] },
  { id: 'conditioning_sprint_interval', name: 'Sprint Intervals (Machine)', category: 'strength', description: 'Non-impact endurance machine: 30s sprint, variable rest. 10-12 reps.', sets: 12, duration_seconds: 30, rest_seconds: 90, equipment: ['rowing machine, bike, or elliptical'], equipment_access: 'gym', xp_value: 15, form_tips: ['Max effort 30s', 'Full recovery between', 'Non-impact machine'] },
  { id: 'conditioning_flush', name: 'Conditioning Flush (20 min)', category: 'strength', description: '20 minutes easy on non-impact endurance machine. Zone 1-2 effort.', duration_seconds: 1200, rest_seconds: 0, equipment: ['rowing machine, bike, or elliptical'], equipment_access: 'gym', xp_value: 10, form_tips: ['Easy effort', 'Recovery flush', 'Conversational pace'] },

  // ============================
  // UTILITY
  // ============================
  { id: 'rest_2min', name: 'Rest', category: 'recovery', description: 'Active rest. Hydrate.', duration_seconds: 120, rest_seconds: 0, equipment: [], equipment_access: 'none', xp_value: 0, form_tips: ['Hydrate', 'Shake out muscles'] },
  { id: 'assess_feet_gear', name: 'Assess Feet & Gear', category: 'recovery', description: 'Check feet, change socks, powder feet. Check gear.', duration_seconds: 300, rest_seconds: 0, equipment: [], equipment_access: 'none', xp_value: 5, form_tips: ['Clip toenails', 'Powder feet', 'Moleskin on hot spots'] },
];

// ============================================================
// EXERCISE ENRICHMENT DATA
// Muscle groups, step-by-step instructions, illustrations
// ============================================================

const MUSCLE_GROUPS: Record<string, string[]> = {
  // Warmup
  ankles_hips_shoulders: ['hips', 'shoulders', 'thoracic spine'],
  hip_bridge: ['glutes', 'hamstrings', 'core'],
  elbow_pushups: ['chest', 'triceps', 'shoulders', 'core'],
  bird_dog: ['core', 'glutes', 'shoulders'],
  frog_squat_warmup: ['quads', 'glutes', 'adductors', 'hips'],
  worlds_greatest_stretch: ['hips', 'thoracic spine', 'hamstrings', 'quads'],
  inchworm: ['hamstrings', 'shoulders', 'core'],
  walking_high_knees: ['hip flexors', 'quads', 'core'],
  walking_quads_pulls: ['quads', 'hip flexors'],
  cradles: ['glutes', 'hips', 'balance'],
  backwards_hamstring: ['hamstrings', 'balance', 'core'],
  high_knees: ['hip flexors', 'quads', 'cardiovascular'],
  butt_kicks: ['hamstrings', 'quads', 'cardiovascular'],
  // Core
  forward_plank: ['core', 'shoulders', 'hip flexors'],
  side_plank: ['obliques', 'shoulders', 'hips'],
  flutter_kicks: ['lower abs', 'hip flexors', 'core'],
  knees_to_elbows: ['abs', 'hip flexors', 'grip', 'lats'],
  usmc_crunches: ['abs', 'hip flexors'],
  mountain_climbers: ['core', 'shoulders', 'hip flexors', 'cardiovascular'],
  // Calisthenics
  pushups: ['chest', 'triceps', 'shoulders', 'core'],
  hand_release_pushups: ['chest', 'triceps', 'shoulders', 'core'],
  lunges_counter_rotation: ['quads', 'glutes', 'core', 'obliques'],
  frog_squats: ['quads', 'glutes', 'adductors', 'hips'],
  ammo_can_push_press: ['shoulders', 'triceps', 'core', 'legs'],
  ammo_can_thruster: ['quads', 'glutes', 'shoulders', 'core'],
  ammo_can_front_squats: ['quads', 'glutes', 'core', 'shoulders'],
  air_squats: ['quads', 'glutes', 'hamstrings'],
  burpees: ['full body', 'cardiovascular'],
  skaters: ['glutes', 'quads', 'balance', 'cardiovascular'],
  dumbbell_getups: ['core', 'shoulders', 'legs', 'balance'],
  sandbag_getups: ['core', 'shoulders', 'legs', 'grip'],
  tire_flips: ['back', 'legs', 'core', 'grip'],
  high_crawl: ['shoulders', 'core', 'hip flexors'],
  pullups: ['back', 'biceps', 'forearms', 'core'],
  chinups: ['biceps', 'back', 'forearms'],
  farmers_carry: ['grip', 'traps', 'core', 'legs'],
  partner_drags: ['legs', 'back', 'core', 'grip'],
  walking_ammo_can_lunge: ['quads', 'glutes', 'core', 'grip'],
  broad_jumps: ['quads', 'glutes', 'calves', 'power'],
  walking_lunges: ['quads', 'glutes', 'hamstrings', 'balance'],
  // Running
  run_1_5mi: ['cardiovascular', 'legs'],
  run_3mi: ['cardiovascular', 'legs', 'endurance'],
  sprint_200m: ['quads', 'hamstrings', 'cardiovascular', 'power'],
  sprint_400m: ['cardiovascular', 'legs', 'anaerobic'],
  sprint_800m: ['cardiovascular', 'legs', 'lactate threshold'],
  jog_100_200m: ['cardiovascular', 'recovery'],
  pft_run: ['cardiovascular', 'legs', 'mental toughness'],
  // Swimming
  swim_25m: ['shoulders', 'back', 'core'],
  swim_50m: ['shoulders', 'back', 'core', 'legs'],
  swim_100m: ['shoulders', 'back', 'core', 'cardiovascular'],
  swim_200m: ['full body', 'cardiovascular', 'endurance'],
  swim_300m: ['full body', 'cardiovascular', 'endurance'],
  swim_500m: ['full body', 'cardiovascular', 'endurance', 'mental toughness'],
  swim_800m: ['full body', 'cardiovascular', 'endurance'],
  tread_water: ['legs', 'core', 'endurance'],
  tread_hands_up: ['legs', 'core', 'mental toughness'],
  underwater_swim: ['core', 'breath control', 'mental toughness'],
  float_4min: ['relaxation', 'breath control'],
  // Rucking
  ruck_1_2mi: ['legs', 'back', 'shoulders', 'core'],
  ruck_4mi: ['legs', 'back', 'shoulders', 'core', 'endurance'],
  ruck_5mi: ['legs', 'back', 'shoulders', 'core', 'endurance'],
  ruck_6mi: ['legs', 'back', 'shoulders', 'core', 'endurance'],
  ruck_7mi: ['legs', 'back', 'shoulders', 'core', 'endurance'],
  ruck_8mi: ['legs', 'back', 'shoulders', 'core', 'endurance', 'mental toughness'],
  ruck_9mi: ['legs', 'back', 'shoulders', 'core', 'endurance', 'mental toughness'],
  ruck_10mi: ['legs', 'back', 'shoulders', 'core', 'endurance', 'mental toughness'],
  ruck_12mi: ['full body', 'endurance', 'mental toughness'],
  // Recovery
  ais_calf: ['calves'],
  ais_hamstring: ['hamstrings'],
  ais_it_band: ['IT band', 'hip'],
  ais_groin: ['adductors'],
  ais_quads: ['quads', 'hip flexors'],
  ais_rotator_cuff: ['rotator cuff', 'shoulders'],
  ais_thoracic: ['thoracic spine', 'shoulders'],
  ais_middle_back: ['middle back', 'thoracic spine'],
  ais_triceps: ['triceps'],
  roller_full: ['full body', 'fascia'],
  // Gym alternatives
  bench_press: ['chest', 'triceps', 'shoulders'],
  overhead_press: ['shoulders', 'triceps', 'core'],
  barbell_thruster: ['quads', 'glutes', 'shoulders', 'core'],
  barbell_front_squat: ['quads', 'glutes', 'core'],
  goblet_squat: ['quads', 'glutes', 'core'],
  lat_pulldown: ['lats', 'biceps', 'upper back'],
  deadlift: ['back', 'glutes', 'hamstrings', 'core', 'grip'],
  barbell_lunge: ['quads', 'glutes', 'hamstrings', 'core'],
  turkish_getup: ['full body', 'core', 'shoulders', 'balance'],
  sled_drag: ['legs', 'back', 'core', 'grip'],
  hanging_leg_raises: ['lower abs', 'hip flexors', 'grip'],
  // Ranger Pre-SURT
  back_squat: ['quads', 'glutes', 'hamstrings', 'core', 'back'],
  rdl: ['hamstrings', 'glutes', 'lower back', 'grip'],
  weighted_step_up: ['quads', 'glutes', 'balance'],
  kb_swings: ['glutes', 'hamstrings', 'core', 'shoulders', 'power'],
  lateral_lunge: ['adductors', 'quads', 'glutes', 'hips'],
  strict_pullup: ['back', 'biceps', 'forearms', 'core'],
  bent_over_rows: ['upper back', 'lats', 'biceps', 'core'],
  close_grip_pushups: ['triceps', 'chest', 'shoulders'],
  bent_over_reverse_flys: ['rear deltoids', 'upper back', 'rhomboids'],
  weighted_rear_lunges: ['quads', 'glutes', 'hamstrings', 'balance'],
  split_squats: ['quads', 'glutes', 'balance', 'core'],
  hip_thrusts: ['glutes', 'hamstrings', 'core'],
  single_leg_rdl: ['hamstrings', 'glutes', 'balance', 'core'],
  strict_standing_press: ['shoulders', 'triceps', 'core', 'traps'],
  inverted_rows: ['upper back', 'biceps', 'core'],
  dips: ['triceps', 'chest', 'shoulders'],
  face_pulls: ['rear deltoids', 'upper back', 'rotator cuff'],
  strict_situps: ['abs', 'hip flexors', 'core'],
  strict_chinups: ['biceps', 'back', 'forearms'],
  strict_pushups: ['chest', 'triceps', 'shoulders', 'core'],
  straight_arm_pulls: ['lats', 'rear deltoids', 'upper back'],
  thoracic_rotations: ['thoracic spine', 'obliques'],
  lat_hang_stretch: ['lats', 'shoulders', 'spine'],
  db_curl_to_press: ['biceps', 'shoulders'],
  light_bent_over_row: ['upper back', 'lats'],
  light_overhead_press: ['shoulders', 'triceps'],
  light_squat: ['quads', 'glutes'],
  rear_lunge_warmup: ['quads', 'glutes', 'hip flexors'],
  bodyweight_hip_thrusts: ['glutes', 'hamstrings'],
  run_400m_repeats: ['cardiovascular', 'legs', 'speed'],
  run_800m_repeats: ['cardiovascular', 'legs', 'lactate threshold'],
  run_1600m_repeats: ['cardiovascular', 'legs', 'vo2max'],
  run_1000m_repeats: ['cardiovascular', 'legs', 'tempo'],
  tempo_run_short: ['cardiovascular', 'legs', 'lactate threshold'],
  tempo_run_mid: ['cardiovascular', 'legs', 'endurance'],
  easy_pace_run: ['cardiovascular', 'legs', 'aerobic base'],
  pyramid_track: ['cardiovascular', 'legs', 'speed', 'endurance'],
  ruck_4mi_35: ['legs', 'back', 'core', 'endurance'],
  ruck_5mi_35: ['legs', 'back', 'core', 'endurance'],
  ruck_6mi_35: ['legs', 'back', 'core', 'endurance'],
  ruck_3mi_heavy: ['legs', 'back', 'core', 'endurance', 'strength'],
  ruck_2mi_heavy: ['legs', 'back', 'core', 'strength'],
  ruck_4mi_35_fast: ['legs', 'back', 'core', 'endurance', 'speed'],
  sled_pull_backwards: ['quads', 'back', 'grip', 'core'],
  sled_push_quick: ['quads', 'glutes', 'core', 'power'],
  pinch_grip_plate_carry: ['grip', 'forearms', 'core', 'traps'],
  gorilla_rows: ['back', 'biceps', 'core', 'grip'],
  running_buildups: ['legs', 'speed', 'technique'],
  carry_choice_50m: ['grip', 'core', 'shoulders', 'full body'],
  sled_drag_choice_50m: ['legs', 'back', 'core', 'grip'],
  locomotive_choice_50m: ['full body', 'core', 'endurance'],
  recovery_swim: ['full body', 'recovery'],
  conditioning_sprint_interval: ['cardiovascular', 'legs', 'power'],
  conditioning_flush: ['cardiovascular', 'recovery'],
};

const ILLUSTRATIONS: Record<string, string> = {
  // Warmup
  ankles_hips_shoulders: '🔄', hip_bridge: '🌉', elbow_pushups: '💪', bird_dog: '🐕',
  frog_squat_warmup: '🐸', worlds_greatest_stretch: '🌍', inchworm: '🐛',
  walking_high_knees: '🦵', walking_quads_pulls: '🦿', cradles: '🤱',
  backwards_hamstring: '🔙', high_knees: '⬆️', butt_kicks: '👢',
  // Core
  forward_plank: '🧱', side_plank: '📐', flutter_kicks: '🦋',
  knees_to_elbows: '🧲', usmc_crunches: '💫', mountain_climbers: '⛰️',
  // Calisthenics
  pushups: '🫸', hand_release_pushups: '✋', lunges_counter_rotation: '🔁',
  frog_squats: '🐸', ammo_can_push_press: '📦', ammo_can_thruster: '🚀',
  ammo_can_front_squats: '🏋️', air_squats: '⬇️', burpees: '💥',
  skaters: '⛸️', dumbbell_getups: '🆙', sandbag_getups: '🎒',
  tire_flips: '🛞', high_crawl: '🐊', pullups: '💪', chinups: '🤙',
  farmers_carry: '🧑‍🌾', partner_drags: '🤝', walking_ammo_can_lunge: '🚶',
  broad_jumps: '🦘', walking_lunges: '🚶‍♂️',
  // Running
  run_1_5mi: '🏃', run_3mi: '🏃‍♂️', sprint_200m: '⚡', sprint_400m: '⚡',
  sprint_800m: '🏃‍♀️', jog_100_200m: '🚶‍♂️', pft_run: '🎖️',
  // Swimming
  swim_25m: '🏊', swim_50m: '🏊', swim_100m: '🏊‍♂️', swim_200m: '🌊',
  swim_300m: '🌊', swim_500m: '🦈', swim_800m: '🐋',
  tread_water: '🧘‍♂️', tread_hands_up: '🙌', underwater_swim: '🤿', float_4min: '🛟',
  // Rucking
  ruck_1_2mi: '🎒', ruck_4mi: '🎒', ruck_5mi: '🎒', ruck_6mi: '🎒',
  ruck_7mi: '🎒', ruck_8mi: '🎒', ruck_9mi: '🎒', ruck_10mi: '🎒', ruck_12mi: '🎒',
  // Recovery
  ais_calf: '🧘', ais_hamstring: '🧘', ais_it_band: '🧘', ais_groin: '🧘',
  ais_quads: '🧘', ais_rotator_cuff: '🧘', ais_thoracic: '🧘',
  ais_middle_back: '🧘', ais_triceps: '🧘', roller_full: '🧴',
  // Gym
  bench_press: '🏋️', overhead_press: '🏋️‍♂️', barbell_thruster: '🏋️',
  barbell_front_squat: '🏋️', goblet_squat: '🏋️', lat_pulldown: '🏋️',
  deadlift: '🏋️‍♀️', barbell_lunge: '🏋️', turkish_getup: '🏋️',
  sled_drag: '🛷', hanging_leg_raises: '🪜',
  // Ranger Pre-SURT
  back_squat: '🏋️', rdl: '🏋️‍♀️', weighted_step_up: '🪜', kb_swings: '🔔',
  lateral_lunge: '↔️', strict_pullup: '💪', bent_over_rows: '🚣',
  close_grip_pushups: '🫸', bent_over_reverse_flys: '🦅',
  weighted_rear_lunges: '🦵', split_squats: '🦿', hip_thrusts: '🍑',
  single_leg_rdl: '🦩', strict_standing_press: '🏋️‍♂️', inverted_rows: '🔄',
  dips: '⬇️', face_pulls: '🎯', strict_situps: '💫', strict_chinups: '💪',
  strict_pushups: '🫸', straight_arm_pulls: '↔️', thoracic_rotations: '🔄',
  lat_hang_stretch: '🧘', db_curl_to_press: '💪', light_bent_over_row: '🚣',
  light_overhead_press: '🏋️', light_squat: '🏋️', rear_lunge_warmup: '🦵',
  bodyweight_hip_thrusts: '🍑', run_400m_repeats: '🏃', run_800m_repeats: '🏃',
  run_1600m_repeats: '🏃', run_1000m_repeats: '🏃', tempo_run_short: '🏃‍♂️',
  tempo_run_mid: '🏃‍♂️', easy_pace_run: '🏃‍♀️', pyramid_track: '🏃',
  ruck_4mi_35: '🎒', ruck_5mi_35: '🎒', ruck_6mi_35: '🎒',
  ruck_3mi_heavy: '🎒', ruck_2mi_heavy: '🎒', ruck_4mi_35_fast: '🎒',
  sled_pull_backwards: '🛷', sled_push_quick: '🛷', pinch_grip_plate_carry: '🤏',
  gorilla_rows: '🦍', running_buildups: '🏃', carry_choice_50m: '🏋️',
  sled_drag_choice_50m: '🛷', locomotive_choice_50m: '🐊',
  recovery_swim: '🏊', conditioning_sprint_interval: '⚡',
  conditioning_flush: '🌊',
  // Utility
  rest_2min: '⏸️', assess_feet_gear: '🦶',
};

const EXERCISE_STEPS: Record<string, string[]> = {
  pushups: [
    'Start in high plank with hands shoulder-width apart.',
    'Lower your chest to the ground, keeping elbows at 45°.',
    'Push up through your hands to full arm extension.',
    'Keep your back straight and core engaged throughout.',
  ],
  hand_release_pushups: [
    'Start in push-up position.',
    'Lower your entire body to the ground.',
    'Lift both hands completely off the ground.',
    'Place hands back down and push up to starting position.',
  ],
  pullups: [
    'Hang from bar with hands wider than shoulders, palms away.',
    'Engage your lats and pull your shoulder blades down.',
    'Pull your chest toward the bar until chin clears it.',
    'Lower with control to a full dead hang.',
  ],
  burpees: [
    'Stand tall, then squat and place hands on ground.',
    'Kick feet back into push-up position.',
    'Perform a full push-up.',
    'Fire legs back in and explode upward into a jump.',
    'Reach hands overhead and spread eagle in the air.',
  ],
  forward_plank: [
    'Place forearms on ground, elbows under shoulders.',
    'Extend legs back, toes on ground.',
    'Create a straight line from head to heels.',
    'Hold position, breathing steadily.',
  ],
  side_plank: [
    'Lie on your side with forearm on the ground.',
    'Push up, creating a straight line from shoulder to ankle.',
    "Don't let your hips sag.",
    'Hold position, then switch sides.',
  ],
  air_squats: [
    'Stand with feet shoulder-width apart.',
    'Raise arms to shoulder height as you descend.',
    'Push hips back and squat below parallel.',
    'Drive through heels to stand, squeezing glutes at top.',
  ],
  usmc_crunches: [
    'Lie on back with knees bent, feet flat on ground.',
    'Cross arms over abdomen.',
    'Drive upper body off the ground using your abs.',
    'Return shoulders to the deck each rep.',
  ],
  dumbbell_getups: [
    'Lie on back holding 30lb weight overhead with one arm.',
    'Roll to elbow of opposite arm.',
    'Push to hand, then sweep leg under to kneeling.',
    'Stand up while keeping weight directly overhead.',
    'Reverse the sequence back to the ground.',
  ],
  farmers_carry: [
    'Deadlift two 50lb+ weights from the ground.',
    'Stand tall with shoulders back and core braced.',
    'Walk or run 50m without swaying the loads.',
    "Set weights down with a controlled deadlift motion.",
  ],
  flutter_kicks: [
    'Lie on back, hands under tailbone.',
    'Raise legs 6-12 inches off the ground.',
    'Alternate scissor kicks while keeping lower back pressed down.',
    'Count in 4-count cadence.',
  ],
  mountain_climbers: [
    'Start in push-up position.',
    'Drive left knee toward chest while keeping right leg straight.',
    'Quickly switch legs.',
    'Maintain plank position throughout, count in 4-count cadence.',
  ],
  walking_lunges: [
    'Stand tall with feet hip-width apart.',
    'Step forward with one leg into a deep lunge.',
    'Lower until back knee nearly touches the ground.',
    'Drive through front heel to step forward into next lunge.',
  ],
  broad_jumps: [
    'Stand with feet shoulder-width apart.',
    'Rapidly squat, swinging arms back.',
    'Explode forward and upward.',
    'Land softly on both feet, absorbing impact through legs.',
  ],
};

// Apply enrichment data to exercises
exercises.forEach(ex => {
  if (MUSCLE_GROUPS[ex.id]) ex.muscle_groups = MUSCLE_GROUPS[ex.id];
  if (ILLUSTRATIONS[ex.id]) ex.illustration = ILLUSTRATIONS[ex.id];
  if (EXERCISE_STEPS[ex.id]) ex.steps = EXERCISE_STEPS[ex.id];
});

// ============================================================
// EXPORTS
// ============================================================

export function getExerciseById(id: string): Exercise | undefined {
  return exercises.find(e => e.id === id);
}

export function getExercisesByCategory(category: Exercise['category']): Exercise[] {
  return exercises.filter(e => e.category === category);
}

export function getExercisesByMuscleGroup(muscleGroup: string): Exercise[] {
  return exercises.filter(e => e.muscle_groups?.includes(muscleGroup));
}

export function getExerciseForEquipment(exerciseId: string, access: EquipmentAccess): Exercise | undefined {
  const exercise = getExerciseById(exerciseId);
  if (!exercise) return undefined;
  if (access === 'gym' && exercise.gym_alternative_id) {
    return getExerciseById(exercise.gym_alternative_id) || exercise;
  }
  return exercise;
}

export function getAllMuscleGroups(): string[] {
  const groups = new Set<string>();
  exercises.forEach(e => e.muscle_groups?.forEach(g => groups.add(g)));
  return Array.from(groups).sort();
}

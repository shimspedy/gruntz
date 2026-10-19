#!/usr/bin/env python3
"""One-off corrections to scripts/data/movekit-metadata.json from the 2026-10-19 clip audit.

Every clip was compared frame-by-frame with its text. Where the words described a different
setup than the video (seated vs lying, one arm vs two, a bench that isn't there), the words
were rewritten to match what the athlete actually sees. Slugs and files are unchanged.
Idempotent: re-running it writes the same result. Run scripts/gen_exercise_index.py after.
"""
import json
import os

PATH = os.path.join(os.path.dirname(__file__), 'movekit-metadata.json')
meta = json.load(open(PATH))
by = {m['slug']: m for m in meta}


def fix(slug, **fields):
    m = by[slug]
    for k, v in fields.items():
        assert k in m, (slug, k)
        m[k] = v


def line(slug, field, index, text):
    by[slug][field][index] = text


# ---- copy that talked about "the clip" instead of the movement ----
line('90-90-hip-switches', 'commonMistakes', 3, 'Planting the hands on the floor instead of keeping them clasped at the chest.')
line('anti-gravity-press', 'commonMistakes', 3, 'Swapping the two dumbbells for a single bar, which changes the press.')
line('bodyweight-hip-abduction', 'instructions', 1, 'Bring your hands together in front of your chest.')
line('dumbbell-tibialis-raise', 'benefits', 2, 'Keeps the work isolated to the ankle, so it slots into lower-leg accessory blocks.')
line('spiderman-stretch', 'instructions', 5, 'Alternate sides with each rep.')
line('spiderman-stretch', 'commonMistakes', 2, 'Letting the trail knee collapse to the floor instead of keeping that leg long.')
line('standing-neutral-grip-dumbbell-overhead-press', 'commonMistakes', 0, 'Rotating the palms forward mid-rep, which turns it into the standard press.')
line('step-down-to-balance', 'commonMistakes', 0, 'Letting the free foot tap and take weight instead of hovering above the floor.')

# ---- wrong equipment ----
fix('single-leg-kettlebell-romanian-deadlift-deficit',
    name='Single-Leg Kettlebell Romanian Deadlift (Deficit)',
    equipment=['Kettlebell'],
    tags=['deficit romanian deadlift', 'single leg', 'kettlebell', 'hamstrings', 'glutes', 'hip hinge'],
    shortDescription='A single-leg Romanian deadlift from a raised platform with a kettlebell in each hand, adding range at the bottom of the hinge.')
line('single-leg-kettlebell-romanian-deadlift-deficit', 'instructions', 1, 'Hold a kettlebell in each hand and shift your weight onto the standing leg.')
line('single-leg-kettlebell-romanian-deadlift-deficit', 'instructions', 4, 'Lower the kettlebells past the level of the platform, keeping the hips level.')

fix('single-leg-standing-calf-raise', equipment=['Bodyweight', 'Dumbbell'],
    shortDescription='A one-legged calf raise, shown holding a dumbbell in each hand, that loads the standing calf through its full ankle range.')
line('single-leg-standing-calf-raise', 'instructions', 1, 'Hook the free foot behind the standing ankle. Hold a dumbbell in each hand for load, or rest a hand on a wall for balance.')
line('single-leg-standing-calf-raise', 'commonMistakes', 3, 'Leaning on a support or swinging the dumbbells, which takes real load off the standing leg.')

# A sissy-squat bench is gym kit; listing it as 'Bench' put it in home workouts.
fix('machine-goblet-sissy-squat', equipment=['Machine', 'Dumbbell'])

# ---- body position / setup differs from the video ----
fix('single-leg-hip-thrust',
    name='Single-Leg Hip Thrust (Floor)',
    shortDescription='A floor single-leg hip thrust with the free leg held straight, driving one glute into full hip extension.',
    instructions=[
        'Lie on your back with one knee bent and that foot flat on the floor, close to your glutes.',
        'Straighten the other leg and lift it so the thighs are roughly level.',
        'Rest your arms on the floor beside you and brace your trunk.',
        'Drive through the planted heel until your hips are fully extended and in line with your torso.',
        'Keep the raised leg straight and the pelvis level at the top.',
        'Lower under control until the hips are just above the floor, then repeat and switch sides.',
    ],
    benefits=[
        'Builds hip extension strength that carries into sprinting, jumping, and stair climbing.',
        'Exposes and corrects side-to-side glute strength differences.',
        'Needs no equipment, so it fits home and warm-up sessions.',
    ])
line('single-leg-hip-thrust', 'commonMistakes', 1, 'Pushing down hard through the arms, which takes work away from the glutes.')

fix('kettlebell-renegade-rows',
    name='Kettlebell Supported Row (Staggered Stance)',
    shortDescription='A bent-over staggered-stance row: one hand braces on a kettlebell on the floor while the other rows a second bell.',
    instructions=[
        'Set two kettlebells on the floor and step into a long staggered stance beside them.',
        'Hinge forward with a flat back and brace one hand on the handle of the near kettlebell.',
        'Grip the second kettlebell with the working hand, arm hanging straight.',
        'Brace the trunk so the hips and shoulders stay square to the floor.',
        'Row the bell to the lower ribs, leading with the elbow.',
        'Lower under control, finish the set, then switch stance and arms.',
    ],
    commonMistakes=[
        'Twisting the torso open to swing the bell up.',
        'Rounding the back as the bell lowers toward the floor.',
        'Leaning hard on the support bell, which shifts weight off the legs and trunk.',
        'Yanking the bell with momentum instead of a controlled elbow path.',
    ],
    benefits=[
        'Rows the lats and upper back one side at a time.',
        'The braced hand keeps the back supported without a bench.',
        'Works left and right independently, so side-to-side differences show up fast.',
    ])

# These two had each other's descriptions.
# Read the staggered-stance text from the original release so re-running stays correct.
_original = {m['slug']: m for m in json.loads(__import__('subprocess').check_output(
    ['git', 'show', '3b97edb:scripts/data/movekit-metadata.json'], cwd=os.path.dirname(__file__)))}
single = _original['kettlebell-row-single']
fix('kettlebell-single-arm-row',
    shortDescription=single['shortDescription'], instructions=list(single['instructions']),
    commonMistakes=list(single['commonMistakes']), benefits=list(single['benefits']))
fix('kettlebell-row-single',
    name='Kettlebell Two-Hand Row',
    primaryMuscles=['Back', 'Trapezius'],
    tags=['kettlebell row', 'two hand row', 'back exercise', 'upper back', 'kettlebell'],
    shortDescription='A wide-stance bent-over row pulling one kettlebell with both hands, loading the upper back and traps.',
    instructions=[
        'Stand with your feet wider than shoulder width and a kettlebell on the floor between them.',
        'Hinge at the hips with a flat back and grip the handle with both hands.',
        'Brace your core and let the arms hang straight with the bell just off the floor.',
        'Row the kettlebell up toward your lower chest, driving the elbows up and out.',
        'Squeeze the upper back at the top, then lower the bell under control.',
        'Keep the hinge angle fixed for the whole set.',
    ],
    commonMistakes=[
        'Standing up as you pull, which turns the row into a shrug.',
        'Rounding the lower back while the bell hangs.',
        'Jerking the bell up with the legs instead of the back.',
        'Shortening the bottom of the rep so the arms never straighten.',
    ],
    benefits=[
        'Loads the whole upper back with one kettlebell.',
        'An easy row to learn: both hands, both feet, no balance demand.',
        'Needs only one bell and a little floor space.',
    ])

fix('kettlebell-assisted-bulgarian-split-squat',
    shortDescription='A Bulgarian split squat holding a post for balance with a kettlebell hanging in the other hand.')
line('kettlebell-assisted-bulgarian-split-squat', 'instructions', 1, 'Hold a sturdy post or rack upright with one hand and let a kettlebell hang at arm\'s length in the other.')
line('kettlebell-assisted-bulgarian-split-squat', 'instructions', 4, 'Keep the kettlebell hanging straight down and your torso upright through the full descent.')

fix('machine-lateral-raise',
    name='Machine Lateral Raise (Single Arm)',
    shortDescription='A standing single-arm lateral raise on a lever machine, isolating the side of the shoulder.',
    instructions=[
        'Stand side-on to the machine and set the pad or handle at hip height.',
        'Take the handle with the arm nearest the machine and a slight bend in the elbow.',
        'Stand tall, brace your trunk and let the shoulder settle down away from the ear.',
        'Raise the arm out to the side until it reaches shoulder height.',
        'Pause, then lower slowly back to the start.',
        'Finish the set, then turn around and work the other arm.',
    ],
    benefits=[
        'The fixed path removes swing, so the side of the deltoid does the work.',
        'Easy to load in small steps, which makes progression simple for beginners.',
        'One arm at a time lets each shoulder work through its own full range.',
    ])
line('machine-lateral-raise', 'commonMistakes', 0, 'Standing too far from the machine, so the lever path no longer matches the shoulder.')

fix('lunge-sprint',
    name='Lunge to Knee Drive',
    shortDescription='A sprint-start drill that rises from a low split lunge into a tall single-leg stance with a high knee drive and opposite-arm swing.',
    instructions=[
        'Start in a split lunge with the back knee close to the floor and the torso tall.',
        'Set the opposite arm forward and the same-side arm back, as in a sprint.',
        'Drive through the front foot and stand up onto that leg.',
        'Bring the back knee through and up to hip height as the arms switch.',
        'Hold the tall single-leg position briefly, then step back into the lunge.',
        'Finish the reps on that leg, then switch sides.',
    ],
    commonMistakes=[
        'Letting the front knee collapse inward as you drive up.',
        'Leaning back at the top instead of standing tall over the support foot.',
        'Rushing the step back so the lunge loses depth.',
        'Swinging the arms across the body instead of front to back.',
    ],
    benefits=[
        'Rehearses the sprint drive position under control.',
        'Builds single-leg strength and balance in one drill.',
        'Needs no equipment, so it fits field warm-ups and athletic blocks.',
    ])

fix('press-sit-up',
    name='Crunch Press',
    shortDescription='A lying crunch with a barbell, pressing it from the chest toward the ceiling as the shoulders curl up.',
    instructions=[
        'Lie on your back with knees bent and both feet anchored under a plate or similar stop.',
        'Hold a light barbell at the chest with an overhand grip.',
        'Brace the trunk and keep the bar stacked over the chest.',
        'Curl the shoulders off the floor as you press the bar up to locked elbows.',
        'Hold briefly at the top of the crunch with the bar over the shoulders.',
        'Lower the bar to the chest as you roll the shoulders back to the floor.',
    ],
    benefits=[
        'Loads the crunch so the abs can progress past bodyweight.',
        'Adds a press without a second exercise.',
        'The floor setup needs only a bar and a foot anchor.',
    ])
line('press-sit-up', 'commonMistakes', 3, 'Arching the lower back to finish the press instead of keeping the ribs down.')

fix('landmine-press',
    shortDescription='A standing one-arm press of a barbell anchored at one end, driving the bar up and away along a fixed arc.')
line('landmine-press', 'instructions', 2, 'Hold the loaded end in one hand at shoulder height, elbow tucked in front of the body.')
line('landmine-press', 'instructions', 4, 'Press the bar up and away along its arc until the arm is straight.')
line('landmine-press', 'instructions', 5, 'Hold briefly, lower to the shoulder under control, then finish the set and switch arms.')

fix('kettlebell-push-press', name='Double Kettlebell Push Press',
    shortDescription='A leg-driven overhead press with a kettlebell racked at each shoulder, training the shoulders and triceps with athletic power.')
line('kettlebell-push-press', 'instructions', 0, 'Stand with feet shoulder-width apart and clean two kettlebells to the rack position at your shoulders.')
line('kettlebell-push-press', 'instructions', 2, 'Drive explosively through your heels to extend the legs and launch both kettlebells upward.')
line('kettlebell-push-press', 'instructions', 3, 'Press both bells to full lockout overhead with the biceps alongside the ears and the wrists stacked.')
line('kettlebell-push-press', 'instructions', 4, 'Lower the kettlebells back to the rack under control, absorbing with a soft knee bend.')

fix('kettlebell-spinal-jefferson-curl')
line('kettlebell-spinal-jefferson-curl', 'instructions', 0, 'Stand tall holding a light kettlebell with both hands in front of your thighs. A box adds range once you can reach the floor.')

fix('cable-bench-press', name='Seated Cable Chest Press',
    shortDescription='A seated, back-supported cable press that drives the handles forward from chest height with constant tension.',
    instructions=[
        'Set the bench upright in the cable station with the pulleys at about chest height.',
        'Sit with your back against the pad and take a handle in each hand at chest level.',
        'Set your feet and keep your shoulder blades pulled back into the pad.',
        'Press both handles forward until the arms are straight in front of your chest.',
        'Squeeze the chest at full extension without letting the shoulders round forward.',
        'Return the handles to chest level under control and repeat.',
    ])
line('cable-bench-press', 'commonMistakes', 3, 'Peeling the back off the pad for leverage, which destabilizes the press.')

fix('cable-decline-bench-press', name='Seated Cable Chest Press (Low Line)',
    shortDescription='A seated cable press that drives the handles forward and slightly down, biasing the lower chest.',
    instructions=[
        'Set the bench upright in the cable station with the pulleys a little above chest height.',
        'Sit with your back against the pad and feet planted, a handle in each hand at chest level.',
        'Pull the shoulder blades back into the pad and brace your trunk.',
        'Press the handles forward and slightly down until the arms are straight.',
        'Squeeze the lower chest at full extension.',
        'Return the handles to chest level under control and repeat.',
    ])
line('cable-decline-bench-press', 'commonMistakes', 3, 'Peeling the back off the pad for leverage, which destabilizes the press.')

fix('cable-bench-chest-fly', name='Seated Cable Chest Fly',
    shortDescription='A seated cable fly between two towers, sweeping the handles together at shoulder height under constant tension.',
    instructions=[
        'Place a flat bench between two cable towers with the pulleys at shoulder height.',
        'Sit tall on the bench holding a handle in each hand, arms out to the sides with a slight elbow bend.',
        'Brace your trunk and keep the chest up.',
        'Sweep the handles forward in a wide arc until they meet in front of your chest.',
        'Squeeze the chest hard with the elbow angle unchanged.',
        'Open the arms back out under control until you feel a stretch across the chest, then repeat.',
    ])
line('cable-bench-chest-fly', 'commonMistakes', 1, 'Letting the hands drift behind the body at the open position, which overstretches the front shoulders.')
line('cable-bench-chest-fly', 'commonMistakes', 3, 'Rounding the shoulders forward as the hands meet, which loses the chest squeeze.')

line('barbell-wrist-curl', 'instructions', 0, 'Kneel behind a preacher or flat bench and lay your forearms on the pad with your wrists just past the edge.')
line('barbell-wrist-curl', 'instructions', 2, 'Curl the bar up by closing your fingers and flexing your wrists, keeping the forearms pinned to the pad.')
line('barbell-wrist-curl', 'commonMistakes', 0, 'Lifting the forearms off the pad, which lets the biceps take over instead of isolating the forearms.')

fix('band-wood-chopper', name='Band Horizontal Wood Chop',
    shortDescription='A standing band rotation at chest height, turning the trunk side to side with straight arms to train the obliques.',
    instructions=[
        'Anchor a band at chest height and stand facing the anchor, feet shoulder-width apart.',
        'Hold the band with both hands, arms straight out in front of your chest.',
        'Step back until the band has tension, then brace your trunk.',
        'Rotate your torso to one side, keeping the arms straight and the hands at chest height.',
        'Return under control to the center, fighting the band the whole way.',
        'Rotate to the other side and keep alternating.',
    ])
line('band-wood-chopper', 'commonMistakes', 0, 'Pulling with the arms instead of rotating through the trunk.')
line('band-wood-chopper', 'commonMistakes', 1, 'Letting the hips swing with the arms, which removes the core from the rotation.')

fix('cable-single-leg-laying-leg-curl', name='Machine Single-Leg Lying Leg Curl', equipment=['Machine'],
    shortDescription='A prone leg curl on a lying leg-curl machine, one leg at a time, isolating each hamstring.',
    instructions=[
        'Lie face down on the leg-curl machine with your knees just past the edge of the pad.',
        'Hook one ankle under the roller pad and let the other leg rest.',
        'Grip the handles and press your hips into the pad.',
        'Curl the working heel toward your glutes by bending only at the knee.',
        'Pause at the top, lower under control, then finish the set and swap legs.',
        'Keep the hips down for the whole set.',
    ])
line('cable-single-leg-laying-leg-curl', 'commonMistakes', 0, 'Lifting the hips off the pad, which adds hip flexion and hides a short range.')
line('cable-single-leg-laying-leg-curl', 'commonMistakes', 1, 'Letting the pad drop back down, which throws away the eccentric.')
line('cable-single-leg-laying-leg-curl', 'commonMistakes', 3, 'Setting the roller too high on the calf, which changes the line of pull.')

fix('cable-wrist-curl', name='Cable Standing Wrist Curl',
    shortDescription='A standing cable wrist curl with the arms long at the thighs, isolating wrist flexion and building grip.')
line('cable-wrist-curl', 'instructions', 1, 'Stand facing the stack with your feet hip-width apart.')
line('cable-wrist-curl', 'instructions', 2, 'Grip the bar underhand at shoulder width and let the arms hang long, bar at the thighs.')
line('cable-wrist-curl', 'commonMistakes', 1, 'Bending the elbows to help, so the forearms move and the wrists stay locked.')

fix('dumbbell-cossack-squat',
    shortDescription='A deep sideways squat on one leg holding a dumbbell in each hand at arm\'s length.')
line('dumbbell-cossack-squat', 'instructions', 0, 'Hold a dumbbell in each hand, arms hanging straight down between your legs.')
line('dumbbell-cossack-squat', 'commonMistakes', 0, 'Letting the dumbbells pull the chest down, which rounds the upper back at depth.')

fix('dumbbell-decline-skullcrusher', name='Dumbbell Single-Arm Skullcrusher',
    shortDescription='A flat-bench one-arm dumbbell triceps extension, lowering the bell beside the head into a deep stretch.',
    instructions=[
        'Lie back on a flat bench with a dumbbell in one hand, pressed up over your shoulder.',
        'Tilt the upper arm slightly back toward your head so the dumbbell sits just past vertical.',
        'Rest the free hand on your body or support the working elbow.',
        'Bend at the elbow to lower the dumbbell slowly beside your head.',
        'Stop when you feel a strong stretch across the back of the upper arm, elbow still pointed up.',
        'Extend back to the start, then finish the set and switch arms.',
    ])
line('dumbbell-decline-skullcrusher', 'commonMistakes', 1, 'Letting the elbow drift out to the side, which trades triceps work for shoulder strain.')
line('dumbbell-decline-skullcrusher', 'commonMistakes', 3, 'Going too heavy and crashing the dumbbell toward the head instead of lowering under control.')

fix('dumbbell-incline-front-raise', name='Dumbbell Seated Incline Front Raise',
    shortDescription='A front raise seated back-supported on an incline bench, alternating arms to isolate the front shoulders.',
    instructions=[
        'Set a bench to a steep incline and sit with your back against the pad, a dumbbell in each hand.',
        'Let the arms hang by your sides with a slight bend in the elbows.',
        'Brace your core and keep your head and shoulders against the pad.',
        'Raise one dumbbell forward in a controlled arc to about shoulder height.',
        'Pause briefly, then lower under control.',
        'Alternate arms for the set.',
    ])
line('dumbbell-incline-front-raise', 'commonMistakes', 3, 'Going too heavy, which forces you to rock off the pad and swing.')

fix('dumbbell-side-plank', name='Dumbbell Side Plank Reach',
    shortDescription='A straight-arm side plank that raises a dumbbell from the chest to straight overhead, training the obliques and shoulder stability.',
    instructions=[
        'Set up on your side with the bottom hand under the shoulder, arm straight, and feet stacked.',
        'Hold one dumbbell in the top hand at the chest.',
        'Brace the abs and glutes and lift the hips into a straight line.',
        'Press the dumbbell up until the top arm is vertical over the shoulder.',
        'Lower it back to the chest under control, keeping the hips high.',
        'Finish the set, then switch sides.',
    ])
line('dumbbell-side-plank', 'commonMistakes', 2, 'Letting the support hand drift ahead of the shoulder.')

fix('dumbbell-situp', name='Dumbbell Straight-Arm Sit-Up',
    shortDescription='A legs-straight sit-up holding one dumbbell at arm\'s length over the chest, adding load to bodyweight ab work.',
    instructions=[
        'Sit on the floor with your legs straight and lie back with control.',
        'Hold one dumbbell with both hands at arm\'s length above your chest.',
        'Brace your core and tuck your chin slightly before starting the rep.',
        'Curl your torso up, keeping the dumbbell pointed at the ceiling.',
        'Pause at the top with the arms still straight.',
        'Lower back down slowly until your shoulder blades touch the floor.',
    ])
line('dumbbell-situp', 'commonMistakes', 2, 'Letting the dumbbell drift forward over the legs, which turns it into a shoulder raise.')
line('dumbbell-situp', 'commonMistakes', 3, 'Lifting the legs off the floor to counterbalance the weight.')

fix('elbow-side-plank', name='Side Plank (Straight Arm)',
    shortDescription='An isometric side hold on a straight arm that trains the obliques and lateral core.')
line('elbow-side-plank', 'instructions', 0, 'Lie on your side with your bottom hand on the floor directly under your shoulder, arm straight.')
line('elbow-side-plank', 'commonMistakes', 2, 'Placing the support hand ahead of or behind the shoulder, which strains the shoulder joint.')
by['elbow-side-plank']['aliases'] = ['side plank', 'high side plank']

fix('fire-hydrants', name='Quadruped Kickback',
    movementPattern=['Hip Extension'],
    shortDescription='An all-fours glute drill that extends one leg back and up behind the hip without arching the lower back.',
    instructions=[
        'Start on all fours with the hands under the shoulders and the knees under the hips.',
        'Brace the trunk so the back stays flat and the pelvis stays level.',
        'Extend one leg back and lift it to about hip height.',
        'Squeeze the glute at the top without arching the lower back.',
        'Lower the knee back under the hip with control.',
        'Finish the set on one side before switching legs.',
    ],
    commonMistakes=[
        'Arching the lower back to lift the leg higher.',
        'Twisting the pelvis open toward the working side.',
        'Letting the supporting arms or knee collapse.',
        'Swinging the leg instead of lifting it with the glute.',
    ])
by['fire-hydrants']['aliases'] = ['donkey kick', 'glute kickback']

line('eccentric-calf-lowers', 'instructions', 0, 'Stand tall beside a rail or rack. A step edge adds range once the flat version is easy.')
line('eccentric-calf-lowers', 'instructions', 3, 'Slowly lower the heels back to the floor, or below the step, keeping the knees nearly straight.')

# ---- wrong video entirely: describe what the video shows ----
fix('cycling-cooldown', name='Straddle Stretch with Reach', equipment=['Bodyweight'],
    primaryMuscles=['Adductors'], secondaryMuscles=['Hamstrings', 'Lower Back'], movementPattern=['Stretch'],
    difficulty='beginner',
    tags=['straddle stretch', 'adductors', 'hamstrings', 'cooldown', 'flexibility'],
    shortDescription='A seated wide-straddle stretch that reaches the arms overhead, then folds forward between the legs.',
    instructions=[
        'Sit tall on the floor with your legs straight and spread wide.',
        'Reach both arms overhead and lengthen through the spine.',
        'Hinge forward from the hips, walking the hands out between the legs.',
        'Fold as far as is comfortable without rounding hard through the back.',
        'Breathe and hold, then walk the hands back and sit tall.',
        'Repeat for the prescribed time.',
    ],
    commonMistakes=[
        'Bending the knees to fold lower.',
        'Rounding the back instead of hinging from the hips.',
        'Bouncing into the stretch.',
        'Rolling the knees inward so the stretch moves off the inner thighs.',
    ],
    benefits=[
        'Lengthens the inner thighs and hamstrings in one position.',
        'An easy cooldown that needs only floor space.',
        'Improves the hip range used in squats and lateral lunges.',
    ])
fix('cycling-warmup', name='Marching Walk', equipment=['Bodyweight'],
    movementPattern=['Cardio'], difficulty='beginner',
    tags=['march', 'walk', 'warm-up', 'low impact', 'cardio'],
    shortDescription='An easy marching walk with a natural arm swing, raising the heart rate gently before training.',
    instructions=[
        'Stand tall with your shoulders relaxed and your arms by your sides.',
        'Start walking or marching in place at an easy pace.',
        'Lift each knee a little higher than a normal step.',
        'Swing the opposite arm forward with each step.',
        'Keep your breathing steady and conversational.',
        'Continue for the prescribed time.',
    ],
    commonMistakes=[
        'Starting too fast for a warm-up.',
        'Slouching forward instead of walking tall.',
        'Holding the arms stiff instead of letting them swing.',
        'Stamping the feet instead of stepping softly.',
    ],
    benefits=[
        'Raises the heart rate gently with no impact.',
        'Fits any space, indoors or out.',
        'A safe first warm-up for beginners and recovery days.',
    ])

json.dump(meta, open(PATH, 'w'), indent=2, ensure_ascii=False)
print('applied')

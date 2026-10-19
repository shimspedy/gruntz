#!/usr/bin/env python3
"""One-off upgrades to the weakest plan video matches in src/data/workoutPlans.json (2026-10-19 audit).

Plan slots can't go without a clip (the session drops slots with no video), so each of these
moves to the closest clip in the right movement family: a plank for rollouts and walkouts,
a push-up for push-up variants, the exact clip where one now exists. Stats and
video_keys_used are recomputed. Idempotent.
"""
import json
import os

ROOT = os.path.join(os.path.dirname(__file__), '..', '..')
PATH = os.path.join(ROOT, 'src', 'data', 'workoutPlans.json')
plans = json.load(open(PATH))
lib = {i['key'] for i in json.load(open(os.path.join(ROOT, 'src', 'data', 'exerciseLibrary.json')))}

# exercise name -> (clip, tier)
BY_NAME = {
    # Exact clips the old match missed.
    'Barbell Sumo Deadlift': ('sumo-deadlift', 'exact'),
    'Bar Hang': ('dead-hang', 'exact'),
    'Barbell Good Morning': ('good-mornings', 'substitute'),
    'Barbell Overhead Squat': ('dumbbell-overhead-squat', 'substitute'),
    'Dumbbell Clean and Press': ('dumbbell-single-arm-clean-and-press', 'substitute'),
    # Rollouts are anti-extension planks, not sit-ups, Pallof presses or hanging raises.
    'Ab Wheel Roll-Out': ('front-plank', 'similar'),
    'Ab Wheel Rollout': ('front-plank', 'similar'),
    'Ab Wheel Walkout From Knees': ('front-plank', 'similar'),
    'Barbell Ab Rollout': ('front-plank', 'similar'),
    'Barbell Rollout': ('front-plank', 'similar'),
    'Ring Rollout': ('front-plank', 'similar'),
    'Stability Ball Roll-Out': ('front-plank', 'similar'),
    'Medicine Ball Rollout': ('front-plank', 'similar'),
    'Suspension Trainer Roll-Out': ('front-plank', 'similar'),
    'Body Saw': ('front-plank', 'similar'),
    'Stability Ball Saw': ('front-plank', 'similar'),
    'Stability Ball Circles': ('front-plank', 'similar'),
    # Walkouts pass through a high plank.
    'Walkout': ('hand-plank', 'similar'),
    'Hand Walkout': ('hand-plank', 'similar'),
    'Inchworm Walkout': ('hand-plank', 'similar'),
    'Plank Walkout': ('hand-plank', 'similar'),
    'Standing Walkout': ('hand-plank', 'similar'),
    'Stability Ball Walkout': ('hand-plank', 'similar'),
    'Walkout to Push-Up': ('push-up', 'similar'),
    # Push-up variants were showing barbell and dumbbell bench presses.
    'Clap Push-Up': ('push-up', 'similar'),
    'Clapping Push-Up': ('push-up', 'similar'),
    'Shoulder Tap Push-Up': ('push-up', 'similar'),
    'Alternating Medicine Ball Plyo Push-Up': ('plyometric-kettlebell-push-up', 'similar'),
    'Alternating Plyo Push-Up on Medicine Ball': ('plyometric-kettlebell-push-up', 'similar'),
    'Alternating Plyometric Push-Up on Medicine Ball': ('plyometric-kettlebell-push-up', 'similar'),
    # Supine alternating-leg core work.
    'Flutter Kick': ('dead-bug', 'similar'),
    'Plank with Knee to Opposite Elbow': ('mountain-climber', 'similar'),
    'Handstand Hold': ('pike-push-up', 'similar'),
    'Upward Dog to Downward Dog': ('abdominals-stretch-variation-one', 'similar'),
    'Walking Stretch': ('walking-knee-hugs', 'similar'),
}
# The source data left this ladder's movement blank and matched it to a Smith machine bench press.
RENAME = {'Bodyweight Exercise': ('Burpee', 'burpee', 'substitute')}

ex = plans['exercises']
touched = set()
for eid, e in ex.items():
    name = e['name']
    if name in RENAME:
        new_name, key, tier = RENAME[name]
        e['name'] = new_name
    elif name in BY_NAME:
        key, tier = BY_NAME[name]
    else:
        continue
    assert key in lib, key
    e['video_key'], e['video_match'] = key, tier
    e['alternative_video_keys'] = [k for k in e.get('alternative_video_keys') or [] if k != key]
    touched.add(eid)

for p in plans['plans']:
    slots = [s for d in p['days'] for s in d['exercises']]
    for s in slots:
        if s['exercise_id'] in touched:
            s['video_key'] = ex[s['exercise_id']]['video_key']
            s['name'] = ex[s['exercise_id']]['name'] if s['name'] in RENAME else s['name']
    tiers = [ex[s['exercise_id']]['video_match'] for s in slots if s.get('video_key')]
    st = p['stats']
    st['exercises_with_video'] = len(tiers)
    st['exact_videos'] = tiers.count('exact')
    st['substituted_videos'] = tiers.count('substitute')
    st['similar_videos'] = tiers.count('similar')
    st['video_coverage'] = round(len(tiers) / len(slots), 3) if slots else 0

used = {e['video_key'] for e in ex.values() if e.get('video_key')}
used |= {k for e in ex.values() for k in e.get('alternative_video_keys') or []}
plans['video_keys_used'] = sorted(used)

with open(PATH, 'w') as f:
    json.dump(plans, f, ensure_ascii=False, separators=(',', ':'))
print(f'{len(touched)} plan exercises re-matched')

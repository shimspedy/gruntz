---
name: fitness-data-modeling
description: "Design and create workout data models, exercise JSON, workout plans, and training content. Use when: adding exercises, creating workout days, building training programs, structuring fitness content, defining workout sections."
---

# Fitness Data Modeling

## When to Use
- Creating or modifying exercise definitions
- Building workout day structures
- Designing training programs (10-week plans)
- Adding new workout categories
- Structuring movement prep, calisthenics, running, swimming, rucking, recovery content

## Data Model Hierarchy
```
WorkoutPlan → WorkoutDay[] → WorkoutSection[] → Exercise[]
```

## Exercise Categories
1. **Movement Prep / Warmup** — hip bridges, bird dogs, frog squats, leg swings, arm circles
2. **Calisthenics** — push-ups, pull-ups, squats, lunges, dips, burpees
3. **Core** — planks, flutter kicks, sit-ups, leg raises, Russian twists
4. **Running** — intervals, tempo runs, distance runs, sprints
5. **Swimming** — freestyle, combat sidestroke, treading, distance swims
6. **Rucking** — weighted marches with distance/time targets
7. **Recovery** — stretching, foam rolling, mobility work

## Exercise JSON Schema
```json
{
  "id": "snake_case_unique_id",
  "name": "Human Readable Name",
  "category": "calisthenics|core|running|swimming|rucking|warmup|recovery",
  "description": "Clear movement description",
  "sets": 3,
  "reps": 15,
  "duration_seconds": null,
  "distance": null,
  "rest_seconds": 60,
  "equipment": [],
  "xp_value": 10,
  "form_tips": ["tip1", "tip2"],
  "progression_rules": { "increment_reps": 2, "increment_sets": 1, "frequency": "weekly" }
}
```

## Workout Day JSON Schema
```json
{
  "id": "week{N}_day{N}",
  "week": 1,
  "day": 1,
  "title": "Mission Name",
  "objective": "What this day targets",
  "estimated_duration": 35,
  "sections": [
    {
      "id": "section_id",
      "type": "warmup|workout|cardio|recovery|test",
      "title": "Section Title",
      "instructions": "Brief guidance",
      "exercises": ["exercise_id_1", "exercise_id_2"]
    }
  ],
  "rewards": { "xp": 120, "coins": 20 }
}
```

## Progression Principles (MARSOC-inspired)
- Week 1-2: Foundation — build movement quality, baseline fitness
- Week 3-4: Build — increase volume and introduce running/swimming
- Week 5-6: Develop — add rucking, increase intensity
- Week 7-8: Push — peak training volume, complex sessions
- Week 9-10: Test & Taper — benchmark tests, reduce volume, maintain intensity

## Content Rules
- Every exercise MUST have an `id`, `name`, `category`, and `xp_value`
- Warmup sections always come first in a workout day
- Recovery sections always come last
- XP values scale with difficulty: warmup exercises 5-8 XP, main exercises 10-20 XP, cardio 15-30 XP
- Rest seconds should be realistic (30-90s for calisthenics, 60-120s for strength)
- Duration-based exercises use `duration_seconds`, rep-based use `reps`
- Running/swimming/rucking use `distance` (in meters or miles, specify unit)

# Gruntz - Military Fitness App

## Project Overview
A React Native Expo mobile fitness app with military-style progressive training, gamification (XP, levels, ranks, streaks), daily missions, and adaptive coaching.

## Tech Stack
- React Native with Expo (managed workflow)
- TypeScript (strict)
- Zustand for state management
- React Navigation (bottom tabs + stack)
- Firebase Auth + Firestore
- JSON-driven workout content
- expo-notifications for reminders

## Architecture
- `/src/components/` — Reusable UI components
- `/src/screens/` — Screen components (one per route)
- `/src/navigation/` — React Navigation config
- `/src/services/` — Firebase, notifications, API services
- `/src/store/` — Zustand stores (user, missions, progress)
- `/src/hooks/` — Custom React hooks
- `/src/utils/` — Pure utility functions (XP calc, adaptive logic)
- `/src/data/` — JSON workout content, achievements, ranks
- `/src/types/` — TypeScript type definitions
- `/src/features/` — Feature modules (auth, missions, progress, avatar, challenges, coach)
- `/src/theme/` — Colors, typography, spacing constants

## Code Conventions
- Functional components only, no class components
- Use TypeScript interfaces (not `type` aliases) for data models
- Zustand stores in `/src/store/` with `use[Name]Store` naming
- Screen components end with `Screen` suffix
- Dark mode is default — all colors from theme constants
- JSON workout data is the source of truth — never hardcode exercises
- XP/level/rank calculations are pure functions in `/src/utils/xp.ts`

## Build & Test
- `npx expo start` — Start dev server
- `npx expo run:ios` — Build iOS
- `npx expo run:android` — Build Android
- `npx expo prebuild` — Generate native projects

## Key Patterns
- Workout content is loaded from JSON, not hardcoded
- All gamification math (XP, levels, ranks) lives in pure utility functions
- Adaptive training adjustments are calculated from UserProgress data
- Screens consume Zustand stores via hooks
- Navigation uses typed params via RootStackParamList

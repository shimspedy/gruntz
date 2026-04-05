---
name: firebase-integration
description: "Integrate Firebase Auth, Firestore, and Cloud Functions. Use when: setting up authentication, reading/writing Firestore data, structuring database collections, configuring Firebase, implementing user profiles, syncing progress data."
---

# Firebase Integration

## When to Use
- Setting up or modifying authentication flow
- Reading/writing user data to Firestore
- Designing Firestore collection structure
- Configuring Firebase project settings
- Implementing data sync between local state and Firestore
- Adding Cloud Functions for server-side logic

## Firebase Services Used
1. **Firebase Auth** — Email/password, Google, Apple sign-in
2. **Cloud Firestore** — User profiles, progress, achievements
3. **Firebase Storage** — Profile photos, avatar assets (future)
4. **Cloud Functions** — XP validation, leaderboard updates (future)

## Firestore Collection Structure
```
users/
  {userId}/
    profile: { displayName, email, createdAt, onboardingComplete, settings }
    progress: { level, xp, rank, streak, workoutsCompleted, totalReps, ... }
    achievements/
      {achievementId}: { unlockedAt, viewed }
    workoutHistory/
      {workoutId}: { completedAt, exercisesCompleted, xpEarned, duration }
    dailyLogs/
      {date}: { missionId, completed, exercises, sorenessRating, notes }
```

## Auth Flow
1. User opens app → check `auth().currentUser`
2. If null → show OnboardingScreen / SignInScreen
3. If exists → fetch user profile from Firestore
4. If no profile → create default profile document
5. If profile exists → load into Zustand store, navigate to Home

## Data Sync Strategy (MVP)
- **Write-through**: Write to Zustand store AND Firestore on every mutation
- **Read on launch**: Fetch full user data on app start, cache in Zustand
- **Offline support**: Firestore persistence is enabled by default
- **Future**: Real-time listeners for social features

## Firebase Config
```typescript
// /src/services/firebase.ts
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  // From Firebase console — store in environment variables for production
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};
```

## Security Rules (Firestore)
```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId}/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

## Anti-patterns
- Don't store Firebase config in source code for production — use env variables
- Don't trust client-side XP calculations for competitive features — validate server-side
- Don't fetch entire collections — query with limits and filters
- Don't nest Firestore data too deeply — prefer flat structures with references
- Don't skip Firestore security rules — always restrict to authenticated user's own data

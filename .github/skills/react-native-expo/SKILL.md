---
name: react-native-expo
description: "Build React Native Expo screens, components, and navigation. Use when: creating screens, adding navigation routes, building UI components, setting up Expo config, debugging mobile layout issues, configuring app.json."
---

# React Native Expo Development

## When to Use
- Creating new screens or components
- Setting up or modifying navigation
- Configuring Expo (app.json, plugins)
- Debugging mobile layout or platform-specific issues
- Adding Expo SDK features (notifications, haptics, etc.)

## Project Setup
- Managed Expo workflow (no bare native code unless necessary)
- TypeScript strict mode
- React Navigation v6+ with bottom tabs + nested stacks

## Screen Creation Procedure
1. Create screen file in `/src/screens/[Name]Screen.tsx`
2. Add to navigation in `/src/navigation/`
3. Define route params in `/src/types/navigation.ts`
4. Connect to Zustand store if needed
5. Use theme constants for all colors/spacing

## Component Conventions
- All components are functional with TypeScript props interfaces
- Use `StyleSheet.create()` for styles (not inline objects)
- Dark mode default — background: `#0A0A0F`, card: `#1A1A2E`, accent: `#00D9FF`
- Use `SafeAreaView` for screen wrappers
- Use `ScrollView` or `FlatList` — never nest ScrollViews
- Platform-specific code via `Platform.OS` or `.ios.tsx` / `.android.tsx`

## Navigation Pattern
```typescript
// Bottom tabs: Home, Missions, Progress, Profile
// Each tab has its own stack navigator
// Modal stack overlays for achievements, mission complete, etc.
```

## Common Expo Packages
- `expo-haptics` — tactile feedback on XP gain, level up
- `expo-notifications` — daily mission reminders
- `expo-linear-gradient` — gradient backgrounds
- `expo-font` — custom fonts
- `@expo/vector-icons` — Ionicons, MaterialCommunityIcons

## Anti-patterns
- Don't use `react-native-cli` patterns — this is Expo managed
- Don't install native modules that aren't Expo-compatible
- Don't use `Dimensions.get()` — use `useWindowDimensions()` hook
- Don't nest ScrollViews
- Don't use absolute positioning for layout (use flexbox)

## Testing
- Screens should render with mock data before backend is wired
- Use Expo Go for rapid iteration
- Test on both iOS and Android simulators

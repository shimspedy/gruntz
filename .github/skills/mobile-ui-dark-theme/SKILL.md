---
name: mobile-ui-dark-theme
description: "Build dark-mode military-athletic UI components. Use when: creating UI components, styling screens, implementing cards, buttons, progress bars, XP animations, mission CTAs, designing dark theme layouts."
---

# Mobile UI — Dark Military-Athletic Theme

## When to Use
- Creating new UI components
- Styling screens or layouts
- Building progress bars, XP bars, stat cards
- Implementing animated completion states
- Designing onboarding flows
- Building mission CTA buttons

## Color Palette
```typescript
export const colors = {
  background: '#0A0A0F',
  backgroundSecondary: '#12121A',
  card: '#1A1A2E',
  cardBorder: '#2A2A3E',
  accent: '#00D9FF',       // Cyan — primary accent
  accentGold: '#FFD700',   // Gold — XP, coins, achievements
  accentGreen: '#00FF88',  // Green — success, completion
  accentRed: '#FF4444',    // Red — alerts, streaks at risk
  accentOrange: '#FF8C00', // Orange — warnings, challenges
  textPrimary: '#FFFFFF',
  textSecondary: '#A0A0B0',
  textMuted: '#606070',
  xpBar: '#00D9FF',
  healthBar: '#00FF88',
  streakFire: '#FF6B35',
};
```

## Typography
```typescript
export const typography = {
  title: { fontSize: 28, fontWeight: '800', color: colors.textPrimary },
  heading: { fontSize: 22, fontWeight: '700', color: colors.textPrimary },
  subheading: { fontSize: 18, fontWeight: '600', color: colors.textPrimary },
  body: { fontSize: 16, fontWeight: '400', color: colors.textSecondary },
  caption: { fontSize: 13, fontWeight: '400', color: colors.textMuted },
  label: { fontSize: 14, fontWeight: '600', color: colors.textSecondary, letterSpacing: 1.5, textTransform: 'uppercase' },
};
```

## Spacing
```typescript
export const spacing = {
  xs: 4, sm: 8, md: 16, lg: 24, xl: 32, xxl: 48,
};
```

## Component Patterns

### Card
- Background: `card` color
- Border: 1px `cardBorder`
- Border radius: 16
- Padding: `lg`
- Shadow: subtle dark shadow for depth

### Mission CTA Button
- Large (height: 56+), full width
- Background: accent gradient (cyan to blue)
- Bold white text, uppercase
- Haptic feedback on press
- Subtle glow/shadow effect

### XP Progress Bar
- Track: `backgroundSecondary`
- Fill: `accent` (cyan) with animated width
- Show current XP / next level XP as text
- Animate on XP gain

### Stat Card
- Small card showing icon + number + label
- Used for streak, level, rank, coins
- Icon color matches stat type

### Exercise Row
- Checkbox + exercise name + reps/time
- Completed state: strikethrough + green check
- Remaining state: outlined checkbox

## Layout Rules
- Use `SafeAreaView` for all screens
- Consistent padding: `md` (16) horizontal on screen content
- Card gap: `md` (16)
- Bottom tab bar height: consider safe area
- Scroll content should have bottom padding for tab bar

## Animation Patterns
- XP gain: Number counter animation + bar fill
- Level up: Full-screen celebration overlay
- Mission complete: Checkmark animation + reward summary
- Streak increment: Fire icon pulse
- Achievement unlock: Badge slide-in from top

## Anti-patterns
- Don't use light backgrounds — everything is dark mode
- Don't use thin fonts for titles — bold/extrabold only for headings
- Don't hard-code colors — always reference theme constants
- Don't mix alignment — left-align text, center-align CTAs
- Don't skip haptic feedback on major interactions

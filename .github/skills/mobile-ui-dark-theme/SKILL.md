---
name: mobile-ui-dark-theme
description: "Build dark-mode military-cyberpunk UI components. Use when: creating UI components, styling screens, implementing cards, buttons, progress bars, XP animations, mission CTAs, designing dark theme layouts."
---

# Mobile UI — Military-Cyberpunk Dark Theme

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
  // Military-Cyberpunk Dark Theme
  background: '#080C08',        // Ultra-dark olive-black
  backgroundSecondary: '#0F170F', // Dark forest
  card: '#141E14',              // Dark military green surface
  cardBorder: '#1E3A1E',        // Tactical olive border

  // Accent colors — tactical neon
  accent: '#00FF41',            // Night-vision / terminal green
  accentGold: '#FFB800',        // Tactical amber
  accentGreen: '#00FF88',       // Bright ops green
  accentRed: '#FF003C',         // Cyberpunk danger red
  accentOrange: '#FF8C00',      // Warning orange

  // Text — slight green tint for military feel
  textPrimary: '#E0EDE0',
  textSecondary: '#8A9F8A',
  textMuted: '#4A6B4A',

  // Progress & indicators
  xpBar: '#00FF41',
  healthBar: '#00FF88',
  streakFire: '#FF6B35',

  // Cyberpunk UI accents
  cyberYellow: '#F9F002',       // Label highlights (button tags)
  borderGlow: '#3AFF6E',        // Neon glow accent
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

### Card (Cyberpunk Angular)
- Background: `card` color
- Border: 1px `cardBorder`, borderRadius: 2
- Left accent bar: 3px colored strip
- Top-right corner cut: rotated square in parent bg color
- Padding: `lg`
- `overflow: 'hidden'` required for corner cuts

### Mission CTA Button (Cyberpunk Angular)
- Large (height: 56+), full width
- Background: accent green (primary), accentGreen (success), card (secondary)
- Bold text, uppercase, letterSpacing: 1.5
- Bottom-left corner cut (triangle mask)
- Right accent border: 3px borderGlow strip
- Tag label: small "R-25" style label in cyberYellow at bottom-right
- borderRadius: 2 (angular)

### XP Progress Bar
- Track: `cardBorder`, borderRadius: 1
- Fill: `xpBar` (terminal green) with animated width
- Level badge: solid accent bg with dark text
- Tick marks at 25%/50%/75% for tactical look
- Show current XP / next level XP as text
- Animate on XP gain

### Stat Card
- Angular (borderRadius: 2)
- Top accent bar: 2px colored strip at 60% width
- Top-right corner cut
- Icon + number + label centered

### Section Header
- Left accent bar: 3px vertical colored strip
- Uppercase text with letterSpacing: 1.5
- Color: accent green

### Exercise Row
- Angular checkbox (borderRadius: 3)
- Completed state: strikethrough + green check
- Remaining state: outlined checkbox

## Layout Rules
- Use `SafeAreaView` for all screens
- Consistent padding: `md` (16) horizontal on screen content
- Card gap: `md` (16)
- **borderRadius: 2 everywhere** — angular cyberpunk aesthetic
- Exception: circular avatars (borderRadius: 50)
- Bottom tab bar height: consider safe area
- Scroll content should have bottom padding for tab bar

## Cyberpunk UI Techniques (React Native)
- **Corner cuts**: Rotated `View` (transform: rotate 45deg) positioned at corner, colored with parent bg
- **Triangle cuts**: CSS border trick (borderRightWidth + transparent + borderBottomWidth + parentBg)
- **Accent bars**: Absolute-positioned thin Views (3px wide/tall)
- **Tag labels**: Small absolute-positioned View at bottom-right with cyberYellow bg
- **No SVG needed** — all effects done with standard Views

## Animation Patterns
- XP gain: Number counter animation + bar fill
- Level up: Full-screen celebration overlay
- Mission complete: Checkmark animation + reward summary
- Streak increment: Fire icon pulse
- Achievement unlock: Badge slide-in from top

## Anti-patterns
- Don't use large borderRadius (16+) — keep angular (2)
- Don't use light backgrounds — everything is dark mode
- Don't use thin fonts for titles — bold/extrabold only for headings
- Don't hard-code colors — always reference theme constants (especially avoid `#000`)
- Don't mix alignment — left-align text, center-align CTAs
- Don't skip haptic feedback on major interactions

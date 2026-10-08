## Imported Claude Cowork project instructions

## iPhone Duo / resizable window (Apple: developer.apple.com/iphone-duo/prepare)

The window can resize mid-session (fold/unfold, iPhone Mirroring, iPad multitasking). Layout must be a function of
the current container size and size classes, never a launch-time snapshot or a device guess.

- Never: `UIScreen.main`, `UIDevice.current.orientation` / `interfaceOrientation` for layout, `userInterfaceIdiom`
  / `Platform.isPad` / `isTablet` for layout, hardcoded iPhone sizes, `Dimensions.get()` at module scope,
  `UIRequiresFullScreen`.
- Always: `useWindowDimensions()` / `onLayout` (RN), `GeometryReader` / `onGeometryChange` / size classes (SwiftUI),
  `view.bounds` in `layoutSubviews` / `viewDidLayoutSubviews` + `viewWillTransition` (UIKit), `resize` /
  `ResizeObserver` handlers (web). Toolbars and tab bars may sit vertically beside the status bar on iOS 27.1+.
- Full-bleed media: choose fill vs fit from the current aspect ratio and set a focal point.
- Build with the newest Xcode (iOS 27.1 SDK+). Test with the iOS resizable simulator, iPhone Mirroring resized to
  extremes, and the iPhone Duo simulator; fold/unfold on every screen.
- Before an iOS release run `~/.claude/skills/iphone-duo-ready/scripts/audit.sh .` (must exit 0).

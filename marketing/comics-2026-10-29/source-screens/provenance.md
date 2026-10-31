# Genuine Gruntz screen sources

Selected and visually inspected on 2026-10-29. These files are byte-for-byte copies of existing app captures. No screenshot content was repainted, regenerated, edited, or cropped.

| File | Dimensions | Original source | Currency and visible contents |
| --- | --- | --- | --- |
| `train-current.png` | 402 × 874 | `/private/tmp/gruntz-18pro-final-qa/02-final-train.png` | Oct 27 native app QA capture. Current Mission Purpose card, Your Plan, and the app's real floating 100 Push-Up Challenge banner. The banner covers part of the hero, as it does in the source capture. |
| `ranks-current.png` | 402 × 874 | `/private/tmp/gruntz-18pro-final-qa/v2/10-ranks-tab.png` | Oct 27 native app QA capture. Recruit, Level 1, 85 / 100 XP, achievement count, front/back muscle map. Best current capture for a clean complete phone insert. |
| `workout-log.jpg` | 660 × 1434 | `website/public/app/log.jpg` | Sept 21 genuine marketing app capture. Barbell Split Squat, logged set, rest timer. Older UI snapshot than the current QA captures, but high resolution and authentic. |

SHA-256 checksums:

```text
0630ddb6e113019da2175b86f70e266562adc1ce31d9298cd2349335244cd5af  train-current.png
5107dc94bafd0f53e3a5621cf7b1d040096459d8008c9e4096f4f51586bed2b4  ranks-current.png
e44cb34ea211e7d7902d264f0268bcdf4831e79b82d2b629d7e772bef603649e  workout-log.jpg
```

## Placement guidance

All three screen images have the same approximately 0.46 width-to-height ratio (about 9:19.6). Preserve this aspect ratio. Use the complete image inside a straight-on phone screen; fit without stretching, recoloring, regenerated text, perspective distortion, or a new phone notch over the screen. At 1080 × 1350 ad size a screen width around 270–310 px produces a screen height around 587–674 px. A 350–390 px phone insert is possible if the layout reserves a full product column. Keep dialogue outside the phone so genuine UI remains visible. The ranks screen is the strongest current all-branch insert because it has no branch-specific test name.

## Other sources checked

- `marketing/app-store/make_screenshots.py` references raw `a_train.png`, `a_log.png`, and other `a_*.png` files through `SHOTS_DIR`. No such raw files were found in the repository, the nearby MVPapp folder, or the limited `/private/tmp` asset search. The Oct 13 App Store composites remain available under `marketing/app-store/iphone-6.9/`.
- `/private/tmp/gruntz-fresh-train.png` is a real 1206 × 2622 capture, but it contains a visible touch indicator on Settings and the same challenge banner over the hero; it was not selected.
- `screenshots/iphone_6_5/` contains an obsolete lime-green design and was not selected.
- Existing `marketing/instagram-comics/comic_clean.html` builds its phone content from HTML labels rather than app screenshots; those invented screens were not used.

## Copy accuracy

The app supports Army, Marine Corps, Navy, Air Force, Space Force, and Coast Guard profiles. Safe product claims include structured training, set logging and rest timers, exercise videos, GPS runs/rucks, XP/ranks/streaks, and branch-specific test-preparation tracking. A preparation percentage is an estimate against targets, not an official military score or a guaranteed test result.

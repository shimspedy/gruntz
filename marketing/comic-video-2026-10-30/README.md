# Since Monday — Gruntz motion-comic video

One 21-second vertical ad, prepared for upload to Instagram Reels and TikTok. This is a motion comic: original illustrated panels, restrained camera moves, timed dialogue bubbles and an app demonstration. No generated lip-sync or character deformation. No social account upload or ad launch was performed.

## Deliverables

- `exports/gruntz-since-monday-1080x1920.mp4`: H.264 High, 1080 × 1920, constant 30 fps, yuv420p, AAC stereo 48 kHz, faststart.
- `exports/since-monday-cover.jpg`: matching vertical cover, headline positioned for central profile-grid crops.
- `exports/caption.txt`: organic caption, ad copy and App Store destination.
- `index.html`: local player and download links.

## Story

| Time | Scene |
| --- | --- |
| 0–1.2 | 30 minutes in. Zero reps. |
| 1.2–3.4 | “What’s the workout?” |
| 3.4–5.8 | “Waiting for motivation.” |
| 5.8–8.3 | “How long’s the rest timer?” |
| 8.3–11 | “Since Monday.” Held reaction and timer beep. |
| 11–14.5 | Genuine daily-plan app capture. |
| 14.5–17.5 | Genuine log and rest-timer app capture. |
| 17.5–21 | Download Gruntz; iPhone; included-access/subscription terms. |

## Sources and rights

- Original Marine comic art: `../comics-2026-10-29/art/marines.png`, generated for this project. No Terminal Lance art or characters were used.
- Genuine app captures: `../comics-2026-10-29/source-screens/train-current.png` and `workout-log.jpg`; their provenance is in that source folder. The complete captures are fitted proportionally, without invented UI.
- Current icon: repository `assets/icon.png`.
- Original score and sound effects: generated algorithmically by `build_audio.py`, from oscillators and seeded noise. No third-party recordings, samples, voices or trending songs. No music-library license tied to one platform.
- Bangers, Comic Neue and DM Sans are from Google Fonts and retain their OFL licenses in `assets/`.

## Export and verification

Run `build_audio.py`, then `render.py` with a Python containing Pillow and NumPy. FFmpeg/ffprobe must be on PATH. Render writes the master, cover and storyboard. Audio is normalized to approximately -18 LUFS with a -1.5 dBTP ceiling. All essential dialogue and CTA stay above the lower platform overlays; exact overlays vary with placement and caption. Preview the placement in the ad platform before launching.

The encoded master is decoded for frame inspection and technical QA. The story reads without sound. No engagement or performance outcome is guaranteed.

Official export reference checked on 2026-10-30: https://ads.tiktok.com/resources/help/article/tiktok-auction-in-feed-ads?lang=en . The Meta official Reels documentation was login/rate gated, so this project does not claim to certify its precise UI margins.

# Gruntz — six-branch comic collection

Six original comic concepts for Army, Marine Corps, Navy, Air Force, Space Force, and Coast Guard. Each concept has a separately composed 1080 × 1350 feed image and 1080 × 1920 story image, exported as PNG and JPG.

Open `index.html` for the responsive review gallery, format switch, downloads, and suggested ad copy. `exports/all-branches-preview.jpg` is a compact contact sheet. `exports/gruntz-six-branches-jpg.zip` contains the 12 finished JPG placements and copy notes.

## Source integrity

- Character art is original AI-generated artwork made with the built-in imagegen tool; all generated strips remain under `art/`.
- Phone screens are complete genuine Gruntz app captures, placed at their original aspect ratios. The layout renderer does not redraw, retouch, crop, or fabricate app UI. See `source-screens/provenance.md` for the original source paths and capture dates.
- Army and Marine Corps show the current Train screen; Navy and Air Force show the genuine workout log; Space Force and Coast Guard show the current Ranks screen.
- The exercise log source predates the two current native captures. It is an authentic app capture. Source dates are disclosed in provenance.
- Uniform art uses ordinary working uniforms: Army/Air Force OCP, Marine woodland MARPAT, Navy green NWU Type III, Space Force OCP with blue details, Coast Guard navy-blue ODU. The illustrations simplify insignia.
- No new offer, price, official test score, pass guarantee, or military endorsement is stated.

## Editable inputs and rerendering

`creative.json` holds headlines, dialogue, benefit copy, screenshot choice, and suggested Meta copy. `render.cjs` composes the generated strips, typesetting, genuine screens, and actual app icon into final assets using the bundled `@napi-rs/canvas` runtime. Run it from the repository root:

```sh
node marketing/comics-2026-10-29/render.cjs
```

The renderer checks text against its allocated widths and records output dimensions plus source/insert aspect ratios in `render-audit.json`. Rerender the complete set after any copy or art change, inspect the output visually, and rebuild the JPG archive.

## Meta publication

Published to Meta on October 30, 2026 (America/Detroit); delivery is subject to Meta review/preparation. After a full Ads Manager reload, all six ads were confirmed On with delivery Preparing.

All six branch ads use the same existing ad set, with a feed and Story image for each ad. The original budget, audience, schedule, and destination were retained. Meta optimizes distribution among the ads; equal or random delivery is not guaranteed.

`publication.json` records the ad account, campaign, ad set, branch-to-ad mapping, and final delivery status. The exported image files, original artwork, and screenshots remain unchanged.

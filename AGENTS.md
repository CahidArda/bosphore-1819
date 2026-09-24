# AGENTS.md: handover context for Bosphore 1819

Read this before changing anything. It says who made the project, how, where the
pieces live, and which decisions are deliberate.

## What this is

Bosphore 1819 (https://bosphore-1819.vercel.app) shows the 1819 French map of the
Bosphorus (*Plan Topographique du Bosphore de Thrace ou Canal de Constantinople et de
ses environs*, surveyed by François Kauffer 1776-1786, redrawn by Jean-Denis Barbié du
Bocage for Melling's *Voyage pittoresque de Constantinople*) with every place name
read, boxed and given three ways: the French original as engraved, the Ottoman Turkish
name (Latin and Arabic script) and today's name, each with a literal gloss.

## Who built it and how

- Built by Cahid Arda Öz (https://cahidarda.com) with Claude Code, in one afternoon.
  A main agent orchestrated; Claude Opus 5.5 subagents did the reading and the review.
- The story and the method are in the blog post:
  https://cahidarda.com/articles/bosphore-1819
- Repository: https://github.com/CahidArda/bosphore-1819 (MIT for code, CC0 for the
  label data). Deployed on Vercel with the Vite preset and no environment variables.

## The image

- Scan by the Bibliothèque nationale de France, Gallica ark:/12148/btv1b10100957j,
  mirrored on Wikimedia Commons: 12,509 x 7,749 px, 13.5 MB JPEG, public domain.
- The app never self-hosts it. `src/map/pyramid.ts` builds an OpenSeadragon
  `legacy-image-pyramid` from the Wikimedia 1280 / 1920 / 3840 px thumbnails plus the
  original, all served from upload.wikimedia.org with `Access-Control-Allow-Origin: *`.
  Only those thumbnail widths exist; others return 400. On phones the original level is
  dropped (`isConstrainedDevice`), because decoding 97 megapixels stalls mobile WebGL.
  `minPixelRatio` is 0.3 on purpose: the levels are not power-of-two steps, and with the
  default 0.5 the viewer stretched the 3840 px thumbnail at label zoom (blurry) and used
  the 1280 px one at home. Measure with `?debug` (`window.__osd`) before changing it.
  How it was found: with `?debug`, read `viewer.world.getItemAt(0)._lastDrawn` (tile
  levels 0..3 = 1280, 1920, 3840, original) at three zooms in a 1280×800 window, setting
  `viewer.minPixelRatio` and the item's `minPixelRatio` and forcing a redraw between runs:

  | minPixelRatio | label zoom (image zoom 0.37) | mid (0.17) | home (0.07) |
  |---|---|---|---|
  | 0.5 (default) | level 2, 3840 px stretched | level 1 | level 0, soft |
  | 0.4 | level 2 | level 2 | level 0 |
  | 0.3 (chosen) | level 3, original | level 2 | level 1 |
  | 0.2 | level 3 | level 2 | level 1 |

  0.3 is the largest value that draws the original at label zoom and the 1920 px level at
  home; 0.2 gives the same levels for no benefit. `maxZoomPixelRatio` and
  `minZoomImageRatio` were not part of the problem.
- The scan has a dark band around the paper (up to ~100 px of the original per side). The
  viewer hides it with `TiledImage.setClip` on open (`PAPER_INSET` in `pyramid.ts`), which
  also shrinks the home view and pan limits to the paper. Do not crop or self-host the
  image for this; labels stay in full-scan coordinates.
- Scripted downloads need a descriptive User-Agent (`pipeline/common.py`). Gallica's
  IIIF endpoint refuses scripts; do not depend on it.
- `pipeline/download.py` fetches the scan to `pipeline/raw/full.jpg` (gitignored) and
  checks the dimensions.

## The data

- `public/labels.json` is generated. Never edit it by hand. Edit the chunk files in
  `pipeline/out/chunks/` and run `python3 pipeline/merge.py`, then
  `python3 pipeline/consistency.py`.
- The scan was cut into 54 overlapping 1500 x 1300 tiles rendered with a red grid in
  full-image pixel coordinates (`pipeline/chunks.py`). OCR subagents wrote one JSON
  file per tile (`c_<x0>_<y0>.json`); a second pass over tiles with the recorded boxes
  painted over (`pipeline/masked.py`) wrote `<id>-pass2.json`; the big letter-spaced
  region names live in `overview.json`; two labels that straddle tile seams are in
  `seams-pass2.json`. `merge.py` dedupes across the overlaps by normalised text and box
  overlap, so a label recorded from two tiles is fine.
- Record format and reading rules: `pipeline/schema.json`, `pipeline/prompts/ocr.md`.
  Review prompts: `prompts/review.md` (boxes and misses), `prompts/quality.md` (names
  and translations). `pipeline/fixups.py` holds the cross-chunk decisions made after
  review; it is idempotent and runs before `merge.py`.
- Conventions: `fr` exactly as engraved; Ottoman Arabic script with ی and ك only;
  `modern` is today's Turkish name (or a short Turkish description), plus district,
  plus one of the status tokens `(lost)`, `(demolished)`, `(ruin)`, `(unidentified)`,
  `(abandoned)`, `(submerged)`, `(partly surviving)`, `(cleared)`, `(probable)`,
  `(culverted)`, `(not a place)`, which the app translates (`localizeModern` in
  `src/i18n.ts`); never a sentence, never English. `lit.modern` glosses a modern name
  that has a meaning. `note` is `{en, fr, tr}` or null (`pipeline/prompts/localize.md`).
  `uncertain: true` whenever a reading or identification is a guess; the app shows
  those with a `?` badge. Boxes are stored as fractions of the image.
- QA: `pipeline/overlay.py` draws every box back onto the tiles (`pipeline/out/qa/`).

## The app

- Vite + React + TypeScript, Tailwind v4, shadcn-style components in
  `src/components/ui` (copied in, no runtime library; tailwind-merge was dropped on
  purpose to stay under the 200 KB gzipped first-load budget, so avoid conflicting
  Tailwind utilities on one element). OpenSeadragon 5 for the viewer.
- `src/components/MapView.tsx`: one overlay element for all labels (children positioned
  in percentages), hit-testing in JS, a shared hover card. Desktop: hover shows the card,
  click toggles selection. Touch: tap pins the card, tap elsewhere closes it.
- `src/i18n.ts`: FR / TR / EN interface strings and the gloss rules (`glosses()`).
  Language and selection live in the URL (`?lang=`, `?sel=`).
- Checks: `pnpm build`, `pnpm sizes` (budget), `pnpm test:e2e` (Playwright smoke test
  against `vite preview`; run `pnpm exec playwright install chromium` once).

## The demo videos (`docs/*.mp4`)

`docs/demo-10s-en.mp4` is the one the blog post embeds (2560x1600, 60 fps, ~12 MB). The
tools that made it are in `scripts/video/`. The two Turkish videos were made the same
way at 1x before these scripts were kept.

**1. Record on a Mac, not in a box.** A box browser renders WebGL in software and
captures 2-3 real frames per second.

```sh
pnpm build && pnpm preview --port 4173          # or point the script at the live site
node scripts/video/record-intro.mjs take 'http://localhost:4173/?lang=en'
```

- Headed Chromium, 1280x800 viewport at **device scale 2**. At 1x the home view looked
  pixelated on retina screens: the whole 12,509 px sheet lands in ~920 video pixels.
  Zoomed-in frames look fine either way; the home view is where 2x matters.
- Before the take the script warms the cache: it runs the same search, shows both
  fortresses on the map, waits, clears and goes home. Without this the zoom plays while
  the original image is still loading and the video shows the soft level.
- Capture is a CDP screencast (`Page.startScreencast`, one JPEG per compositor
  update). The frames are re-timed to constant 60 fps from their timestamps, encoded
  at 30, then motion-interpolated to 60 (`minterpolate`) so the 0.6 s fly-to is smooth.
- Output in `take/`: `raw.mp4` (the take), `take.json` (event timestamps and the
  on-screen CSS-pixel positions of everything clicked or hovered).

**2. Build the cut spec.** `python3 scripts/video/build_spec.py take` turns
`take.json` into `take/spec.json`: two segments totalling 10 s, captions timed to the
events, a drawn cursor with click ripples, the URL pill, `ui_scale: 2`. Cursor
positions stay in CSS pixels; the renderer scales them.

**3. Render in an Upstash Box.** The Mac's ffmpeg has no `drawtext`, so captions need a
Linux ffmpeg. Upload `take/raw.mp4`, `take/spec.json`, `scripts/video/render.py` and
`scripts/video/sprites/` to a box (a Blob presigned PUT, then `curl` inside the box),
then in the box:

```sh
# screencast JPEGs are full-range; convert, and hold the last frame (the screencast
# stops sending frames when nothing moves)
ffmpeg -i take/raw.mp4 -vf 'scale=in_range=jpeg:out_range=tv,format=yuv420p,tpad=stop_mode=clone:stop_duration=3' \
  -c:v libx264 -crf 14 -preset fast take/raw3.mp4
sed -i 's#take/raw.mp4#take/raw3.mp4#g' take/spec.json
python3 render.py take/spec.json          # run it detached (setsid) and poll a log
```

- `render.py` is the Upstash `upstash-box-remote-work` skill's renderer with fixes that
  were needed here: `-thread_queue_size 4096` and `-framerate 60` on the looped sprite
  inputs (it stalled without them), one decoder per segment (sharing one input ran the
  box's 4 GB out of memory at 2560x1600), `ui_scale` for 2x output and a `crf` option.
- No apostrophes in captions; `drawtext` quoting breaks on them.
- Check a contact sheet before shipping:
  `ffmpeg -i out.mp4 -vf 'fps=1,scale=640:-1,tile=5x2' -frames:v 1 sheet.png`.
  Also look at a full-size frame of the home view and one after the zoom.
- Fetch the result through the box preview (`box_preview`) or Blob, then replace
  `docs/demo-10s-en.mp4` and commit.

**4. Purge the CDN after the file on `main` changes.** The blog embeds the video from
this repo through jsDelivr (`cdn.jsdelivr.net/gh/CahidArda/bosphore-1819@main/docs/<file>.mp4`),
because GitHub's raw URL serves MP4 as `application/octet-stream`. jsDelivr caches
branch URLs for up to 12 hours, so after the replacement is merged, purge it or the
blog keeps showing the old video:

```sh
curl https://purge.jsdelivr.net/gh/CahidArda/bosphore-1819@main/docs/demo-10s-en.mp4
curl -sI https://cdn.jsdelivr.net/gh/CahidArda/bosphore-1819@main/docs/demo-10s-en.mp4 | grep -i content-length
```

The second line should print the new file's size. jsDelivr serves files up to 20 MB
from GitHub; keep videos under that. Browsers may still hold the old file, so check
with a hard refresh.

## Working here

- Branch, commit per change, open a PR; do not push to `main` directly.
- Keep the prose in the app free of em-dashes and keep `modern` fields short.
- When you change labels, re-run merge and consistency, rebuild, and update the counts
  in README.md (`N labels, of which M are flagged uncertain`).

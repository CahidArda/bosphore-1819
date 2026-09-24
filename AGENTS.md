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

- Produced with Playwright driving the deployed site, then cut with ffmpeg: captions,
  a drawn cursor with click ripples and a URL pill are rendered from a spec built from
  the wall-clock timestamps the take script logs (the `render.py` / `sprites.py`
  helpers from the Upstash `upstash-box-remote-work` skill).
- Capture on a Mac with a headed Chromium and a CDP screencast (`Page.startScreencast`,
  a frame per compositor update), assembled to constant 60 fps with per-frame
  durations, then motion-interpolated (`minterpolate`) so the 0.6 s fly-to reads
  smoothly. Recording inside a headless box browser gave only 2-3 real frames per
  second, because the box renders WebGL in software; do not record there.
- The blog embeds the videos from this repo through jsDelivr
  (`cdn.jsdelivr.net/gh/CahidArda/bosphore-1819@main/docs/<file>.mp4`), because
  GitHub's raw URL serves MP4 as `application/octet-stream`. jsDelivr caches `@main`
  for up to a day: publish a replacement under a new file name.

## Working here

- Branch, commit per change, open a PR; do not push to `main` directly.
- Keep the prose in the app free of em-dashes and keep `modern` fields short.
- When you change labels, re-run merge and consistency, rebuild, and update the counts
  in README.md (`N labels, of which M are flagged uncertain`).

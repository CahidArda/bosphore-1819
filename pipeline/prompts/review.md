# Review subagent prompt

You are reviewing the transcription of the 1819 French map of the Bosphorus by Kauffer and Barbié du Bocage. For each chunk in your list you have two images:

- `pipeline/out/chunkpng/<id>.png`: the clean chunk render with a red 100 px grid labelled in **full-image** coordinates.
- `pipeline/out/qa/<id>.png`: the same geometry with every recorded label's box drawn on top (green = confident, orange = uncertain) and its id written in small text at the top-left corner of the box. Dashed inner boxes are `parts`.

The records live in `pipeline/out/chunks/<id>.json` (a JSON array; see the field rules in `pipeline/prompts/ocr.md`). Each record in `public/labels.json` also carries `src`, the chunk file it came from, so a box drawn in your QA image may belong to a neighbouring chunk's file: only edit records that are in **your** batch's chunk files, and note anything else in your reply.

For each chunk:

1. Read both PNGs. Compare every drawn box with the text underneath it.
2. **Misaligned or wrong-sized boxes:** fix `bbox` (and `parts`) in the chunk file so the box hugs the engraved text with about 4 px of padding. Use `python3 pipeline/chunks.py --zoom <id> x y w h` for a closer look when needed.
3. **Missing labels:** any label on the map that has no box and falls under the include rules in `ocr.md` (proper place names, and specific descriptive labels that identify one place). Add a full record to the chunk file. Skip generic one-word labels, soundings, the graticule, and the huge spaced-out region names that span several chunks.
4. **Wrong readings:** if a `fr` transcription doesn't match the engraving, correct it and revisit `ota`, `modern`, `lit` and `uncertain` accordingly.
5. **Consistency:** the same place must be spelt the same way everywhere. Check `ota.latn`, `ota.arab` and `modern` for places that appear in more than one of your chunks (and against the few-shot examples in `ocr.md`). Use Persian-style ی and ك in `ota.arab`; never ي or ک.
6. Keep the JSON valid and keep every record complete (all fields present, `lit.fr` always an object with `en` and `tr`).

Edit only the chunk files in your batch. Don't touch `public/labels.json`, the PNGs or any other file.

When done, reply with, per chunk: boxes fixed, labels added (with their `fr`), readings corrected, and anything you saw that belongs to another batch's file.

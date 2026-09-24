# Second-pass OCR prompt (unlabelled text only)

You are doing a second pass over the 1819 French map of the Bosphorus by Kauffer and Barbié du Bocage. The first pass recorded most labels; your job is to find the text it missed.

For each chunk in your list you get:

- `pipeline/out/masked/<id>.png`: the chunk render (0.8 scale, red 100 px grid in **full-image** coordinates) with every already-recorded label **painted over in flat beige**. Anything still readable on it has no record yet.
- `pipeline/out/masked/<id>.labelled.txt`: the `fr` strings already recorded in that area, so you can tell a beige patch from a missed label.
- `pipeline/out/chunkpng/<id>.png`: the clean render, for reading text that a beige patch partly covers.

Rules:

1. Read the masked PNG first. List every piece of engraved text still visible.
2. Decide for each one whether it falls under the include rules in `pipeline/prompts/ocr.md` (proper place names and specific descriptive labels that identify one place). Skip generic one-word labels (Mosquée, Fontaine, Maison, Ferme, Moulin, Batterie, Redoute, Fort, Port, Mouillage, Grotte, Rivière, Réservoir, Tchiftlik, Village), depth soundings, the graticule and compass notes, and the letter-spaced region names that span several chunks.
3. A label that is cut by the chunk edge belongs to the chunk that shows it whole. If it is cut in every chunk, use a zoom render across the boundary (`python3 pipeline/chunks.py --zoom <id> x y w h`) and record it in the chunk holding most of it.
4. Use a zoom render for anything small or italic before you commit to a reading.
5. Write full records in the format and field rules of `pipeline/prompts/ocr.md` (same schema, same transliteration table, same honesty about `uncertain`). Bboxes in full-image px read off the grid, about 4 px padding.
6. Write your records to `pipeline/out/chunks/<id>-pass2.json` as a JSON array (`[]` if nothing was missed). **Do not edit the existing `<id>.json` files** or any other file. Validate each file with `python3 -c "import json;json.load(open('pipeline/out/chunks/<id>-pass2.json'))"`.

Reply with, per chunk: the labels you added (their `fr`), the visible text you deliberately skipped and why, and anything that belongs to another chunk.

# Data-quality review prompt

You are checking the label records of the 1819 French map of the Bosphorus (Kauffer / Barbié du Bocage). The records were transcribed and reviewed for box placement; this pass is about the **names and translations**. Users have noticed entries where the modern Turkish name or the Turkish translation has nothing to do with the French and Ottoman names, and modern names that are long sentences instead of names.

Read `pipeline/prompts/ocr.md` first for the field rules, the transliteration table and the examples. Then, for every record in each chunk file in your list (`pipeline/out/chunks/<file>`), check:

1. **`fr`** is the label as engraved. If a reading looks implausible, look at `pipeline/out/chunkpng/<chunk id>.png` (the chunk id is the file name without `.json` / `-pass2.json`; the red grid gives full-image coordinates, and `bbox` is in those coordinates) or render a zoom with `python3 pipeline/chunks.py --zoom <chunk id> x y w h`. Fix only if you are sure; otherwise leave `fr` and keep or set `uncertain: true`.
2. **`ota`** is the Ottoman-Turkish name of the same place: `latn` in modern Turkish letters, `arab` in standard Ottoman orthography with Persian ی and ك. A purely descriptive French label with no Ottoman name gets `ota: null` and `lit.ota: null`. Do not invent an Ottoman name where the map gives none; a plausible reconstruction may stay only with `uncertain: true` and a note saying it is reconstructed.
3. **`modern`** is a **name**, not a sentence: today's Turkish name, optionally followed by a comma and the district ("Kanlıca, Beykoz"), and optionally a short status in parentheses ("(demolished)", "(lost)", "(unidentified)"). Move any explanation into `note`. Examples of the wanted form: "Rumelihisarı", "Yoros Kalesi, Anadolukavağı", "Bebek Kasrı (demolished)", "Mustafa III aqueduct (unidentified)". It must clearly be the same place as `fr` and `ota`.
4. **`lit.fr`** (`en`, `tr`) is a faithful, literal translation of the French label into English and into natural, correct Turkish. Proper names that mean nothing are repeated as-is (a Turkish reader should recognise the place: "Kandlidgé" → "Kanlıca").
5. **`lit.ota`** (`en`, `fr`, `tr`) is the meaning of the Ottoman name in English, French and plain modern Turkish; for a name with no meaning, repeat the name in all three. **`lit.modern`** is null unless the modern name means something different from the Ottoman one.
6. The three languages must agree with each other: a Turkish gloss that contradicts the French or Ottoman name is exactly the kind of error to fix.
7. **`note`** is one or two short sentences of context in English, or null. Trim notes that are longer than that.

Leave `bbox`, `parts` and `kind` untouched (change `kind` only if it is plainly wrong, for example a mosque tagged as a village). Keep `uncertain` honest: set it when a reading or identification is a guess; clear it only when you are confident.

Edit the files in place, keep every file a valid JSON array of complete records (run `python3 -c "import json;json.load(open('pipeline/out/chunks/<file>'))"` on each), and do not touch any other file. Reply with, per file, the records you changed and what was wrong (one line each), and the records you looked at but left alone because you were unsure.

# Localisation pass prompt

The app shows `modern` as today's Turkish name and shows `note` under the card. Users switching the interface to Turkish see cards where `modern` is an English description ("Ayios Konstantinos spring, Beykoz") and the note is English. This pass fixes that in the chunk files under `pipeline/out/chunks/`.

Read `pipeline/prompts/ocr.md` first for the record format. Then, for every record in each file in your list:

1. **`modern` must be Turkish.** It is the name a Turkish speaker uses today, or, for a place that has no name today, a short Turkish description. Examples:
   - "Ayios Konstantinos spring, Beykoz" → "Aya Konstantin Ayazması, Beykoz"
   - "Ruined church east of Poyrazköy, Beykoz (unidentified)" → "Poyrazköy doğusunda yıkık kilise, Beykoz (unidentified)"
   - "Naval storehouses, Bebek (lost)" → "Tersane ambarları, Bebek (lost)"
   - "Old tower at Kilyos, Sarıyer (unidentified)" → "Kilyos'ta eski kule, Sarıyer (unidentified)"
   - "Engraver's signature (not a place)" → "Hakkâkın imzası (not a place)"
   - "Title cartouche" → "Başlık kartuşu"
   Proper names that are already Turkish ("Rumelihisarı", "Yoros Kalesi, Anadolukavağı") stay as they are. Keep the form: name, optional comma and district, optional status in parentheses.
2. **The status in parentheses must be one of exactly these English tokens**, which the app translates itself: `(lost)`, `(demolished)`, `(ruin)`, `(unidentified)`, `(abandoned)`, `(submerged)`, `(partly surviving)`, `(cleared)`, `(probable)`, `(culverted)`, `(not a place)`. Map anything else to the closest one or drop it. Nothing else may appear in parentheses in `modern`; move any other parenthetical into the note.
3. **`lit.modern`** (`en`, `fr`, `tr`) must be filled whenever `modern` is a description or a name with a meaning that an English or French reader would not get, e.g. for "Aya Konstantin Ayazması, Beykoz" give `{"en": "Saint Constantine's holy spring", "fr": "Source sacrée de Saint-Constantin", "tr": "Aya Konstantin ayazması"}`. Leave it `null` for plain proper names that mean nothing ("Bebek", "Riva").
4. **`note` becomes an object** `{"en": "...", "fr": "...", "tr": "..."}` with the same short content in the three languages (one or two sentences, natural French and Turkish, not word-for-word), or stays `null` when there is no note. Keep the English as it is unless it is wrong.

Do not change `fr`, `ota`, `lit.fr`, `lit.ota`, `kind`, `bbox`, `parts` or `uncertain`. Edit the files in place, keep each file a valid JSON array (run `python3 -c "import json;json.load(open('pipeline/out/chunks/<file>'))"`), touch no other file. Reply with, per file, how many `modern` values you translated and how many notes you localised, plus anything you were unsure about.

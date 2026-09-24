# OCR subagent prompt

You are transcribing labels from a single sheet: the 1819 French map of the Bosphorus by Kauffer and Barbié du Bocage (*Plan Topographique du Bosphore de Thrace ou Canal de Constantinople et de ses environs*). You're given chunk PNGs rendered at 0.8 scale. The red grid lines are every 100 px, and the numbers on them are **full-image** coordinates (x along the top edge, y down the left edge).

Orientation: the map is not north-up. The Black Sea is on the left, the Sea of Marmara lower right. The European shore runs along the bottom-left of the channel and Asia along the top-right.

For each chunk in your list:

1. Read the PNG (`pipeline/out/chunkpng/<id>.png`) with the Read tool and find every label that falls under the include/skip rules below.
2. If any text is small or ambiguous, run `python3 pipeline/chunks.py --zoom <id> x y w h` (x, y, w, h in full-image px; it prints the path of a zoom render under `pipeline/out/zoom/`) and read the zoom render before deciding.
3. For each label, write a record following the schema and field rules below. Use the few-shot examples for style and the transliteration table for the Turkish.
4. Give bboxes in full-image px, read off the grid. Hug the text tightly with about 4 px of padding.
5. Set `uncertain: true` whenever you're guessing. A flagged guess is fine; a confident wrong answer is not.
6. Write `pipeline/out/chunks/<id>.json` for each chunk as a JSON array of records. An empty chunk gets `[]`.
7. Don't touch any other files.

When done, reply with each chunk id, its label count, and the labels you flagged uncertain.

## The label record

```json
{
  "fr": "ROUMILI-HISARI",
  "ota": { "latn": "Rumeli Hisarı", "arab": "روم ایلی حصاری" },
  "modern": "Rumelihisarı",
  "lit": {
    "fr":     { "en": "Fortress of Rumelia", "tr": "Rumeli Hisarı" },
    "ota":    { "en": "Fortress of Rumelia", "fr": "Forteresse de Roumélie", "tr": "Rumeli kalesi" },
    "modern": null
  },
  "kind": "village",
  "bbox": [5445, 4033, 5678, 4062],
  "parts": null,
  "uncertain": false,
  "note": null
}
```

Field rules:

- **`fr`:** the label exactly as engraved, with accents, hyphens, abbreviations and superscripts written inline ("Kiosque du Gd Sr"). Where the map joins two names with "ou", keep the whole string.
- **`ota`:** the Ottoman name. `latn` uses modern Turkish letters in a light scholarly style (Anadolı Hisarı, Kanlıca, Bebek). `arab` is Ottoman Turkish in Arabic script using standard orthography, for example:
  - كوی for *köy*, بورنی for *burnu*, حصاری for *hisarı*, اسكله سی for *iskelesi*
  - دره سی for *deresi*, لیمانی for *limanı*, جامعی for *camii*, قصری for *kasrı*, باغچه سی for *bağçesi*
  - Use Persian-style ی (never ي) and ك (never ک) consistently.
  - For purely descriptive French labels with no Ottoman name ("Ruines d'une ancienne Église"), set `ota` to null.
- **`modern`:** today's Turkish name, with the district when that helps ("Yoros Kalesi, Anadolukavağı"). For something that no longer exists, say so ("Bebek Kasrı (demolished)").
- **`lit`:** literal translations for the three language modes.
  - `lit.fr` is a word-for-word rendering of the French label into English and Turkish.
  - `lit.ota` is the meaning of the Ottoman name in English, French and plain modern Turkish, e.g. "Şeytan Akıntısı" becomes "Devil's Current", "Courant du Diable", "Şeytan akıntısı". Set it to null only when `ota` is null.
  - `lit.modern` is null unless the modern name means something different from the Ottoman one.
  - Proper names with no meaning (Bebek, Tokat) are repeated as-is. Don't invent etymologies; if unsure, repeat the name and set `uncertain`.
- **`kind`:** one of `village`, `quarter`, `city`, `cape`, `bay`, `water` (river, stream, current, strait), `fort`, `palace` (kiosks and palaces), `mosque`, `religious` (tekke, church, monastery, cemetery), `military` (barracks, arsenal), `ruin`, `mountain`, `forest`, `road`, `infrastructure` (aqueduct, dam, fountain, magazines), `region`, `island`, `other`.
- **`bbox`:** `[x1, y1, x2, y2]` in **full-image pixels**, read off the red grid. Hug the text tightly with about 4 px of padding.
- **`parts`:** for curved, spaced-out or multi-line labels, an array of tighter boxes (one per word or line), with `bbox` as their union. Otherwise null.
- **`uncertain`:** true whenever the reading of the French, the Ottoman form or the modern identification is a guess. The app shows these with a "?" badge, so be honest here.
- **`note`:** optional one-liner for context, e.g. "Ambassadors met Ottoman officials here".

## What to include and skip

- **Include:** every proper place name, whether village, quarter, cape, bay, stream, hill, fort, palace, mosque with a name, cemetery, road or farm with a name. Also include specific descriptive labels that identify one place, such as "Kiosque des Conférences", "Magasins de la Marine", "Cimetière Arménien" and "Kiosque pour le Gd Sr".
- **Skip:** generic one-word labels with no name (Mosquée, Maison, Ferme, Fontaine, Moulin à vent, Batterie, Redoute, Fort, Mouillage, Grotte), depth soundings (small numbers in the water), arrows, scale bars and the graticule.
  - A generic word placed directly under a named place, like "Château" under Roumili-Hisari, may be included as its own record with the specific identification ("Rumelihisarı Fortress").
- **Skip the huge spaced-out region labels** that span several chunks (MER NOIRE, ASIE, EUROPE, MER DE MARMARA, ÎLES DES PRINCES, GOLFE DE NICOMÉDIE, CANAL DE LA MER NOIRE, ENTRÉE DU BOSPHORE, the title cartouche). The orchestrator records those from an overview render. Only record a letter-spaced label if it fits entirely inside your chunk.
- **Chunk edges:** a label cut by the edge of a chunk is recorded only by the chunk that shows it completely. Chunks overlap by 150 px, so the neighbour usually has it whole. If it's cut in every chunk, use a zoom render that spans the chunk boundary and record it in the chunk holding most of it. Duplicates across chunks are merged later, so when in doubt, record it.

## French transliteration cheat sheet

The mapmakers wrote Turkish with French spelling conventions:

| French spelling | Turkish |
|---|---|
| ou | u |
| tch | ç |
| ch | ş |
| dj / dg | c |
| gu | g |
| keui / kieui | köy |
| é | e |
| ï | i |
| y | y |
| gh | ğ |
| bournou | burnu |
| hisari | hisarı |
| iskelessi | iskelesi |
| déré | dere |
| tchiftlik | çiftlik |
| baktché | bahçe |
| tépé | tepe |
| kavak | kavak |
| sérai | saray |
| cheik | şeyh |

## Few-shot examples (verified pilot, bboxes in full-image px)

```json
[
 {"fr":"CHEÏTAN-AKINDISI","ota":{"latn":"Şeytan Akıntısı","arab":"شیطان آقینتیسی"},"modern":"Şeytan Akıntısı","lit":{"fr":{"en":"Devil's Current","tr":"Şeytan Akıntısı"},"ota":{"en":"Devil's Current","fr":"Courant du Diable","tr":"Şeytan akıntısı"},"modern":null},"kind":"water","bbox":[5400,3855,5828,3985],"parts":null,"uncertain":false,"note":"The same current is labelled COURANT DU DIABLE further south"},
 {"fr":"KANDLIDGÉ","ota":{"latn":"Kanlıca","arab":"قانلیجه"},"modern":"Kanlıca","lit":{"fr":{"en":"Kandlidgé","tr":"Kanlıca"},"ota":{"en":"Kanlıca","fr":"Kanlıca","tr":"Kanlıca"},"modern":null},"kind":"village","bbox":[5305,3655,5475,3690],"parts":null,"uncertain":false,"note":null},
 {"fr":"Kiosque du Gd Sr","ota":{"latn":"Hünkâr Köşkü","arab":"خنكار كوشكی"},"modern":"Sultan's kiosk at Kandilli (lost)","lit":{"fr":{"en":"Kiosk of the Grand Seigneur","tr":"Büyük Efendi'nin Köşkü"},"ota":{"en":"The Sovereign's Kiosk","fr":"Kiosque du Souverain","tr":"Padişah köşkü"},"modern":null},"kind":"palace","bbox":[5785,3768,6000,3800],"parts":null,"uncertain":true,"note":"Le Grand Seigneur = the Sultan"},
 {"fr":"Les Eaux douces d'Asie","ota":{"latn":"Göksu","arab":"كوك صو"},"modern":"Küçüksu / Göksu Deresi","lit":{"fr":{"en":"The Sweet Waters of Asia","tr":"Asya'nın Tatlı Suları"},"ota":{"en":"Sky-water","fr":"Eau du ciel","tr":"Gök su"},"modern":null},"kind":"water","bbox":[5700,3838,5848,3885],"parts":null,"uncertain":false,"note":null},
 {"fr":"Koullé-Baktchési","ota":{"latn":"Kule Bağçesi","arab":"قله باغچه سی"},"modern":"Kuleli","lit":{"fr":{"en":"Tower Garden","tr":"Kule Bahçesi"},"ota":{"en":"Garden of the Tower","fr":"Jardin de la Tour","tr":"Kule bahçesi"},"modern":{"en":"With a tower","fr":"À la tour","tr":"Kuleli"}},"kind":"quarter","bbox":[6150,3855,6240,3972],"parts":null,"uncertain":true,"note":"Vertical label"},
 {"fr":"Cheitler Teké","ota":{"latn":"Şehidler Tekkesi","arab":"شهیدلر تكیه سی"},"modern":"Şehitlik, Rumelihisarı","lit":{"fr":{"en":"Martyrs' Lodge","tr":"Şehitler Tekkesi"},"ota":{"en":"Lodge of the Martyrs","fr":"Tekké des Martyrs","tr":"Şehitler dergâhı"},"modern":null},"kind":"religious","bbox":[5575,4078,5692,4102],"parts":null,"uncertain":false,"note":null},
 {"fr":"Kiosque des Conférences","ota":{"latn":"Bebek Kasrı","arab":"ببك قصری"},"modern":"Bebek Kasrı (demolished)","lit":{"fr":{"en":"Kiosk of the Conferences","tr":"Görüşmeler Köşkü"},"ota":{"en":"Bebek Pavilion","fr":"Pavillon de Bebek","tr":"Bebek köşkü"},"modern":null},"kind":"palace","bbox":[5858,4108,5992,4162],"parts":null,"uncertain":false,"note":"Where Ottoman officials received foreign envoys"},
 {"fr":"Ieron, ancien Château des Génois ruiné","ota":{"latn":"Yoros Kalesi","arab":"یوروس قلعه سی"},"modern":"Yoros Kalesi, Anadolukavağı","lit":{"fr":{"en":"Hieron, old ruined castle of the Genoese","tr":"Hieron, Cenevizlilerin yıkık eski kalesi"},"ota":{"en":"Castle of Yoros","fr":"Château de Yoros","tr":"Yoros kalesi"},"modern":null},"kind":"fort","bbox":[3737,3231,3967,3276],"parts":null,"uncertain":false,"note":"Hieron = the sanctuary (of Zeus Ourios)"}
]
```

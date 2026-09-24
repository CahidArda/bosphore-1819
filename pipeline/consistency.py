#!/usr/bin/env python3
"""Consistency checks over the merged labels (run after merge.py):

- places with the same `modern` name but different Ottoman spellings
- Arabic-script fields using Arabic letterforms where the Persian/Ottoman
  ones are expected (ي -> ی, ك stays, ک -> ك), tashkeel, or Latin letters
- glosses the UI needs: lit.fr always present, lit.ota present when ota is set
- ids that collided (slug-2, slug-3 ...)

Exit status is 1 if any hard error is found so it can gate the build.
"""
import json
import re
import sys
from collections import defaultdict

from common import LABELS_PATH

BAD_ARAB = {
    "ي": "use ی (Farsi yeh)",
    "ک": "use ك (Arabic kaf)",
    "ى": "use ی",
    "ة": "use ه",
}
TASHKEEL = re.compile(r"[ً-ٰٟـ]")
LATIN = re.compile(r"[A-Za-z]")


def main():
    with open(LABELS_PATH, encoding="utf-8") as fh:
        labels = json.load(fh)["labels"]

    errors, warnings = [], []

    # 1. same modern name, different Ottoman spellings
    by_modern = defaultdict(set)
    for l in labels:
        if l["ota"]:
            by_modern[l["modern"]].add((l["ota"]["latn"], l["ota"]["arab"]))
    for modern, forms in sorted(by_modern.items()):
        if len(forms) > 1:
            warnings.append(f"{modern!r}: {len(forms)} Ottoman spellings: " + " | ".join(f"{a} / {b}" for a, b in sorted(forms)))

    # 2. letterforms
    for l in labels:
        if not l["ota"]:
            continue
        arab = l["ota"]["arab"]
        for ch, hint in BAD_ARAB.items():
            if ch in arab:
                errors.append(f"{l['id']} ({l['src']}): arab contains {ch!r}: {hint}: {arab}")
        if TASHKEEL.search(arab):
            warnings.append(f"{l['id']} ({l['src']}): arab has tashkeel/tatweel: {arab}")
        if LATIN.search(arab):
            errors.append(f"{l['id']} ({l['src']}): arab has Latin letters: {arab}")

    # 3. glosses
    for l in labels:
        lit = l["lit"]
        if not lit.get("fr") or not lit["fr"].get("en") or not lit["fr"].get("tr"):
            errors.append(f"{l['id']} ({l['src']}): lit.fr incomplete")
        if l["ota"] and not lit.get("ota"):
            errors.append(f"{l['id']} ({l['src']}): ota set but lit.ota is null")
        if l["ota"] and lit.get("ota") and not all(lit["ota"].get(k) for k in ("en", "fr", "tr")):
            errors.append(f"{l['id']} ({l['src']}): lit.ota incomplete")
        if not l["ota"] and lit.get("ota"):
            warnings.append(f"{l['id']} ({l['src']}): ota is null but lit.ota is set")

    # 4. id collisions
    collided = [l["id"] for l in labels if re.search(r"-\d+$", l["id"])]
    if collided:
        warnings.append(f"{len(collided)} ids needed a numeric suffix: " + ", ".join(collided[:20]) + (" …" if len(collided) > 20 else ""))

    for w in warnings:
        print("warn:", w)
    for e in errors:
        print("ERROR:", e)
    print(f"{len(labels)} labels, {len(warnings)} warnings, {len(errors)} errors")
    sys.exit(1 if errors else 0)


if __name__ == "__main__":
    main()

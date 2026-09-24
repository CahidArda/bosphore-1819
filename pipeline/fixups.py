#!/usr/bin/env python3
"""One-off cross-chunk fixes decided in the orchestrator's final consistency
pass after the review round. Idempotent; re-run freely before merge.py.
"""
import json
import os

from common import CHUNK_DIR

changes = []


def load(cid):
    with open(os.path.join(CHUNK_DIR, f"{cid}.json"), encoding="utf-8") as fh:
        return json.load(fh)


def save(cid, recs):
    with open(os.path.join(CHUNK_DIR, f"{cid}.json"), "w", encoding="utf-8") as fh:
        json.dump(recs, fh, ensure_ascii=False, indent=1)
        fh.write("\n")


def edit(cid, fn):
    recs = load(cid)
    before = json.dumps(recs, ensure_ascii=False, sort_keys=True)
    recs = fn(recs)
    after = json.dumps(recs, ensure_ascii=False, sort_keys=True)
    if before != after:
        save(cid, recs)
        changes.append(cid)


# 1. Generic one-word labels that slipped through the include rules.
GENERIC = {"rivière", "riviere", "mosquée", "fontaine", "maison", "ferme", "moulin", "port", "batterie", "redoute", "fort", "réservoir", "poudrière"}
for fname in sorted(os.listdir(CHUNK_DIR)):
    if not fname.endswith(".json"):
        continue
    cid = fname[:-5]

    def drop_generic(recs):
        # A bare generic word is dropped unless it was tied to a specific place
        # (an Ottoman name was supplied, or it is a fort under a named site).
        kept = [r for r in recs if r["fr"].strip().lower() not in GENERIC or r["kind"] == "fort" or r["ota"]]
        return kept

    edit(cid, drop_generic)


# 2. AGADGIK vs IAKA-KEUI: only one can be Yakacık; Iaka-Keui (Yaka Köy) is the better fit.
def fix_agadgik(recs):
    for r in recs:
        if r["fr"] == "AGADGIK":
            r["modern"] = "Ağacık (unidentified village north of Kartal)"
            r["lit"]["modern"] = None
            r["uncertain"] = True
            r["note"] = "Possibly a garbled Yakacık, but IAKA-KEUI just to the west is the better match for that village; left unidentified"
    return recs


edit("c_9100_700", fix_agadgik)


# 3. Sera-Tachi is recorded in two chunks with different guesses; use one form.
def fix_sera(recs):
    for r in recs:
        if r["fr"].lower().startswith("sera-tachi"):
            r["ota"] = {"latn": "Sıra Taşı", "arab": "صیره طاشی"}
            r["modern"] = "Sıra Taşı rock, north of Kınalıada (identification uncertain)"
            r["lit"]["ota"] = {"en": "Row Stone", "fr": "Pierre de la rangée", "tr": "Sıra taşı"}
            r["lit"]["modern"] = None
            r["uncertain"] = True
    return recs


edit("c_7750_3000", fix_sera)
edit("c_9100_3000", fix_sera)


# 4. ESKI-SERAÏ: the engraving has the diaeresis on the final I (c_6400_5300 agrees).
def fix_eski(recs):
    for r in recs:
        if r["fr"] in ("ESKI-SÉRAI", "ESKI-SERAI"):
            r["fr"] = "ESKI-SERAÏ"
    return recs


edit("c_6400_4150", fix_eski)


# 5. MONT MAL-TÉPÉ Ottoman script should match MAL-TÉPÉ ou VRIA (مال تپه).
def fix_maltepe(recs):
    for r in recs:
        if r["fr"].upper().startswith("MONT MAL-T") and r["ota"]:
            r["ota"]["arab"] = "مال تپه"
    return recs


edit("c_9100_1850", fix_maltepe)


# 6. MONT ALEM-DAGHI: the reviewed chunk box is tighter than the overview one; drop the overview copy.
def drop_alem(recs):
    return [r for r in recs if r["fr"] != "MONT ALEM-DAGHI"]


edit("overview", drop_alem)

print("changed:", ", ".join(changes) if changes else "nothing")

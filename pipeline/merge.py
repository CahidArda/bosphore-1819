#!/usr/bin/env python3
"""Merge the per-chunk label files into public/labels.json.

1. Load every pipeline/out/chunks/*.json and validate against schema.json.
2. Dedupe records that were captured by two overlapping chunks.
3. Normalise bboxes to image fractions [x/W, y/H, w/W, h/H] (5 decimals).
4. Sort by kind, then modern name, and assign stable slug ids.
5. Write minified public/labels.json and print totals.

    python pipeline/merge.py [--check]   # --check validates without writing
"""
import argparse
import glob
import json
import os
import re
import sys
import unicodedata

from common import CHUNK_DIR, IMG_H, IMG_W, LABELS_PATH, SCHEMA_PATH

KINDS = [
    "village", "quarter", "city", "cape", "bay", "water", "fort", "palace", "mosque",
    "religious", "military", "ruin", "mountain", "forest", "road", "infrastructure",
    "region", "island", "other",
]
KIND_ORDER = {k: i for i, k in enumerate(KINDS)}

# --------------------------------------------------------------------------- validation


def _validate_basic(rec, where):
    """Dependency-free validation mirroring schema.json; returns a list of errors."""
    errs = []
    req = ["fr", "ota", "modern", "lit", "kind", "bbox", "parts", "uncertain", "note"]
    for k in req:
        if k not in rec:
            errs.append(f"{where}: missing field {k!r}")
    extra = set(rec) - set(req) - {"src"}
    if extra:
        errs.append(f"{where}: unexpected fields {sorted(extra)}")
    if errs:
        return errs
    if not isinstance(rec["fr"], str) or not rec["fr"].strip():
        errs.append(f"{where}: fr must be a non-empty string")
    ota = rec["ota"]
    if ota is not None:
        if not isinstance(ota, dict) or set(ota) != {"latn", "arab"}:
            errs.append(f"{where}: ota must be null or {{latn, arab}}")
        elif not all(isinstance(ota[k], str) and ota[k].strip() for k in ("latn", "arab")):
            errs.append(f"{where}: ota.latn / ota.arab must be non-empty strings")
    if not isinstance(rec["modern"], str) or not rec["modern"].strip():
        errs.append(f"{where}: modern must be a non-empty string")
    lit = rec["lit"]
    if not isinstance(lit, dict) or set(lit) != {"fr", "ota", "modern"}:
        errs.append(f"{where}: lit must have exactly fr, ota, modern")
    else:
        if not (isinstance(lit["fr"], dict) and set(lit["fr"]) == {"en", "tr"}):
            errs.append(f"{where}: lit.fr must be {{en, tr}}")
        for k in ("ota", "modern"):
            v = lit[k]
            if v is not None and not (isinstance(v, dict) and set(v) == {"en", "fr", "tr"}):
                errs.append(f"{where}: lit.{k} must be null or {{en, fr, tr}}")
    if rec["kind"] not in KINDS:
        errs.append(f"{where}: unknown kind {rec['kind']!r}")

    def box_ok(b):
        return (
            isinstance(b, list)
            and len(b) == 4
            and all(isinstance(v, (int, float)) for v in b)
            and 0 <= b[0] < b[2] <= IMG_W
            and 0 <= b[1] < b[3] <= IMG_H
        )

    if not box_ok(rec["bbox"]):
        errs.append(f"{where}: bad bbox {rec['bbox']}")
    if rec["parts"] is not None:
        if not isinstance(rec["parts"], list) or not rec["parts"] or not all(box_ok(p) for p in rec["parts"]):
            errs.append(f"{where}: bad parts {rec['parts']}")
    if not isinstance(rec["uncertain"], bool):
        errs.append(f"{where}: uncertain must be boolean")
    n = rec["note"]
    if n is not None and not isinstance(n, str) and not (isinstance(n, dict) and set(n) == {"en", "fr", "tr"}):
        errs.append(f"{where}: note must be null, a string or {{en, fr, tr}}")
    return errs


def validate(records_by_file):
    errs = []
    try:
        import jsonschema  # type: ignore

        with open(SCHEMA_PATH) as fh:
            schema = json.load(fh)
        validator = jsonschema.Draft202012Validator(schema)
    except ImportError:
        validator = None
    for fname, recs in records_by_file.items():
        for i, rec in enumerate(recs):
            where = f"{os.path.basename(fname)}[{i}]"
            clean = {k: v for k, v in rec.items() if k != "src"}
            if validator is not None:
                for e in validator.iter_errors(clean):
                    errs.append(f"{where}: {e.message}")
            errs.extend(_validate_basic(rec, where))
    return errs


# --------------------------------------------------------------------------- helpers


def norm_text(s):
    s = unicodedata.normalize("NFKD", s)
    s = "".join(c for c in s if not unicodedata.combining(c))
    s = s.lower().replace("ı", "i")
    return re.sub(r"[^a-z0-9]+", " ", s).strip()


def slugify(s):
    s = unicodedata.normalize("NFKD", s)
    s = "".join(c for c in s if not unicodedata.combining(c))
    s = s.lower().replace("ı", "i")
    s = re.sub(r"\(.*?\)", " ", s)  # drop "(demolished)" etc.
    s = re.sub(r"[^a-z0-9]+", "-", s).strip("-")
    return s[:60] or "label"


def area(b):
    return max(0, b[2] - b[0]) * max(0, b[3] - b[1])


def iou(a, b):
    ix1, iy1 = max(a[0], b[0]), max(a[1], b[1])
    ix2, iy2 = min(a[2], b[2]), min(a[3], b[3])
    inter = max(0, ix2 - ix1) * max(0, iy2 - iy1)
    union = area(a) + area(b) - inter
    return inter / union if union else 0.0


def contains_centre(a, b):
    cx, cy = (b[0] + b[2]) / 2, (b[1] + b[3]) / 2
    return a[0] <= cx <= a[2] and a[1] <= cy <= a[3]


def same_record(a, b):
    if norm_text(a["fr"]) != norm_text(b["fr"]):
        return False
    ba, bb = a["bbox"], b["bbox"]
    return iou(ba, bb) > 0.3 or contains_centre(ba, bb) or contains_centre(bb, ba)


def null_count(rec):
    n = 0
    for k in ("ota", "note", "parts"):
        n += rec[k] is None
    for k in ("ota", "modern"):
        n += rec["lit"][k] is None
    return n


def better(a, b):
    """True if a should be kept over b."""
    return (area(a["bbox"]), -null_count(a)) >= (area(b["bbox"]), -null_count(b))


def dedupe(records):
    kept = []
    dropped = 0
    for rec in records:
        for i, k in enumerate(kept):
            if same_record(rec, k):
                if better(rec, k):
                    kept[i] = rec
                dropped += 1
                break
        else:
            kept.append(rec)
    return kept, dropped


def norm_box(b):
    x1, y1, x2, y2 = b
    return [
        round(x1 / IMG_W, 5),
        round(y1 / IMG_H, 5),
        round((x2 - x1) / IMG_W, 5),
        round((y2 - y1) / IMG_H, 5),
    ]


# --------------------------------------------------------------------------- main


def load_chunks():
    by_file = {}
    for path in sorted(glob.glob(os.path.join(CHUNK_DIR, "*.json"))):
        with open(path, encoding="utf-8") as fh:
            try:
                recs = json.load(fh)
            except json.JSONDecodeError as e:
                sys.exit(f"{path}: invalid JSON: {e}")
        if not isinstance(recs, list):
            sys.exit(f"{path}: top level must be an array")
        src = os.path.splitext(os.path.basename(path))[0]
        for r in recs:
            if isinstance(r, dict):
                r["src"] = src
        by_file[path] = recs
    return by_file


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--check", action="store_true", help="validate only, don't write")
    args = ap.parse_args()

    by_file = load_chunks()
    errs = validate(by_file)
    if errs:
        print("\n".join(errs), file=sys.stderr)
        sys.exit(f"{len(errs)} validation error(s)")

    all_recs = [r for recs in by_file.values() for r in recs]
    kept, dropped = dedupe(all_recs)
    kept.sort(key=lambda r: (KIND_ORDER[r["kind"]], norm_text(r["modern"]), norm_text(r["fr"])))

    seen = {}
    out = []
    for r in kept:
        base = slugify(r["modern"])
        n = seen.get(base, 0) + 1
        seen[base] = n
        rid = base if n == 1 else f"{base}-{n}"
        out.append(
            {
                "id": rid,
                "fr": r["fr"],
                "ota": r["ota"],
                "modern": r["modern"],
                "lit": r["lit"],
                "kind": r["kind"],
                "bbox": norm_box(r["bbox"]),
                "parts": [norm_box(p) for p in r["parts"]] if r["parts"] else None,
                "uncertain": r["uncertain"],
                "note": r["note"],
                "src": r["src"],
            }
        )

    by_kind = {}
    for r in out:
        by_kind[r["kind"]] = by_kind.get(r["kind"], 0) + 1
    uncertain = [r for r in out if r["uncertain"]]

    print(f"{len(by_file)} chunk files, {len(all_recs)} records, {dropped} duplicates dropped, {len(out)} kept")
    for k in KINDS:
        if k in by_kind:
            print(f"  {k:15s} {by_kind[k]}")
    print(f"  uncertain: {len(uncertain)}")

    if args.check:
        return

    doc = {
        "meta": {
            "title": "Plan Topographique du Bosphore de Thrace ou Canal de Constantinople et de ses environs",
            "authors": "François Kauffer (survey 1776–1786); J.-D. Barbié du Bocage (1819)",
            "published_in": "A.-I. Melling, Voyage pittoresque de Constantinople et des rives du Bosphore, 1819",
            "source": "BnF Gallica ark:/12148/btv1b10100957j, via Wikimedia Commons",
            "source_url": "https://commons.wikimedia.org/wiki/File:Plan_Topographique_du_Bosphore,_de_Thrace_ou_Canal_de_Constantinople_et_de_ses_environs_-_Fr._Kauffer_;_J.D._Barbi%C3%A9_du_Bocage_-_btv1b10100957j.jpg",
            "license": "public domain",
            "attribution": "Kauffer & Barbié du Bocage, 1819 · BnF Gallica / Wikimedia Commons · public domain",
            "dims": {"width": IMG_W, "height": IMG_H},
            "bbox_format": "[x, y, w, h] as fractions of the full image",
            "count": len(out),
            "uncertain": len(uncertain),
        },
        "labels": out,
    }
    os.makedirs(os.path.dirname(LABELS_PATH), exist_ok=True)
    with open(LABELS_PATH, "w", encoding="utf-8") as fh:
        json.dump(doc, fh, ensure_ascii=False, separators=(",", ":"))
    print(f"wrote {LABELS_PATH} ({os.path.getsize(LABELS_PATH) / 1024:.1f} KB)")


if __name__ == "__main__":
    main()

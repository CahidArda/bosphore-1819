#!/usr/bin/env python3
"""Render the chunks with every already-labelled box painted over, so a second
OCR pass only sees the text that has no record yet.

Reads public/labels.json (run merge.py first), paints each label's `parts`
(or `bbox`) with an opaque parchment tone plus a thin outline, and writes
pipeline/out/masked/<id>.png at the same geometry as the chunk renders.
Also writes pipeline/out/masked/<id>.labelled.txt listing the `fr` strings
already recorded in that chunk, for the subagent prompt.

    python pipeline/masked.py [--only c_5050_3000 ...]
"""
import argparse
import json
import os

from PIL import ImageDraw

from chunks import render_region
from common import CHUNK_SCALE, IMG_H, IMG_W, LABELS_PATH, OUT_DIR, chunk_grid, load_image

MASKED_DIR = os.path.join(OUT_DIR, "masked")
PAD = 3
FILL = (232, 224, 205)
EDGE = (205, 190, 160)


def denorm(b):
    x, y, w, h = b
    return [x * IMG_W, y * IMG_H, (x + w) * IMG_W, (y + h) * IMG_H]


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--only", nargs="*")
    args = ap.parse_args()

    with open(LABELS_PATH, encoding="utf-8") as fh:
        labels = json.load(fh)["labels"]

    im = load_image()
    d = ImageDraw.Draw(im)
    boxes = []
    for lab in labels:
        for b in lab["parts"] or [lab["bbox"]]:
            x1, y1, x2, y2 = denorm(b)
            box = [x1 - PAD, y1 - PAD, x2 + PAD, y2 + PAD]
            d.rectangle(box, fill=FILL, outline=EDGE, width=2)
            boxes.append((box, lab["fr"]))

    os.makedirs(MASKED_DIR, exist_ok=True)
    want = set(args.only) if args.only else None
    n = 0
    for cid, x0, y0, w, h in chunk_grid():
        if want and cid not in want:
            continue
        out = render_region(im, x0, y0, w, h, CHUNK_SCALE)
        out.save(os.path.join(MASKED_DIR, f"{cid}.png"), optimize=True)
        inside = sorted({fr for (bx1, by1, bx2, by2), fr in boxes if bx2 > x0 and bx1 < x0 + w and by2 > y0 and by1 < y0 + h})
        with open(os.path.join(MASKED_DIR, f"{cid}.labelled.txt"), "w", encoding="utf-8") as fh:
            fh.write("\n".join(inside) + "\n")
        n += 1
    print(f"wrote {n} masked renders to {MASKED_DIR}")


if __name__ == "__main__":
    main()

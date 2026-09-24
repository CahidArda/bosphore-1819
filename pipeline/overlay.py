#!/usr/bin/env python3
"""Draw every merged label box back onto the map for QA.

Reads public/labels.json, converts the normalised boxes back to pixels and
writes one PNG per chunk to pipeline/out/qa/ at the same geometry as the
chunk renders (0.8 scale, red 100 px grid). Confident labels are green,
uncertain ones orange; `parts` are drawn dashed; the id is written at the
top-left corner of each box.

    python pipeline/overlay.py [--only c_5050_3000 ...]
"""
import argparse
import json
import os

from PIL import ImageDraw

from chunks import render_region
from common import CHUNK_SCALE, IMG_H, IMG_W, LABELS_PATH, QA_DIR, chunk_grid, font, load_image

GREEN = (20, 150, 60)
ORANGE = (235, 120, 0)


def denorm(b):
    x, y, w, h = b
    return [x * IMG_W, y * IMG_H, (x + w) * IMG_W, (y + h) * IMG_H]


def dashed_rect(d, box, colour, dash=8, width=2):
    x1, y1, x2, y2 = box
    edges = [((x1, y1), (x2, y1)), ((x2, y1), (x2, y2)), ((x2, y2), (x1, y2)), ((x1, y2), (x1, y1))]
    for (ax, ay), (bx, by) in edges:
        length = max(abs(bx - ax), abs(by - ay))
        n = max(1, int(length // dash))
        for i in range(0, n, 2):
            t0, t1 = i / n, min(1.0, (i + 1) / n)
            d.line(
                [(ax + (bx - ax) * t0, ay + (by - ay) * t0), (ax + (bx - ax) * t1, ay + (by - ay) * t1)],
                fill=colour,
                width=width,
            )


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--only", nargs="*", help="chunk ids to render (default: all)")
    args = ap.parse_args()

    with open(LABELS_PATH, encoding="utf-8") as fh:
        labels = json.load(fh)["labels"]

    im = load_image()
    d = ImageDraw.Draw(im)
    f = font(22)
    for lab in labels:
        colour = ORANGE if lab["uncertain"] else GREEN
        box = denorm(lab["bbox"])
        d.rectangle(box, outline=colour, width=3)
        if lab["parts"]:
            for p in lab["parts"]:
                dashed_rect(d, denorm(p), colour)
        tx, ty = box[0], max(0, box[1] - 24)
        tw = d.textlength(lab["id"], font=f)
        d.rectangle([tx, ty, tx + tw + 4, ty + 22], fill=(255, 255, 255))
        d.text((tx + 2, ty), lab["id"], fill=colour, font=f)

    os.makedirs(QA_DIR, exist_ok=True)
    want = set(args.only) if args.only else None
    n = 0
    for cid, x0, y0, w, h in chunk_grid():
        if want and cid not in want:
            continue
        out = render_region(im, x0, y0, w, h, CHUNK_SCALE)
        out.save(os.path.join(QA_DIR, f"{cid}.png"), optimize=True)
        n += 1
    print(f"wrote {n} QA renders to {QA_DIR}")


if __name__ == "__main__":
    main()

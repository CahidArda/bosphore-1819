#!/usr/bin/env python3
"""Cut the full scan into overlapping chunks and render each one with a red
coordinate grid so a reader can give bounding boxes in full-image pixels.

    python pipeline/chunks.py                 # render all chunks + index
    python pipeline/chunks.py --zoom <id> x y w h [--scale 1.25]
                                              # zoom render of any small area

Chunks are 1500 x 1300 full-image px with a 150 px overlap, rendered at
scale 0.8 (1200 x 1040). Grid lines every 100 full-image px, with the
full-image coordinate written at each line (x along the top, y down the left).
"""
import argparse
import json
import os

from PIL import Image, ImageDraw

from common import (
    CHUNK_SCALE,
    CHUNKPNG_DIR,
    GRID_STEP,
    IMG_H,
    IMG_W,
    INDEX_PATH,
    ZOOM_DIR,
    chunk_grid,
    font,
    load_image,
)

MARGIN = 28  # room for the coordinate labels
RED = (220, 30, 30)


def render_region(im, x0, y0, w, h, scale, step=GRID_STEP):
    """Crop (x0, y0, w, h) of `im`, scale it and draw the coordinate grid."""
    x1, y1 = min(x0 + w, IMG_W), min(y0 + h, IMG_H)
    crop = im.crop((x0, y0, x1, y1))
    sw, sh = round((x1 - x0) * scale), round((y1 - y0) * scale)
    crop = crop.resize((sw, sh), Image.LANCZOS)

    out = Image.new("RGB", (sw + MARGIN, sh + MARGIN), (255, 255, 255))
    out.paste(crop, (MARGIN, MARGIN))
    d = ImageDraw.Draw(out, "RGBA")
    f = font(11)

    gx = (x0 // step + 1) * step if x0 % step else x0
    while gx <= x1:
        px = MARGIN + round((gx - x0) * scale)
        d.line([(px, MARGIN), (px, MARGIN + sh)], fill=RED + (110,), width=1)
        d.text((px + 2, 2), str(gx), fill=RED, font=f)
        gx += step
    gy = (y0 // step + 1) * step if y0 % step else y0
    while gy <= y1:
        py = MARGIN + round((gy - y0) * scale)
        d.line([(MARGIN, py), (MARGIN + sw, py)], fill=RED + (110,), width=1)
        d.text((1, py + 1), str(gy), fill=RED, font=f)
        gy += step
    return out


def render_all():
    im = load_image()
    os.makedirs(CHUNKPNG_DIR, exist_ok=True)
    index = []
    for cid, x0, y0, w, h in chunk_grid():
        out = render_region(im, x0, y0, w, h, CHUNK_SCALE)
        out.save(os.path.join(CHUNKPNG_DIR, f"{cid}.png"), optimize=True)
        index.append({"id": cid, "x0": x0, "y0": y0, "w": w, "h": h, "scale": CHUNK_SCALE})
        print(cid, out.size)
    with open(INDEX_PATH, "w") as fh:
        json.dump(index, fh, indent=1)
    print(f"{len(index)} chunks -> {INDEX_PATH}")


def render_zoom(cid, x, y, w, h, scale):
    im = load_image()
    os.makedirs(ZOOM_DIR, exist_ok=True)
    scale = max(1.0, min(1.5, scale))
    step = 50 if w <= 600 else GRID_STEP
    out = render_region(im, x, y, w, h, scale, step=step)
    path = os.path.join(ZOOM_DIR, f"{cid}_{x}_{y}_{w}x{h}.png")
    out.save(path, optimize=True)
    print(path)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--zoom", nargs=5, metavar=("ID", "X", "Y", "W", "H"))
    ap.add_argument("--scale", type=float, default=1.25)
    args = ap.parse_args()
    if args.zoom:
        cid, x, y, w, h = args.zoom
        render_zoom(cid, int(x), int(y), int(w), int(h), args.scale)
    else:
        render_all()


if __name__ == "__main__":
    main()

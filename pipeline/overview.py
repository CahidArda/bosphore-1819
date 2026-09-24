#!/usr/bin/env python3
"""Render the whole sheet at scale 0.1 with a 500 px grid. Used for the big,
spaced-out region labels that span many chunks (MER NOIRE, ASIE, EUROPE,
MER DE MARMARA, the cartouche title...).

    python pipeline/overview.py [--scale 0.1] [--step 500]
"""
import argparse
import os

from chunks import render_region
from common import IMG_H, IMG_W, OUT_DIR, load_image


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--scale", type=float, default=0.1)
    ap.add_argument("--step", type=int, default=500)
    args = ap.parse_args()
    im = load_image()
    out = render_region(im, 0, 0, IMG_W, IMG_H, args.scale, step=args.step)
    path = os.path.join(OUT_DIR, f"overview_{args.scale}.png")
    out.save(path, optimize=True)
    print(path, out.size)


if __name__ == "__main__":
    main()

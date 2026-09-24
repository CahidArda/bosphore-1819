#!/usr/bin/env python3
"""Download the full-resolution scan of the 1819 Kauffer / Barbié du Bocage map
from Wikimedia Commons into pipeline/raw/full.jpg (gitignored).

Wikimedia requires a descriptive User-Agent for scripted downloads.
"""
import os
import sys
import urllib.request

from common import FULL_URL, IMG_H, IMG_W, RAW_PATH, USER_AGENT


def main() -> None:
    if os.path.exists(RAW_PATH):
        print(f"already present: {RAW_PATH}")
    else:
        os.makedirs(os.path.dirname(RAW_PATH), exist_ok=True)
        req = urllib.request.Request(FULL_URL, headers={"User-Agent": USER_AGENT})
        print(f"downloading {FULL_URL}")
        with urllib.request.urlopen(req, timeout=120) as resp, open(RAW_PATH + ".part", "wb") as fh:
            total = 0
            while True:
                buf = resp.read(1 << 20)
                if not buf:
                    break
                fh.write(buf)
                total += len(buf)
        os.replace(RAW_PATH + ".part", RAW_PATH)
        print(f"saved {RAW_PATH} ({total / 1e6:.1f} MB)")

    from PIL import Image

    Image.MAX_IMAGE_PIXELS = None
    with Image.open(RAW_PATH) as im:
        w, h = im.size
    if (w, h) != (IMG_W, IMG_H):
        print(f"ERROR: expected {IMG_W}x{IMG_H}, got {w}x{h}", file=sys.stderr)
        sys.exit(1)
    print(f"ok: {w}x{h}")


if __name__ == "__main__":
    main()

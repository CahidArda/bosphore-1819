#!/usr/bin/env python3
"""Ask the Commons API for the exact thumbnail geometry of the Wikimedia
scan at the widths the app uses for its image pyramid (1280, 1920, 3840),
and print a JSON array that src/map/tileSource.ts embeds verbatim.
"""
import json
import urllib.parse
import urllib.request

from common import USER_AGENT

TITLE = (
    "File:Plan Topographique du Bosphore, de Thrace ou Canal de Constantinople et de ses environs "
    "- Fr. Kauffer ; J.D. Barbié du Bocage - btv1b10100957j.jpg"
)
WIDTHS = (1280, 1920, 3840)


def main() -> None:
    levels = []
    for w in WIDTHS:
        q = urllib.parse.urlencode(
            {
                "action": "query",
                "prop": "imageinfo",
                "iiprop": "url|size",
                "iiurlwidth": w,
                "format": "json",
                "titles": TITLE,
            }
        )
        req = urllib.request.Request(
            "https://commons.wikimedia.org/w/api.php?" + q, headers={"User-Agent": USER_AGENT}
        )
        with urllib.request.urlopen(req, timeout=60) as resp:
            data = json.load(resp)
        info = next(iter(data["query"]["pages"].values()))["imageinfo"][0]
        levels.append(
            {
                "url": info["thumburl"],
                "width": info["thumbwidth"],
                "height": info["thumbheight"],
            }
        )
        full = {"url": info["url"], "width": info["width"], "height": info["height"]}
    levels.append(full)
    print(json.dumps(levels, indent=2))


if __name__ == "__main__":
    main()

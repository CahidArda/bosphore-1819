"""Shared constants for the Bosphore 1819 pipeline."""
import os

HERE = os.path.dirname(os.path.abspath(__file__))
RAW_PATH = os.path.join(HERE, "raw", "full.jpg")
OUT_DIR = os.path.join(HERE, "out")
CHUNK_DIR = os.path.join(OUT_DIR, "chunks")
CHUNKPNG_DIR = os.path.join(OUT_DIR, "chunkpng")
ZOOM_DIR = os.path.join(OUT_DIR, "zoom")
QA_DIR = os.path.join(OUT_DIR, "qa")
INDEX_PATH = os.path.join(OUT_DIR, "chunks.index.json")
SCHEMA_PATH = os.path.join(HERE, "schema.json")
LABELS_PATH = os.path.join(os.path.dirname(HERE), "public", "labels.json")

IMG_W, IMG_H = 12509, 7749

COMMONS_NAME = (
    "Plan_Topographique_du_Bosphore%2C_de_Thrace_ou_Canal_de_Constantinople_et_de_ses_environs_"
    "-_Fr._Kauffer_%3B_J.D._Barbi%C3%A9_du_Bocage_-_btv1b10100957j.jpg"
)
FULL_URL = f"https://upload.wikimedia.org/wikipedia/commons/0/09/{COMMONS_NAME}"
USER_AGENT = "bosphore-1819/0.1 (github.com/CahidArda/bosphore-1819)"

# Chunk grid (BUILD.md section 3)
CHUNK_W, CHUNK_H = 1500, 1300
OVERLAP = 150
X_START, X_END = 1000, 12000
Y_START, Y_END = 700, 7100
CHUNK_SCALE = 0.8
GRID_STEP = 100


def chunk_grid():
    """Yield (id, x0, y0, w, h) for every chunk of the grid."""
    xs = list(range(X_START, X_END, CHUNK_W - OVERLAP))
    ys = list(range(Y_START, Y_END, CHUNK_H - OVERLAP))
    for y0 in ys:
        for x0 in xs:
            w = min(CHUNK_W, IMG_W - x0)
            h = min(CHUNK_H, IMG_H - y0)
            yield f"c_{x0}_{y0}", x0, y0, w, h


def load_image():
    from PIL import Image

    Image.MAX_IMAGE_PIXELS = None
    return Image.open(RAW_PATH).convert("RGB")


def font(size: int):
    from PIL import ImageFont

    for path in (
        "/System/Library/Fonts/Supplemental/Arial.ttf",
        "/System/Library/Fonts/Helvetica.ttc",
        "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
    ):
        if os.path.exists(path):
            try:
                return ImageFont.truetype(path, size)
            except OSError:
                pass
    return ImageFont.load_default()

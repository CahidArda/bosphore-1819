/**
 * The image pyramid served straight from Wikimedia Commons. Dimensions were
 * read from the Commons API (pipeline/thumbs.py); only 1280, 1920 and 3840
 * thumbnails exist for this file, the rest return 400.
 */
const NAME =
  "Plan_Topographique_du_Bosphore%2C_de_Thrace_ou_Canal_de_Constantinople_et_de_ses_environs_" +
  "-_Fr._Kauffer_%3B_J.D._Barbi%C3%A9_du_Bocage_-_btv1b10100957j.jpg";
const BASE = "https://upload.wikimedia.org/wikipedia/commons";

export const IMG_W = 12509;
export const IMG_H = 7749;
/** OpenSeadragon viewport width is 1, so y must be scaled by this. */
export const ASPECT = IMG_H / IMG_W;

export const FULL_URL = `${BASE}/0/09/${NAME}`;
export const COMMONS_PAGE =
  "https://commons.wikimedia.org/wiki/File:Plan_Topographique_du_Bosphore,_de_Thrace_ou_Canal_de_Constantinople_et_de_ses_environs_-_Fr._Kauffer_;_J.D._Barbi%C3%A9_du_Bocage_-_btv1b10100957j.jpg";

export const LEVELS = [
  { url: `${BASE}/thumb/0/09/${NAME}/1280px-${NAME}`, width: 1280, height: 793 },
  { url: `${BASE}/thumb/0/09/${NAME}/1920px-${NAME}`, width: 1920, height: 1189 },
  { url: `${BASE}/thumb/0/09/${NAME}/3840px-${NAME}`, width: 3840, height: 2379 },
  { url: FULL_URL, width: IMG_W, height: IMG_H },
];

/**
 * The scan has a dark band, up to ~100 px of the original on each side, where the
 * photograph runs past the paper. The viewer clips it at draw time (TiledImage.setClip)
 * rather than serving a cropped copy, so tiles still come straight from Wikimedia and
 * label coordinates stay relative to the full scan. 130 px clears the band and its
 * soft edge on every side; the engraved frame starts far further in.
 */
export const PAPER_INSET = { x: 130 / IMG_W, y: 130 / IMG_H };

export const TILE_SOURCE = {
  type: "legacy-image-pyramid",
  levels: LEVELS,
};

/**
 * Phones and tablets get the pyramid without the 12,509 px original: decoding a
 * 97-megapixel JPEG into a texture is what makes mobile browsers stutter and drop
 * the WebGL context (the map "disappears") while pinch-zooming. The 3,840 px level
 * still resolves every label.
 */
export function isConstrainedDevice(): boolean {
  if (typeof window === "undefined") return false;
  const coarse = window.matchMedia?.("(pointer: coarse)").matches ?? false;
  const small = Math.min(window.screen?.width ?? 1e4, window.screen?.height ?? 1e4) < 900;
  const lowMem = ((navigator as Navigator & { deviceMemory?: number }).deviceMemory ?? 8) <= 4;
  return (coarse && small) || lowMem;
}

export function tileSourceFor(constrained: boolean) {
  return { type: "legacy-image-pyramid", levels: constrained ? LEVELS.slice(0, 3) : LEVELS };
}

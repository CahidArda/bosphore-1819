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

export const TILE_SOURCE = {
  type: "legacy-image-pyramid",
  levels: LEVELS,
};

/**
 * Search normalisation: lowercase, strip Latin diacritics, fold Turkish
 * ı/İ/ş/ç/ğ/ö/ü, strip Arabic tashkeel and tatweel, unify Persian/Arabic
 * letterforms, and collapse punctuation into single spaces.
 */

const ARABIC_MARKS = /[ً-ٰٟـۖ-ۭ‌‍]/g;
const COMBINING = /[̀-ͯ]/g;
const PUNCT = /[\s\-–—'’‘.,;:()\[\]\/!?«»"]+/g;

function foldChar(c: string): string {
  switch (c) {
    case "ı":
    case "İ":
      return "i";
    case "ی":
    case "ى":
      return "ي";
    case "ک":
    case "ڭ":
      return "ك";
    case "أ":
    case "إ":
    case "آ":
      return "ا";
    case "ة":
      return "ه";
    case "ۀ":
      return "ه";
    case "ؤ":
      return "و";
    case "ئ":
      return "ي";
    case "æ":
      return "ae";
    case "œ":
      return "oe";
    case "ß":
      return "ss";
    case "ø":
      return "o";
    case "ł":
      return "l";
    default:
      return c;
  }
}

export function normalize(s: string): string {
  return normalizeWithMap(s).norm;
}

/**
 * Normalise and keep, for every character of the normalised string, the index
 * of the original character it came from, so a match in the normalised text
 * can be highlighted in the original.
 */
export function normalizeWithMap(s: string): { norm: string; map: number[] } {
  let norm = "";
  const map: number[] = [];
  let lastSpace = true; // trim leading spaces
  for (let i = 0; i < s.length; i++) {
    const ch = s[i];
    if (PUNCT.test(ch)) {
      PUNCT.lastIndex = 0;
      if (!lastSpace) {
        norm += " ";
        map.push(i);
        lastSpace = true;
      }
      continue;
    }
    PUNCT.lastIndex = 0;
    let out = foldChar(ch).normalize("NFD").replace(COMBINING, "").replace(ARABIC_MARKS, "").toLowerCase();
    out = out.replace(/ı/g, "i");
    for (const oc of out) {
      norm += oc;
      map.push(i);
      lastSpace = false;
    }
  }
  if (lastSpace && norm.endsWith(" ")) {
    norm = norm.slice(0, -1);
    map.pop();
  }
  return { norm, map };
}

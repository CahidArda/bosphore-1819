export type Lang = "fr" | "tr" | "en";

export const KINDS = [
  "village",
  "quarter",
  "city",
  "cape",
  "bay",
  "water",
  "fort",
  "palace",
  "mosque",
  "religious",
  "military",
  "ruin",
  "mountain",
  "forest",
  "road",
  "infrastructure",
  "region",
  "island",
  "other",
] as const;
export type Kind = (typeof KINDS)[number];

/** [x, y, w, h] as fractions of the full image. */
export type NBox = [number, number, number, number];

export interface Gloss2 {
  en: string;
  tr: string;
}
export interface Gloss3 {
  en: string;
  fr: string;
  tr: string;
}

export interface Label {
  id: string;
  fr: string;
  ota: { latn: string; arab: string } | null;
  modern: string;
  lit: { fr: Gloss2; ota: Gloss3 | null; modern: Gloss3 | null };
  kind: Kind;
  bbox: NBox;
  parts: NBox[] | null;
  uncertain: boolean;
  note: string | null;
  src: string;
}

export interface LabelsMeta {
  title: string;
  authors: string;
  published_in: string;
  source: string;
  source_url: string;
  license: string;
  attribution: string;
  dims: { width: number; height: number };
  count: number;
  uncertain: number;
}

export interface LabelsDoc {
  meta: LabelsMeta;
  labels: Label[];
}

export type SearchField = "fr" | "latn" | "arab" | "modern";

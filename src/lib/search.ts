import type { Label, SearchField } from "@/types";
import { normalize, normalizeWithMap } from "./normalize";

export interface Indexed {
  label: Label;
  fields: { field: SearchField; text: string; norm: string; map: number[] }[];
}

export interface Match {
  label: Label;
  /** Which field matched best, and the character range in the ORIGINAL text. */
  field: SearchField | null;
  range: [number, number] | null;
  rank: number; // 0 prefix, 1 word start, 2 anywhere
}

export function buildIndex(labels: Label[]): Indexed[] {
  return labels.map((label) => {
    const fields: Indexed["fields"] = [];
    const push = (field: SearchField, text: string | undefined) => {
      if (!text) return;
      const { norm, map } = normalizeWithMap(text);
      fields.push({ field, text, norm, map });
    };
    push("fr", label.fr);
    push("latn", label.ota?.latn);
    push("arab", label.ota?.arab);
    push("modern", label.modern);
    return { label, fields };
  });
}

/**
 * Substring search over the normalised fields. Prefix matches rank first,
 * then word starts, then anywhere. An empty query returns everything in
 * the original order with no highlight.
 */
export function search(index: Indexed[], query: string): Match[] {
  const q = normalize(query);
  if (!q) return index.map(({ label }) => ({ label, field: null, range: null, rank: 3 }));
  const out: Match[] = [];
  for (const entry of index) {
    let best: Match | null = null;
    for (const f of entry.fields) {
      const at = f.norm.indexOf(q);
      if (at < 0) continue;
      const rank = at === 0 ? 0 : f.norm[at - 1] === " " ? 1 : 2;
      if (!best || rank < best.rank) {
        const end = at + q.length;
        const range: [number, number] = [f.map[at], f.map[end - 1] + 1];
        best = { label: entry.label, field: f.field, range, rank };
        if (rank === 0) break;
      }
    }
    if (best) out.push(best);
  }
  out.sort((a, b) => a.rank - b.rank);
  return out;
}

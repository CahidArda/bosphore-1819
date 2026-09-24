import { isLang } from "@/i18n";
import type { Lang } from "@/types";

const LANG_KEY = "bosphore1819.lang";

export function readInitialLang(): Lang {
  const fromUrl = new URLSearchParams(window.location.search).get("lang");
  if (isLang(fromUrl)) return fromUrl;
  try {
    const stored = window.localStorage.getItem(LANG_KEY);
    if (isLang(stored)) return stored;
  } catch {
    /* private mode */
  }
  const nav = (navigator.language || "en").slice(0, 2).toLowerCase();
  return isLang(nav) ? nav : "en";
}

export function readInitialSelection(): string[] {
  const sel = new URLSearchParams(window.location.search).get("sel");
  return sel ? sel.split(",").filter(Boolean) : [];
}

export function writeUrl(lang: Lang, selected: string[]) {
  const params = new URLSearchParams(window.location.search);
  params.set("lang", lang);
  if (selected.length) params.set("sel", selected.join(","));
  else params.delete("sel");
  const qs = params.toString();
  const next = `${window.location.pathname}${qs ? "?" + qs : ""}${window.location.hash}`;
  if (next !== window.location.pathname + window.location.search + window.location.hash) {
    window.history.replaceState(null, "", next);
  }
  try {
    window.localStorage.setItem(LANG_KEY, lang);
  } catch {
    /* ignore */
  }
}

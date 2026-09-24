import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import type { Lang } from "@/types";
import type { Match } from "@/lib/search";
import { t } from "@/i18n";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Entry } from "./Entry";

export const ROW_H = 118;
const OVERSCAN = 6;

export function LabelList({
  matches,
  lang,
  selected,
  onToggle,
  onFlyTo,
  onHover,
  scrollToId,
}: {
  matches: Match[];
  lang: Lang;
  selected: Set<string>;
  onToggle: (id: string) => void;
  onFlyTo: (id: string) => void;
  onHover: (id: string | null) => void;
  /** Row to scroll into view; changes are acted on once. */
  scrollToId: { id: string; tick: number } | null;
}) {
  const d = t(lang);
  const viewportRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [height, setHeight] = useState(600);
  const [active, setActive] = useState<number>(-1);

  useLayoutEffect(() => {
    const el = viewportRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setHeight(el.clientHeight));
    ro.observe(el);
    setHeight(el.clientHeight);
    const onScroll = () => setScrollTop(el.scrollTop);
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      ro.disconnect();
      el.removeEventListener("scroll", onScroll);
    };
  }, []);

  // Scroll to a row requested from the map.
  useEffect(() => {
    if (!scrollToId) return;
    const idx = matches.findIndex((m) => m.label.id === scrollToId.id);
    if (idx < 0) return;
    setActive(idx);
    const el = viewportRef.current;
    if (!el) return;
    const top = idx * ROW_H;
    if (top < el.scrollTop || top + ROW_H > el.scrollTop + el.clientHeight) {
      el.scrollTo({ top: Math.max(0, top - el.clientHeight / 2 + ROW_H / 2), behavior: "smooth" });
    }
  }, [scrollToId, matches]);

  // Reset the cursor when the list changes.
  useEffect(() => {
    setActive((a) => (a >= matches.length ? -1 : a));
  }, [matches.length]);

  const ensureVisible = useCallback((idx: number) => {
    const el = viewportRef.current;
    if (!el) return;
    const top = idx * ROW_H;
    if (top < el.scrollTop) el.scrollTop = top;
    else if (top + ROW_H > el.scrollTop + el.clientHeight) el.scrollTop = top + ROW_H - el.clientHeight;
  }, []);

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (!matches.length) return;
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      const next = e.key === "ArrowDown" ? Math.min(matches.length - 1, active + 1) : Math.max(0, active - 1);
      setActive(next);
      ensureVisible(next);
      onHover(matches[next].label.id);
    } else if (e.key === " " && active >= 0) {
      e.preventDefault();
      onToggle(matches[active].label.id);
    } else if (e.key === "Enter" && active >= 0) {
      e.preventDefault();
      onFlyTo(matches[active].label.id);
    } else if (e.key === "Home") {
      e.preventDefault();
      setActive(0);
      ensureVisible(0);
    } else if (e.key === "End") {
      e.preventDefault();
      setActive(matches.length - 1);
      ensureVisible(matches.length - 1);
    }
  };

  const start = Math.max(0, Math.floor(scrollTop / ROW_H) - OVERSCAN);
  const end = Math.min(matches.length, Math.ceil((scrollTop + height) / ROW_H) + OVERSCAN);
  const rows = useMemo(() => matches.slice(start, end), [matches, start, end]);
  const activeId = active >= 0 && active < matches.length ? matches[active].label.id : null;

  return (
    <ScrollArea
      className="min-h-0 flex-1"
      viewportRef={viewportRef}
      viewportProps={{
        role: "listbox",
        "aria-label": d.labelsList,
        "aria-multiselectable": true,
        "aria-activedescendant": activeId ? `row-${activeId}` : undefined,
        tabIndex: 0,
        onKeyDown,
        "aria-describedby": "list-help",
      }}
    >
      <span id="list-help" className="sr-only">
        {d.listHelp}
      </span>
      {matches.length === 0 ? (
        <p className="text-muted-foreground p-6 text-center text-sm">{d.noResults}</p>
      ) : (
        <div style={{ height: matches.length * ROW_H, position: "relative" }}>
          {rows.map((m, i) => {
            const idx = start + i;
            const id = m.label.id;
            const isSel = selected.has(id);
            const isActive = idx === active;
            return (
              <div
                key={id}
                id={`row-${id}`}
                role="option"
                aria-selected={isSel}
                data-testid="label-row"
                data-id={id}
                className={cn(
                  "absolute inset-x-0 flex cursor-pointer items-start gap-3 border-b px-3 py-2 transition-colors",
                  "hover:bg-accent/60",
                  isSel && "bg-primary/8",
                  isActive && "ring-ring/60 ring-2 ring-inset",
                )}
                style={{ top: idx * ROW_H, height: ROW_H }}
                onMouseEnter={() => onHover(id)}
                onMouseLeave={() => onHover(null)}
                onClick={() => {
                  setActive(idx);
                  onFlyTo(id);
                }}
              >
                <Checkbox
                  className="mt-1"
                  checked={isSel}
                  aria-label={m.label.modern}
                  onCheckedChange={() => onToggle(id)}
                  onClick={(e) => e.stopPropagation()}
                />
                <div className="min-w-0 flex-1">
                  <Entry label={m.label} lang={lang} compact highlight={m.field && m.range ? { field: m.field, range: m.range } : null} />
                </div>
                <span className="mt-1 hidden shrink-0 sm:block">
                  <Badge variant="outline" size="xs" className="text-muted-foreground">
                    {d.kinds[m.label.kind]}
                  </Badge>
                </span>
              </div>
            );
          })}
        </div>
      )}
    </ScrollArea>
  );
}

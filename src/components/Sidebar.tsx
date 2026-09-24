import { useMemo } from "react";
import { SearchIcon, XIcon } from "lucide-react";
import type { Kind, Lang } from "@/types";
import { KINDS } from "@/types";
import type { Match } from "@/lib/search";
import { t } from "@/i18n";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { LabelList } from "./LabelList";

export interface SidebarProps {
  lang: Lang;
  total: number;
  matches: Match[];
  query: string;
  onQuery: (q: string) => void;
  kinds: Set<Kind>;
  presentKinds: Kind[];
  onToggleKind: (k: Kind) => void;
  uncertainOnly: boolean;
  onUncertainOnly: (v: boolean) => void;
  selected: Set<string>;
  selectedOrder: string[];
  onToggle: (id: string) => void;
  onClearSelection: () => void;
  onShowSelected: () => void;
  onFlyTo: (id: string) => void;
  onHover: (id: string | null) => void;
  scrollToId: { id: string; tick: number } | null;
}

export function Sidebar(p: SidebarProps) {
  const d = t(p.lang);
  const kindList = useMemo(() => KINDS.filter((k) => p.presentKinds.includes(k)), [p.presentKinds]);

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="space-y-2 p-3">
        <div className="relative">
          <SearchIcon className="text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2" />
          <Input
            type="search"
            value={p.query}
            onChange={(e) => p.onQuery(e.target.value)}
            placeholder={d.search}
            aria-label={d.search}
            className="pl-8"
            autoComplete="off"
            spellCheck={false}
          />
        </div>
        <div className="flex flex-wrap gap-1" role="group" aria-label={d.allKinds}>
          {kindList.map((k) => {
            const on = p.kinds.has(k);
            return (
              <Badge
                key={k}
                asChild
                variant={on ? "default" : "outline"}
                className={cn("cursor-pointer select-none", !on && "text-muted-foreground hover:bg-accent")}
              >
                <button type="button" aria-pressed={on} onClick={() => p.onToggleKind(k)}>
                  {d.kinds[k]}
                </button>
              </Badge>
            );
          })}
          <Badge asChild variant={p.uncertainOnly ? "warning" : "outline"} className={cn("cursor-pointer select-none", !p.uncertainOnly && "text-muted-foreground")}>
            <button type="button" aria-pressed={p.uncertainOnly} onClick={() => p.onUncertainOnly(!p.uncertainOnly)}>
              ? {d.uncertainOnly}
            </button>
          </Badge>
        </div>
        <p className="text-muted-foreground text-xs" aria-live="polite">
          {d.results(p.matches.length, p.total)}
        </p>
      </div>
      <Separator />
      {p.selected.size > 0 && (
        <div className="bg-primary/8 flex items-center gap-2 border-b px-3 py-1.5 text-sm" data-testid="selection-toolbar">
          <span className="font-medium">{d.selected(p.selected.size)}</span>
          <span className="text-muted-foreground">·</span>
          <Button variant="link" size="inline" onClick={p.onShowSelected}>
            {d.showOnMap}
          </Button>
          <span className="text-muted-foreground">·</span>
          <Button variant="link" size="inline" onClick={p.onClearSelection}>
            <XIcon className="size-3" />
            {d.clear}
          </Button>
        </div>
      )}
      <LabelList
        matches={p.matches}
        lang={p.lang}
        selected={p.selected}
        onToggle={p.onToggle}
        onFlyTo={p.onFlyTo}
        onHover={p.onHover}
        scrollToId={p.scrollToId}
      />
    </div>
  );
}

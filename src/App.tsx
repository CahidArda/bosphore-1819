import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ListIcon } from "lucide-react";
import type { Kind, LabelsDoc, Lang } from "@/types";
import { t } from "@/i18n";
import { buildIndex, search } from "@/lib/search";
import { readInitialLang, readInitialSelection, writeUrl } from "@/lib/url";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Header } from "@/components/Header";
import { Sidebar } from "@/components/Sidebar";
import { MapView, type MapHandle } from "@/components/MapView";
import { MapControls } from "@/components/MapControls";

const AboutDialog = lazy(() => import("@/components/AboutDialog"));

export default function App() {
  const [lang, setLang] = useState<Lang>(readInitialLang);
  const [doc, setDoc] = useState<LabelsDoc | null>(null);
  const [error, setError] = useState(false);
  const [query, setQuery] = useState("");
  const [kinds, setKinds] = useState<Set<Kind>>(() => new Set());
  const [uncertainOnly, setUncertainOnly] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<string[]>(readInitialSelection);
  const [scrollTo, setScrollTo] = useState<{ id: string; tick: number } | null>(null);
  const [aboutOpen, setAboutOpen] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const mapRef = useRef<MapHandle>(null);
  const d = t(lang);

  // labels.json is fetched in parallel with the viewer init.
  useEffect(() => {
    const ctrl = new AbortController();
    fetch("/labels.json", { signal: ctrl.signal })
      .then((r) => {
        if (!r.ok) throw new Error(String(r.status));
        return r.json() as Promise<LabelsDoc>;
      })
      .then((data) => {
        setDoc(data);
        const ids = new Set(data.labels.map((l) => l.id));
        setSelectedOrder((sel) => sel.filter((id) => ids.has(id)));
      })
      .catch((e) => {
        if (e?.name !== "AbortError") setError(true);
      });
    return () => ctrl.abort();
  }, []);

  useEffect(() => {
    document.documentElement.lang = lang;
    document.title = `${d.appName} · ${d.tagline}`;
  }, [lang, d]);

  useEffect(() => {
    writeUrl(lang, selectedOrder);
  }, [lang, selectedOrder]);

  useEffect(() => {
    const onFs = () => setFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", onFs);
    return () => document.removeEventListener("fullscreenchange", onFs);
  }, []);

  const labels = useMemo(() => doc?.labels ?? [], [doc]);
  const index = useMemo(() => buildIndex(labels), [labels]);
  const presentKinds = useMemo(() => Array.from(new Set(labels.map((l) => l.kind))), [labels]);
  const matches = useMemo(() => {
    let ms = search(index, query);
    if (kinds.size) ms = ms.filter((m) => kinds.has(m.label.kind));
    if (uncertainOnly) ms = ms.filter((m) => m.label.uncertain);
    return ms;
  }, [index, query, kinds, uncertainOnly]);
  const selected = useMemo(() => new Set(selectedOrder), [selectedOrder]);
  // Labels matching a non-empty search are outlined on the map.
  const matchIds = useMemo(() => (query.trim() ? new Set(matches.map((m) => m.label.id)) : new Set<string>()), [matches, query]);

  const toggle = useCallback((id: string) => {
    setSelectedOrder((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }, []);

  // A click on a map box toggles it and scrolls the list to it (clearing filters if they hide it).
  const onMapToggle = useCallback(
    (id: string) => {
      toggle(id);
      const visible = matches.some((m) => m.label.id === id);
      if (!visible) {
        setQuery("");
        setKinds(new Set());
        setUncertainOnly(false);
      }
      setScrollTo((s) => ({ id, tick: (s?.tick ?? 0) + 1 }));
    },
    [toggle, matches],
  );

  const flyTo = useCallback((id: string) => {
    mapRef.current?.flyTo(id);
    setSheetOpen(false);
  }, []);

  const showSelected = useCallback(() => {
    mapRef.current?.fitTo(selectedOrder);
    setSheetOpen(false);
  }, [selectedOrder]);

  const hover = useCallback((id: string | null) => mapRef.current?.hover(id), []);

  const toggleKind = useCallback((k: Kind) => {
    setKinds((prev) => {
      const next = new Set(prev);
      if (next.has(k)) next.delete(k);
      else next.add(k);
      return next;
    });
  }, []);

  const toggleFullscreen = useCallback(() => {
    if (document.fullscreenElement) void document.exitFullscreen();
    else void document.documentElement.requestFullscreen?.();
  }, []);

  const sidebarProps = {
    lang,
    total: labels.length,
    matches,
    query,
    onQuery: setQuery,
    kinds,
    presentKinds,
    onToggleKind: toggleKind,
    uncertainOnly,
    onUncertainOnly: setUncertainOnly,
    selected,
    selectedOrder,
    onToggle: toggle,
    onClearSelection: () => setSelectedOrder([]),
    onShowSelected: showSelected,
    onFlyTo: flyTo,
    onHover: hover,
    scrollToId: scrollTo,
  };

  return (
    <TooltipProvider>
      <div className="flex h-full flex-col">
        <Header lang={lang} onLang={setLang} onAbout={() => setAboutOpen(true)} />
        <div className="flex min-h-0 flex-1">
          <aside className="bg-card/40 hidden w-[360px] shrink-0 border-r md:flex md:flex-col" data-testid="sidebar">
            {error ? <p className="text-destructive p-4 text-sm">{d.loadFailed}</p> : <Sidebar {...sidebarProps} />}
          </aside>
          <main className="relative min-w-0 flex-1">
            <MapView ref={mapRef} labels={labels} selected={selected} highlighted={matchIds} lang={lang} onToggle={onMapToggle} />
            <MapControls
              lang={lang}
              fullscreen={fullscreen}
              onZoomIn={() => mapRef.current?.zoomIn()}
              onZoomOut={() => mapRef.current?.zoomOut()}
              onHome={() => mapRef.current?.home()}
              onFullscreen={toggleFullscreen}
            />
            <Button
              variant="outline"
              size="sm"
              className="absolute bottom-8 left-3 z-10 md:hidden"
              onClick={() => setSheetOpen(true)}
              aria-label={d.openList}
              data-testid="open-list"
            >
              <ListIcon />
              {selectedOrder.length > 0 ? d.selected(selectedOrder.length) : d.labelsList}
            </Button>
            <footer className="bg-card/70 text-muted-foreground pointer-events-none absolute inset-x-0 bottom-0 z-10 truncate px-2 py-0.5 text-[10px] backdrop-blur-sm">
              {d.credit}
            </footer>
          </main>
        </div>

        <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
          <SheetContent side="left" className="gap-0 p-0" closeLabel={d.close}>
            <SheetHeader className="sr-only">
              <SheetTitle>{d.labelsList}</SheetTitle>
              <SheetDescription>{d.listHelp}</SheetDescription>
            </SheetHeader>
            <div className="h-full min-h-0 pt-8">{error ? <p className="text-destructive p-4 text-sm">{d.loadFailed}</p> : <Sidebar {...sidebarProps} />}</div>
          </SheetContent>
        </Sheet>

        {aboutOpen && (
          <Suspense fallback={null}>
            <AboutDialog open={aboutOpen} onOpenChange={setAboutOpen} lang={lang} meta={doc?.meta ?? null} />
          </Suspense>
        )}
      </div>
    </TooltipProvider>
  );
}

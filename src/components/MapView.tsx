import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from "react";
import OpenSeadragon from "openseadragon";
import type { Label, Lang, NBox } from "@/types";
import { ASPECT, isConstrainedDevice, tileSourceFor } from "@/map/pyramid";
import { t } from "@/i18n";
import { cn } from "@/lib/utils";
import { HoverCard } from "./HoverCard";

export interface MapHandle {
  flyTo(id: string): void;
  fitTo(ids: string[]): void;
  hover(id: string | null): void;
  zoomIn(): void;
  zoomOut(): void;
  home(): void;
}

interface Hit {
  id: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  area: number;
}

function unionRect(boxes: NBox[]) {
  let x1 = 1,
    y1 = 1,
    x2 = 0,
    y2 = 0;
  for (const [x, y, w, h] of boxes) {
    x1 = Math.min(x1, x);
    y1 = Math.min(y1, y);
    x2 = Math.max(x2, x + w);
    y2 = Math.max(y2, y + h);
  }
  return new OpenSeadragon.Rect(x1, y1 * ASPECT, x2 - x1, (y2 - y1) * ASPECT);
}

function padded(r: OpenSeadragon.Rect, factor: number, minW: number) {
  let w = Math.max(r.width * factor, minW);
  let h = Math.max(r.height * factor, minW * ASPECT);
  // keep the padded rect roughly proportional so tiny labels don't zoom to a sliver
  if (w / h > 3) h = w / 3;
  if (h / w > 3) w = h / 3;
  const cx = r.x + r.width / 2;
  const cy = r.y + r.height / 2;
  return new OpenSeadragon.Rect(cx - w / 2, cy - h / 2, w, h);
}

export const MapView = forwardRef<
  MapHandle,
  {
    labels: Label[];
    selected: Set<string>;
    /** Ids matching the current search; drawn with a subtle gray outline. */
    highlighted: Set<string>;
    /** Outline every label (the layers toggle). */
    outlineAll: boolean;
    lang: Lang;
    onToggle: (id: string) => void;
    className?: string;
  }
>(function MapView({ labels, selected, highlighted, outlineAll, lang, onToggle, className }, ref) {
  const d = t(lang);
  const elRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<OpenSeadragon.Viewer | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const elsById = useRef<Map<string, HTMLElement[]>>(new Map());
  const hits = useRef<Hit[]>([]);
  const byId = useRef<Map<string, Label>>(new Map());
  const hoveredRef = useRef<string | null>(null);
  /** On touch screens the card stays open on the tapped label until the map is tapped elsewhere. */
  const pinnedRef = useRef<string | null>(null);
  const touchUI = typeof window !== "undefined" && (window.matchMedia?.("(hover: none)").matches ?? false);
  const prevSelected = useRef<Set<string>>(new Set());
  const prevHighlighted = useRef<Set<string>>(new Set());
  const rootRef = useRef<HTMLDivElement | null>(null);
  const onToggleRef = useRef(onToggle);
  onToggleRef.current = onToggle;

  const [loaded, setLoaded] = useState(false);
  const [opened, setOpened] = useState(false);
  const [hoverLabel, setHoverLabel] = useState<Label | null>(null);

  // ------------------------------------------------------------ viewer init
  useEffect(() => {
    const el = elRef.current;
    if (!el) return;
    const viewer = OpenSeadragon({
      element: el,
      tileSources: tileSourceFor(isConstrainedDevice()) as unknown as OpenSeadragon.TileSourceOptions,
      prefixUrl: "",
      showNavigationControl: false,
      crossOriginPolicy: "Anonymous",
      gestureSettingsMouse: { clickToZoom: false, dblClickToZoom: true },
      gestureSettingsTouch: { clickToZoom: false, dblClickToZoom: true },
      maxZoomPixelRatio: 2.5,
      minZoomImageRatio: 0.7,
      // The Wikimedia levels are not power-of-two steps (1280, 1920, 3840, 12509), which
      // confuses OpenSeadragon's level picker: with the default 0.5 it stretched the 3840 px
      // thumbnail at label zoom and used the soft 1280 px one at home. 0.3 makes it draw the
      // original when zoomed in, the 3840 level at moderate zoom and the 1920 level at home.
      minPixelRatio: 0.3,
      visibilityRatio: 0.8,
      constrainDuringPan: true,
      animationTime: 0.6,
      springStiffness: 7,
      zoomPerScroll: 1.25,
      immediateRender: true,
      preserveViewport: false,
      showZoomControl: false,
      showHomeControl: false,
      showFullPageControl: false,
    });
    viewerRef.current = viewer;
    // `?debug` exposes the viewer for inspection (which pyramid level is drawn, zoom, etc.).
    if (new URLSearchParams(window.location.search).has("debug")) {
      (window as unknown as { __osd?: OpenSeadragon.Viewer }).__osd = viewer;
    }
    const onTile = () => {
      setLoaded(true);
      viewer.removeHandler("tile-loaded", onTile);
    };
    viewer.addHandler("tile-loaded", onTile);
    viewer.addHandler("open", () => setOpened(true));
    viewer.addHandler("open-failed", () => setLoaded(true));

    // Clicks (and taps) hit-test against the label boxes. Desktop: a click toggles the
    // selection. Touch screens have no hover, so a tap on a label pins its card and a
    // tap anywhere else on the map closes it.
    viewer.addHandler("canvas-click", (ev) => {
      if (!ev.quick) return;
      const id = hitTest(viewer, hits.current, ev.position.x, ev.position.y);
      if (touchUI) {
        if (!id) {
          pinnedRef.current = null;
          setHover(null);
          setHoverLabel(null);
          return;
        }
        pinnedRef.current = id;
        setHover(id);
        setHoverLabel(byId.current.get(id) ?? null);
        placeCard(ev.position.x, ev.position.y);
        return;
      }
      if (id) onToggleRef.current(id);
    });

    const container = viewer.container;
    const onMove = (e: PointerEvent) => {
      if (touchUI || e.pointerType === "touch") return;
      const rect = container.getBoundingClientRect();
      const px = e.clientX - rect.left;
      const py = e.clientY - rect.top;
      const id = hitTest(viewer, hits.current, px, py);
      if (id !== hoveredRef.current) {
        setHover(id);
        setHoverLabel(id ? (byId.current.get(id) ?? null) : null);
      }
      if (id) placeCard(px, py);
    };
    const onLeave = () => {
      if (pinnedRef.current) return;
      setHover(null);
      setHoverLabel(null);
    };
    container.addEventListener("pointermove", onMove);
    container.addEventListener("pointerleave", onLeave);

    return () => {
      container.removeEventListener("pointermove", onMove);
      container.removeEventListener("pointerleave", onLeave);
      viewer.destroy();
      viewerRef.current = null;
      elsById.current.clear();
      hits.current = [];
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ------------------------------------------------------------ helpers
  const setHover = useCallback((id: string | null) => {
    const prev = hoveredRef.current;
    if (prev === id) return;
    if (prev) elsById.current.get(prev)?.forEach((e) => e.classList.remove("is-hover"));
    if (id) elsById.current.get(id)?.forEach((e) => e.classList.add("is-hover"));
    hoveredRef.current = id;
  }, []);

  const placeCard = useCallback((px: number, py: number) => {
    const card = cardRef.current;
    const el = elRef.current;
    if (!card || !el) return;
    const cw = card.offsetWidth || 288;
    const ch = card.offsetHeight || 160;
    const W = el.clientWidth;
    const H = el.clientHeight;
    let x = px + 18;
    let y = py + 18;
    if (x + cw > W - 8) x = Math.max(8, px - 18 - cw);
    if (y + ch > H - 8) y = Math.max(8, py - 18 - ch);
    card.style.transform = `translate(${Math.round(x)}px, ${Math.round(y)}px)`;
  }, []);

  // ------------------------------------------------------------ overlays
  useEffect(() => {
    const viewer = viewerRef.current;
    if (!viewer || !opened) return;
    viewer.clearOverlays();
    elsById.current.clear();
    byId.current = new Map(labels.map((l) => [l.id, l]));
    const list: Hit[] = [];
    // One overlay covering the whole image; every label box is a child positioned in
    // percentages. OpenSeadragon then updates a single element per frame instead of
    // several hundred, which keeps panning and pinch-zoom smooth on phones.
    const root = document.createElement("div");
    root.className = outlineAll ? "lbl-root show-all" : "lbl-root";
    rootRef.current = root;
    const frag = document.createDocumentFragment();
    for (const label of labels) {
      const boxes = label.parts && label.parts.length ? label.parts : [label.bbox];
      const els: HTMLElement[] = [];
      boxes.forEach((b, i) => {
        const div = document.createElement("div");
        div.className = "lbl";
        div.dataset.id = label.id;
        div.setAttribute("role", "img");
        div.setAttribute("aria-label", `${label.fr} · ${label.modern}`);
        if (i > 0) div.setAttribute("aria-hidden", "true");
        div.style.left = `${b[0] * 100}%`;
        div.style.top = `${b[1] * 100}%`;
        div.style.width = `${b[2] * 100}%`;
        div.style.height = `${b[3] * 100}%`;
        frag.appendChild(div);
        els.push(div);
        list.push({ id: label.id, x1: b[0], y1: b[1], x2: b[0] + b[2], y2: b[1] + b[3], area: b[2] * b[3] });
      });
      elsById.current.set(label.id, els);
    }
    root.appendChild(frag);
    viewer.addOverlay({ element: root, location: new OpenSeadragon.Rect(0, 0, 1, ASPECT) });
    list.sort((a, b) => a.area - b.area);
    hits.current = list;
    prevSelected.current = new Set();
    for (const id of selected) elsById.current.get(id)?.forEach((e) => e.classList.add("is-sel"));
    prevSelected.current = new Set(selected);
    prevHighlighted.current = new Set();
    for (const id of highlighted) elsById.current.get(id)?.forEach((e) => e.classList.add("is-match"));
    prevHighlighted.current = new Set(highlighted);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [labels, opened]);

  useEffect(() => {
    rootRef.current?.classList.toggle("show-all", outlineAll);
  }, [outlineAll]);

  useEffect(() => {
    for (const id of prevHighlighted.current) {
      if (!highlighted.has(id)) elsById.current.get(id)?.forEach((e) => e.classList.remove("is-match"));
    }
    for (const id of highlighted) {
      if (!prevHighlighted.current.has(id)) elsById.current.get(id)?.forEach((e) => e.classList.add("is-match"));
    }
    prevHighlighted.current = new Set(highlighted);
  }, [highlighted]);

  useEffect(() => {
    for (const id of prevSelected.current) {
      if (!selected.has(id)) elsById.current.get(id)?.forEach((e) => e.classList.remove("is-sel"));
    }
    for (const id of selected) {
      if (!prevSelected.current.has(id)) elsById.current.get(id)?.forEach((e) => e.classList.add("is-sel"));
    }
    prevSelected.current = new Set(selected);
  }, [selected]);

  // ------------------------------------------------------------ handle
  useImperativeHandle(
    ref,
    () => ({
      flyTo(id) {
        const viewer = viewerRef.current;
        const label = byId.current.get(id);
        if (!viewer || !label) return;
        const r = unionRect(label.parts?.length ? label.parts : [label.bbox]);
        // Zoom to the label's neighbourhood rather than the label itself:
        // at least ~14 % of the sheet's width stays in view.
        viewer.viewport.fitBounds(padded(r, 3, 0.14), false);
      },
      fitTo(ids) {
        const viewer = viewerRef.current;
        if (!viewer) return;
        const boxes: NBox[] = [];
        for (const id of ids) {
          const l = byId.current.get(id);
          if (l) boxes.push(l.bbox);
        }
        if (!boxes.length) return;
        // Keep the surroundings in view: at least a fifth of the sheet's width, so the
        // 3,840 px level still looks sharp while the full-resolution tile is loading.
        viewer.viewport.fitBounds(padded(unionRect(boxes), 2.2, 0.2), false);
      },
      hover(id) {
        setHover(id);
      },
      zoomIn() {
        viewerRef.current?.viewport.zoomBy(1.5);
      },
      zoomOut() {
        viewerRef.current?.viewport.zoomBy(1 / 1.5);
      },
      home() {
        viewerRef.current?.viewport.goHome();
      },
    }),
    [setHover],
  );

  return (
    <div className={cn("relative h-full w-full overflow-hidden", className)}>
      <div ref={elRef} className="absolute inset-0" data-testid="map" aria-label={d.appName} />
      <HoverCard ref={cardRef} label={hoverLabel} lang={lang} interactive={touchUI} />
      <div
        aria-hidden={loaded}
        className={cn(
          "bg-background pointer-events-none absolute inset-0 z-10 flex items-center justify-center transition-opacity duration-500",
          loaded ? "opacity-0" : "opacity-100",
        )}
        data-testid="map-skeleton"
      >
        <div className="bg-muted absolute inset-4 animate-pulse rounded-lg" />
        <p className="text-muted-foreground relative text-sm">{d.loading}</p>
      </div>
    </div>
  );
});

function hitTest(viewer: OpenSeadragon.Viewer, hits: Hit[], px: number, py: number): string | null {
  const vp = viewer.viewport.pointFromPixel(new OpenSeadragon.Point(px, py), true);
  const tol = viewer.viewport.deltaPointsFromPixels(new OpenSeadragon.Point(3, 3), true);
  const x = vp.x;
  const y = vp.y / ASPECT;
  const tx = tol.x;
  const ty = tol.y / ASPECT;
  for (const h of hits) {
    if (x >= h.x1 - tx && x <= h.x2 + tx && y >= h.y1 - ty && y <= h.y2 + ty) return h.id;
  }
  return null;
}

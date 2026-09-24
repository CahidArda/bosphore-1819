import { forwardRef } from "react";
import type { Label, Lang } from "@/types";
import { t } from "@/i18n";
import { Badge } from "@/components/ui/badge";
import { Entry } from "./Entry";

/**
 * One shared card, absolutely positioned inside the map container. The map
 * moves it imperatively (style.transform) so hovering never re-renders React.
 */
export const HoverCard = forwardRef<HTMLDivElement, { label: Label | null; lang: Lang }>(function HoverCard({ label, lang }, ref) {
  const d = t(lang);
  return (
    <div
      ref={ref}
      data-testid="hover-card"
      role="status"
      aria-live="polite"
      className="bg-card text-card-foreground pointer-events-none absolute top-0 left-0 z-20 w-72 rounded-lg border p-3 shadow-lg transition-opacity duration-100"
      style={{ opacity: label ? 1 : 0, visibility: label ? "visible" : "hidden" }}
    >
      {label && (
        <>
          <div className="mb-2 flex items-center gap-1.5">
            <Badge variant="secondary" size="xs">
              {d.kinds[label.kind]}
            </Badge>
          </div>
          <Entry label={label} lang={lang} showNote />
        </>
      )}
    </div>
  );
});

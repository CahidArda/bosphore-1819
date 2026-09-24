import { memo } from "react";
import type { Label, Lang, SearchField } from "@/types";
import { glosses, t } from "@/i18n";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

export interface Highlight {
  field: SearchField;
  range: [number, number];
}

function Marked({ text, range }: { text: string; range?: [number, number] | null }) {
  if (!range) return <>{text}</>;
  const [a, b] = range;
  return (
    <>
      {text.slice(0, a)}
      <mark>{text.slice(a, b)}</mark>
      {text.slice(b)}
    </>
  );
}

/**
 * The three-row entry: French original, Ottoman (Latin + Arabic), modern name,
 * each with its literal gloss for the current language underneath.
 */
export const Entry = memo(function Entry({
  label,
  lang,
  compact = false,
  highlight,
  showNote = false,
}: {
  label: Label;
  lang: Lang;
  compact?: boolean;
  highlight?: Highlight | null;
  showNote?: boolean;
}) {
  const d = t(lang);
  const [g1, g2, g3] = glosses(label, lang);
  const hl = (field: SearchField) => (highlight?.field === field ? highlight.range : null);
  const nameCls = cn("truncate leading-5", compact ? "text-[15px]" : "text-base");
  const glossCls = cn("text-muted-foreground truncate text-xs leading-4", !compact && "whitespace-normal");

  return (
    <div className={cn("min-w-0", compact ? "space-y-0.5" : "space-y-1.5")}>
      <div className="min-w-0">
        <div className={cn(nameCls, "font-map")} lang="fr" title={compact ? label.fr : undefined}>
          <span className="sr-only">{d.rowFrench}: </span>
          <Marked text={label.fr} range={hl("fr")} />
          {label.uncertain && (
            <Badge variant="warning" size="xs" className="ml-1.5 align-middle" title={d.uncertain} aria-label={d.uncertain}>
              ?
            </Badge>
          )}
        </div>
        {g1 && (
          <div className={glossCls} data-testid="gloss-fr">
            {g1}
          </div>
        )}
      </div>

      <div className="min-w-0">
        <div className={cn(nameCls, "flex items-baseline gap-2")}>
          <span className="sr-only">{d.rowOttoman}: </span>
          {label.ota ? (
            <>
              <span className="truncate" lang="tr">
                <Marked text={label.ota.latn} range={hl("latn")} />
              </span>
              <span dir="rtl" lang="ota" className="font-naskh text-muted-foreground shrink-0 text-[15px] leading-5">
                <Marked text={label.ota.arab} range={hl("arab")} />
              </span>
            </>
          ) : (
            <span className="text-muted-foreground" aria-label={d.noOttoman}>
              —
            </span>
          )}
        </div>
        {g2 && (
          <div className={glossCls} data-testid="gloss-ota">
            {g2}
          </div>
        )}
      </div>

      <div className="min-w-0">
        <div className={cn(nameCls, "font-medium")} lang="tr">
          <span className="sr-only">{d.rowModern}: </span>
          <Marked text={label.modern} range={hl("modern")} />
        </div>
        {g3 && (
          <div className={glossCls} data-testid="gloss-modern">
            {g3}
          </div>
        )}
      </div>

      {showNote && label.note && <p className="text-muted-foreground border-t pt-1.5 text-xs leading-4 italic">{label.note}</p>}
    </div>
  );
});

import { memo, type ReactNode } from "react";
import type { Label, Lang, SearchField } from "@/types";
import { glosses, localizeModern, noteFor, t } from "@/i18n";
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
 * The three-part entry. Every part has the same shape so the eye can scan
 * them: a small role tag in the left column, then the name on its own line,
 * then any secondary lines (Arabic script, literal gloss) underneath.
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
  const nameCls = cn("min-w-0 leading-5", compact ? "truncate text-[15px]" : "text-base");
  const subCls = cn("text-muted-foreground min-w-0 text-xs leading-4", compact && "truncate");

  return (
    <div className={cn("grid min-w-0 grid-cols-[2.6rem_minmax(0,1fr)] gap-x-2", compact ? "gap-y-1" : "gap-y-2")}>
      <Part tag={d.roleFr} title={d.rowFrench}>
        <div className={cn(nameCls, "font-map")} lang="fr">
          <Marked text={label.fr} range={hl("fr")} />
          {label.uncertain && (
            <Badge variant="warning" size="xs" className="ml-1.5 align-middle" title={d.uncertain} aria-label={d.uncertain}>
              ?
            </Badge>
          )}
        </div>
        {g1 && (
          <div className={subCls} data-testid="gloss-fr">
            {g1}
          </div>
        )}
      </Part>

      <Part tag={d.roleOta} title={d.rowOttoman}>
        {label.ota ? (
          <>
            <div className={nameCls} lang="tr">
              <Marked text={label.ota.latn} range={hl("latn")} />
            </div>
            <div dir="rtl" lang="ota" className={cn(subCls, "font-naskh text-left text-[15px] leading-5")}>
              <Marked text={label.ota.arab} range={hl("arab")} />
            </div>
          </>
        ) : (
          <div className={cn(nameCls, "text-muted-foreground italic")}>{d.noOttoman}</div>
        )}
        {g2 && (
          <div className={subCls} data-testid="gloss-ota">
            {g2}
          </div>
        )}
      </Part>

      <Part tag={d.roleModern} title={d.rowModern}>
        <div className={cn(nameCls, "font-medium")} lang="tr">
          <Marked text={localizeModern(label.modern, lang)} range={hl("modern")} />
        </div>
        {g3 && (
          <div className={subCls} data-testid="gloss-modern">
            {g3}
          </div>
        )}
      </Part>

      {showNote && noteFor(label, lang) && (
        <p className="text-muted-foreground col-span-2 border-t pt-1.5 text-xs leading-4 italic">{noteFor(label, lang)}</p>
      )}
    </div>
  );
});

function Part({ tag, title, children }: { tag: string; title: string; children: ReactNode }) {
  return (
    <>
      <span
        className="text-muted-foreground/80 mt-[3px] font-mono text-[10px] leading-4 tracking-wider uppercase select-none"
        title={title}
        aria-label={title}
      >
        {tag}
      </span>
      <div className="min-w-0">{children}</div>
    </>
  );
}

import type { Lang, LabelsMeta } from "@/types";
import { t } from "@/i18n";
import { COMMONS_PAGE } from "@/map/pyramid";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export const REPO_URL = "https://github.com/CahidArda/bosphore-1819";

export default function AboutDialog({
  open,
  onOpenChange,
  lang,
  meta,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  lang: Lang;
  meta: LabelsMeta | null;
}) {
  const d = t(lang);
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent closeLabel={d.close} className="max-h-[85vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="font-map text-xl">{d.aboutTitle}</DialogTitle>
          <DialogDescription className="font-map italic">
            Plan Topographique du Bosphore de Thrace ou Canal de Constantinople et de ses environs · Fr. Kauffer ; J.-D. Barbié du Bocage, 1819
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3 text-sm leading-6">
          {d.aboutBody.map((p, i) => (
            <p key={i}>{p}</p>
          ))}
          {meta && (
            <p className="text-muted-foreground text-xs">
              {meta.count} labels · {meta.uncertain} uncertain · {meta.dims.width} × {meta.dims.height} px
            </p>
          )}
          <ul className="list-disc space-y-1 pl-5">
            <li>
              <a className="text-primary underline underline-offset-4" href={COMMONS_PAGE} target="_blank" rel="noreferrer">
                {d.sourceLink}
              </a>
            </li>
            <li>
              <a className="text-primary underline underline-offset-4" href={REPO_URL} target="_blank" rel="noreferrer">
                {d.dataLink}
              </a>
            </li>
          </ul>
          <p className="text-muted-foreground text-xs">{d.credit}</p>
        </div>
      </DialogContent>
    </Dialog>
  );
}

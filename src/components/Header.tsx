import { InfoIcon } from "lucide-react";
import type { Lang } from "@/types";
import { LANGS, t } from "@/i18n";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Button } from "@/components/ui/button";

export function Header({ lang, onLang, onAbout }: { lang: Lang; onLang: (l: Lang) => void; onAbout: () => void }) {
  const d = t(lang);
  return (
    <header className="bg-card/80 flex h-12 shrink-0 items-center gap-3 border-b px-3 backdrop-blur">
      <h1 className="font-map min-w-0 truncate text-lg font-semibold tracking-tight">
        {d.appName}
        <span className="text-muted-foreground ml-2 hidden text-xs font-normal lg:inline">{d.tagline}</span>
      </h1>
      <div className="ml-auto flex items-center gap-1">
        <ToggleGroup
          type="single"
          value={lang}
          onValueChange={(v) => v && onLang(v as Lang)}
          variant="outline"
          size="xs"
          aria-label={d.language}
          data-testid="lang-toggle"
        >
          {LANGS.map((l) => (
            <ToggleGroupItem key={l} value={l} aria-label={l.toUpperCase()} className="font-mono uppercase">
              {l}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
        <Button variant="ghost" size="sm" onClick={onAbout} className="text-muted-foreground" data-testid="about-link">
          <InfoIcon />
          <span className="hidden sm:inline">{d.about}</span>
        </Button>
      </div>
    </header>
  );
}

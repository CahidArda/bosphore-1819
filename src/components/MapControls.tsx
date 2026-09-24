import { HomeIcon, MaximizeIcon, MinimizeIcon, MinusIcon, PlusIcon } from "lucide-react";
import type { Lang } from "@/types";
import { t } from "@/i18n";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

export function MapControls({
  lang,
  fullscreen,
  onZoomIn,
  onZoomOut,
  onHome,
  onFullscreen,
}: {
  lang: Lang;
  fullscreen: boolean;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onHome: () => void;
  onFullscreen: () => void;
}) {
  const d = t(lang);
  const items = [
    { label: d.zoomIn, icon: <PlusIcon />, onClick: onZoomIn, id: "zoom-in" },
    { label: d.zoomOut, icon: <MinusIcon />, onClick: onZoomOut, id: "zoom-out" },
    { label: d.home, icon: <HomeIcon />, onClick: onHome, id: "home" },
    {
      label: fullscreen ? d.exitFullscreen : d.fullscreen,
      icon: fullscreen ? <MinimizeIcon /> : <MaximizeIcon />,
      onClick: onFullscreen,
      id: "fullscreen",
    },
  ];
  return (
    <div className="absolute top-3 right-3 z-10 flex flex-col gap-1" role="toolbar" aria-label="Map">
      {items.map((it) => (
        <Tooltip key={it.id}>
          <TooltipTrigger asChild>
            <Button variant="outline" size="icon-sm" aria-label={it.label} onClick={it.onClick} data-testid={`map-${it.id}`}>
              {it.icon}
            </Button>
          </TooltipTrigger>
          <TooltipContent side="left">{it.label}</TooltipContent>
        </Tooltip>
      ))}
    </div>
  );
}

import { clsx, type ClassValue } from "clsx";

/**
 * Class joiner. tailwind-merge is deliberately not used (it costs ~9 KB
 * gzipped); components avoid conflicting utilities instead, and Tailwind v4's
 * property-count ordering lets `pl-8` win over `px-3` where an override is
 * needed.
 */
export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

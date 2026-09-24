import type { Kind, Label, Lang } from "./types";
import { normalize } from "./lib/normalize";

type Dict = {
  appName: string;
  tagline: string;
  search: string;
  uncertainOnly: string;
  uncertain: string;
  selected: (n: number) => string;
  showOnMap: string;
  clear: string;
  about: string;
  zoomIn: string;
  zoomOut: string;
  home: string;
  fullscreen: string;
  exitFullscreen: string;
  openList: string;
  close: string;
  noResults: string;
  loading: string;
  loadFailed: string;
  results: (n: number, total: number) => string;
  rowFrench: string;
  rowOttoman: string;
  rowModern: string;
  language: string;
  kinds: Record<Kind, string>;
  allKinds: string;
  credit: string;
  listHelp: string;
  labelsList: string;
  aboutTitle: string;
  aboutBody: string[];
  sourceLink: string;
  dataLink: string;
  noOttoman: string;
};

const en: Dict = {
  appName: "Bosphore 1819",
  tagline: "An 1819 French map of the Bosphorus, every label read and translated",
  search: "Search names…",
  uncertainOnly: "Uncertain only",
  uncertain: "Uncertain reading",
  selected: (n) => `${n} selected`,
  showOnMap: "Show on map",
  clear: "Clear",
  about: "About the map",
  zoomIn: "Zoom in",
  zoomOut: "Zoom out",
  home: "Reset view",
  fullscreen: "Fullscreen",
  exitFullscreen: "Exit fullscreen",
  openList: "Open the list of names",
  close: "Close",
  noResults: "No labels match.",
  loading: "Loading the map…",
  loadFailed: "The label data could not be loaded.",
  results: (n, total) => `${n} of ${total} labels`,
  rowFrench: "French original",
  rowOttoman: "Ottoman Turkish",
  rowModern: "Modern name",
  language: "Language",
  kinds: {
    village: "Village",
    quarter: "Quarter",
    city: "City",
    cape: "Cape",
    bay: "Bay",
    water: "Water",
    fort: "Fort",
    palace: "Palace",
    mosque: "Mosque",
    religious: "Religious",
    military: "Military",
    ruin: "Ruin",
    mountain: "Mountain",
    forest: "Forest",
    road: "Road",
    infrastructure: "Infrastructure",
    region: "Region",
    island: "Island",
    other: "Other",
  },
  allKinds: "All kinds",
  credit: "Kauffer & Barbié du Bocage, 1819 · BnF Gallica / Wikimedia Commons · public domain",
  listHelp: "Use the arrow keys to move, Space to select and Enter to fly to a label.",
  labelsList: "Map labels",
  aboutTitle: "About the map",
  aboutBody: [
    "The Plan Topographique du Bosphore de Thrace ou Canal de Constantinople et de ses environs was surveyed by François Kauffer between 1776 and 1786 while he was attached to the French ambassador Choiseul-Gouffier, and later to the Ottoman Porte. Jean-Denis Barbié du Bocage redrew and enriched it for Antoine-Ignace Melling's Voyage pittoresque de Constantinople et des rives du Bosphore, published in 1819.",
    "The map is not north-up: the Black Sea is on the left and the Sea of Marmara lower right. Turkish names are written with French spelling conventions of the time (ou = u, tch = ç, keui = köy), so every label is given three ways: the French original as engraved, the Ottoman Turkish name in Latin and Arabic script, and the name used today.",
    "Readings marked with a ? are guesses: the engraving is unclear, or the identification with a modern place is uncertain. Corrections are welcome on GitHub.",
    "The scan is by the Bibliothèque nationale de France (Gallica, ark:/12148/btv1b10100957j) and is served from Wikimedia Commons. The map is in the public domain.",
  ],
  sourceLink: "Wikimedia Commons file",
  dataLink: "Source code and data on GitHub",
  noOttoman: "no Ottoman name",
};

const fr: Dict = {
  appName: "Bosphore 1819",
  tagline: "Une carte française du Bosphore de 1819, chaque nom lu et traduit",
  search: "Chercher un nom…",
  uncertainOnly: "Incertains seulement",
  uncertain: "Lecture incertaine",
  selected: (n) => `${n} sélectionné${n > 1 ? "s" : ""}`,
  showOnMap: "Voir sur la carte",
  clear: "Effacer",
  about: "À propos de la carte",
  zoomIn: "Zoom avant",
  zoomOut: "Zoom arrière",
  home: "Vue d'ensemble",
  fullscreen: "Plein écran",
  exitFullscreen: "Quitter le plein écran",
  openList: "Ouvrir la liste des noms",
  close: "Fermer",
  noResults: "Aucun nom ne correspond.",
  loading: "Chargement de la carte…",
  loadFailed: "Les données des noms n'ont pas pu être chargées.",
  results: (n, total) => `${n} noms sur ${total}`,
  rowFrench: "Original français",
  rowOttoman: "Turc ottoman",
  rowModern: "Nom actuel",
  language: "Langue",
  kinds: {
    village: "Village",
    quarter: "Quartier",
    city: "Ville",
    cape: "Cap",
    bay: "Baie",
    water: "Eaux",
    fort: "Fort",
    palace: "Palais",
    mosque: "Mosquée",
    religious: "Religieux",
    military: "Militaire",
    ruin: "Ruine",
    mountain: "Montagne",
    forest: "Forêt",
    road: "Route",
    infrastructure: "Infrastructure",
    region: "Région",
    island: "Île",
    other: "Autre",
  },
  allKinds: "Tous les types",
  credit: "Kauffer & Barbié du Bocage, 1819 · BnF Gallica / Wikimedia Commons · domaine public",
  listHelp: "Flèches pour se déplacer, Espace pour sélectionner, Entrée pour aller sur la carte.",
  labelsList: "Noms de la carte",
  aboutTitle: "À propos de la carte",
  aboutBody: [
    "Le Plan Topographique du Bosphore de Thrace ou Canal de Constantinople et de ses environs a été levé par François Kauffer entre 1776 et 1786, alors qu'il était attaché à l'ambassadeur Choiseul-Gouffier puis à la Porte ottomane. Jean-Denis Barbié du Bocage l'a redessiné et enrichi pour le Voyage pittoresque de Constantinople et des rives du Bosphore d'Antoine-Ignace Melling, paru en 1819.",
    "La carte n'est pas orientée au nord : la mer Noire est à gauche et la mer de Marmara en bas à droite. Les noms turcs sont écrits selon l'orthographe française de l'époque (ou = u, tch = ç, keui = köy) ; chaque nom est donc donné de trois façons : l'original français tel que gravé, le nom turc ottoman en écriture latine et arabe, et le nom d'aujourd'hui.",
    "Les lectures marquées d'un ? sont des hypothèses : la gravure est peu lisible, ou l'identification avec un lieu actuel est incertaine. Les corrections sont bienvenues sur GitHub.",
    "La numérisation est de la Bibliothèque nationale de France (Gallica, ark:/12148/btv1b10100957j) et est servie depuis Wikimedia Commons. La carte est dans le domaine public.",
  ],
  sourceLink: "Fichier sur Wikimedia Commons",
  dataLink: "Code source et données sur GitHub",
  noOttoman: "pas de nom ottoman",
};

const tr: Dict = {
  appName: "Bosphore 1819",
  tagline: "1819 tarihli Fransız Boğaziçi haritası, her ad okunmuş ve çevrilmiş",
  search: "Ad ara…",
  uncertainOnly: "Yalnızca belirsizler",
  uncertain: "Belirsiz okuma",
  selected: (n) => `${n} seçili`,
  showOnMap: "Haritada göster",
  clear: "Temizle",
  about: "Harita hakkında",
  zoomIn: "Yakınlaştır",
  zoomOut: "Uzaklaştır",
  home: "Genel görünüm",
  fullscreen: "Tam ekran",
  exitFullscreen: "Tam ekrandan çık",
  openList: "Ad listesini aç",
  close: "Kapat",
  noResults: "Eşleşen ad yok.",
  loading: "Harita yükleniyor…",
  loadFailed: "Ad verileri yüklenemedi.",
  results: (n, total) => `${total} addan ${n}`,
  rowFrench: "Fransızca aslı",
  rowOttoman: "Osmanlı Türkçesi",
  rowModern: "Bugünkü ad",
  language: "Dil",
  kinds: {
    village: "Köy",
    quarter: "Mahalle",
    city: "Şehir",
    cape: "Burun",
    bay: "Koy",
    water: "Su",
    fort: "Kale",
    palace: "Saray",
    mosque: "Cami",
    religious: "Dinî",
    military: "Askerî",
    ruin: "Harabe",
    mountain: "Dağ",
    forest: "Orman",
    road: "Yol",
    infrastructure: "Altyapı",
    region: "Bölge",
    island: "Ada",
    other: "Diğer",
  },
  allKinds: "Tüm türler",
  credit: "Kauffer & Barbié du Bocage, 1819 · BnF Gallica / Wikimedia Commons · kamu malı",
  listHelp: "Ok tuşlarıyla gezin, Boşluk ile seçin, Enter ile haritada gidin.",
  labelsList: "Harita adları",
  aboutTitle: "Harita hakkında",
  aboutBody: [
    "Plan Topographique du Bosphore de Thrace ou Canal de Constantinople et de ses environs, François Kauffer tarafından 1776–1786 yılları arasında, önce Fransız elçisi Choiseul-Gouffier'nin, sonra Bâbıâli'nin hizmetindeyken ölçülmüştür. Jean-Denis Barbié du Bocage haritayı Antoine-Ignace Melling'in 1819'da yayımlanan Voyage pittoresque de Constantinople et des rives du Bosphore adlı eseri için yeniden çizip zenginleştirmiştir.",
    "Harita kuzeye yönlendirilmiş değildir: Karadeniz solda, Marmara sağ altta yer alır. Türkçe adlar dönemin Fransız imlasıyla yazılmıştır (ou = u, tch = ç, keui = köy); bu yüzden her ad üç biçimde verilir: hakkedildiği haliyle Fransızca aslı, Latin ve Arap harfleriyle Osmanlıca adı ve bugün kullanılan ad.",
    "? ile işaretli okumalar tahmindir: hakkedilmiş yazı belirsizdir ya da bugünkü yerle özdeşleştirme kesin değildir. Düzeltmeler GitHub üzerinden beklenir.",
    "Tarama Fransa Millî Kütüphanesi'ne (Gallica, ark:/12148/btv1b10100957j) aittir ve Wikimedia Commons üzerinden sunulmaktadır. Harita kamu malıdır.",
  ],
  sourceLink: "Wikimedia Commons dosyası",
  dataLink: "Kaynak kod ve veriler GitHub'da",
  noOttoman: "Osmanlıca adı yok",
};

export const DICT: Record<Lang, Dict> = { en, fr, tr };
export const LANGS: Lang[] = ["fr", "tr", "en"];

export function t(lang: Lang): Dict {
  return DICT[lang];
}

export function isLang(x: unknown): x is Lang {
  return x === "fr" || x === "tr" || x === "en";
}

/**
 * The three glosses shown under the French original, the Ottoman name and the
 * modern name. A gloss is hidden when it repeats the name above it, and a
 * missing gloss falls back to lit.ota[lang], then lit.fr[lang], then nothing.
 */
export function glosses(label: Label, lang: Lang): [string | null, string | null, string | null] {
  const litFr = lang === "fr" ? null : label.lit.fr[lang];
  const litOta = label.lit.ota ? label.lit.ota[lang] : null;
  const litModern = label.lit.modern ? label.lit.modern[lang] : null;

  const g1 = lang === "fr" ? null : hide(litFr ?? litOta, label.fr);
  const g2 = label.ota ? hide(litOta ?? litFr, label.ota.latn) : null;
  const g3 = hide(litModern, label.modern);
  return [g1, g2, g3];
}

function hide(gloss: string | null | undefined, above: string): string | null {
  if (!gloss) return null;
  return normalize(gloss) === normalize(above) ? null : gloss;
}

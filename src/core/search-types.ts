import { normalizeTrigger } from "./trigger";
import type { Settings } from "./types";

export type SearchType = "images" | "videos" | "news";

export type ProviderId =
  | "google"
  | "duckduckgo"
  | "startpage"
  | "kagi"
  | "brave"
  | "bing"
  | "ecosia"
  | "qwant"
  | "mojeek"
  | "youtube";

export interface SearchProvider {
  id: ProviderId;
  name: string;
  defaultBang?: string;
  bangs: Partial<Record<SearchType, string>>;
}

export const SEARCH_PROVIDERS: readonly SearchProvider[] = [
  {
    id: "google",
    name: "Google",
    defaultBang: "g",
    bangs: { images: "gi", videos: "gv", news: "gn" },
  },
  {
    id: "duckduckgo",
    name: "DuckDuckGo",
    defaultBang: "ddg",
    bangs: { images: "ddgi", videos: "ddgv", news: "ddgn" },
  },
  {
    id: "startpage",
    name: "Startpage",
    defaultBang: "startpage",
    bangs: { images: "spi", videos: "spv", news: "startpage-news" },
  },
  {
    id: "kagi",
    name: "Kagi",
    defaultBang: "kagi",
    bangs: {
      images: "kagi-images",
      videos: "kagi-videos",
      news: "kagi-news",
    },
  },
  {
    id: "brave",
    name: "Brave",
    defaultBang: "brave",
    bangs: {
      images: "brave-images",
      videos: "brave-videos",
      news: "brave-news",
    },
  },
  {
    id: "bing",
    name: "Bing",
    defaultBang: "bing",
    bangs: { images: "bi", videos: "bv", news: "bnews" },
  },
  {
    id: "ecosia",
    name: "Ecosia",
    defaultBang: "ecosia",
    bangs: { images: "ei" },
  },
  {
    id: "qwant",
    name: "Qwant",
    defaultBang: "qwant",
    bangs: { images: "qwi", videos: "qwv", news: "qwn" },
  },
  {
    id: "mojeek",
    name: "Mojeek",
    defaultBang: "mojeek",
    bangs: { images: "mojeek-images" },
  },
  {
    id: "youtube",
    name: "YouTube",
    bangs: { videos: "yt" },
  },
] as const satisfies readonly SearchProvider[];

export const SEARCH_TYPE_ALIASES: Record<SearchType, readonly string[]> = {
  images: [
    "i",
    "image",
    "images",
    "img",
    "imgs",
    "pic",
    "pics",
    "picture",
    "pictures",
    "photo",
    "photos",
  ],
  videos: ["v", "video", "videos", "vid", "vids"],
  news: ["n", "news"],
};

export const SEARCH_TYPE_LABELS: Record<SearchType, string> = {
  images: "Images",
  videos: "Videos",
  news: "News",
};

const DEFAULT_PROVIDER_ALIASES: Record<string, ProviderId> = {
  g: "google",
  google: "google",
  goog: "google",
  ddg: "duckduckgo",
  dax: "duckduckgo",
  duckduckgo: "duckduckgo",
  s: "startpage",
  sp: "startpage",
  start: "startpage",
  startpage: "startpage",
  k: "kagi",
  kagi: "kagi",
  brave: "brave",
  b: "bing",
  bing: "bing",
  ec: "ecosia",
  eco: "ecosia",
  ecosia: "ecosia",
  qw: "qwant",
  qwt: "qwant",
  qwant: "qwant",
  mojeek: "mojeek",
  yt: "youtube",
  youtube: "youtube",
};

export const TYPE_SETTING_KEYS = {
  images: "imagesBang",
  videos: "videosBang",
  news: "newsBang",
} as const satisfies Record<SearchType, keyof Settings>;

export function providerForBang(trigger: string): ProviderId | null {
  return DEFAULT_PROVIDER_ALIASES[normalizeTrigger(trigger)] ?? null;
}

export function providerBang(
  provider: ProviderId,
  type: SearchType,
): string | null {
  const definition = SEARCH_PROVIDERS.find((item) => item.id === provider);
  return definition?.bangs[type] ?? null;
}

export function providerForType(
  type: SearchType,
  defaultBang: string,
): SearchProvider | null {
  const provider = providerForBang(defaultBang);
  if (!provider) return null;
  const definition = SEARCH_PROVIDERS.find((item) => item.id === provider);
  return definition?.bangs[type] ? definition : null;
}

export function autoTypeBang(
  type: SearchType,
  defaultBang: string,
): string | null {
  const provider = providerForBang(defaultBang);
  return provider ? providerBang(provider, type) : null;
}

export function configuredTypeBang(
  type: SearchType,
  settings: Settings,
): string | null {
  const configured = settings[TYPE_SETTING_KEYS[type]].trim();
  if (configured) return normalizeTrigger(configured);
  return autoTypeBang(type, settings.defaultBang);
}

export function configuredTypeProvider(
  type: SearchType,
  settings: Settings,
): ProviderId | "auto" | "custom" {
  const configured = normalizeTrigger(settings[TYPE_SETTING_KEYS[type]]);
  if (!configured) return "auto";

  const match = SEARCH_PROVIDERS.find(
    (provider) => provider.bangs[type] === configured,
  );
  return match?.id ?? "custom";
}

export function resolveTypeTrigger(
  trigger: string,
  settings: Settings,
): { type: SearchType; target: string } | null {
  if (!settings.searchTypesEnabled) return null;

  const normalized = normalizeTrigger(trigger);
  if (settings.customBangs.some((bang) => bang.t === normalized)) return null;

  for (const type of Object.keys(SEARCH_TYPE_ALIASES) as SearchType[]) {
    if (!SEARCH_TYPE_ALIASES[type].includes(normalized)) continue;
    const target = configuredTypeBang(type, settings);
    if (!target || SEARCH_TYPE_ALIASES[type].includes(target)) return null;
    return { type, target };
  }

  return null;
}

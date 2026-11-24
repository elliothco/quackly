import type { CustomBang, Settings } from "./types";
import { isValidTrigger, normalizeTrigger } from "./trigger";

export const LS_KEYS = {
  defaultBang: "default-bang",
  disableDdgAds: "disable-ddg-ads",
  disableDdgPromos: "disable-ddg-promos",
  duckAssist: "duck-assist-setting",
  disableGoogleAi: "disable-google-ai-overview",
  customBangs: "custom-bangs",
  redditSiteSearch: "reddit-site-search-enabled",
  multiBangEnabled: "multi-bang-enabled",
  questionBang: "question-bang",
  questionBangEnabled: "question-bang-enabled",
  ddgAiQuickAnswers: "ddg-ai-quick-answers",
  searchTypesEnabled: "search-types-enabled",
  imagesBang: "images-bang",
  videosBang: "videos-bang",
  newsBang: "news-bang",
} as const;

export const FALLBACK_BANG = "ddg";
export const DEFAULT_QUESTION_BANG = "ddg-ai";

export const SETTINGS_DEFAULTS = {
  defaultBang: FALLBACK_BANG,
  disableDdgAds: true,
  disableDdgPromos: true,
  duckAssist: "2",
  disableGoogleAi: false,
  redditSiteSearch: true,
  multiBangEnabled: true,
  questionBang: DEFAULT_QUESTION_BANG,
  questionBangEnabled: false,
  ddgAiQuickAnswers: true,
  searchTypesEnabled: true,
  imagesBang: "",
  videosBang: "",
  newsBang: "",
} as const;

export function createDefaultSettings(): Settings {
  return {
    ...SETTINGS_DEFAULTS,
    customBangs: [],
  };
}

export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

export type ValidationResult =
  | { ok: true; bang: CustomBang }
  | { ok: false; error: string };

function getStr(storage: StorageLike, key: string, fallback = ""): string {
  return storage.getItem(key) ?? fallback;
}

function getBoolWithDefault(
  storage: StorageLike,
  key: string,
  fallback: boolean,
): boolean {
  const value = storage.getItem(key);
  if (value === null) return fallback;
  return value === "true";
}

function getTriggerWithDefault(
  storage: StorageLike,
  key: string,
  fallback: string,
): string {
  const trigger = normalizeTrigger(getStr(storage, key, fallback));
  return isValidTrigger(trigger) ? trigger : fallback;
}

function deriveDomain(template: string): string {
  try {
    const prefix = template.split(/\{\{\{s\}\}\}|%s|\{searchTerms\}/)[0];
    return new URL(prefix).hostname || "custom.com";
  } catch {
    return "custom.com";
  }
}

function hasPlaceholder(template: string): boolean {
  return (
    template.includes("{{{s}}}") ||
    template.includes("%s") ||
    template.includes("{searchTerms}")
  );
}

function sanitizeCustomBangs(value: unknown): CustomBang[] {
  if (!Array.isArray(value)) return [];

  const byTrigger = new Map<string, CustomBang>();
  for (const item of value) {
    if (!item || typeof item !== "object") continue;

    const candidate = item as Record<string, unknown>;
    if (
      typeof candidate.t !== "string" ||
      typeof candidate.u !== "string" ||
      !hasPlaceholder(candidate.u)
    ) {
      continue;
    }

    const trigger = normalizeTrigger(candidate.t);
    if (!isValidTrigger(trigger)) continue;

    const template = candidate.u.trim();
    if (!/^https?:\/\//i.test(template)) continue;

    const domain =
      typeof candidate.d === "string" && candidate.d.trim()
        ? candidate.d.trim()
        : deriveDomain(template);

    byTrigger.set(trigger, { t: trigger, d: domain, u: template });
  }

  return [...byTrigger.values()];
}

export function parseCustomBangs(raw: string): CustomBang[] {
  try {
    return sanitizeCustomBangs(JSON.parse(raw));
  } catch {
    return [];
  }
}

export function loadSettings(storage: StorageLike): Settings {
  const duckAssist = getStr(
    storage,
    LS_KEYS.duckAssist,
    SETTINGS_DEFAULTS.duckAssist,
  );
  const storedQuestionBang = normalizeTrigger(
    getStr(storage, LS_KEYS.questionBang, DEFAULT_QUESTION_BANG),
  );
  const storedDefault = normalizeTrigger(
    getStr(storage, LS_KEYS.defaultBang, FALLBACK_BANG),
  );

  return {
    defaultBang: isValidTrigger(storedDefault)
      ? storedDefault
      : SETTINGS_DEFAULTS.defaultBang,
    disableDdgAds: getBoolWithDefault(
      storage,
      LS_KEYS.disableDdgAds,
      SETTINGS_DEFAULTS.disableDdgAds,
    ),
    disableDdgPromos: getBoolWithDefault(
      storage,
      LS_KEYS.disableDdgPromos,
      SETTINGS_DEFAULTS.disableDdgPromos,
    ),
    duckAssist: ["0", "1", "2", "3"].includes(duckAssist) ? duckAssist : "2",
    disableGoogleAi: getBoolWithDefault(
      storage,
      LS_KEYS.disableGoogleAi,
      SETTINGS_DEFAULTS.disableGoogleAi,
    ),
    customBangs: parseCustomBangs(getStr(storage, LS_KEYS.customBangs, "[]")),
    redditSiteSearch: getBoolWithDefault(
      storage,
      LS_KEYS.redditSiteSearch,
      SETTINGS_DEFAULTS.redditSiteSearch,
    ),
    multiBangEnabled: getBoolWithDefault(
      storage,
      LS_KEYS.multiBangEnabled,
      SETTINGS_DEFAULTS.multiBangEnabled,
    ),
    questionBang: isValidTrigger(storedQuestionBang)
      ? storedQuestionBang
      : SETTINGS_DEFAULTS.questionBang,
    questionBangEnabled: getBoolWithDefault(
      storage,
      LS_KEYS.questionBangEnabled,
      SETTINGS_DEFAULTS.questionBangEnabled,
    ),
    ddgAiQuickAnswers: getBoolWithDefault(
      storage,
      LS_KEYS.ddgAiQuickAnswers,
      SETTINGS_DEFAULTS.ddgAiQuickAnswers,
    ),
    searchTypesEnabled: getBoolWithDefault(
      storage,
      LS_KEYS.searchTypesEnabled,
      SETTINGS_DEFAULTS.searchTypesEnabled,
    ),
    imagesBang: getTriggerWithDefault(
      storage,
      LS_KEYS.imagesBang,
      SETTINGS_DEFAULTS.imagesBang,
    ),
    videosBang: getTriggerWithDefault(
      storage,
      LS_KEYS.videosBang,
      SETTINGS_DEFAULTS.videosBang,
    ),
    newsBang: getTriggerWithDefault(
      storage,
      LS_KEYS.newsBang,
      SETTINGS_DEFAULTS.newsBang,
    ),
  };
}

export function writeSetting(
  storage: StorageLike,
  key: keyof typeof LS_KEYS,
  value: string | boolean,
): void {
  storage.setItem(LS_KEYS[key], String(value));
}

export function writeCustomBangs(
  storage: StorageLike,
  customBangs: CustomBang[],
): void {
  storage.setItem(LS_KEYS.customBangs, JSON.stringify(customBangs));
}

export function validateCustomBang(
  triggerInput: string,
  templateInput: string,
): ValidationResult {
  const trigger = normalizeTrigger(triggerInput);
  if (!trigger) {
    return { ok: false, error: "Bang trigger cannot be empty." };
  }
  if (!isValidTrigger(trigger)) {
    return {
      ok: false,
      error: "Bang trigger cannot contain spaces or control characters.",
    };
  }

  let template = templateInput.trim();
  if (!template) {
    return { ok: false, error: "URL template cannot be empty." };
  }
  if (!/^https?:\/\//i.test(template)) {
    template = `https://${template}`;
  }
  if (!hasPlaceholder(template)) {
    return {
      ok: false,
      error:
        "URL template must contain {{{s}}}, %s, or {searchTerms} for the search query.",
    };
  }

  try {
    const parsed = new URL(
      template.replace(/\{\{\{s\}\}\}|%s|\{searchTerms\}/g, "query"),
    );
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      throw new Error("Unsupported protocol");
    }
  } catch {
    return { ok: false, error: "URL template is not a valid HTTP(S) URL." };
  }

  return {
    ok: true,
    bang: {
      t: trigger,
      d: deriveDomain(template),
      u: template,
    },
  };
}

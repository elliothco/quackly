import {
  DEFAULT_FORMAT_MASK,
  FORMAT_OPEN_BASE_PATH,
  FORMAT_OPEN_SNAP_DOMAIN,
  FORMAT_PRESERVE_SLASH,
  FORMAT_SPACE_TO_PLUS,
  FORMAT_URL_ENCODE,
} from "./bang-index";
import { parseBangQuery } from "./parse";
import { resolveTypeTrigger } from "./search-types";
import { normalizeTrigger } from "./trigger";
import type {
  BangLookup,
  BangRecord,
  ResolvedMulti,
  Route,
  Settings,
} from "./types";

const FALLBACK_URL = "https://duckduckgo.com/?q=";

function effectiveFormatMask(record: BangRecord): number {
  return record.formatMask < 0 ? DEFAULT_FORMAT_MASK : record.formatMask;
}

function encodeValue(value: string, formatMask: number): string {
  if ((formatMask & FORMAT_URL_ENCODE) === 0) {
    return (formatMask & FORMAT_SPACE_TO_PLUS) !== 0
      ? value.replace(/ /g, "+")
      : value;
  }

  let encoded = encodeURIComponent(value);
  if ((formatMask & FORMAT_PRESERVE_SLASH) !== 0) {
    encoded = encoded.replace(/%2F/gi, "/");
  }
  return (formatMask & FORMAT_SPACE_TO_PLUS) !== 0
    ? encoded.replace(/%20/g, "+")
    : encoded;
}

function placeholderUrl(record: BangRecord, value: string): string {
  return record.template.replace(
    /\{\{\{s\}\}\}|%s|\{searchTerms\}/g,
    () => value,
  );
}

function templateOrigin(template: string): string | null {
  try {
    return new URL(
      template.replace(/\{\{\{s\}\}\}|%s|\{searchTerms\}/g, "query"),
    ).origin;
  } catch {
    return null;
  }
}

function emptyQueryUrl(record: BangRecord, formatMask: number): string {
  if (
    (formatMask & FORMAT_OPEN_SNAP_DOMAIN) !== 0 &&
    record.snapDomain.length > 0
  ) {
    return `https://${record.snapDomain}`;
  }

  if ((formatMask & FORMAT_OPEN_BASE_PATH) !== 0) {
    const origin = templateOrigin(record.template);
    if (origin) return `${origin}/`;
  }

  if (record.domain) return `https://${record.domain}`;
  return templateOrigin(record.template) ?? FALLBACK_URL;
}

function applyRegexTemplate(
  record: BangRecord,
  query: string,
  formatMask: number,
): string | null {
  let regex: RegExp;
  try {
    regex = new RegExp(record.regex);
  } catch {
    return null;
  }

  const match = query.match(regex);
  if (!match) return null;

  return record.template.replace(/\$(\d+)/g, (_, capture: string) => {
    const value = match[Number(capture)] ?? "";
    return encodeValue(value, formatMask);
  });
}

function appendDdgSettings(url: string, settings: Settings): string {
  try {
    const parsed = new URL(url);
    if (settings.disableDdgAds) {
      parsed.searchParams.set("k1", "-1");
    }
    if (settings.disableDdgPromos) {
      parsed.searchParams.set("kak", "-1");
      parsed.searchParams.set("kax", "-1");
      parsed.searchParams.set("kaq", "-1");
      parsed.searchParams.set("kap", "-1");
    }
    return parsed.href;
  } catch {
    return url;
  }
}

function appendDdgAiPrompt(url: string): string {
  try {
    const parsed = new URL(url);
    parsed.searchParams.set("prompt", "1");
    return parsed.href;
  } catch {
    return url;
  }
}

function buildBangUrl(
  record: BangRecord,
  rawQuery: string,
  settings: Settings,
  defaultRecord: BangRecord,
): string | null {
  let selected = record;
  let query = rawQuery.trim();

  if (
    (selected.canonical === "r" || selected.canonical === "reddit") &&
    settings.redditSiteSearch
  ) {
    query = `${query} site:reddit.com`.trim();
    selected = defaultRecord;
  }

  const formatMask = effectiveFormatMask(selected);
  if (!query) return emptyQueryUrl(selected, formatMask);

  if (selected.canonical === "g" && settings.disableGoogleAi) {
    query = `${query} -ai`;
  }

  let url: string | null;
  if (selected.regex) {
    url = applyRegexTemplate(selected, query, formatMask);
    if (!url) return null;
  } else {
    url = placeholderUrl(selected, encodeValue(query, formatMask));
  }

  if (selected.canonical === "dax") {
    url = appendDdgSettings(url, settings);
  }

  if (selected.canonical === "ddg-ai" && settings.ddgAiQuickAnswers) {
    url = appendDdgAiPrompt(url);
  }

  return url;
}

async function getDefaultRecord(
  settings: Settings,
  catalog: BangLookup,
): Promise<BangRecord | undefined> {
  const configured = await catalog.lookupWithFull(settings.defaultBang);
  if (configured) return configured;

  const fallback = await catalog.lookupWithFull("ddg");
  if (fallback) return fallback;

  return catalog.lookupWithFull("g");
}

async function lookupTriggerRecord(
  trigger: string,
  settings: Settings,
  catalog: BangLookup,
): Promise<BangRecord | undefined> {
  const mapped = resolveTypeTrigger(trigger, settings);
  return catalog.lookupWithFull(mapped?.target ?? trigger);
}

function fallbackUrl(query: string): string {
  return `${FALLBACK_URL}${encodeURIComponent(query)}`;
}

export async function resolveRoute(
  rawQuery: string,
  settings: Settings,
  catalog: BangLookup,
): Promise<Route> {
  const trimmed = rawQuery.trim();
  if (!trimmed) return { kind: "home" };

  const parsed = parseBangQuery(trimmed, settings.multiBangEnabled);
  const defaultRecord = await getDefaultRecord(settings, catalog);

  if (!defaultRecord) {
    return { kind: "single", url: fallbackUrl(trimmed) };
  }

  if (parsed.candidates.length === 0 && settings.questionBangEnabled) {
    const questionQuery = trimmed.endsWith("?")
      ? trimmed.slice(0, -1).trimEnd()
      : "";
    if (questionQuery) {
      const questionRecord = await catalog.lookupWithFull(
        settings.questionBang,
      );
      if (questionRecord) {
        const url = buildBangUrl(
          questionRecord,
          questionQuery,
          settings,
          defaultRecord,
        );
        if (url) return { kind: "single", url };
      }
    }
  }

  if (parsed.candidates.length === 0) {
    const url = buildBangUrl(defaultRecord, trimmed, settings, defaultRecord);
    return { kind: "single", url: url ?? fallbackUrl(trimmed) };
  }

  const unresolved: string[] = [];
  const resolved: { trigger: string; record: BangRecord }[] = [];

  for (const trigger of parsed.candidates) {
    const record = await lookupTriggerRecord(trigger, settings, catalog);
    if (record) {
      resolved.push({ trigger, record });
    } else {
      unresolved.push(trigger);
    }
  }

  const built: { trigger: string; url: string }[] = [];
  for (const { trigger, record } of resolved) {
    const url = buildBangUrl(
      record,
      parsed.query,
      settings,
      defaultRecord,
    );
    if (url) {
      built.push({ trigger, url });
    } else {
      unresolved.push(trigger);
    }
  }

  if (settings.multiBangEnabled && built.length > 1) {
    return {
      kind: "multi",
      query: parsed.query,
      urls: built.map((item) => item.url),
      triggers: built.map((item) => item.trigger),
      unresolved,
    };
  }

  if (built.length === 1) {
    return { kind: "single", url: built[0].url };
  }

  const fallback = buildBangUrl(
    defaultRecord,
    parsed.query,
    settings,
    defaultRecord,
  );
  return { kind: "single", url: fallback ?? fallbackUrl(parsed.query) };
}

export async function resolveMultiBangs(
  query: string,
  triggers: readonly string[],
  settings: Settings,
  catalog: BangLookup,
): Promise<ResolvedMulti> {
  const defaultRecord = await getDefaultRecord(settings, catalog);
  if (!defaultRecord) {
    return { urls: [], triggers: [], unresolved: [...triggers] };
  }

  const urls: string[] = [];
  const resolvedTriggers: string[] = [];
  const unresolved: string[] = [];

  for (const rawTrigger of triggers) {
    const trigger = normalizeTrigger(rawTrigger);
    const record = await lookupTriggerRecord(trigger, settings, catalog);
    if (!record) {
      unresolved.push(trigger);
      continue;
    }

    const url = buildBangUrl(
      record,
      query,
      settings,
      defaultRecord,
    );
    if (!url) {
      unresolved.push(trigger);
      continue;
    }

    urls.push(url);
    resolvedTriggers.push(trigger);
  }

  return { urls, triggers: resolvedTriggers, unresolved };
}

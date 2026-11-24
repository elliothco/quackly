import { normalizeTrigger } from "./trigger";

export function buildMultiBangUrl(
  baseHref: string,
  query: string,
  triggers: readonly string[],
  unresolved: readonly string[] = [],
): string {
  const url = new URL("multibang.html", baseHref);
  url.searchParams.set("q", query);
  for (const trigger of triggers) {
    url.searchParams.append("bang", trigger);
  }
  for (const trigger of unresolved) {
    url.searchParams.append("miss", trigger);
  }
  return url.href;
}

export function readBangTriggers(search: string): string[] {
  const params = new URLSearchParams(search);
  const repeated = params
    .getAll("bang")
    .map(normalizeTrigger)
    .filter(Boolean);
  if (repeated.length > 0) return repeated;

  return (params.get("bangs") ?? "")
    .split(",")
    .map(normalizeTrigger)
    .filter(Boolean);
}

export function readUnresolvedTriggers(search: string): string[] {
  return new URLSearchParams(search)
    .getAll("miss")
    .map(normalizeTrigger)
    .filter(Boolean);
}

export function readQuery(search: string): string {
  return new URLSearchParams(search).get("q")?.trim() ?? "";
}

export function appHomeUrl(baseHref: string): string {
  return new URL("./", baseHref).href;
}

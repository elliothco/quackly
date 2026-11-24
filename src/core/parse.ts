import { normalizeTrigger } from "./trigger";

export interface ParsedBangQuery {
  query: string;
  candidates: string[];
}

export function parseBangQuery(
  rawQuery: string,
  multiBangEnabled: boolean,
): ParsedBangQuery {
  const trimmed = rawQuery.trim();
  if (!trimmed) return { query: "", candidates: [] };

  const tokens = trimmed.split(/\s+/);
  const candidateIndexes: number[] = [];

  tokens.forEach((token, index) => {
    if (token.startsWith("!") && token.length > 1) {
      candidateIndexes.push(index);
    }
  });

  const selectedIndexes = multiBangEnabled
    ? candidateIndexes
    : candidateIndexes.slice(0, 1);
  const selected = new Set(selectedIndexes);

  return {
    query: tokens
      .filter((_, index) => !selected.has(index))
      .join(" ")
      .trim(),
    candidates: selectedIndexes
      .map((index) => normalizeTrigger(tokens[index].slice(1)))
      .filter(Boolean),
  };
}

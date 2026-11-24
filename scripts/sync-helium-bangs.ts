import { existsSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = fileURLToPath(new URL("..", import.meta.url));
const SOURCE_URL = "https://services.helium.imput.net/bangs.json";
const REPOSITORY =
  "https://github.com/imputnet/helium-services/tree/main/svc/bangs";
const HOT_FILE = join(ROOT, "scripts", "hot-triggers.json");
const GENERATED_DIR = join(ROOT, "src", "generated");

const FORMAT_OPEN_BASE_PATH = 1;
const FORMAT_OPEN_SNAP_DOMAIN = 2;
const FORMAT_URL_ENCODE_PLACEHOLDER = 4;
const FORMAT_URL_ENCODE_SPACE_TO_PLUS = 8;
const ALL_FORMAT_FLAGS =
  FORMAT_OPEN_BASE_PATH |
  FORMAT_OPEN_SNAP_DOMAIN |
  FORMAT_URL_ENCODE_PLACEHOLDER |
  FORMAT_URL_ENCODE_SPACE_TO_PLUS;

const ALWAYS_HOT = ["g", "ddg", "r", "yt", "w", "chatgpt"];

interface HeliumBang {
  s: string;
  ts: string[];
  u: string;
  f?: number;
  sc?: string;
}

interface GeneratedRecord {
  trigger: string;
  canonical: string;
  domain: string;
  template: string;
  snapDomain: string;
  regex: string;
  formatMask: number;
}

interface ParsedHeliumData {
  bangs: HeliumBang[];
  generatedAt: string;
  sha256: string;
}

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

function normalizeTrigger(value: string): string {
  return value.trim().replace(/^!/, "").toLowerCase();
}

export function parseHeliumData(raw: string): ParsedHeliumData {
  assert(raw.includes("// MIT License"), "Helium data is missing its MIT header");
  assert(
    raw.includes("Copyright (c) 2024 Kagi Search, 2026 imput"),
    "Helium data attribution has changed",
  );

  const generatedAt = raw.match(/^\/\/ Generated at (.+)$/m)?.[1] ?? "";
  assert(generatedAt, "Helium data is missing its generated-at timestamp");

  const start = raw.search(/^\[/m);
  assert(start >= 0, "Helium data does not contain a JSON array");

  const body = raw
    .slice(start)
    .replace(/,\s*([\]}])/g, "$1");
  const parsed = JSON.parse(body) as unknown;
  assert(Array.isArray(parsed), "Helium bangs payload must be an array");

  return {
    bangs: parsed as HeliumBang[],
    generatedAt,
    sha256: new Bun.CryptoHasher("sha256").update(raw).digest("hex"),
  };
}

export function validateBangs(bangs: readonly HeliumBang[]): void {
  const triggers = new Set<string>();

  for (const [index, bang] of bangs.entries()) {
    assert(
      bang && typeof bang === "object",
      `Helium bang ${index} is not an object`,
    );
    assert(typeof bang.s === "string" && bang.s.length > 0, `Bang ${index} has no name`);
    assert(
      Array.isArray(bang.ts) && bang.ts.length > 0,
      `Bang ${index} has no triggers`,
    );
    assert(
      typeof bang.u === "string" && /^https?:\/\//i.test(bang.u),
      `Bang ${index} has an invalid template`,
    );
    assert(
      bang.u.includes("{searchTerms}"),
      `Bang ${index} has no {searchTerms} placeholder`,
    );
    assert(
      bang.f === undefined ||
        (Number.isInteger(bang.f) && (bang.f & ~ALL_FORMAT_FLAGS) === 0),
      `Bang ${index} has invalid format flags`,
    );

    for (const rawTrigger of bang.ts) {
      const trigger = normalizeTrigger(rawTrigger);
      assert(
        trigger === rawTrigger && trigger.length > 0 && !/\s/.test(trigger),
        `Bang ${index} has an invalid trigger: ${rawTrigger}`,
      );
      assert(!triggers.has(trigger), `Duplicate Helium trigger: ${trigger}`);
      triggers.add(trigger);
    }
  }
}

function deriveDomain(template: string): string {
  return new URL(template.replace(/\{searchTerms\}/g, "query")).host;
}

export function transformBangs(bangs: readonly HeliumBang[]): GeneratedRecord[] {
  return bangs.flatMap((bang) => {
    const domain = deriveDomain(bang.u);
    const canonical = normalizeTrigger(bang.ts[0]);
    return bang.ts.map((rawTrigger) => {
      return {
        trigger: normalizeTrigger(rawTrigger),
        canonical,
        domain,
        template: bang.u,
        snapDomain: "",
        regex: "",
        formatMask: bang.f ?? ALL_FORMAT_FLAGS,
      };
    });
  });
}

async function resolveHotTriggers(
  records: readonly GeneratedRecord[],
): Promise<string[]> {
  assert(
    existsSync(HOT_FILE),
    "scripts/hot-triggers.json is required for the hot data split",
  );
  const stored = JSON.parse(await readFile(HOT_FILE, "utf8")) as unknown;
  assert(
    Array.isArray(stored) && stored.every((item) => typeof item === "string"),
    "Invalid scripts/hot-triggers.json",
  );

  const byTrigger = new Map(records.map((record) => [record.trigger, record]));
  const hotCanonicals = new Set<string>();

  for (const trigger of [...stored, ...ALWAYS_HOT].map(normalizeTrigger)) {
    const record = byTrigger.get(trigger);
    if (record) hotCanonicals.add(record.canonical);
  }

  const hotTriggers = records
    .filter((record) => hotCanonicals.has(record.canonical))
    .map((record) => record.trigger)
    .sort();

  await writeFile(HOT_FILE, `${JSON.stringify(hotTriggers, null, 2)}\n`);
  return hotTriggers;
}

function serializeRecords(records: readonly GeneratedRecord[]): string {
  const lines = records.map((record) => {
    const values = [
      record.trigger,
      record.canonical,
      record.domain,
      record.template,
      record.snapDomain,
      record.regex,
      record.formatMask,
    ];
    return `  [${values.map((value) => JSON.stringify(value)).join(", ")}],`;
  });

  return `// Generated by scripts/sync-helium-bangs.ts. Do not edit by hand.\n` +
    `import type { CompactBang } from "../core/types";\n\n` +
    `export const bangs = [\n${lines.join("\n")}\n] as const satisfies readonly CompactBang[];\n`;
}

function serializeMeta(
  source: ParsedHeliumData,
  recordCount: number,
  triggerCount: number,
  hotTriggerCount: number,
): string {
  const meta = {
    source: "Helium Bangs",
    sourceUrl: SOURCE_URL,
    repository: REPOSITORY,
    license: "MIT",
    serviceLicense: "AGPL-3.0",
    sourceGeneratedAt: source.generatedAt,
    sha256: source.sha256,
    records: recordCount,
    triggers: triggerCount,
    hotTriggers: hotTriggerCount,
  };

  return `// Generated by scripts/sync-helium-bangs.ts. Do not edit by hand.\n` +
    `export const BANG_DATA_META = ${JSON.stringify(meta, null, 2)} as const;\n`;
}

async function main(): Promise<void> {
  const response = await fetch(SOURCE_URL, {
    headers: { "User-Agent": "quackly-bang-sync" },
  });
  if (!response.ok) {
    throw new Error(`Helium request failed (${response.status})`);
  }

  const source = parseHeliumData(await response.text());
  validateBangs(source.bangs);

  const records = transformBangs(source.bangs);
  const hotTriggers = await resolveHotTriggers(records);
  const hotSet = new Set(hotTriggers);
  const hotRecords = records.filter((record) => hotSet.has(record.trigger));

  await mkdir(GENERATED_DIR, { recursive: true });
  await Promise.all([
    writeFile(join(GENERATED_DIR, "bangs-full.ts"), serializeRecords(records)),
    writeFile(join(GENERATED_DIR, "bangs-hot.ts"), serializeRecords(hotRecords)),
    writeFile(
      join(GENERATED_DIR, "bangs-meta.ts"),
      serializeMeta(
        source,
        source.bangs.length,
        records.length,
        hotRecords.length,
      ),
    ),
  ]);

  console.log(
    `Helium: ${source.bangs.length} records -> ${records.length} triggers ` +
      `(${hotRecords.length} hot)`,
  );
}

if (import.meta.main) {
  await main();
}

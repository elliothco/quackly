import type { BangRecord, CompactBang, CustomBang } from "./types";
import { normalizeTrigger } from "./trigger";

export const FORMAT_OPEN_BASE_PATH = 1;
export const FORMAT_OPEN_SNAP_DOMAIN = 2;
export const FORMAT_URL_ENCODE = 4;
export const FORMAT_SPACE_TO_PLUS = 8;
export const FORMAT_PRESERVE_SLASH = 16;
export const DEFAULT_FORMAT_MASK = 15;
export const CUSTOM_FORMAT_MASK = FORMAT_URL_ENCODE | FORMAT_PRESERVE_SLASH;

export function compactToRecord(bang: CompactBang): BangRecord {
  return {
    trigger: bang[0],
    canonical: bang[1],
    domain: bang[2],
    template: bang[3],
    snapDomain: bang[4],
    regex: bang[5],
    formatMask: bang[6],
  };
}

function customToRecord(bang: CustomBang): BangRecord {
  return {
    trigger: bang.t,
    canonical: `custom:${bang.t}`,
    domain: bang.d,
    template: bang.u,
    snapDomain: "",
    regex: "",
    formatMask: CUSTOM_FORMAT_MASK,
  };
}

export class BangCatalog {
  private readonly hot = new Map<string, BangRecord>();
  private custom = new Map<string, BangRecord>();
  private full: Map<string, BangRecord> | null = null;
  private fullPromise: Promise<void> | null = null;

  constructor(
    hotBangs: readonly CompactBang[],
    customBangs: readonly CustomBang[],
    private readonly loadFullData: () => Promise<readonly CompactBang[]>,
  ) {
    for (const bang of hotBangs) {
      const record = compactToRecord(bang);
      this.hot.set(normalizeTrigger(record.trigger), record);
    }
    this.setCustomBangs(customBangs);
  }

  setCustomBangs(customBangs: readonly CustomBang[]): void {
    this.custom = new Map();
    for (const bang of customBangs) {
      const record = customToRecord(bang);
      this.custom.set(normalizeTrigger(record.trigger), record);
    }
  }

  get(trigger: string): BangRecord | undefined {
    const normalized = normalizeTrigger(trigger);
    return (
      this.custom.get(normalized) ??
      this.hot.get(normalized) ??
      this.full?.get(normalized)
    );
  }

  suggest(prefix: string, limit = 8): BangRecord[] {
    const normalized = normalizeTrigger(prefix);
    if (!normalized) return [];

    const matches = new Map<string, BangRecord>();
    for (const source of [this.full, this.hot, this.custom]) {
      if (!source) continue;
      for (const [trigger, record] of source) {
        if (trigger.startsWith(normalized)) matches.set(trigger, record);
      }
    }

    return [...matches.values()]
      .sort((a, b) => {
        const primaryA = a.trigger === a.canonical ? 0 : 1;
        const primaryB = b.trigger === b.canonical ? 0 : 1;
        return (
          primaryA - primaryB ||
          a.trigger.length - b.trigger.length ||
          a.trigger.localeCompare(b.trigger)
        );
      })
      .slice(0, limit);
  }

  allTriggers(): string[] {
    const triggers = new Set<string>([
      ...this.hot.keys(),
      ...this.custom.keys(),
      ...(this.full?.keys() ?? []),
    ]);
    return [...triggers].sort();
  }

  async lookupWithFull(trigger: string): Promise<BangRecord | undefined> {
    const existing = this.get(trigger);
    if (existing) return existing;
    await this.ensureFull();
    return this.get(trigger);
  }

  async ensureFull(): Promise<void> {
    if (this.full) return;
    if (!this.fullPromise) {
      this.fullPromise = this.loadFullData()
        .then((bangs) => {
          this.full = new Map();
          for (const bang of bangs) {
            const record = compactToRecord(bang);
            this.full.set(normalizeTrigger(record.trigger), record);
          }
        })
        .catch((error) => {
          this.fullPromise = null;
          throw error;
        });
    }
    await this.fullPromise;
  }
}

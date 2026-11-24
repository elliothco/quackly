import { describe, expect, test } from "bun:test";
import {
  FALLBACK_BANG,
  loadSettings,
  parseCustomBangs,
  validateCustomBang,
} from "../src/core/settings";
import type { StorageLike } from "../src/core/settings";

class MemoryStorage implements StorageLike {
  private values = new Map<string, string>();

  getItem(key: string): string | null {
    return this.values.get(key) ?? null;
  }

  setItem(key: string, value: string): void {
    this.values.set(key, value);
  }
}

describe("settings", () => {
  test("uses defaults for a fresh storage area", () => {
    const settings = loadSettings(new MemoryStorage());
    expect(settings.defaultBang).toBe(FALLBACK_BANG);
    expect(settings.multiBangEnabled).toBe(true);
    expect(settings.redditSiteSearch).toBe(true);
    expect(settings.disableDdgAds).toBe(true);
    expect(settings.disableDdgPromos).toBe(true);
    expect(settings.duckAssist).toBe("2");
    expect(settings.disableGoogleAi).toBe(false);
    expect(settings.customBangs).toEqual([]);
    expect(settings.questionBang).toBe("ddg-ai");
    expect(settings.questionBangEnabled).toBe(false);
    expect(settings.ddgAiQuickAnswers).toBe(true);
  });

  test("normalizes saved default bangs", () => {
    const storage = new MemoryStorage();
    storage.setItem("default-bang", "!GOOGLE");
    expect(loadSettings(storage).defaultBang).toBe("google");
  });

  test("drops malformed custom bang data", () => {
    const bangs = parseCustomBangs(
      JSON.stringify([
        { t: "good", d: "example.com", u: "https://example.com/?q=%s" },
        { t: "no-placeholder", d: "example.com", u: "https://example.com/" },
        { t: "has space", d: "example.com", u: "https://example.com/?q=%s" },
        { t: "relative", d: "example.com", u: "/?q=%s" },
        null,
      ]),
    );
    expect(bangs).toEqual([
      { t: "good", d: "example.com", u: "https://example.com/?q=%s" },
    ]);
  });

  test("keeps the newest duplicate custom bang", () => {
    const bangs = parseCustomBangs(
      JSON.stringify([
        { t: "same", d: "one.example", u: "https://one.example/?q=%s" },
        { t: "same", d: "two.example", u: "https://two.example/?q=%s" },
      ]),
    );
    expect(bangs).toEqual([
      { t: "same", d: "two.example", u: "https://two.example/?q=%s" },
    ]);
  });

  test("validates custom triggers and templates", () => {
    expect(validateCustomBang("", "https://example.com/?q=%s").ok).toBe(false);
    expect(
      validateCustomBang("has space", "https://example.com/?q=%s").ok,
    ).toBe(false);
    expect(validateCustomBang("ok", "https://example.com/").ok).toBe(false);

    const result = validateCustomBang("!My.Bang", "example.com/search?q=%s");
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.bang).toEqual({
        t: "my.bang",
        d: "example.com",
        u: "https://example.com/search?q=%s",
      });
    }

    const heliumStyle = validateCustomBang(
      "helium-style",
      "https://example.com/?q={searchTerms}",
    );
    expect(heliumStyle.ok).toBe(true);
  });
});

import { describe, expect, test } from "bun:test";
import { bangs as fullBangs } from "../src/generated/bangs-full";
import { bangs as hotBangs } from "../src/generated/bangs-hot";
import { BANG_DATA_META } from "../src/generated/bangs-meta";

const full = new Map(fullBangs.map((bang) => [bang[0], bang]));
const hot = new Set(hotBangs.map((bang) => bang[0]));

describe("generated Helium data", () => {
  test("identifies its Helium source", () => {
    expect(BANG_DATA_META.source).toBe("Helium Bangs");
    expect(BANG_DATA_META.sourceUrl).toBe(
      "https://services.helium.imput.net/bangs.json",
    );
    expect(BANG_DATA_META.license).toBe("MIT");
    expect(BANG_DATA_META.serviceLicense).toBe("AGPL-3.0");
    expect(BANG_DATA_META.sha256).toHaveLength(64);
  });

  test("contains unique and absolute triggers", () => {
    expect(full.size).toBe(fullBangs.length);
    expect(fullBangs.length).toBe(BANG_DATA_META.triggers);
    for (const bang of fullBangs) {
      expect(/^https?:\/\//.test(bang[3])).toBe(true);
      expect(bang[3]).toContain("{searchTerms}");
    }
  });

  test("expands Helium aliases without losing their canonical identity", () => {
    expect(full.get("ddg")?.[1]).toBe("dax");
    expect(full.get("duckduckgo")?.[1]).toBe("dax");
    expect(full.get("r")?.[1]).toBe("r");
    expect(full.get("youtube")?.[1]).toBe("ty");
  });

  test("contains Helium's own extras without compatibility bangs", () => {
    expect(full.get("bang")?.[3]).toBe(
      "https://helium.computer/bangs#{searchTerms}",
    );
    expect(full.has("i")).toBe(false);
    expect(full.has("images")).toBe(false);
    expect(full.has("news")).toBe(false);
    expect(full.get("ddg-ai")?.[3]).toBe(
      "https://duck.ai/chat?ia=chat&duckai=1&home=1&q={searchTerms}",
    );
    expect(full.get("ddg-chat")?.[1]).toBe("ddg-ai");
  });

  test("contains every built-in search type provider target", () => {
    for (const trigger of [
      "gi",
      "gv",
      "gn",
      "ddgi",
      "ddgv",
      "ddgn",
      "spi",
      "spv",
      "startpage-news",
      "kagi-images",
      "kagi-videos",
      "kagi-news",
      "brave-images",
      "brave-videos",
      "brave-news",
      "bi",
      "bv",
      "bnews",
      "ei",
      "qwi",
      "qwv",
      "qwn",
      "mojeek-images",
    ]) {
      expect(full.has(trigger)).toBe(true);
      expect(hot.has(trigger)).toBe(true);
    }
  });

  test("keeps the hot subset small and includes the common triggers", () => {
    expect(hot.size).toBe(BANG_DATA_META.hotTriggers);
    expect(hot.size).toBeLessThan(full.size);
    for (const trigger of ["g", "ddg", "r", "yt", "w", "chatgpt"]) {
      expect(hot.has(trigger)).toBe(true);
    }
  });
});

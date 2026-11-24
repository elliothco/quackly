import { describe, expect, test } from "bun:test";
import {
  autoTypeBang,
  configuredTypeBang,
  configuredTypeProvider,
  providerForBang,
  resolveTypeTrigger,
  SEARCH_PROVIDERS,
} from "../src/core/search-types";
import type { Settings } from "../src/core/types";

const baseSettings: Settings = {
  defaultBang: "ddg",
  disableDdgAds: true,
  disableDdgPromos: true,
  disableGoogleAi: false,
  customBangs: [],
  redditSiteSearch: true,
  multiBangEnabled: true,
  questionBang: "ddg-ai",
  questionBangEnabled: true,
  ddgAiQuickAnswers: true,
  searchTypesEnabled: true,
  imagesBang: "",
  videosBang: "",
  newsBang: "",
};

describe("search type providers", () => {
  test("maps common default bangs to search providers", () => {
    expect(providerForBang("g")).toBe("google");
    expect(providerForBang("ddg")).toBe("duckduckgo");
    expect(providerForBang("startpage")).toBe("startpage");
    expect(providerForBang("kagi")).toBe("kagi");
    expect(providerForBang("brave")).toBe("brave");
    expect(providerForBang("bing")).toBe("bing");
    expect(providerForBang("ecosia")).toBe("ecosia");
    expect(providerForBang("qwant")).toBe("qwant");
    expect(providerForBang("mojeek")).toBe("mojeek");
    expect(providerForBang("yt")).toBe("youtube");
  });

  test("provides default-bang options for general search engines", () => {
    expect(
      SEARCH_PROVIDERS.filter((provider) => provider.defaultBang).map(
        (provider) => provider.defaultBang,
      ),
    ).toEqual([
      "g",
      "ddg",
      "startpage",
      "kagi",
      "brave",
      "bing",
      "ecosia",
      "qwant",
      "mojeek",
    ]);
  });

  test("uses a type bang from the default provider", () => {
    expect(autoTypeBang("images", "g")).toBe("gi");
    expect(autoTypeBang("videos", "ddg")).toBe("ddgv");
    expect(autoTypeBang("news", "startpage")).toBe("startpage-news");
    expect(autoTypeBang("news", "bing")).toBe("bnews");
    expect(autoTypeBang("images", "qwant")).toBe("qwi");
    expect(autoTypeBang("images", "mojeek")).toBe("mojeek-images");
    expect(autoTypeBang("videos", "yt")).toBe("yt");
  });

  test("uses configured bangs before the default provider", () => {
    const settings = {
      ...baseSettings,
      defaultBang: "g",
      imagesBang: "qwi",
      newsBang: "brave-news",
    };
    expect(configuredTypeBang("images", settings)).toBe("qwi");
    expect(configuredTypeBang("videos", settings)).toBe("gv");
    expect(configuredTypeBang("news", settings)).toBe("brave-news");
    expect(configuredTypeProvider("images", settings)).toBe("qwant");
    expect(configuredTypeProvider("videos", settings)).toBe("auto");
    expect(configuredTypeProvider("news", settings)).toBe("brave");
  });

  test("recognizes custom bang targets", () => {
    expect(
      configuredTypeProvider("images", {
        ...baseSettings,
        imagesBang: "my-image-search",
      }),
    ).toBe("custom");
  });

  test("maps generic aliases when search types are enabled", () => {
    expect(resolveTypeTrigger("i", baseSettings)).toEqual({
      type: "images",
      target: "ddgi",
    });
    expect(resolveTypeTrigger("PICTURES", baseSettings)).toEqual({
      type: "images",
      target: "ddgi",
    });
    expect(resolveTypeTrigger("v", baseSettings)).toEqual({
      type: "videos",
      target: "ddgv",
    });
    expect(resolveTypeTrigger("news", baseSettings)).toEqual({
      type: "news",
      target: "ddgn",
    });
  });

  test("lets custom bangs and the disabled setting take precedence", () => {
    expect(
      resolveTypeTrigger("i", {
        ...baseSettings,
        customBangs: [
          { t: "i", d: "example.com", u: "https://example.com/?q=%s" },
        ],
      }),
    ).toBeNull();
    expect(
      resolveTypeTrigger("i", {
        ...baseSettings,
        searchTypesEnabled: false,
      }),
    ).toBeNull();
  });

  test("does not create a type alias loop", () => {
    expect(
      resolveTypeTrigger("images", {
        ...baseSettings,
        imagesBang: "img",
      }),
    ).toBeNull();
  });
});

import { describe, expect, test } from "bun:test";
import { BangCatalog } from "../src/core/bang-index";
import { resolveMultiBangs, resolveRoute } from "../src/core/resolve";
import { bangs as fullBangs } from "../src/generated/bangs-full";
import type { CustomBang, Settings } from "../src/core/types";

const baseSettings: Settings = {
  defaultBang: "ddg",
  disableDdgAds: true,
  disableDdgPromos: true,
  duckAssist: "2",
  disableGoogleAi: false,
  customBangs: [],
  redditSiteSearch: true,
  multiBangEnabled: true,
  questionBang: "chatgpt",
  questionBangEnabled: true,
};

function makeCatalog(customBangs: CustomBang[] = []): BangCatalog {
  return new BangCatalog([], customBangs, async () => fullBangs);
}

describe("resolveRoute", () => {
  test("returns home for an empty query", async () => {
    expect(await resolveRoute("", baseSettings, makeCatalog())).toEqual({
      kind: "home",
    });
  });

  test("uses the default bang and applies its settings", async () => {
    const route = await resolveRoute("cats", baseSettings, makeCatalog());
    expect(route.kind).toBe("single");
    if (route.kind !== "single") return;
    expect(route.url).toContain("duckduckgo.com");
    expect(route.url).toContain("q=cats");
    expect(route.url).toContain("k1=-1");
    expect(route.url).toContain("kak=-1");
  });

  test("resolves Helium aliases through their canonical records", async () => {
    const catalog = makeCatalog();

    const ddg = await resolveRoute("!duckduckgo cats", baseSettings, catalog);
    expect(ddg.kind).toBe("single");
    if (ddg.kind === "single") {
      expect(ddg.url).toContain("duckduckgo.com");
      expect(ddg.url).toContain("k1=-1");
    }

    const youtube = await resolveRoute(
      "!youtube cats",
      baseSettings,
      catalog,
    );
    expect(youtube.kind).toBe("single");
    if (youtube.kind === "single") {
      expect(youtube.url).toBe(
        "https://www.youtube.com/results?search_query=cats",
      );
    }
  });

  test("normalizes trigger case", async () => {
    const route = await resolveRoute("!G cats", baseSettings, makeCatalog());
    expect(route.kind).toBe("single");
    if (route.kind === "single") {
      expect(route.url).toBe("https://www.google.com/search?q=cats");
    }
  });

  test("supports punctuation and Unicode triggers", async () => {
    const catalog = makeCatalog();
    const cpp = await resolveRoute("!c++ pointers", baseSettings, catalog);
    expect(cpp.kind).toBe("single");
    if (cpp.kind === "single") {
      expect(cpp.url).toBe("https://www.cplusplus.com/search.do?q=pointers");
    }

    const germanAmazon = await resolveRoute(
      "!a.de katze",
      baseSettings,
      catalog,
    );
    expect(germanAmazon.kind).toBe("single");
    if (germanAmazon.kind === "single") {
      expect(germanAmazon.url).toBe("https://www.amazon.de/s?k=katze");
    }

    const cyrillic = await resolveRoute("!в тест", baseSettings, catalog);
    expect(cyrillic.kind).toBe("single");
    if (cyrillic.kind === "single") {
      expect(cyrillic.url).toContain("uk.m.wikipedia.org");
      expect(cyrillic.url).toContain("%D1%82%D0%B5%D1%81%D1%82");
    }
  });

  test("implements empty-query snap and base-path behavior", async () => {
    const catalog = makeCatalog();
    const hn = await resolveRoute("!hn", baseSettings, catalog);
    expect(hn.kind).toBe("single");
    if (hn.kind === "single") {
      expect(hn.url).toBe("https://hn.algolia.com");
    }

    const archived = await resolveRoute("!archived", baseSettings, catalog);
    expect(archived.kind).toBe("single");
    if (archived.kind === "single") {
      expect(archived.url).toBe("https://web.archive.org/");
    }
  });

  test("honors encoding and space-to-plus flags", async () => {
    const catalog = makeCatalog();

    const hn = await resolveRoute("!hn hello world", baseSettings, catalog);
    expect(hn.kind).toBe("single");
    if (hn.kind === "single") {
      expect(hn.url).toBe("https://hn.algolia.com/?q=hello+world");
    }

    const encoded = await resolveRoute(
      "!oxlint encode spaces",
      baseSettings,
      catalog,
    );
    expect(encoded.kind).toBe("single");
    if (encoded.kind === "single") {
      expect(encoded.url).toContain("/encode+spaces");
    }

    const unencoded = await resolveRoute(
      "!archived hello world",
      baseSettings,
      catalog,
    );
    expect(unencoded.kind).toBe("single");
    if (unencoded.kind === "single") {
      expect(unencoded.url).toContain("hello world");
    }

    const sgdb = await resolveRoute(
      "!sgdb hello world",
      baseSettings,
      catalog,
    );
    expect(sgdb.kind).toBe("single");
    if (sgdb.kind === "single") {
      expect(sgdb.url).toBe(
        "https://www.steamgriddb.com/search/grids?term=hello+world",
      );
    }
  });

  test("rewrites !r according to settings", async () => {
    const rewritten = await resolveRoute("!r cats", baseSettings, makeCatalog());
    expect(rewritten.kind).toBe("single");
    if (rewritten.kind === "single") {
      expect(rewritten.url).toContain("duckduckgo.com");
      expect(rewritten.url).toContain("cats+site%3Areddit.com");
    }

    const direct = await resolveRoute(
      "!r cats",
      { ...baseSettings, redditSiteSearch: false },
      makeCatalog(),
    );
    expect(direct.kind).toBe("single");
    if (direct.kind === "single") {
      expect(direct.url).toBe(
        "https://www.reddit.com/search?q=cats",
      );
    }
  });

  test("applies Google AI settings whenever Google is selected", async () => {
    const asDefault = await resolveRoute(
      "!g cats",
      { ...baseSettings, defaultBang: "g", disableGoogleAi: true },
      makeCatalog(),
    );
    expect(asDefault.kind).toBe("single");
    if (asDefault.kind === "single") {
      expect(asDefault.url).toContain("cats+-ai");
    }

    const explicit = await resolveRoute(
      "!g cats",
      { ...baseSettings, defaultBang: "ddg", disableGoogleAi: true },
      makeCatalog(),
    );
    expect(explicit.kind).toBe("single");
    if (explicit.kind === "single") {
      expect(explicit.url).toContain("cats+-ai");
    }
  });

  test("uses the configured bang for a trailing question mark", async () => {
    const route = await resolveRoute(
      "what is rust?",
      baseSettings,
      makeCatalog(),
    );
    expect(route.kind).toBe("single");
    if (route.kind === "single") {
      expect(route.url).toContain("chatgpt.com");
      expect(route.url).toContain("what+is+rust");
      expect(route.url).not.toContain("%3F");
    }
  });

  test("only applies the question shortcut at the very end without an explicit bang", async () => {
    const middle = await resolveRoute(
      "what? is rust",
      baseSettings,
      makeCatalog(),
    );
    expect(middle.kind).toBe("single");
    if (middle.kind === "single") {
      expect(middle.url).toContain("duckduckgo.com");
    }

    const explicit = await resolveRoute(
      "what is rust? !g",
      baseSettings,
      makeCatalog(),
    );
    expect(explicit.kind).toBe("single");
    if (explicit.kind === "single") {
      expect(explicit.url).toContain("google.com");
      expect(explicit.url).toContain("%3F");
    }
  });

  test("can disable the question shortcut", async () => {
    const route = await resolveRoute(
      "what is rust?",
      { ...baseSettings, questionBangEnabled: false },
      makeCatalog(),
    );
    expect(route.kind).toBe("single");
    if (route.kind === "single") {
      expect(route.url).toContain("duckduckgo.com");
      expect(route.url).toContain("%3F");
    }
  });

  test("falls back normally when the question bang is unavailable", async () => {
    const route = await resolveRoute(
      "what is rust?",
      { ...baseSettings, questionBang: "missing-question-bang" },
      makeCatalog(),
    );
    expect(route.kind).toBe("single");
    if (route.kind === "single") {
      expect(route.url).toContain("duckduckgo.com");
    }
  });

  test("applies default settings when an unknown bang falls back", async () => {
    const route = await resolveRoute("!notreal cats", baseSettings, makeCatalog());
    expect(route.kind).toBe("single");
    if (route.kind === "single") {
      expect(route.url).toContain("duckduckgo.com");
      expect(route.url).toContain("q=cats");
      expect(route.url).toContain("k1=-1");
    }
  });

  test("falls back to DDG when the saved default is invalid", async () => {
    const route = await resolveRoute(
      "cats",
      { ...baseSettings, defaultBang: "does-not-exist" },
      makeCatalog(),
    );
    expect(route.kind).toBe("single");
    if (route.kind === "single") {
      expect(route.url).toContain("duckduckgo.com");
    }
  });

  test("lets a custom bang override a bundled trigger", async () => {
    const catalog = makeCatalog([
      {
        t: "g",
        d: "example.com",
        u: "https://example.com/search?q=%s",
      },
    ]);
    const route = await resolveRoute("!g cats", baseSettings, catalog);
    expect(route.kind).toBe("single");
    if (route.kind === "single") {
      expect(route.url).toBe("https://example.com/search?q=cats");
    }

    const noGoogleBehavior = await resolveRoute(
      "!g cats",
      { ...baseSettings, defaultBang: "g", disableGoogleAi: true },
      catalog,
    );
    expect(noGoogleBehavior.kind).toBe("single");
    if (noGoogleBehavior.kind === "single") {
      expect(noGoogleBehavior.url).toBe("https://example.com/search?q=cats");
    }
  });

  test("preserves slashes for custom bangs", async () => {
    const custom = await resolveRoute(
      "!path Foo/Bar",
      baseSettings,
      makeCatalog([
        {
          t: "path",
          d: "example.com",
          u: "https://example.com/wiki/%s",
        },
      ]),
    );
    expect(custom.kind).toBe("single");
    if (custom.kind === "single") {
      expect(custom.url).toBe("https://example.com/wiki/Foo/Bar");
    }
  });

  test("routes multiple recognizable bangs to the multi result", async () => {
    const route = await resolveRoute(
      "cats !g !r",
      baseSettings,
      makeCatalog(),
    );
    expect(route.kind).toBe("multi");
    if (route.kind !== "multi") return;
    expect(route.query).toBe("cats");
    expect(route.triggers).toEqual(["g", "r"]);
    expect(route.urls).toHaveLength(2);
    expect(route.unresolved).toEqual([]);
  });

  test("reports unresolved triggers alongside valid multi bangs", async () => {
    const route = await resolveRoute(
      "cats !g !r !missing",
      baseSettings,
      makeCatalog(),
    );
    expect(route.kind).toBe("multi");
    if (route.kind !== "multi") return;
    expect(route.triggers).toEqual(["g", "r"]);
    expect(route.unresolved).toEqual(["missing"]);
  });

  test("multi-bang disabled leaves later bang tokens as query text", async () => {
    const route = await resolveRoute(
      "cats !g !r",
      { ...baseSettings, multiBangEnabled: false },
      makeCatalog(),
    );
    expect(route.kind).toBe("single");
    if (route.kind === "single") {
      expect(route.url).toContain("google.com");
      expect(route.url).toContain("cats+!r");
    }
  });

  test("loads the full dataset only when the hot/custom index misses", async () => {
    let loads = 0;
    const catalog = new BangCatalog([], [], async () => {
      loads++;
      return fullBangs;
    });
    await resolveRoute("!a.de test", baseSettings, catalog);
    expect(loads).toBe(1);
    await resolveRoute("!a.ae test", baseSettings, catalog);
    expect(loads).toBe(1);
  });

  test("suggests cold triggers after the full index loads", async () => {
    const catalog = makeCatalog();
    await catalog.ensureFull();
    expect(catalog.suggest("kass")).toEqual([
      expect.objectContaining({
        trigger: "kassistant",
        domain: "kagi.com",
      }),
    ]);
    expect(catalog.allTriggers()).toContain("kassistant");
  });
});

describe("resolveMultiBangs", () => {
  test("resolves all requested triggers with shared behavior", async () => {
    const result = await resolveMultiBangs(
      "cats",
      ["g", "r"],
      baseSettings,
      makeCatalog(),
    );
    expect(result.triggers).toEqual(["g", "r"]);
    expect(result.urls).toHaveLength(2);
    expect(result.urls[0]).toContain("google.com");
    expect(result.urls[1]).toContain("site%3Areddit.com");
  });

  test("supports empty queries for base-page bangs", async () => {
    const result = await resolveMultiBangs(
      "",
      ["hn", "archived"],
      baseSettings,
      makeCatalog(),
    );
    expect(result.urls).toEqual([
      "https://hn.algolia.com",
      "https://web.archive.org/",
    ]);
  });
});

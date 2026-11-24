import { describe, expect, test } from "bun:test";
import {
  appHomeUrl,
  buildMultiBangUrl,
  readBangTriggers,
  readQuery,
} from "../src/core/navigation";

describe("multi-bang navigation", () => {
  test("builds a base-path-safe URL with repeated bang parameters", () => {
    const url = buildMultiBangUrl(
      "https://example.com/quackly/",
      "cats and dogs",
      ["g", "r"],
      ["missing"],
    );
    const parsed = new URL(url);
    expect(parsed.pathname).toBe("/quackly/multibang.html");
    expect(parsed.searchParams.get("q")).toBe("cats and dogs");
    expect(parsed.searchParams.getAll("bang")).toEqual(["g", "r"]);
    expect(parsed.searchParams.getAll("miss")).toEqual(["missing"]);
  });

  test("supports legacy comma-separated bangs parameters", () => {
    expect(readBangTriggers("?q=cats&bangs=g,r")).toEqual(["g", "r"]);
    expect(readBangTriggers("?q=cats&bang=G&bang=r")).toEqual(["g", "r"]);
    expect(readQuery("?q=cats")).toBe("cats");
  });

  test("builds a base-relative home URL", () => {
    expect(appHomeUrl("https://example.com/quackly/multibang.html")).toBe(
      "https://example.com/quackly/",
    );
  });
});

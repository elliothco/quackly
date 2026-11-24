/**
 * Quackly developer bangs and Helium overrides.
 *
 * Add entries here, then run `bun run sync:bangs`.
 * Generated files are committed; normal builds do not need network access.
 *
 * - `trigger`: the primary bang name, without `!`
 * - `aliases`: optional extra names for the same URL
 * - `url`: must use `{searchTerms}`, `{{{s}}}`, or `%s` for the query
 * - `format`: optional format flags; omit for Helium's default of all flags
 */

export type DeveloperBangFormat =
  | "open_base_path"
  | "open_snap_domain"
  | "url_encode_placeholder"
  | "url_encode_space_to_plus";

export interface DeveloperBang {
  trigger: string;
  aliases?: readonly string[];
  url: string;
  format?: readonly DeveloperBangFormat[];
}

export const developerBangs: readonly DeveloperBang[] = [
  {
    trigger: "ddg-ai",
    aliases: ["ddg-chat"],
    url: "https://duck.ai/chat?ia=chat&duckai=1&home=1&q={searchTerms}",
    format: [
      "open_base_path",
      "url_encode_placeholder",
      "url_encode_space_to_plus",
    ],
  },
];

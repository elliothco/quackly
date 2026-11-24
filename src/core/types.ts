export type FormatFlag =
  | "open_base_path"
  | "open_snap_domain"
  | "url_encode_placeholder"
  | "url_encode_space_to_plus";

/**
 * Compact, generated representation of a bang.
 *
 * [trigger, canonical, domain, template, snapDomain, regex, formatMask]
 *
 * A formatMask of -1 means Helium's default of all flags enabled. An explicit
 * empty fmt array is represented by 0.
 */
export type CompactBang = readonly [
  trigger: string,
  canonical: string,
  domain: string,
  template: string,
  snapDomain: string,
  regex: string,
  formatMask: number,
];

export interface BangRecord {
  trigger: string;
  canonical: string;
  domain: string;
  template: string;
  snapDomain: string;
  regex: string;
  formatMask: number;
}

/** Legacy shape kept in localStorage for custom bangs. */
export interface CustomBang {
  t: string;
  d: string;
  u: string;
}

export interface Settings {
  defaultBang: string;
  disableDdgAds: boolean;
  disableDdgPromos: boolean;
  duckAssist: string;
  disableGoogleAi: boolean;
  customBangs: CustomBang[];
  redditSiteSearch: boolean;
  multiBangEnabled: boolean;
  questionBang: string;
  questionBangEnabled: boolean;
}

export type Route =
  | { kind: "home" }
  | { kind: "single"; url: string }
  | {
      kind: "multi";
      query: string;
      urls: string[];
      triggers: string[];
      unresolved: string[];
    };

export interface ResolvedMulti {
  urls: string[];
  triggers: string[];
  unresolved: string[];
}

export interface BangLookup {
  get(trigger: string): BangRecord | undefined;
  lookupWithFull(trigger: string): Promise<BangRecord | undefined>;
}

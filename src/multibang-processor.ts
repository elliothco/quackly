import { bangs as builtInBangs } from "./bang";
import "./global.css"; // For consistent theming

// Defines the structure for a bang object.
type Bang = { t: string; d: string; u: string };

// Keys used for localStorage to persist user settings.
const LS_KEYS = {
  defaultBang: "default-bang",
  disableDdgAds: "disable-ddg-ads",
  disableDdgPromos: "disable-ddg-promos",
  duckAssist: "duck-assist-setting",
  disableGoogleAi: "disable-google-ai-overview",
  customBangs: "custom-bangs",
  redditSiteSearch: "reddit-site-search-enabled",
  multiBangEnabled: "multi-bang-enabled",
};

// Utility to retrieve a string from localStorage, with an optional default.
const getStr = (k: string, def = ""): string => localStorage.getItem(k) ?? def;
// Utility to retrieve a boolean from localStorage. Returns false if not 'true'.
const getBool = (k: string): boolean => localStorage.getItem(k) === "true";
// Utility to retrieve a boolean from localStorage with a specified default value.
const getBoolWithDefault = (k: string, def: boolean): boolean => {
  const value = localStorage.getItem(k);
  if (value === null) return def;
  return value === "true";
};

// Initialize custom bangs from localStorage.
let customBangs: Bang[] = JSON.parse(getStr(LS_KEYS.customBangs, "[]"));
// Combine built-in and custom bangs for comprehensive search capabilities.
const allBangs: Bang[] = [...builtInBangs, ...customBangs];
// Get the user's default bang trigger, defaulting to 'ddg' (DuckDuckGo).
const defaultTrigger = getStr(LS_KEYS.defaultBang, "ddg");

// Parse URL parameters for the search query and requested bangs.
const urlParams = new URLSearchParams(window.location.search);
const query = urlParams.get("q")?.trim() ?? "";
const bangsParam = urlParams.get("bangs") ?? "";

// Get references to DOM elements for displaying states and interacting.
const automaticStateDiv = document.getElementById(
  "automatic-state",
) as HTMLDivElement;
const fallbackStateDiv = document.getElementById(
  "fallback-state",
) as HTMLDivElement;
const siteHostSpan = document.getElementById("site-host") as HTMLSpanElement;
const openAllButton = document.getElementById(
  "openAllButton",
) as HTMLButtonElement;

// Populate the site host in the fallback message.
if (siteHostSpan) {
  siteHostSpan.textContent = window.location.host;
}

// Redirect to home if essential parameters are missing.
if (!bangsParam || !query) {
  window.location.replace("/");
  throw new Error("Missing parameters, redirecting.");
}

// Split the comma-separated bang triggers from the URL.
const bangTriggers = bangsParam.split(",").filter(Boolean);
// Array to store the final URLs constructed for each bang.
const urlsToOpen: string[] = [];

// Process each requested bang to construct its corresponding search URL.
bangTriggers.forEach((trigger) => {
  let selectedBang = allBangs.find((b) => b.t === trigger);

  // Skip unknown bangs.
  if (!selectedBang) {
    console.warn(`Multi-bang: Bang !${trigger} not found. Skipping.`);
    return;
  }

  let cleanQueryForThisBang = query;
  // Determine if default settings should apply to this specific bang's URL.
  let isApplyingDefaultSettings = selectedBang.t === defaultTrigger;

  // Apply the !r rewrite rule if enabled in settings.
  if (trigger === "r" && getBoolWithDefault(LS_KEYS.redditSiteSearch, true)) {
    cleanQueryForThisBang = `${cleanQueryForThisBang} site:reddit.com`.trim();

    // When !r is rewritten, the default search engine is used.
    const defaultSearchBang =
      allBangs.find((b) => b.t === defaultTrigger) ||
      builtInBangs.find((b) => b.t === "g"); // Fallback to Google.

    if (defaultSearchBang) {
      selectedBang = defaultSearchBang;
      isApplyingDefaultSettings = true; // Default settings now apply.
    } else {
      console.warn(
        "Multi-bang: Could not determine default search engine for !r redirect.",
      );
      return;
    }
  }

  // Apply Google-specific settings if it's the 'g' bang and default settings apply.
  if (selectedBang.t === "g" && isApplyingDefaultSettings) {
    if (getBool(LS_KEYS.disableGoogleAi)) {
      cleanQueryForThisBang = `${cleanQueryForThisBang} -ai`; // Append -ai to disable AI Overview.
    }
  }

  // Construct the search URL, replacing the query placeholder.
  let searchUrl = selectedBang.u.replace(
    "{{{s}}}",
    encodeURIComponent(cleanQueryForThisBang).replace(/%2F/g, "/"), // Preserve slashes for URLs.
  );

  // Apply DuckDuckGo-specific settings if it's the 'ddg' bang and default settings apply.
  if (selectedBang.t === "ddg" && isApplyingDefaultSettings) {
    if (getBoolWithDefault(LS_KEYS.disableDdgAds, true)) {
      searchUrl = `${searchUrl}&k1=-1`; // Parameter to disable ads.
    }
    if (getBoolWithDefault(LS_KEYS.disableDdgPromos, true)) {
      searchUrl = `${searchUrl}&kak=-1&kax=-1&kaq=-1&kap=-1`; // Parameters to disable promos.
    }
    if (getStr(LS_KEYS.duckAssist, "2") !== "2") {
      searchUrl = `${searchUrl}&kbe=${getStr(LS_KEYS.duckAssist, "2")}`; // DuckAssist setting.
    }
  }
  urlsToOpen.push(searchUrl); // Add the constructed URL to the list.
});

console.log("--- Multi-Bang Processor Initializing ---");
console.log(`Query: "${query}"`);
console.log(`Bangs requested: ${bangsParam}`);
console.log(`URLs prepared for opening (${urlsToOpen.length}):`, urlsToOpen);

// Function to open all URLs as new tabs/windows.
const openAllUrls = (): number => {
  let successfullyOpenedCount = 0;
  // For initial automatic opening, open all but the first URL as new popups.
  const urlsToOpenAsPopups = urlsToOpen.slice(1);

  urlsToOpenAsPopups.forEach((url, index) => {
    const newWindow = window.open(url, "_blank");
    console.log(
      `Attempting to open popup ${url} (Popup Tab ${index + 1}). Result:`,
      newWindow,
    );
    if (newWindow) {
      successfullyOpenedCount++;
    } else {
      console.warn(`Pop-up blocker likely prevented opening: ${url}`);
    }
  });
  return successfullyOpenedCount;
};

// 1. Attempt to open tabs automatically on page load.
const initialPopupsOpenedCount = openAllUrls();

// Check if all *intended popups* were opened successfully
// AND if there's at least one URL to redirect the current page to.
if (
  initialPopupsOpenedCount === urlsToOpen.length - 1 &&
  urlsToOpen.length > 0
) {
  // All popups opened successfully, redirect the current page to the first URL.
  console.log(
    "All necessary tabs opened automatically. Redirecting current page to the first URL.",
  );
  window.location.replace(urlsToOpen[0]);
} else {
  // Pop-ups were blocked, or no additional URLs to open automatically.
  // Show the fallback UI, prompting the user to manually open tabs.
  console.log(
    "Pop-ups were blocked or no URLs to open. Showing fallback option.",
  );
  automaticStateDiv.classList.add("hidden");
  fallbackStateDiv.classList.remove("hidden");

  // A separate function for the fallback button to open *all* URLs (including the first).
  const openAllUrlsFromButton = (): number => {
    let successfullyOpenedCount = 0;
    urlsToOpen.forEach((url, index) => {
      const newWindow = window.open(url, "_blank");
      console.log(
        `Attempting to open ${url} (Manual Tab ${index + 1}). Result:`,
        newWindow,
      );
      if (newWindow) {
        successfullyOpenedCount++;
      } else {
        console.warn(`Pop-up blocker likely prevented opening: ${url}`);
      }
    });
    return successfullyOpenedCount;
  };

  // Attach event listener to the fallback button.
  if (openAllButton) {
    openAllButton.addEventListener("click", () => {
      console.log("Manual 'Open Tabs' button clicked. Retrying tab opens.");
      openAllUrlsFromButton(); // This time, all URLs are opened directly from user click.

      openAllButton.disabled = true;
      openAllButton.textContent = "Tabs Opened!";

      console.log(
        "Please close this tab manually after your search results have opened.",
      );
    });
  }
}

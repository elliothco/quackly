import { createAppCatalog } from "./core/app-catalog";
import {
  appHomeUrl,
  readBangTriggers,
  readQuery,
  readUnresolvedTriggers,
} from "./core/navigation";
import { resolveMultiBangs } from "./core/resolve";
import { loadSettings } from "./core/settings";

const automaticState = document.getElementById(
  "automatic-state",
) as HTMLDivElement | null;
const fallbackState = document.getElementById(
  "fallback-state",
) as HTMLDivElement | null;
const fallbackTitle = document.getElementById(
  "fallback-title",
) as HTMLHeadingElement | null;
const fallbackWarning = document.getElementById(
  "fallback-warning",
) as HTMLParagraphElement | null;
const fallbackMessage = document.getElementById(
  "fallback-message",
) as HTMLParagraphElement | null;
const fallbackDetail = document.getElementById(
  "fallback-detail",
) as HTMLParagraphElement | null;
const siteHost = document.getElementById(
  "site-host",
) as HTMLSpanElement | null;
const openAllButton = document.getElementById(
  "openAllButton",
) as HTMLButtonElement | null;
const homeLink = document.getElementById("home-link") as HTMLAnchorElement | null;

const opened = new Set<number>();
let urls: string[] = [];
let unresolved: string[] = [];

function setHostText(): void {
  if (siteHost) siteHost.textContent = window.location.host;
}

function openIndices(indices: readonly number[]): number {
  let openedNow = 0;
  for (const index of indices) {
    if (opened.has(index)) continue;
    const popup = window.open(urls[index], "_blank");
    if (popup) {
      opened.add(index);
      openedNow++;
    }
  }
  return openedNow;
}

function remainingIndexes(): number[] {
  return urls.map((_, index) => index).filter((index) => !opened.has(index));
}

function showFallback(
  title: string,
  warning: string,
  message: string,
  showButton: boolean,
): void {
  automaticState?.classList.add("hidden");
  fallbackState?.classList.remove("hidden");
  if (fallbackTitle) fallbackTitle.textContent = title;
  if (fallbackWarning) fallbackWarning.textContent = warning;
  if (fallbackMessage) fallbackMessage.textContent = message;
  if (openAllButton) openAllButton.hidden = !showButton;
}

function refreshRemainingUi(): void {
  const remaining = remainingIndexes();
  if (!openAllButton) return;

  if (remaining.length === 0) {
    openAllButton.hidden = true;
    if (fallbackTitle) fallbackTitle.textContent = "Tabs Opened";
    if (fallbackWarning) {
      fallbackWarning.textContent = "All requested tabs were opened.";
    }
    if (fallbackDetail) {
      fallbackDetail.textContent = "You can close this tab.";
    }
    return;
  }

  openAllButton.hidden = false;
  openAllButton.disabled = false;
  openAllButton.textContent = `Open remaining tabs (${remaining.length})`;
  if (fallbackDetail) {
    fallbackDetail.textContent = `${remaining.length} of ${urls.length} destinations are still closed.`;
  }
}

function showBlockedFallback(): void {
  const warning =
    opened.size > 0
      ? `${opened.size} tab(s) opened, but the browser blocked the rest.`
      : "Your browser blocked automatic tabs.";
  showFallback(
    "Please Enable Pop-Ups",
    warning,
    `Please allow pop-ups for ${window.location.host}, then open the remaining tabs.`,
    true,
  );
  refreshRemainingUi();
  if (fallbackDetail && unresolved.length > 0) {
    fallbackDetail.textContent += ` Unavailable bangs: ${unresolved
      .map((trigger) => `!${trigger}`)
      .join(", ")}.`;
  }
}

function showNoResultsFallback(): void {
  showFallback(
    "No valid bangs",
    "None of the requested bangs could be resolved.",
    unresolved.length > 0
      ? `Unavailable bangs: ${unresolved.map((trigger) => `!${trigger}`).join(", ")}.`
      : "Return to Quackly and try a different search.",
    false,
  );
  if (fallbackDetail) {
    fallbackDetail.textContent =
      "No tabs were opened. Return to Quackly and try another search.";
  }
}

async function main(): Promise<void> {
  setHostText();
  if (homeLink) homeLink.href = appHomeUrl(document.baseURI);

  const settings = loadSettings(window.localStorage);
  const catalog = createAppCatalog(settings.customBangs);
  const query = readQuery(window.location.search);
  const triggers = readBangTriggers(window.location.search);
  const passedUnresolved = readUnresolvedTriggers(window.location.search);

  if (triggers.length === 0) {
    window.location.replace(appHomeUrl(document.baseURI));
    return;
  }

  const result = await resolveMultiBangs(query, triggers, settings, catalog);
  urls = result.urls;
  unresolved = [...new Set([...passedUnresolved, ...result.unresolved])];

  if (urls.length === 0) {
    showNoResultsFallback();
    return;
  }

  if (urls.length === 1) {
    window.location.replace(urls[0]);
    return;
  }

  const backgroundIndexes = urls.map((_, index) => index).slice(1);
  openIndices(backgroundIndexes);

  if (backgroundIndexes.every((index) => opened.has(index))) {
    window.location.replace(urls[0]);
    return;
  }

  showBlockedFallback();
}

openAllButton?.addEventListener("click", () => {
  const remaining = remainingIndexes();
  openIndices(remaining);
  refreshRemainingUi();
});

main().catch((error) => {
  console.error("Multi-bang page failed:", error);
  showFallback(
    "Could not open results",
    "Quackly could not load the requested bangs.",
    "Return to Quackly and try again.",
    false,
  );
});

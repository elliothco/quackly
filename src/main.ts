import "./global.css";
import { createAppCatalog, hotBangs } from "./core/app-catalog";
import { buildMultiBangUrl } from "./core/navigation";
import { resolveRoute } from "./core/resolve";
import {
  DEFAULT_QUESTION_BANG,
  FALLBACK_BANG,
  loadSettings,
  validateCustomBang,
  writeCustomBangs,
  writeSetting,
} from "./core/settings";
import { normalizeTrigger, normalizeValidTrigger } from "./core/trigger";
import type { BangRecord, CustomBang, Settings } from "./core/types";

const storage = window.localStorage;
let settings: Settings = loadSettings(storage);
const catalog = createAppCatalog(settings.customBangs);
const BASE_URL = window.location.origin + window.location.pathname;

function showToast(message: string): void {
  const toast = document.createElement("div");
  toast.className = "toast";
  toast.textContent = message;
  document.body.appendChild(toast);
  requestAnimationFrame(() => toast.classList.add("visible"));
  setTimeout(() => {
    toast.classList.remove("visible");
    toast.addEventListener("transitionend", () => toast.remove(), {
      once: true,
    });
  }, 1800);
}

function setCustomBangs(customBangs: CustomBang[]): void {
  settings = { ...settings, customBangs };
  catalog.setCustomBangs(customBangs);
  writeCustomBangs(storage, customBangs);
}

function setDefaultBang(trigger: string): void {
  settings = { ...settings, defaultBang: trigger };
  writeSetting(storage, "defaultBang", trigger);
}

async function updateBangSpecificSettings(
  ddgGroups: readonly HTMLElement[],
  ddgHints: readonly HTMLElement[],
  googleGroups: readonly HTMLElement[],
  googleHints: readonly HTMLElement[],
  controls: {
    ads: HTMLInputElement;
    promos: HTMLInputElement;
    assist: HTMLSelectElement;
    googleAi: HTMLInputElement;
  },
): Promise<void> {
  for (const element of [...ddgGroups, ...ddgHints]) {
    element.style.display = "none";
  }
  for (const element of googleGroups) element.style.display = "flex";
  for (const element of googleHints) element.style.display = "block";

  controls.ads.disabled = true;
  controls.promos.disabled = true;
  controls.assist.disabled = true;
  controls.ads.checked = false;
  controls.promos.checked = false;
  controls.assist.value = "2";
  controls.googleAi.disabled = false;
  controls.googleAi.checked = settings.disableGoogleAi;

  const record = await catalog.lookupWithFull(settings.defaultBang);
  if (record?.canonical === "dax") {
    for (const group of ddgGroups) group.style.display = "flex";
    for (const hint of ddgHints) hint.style.display = "block";
    controls.ads.disabled = false;
    controls.promos.disabled = false;
    controls.assist.disabled = false;
    controls.ads.checked = settings.disableDdgAds;
    controls.promos.checked = settings.disableDdgPromos;
    controls.assist.value = settings.duckAssist;
  }
}

function renderApp(): void {
  const app = document.querySelector<HTMLDivElement>("#app");
  if (!app) return;

  app.innerHTML = `
<div class="main-container">
  <div class="content-wrapper">
    <header class="header">
    <div class="feature-promo-box">
          <span class="emoji"> 🎉 </span>
          <p style="text-align: left;">
            <strong>NEW: Check out Multi-Bang Search!</strong>
            <br /> Search multiple sites at once.
            Learn more in settings.
          </p>
    </div>
    <h1 class="title">
      Quackly
      <svg
        fill="currentColor"
        width="35px"
        height="35px"
        viewBox="0 0 209.322 209.322"
        style="vertical-align: middle;"
      >
        <g>
          <path
            d="M105.572,101.811c9.889-6.368,27.417-16.464,28.106-42.166c0.536-20.278-9.971-49.506-49.155-50.878
                  C53.041,7.659,39.9,28.251,36.071,46.739l-0.928-0.126c-1.932,0-3.438,1.28-5.34,2.889c-2.084,1.784-4.683,3.979-7.792,4.308
                  c-3.573,0.361-8.111-1.206-11.698-2.449c-4.193-1.431-6.624-2.047-8.265-0.759c-1.503,1.163-2.178,3.262-2.028,6.226
                  c0.331,6.326,4.971,18.917,16.016,25.778c7.67,4.765,16.248,5.482,20.681,5.482c0.006,0,0.006,0,0.006,0
                  c2.37,0,4.945-0.239,7.388-0.726c2.741,4.218,5.228,7.476,6.037,9.752c2.054,5.851-27.848,25.087-27.848,55.01
                  c0,29.916,22.013,48.475,56.727,48.475h55.004c30.593,0,70.814-29.908,75.291-92.48C180.781,132.191,167.028,98.15,105.572,101.811
                  z M18.941,77.945C8.775,71.617,4.992,58.922,5.294,55.525c0.897,0.24,2.194,0.689,3.228,1.042
                  c4.105,1.415,9.416,3.228,14.068,2.707c4.799-0.499,8.253-3.437,10.778-5.574c0.607-0.509,1.393-1.176,1.872-1.491
                  c0.87,0.315,0.962,0.693,1.176,3.14c0.196,2.26,0.473,5.37,2.362,9.006c1.437,2.761,3.581,5.705,5.646,8.542
                  c1.701,2.336,4.278,5.871,4.535,6.404c-0.445,1.184-4.907,3.282-12.229,3.282C30.177,82.591,23.69,80.904,18.941,77.945z
                  M56.86,49.368c0-4.938,4.001-8.943,8.931-8.943c4.941,0,8.942,4.005,8.942,8.943c0,4.931-4.001,8.942-8.942,8.942
                  C60.854,58.311,56.86,54.299,56.86,49.368z M149.159,155.398l-20.63,11.169l13.408,9.293c0,0-49.854,15.813-72.198-6.885
                  c-11.006-11.16-13.06-28.533,4.124-38.84c17.184-10.312,84.609,3.943,84.609,3.943L134.295,147.8L149.159,155.398z"
          />
        </g>
      </svg>
    </h1>
    <p class="subtitle">Search, with superpowers.</p>
    <br />
      <p>Quickly search websites with bangs, even faster than DuckDuckGo. Enhance your search experience with extra and customizable features.</p>

      <div class="info-section">
        <p>
          Find a shortcut in
          <a href="https://helium.computer/bangs" target="_blank" rel="noopener noreferrer">
            Helium's bang directory
          </a>
        </p>
      </div>
    </header>

    <div class="search-section">
      <div class="search-container">
        <input
          type="text"
          class="search-input"
          placeholder="Do a search (try !r for Reddit or !gi for Google Images)"
          role="combobox"
          aria-autocomplete="list"
          aria-controls="search-suggestions"
          aria-expanded="false"
          autocomplete="off"
          autofocus
        />
        <button class="search-button" title="Search" aria-label="Search">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="11" cy="11" r="8"></circle>
            <path d="m21 21-4.35-4.35"></path>
          </svg>
        </button>
      </div>
      <div
        id="search-suggestions"
        class="search-suggestions"
        role="listbox"
        aria-label="Bang suggestions"
        hidden
      ></div>
      <div class="search-hint">
        Press Enter to search • No bang? Uses
        <span class="current-default-hint"></span>
      </div>
    </div>
    <div class="setup-section">
      <h3>Browser Setup</h3>
      <p>Add this URL as a custom search engine in your browser:</p>
      <div class="url-container">
        <input type="text" class="url-input" readonly />
        <button class="copy-button" title="Copy URL" aria-label="Copy setup URL">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect width="14" height="14" x="8" y="8" rx="2" ry="2"></rect>
            <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"></path>
          </svg>
        </button>
      </div>
    </div>

    <div class="settings-section">
      <h3>Settings</h3>
      <div class="setting-group">
        <label for="default-bang-input" class="setting-label">Default Bang</label>
        <input
          type="text"
          id="default-bang-input"
          class="setting-input"
          list="bang-suggestions"
          placeholder="!bang"
        />
        <datalist id="bang-suggestions"></datalist>
        <button id="save-default-btn" class="save-button" title="Save Default Bang">Save</button>
      </div>
      <div class="current-note">
        <br />
        Can be set to <span class="bang-highlight">!g</span> for Google, <span class="bang-highlight">!ddg</span> for DuckDuckGo, <span class="bang-highlight">!w</span> for Wikipedia, or any other bang.
      </div>

      <div class="setting-group">
        <input type="checkbox" id="multi-bang-checkbox" class="setting-checkbox" />
        <label for="multi-bang-checkbox" class="setting-label-checkbox">
          Enable Multi-Bang Search
        </label>
      </div>
      <p class="setting-hint">
        Allows you to search multiple sites at the same time by including multiple bangs. <br />
        Ex: <span class="bang-highlight">"cats !r !ddg !g"</span> will open
        Reddit, DuckDuckGo, and Google search results in separate tabs.
      </p>

      <div class="setting-group">
        <input type="checkbox" id="question-bang-enabled" class="setting-checkbox" />
        <label for="question-bang-enabled" class="setting-label-checkbox">
          Use a trailing ? for a chosen bang
        </label>
      </div>
      <p class="setting-hint">
        When enabled, a query ending in <span class="bang-highlight">?</span>
        with no explicit bang goes to
        <span class="bang-highlight current-question-bang"></span>.
        The question mark is removed from the search.
      </p>
      <div class="setting-group">
        <label for="question-bang-input" class="setting-label">Question Bang</label>
        <input
          type="text"
          id="question-bang-input"
          class="setting-input"
          list="bang-suggestions"
          placeholder="!chatgpt"
        />
        <button id="save-question-bang-btn" class="save-button" title="Save Question Bang">Save</button>
      </div>

      <div class="setting-group">
        <input type="checkbox" id="reddit-site-search-checkbox" class="setting-checkbox" />
        <label for="reddit-site-search-checkbox" class="setting-label-checkbox">
          Change !r to "site:reddit.com" search
        </label>
      </div>
      <p class="setting-hint">
        When enabled, searching with <span class="bang-highlight">!r</span> will
        append <code style="font-size: 0.8em;">site:reddit.com</code> to your
        query and use your default search engine, instead of redirecting
        to Reddit directly.
      </p>

      <div class="setting-group bang-specific-setting-group ddg-specific">
        <input type="checkbox" id="disable-ddg-ads" class="setting-checkbox" />
        <label for="disable-ddg-ads" class="setting-label-checkbox">
          Disable DuckDuckGo Search Ads
        </label>
      </div>
      <p class="bang-specific-setting-hint ddg-specific">Only applies when default bang resolves to <span class="bang-highlight">!ddg</span>.</p>

      <div class="setting-group bang-specific-setting-group ddg-specific">
        <input type="checkbox" id="disable-ddg-promos" class="setting-checkbox" />
        <label for="disable-ddg-promos" class="setting-label-checkbox">
          Disable DuckDuckGo Promotions
        </label>
      </div>
      <p class="bang-specific-setting-hint ddg-specific">Hides reminders to install browser extensions and other content. Only applies when default bang resolves to <span class="bang-highlight">!ddg</span>.</p>

      <div class="setting-group bang-specific-setting-group ddg-specific">
        <label for="duck-assist-select" class="setting-label-checkbox">
          DuckDuckGo AI Overview
        </label>
        <select id="duck-assist-select" class="setting-input" style="width: auto; min-width: 150px;">
          <option value="0">Never</option>
          <option value="1">On-Demand</option>
          <option value="2">Sometimes (Default)</option>
          <option value="3">Often</option>
        </select>
      </div>
      <p class="bang-specific-setting-hint ddg-specific">How often DuckDuckGo's AI Overview appears. Only applies when default bang resolves to <span class="bang-highlight">!ddg</span>.</p>

      <div class="setting-group bang-specific-setting-group g-specific">
        <input type="checkbox" id="disable-google-ai-overview" class="setting-checkbox" />
        <label for="disable-google-ai-overview" class="setting-label-checkbox">
          Disable Google AI Overview
        </label>
      </div>
      <p class="bang-specific-setting-hint g-specific">Appends <code style="font-size: 0.8em;">-ai</code> to any Google search, including explicit <span class="bang-highlight">!g</span> searches.</p>
    </div>

    <div class="settings-section">
      <h3>Your Custom Bangs</h3>
      <p class="setting-subtitle">
        Add your own custom bangs here. Bangs are best if they are short and memorable.
        Custom bangs override bundled bangs with the same trigger.
      </p>
      <div id="custom-bangs-list"></div>

      <div id="add-custom-bang-form">
        <input id="new-bang-input" placeholder="!mybang" class="setting-input" />
        <input id="new-url-input" placeholder="https://chatgpt.com/?q=%s" class="setting-input" />
        <button id="add-custom-bang-button" class="save-button">Add</button>
      </div>
    </div>
  </div>

  <footer class="footer">
    Fully open source on <a href="https://github.com/elliothco/quackly" target="_blank" rel="noopener noreferrer">GitHub</a>.
    <br />
    Based on <a href="https://github.com/t3dotgg/unduck" target="_blank" rel="noopener noreferrer">Unduck by Theo</a>.
    <br />
    Bang data from <a href="https://helium.computer/bangs" target="_blank" rel="noopener noreferrer">Helium</a>.
  </footer>
</div>`;

  const $ = <T extends HTMLElement>(selector: string): T | null =>
    app.querySelector(selector);
  const $all = <T extends HTMLElement>(selector: string): NodeListOf<T> =>
    app.querySelectorAll(selector);

  const searchInput = $<HTMLInputElement>(".search-input");
  const searchButton = $<HTMLButtonElement>(".search-button");
  const searchSuggestions = $<HTMLDivElement>("#search-suggestions");
  const currentDefaultHint = $<HTMLSpanElement>(".current-default-hint");
  const urlInput = $<HTMLInputElement>(".url-input");
  const copyButton = $<HTMLButtonElement>(".copy-button");
  const defaultBangInput = $<HTMLInputElement>("#default-bang-input");
  const saveDefaultBtn = $<HTMLButtonElement>("#save-default-btn");
  const suggestions = $<HTMLDataListElement>("#bang-suggestions");
  const customBangsList = $<HTMLDivElement>("#custom-bangs-list");
  const newBangInput = $<HTMLInputElement>("#new-bang-input");
  const newUrlInput = $<HTMLInputElement>("#new-url-input");
  const addCustomBangButton = $<HTMLButtonElement>("#add-custom-bang-button");
  const questionBangEnabledCheckbox = $<HTMLInputElement>(
    "#question-bang-enabled",
  );
  const questionBangInput = $<HTMLInputElement>("#question-bang-input");
  const saveQuestionBangButton = $<HTMLButtonElement>(
    "#save-question-bang-btn",
  );
  const currentQuestionBang = $<HTMLSpanElement>(".current-question-bang");
  let fullSettingsSuggestionsLoaded = false;
  let loadingSettingsSuggestions = false;

  const multiBangCheckbox = $<HTMLInputElement>("#multi-bang-checkbox");
  const redditSiteSearchCheckbox = $<HTMLInputElement>(
    "#reddit-site-search-checkbox",
  );
  const disableDdgAdsCheckbox = $<HTMLInputElement>("#disable-ddg-ads");
  const disableDdgPromosCheckbox = $<HTMLInputElement>("#disable-ddg-promos");
  const duckAssistSelect = $<HTMLSelectElement>("#duck-assist-select");
  const disableGoogleAiOverviewCheckbox = $<HTMLInputElement>(
    "#disable-google-ai-overview",
  );

  if (urlInput) urlInput.value = `${BASE_URL}?q=%s`;

  function showDefault(): void {
    if (defaultBangInput) defaultBangInput.value = `!${settings.defaultBang}`;
    if (currentDefaultHint) {
      currentDefaultHint.textContent = `!${settings.defaultBang}`;
    }
  }

  function showQuestionBang(): void {
    if (questionBangInput) {
      questionBangInput.value = `!${settings.questionBang}`;
    }
    if (questionBangEnabledCheckbox) {
      questionBangEnabledCheckbox.checked = settings.questionBangEnabled;
    }
    if (currentQuestionBang) {
      currentQuestionBang.textContent = `!${settings.questionBang}`;
    }
  }

  function populateSuggestions(): void {
    if (!suggestions) return;
    suggestions.innerHTML = "";
    const triggers = new Set<string>();
    if (fullSettingsSuggestionsLoaded) {
      for (const trigger of catalog.allTriggers()) triggers.add(trigger);
    } else {
      for (const bang of hotBangs) triggers.add(bang[0]);
    }
    for (const bang of settings.customBangs) triggers.add(bang.t);
    triggers.add(settings.defaultBang);

    for (const trigger of [...triggers].sort()) {
      const option = document.createElement("option");
      option.value = `!${trigger}`;
      suggestions.append(option);
    }
  }

  async function loadFullSettingsSuggestions(): Promise<void> {
    if (fullSettingsSuggestionsLoaded || loadingSettingsSuggestions) return;
    loadingSettingsSuggestions = true;
    try {
      await catalog.ensureFull();
      fullSettingsSuggestionsLoaded = true;
      populateSuggestions();
    } catch (error) {
      console.error("Could not load full bang suggestions:", error);
    } finally {
      loadingSettingsSuggestions = false;
    }
  }

  const doSearch = (): void => {
    const query = searchInput?.value.trim() ?? "";
    if (query) {
      window.location.href = `${BASE_URL}?q=${encodeURIComponent(query)}`;
    }
  };

  let suggestionRecords: BangRecord[] = [];
  let activeSuggestionIndex = -1;
  let suggestionRange: { start: number; end: number } | null = null;
  let suggestionRequest = 0;

  function hideSuggestions(): void {
    if (!searchSuggestions || !searchInput) return;
    suggestionRequest++;
    searchSuggestions.hidden = true;
    searchSuggestions.innerHTML = "";
    searchInput.setAttribute("aria-expanded", "false");
    searchInput.removeAttribute("aria-activedescendant");
    suggestionRecords = [];
    activeSuggestionIndex = -1;
    suggestionRange = null;
  }

  function currentBangToken(): {
    prefix: string;
    start: number;
    end: number;
  } | null {
    if (!searchInput) return null;
    const value = searchInput.value;
    const cursor = searchInput.selectionStart ?? value.length;
    const beforeCursor = value.slice(0, cursor);
    const match = /(?:^|\s)(![^\s]*)$/.exec(beforeCursor);
    if (!match) return null;

    const token = match[1];
    const prefix = normalizeTrigger(token.slice(1));
    if (!prefix) return null;

    const start = beforeCursor.length - token.length;
    let end = start;
    while (end < value.length && !/\s/.test(value[end])) end++;

    return { prefix, start, end };
  }

  function selectSuggestion(record: BangRecord): void {
    if (!searchInput || !suggestionRange) return;
    const replacement = `!${record.trigger}`;
    const value = searchInput.value;
    searchInput.value =
      value.slice(0, suggestionRange.start) +
      replacement +
      value.slice(suggestionRange.end);

    const cursor = suggestionRange.start + replacement.length;
    searchInput.focus();
    searchInput.setSelectionRange(cursor, cursor);
    hideSuggestions();
  }

  function setActiveSuggestion(index: number): void {
    if (!searchSuggestions || !searchInput || suggestionRecords.length === 0) {
      return;
    }

    activeSuggestionIndex =
      (index + suggestionRecords.length) % suggestionRecords.length;
    const options = searchSuggestions.querySelectorAll<HTMLElement>(
      ".search-suggestion",
    );
    options.forEach((option, optionIndex) => {
      option.setAttribute(
        "aria-selected",
        String(optionIndex === activeSuggestionIndex),
      );
    });
    searchInput.setAttribute(
      "aria-activedescendant",
      `search-suggestion-${activeSuggestionIndex}`,
    );
    options[activeSuggestionIndex]?.scrollIntoView({ block: "nearest" });
  }

  function renderSuggestions(records: BangRecord[]): void {
    if (!searchSuggestions || !searchInput) return;
    suggestionRecords = records;
    activeSuggestionIndex = -1;
    searchSuggestions.innerHTML = "";

    if (records.length === 0) {
      hideSuggestions();
      return;
    }

    records.forEach((record, index) => {
      const option = document.createElement("button");
      option.type = "button";
      option.id = `search-suggestion-${index}`;
      option.className = "search-suggestion";
      option.setAttribute("role", "option");
      option.setAttribute("aria-selected", "false");

      const trigger = document.createElement("span");
      trigger.className = "search-suggestion-trigger";
      trigger.textContent = `!${record.trigger}`;

      const domain = document.createElement("span");
      domain.className = "search-suggestion-domain";
      domain.textContent = record.domain;

      option.append(trigger, domain);
      option.addEventListener("mousedown", (event) => {
        event.preventDefault();
      });
      option.addEventListener("click", () => selectSuggestion(record));
      searchSuggestions.append(option);
    });

    searchSuggestions.hidden = false;
    searchInput.setAttribute("aria-expanded", "true");
  }

  async function updateSuggestions(): Promise<void> {
    const request = ++suggestionRequest;
    const token = currentBangToken();
    if (!token) {
      hideSuggestions();
      return;
    }

    try {
      await catalog.ensureFull();
      if (request !== suggestionRequest) return;
      const current = currentBangToken();
      if (!current) {
        hideSuggestions();
        return;
      }
      suggestionRange = { start: current.start, end: current.end };
      renderSuggestions(catalog.suggest(current.prefix, 8));
    } catch (error) {
      console.error("Could not load bang suggestions:", error);
      hideSuggestions();
    }
  }

  searchInput?.addEventListener("keydown", (event) => {
    const menuOpen =
      searchSuggestions !== null && searchSuggestions.hidden === false;

    if (menuOpen && event.key === "ArrowDown") {
      event.preventDefault();
      setActiveSuggestion(activeSuggestionIndex + 1);
      return;
    }
    if (menuOpen && event.key === "ArrowUp") {
      event.preventDefault();
      setActiveSuggestion(activeSuggestionIndex - 1);
      return;
    }
    if (
      menuOpen &&
      event.key === "Enter" &&
      activeSuggestionIndex >= 0 &&
      suggestionRecords[activeSuggestionIndex]
    ) {
      event.preventDefault();
      selectSuggestion(suggestionRecords[activeSuggestionIndex]);
      return;
    }
    if (menuOpen && event.key === "Escape") {
      event.preventDefault();
      hideSuggestions();
      return;
    }
    if (event.key === "Enter") doSearch();
  });
  searchInput?.addEventListener("input", () => {
    void updateSuggestions();
  });
  searchInput?.addEventListener("blur", () => {
    setTimeout(hideSuggestions, 100);
  });
  searchButton?.addEventListener("click", doSearch);

  copyButton?.addEventListener("click", async () => {
    if (!urlInput) return;
    try {
      await navigator.clipboard.writeText(urlInput.value);
    } catch {
      showToast("Could not copy the URL.");
      return;
    }
    const originalSvg = copyButton.innerHTML;
    copyButton.innerHTML = `
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <polyline points="20,6 9,17 4,12"></polyline>
      </svg>
    `;
    copyButton.classList.add("copied");
    setTimeout(() => {
      copyButton.innerHTML = originalSvg;
      copyButton.classList.remove("copied");
    }, 2000);
  });

  const ddgGroups = $all<HTMLElement>(
    ".bang-specific-setting-group.ddg-specific",
  );
  const ddgHints = $all<HTMLElement>(
    ".bang-specific-setting-hint.ddg-specific",
  );
  const googleGroups = $all<HTMLElement>(
    ".bang-specific-setting-group.g-specific",
  );
  const googleHints = $all<HTMLElement>(
    ".bang-specific-setting-hint.g-specific",
  );

  async function refreshSpecificSettings(): Promise<void> {
    if (
      !disableDdgAdsCheckbox ||
      !disableDdgPromosCheckbox ||
      !duckAssistSelect ||
      !disableGoogleAiOverviewCheckbox
    ) {
      return;
    }
    try {
      await updateBangSpecificSettings(
        [...ddgGroups],
        [...ddgHints],
        [...googleGroups],
        [...googleHints],
        {
          ads: disableDdgAdsCheckbox,
          promos: disableDdgPromosCheckbox,
          assist: duckAssistSelect,
          googleAi: disableGoogleAiOverviewCheckbox,
        },
      );
    } catch (error) {
      console.error("Could not update bang-specific settings:", error);
    }
  }

  if (multiBangCheckbox) {
    multiBangCheckbox.checked = settings.multiBangEnabled;
    multiBangCheckbox.addEventListener("change", (event) => {
      const checked = (event.target as HTMLInputElement).checked;
      settings = { ...settings, multiBangEnabled: checked };
      writeSetting(storage, "multiBangEnabled", checked);
      showToast(`Multi-Bang Search: ${checked ? "enabled" : "disabled"}`);
    });
  }

  if (redditSiteSearchCheckbox) {
    redditSiteSearchCheckbox.checked = settings.redditSiteSearch;
    redditSiteSearchCheckbox.addEventListener("change", (event) => {
      const checked = (event.target as HTMLInputElement).checked;
      settings = { ...settings, redditSiteSearch: checked };
      writeSetting(storage, "redditSiteSearch", checked);
      showToast(
        `!r site:reddit.com search: ${checked ? "enabled" : "disabled"}`,
      );
    });
  }

  if (questionBangEnabledCheckbox) {
    questionBangEnabledCheckbox.checked = settings.questionBangEnabled;
    questionBangEnabledCheckbox.addEventListener("change", (event) => {
      const checked = (event.target as HTMLInputElement).checked;
      settings = { ...settings, questionBangEnabled: checked };
      writeSetting(storage, "questionBangEnabled", checked);
      showToast(
        `Trailing ? shortcut: ${checked ? "enabled" : "disabled"}`,
      );
    });
  }

  saveQuestionBangButton?.addEventListener("click", async () => {
    if (!questionBangInput) return;
    const trigger = normalizeValidTrigger(questionBangInput.value);
    if (!trigger) {
      showToast("Enter a valid question bang.");
      showQuestionBang();
      return;
    }

    const record = await catalog.lookupWithFull(trigger);
    if (!record) {
      showToast(`Bang !${trigger} does not exist.`);
      showQuestionBang();
      return;
    }

    settings = { ...settings, questionBang: trigger };
    writeSetting(storage, "questionBang", trigger);
    showQuestionBang();
    populateSuggestions();
    showToast(`Trailing ? shortcut set to !${trigger}`);
  });

  questionBangInput?.addEventListener("blur", () => {
    const trigger = normalizeTrigger(questionBangInput.value);
    if (trigger) questionBangInput.value = `!${trigger}`;
  });

  disableDdgAdsCheckbox?.addEventListener("change", (event) => {
    const checked = (event.target as HTMLInputElement).checked;
    settings = { ...settings, disableDdgAds: checked };
    writeSetting(storage, "disableDdgAds", checked);
    showToast(`DuckDuckGo ads: ${checked ? "disabled" : "enabled"}`);
  });

  disableDdgPromosCheckbox?.addEventListener("change", (event) => {
    const checked = (event.target as HTMLInputElement).checked;
    settings = { ...settings, disableDdgPromos: checked };
    writeSetting(storage, "disableDdgPromos", checked);
    showToast(`DuckDuckGo promotions: ${checked ? "disabled" : "enabled"}`);
  });

  duckAssistSelect?.addEventListener("change", (event) => {
    const select = event.target as HTMLSelectElement;
    settings = { ...settings, duckAssist: select.value };
    writeSetting(storage, "duckAssist", select.value);
    showToast(
      `DuckDuckGo AI Overview set to: ${
        select.options[select.selectedIndex].text
      }`,
    );
  });

  disableGoogleAiOverviewCheckbox?.addEventListener("change", (event) => {
    const checked = (event.target as HTMLInputElement).checked;
    settings = { ...settings, disableGoogleAi: checked };
    writeSetting(storage, "disableGoogleAi", checked);
    showToast(`Google AI Overview: ${checked ? "disabled" : "enabled"}`);
  });

  saveDefaultBtn?.addEventListener("click", async () => {
    if (!defaultBangInput) return;
    const trigger = normalizeValidTrigger(defaultBangInput.value);
    if (!trigger) {
      showToast("Enter a valid bang trigger.");
      showDefault();
      return;
    }

    const record = await catalog.lookupWithFull(trigger);
    if (!record) {
      showToast(`Bang !${trigger} does not exist.`);
      showDefault();
      return;
    }

    setDefaultBang(trigger);
    showDefault();
    populateSuggestions();
    await refreshSpecificSettings();
    showToast(`Default bang set to !${trigger}`);
  });

  defaultBangInput?.addEventListener("blur", () => {
    const trigger = normalizeTrigger(defaultBangInput.value);
    if (trigger) defaultBangInput.value = `!${trigger}`;
  });
  defaultBangInput?.addEventListener("focus", () => {
    void loadFullSettingsSuggestions();
  });
  questionBangInput?.addEventListener("focus", () => {
    void loadFullSettingsSuggestions();
  });

  const renderCustom = (): void => {
    if (!customBangsList) return;
    customBangsList.innerHTML = "";

    settings.customBangs.forEach((bang, index) => {
      const row = document.createElement("div");
      row.className = "custom-bang-row";

      const label = document.createElement("span");
      label.textContent = `!${bang.t} → ${bang.d}`;

      const removeButton = document.createElement("button");
      removeButton.textContent = "✕";
      removeButton.className = "remove-btn";
      removeButton.title = "Remove";
      removeButton.setAttribute("aria-label", `Remove !${bang.t}`);

      removeButton.addEventListener("click", async () => {
        const removed = settings.customBangs[index];
        const next = settings.customBangs.filter((_, itemIndex) => {
          return itemIndex !== index;
        });
        setCustomBangs(next);

        if (removed && settings.defaultBang === removed.t) {
          setDefaultBang(FALLBACK_BANG);
          showDefault();
          await refreshSpecificSettings();
          showToast(
            `Custom bang !${removed.t} removed. Default bang reset to !${FALLBACK_BANG}.`,
          );
        } else if (removed) {
          showToast(`Custom bang !${removed.t} removed.`);
        }

        if (removed && settings.questionBang === removed.t) {
          settings = { ...settings, questionBang: DEFAULT_QUESTION_BANG };
          writeSetting(storage, "questionBang", DEFAULT_QUESTION_BANG);
          showQuestionBang();
        }

        populateSuggestions();
        renderCustom();
      });

      row.append(label, removeButton);
      customBangsList.append(row);
    });
  };

  addCustomBangButton?.addEventListener("click", () => {
    if (!newBangInput || !newUrlInput) return;
    const result = validateCustomBang(newBangInput.value, newUrlInput.value);
    if (!result.ok) {
      showToast(result.error);
      return;
    }

    const existingIndex = settings.customBangs.findIndex(
      (bang) => bang.t === result.bang.t,
    );
    const next = [...settings.customBangs];
    if (existingIndex >= 0) next[existingIndex] = result.bang;
    else next.push(result.bang);
    setCustomBangs(next);

    newBangInput.value = "";
    newUrlInput.value = "";
    populateSuggestions();
    renderCustom();
    showToast(
      existingIndex >= 0
        ? `Custom bang !${result.bang.t} updated.`
        : `Custom bang !${result.bang.t} added.`,
    );
  });

  showDefault();
  showQuestionBang();
  populateSuggestions();
  renderCustom();
  void refreshSpecificSettings();
}

async function ensureValidDefault(): Promise<boolean> {
  const record: BangRecord | undefined = await catalog.lookupWithFull(
    settings.defaultBang,
  );
  if (record) return true;

  setDefaultBang(FALLBACK_BANG);
  return false;
}

async function initialize(): Promise<void> {
  let defaultWasReset = false;
  try {
    defaultWasReset = !(await ensureValidDefault());
  } catch (error) {
    console.error("Could not validate the default bang:", error);
  }

  const query =
    new URL(window.location.href).searchParams.get("q")?.trim() ?? "";
  if (!query) {
    renderApp();
    if (defaultWasReset) {
      showToast(
        `Saved default bang was unavailable. Reset to !${FALLBACK_BANG}.`,
      );
    }
    return;
  }

  const route = await resolveRoute(query, settings, catalog);
  if (route.kind === "home") {
    renderApp();
  } else if (route.kind === "single") {
    window.location.replace(route.url);
  } else {
    window.location.replace(
      buildMultiBangUrl(
        document.baseURI,
        route.query,
        route.triggers,
        route.unresolved,
      ),
    );
  }
}

initialize().catch((error) => {
  console.error("Quackly failed to initialize:", error);
  renderApp();
  showToast("Could not load bangs. Please refresh and try again.");
});

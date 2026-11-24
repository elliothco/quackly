import "./global.css";
import { createAppCatalog, hotBangs } from "./core/app-catalog";
import { buildMultiBangUrl } from "./core/navigation";
import { resolveRoute } from "./core/resolve";
import {
  SEARCH_PROVIDERS,
  SEARCH_TYPE_ALIASES,
  SEARCH_TYPE_LABELS,
  TYPE_SETTING_KEYS,
  configuredTypeBang,
  configuredTypeProvider,
  providerBang,
  providerForBang,
  providerForType,
  type ProviderId,
  type SearchType,
} from "./core/search-types";
import {
  DEFAULT_QUESTION_BANG,
  FALLBACK_BANG,
  LS_KEYS,
  SETTINGS_DEFAULTS,
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
const SEARCH_TYPES: readonly SearchType[] = ["images", "videos", "news"];

interface SearchTypeControl {
  type: SearchType;
  provider: HTMLSelectElement | null;
  bang: HTMLInputElement | null;
  hint: HTMLParagraphElement | null;
}

function renderSearchTypeRows(): string {
  return SEARCH_TYPES.map((type) => {
    const label = SEARCH_TYPE_LABELS[type];
    const providerOptions = SEARCH_PROVIDERS.map((provider) => {
      const bang = provider.bangs[type];
      const suffix = bang ? ` (!${bang})` : " (not available)";
      return `<option value="${provider.id}"${bang ? "" : " disabled"}>${provider.name}${suffix}</option>`;
    }).join("");
    const aliases = SEARCH_TYPE_ALIASES[type]
      .slice(0, 5)
      .map((alias) => `!${alias}`)
      .join(" ");

    return `
      <div class="search-type-row" data-search-type="${type}">
        <div class="search-type-heading">
          <span class="search-type-name">${label}</span>
          <span class="search-type-aliases" title="${SEARCH_TYPE_ALIASES[type]
            .map((alias) => `!${alias}`)
            .join(", ")}">${aliases}</span>
        </div>
        <div class="search-type-controls">
          <label class="sr-only" for="${type}-provider">${label} provider</label>
          <select id="${type}-provider" class="setting-input search-type-provider">
            <option value="auto">Auto — follow default</option>
            ${providerOptions}
            <option value="custom">Custom bang</option>
          </select>
          <label class="sr-only" for="${type}-bang-input">${label} target bang</label>
          <input
            id="${type}-bang-input"
            class="setting-input search-type-bang"
            type="text"
            list="bang-suggestions"
            placeholder="Auto"
          />
        </div>
        <p class="search-type-hint" id="${type}-bang-hint"></p>
      </div>
    `;
  }).join("");
}

function renderDefaultProviderOptions(): string {
  return SEARCH_PROVIDERS.filter((provider) => provider.defaultBang)
    .map(
      (provider) =>
        `<option value="${provider.id}">${provider.name} (!${provider.defaultBang})</option>`,
    )
    .join("");
}

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
  controls: {
    ads: HTMLInputElement;
    promos: HTMLInputElement;
    googleAi: HTMLInputElement;
  },
): Promise<void> {
  controls.ads.disabled = false;
  controls.promos.disabled = false;
  controls.ads.checked = settings.disableDdgAds;
  controls.promos.checked = settings.disableDdgPromos;
  controls.googleAi.disabled = false;
  controls.googleAi.checked = settings.disableGoogleAi;
}

function renderApp(): void {
  const app = document.querySelector<HTMLDivElement>("#app");
  if (!app) return;

  app.innerHTML = `
<div class="app-shell">
  <header class="topbar">
    <a class="brand" href="./">Quackly</a>
    <nav class="topbar-nav" aria-label="Primary">
      <a class="nav-link" href="https://helium.computer/bangs" target="_blank" rel="noopener noreferrer">Bangs ↗</a>
    </nav>
  </header>
<div class="main-container">
  <div class="content-wrapper">
    <header class="header">
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
    </header>

    <div class="search-section">
      <div class="search-wrap">
        <div class="search-container">
          <input
            type="text"
            class="search-input"
            placeholder="Search the web or type ! for bangs"
            role="combobox"
            aria-autocomplete="list"
            aria-controls="search-suggestions"
            aria-expanded="false"
            autocomplete="off"
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
      </div>
      <div class="search-hint">
        Press Enter to search • No bang? Uses
        <span class="current-default-hint"></span>
      </div>
      <p class="search-tip">
        Type <kbd>!</kbd> in the search box to browse Helium bangs.
      </p>
    </div>
    <section class="setup-callout" id="setup" aria-labelledby="setup-title">
      <div class="setup-expanded">
        <div class="setup-topline">
          <div class="setup-badge">Start here</div>
          <button id="dismiss-setup" class="setup-dismiss" type="button">
            Hide setup
          </button>
        </div>
        <div class="setup-copy">
          <h2 id="setup-title" tabindex="-1">Make Quackly your search engine</h2>
          <p>Add this URL as a custom search engine, then set Quackly as your default.</p>
        </div>
        <div class="url-container">
          <input type="text" class="url-input" readonly />
          <button class="copy-button" title="Copy URL" aria-label="Copy setup URL">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect width="14" height="14" x="8" y="8" rx="2" ry="2"></rect>
              <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"></path>
            </svg>
          </button>
        </div>
        <p class="setup-note">
          Works with Chrome, Helium, Firefox, and other browsers that support custom search engines.
        </p>
      </div>
      <div id="setup-compact" class="setup-compact" hidden>
        <span>Browser setup</span>
        <button id="show-setup" class="setup-link" type="button">
          Show instructions
        </button>
      </div>
    </section>

    <div class="settings-page-heading">
      <h2>Settings</h2>
      <p>Customize how Quackly searches, redirects, and handles each engine.</p>
    </div>

    <div class="settings-grid">
    <section class="settings-section settings-card">
      <h3>Search</h3>
      <div class="setting-group">
        <label for="default-provider-select" class="setting-label">Default Search</label>
        <select id="default-provider-select" class="setting-input">
          ${renderDefaultProviderOptions()}
          <option value="custom">Custom bang</option>
        </select>
      </div>
      <div id="default-custom-bang-settings" class="default-custom-bang-settings" hidden>
        <div class="setting-group">
          <label for="default-bang-input" class="setting-label">Custom Bang</label>
          <input
            type="text"
            id="default-bang-input"
            class="setting-input"
            list="bang-suggestions"
            placeholder="!bang"
          />
          <button id="save-default-btn" class="save-button" title="Save Default Bang">Save</button>
        </div>
      </div>
        <datalist id="bang-suggestions"></datalist>
      <div class="current-note">
        Choose a major provider, or use Custom to enter any bang such as
        <span class="bang-highlight">!w</span> for Wikipedia.
      </div>

      <div class="toggle-row">
        <div class="toggle-copy">
          <label class="toggle-title" for="search-types-enabled">Separate search types</label>
          <p class="toggle-description">
            Route <span class="bang-highlight">!i</span>,
            <span class="bang-highlight">!v</span>, and
            <span class="bang-highlight">!n</span> to image, video, and news
            results. Choose a provider or custom bang for each.
          </p>
        </div>
        <div class="toggle-actions">
          <label class="switch">
            <input type="checkbox" id="search-types-enabled" class="setting-checkbox" aria-label="Configure search types separately" />
            <span class="switch-track" aria-hidden="true"></span>
          </label>
        </div>
      </div>
      <div id="search-types-settings" class="search-type-settings">
        <p class="search-type-intro">
          Auto follows your default search provider. Provider rows show the
          bang they use; choose Custom to enter a different target.
        </p>
        ${renderSearchTypeRows()}
      </div>
    </section>

    <section class="settings-section settings-card">
      <h3>Behavior</h3>
      <div class="toggle-row">
        <div class="toggle-copy">
          <label class="toggle-title" for="multi-bang-checkbox">Multi-Bang Search</label>
          <p class="toggle-description">
            Open several services at once, like <span class="bang-highlight">cats !r !ddg !g</span>.
          </p>
        </div>
        <div class="toggle-actions">
          <label class="switch">
            <input type="checkbox" id="multi-bang-checkbox" class="setting-checkbox" aria-label="Enable Multi-Bang Search" />
            <span class="switch-track" aria-hidden="true"></span>
          </label>
        </div>
      </div>

      <div class="toggle-row">
        <div class="toggle-copy">
          <label class="toggle-title" for="question-bang-enabled">Trailing ? Shortcut</label>
          <p class="toggle-description">
            Send a question ending in <span class="bang-highlight">?</span> to
            <span class="bang-highlight current-question-bang"></span>.
          </p>
        </div>
        <div class="toggle-actions">
          <label class="switch">
            <input type="checkbox" id="question-bang-enabled" class="setting-checkbox" aria-label="Enable trailing question mark shortcut" />
            <span class="switch-track" aria-hidden="true"></span>
          </label>
        </div>
      </div>
      <div class="question-bang-settings" id="question-bang-settings" hidden>
        <div class="setting-group">
          <label for="question-bang-input" class="setting-label">Question Bang</label>
          <input
            type="text"
            id="question-bang-input"
            class="setting-input"
            list="bang-suggestions"
            placeholder="!ddg-ai"
          />
          <button id="save-question-bang-btn" class="save-button" title="Save Question Bang">Save</button>
        </div>
      </div>

      <div class="toggle-row">
        <div class="toggle-copy">
          <label class="toggle-title" for="reddit-site-search-checkbox">Reddit Site Search</label>
          <p class="toggle-description">
            Turn <span class="bang-highlight">!r</span> into a default-engine search for <span class="bang-highlight">site:reddit.com</span>.
          </p>
        </div>
        <div class="toggle-actions">
          <label class="switch">
            <input type="checkbox" id="reddit-site-search-checkbox" class="setting-checkbox" aria-label="Use site:reddit.com for !r" />
            <span class="switch-track" aria-hidden="true"></span>
          </label>
        </div>
      </div>
    </section>

    <section class="settings-section settings-card" id="ddg-settings-card">
      <h3>DuckDuckGo</h3>
      <div class="toggle-row bang-specific-setting-group ddg-specific">
        <div class="toggle-copy">
          <label class="toggle-title" for="disable-ddg-ads">Hide search ads</label>
          <p class="toggle-description">Applies to any <span class="bang-highlight">!ddg</span> search.</p>
        </div>
        <div class="toggle-actions">
          <label class="switch">
            <input type="checkbox" id="disable-ddg-ads" class="setting-checkbox" aria-label="Disable DuckDuckGo search ads" />
            <span class="switch-track" aria-hidden="true"></span>
          </label>
        </div>
      </div>

      <div class="toggle-row bang-specific-setting-group ddg-specific">
        <div class="toggle-copy">
          <label class="toggle-title" for="disable-ddg-promos">Hide promotions</label>
          <p class="toggle-description">Removes extension reminders and other promotional content.</p>
        </div>
        <div class="toggle-actions">
          <label class="switch">
            <input type="checkbox" id="disable-ddg-promos" class="setting-checkbox" aria-label="Disable DuckDuckGo promotions" />
            <span class="switch-track" aria-hidden="true"></span>
          </label>
        </div>
      </div>

      <div class="toggle-row bang-specific-setting-group ddg-specific">
        <div class="toggle-copy">
          <label class="toggle-title" for="ddg-ai-quick-answers">AI quick answers</label>
          <p class="toggle-description">
            Start answering immediately with <span class="bang-highlight">!ddg-ai</span> or <span class="bang-highlight">!ddg-chat</span>. Turn off to open the chat with the prompt filled instead.
          </p>
        </div>
        <div class="toggle-actions">
          <label class="switch">
            <input type="checkbox" id="ddg-ai-quick-answers" class="setting-checkbox" aria-label="Start DuckDuckGo AI answers immediately" />
            <span class="switch-track" aria-hidden="true"></span>
          </label>
        </div>
      </div>
    </section>

    <section class="settings-section settings-card">
      <h3>Google</h3>
      <div class="toggle-row bang-specific-setting-group g-specific">
        <div class="toggle-copy">
          <label class="toggle-title" for="disable-google-ai-overview">Hide AI Overview</label>
          <p class="toggle-description">Appends <code>-ai</code> to any Google search, including explicit <span class="bang-highlight">!g</span> searches.</p>
        </div>
        <div class="toggle-actions">
          <label class="switch">
            <input type="checkbox" id="disable-google-ai-overview" class="setting-checkbox" aria-label="Disable Google AI Overview" />
            <span class="switch-track" aria-hidden="true"></span>
          </label>
        </div>
      </div>
    </section>

    <section class="settings-section settings-card settings-card-wide">
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
    </section>
    </div>
    <details class="reset-panel">
      <summary>Reset settings</summary>
      <div class="reset-panel-body">
        <div class="reset-columns">
          <div>
            <h4>Individual settings</h4>
            <div class="reset-buttons">
              <button type="button" data-reset-setting="defaultBang">Default bang</button>
              <button type="button" data-reset-setting="searchTypesEnabled">Search type shortcuts</button>
              <button type="button" data-reset-setting="imagesBang">Images bang</button>
              <button type="button" data-reset-setting="videosBang">Videos bang</button>
              <button type="button" data-reset-setting="newsBang">News bang</button>
              <button type="button" data-reset-setting="multiBangEnabled">Multi-Bang Search</button>
              <button type="button" data-reset-setting="questionBangEnabled">Trailing ? shortcut</button>
              <button type="button" data-reset-setting="questionBang">Question bang</button>
              <button type="button" data-reset-setting="ddgAiQuickAnswers">DuckDuckGo AI quick answers</button>
              <button type="button" data-reset-setting="redditSiteSearch">Reddit site search</button>
              <button type="button" data-reset-setting="disableDdgAds">DuckDuckGo ads</button>
              <button type="button" data-reset-setting="disableDdgPromos">DuckDuckGo promotions</button>
              <button type="button" data-reset-setting="disableGoogleAi">Google AI Overview</button>
            </div>
          </div>
          <div>
            <h4>Sections</h4>
            <div class="reset-buttons">
              <button type="button" data-reset-section="search">Search</button>
              <button type="button" data-reset-section="behavior">Behavior</button>
              <button type="button" data-reset-section="ddg">DuckDuckGo</button>
              <button type="button" data-reset-section="google">Google</button>
              <button type="button" data-reset-section="custom">Custom bangs</button>
            </div>
          </div>
        </div>
        <button id="reset-all" class="reset-danger" type="button">Reset everything</button>
      </div>
    </details>
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
  const setupCallout = $<HTMLElement>("#setup");
  const setupExpanded = $<HTMLDivElement>(".setup-expanded");
  const setupCompact = $<HTMLDivElement>("#setup-compact");
  const setupTitle = $<HTMLHeadingElement>("#setup-title");
  const dismissSetupButton = $<HTMLButtonElement>("#dismiss-setup");
  const showSetupButton = $<HTMLButtonElement>("#show-setup");
  const urlInput = $<HTMLInputElement>(".url-input");
  const copyButton = $<HTMLButtonElement>(".copy-button");
  const defaultProviderSelect = $<HTMLSelectElement>(
    "#default-provider-select",
  );
  const defaultCustomBangSettings = $<HTMLDivElement>(
    "#default-custom-bang-settings",
  );
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
  const questionBangSettings = $<HTMLDivElement>("#question-bang-settings");
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
  const disableGoogleAiOverviewCheckbox = $<HTMLInputElement>(
    "#disable-google-ai-overview",
  );
  const ddgAiQuickAnswersCheckbox = $<HTMLInputElement>(
    "#ddg-ai-quick-answers",
  );
  const searchTypesEnabledCheckbox = $<HTMLInputElement>(
    "#search-types-enabled",
  );
  const searchTypesSettings = $<HTMLDivElement>("#search-types-settings");
  const searchTypeControls: SearchTypeControl[] = SEARCH_TYPES.map((type) => ({
    type,
    provider: $<HTMLSelectElement>(`#${type}-provider`),
    bang: $<HTMLInputElement>(`#${type}-bang-input`),
    hint: $<HTMLParagraphElement>(`#${type}-bang-hint`),
  }));
  const customSearchTypeModes = new Set<SearchType>();
  let defaultCustomMode = false;

  if (urlInput) urlInput.value = `${BASE_URL}?q=%s`;

  function setSetupCollapsed(collapsed: boolean, moveFocus = false): void {
    if (!setupExpanded || !setupCompact) return;
    setupExpanded.hidden = collapsed;
    setupCompact.hidden = !collapsed;
    setupCallout?.classList.toggle("is-collapsed", collapsed);
    storage.setItem("setup-collapsed", String(collapsed));

    if (moveFocus) {
      requestAnimationFrame(() => {
        if (collapsed) showSetupButton?.focus();
        else setupTitle?.focus();
      });
    }
  }

  dismissSetupButton?.addEventListener("click", () => {
    setSetupCollapsed(true, true);
  });
  showSetupButton?.addEventListener("click", () => {
    setSetupCollapsed(false, true);
  });
  setSetupCollapsed(storage.getItem("setup-collapsed") === "true");

  function showDefault(): void {
    const providerId = providerForBang(settings.defaultBang);
    const provider = SEARCH_PROVIDERS.find(
      (item) => item.id === providerId && item.defaultBang,
    );
    const custom = defaultCustomMode || !provider;

    if (defaultProviderSelect) {
      defaultProviderSelect.value = custom ? "custom" : (provider?.id ?? "custom");
    }
    if (defaultCustomBangSettings) {
      defaultCustomBangSettings.hidden = !custom;
    }
    if (defaultBangInput) {
      defaultBangInput.value = custom ? `!${settings.defaultBang}` : "";
    }
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
    if (questionBangSettings) {
      questionBangSettings.hidden = !settings.questionBangEnabled;
    }
  }

  function writeSearchTypeBang(type: SearchType, bang: string): void {
    const key = TYPE_SETTING_KEYS[type];
    settings = { ...settings, [key]: bang } as Settings;
    writeSetting(storage, key, bang);
  }

  function clearSearchTypeBangsUsing(removed: ReadonlySet<string>): void {
    for (const type of SEARCH_TYPES) {
      if (removed.has(settings[TYPE_SETTING_KEYS[type]])) {
        writeSearchTypeBang(type, "");
        customSearchTypeModes.delete(type);
      }
    }
  }

  function showSearchTypeControls(): void {
    if (searchTypesEnabledCheckbox) {
      searchTypesEnabledCheckbox.checked = settings.searchTypesEnabled;
    }
    if (searchTypesSettings) {
      searchTypesSettings.hidden = !settings.searchTypesEnabled;
    }

    for (const control of searchTypeControls) {
      const { type, provider, bang, hint } = control;
      if (!provider || !bang) continue;

      const label = SEARCH_TYPE_LABELS[type];
      const mode = customSearchTypeModes.has(type)
        ? "custom"
        : configuredTypeProvider(type, settings);
      const target = configuredTypeBang(type, settings);
      const configured = settings[TYPE_SETTING_KEYS[type]];
      const autoProvider = providerForType(type, settings.defaultBang);
      const providerDefinition = SEARCH_PROVIDERS.find(
        (item) => item.id === mode,
      );
      bang.closest(".search-type-controls")?.classList.toggle(
        "has-custom-bang",
        mode === "custom",
      );

      provider.value = mode;

      const autoOption = provider.querySelector<HTMLOptionElement>(
        'option[value="auto"]',
      );
      if (autoOption) {
        autoOption.textContent = target
          ? `Auto — !${target}`
          : "Auto — follow default";
      }

      if (mode === "auto") {
        bang.hidden = true;
        bang.value = "";
        bang.disabled = true;
        bang.placeholder = target ? `Auto: !${target}` : "No default bang";
        if (hint) {
          if (target && autoProvider) {
            hint.textContent = `Uses ${autoProvider.name} (!${target}) from your default !${settings.defaultBang}.`;
          } else if (target) {
            hint.textContent = `Uses !${target} from your default !${settings.defaultBang}.`;
          } else {
            hint.textContent = `Your default !${settings.defaultBang} has no ${label.toLowerCase()} bang. Choose a provider or Custom.`;
          }
        }
      } else if (mode === "custom") {
        bang.hidden = false;
        bang.value = configured ? `!${configured}` : "";
        bang.disabled = false;
        bang.placeholder = "!bang";
        if (hint) {
          hint.textContent = configured
            ? `Custom target: !${configured}. All ${label.toLowerCase()} shortcuts use this bang.`
            : `Enter the bang that should handle ${label.toLowerCase()} searches.`;
        }
      } else {
        bang.hidden = true;
        bang.value = target ? `!${target}` : "";
        bang.disabled = true;
        bang.placeholder = "Provider bang";
        if (hint) {
          hint.textContent = `${providerDefinition?.name ?? "This provider"} ${label.toLowerCase()} searches use !${target}. Choose Custom to enter another bang.`;
        }
      }
    }
  }

  async function saveCustomSearchTypeBang(
    control: SearchTypeControl,
  ): Promise<void> {
    if (!control.bang) return;
    const { type } = control;
    const trigger = normalizeValidTrigger(control.bang.value);
    if (!trigger) {
      showToast(`Enter a valid ${SEARCH_TYPE_LABELS[type].toLowerCase()} bang.`);
      showSearchTypeControls();
      return;
    }

    if (SEARCH_TYPES.some((item) => SEARCH_TYPE_ALIASES[item].includes(trigger))) {
      showToast(
        `!${trigger} is already a generic search-type shortcut. Choose the real target bang.`,
      );
      showSearchTypeControls();
      return;
    }

    const record = await catalog.lookupWithFull(trigger);
    if (!record) {
      showToast(`Bang !${trigger} does not exist.`);
      showSearchTypeControls();
      return;
    }

    writeSearchTypeBang(type, trigger);
    showSearchTypeControls();
    populateSuggestions();
    showToast(`${SEARCH_TYPE_LABELS[type]} searches now use !${trigger}.`);
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

  for (const element of $all<HTMLElement>(
    ".bang-specific-setting-group.ddg-specific, .bang-specific-setting-hint.ddg-specific, .bang-specific-setting-group.g-specific, .bang-specific-setting-hint.g-specific",
  )) {
    element.style.display = element.classList.contains("toggle-row")
      ? "flex"
      : "block";
  }

  async function refreshSpecificSettings(): Promise<void> {
    if (
      !disableDdgAdsCheckbox ||
      !disableDdgPromosCheckbox ||
      !disableGoogleAiOverviewCheckbox
    ) {
      return;
    }
    try {
      await updateBangSpecificSettings(
        {
          ads: disableDdgAdsCheckbox,
          promos: disableDdgPromosCheckbox,
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

  if (searchTypesEnabledCheckbox) {
    searchTypesEnabledCheckbox.checked = settings.searchTypesEnabled;
    searchTypesEnabledCheckbox.addEventListener("change", (event) => {
      const checked = (event.target as HTMLInputElement).checked;
      settings = { ...settings, searchTypesEnabled: checked };
      writeSetting(storage, "searchTypesEnabled", checked);
      showSearchTypeControls();
      showToast(
        `Separate search types: ${checked ? "enabled" : "disabled"}`,
      );
    });
  }

  for (const control of searchTypeControls) {
    const { type, provider, bang } = control;
    provider?.addEventListener("change", () => {
      const value = provider.value;
      if (value === "auto") {
        customSearchTypeModes.delete(type);
        writeSearchTypeBang(type, "");
        showSearchTypeControls();
        showToast(
          `${SEARCH_TYPE_LABELS[type]} searches now follow your default provider.`,
        );
        return;
      }

      if (value === "custom") {
        customSearchTypeModes.add(type);
        writeSearchTypeBang(type, "");
        showSearchTypeControls();
        bang?.focus();
        showToast(`Enter a custom ${SEARCH_TYPE_LABELS[type].toLowerCase()} bang.`);
        return;
      }

      const target = providerBang(value as ProviderId, type);
      if (!target) {
        showToast(`That provider has no ${SEARCH_TYPE_LABELS[type].toLowerCase()} bang.`);
        showSearchTypeControls();
        return;
      }

      customSearchTypeModes.delete(type);
      writeSearchTypeBang(type, target);
      showSearchTypeControls();
      populateSuggestions();
      showToast(`${SEARCH_TYPE_LABELS[type]} searches now use !${target}.`);
    });

    bang?.addEventListener("change", () => {
      void saveCustomSearchTypeBang(control);
    });
    bang?.addEventListener("focus", () => {
      void loadFullSettingsSuggestions();
    });
    bang?.addEventListener("keydown", (event) => {
      if (event.key !== "Enter") return;
      event.preventDefault();
      void saveCustomSearchTypeBang(control);
    });
  }

  if (ddgAiQuickAnswersCheckbox) {
    ddgAiQuickAnswersCheckbox.checked = settings.ddgAiQuickAnswers;
    ddgAiQuickAnswersCheckbox.addEventListener("change", (event) => {
      const checked = (event.target as HTMLInputElement).checked;
      settings = { ...settings, ddgAiQuickAnswers: checked };
      writeSetting(storage, "ddgAiQuickAnswers", checked);
      showToast(
        `DuckDuckGo AI quick answers: ${
          checked ? "enabled" : "disabled"
        }`,
      );
    });
  }

  if (questionBangEnabledCheckbox) {
    questionBangEnabledCheckbox.checked = settings.questionBangEnabled;
    questionBangEnabledCheckbox.addEventListener("change", (event) => {
      const checked = (event.target as HTMLInputElement).checked;
      settings = { ...settings, questionBangEnabled: checked };
      writeSetting(storage, "questionBangEnabled", checked);
      showQuestionBang();
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

  disableGoogleAiOverviewCheckbox?.addEventListener("change", (event) => {
    const checked = (event.target as HTMLInputElement).checked;
    settings = { ...settings, disableGoogleAi: checked };
    writeSetting(storage, "disableGoogleAi", checked);
    showToast(`Google AI Overview: ${checked ? "disabled" : "enabled"}`);
  });

  defaultProviderSelect?.addEventListener("change", async () => {
    if (defaultProviderSelect.value === "custom") {
      defaultCustomMode = true;
      showDefault();
      requestAnimationFrame(() => defaultBangInput?.focus());
      return;
    }

    const provider = SEARCH_PROVIDERS.find(
      (item) => item.id === defaultProviderSelect.value && item.defaultBang,
    );
    if (!provider?.defaultBang) {
      showToast("That default search provider is unavailable.");
      showDefault();
      return;
    }

    const record = await catalog.lookupWithFull(provider.defaultBang);
    if (!record) {
      showToast(`Bang !${provider.defaultBang} does not exist.`);
      showDefault();
      return;
    }

    defaultCustomMode = false;
    setDefaultBang(provider.defaultBang);
    showDefault();
    populateSuggestions();
    showSearchTypeControls();
    await refreshSpecificSettings();
    showToast(`Default search set to ${provider.name} (!${provider.defaultBang}).`);
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

    defaultCustomMode = false;
    setDefaultBang(trigger);
    showDefault();
    populateSuggestions();
    showSearchTypeControls();
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
  defaultBangInput?.addEventListener("keydown", (event) => {
    if (event.key !== "Enter") return;
    event.preventDefault();
    saveDefaultBtn?.click();
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
        if (removed) clearSearchTypeBangsUsing(new Set([removed.t]));

        if (removed && settings.defaultBang === removed.t) {
          defaultCustomMode = false;
          setDefaultBang(FALLBACK_BANG);
          showDefault();
          showSearchTypeControls();
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
        showSearchTypeControls();
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

  type ResetKey = keyof typeof SETTINGS_DEFAULTS;
  const RESET_SECTIONS: Record<string, readonly ResetKey[]> = {
    search: [
      "defaultBang",
      "searchTypesEnabled",
      "imagesBang",
      "videosBang",
      "newsBang",
    ],
    behavior: [
      "multiBangEnabled",
      "questionBangEnabled",
      "questionBang",
      "redditSiteSearch",
    ],
    ddg: [
      "disableDdgAds",
      "disableDdgPromos",
      "ddgAiQuickAnswers",
    ],
    google: ["disableGoogleAi"],
    custom: [],
  };

  function applyDefaultSettings(keys: readonly ResetKey[]): void {
    for (const key of keys) {
      settings = { ...settings, [key]: SETTINGS_DEFAULTS[key] } as Settings;
      writeSetting(
        storage,
        key as keyof typeof LS_KEYS,
        SETTINGS_DEFAULTS[key],
      );
    }
  }

  function syncSettingsControls(): void {
    defaultCustomMode = false;
    customSearchTypeModes.clear();
    if (multiBangCheckbox) {
      multiBangCheckbox.checked = settings.multiBangEnabled;
    }
    if (redditSiteSearchCheckbox) {
      redditSiteSearchCheckbox.checked = settings.redditSiteSearch;
    }
    if (disableDdgAdsCheckbox) {
      disableDdgAdsCheckbox.checked = settings.disableDdgAds;
    }
    if (disableDdgPromosCheckbox) {
      disableDdgPromosCheckbox.checked = settings.disableDdgPromos;
    }
    if (disableGoogleAiOverviewCheckbox) {
      disableGoogleAiOverviewCheckbox.checked = settings.disableGoogleAi;
    }
    if (ddgAiQuickAnswersCheckbox) {
      ddgAiQuickAnswersCheckbox.checked = settings.ddgAiQuickAnswers;
    }

    showDefault();
    showQuestionBang();
    showSearchTypeControls();
    populateSuggestions();
    renderCustom();
    void refreshSpecificSettings();
  }

  function clearCustomBangs(): void {
    const removed = new Set(settings.customBangs.map((bang) => bang.t));
    setCustomBangs([]);
    clearSearchTypeBangsUsing(removed);

    if (removed.has(settings.defaultBang)) {
      defaultCustomMode = false;
      setDefaultBang(FALLBACK_BANG);
    }
    if (removed.has(settings.questionBang)) {
      settings = { ...settings, questionBang: DEFAULT_QUESTION_BANG };
      writeSetting(storage, "questionBang", DEFAULT_QUESTION_BANG);
    }
  }

  document
    .querySelectorAll<HTMLButtonElement>("[data-reset-setting]")
    .forEach((button) => {
      button.addEventListener("click", () => {
        const key = button.dataset.resetSetting as ResetKey | undefined;
        if (!key) return;
        applyDefaultSettings([key]);
        syncSettingsControls();
        showToast("Setting reset to default.");
      });
    });

  document
    .querySelectorAll<HTMLButtonElement>("[data-reset-section]")
    .forEach((button) => {
      button.addEventListener("click", () => {
        const section = button.dataset.resetSection;
        if (!section) return;

        if (section === "custom") {
          if (
            !window.confirm(
              "Remove all custom bangs and reset related defaults?",
            )
          ) {
            return;
          }
          clearCustomBangs();
        } else {
          applyDefaultSettings(RESET_SECTIONS[section] ?? []);
        }

        syncSettingsControls();
        showToast(`${section === "ddg" ? "DuckDuckGo" : section} reset.`);
      });
    });

  const resetAllButton = $<HTMLButtonElement>("#reset-all");
  resetAllButton?.addEventListener("click", () => {
    if (
      !window.confirm(
        "Reset every Quackly setting and remove all custom bangs?",
      )
    ) {
      return;
    }

    settings = {
      ...SETTINGS_DEFAULTS,
      customBangs: [],
    };
    for (const [key, value] of Object.entries(SETTINGS_DEFAULTS)) {
      writeSetting(
        storage,
        key as keyof typeof LS_KEYS,
        value,
      );
    }
    writeCustomBangs(storage, []);
    catalog.setCustomBangs([]);
    setSetupCollapsed(false);
    syncSettingsControls();
    showToast("All settings reset.");
  });

  showDefault();
  showQuestionBang();
  showSearchTypeControls();
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

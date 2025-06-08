import { bangs as builtInBangs } from "./bang";
import "./global.css";

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
  multiBangEnabled: "multi-bang-enabled", // Toggles multi-bang search functionality
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

// Utility to set a value in localStorage.
const setLS = (k: string, v: any): void => localStorage.setItem(k, String(v));

// Consistent base URL for the application, including sub-paths if any.
const BASE_URL = window.location.origin + window.location.pathname;
// Consistent fallback bang to use if default is invalid or removed.
const FALLBACK_BANG = "ddg";

// Initialize custom bangs from localStorage, with error handling for corruption.
let customBangs: Bang[] = [];
try {
  customBangs = JSON.parse(getStr(LS_KEYS.customBangs, "[]"));
} catch (e) {
  console.error("Error parsing custom bangs from localStorage:", e);
  customBangs = []; // Reset if corrupted
  setLS(LS_KEYS.customBangs, "[]"); // Clear corrupted data in localStorage
}

// Combine built-in and custom bangs for comprehensive search capabilities.
const allBangs: Bang[] = [...builtInBangs, ...customBangs];
// Get the user's default bang trigger, defaulting to FALLBACK_BANG.
const defaultTrigger = getStr(LS_KEYS.defaultBang, FALLBACK_BANG);

// Displays a temporary toast notification at the bottom of the screen.
function showToast(msg: string): void {
  const t = document.createElement("div");
  t.className = "toast";
  t.textContent = msg;
  document.body.appendChild(t);
  requestAnimationFrame(() => t.classList.add("visible"));
  setTimeout(() => {
    t.classList.remove("visible");
    t.addEventListener("transitionend", () => t.remove(), { once: true });
  }, 1800);
}

// Renders the main application UI, including search interface and settings.
function renderApp(): void {
  const app = document.querySelector<HTMLDivElement>("#app");
  if (!app) {
    console.error("#app element not found!");
    return;
  }

  // Use BASE_URL for the search engine setup URL.
  const searchEngineUrl = `${BASE_URL}?q=%s`;
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
          Learn more about
          <a href="https://duckduckgo.com/bang.html" target="_blank">
            DuckDuckGo's bangs
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
          autofocus
        />
        <button class="search-button" title="Search">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="11" cy="11" r="8"></circle>
            <path d="m21 21-4.35-4.35"></path>
          </svg>
        </button>
      </div>
      <div class="search-hint">
        Press Enter to search • No bang? Uses
        <span class="current-default-hint">!${defaultTrigger}</span>
      </div>
    </div>
    <div class="setup-section">
      <h3>Browser Setup</h3>
      <p>Add this URL as a custom search engine in your browser:</p>
      <div class="url-container">
        <input
          type="text"
          class="url-input"
          value="${searchEngineUrl}"
          readonly
        />
        <button class="copy-button" title="Copy URL">
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
        <button id="save-default-btn" class="save-button" title="Save Default Bang">Save</button>

      </div>
      <div class="current-note">

        <br />
        Can be  set to <span class="bang-highlight">!g</span> for Google, <span class="bang-highlight">!ddg</span> for DuckDuckGo, <span class="bang-highlight">!brave</span> for Brave Search, or any other bang.
      </div>

      <div class="setting-group">
        <input
          type="checkbox"
          id="multi-bang-checkbox"
          class="setting-checkbox"
        />
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
        <input
          type="checkbox"
          id="reddit-site-search-checkbox"
          class="setting-checkbox"
        />
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

      <!-- DuckDuckGo Specific Settings -->
      <div class="setting-group bang-specific-setting-group ddg-specific">
        <input
          type="checkbox"
          id="disable-ddg-ads"
          class="setting-checkbox"
        />
        <label for="disable-ddg-ads" class="setting-label-checkbox">
          Disable DuckDuckGo Search Ads
        </label>
      </div>
      <p class="bang-specific-setting-hint ddg-specific">Only applies when default bang is <span class="bang-highlight">!ddg</span>.</p>

      <div class="setting-group bang-specific-setting-group ddg-specific">
        <input
          type="checkbox"
          id="disable-ddg-promos"
          class="setting-checkbox"
        />
        <label for="disable-ddg-promos" class="setting-label-checkbox">
          Disable DuckDuckGo Promotions
        </label>
      </div>
      <p class="bang-specific-setting-hint ddg-specific">Hides reminders to install browser extensions and other content. Only applies when default bang is <span class="bang-highlight">!ddg</span>.</p>

      <div class="setting-group bang-specific-setting-group ddg-specific">
        <label for="duck-assist-select" class="setting-label-checkbox">
          DuckAssist (AI)
        </label>
        <select id="duck-assist-select" class="setting-input" style="width: auto; min-width: 150px;">
          <option value="0">Never</option>
          <option value="1">On-Demand</option>
          <option value="2">Sometimes (Default)</option>
          <option value="3">Often</option>
        </select>
      </div>
      <p class="bang-specific-setting-hint ddg-specific">How often DuckDuckGo's AI-generated answers appear. Only applies when default bang is <span class="bang-highlight">!ddg</span>.</p>

      <!-- Google Specific Settings -->
      <div class="setting-group bang-specific-setting-group g-specific">
        <input
          type="checkbox"
          id="disable-google-ai-overview"
          class="setting-checkbox"
        />
        <label for="disable-google-ai-overview" class="setting-label-checkbox">
          Disable Google AI Overview
        </label>
      </div>
      <p class="bang-specific-setting-hint g-specific">Appends <code style="font-size: 0.8em;">-ai</code> to your search query. Only applies when default bang is <span class="bang-highlight">!g</span>.</p>
    </div>

    <div class="settings-section">
      <h3>Your Custom Bangs</h3>
      <p class="setting-subtitle">
      Add you own custom bangs here. Bangs are best if they are short and memorable.
      </p>
      <div id="custom-bangs-list"></div>

      <div id="add-custom-bang-form">
        <input
          id="new-bang-input"
          placeholder="!mybang"
          class="setting-input"
        />
        <input
          id="new-url-input"
          placeholder="https://chatgpt.com/?q=%s"
          class="setting-input"
        />
        <button
          id="add-custom-bang-button"
          class="save-button"
        >
          Add
        </button>
      </div>
    </div>

    <div class="settings-section">
      <h3>Quackly's Custom Bangs</h3>
      <p class="setting-subtitle">
        These are custom bangs built into Quackly, in addition to <a href="https://duckduckgo.com/bang.html" target="_blank">DuckDuckGo's bangs</a>.
      </p>
      <div class="custom-bang-row">
        <span>!chatgpt → chatgpt.com</span>
      </div>
      <div class="custom-bang-row">
        <span>!perplexity → perplexity.ai</span>
      </div>
      <div class="custom-bang-row">
        <span>!kagi → kagi.com</span>
      </div>
      <div class="custom-bang-row">
        <span>!t3 → t3.chat</span>
      </div>
      <div class="custom-bang-row">
        <span>!bsky → bsky.app</span>
      </div>
    </div>
  </div>

  <footer class="footer">
    Fully open source on <a href="https://github.com/elliothco/quackly" target="_blank">GitHub</a>.
    <br />
    Based on <a href="https://github.com/t3dotgg/unduck" target="_blank">Unduck by Theo</a>.
  </footer>
</div>`;

  // Helper functions for DOM selection.
  const $ = <T extends HTMLElement>(sel: string): T | null =>
    app.querySelector(sel);
  const $all = <T extends HTMLElement>(sel: string): NodeListOf<T> =>
    app.querySelectorAll(sel);

  const searchInput = $(".search-input") as HTMLInputElement;
  const searchButton = $(".search-button") as HTMLButtonElement;
  const currentDefaultHint = $(".current-default-hint");

  // Handles the main search action, redirecting to the determined URL.
  const doSearch = (): void => {
    const q = searchInput.value.trim();
    if (q) window.location.href = `${BASE_URL}?q=${encodeURIComponent(q)}`;
  };
  searchInput?.addEventListener(
    "keydown",
    (e) => e.key === "Enter" && doSearch(),
  );
  searchButton?.addEventListener("click", doSearch);

  // Handles copying the search engine URL to clipboard.
  const copyButton = $(".copy-button");
  const urlInput = $(".url-input") as HTMLInputElement;
  copyButton?.addEventListener("click", async () => {
    if (!urlInput) return;
    await navigator.clipboard.writeText(urlInput.value);
    const originalSVG = copyButton.innerHTML;
    copyButton.innerHTML = `
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <polyline points="20,6 9,17 4,12"></polyline>
      </svg>
    `;
    copyButton.classList.add("copied");

    setTimeout(() => {
      copyButton.innerHTML = originalSVG;
      copyButton.classList.remove("copied");
    }, 2000);
  });

  const defaultBangInput = $("#default-bang-input") as HTMLInputElement;
  const saveDefaultBtn = $("#save-default-btn") as HTMLButtonElement;
  if (defaultBangInput) {
    defaultBangInput.value = `!${defaultTrigger}`;
  }

  // Cleans the bang input value by removing leading '!' and trimming.
  const cleanBangInput = (value: string): string =>
    value.trim().toLowerCase().replace(/^!/, "");

  defaultBangInput?.addEventListener("blur", () => {
    if (defaultBangInput) {
      defaultBangInput.value = `!${cleanBangInput(defaultBangInput.value)}`;
    }
  });

  // References to DuckDuckGo-specific settings elements.
  const disableDdgAdsCheckbox = $("#disable-ddg-ads") as HTMLInputElement;
  const disableDdgPromosCheckbox = $("#disable-ddg-promos") as HTMLInputElement;
  const duckAssistSelect = $("#duck-assist-select") as HTMLSelectElement;
  const ddgSpecificSettingGroups = $all<HTMLDivElement>(
    ".bang-specific-setting-group.ddg-specific",
  );
  const ddgSpecificSettingHints = $all<HTMLParagraphElement>(
    ".bang-specific-setting-hint.ddg-specific",
  );

  // References to Google-specific settings elements.
  const disableGoogleAiOverviewCheckbox = $(
    "#disable-google-ai-overview",
  ) as HTMLInputElement;
  const googleSpecificSettingGroups = $all<HTMLDivElement>(
    ".bang-specific-setting-group.g-specific",
  );
  const googleSpecificSettingHints = $all<HTMLParagraphElement>(
    ".bang-specific-setting-hint.g-specific",
  );

  const redditSiteSearchCheckbox = $(
    "#reddit-site-search-checkbox",
  ) as HTMLInputElement;

  // Handles multi-bang search enable/disable.
  const multiBangCheckbox = $("#multi-bang-checkbox") as HTMLInputElement;
  if (multiBangCheckbox) {
    multiBangCheckbox.checked = getBoolWithDefault(
      LS_KEYS.multiBangEnabled,
      true,
    );
    multiBangCheckbox.addEventListener("change", (e) => {
      const isChecked = (e.target as HTMLInputElement).checked;
      setLS(LS_KEYS.multiBangEnabled, isChecked);
      showToast(`Multi-Bang Search: ${isChecked ? "enabled" : "disabled"}`);
    });
  }

  // Dynamically shows/hides bang-specific settings based on the current default bang.
  const updateBangSpecificSettings = (currentDefaultBang: string) => {
    // Hide all bang-specific settings initially.
    [...ddgSpecificSettingGroups, ...googleSpecificSettingGroups].forEach(
      (group) => (group.style.display = "none"),
    );
    [...ddgSpecificSettingHints, ...googleSpecificSettingHints].forEach(
      (hint) => (hint.style.display = "none"),
    );

    // Disable all bang-specific controls.
    if (disableDdgAdsCheckbox) disableDdgAdsCheckbox.disabled = true;
    if (disableDdgPromosCheckbox) disableDdgPromosCheckbox.disabled = true;
    if (duckAssistSelect) duckAssistSelect.disabled = true;
    if (disableGoogleAiOverviewCheckbox)
      disableGoogleAiOverviewCheckbox.disabled = true;

    // Reset default states for specific settings.
    if (disableDdgAdsCheckbox) disableDdgAdsCheckbox.checked = false;
    if (disableDdgPromosCheckbox) disableDdgPromosCheckbox.checked = false;
    if (duckAssistSelect) duckAssistSelect.value = "2";
    if (disableGoogleAiOverviewCheckbox)
      disableGoogleAiOverviewCheckbox.checked = false;

    // Show and enable settings relevant to DuckDuckGo if it's the default.
    if (currentDefaultBang === "ddg") {
      ddgSpecificSettingGroups.forEach(
        (group) => (group.style.display = "flex"),
      );
      ddgSpecificSettingHints.forEach((hint) => (hint.style.display = "block"));

      if (disableDdgAdsCheckbox) disableDdgAdsCheckbox.disabled = false;
      if (disableDdgPromosCheckbox) disableDdgPromosCheckbox.disabled = false;
      if (duckAssistSelect) duckAssistSelect.disabled = false;

      if (disableDdgAdsCheckbox) {
        disableDdgAdsCheckbox.checked = getBoolWithDefault(
          LS_KEYS.disableDdgAds,
          true,
        );
      }
      if (disableDdgPromosCheckbox) {
        disableDdgPromosCheckbox.checked = getBoolWithDefault(
          LS_KEYS.disableDdgPromos,
          true,
        );
      }
      if (duckAssistSelect) {
        duckAssistSelect.value = getStr(LS_KEYS.duckAssist, "2");
      }
    } else if (currentDefaultBang === "g") {
      // Show and enable settings relevant to Google if it's the default.
      googleSpecificSettingGroups.forEach(
        (group) => (group.style.display = "flex"),
      );
      googleSpecificSettingHints.forEach(
        (hint) => (hint.style.display = "block"),
      );

      if (disableGoogleAiOverviewCheckbox)
        disableGoogleAiOverviewCheckbox.disabled = false;

      if (disableGoogleAiOverviewCheckbox) {
        disableGoogleAiOverviewCheckbox.checked = getBool(
          LS_KEYS.disableGoogleAi,
        );
      }
    }
  };

  // Event listener for saving the default bang setting.
  saveDefaultBtn?.addEventListener("click", () => {
    if (!defaultBangInput || !currentDefaultHint) return;
    const newBangValue = cleanBangInput(defaultBangInput.value);
    // Validate if the entered bang exists.
    if (!allBangs.some((b) => b.t === newBangValue)) {
      showToast(`Bang !${newBangValue} does not exist.`);
      defaultBangInput.value = `!${defaultTrigger}`; // Revert to current default if invalid
      return;
    }
    setLS(LS_KEYS.defaultBang, newBangValue);
    currentDefaultHint.textContent = `!${newBangValue}`;
    showToast(`Default bang set to !${newBangValue}`);
    updateBangSpecificSettings(newBangValue);
  });

  // Initialize bang-specific settings on app load based on current default.
  updateBangSpecificSettings(defaultTrigger);

  // Event listeners for DuckDuckGo specific settings.
  disableDdgAdsCheckbox?.addEventListener("change", (e) => {
    const isChecked = (e.target as HTMLInputElement).checked;
    setLS(LS_KEYS.disableDdgAds, isChecked);
    showToast(`DuckDuckGo ads: ${isChecked ? "disabled" : "enabled"}`);
  });

  disableDdgPromosCheckbox?.addEventListener("change", (e) => {
    const isChecked = (e.target as HTMLInputElement).checked;
    setLS(LS_KEYS.disableDdgPromos, isChecked);
    showToast(`DuckDuckGo promotions: ${isChecked ? "disabled" : "enabled"}`);
  });

  duckAssistSelect?.addEventListener("change", (e) => {
    const selectedValue = (e.target as HTMLSelectElement).value;
    setLS(LS_KEYS.duckAssist, selectedValue);
    const label = (e.target as HTMLSelectElement).options[
      (e.target as HTMLSelectElement).selectedIndex
    ].textContent;
    showToast(`DuckAssist set to: ${label}`);
  });

  // Event listener for Google AI Overview setting.
  disableGoogleAiOverviewCheckbox?.addEventListener("change", (e) => {
    const isChecked = (e.target as HTMLInputElement).checked;
    setLS(LS_KEYS.disableGoogleAi, isChecked);
    showToast(`Google AI Overview: ${isChecked ? "disabled" : "enabled"}`);
  });

  // Handles the !r site:reddit.com rewrite setting.
  if (redditSiteSearchCheckbox) {
    redditSiteSearchCheckbox.checked = getBoolWithDefault(
      LS_KEYS.redditSiteSearch,
      true,
    );
    redditSiteSearchCheckbox.addEventListener("change", (e) => {
      const isChecked = (e.target as HTMLInputElement).checked;
      setLS(LS_KEYS.redditSiteSearch, isChecked);
      showToast(
        `!r site:reddit.com search: ${isChecked ? "enabled" : "disabled"}`,
      );
    });
  }

  // Elements for custom bang management.
  const customBangsList = $("#custom-bangs-list");
  const newBangInput = $("#new-bang-input") as HTMLInputElement;
  const newUrlInput = $("#new-url-input") as HTMLInputElement;
  const addCustomBangButton = $("#add-custom-bang-button") as HTMLButtonElement;

  // Renders the list of custom bangs and attaches removal handlers.
  const renderCustom = (): void => {
    if (!customBangsList) return;
    customBangsList.innerHTML = "";
    customBangs.forEach((b, idx) => {
      const row = document.createElement("div");
      row.className = "custom-bang-row";

      // XSS Fix: Create elements and set textContent instead of innerHTML
      const span = document.createElement("span");
      span.textContent = `!${b.t} → ${b.d}`;

      const removeBtn = document.createElement("button");
      removeBtn.textContent = "✕";
      removeBtn.setAttribute("data-idx", String(idx));
      removeBtn.className = "remove-btn";
      removeBtn.title = "Remove";

      row.append(span, removeBtn);
      customBangsList.append(row);
    });

    // Attach event listeners for removing custom bangs.
    customBangsList.querySelectorAll(".remove-btn").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const index = parseInt(
          (e.currentTarget as HTMLButtonElement).dataset.idx!,
          10,
        );
        const removedBang = customBangs[index].t;
        customBangs.splice(index, 1);
        setLS(LS_KEYS.customBangs, JSON.stringify(customBangs));

        // Rebuild allBangs array after removal.
        // Clear existing `allBangs` and push updated built-in and custom bangs.
        allBangs.splice(0, allBangs.length);
        allBangs.push(...builtInBangs, ...customBangs);

        // If the removed bang was the default, reset default to FALLBACK_BANG.
        if (
          removedBang === getStr(LS_KEYS.defaultBang, FALLBACK_BANG) &&
          defaultBangInput &&
          currentDefaultHint
        ) {
          setLS(LS_KEYS.defaultBang, FALLBACK_BANG);
          defaultBangInput.value = `!${FALLBACK_BANG}`;
          currentDefaultHint.textContent = `!${FALLBACK_BANG}`;
          showToast(
            `Custom bang !${removedBang} removed. Default bang reset to !${FALLBACK_BANG}.`,
          );
          updateBangSpecificSettings(FALLBACK_BANG);
        } else {
          showToast(`Custom bang !${removedBang} removed.`);
        }
        renderCustom(); // Re-render the list.
      });
    });
  };

  // Event listener for adding new custom bangs.
  addCustomBangButton?.addEventListener("click", () => {
    if (!newBangInput || !newUrlInput) return;

    let bangTrigger = newBangInput.value.trim().toLowerCase();
    if (!bangTrigger) {
      showToast("Bang trigger cannot be empty.");
      return;
    }
    if (bangTrigger.startsWith("!")) {
      bangTrigger = bangTrigger.substring(1);
    }

    let bangUrlTemplate = newUrlInput.value.trim();
    if (!bangUrlTemplate) {
      showToast("URL template cannot be empty.");
      return;
    }

    // Bug Fix: Normalize URL template by adding protocol if missing
    if (!/^https?:\/\//i.test(bangUrlTemplate)) {
      bangUrlTemplate = "https://" + bangUrlTemplate;
    }

    // Validate that the URL template contains a placeholder for the query.
    if (
      !bangUrlTemplate.includes("{{{s}}}") &&
      !bangUrlTemplate.includes("%s")
    ) {
      showToast(
        "URL template must contain {{{s}}} or %s for the search query.",
      );
      return;
    }

    // Prevent adding duplicate bangs.
    if (allBangs.some((b) => b.t === bangTrigger)) {
      showToast(`Bang !${bangTrigger} already exists.`);
      return;
    }

    // Attempt to extract domain for display purposes.
    let domain = "custom.com";
    try {
      // Split the URL template at the placeholder to get the base part
      const tempUrlPart = bangUrlTemplate.split(/\{\{\{s\}\}\}|%s/)[0];
      const urlObj = new URL(tempUrlPart);
      domain = urlObj.hostname;
    } catch (e) {
      // Ignore URL parsing errors if domain cannot be extracted, fallback to "custom.com".
      console.warn("Could not parse domain for custom bang URL:", e);
    }

    const newCustomBang: Bang = {
      t: bangTrigger,
      d: domain,
      u: bangUrlTemplate,
    };

    customBangs.push(newCustomBang);
    setLS(LS_KEYS.customBangs, JSON.stringify(customBangs));

    // Add new custom bang to the combined bangs array.
    allBangs.push(newCustomBang);

    renderCustom(); // Update UI.
    newBangInput.value = ""; // Clear input fields.
    newUrlInput.value = "";
    showToast(`Custom bang !${bangTrigger} added.`);
  });

  renderCustom(); // Initial render of custom bangs on app load.
}

// Determines the redirect URL based on the search query and user settings.
function getBangredirectUrl(): string | null {
  const url = new URL(window.location.href);
  let q = url.searchParams.get("q")?.trim() ?? "";
  if (!q) {
    // If no query, render the app UI.
    renderApp();
    return null;
  }

  const isMultiBangEnabled = getBoolWithDefault(LS_KEYS.multiBangEnabled, true);
  let detectedBangs: string[] = [];
  let queryWithoutBangs = q;

  // Multi-bang parsing logic: identifies all bangs in the query if enabled.
  if (isMultiBangEnabled) {
    // Regex to find bangs like "!bang" or " !bang" (preceded by space or start of string).
    // Bug Fix: Broaden regex to include hyphens and underscores for bang triggers.
    const bangRegex = /(^|\s)!([a-zA-Z0-9_-]+)(?=\s|$)/g;
    let match;
    const foundBangPositions: { start: number; end: number }[] = [];
    const tempDetectedBangs: string[] = [];

    // Iterate through matches to find all valid bangs.
    while ((match = bangRegex.exec(q)) !== null) {
      const bangTrigger = match[2];
      // Only consider it a detected bang if it's a known bang.
      if (allBangs.some((b) => b.t === bangTrigger)) {
        tempDetectedBangs.push(bangTrigger);
        // Store the start and end indices of the entire matched bang string (e.g., " !g").
        foundBangPositions.push({
          start: match.index,
          end: match.index + match[0].length,
        });
      }
    }
    detectedBangs = tempDetectedBangs;

    // Construct queryWithoutBangs by removing all found bang strings.
    let tempQuery = q;
    // Remove from end to start to avoid shifting indices.
    for (let i = foundBangPositions.length - 1; i >= 0; i--) {
      const pos = foundBangPositions[i];
      tempQuery =
        tempQuery.substring(0, pos.start) + tempQuery.substring(pos.end);
    }
    queryWithoutBangs = tempQuery.trim();

    // If multiple valid bangs are found, redirect to the multi-bang page.
    if (detectedBangs.length > 1) {
      // Use BASE_URL for the multi-bang redirect to ensure correct pathing.
      return `${window.location.origin}/multibang.html?q=${encodeURIComponent(
        queryWithoutBangs,
      )}&bangs=${encodeURIComponent(detectedBangs.join(","))}`;
    }
    // If 0 or 1 bang was detected, continue with single-bang logic below,
    // using the already computed `queryWithoutBangs`.
  }

  // --- Single Bang Logic (executed if multi-bang disabled or only one/no bangs detected) ---
  let selectedBang: Bang | undefined;
  let cleanQuery: string;
  let effectiveBangCandidate: string | null = null;

  // Determine the effective bang and clean query based on multi-bang outcome or traditional parsing.
  if (isMultiBangEnabled && detectedBangs.length === 1) {
    // If multi-bang is enabled and exactly one bang was found, use it.
    effectiveBangCandidate = detectedBangs[0];
    cleanQuery = queryWithoutBangs;
  } else {
    // If multi-bang is not enabled, or no bangs were found by multi-bang parser,
    // parse the original query for a single leading bang.
    const match = q.match(/!(\S+)/i);
    effectiveBangCandidate = match?.[1]?.toLowerCase() ?? null;

    if (effectiveBangCandidate) {
      // Remove only the first bang from the original query string.
      cleanQuery = q.replace(/!(\S+)\s*/i, "").trim();
    } else {
      // No bang detected, use the full original query.
      cleanQuery = q;
    }
  }

  // Determine the default bang object to use if no explicit bang is found or for !r rewrite.
  const defaultBangObject =
    allBangs.find((b) => b.t === defaultTrigger) ||
    builtInBangs.find((b) => b.t === FALLBACK_BANG); // Fallback to FALLBACK_BANG if defaultTrigger is invalid.

  // Apply the !r rewrite rule if enabled.
  if (
    effectiveBangCandidate === "r" &&
    getBoolWithDefault(LS_KEYS.redditSiteSearch, true)
  ) {
    cleanQuery = `${cleanQuery} site:reddit.com`.trim();
    selectedBang = defaultBangObject; // Use default search engine for site:reddit.com search.
  } else {
    // Find the selected bang, or use the default if no specific bang was found.
    selectedBang =
      allBangs.find((b) => b.t === effectiveBangCandidate) || defaultBangObject;
  }

  if (!selectedBang) {
    // Final fallback if no bang (default or specific) can be determined.
    return `https://duckduckgo.com/?q=${encodeURIComponent(q)}`;
  }

  // If the query is empty after bang removal, redirect to the bang's base domain.
  if (cleanQuery === "") {
    return `https://${selectedBang.d}`;
  }

  // Determine if bang-specific settings should apply (only if the selected bang
  // is the current default OR if the !r rewrite led to the default bang being used).
  const isDefaultBangInUse =
    (effectiveBangCandidate === null && selectedBang.t === defaultTrigger) ||
    (effectiveBangCandidate !== null &&
      selectedBang.t === effectiveBangCandidate &&
      selectedBang.t === defaultTrigger) ||
    (effectiveBangCandidate === "r" &&
      getBoolWithDefault(LS_KEYS.redditSiteSearch, true));

  // Apply Google-specific settings if applicable.
  if (selectedBang.t === "g" && isDefaultBangInUse) {
    if (getBool(LS_KEYS.disableGoogleAi)) {
      cleanQuery = `${cleanQuery} -ai`; // Append -ai to disable AI Overview.
    }
  }

  // Construct the final search URL, replacing placeholders.
  let searchUrl = selectedBang.u.replace(
    /\{\{\{s\}\}\}|%s/g, // Replace either {{{s}}} or %s.
    encodeURIComponent(cleanQuery).replace(/%2F/g, "/"), // Preserve slashes for URLs.
  );

  // Apply DuckDuckGo-specific settings if applicable.
  if (selectedBang.t === "ddg" && isDefaultBangInUse) {
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

  return searchUrl;
}

// Initiates the redirect to the determined search URL or renders the app if no query.
function doRedirect(): void {
  // Bug Fix: Prevent infinite loop if script is also included on multibang.html
  if (window.location.pathname.endsWith("/multibang.html")) {
    // This script should ideally not run on multibang.html,
    // or multibang.html should handle its own redirection.
    // If it *is* included, exit early to prevent immediate re-redirect.
    console.warn(
      "Script is running on multibang.html. Skipping redirect to prevent loop.",
    );
    return;
  }

  const dest = getBangredirectUrl();
  if (dest) window.location.replace(dest);
}

// Immediately attempt a redirect on page load.
doRedirect();

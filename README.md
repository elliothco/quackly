# Quackly

**Search, with superpowers.**

Quackly enhances your search experience, allowing you to quickly search websites with bangs, even faster than DuckDuckGo. It uses Helium's bang directory and adds extra, customizable features to make your web navigation more efficient.

## ✨ Features

*   **Blazing Fast Bang Searches:** Use `!<bang>` to directly search websites. Bangs are processed locally from a hot/cold data split, so common searches avoid loading the full directory.
*   **Customizable Default Search:** Pick Google, DuckDuckGo, Startpage, Kagi, Brave, Bing, Ecosia, Qwant, or Mojeek from a dropdown, or enter any custom bang.
*   **Separate Image, Video, and News Shortcuts:** Optionally enable `!i` / `!images`, `!v` / `!videos`, and `!n` / `!news` with the matching provider. Each type can follow your default provider or use an independent provider or custom bang, including Google, DuckDuckGo, Startpage, Kagi, Brave, Bing, Ecosia, Qwant, Mojeek, and YouTube where that vertical is available.
*   **Custom Bangs:** Add your own short, memorable bangs for any website.
*   **Helium Bang Directory:** Supports Helium's bangs, aliases, and format flags, with a link to [Helium's searchable directory](https://helium.computer/bangs).
*   **Question Mark Shortcut:** Optionally end a search with `?` to send it to a chosen bang, defaulting to `!ddg-ai` for DuckDuckGo AI. Disabled by default; explicit bangs take precedence.
*   **Search Engine Enhancements:**
    *   **Option to change `!r` to `site:reddit.com` search.**
    *   **Disable Google AI Overview.** (applies to any `!g` search)
    *   **Disable DuckDuckGo search ads.** (applies to any `!ddg` search)
    *   **Disable DuckDuckGo promotions.** (applies to any `!ddg` search)
*   **Multi-Bang Search:** Search multiple sites simultaneously. For example, "cats `!r` `!ddg` `!g`" opens results on Reddit, DuckDuckGo, and Google in separate tabs. *Requires pop-ups to be enabled for Quackly in your browser.*

## 🚀 Get Started

### Browser Setup

Add Quackly as a custom search engine in your browser:

1.  Go to your browser's settings.
2.  Navigate to "Search Engine" or "Manage search engines."
3.  Add a new (custom) search engine with the following URL:

    ```
    http://quackly.ellioth.co?q=%s
    ```

    *(Replace `quackly.ellioth.co` with your own instance's URL if needed)*

4.  Set Quackly as your default search engine or assign a keyword for quick access.

### Host Your Own Quackly Instance

Quackly is designed to be easily self-hostable, giving you full control and trust over your own search experience.

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/elliothco/quackly.git
    cd quackly
    ```
2.  **Install dependencies:**
    ```bash
    bun install
    ```
3.  **Build the project:**
    ```bash
    bun run build
    ```
    This will create a `dist` folder with your static build.
4.  **Deploy:** You can deploy the contents of the `dist` folder to any static web hosting service (e.x. Cloudflare Pages or GitHub Pages) or host it locally on your machine (e.x. using `python -m http.server` or using a local web server like `bunx serve dist`).

### Update the Bang Directory

Generated bang data is committed, so normal builds and deployments do not need network access. To pull the latest Helium data:

```bash
bun run update:bangs
bun run build
```

Review and commit the changes under `src/generated/` and `scripts/hot-triggers.json`. `bun run sync:bangs` and `bun run update:bangs` both fetch the current Helium snapshot.

### Add a Developer Bang or Override

Edit `scripts/developer-bangs.ts`, add the trigger, optional aliases, URL
template, and format flags, then run:

```bash
bun run sync:bangs
```

Developer bangs override Helium records with the same trigger and are always
included in the hot bundle.

## 🛠️ Configuration

Access Quackly's settings to customize your experience. You can:

*   Change your default bang.
*   Configure image, video, and news providers separately, with custom bang targets.
*   Choose the bang used by the trailing `?` shortcut.
*   Enable/disable Multi-Bang Search.
*   Toggle `!r` behavior.
*   Configure search engine-specific options.
*   Manage your custom bangs.
*   Follow the link to Helium's bang directory to find a shortcut by site name.

## 💡 How it Works

Quackly acts as an intermediary, parsing your search query and **performing all search redirects locally in your browser.** If no bang is specified, or a bang is invalid, Quackly defaults to your chosen default bang / search engine.

## 🌍 Learn More About Bangs

*   **Helium Bangs:** [https://helium.computer/bangs](https://helium.computer/bangs) (Quackly uses Helium's bang data.)

## 🙏 Acknowledgements

Quackly is built upon **Theo (t3.gg)'s [Unduck](https://github.com/t3dotgg/unduck)**.

The bundled bang directory comes from Helium's
**[bangs service](https://github.com/imputnet/helium-services/tree/main/svc/bangs)**.
The generated `bangs.json` carries an MIT license header and is derived from
Kagi's bang directory, which in turn credits DuckDuckGo for inventing the bang
concept. The Helium service code itself is AGPL-3.0 but is not bundled or
modified by Quackly. See `THIRD_PARTY_NOTICES.md` for the full notices.

**AI-Generated Code:** Most of the code for Quackly was generated using large language models.

## 📄 License

Distributed under the MIT License. See `LICENSE` for Quackly's license and
`THIRD_PARTY_NOTICES.md` for the Unduck and Helium data notices.

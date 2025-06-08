# Quackly

**Search, with superpowers.**

Quackly enhances your search experience, allowing you to quickly search websites with bangs, even faster than DuckDuckGo. It offers extra and customizable features to make your web navigation more efficient.

## ✨ Features

*   **Blazing Fast Bang Searches:** Use `!<bang>` to directly search websites. Bangs are processed locally, so no waiting on slow DNS.
*   **Customizable Default Bang:** Set your preferred default search engine (e.g., `!g` for Google, `!ddg` for DuckDuckGo).
*   **Custom Bangs:** Add your own short, memorable bangs for any website.
*   **Built-in Custom Bangs:** Access popular sites not included in DuckDuckGo's bang list.
*   **Search Engine Enhancements:**
    *   **Option to change `!r` to `site:reddit.com` search.**
    *   **Disable Google AI Overview.** (when using `!g` as default bang)
    *   **Disable DuckDuckGo search ads.** (when using `!ddg` as default bang)
    *   **Disable DuckDuckGo promotions.** (when using `!ddg` as default bang)
    *   **Control DuckAssist (AI) appearance.** (when using `!ddg` as default bang)
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
    npm install
    # or
    pnpm install
    ```
3.  **Build the project:**
    ```bash
    npm run build
    # or
    pnpm build
    ```
    This will create a `dist` folder with your static build.
4.  **Deploy:** You can deploy the contents of the `dist` folder to any static web hosting service (e.x. Cloudflare Pages or GitHub Pages) or host it locally on your machine (e.x. using `python -m http.server` or using a local web server like `npx serve dist`).

## 🛠️ Configuration

Access Quackly's settings to customize your experience. You can:

*   Change your default bang.
*   Enable/disable Multi-Bang Search.
*   Toggle `!r` behavior.
*   Configure search engine-specific options.
*   Manage your custom bangs.

## 💡 How it Works

Quackly acts as an intermediary, parsing your search query and **performing all search redirects locally in your browser.** If no bang is specified, or a bang is invalid, Quakly defaults to your chosen default bang / search engine.

## 🌍 Learn More About Bangs

*   **DuckDuckGo Bangs:** [https://duckduckgo.com/bang](https://duckduckgo.com/bang) (Quackly supports all standard DuckDuckGo bangs in addition to its custom ones.)

## 🙏 Acknowledgements

Quackly is built upon **Theo (t3.gg)'s [Unduck](https://github.com/t3dotgg/unduck)**.

**AI-Generated Code:** Most of the code for Quackly was generated using various large language models (LLMs). Shout out to [T3 Chat](https://t3.chat)!

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.

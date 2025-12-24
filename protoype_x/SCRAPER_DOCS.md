# Scraper Logic Documentation

## Strategy Overview
The application uses a **Client-Side Hybrid Scraping** approach to bypass the "No Backend" limitation while still aggregating data from external corporate sources.

### 1. Direct Page Parsing (IonQ, Rigetti)
For sites with predictable, server-rendered HTML structures, we use a proxy (`allorigins.win`) to fetch the raw HTML content string.
- **Process**:
  1. Fetch `https://api.allorigins.win/get?url=[TARGET_URL]`
  2. Parse the returned `contents` string using the browser's native `DOMParser`.
  3. Query the DOM for specific selectors (e.g., `a[href^="/news/"]`).
  4. Extract Title, Link, and Date (where available).

### 2. Targeted RSS Aggregation (D-Wave, Quantinuum, PsiQuantum)
For sites that rely on Client-Side Rendering (CSR) or have complex structures (e.g., dynamic loading), direct HTML parsing is unreliable in a client-side only environment.
- **Process**:
  1. We construct a targeted **Google News RSS** query restricted to the company's official domain (e.g., `site:dwavequantum.com`).
  2. This guarantees high-fidelity, official news results in a standard XML format.
  3. We fetch this RSS feed via `rss2json` (to bypass CORS and parse XML).
  4. This effectively delegates the "crawling" to Google's indexer, serving us the structured results.

## API Endpoints Used
- **CORS Proxy**: `https://api.allorigins.win/get?url=`
- **RSS Proxy**: `https://api.rss2json.com/v1/api.json?rss_url=`

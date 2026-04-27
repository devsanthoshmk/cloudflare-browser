# Google Search Worker (via DuckDuckGo)

This project is a Cloudflare Worker that uses [Cloudflare Browser Rendering API (Playwright)](#) to run a headless browser, navigate to a search engine, and extract search results natively. 

> **Note on Google Search:** Because Google puts strict CAPTCHAs on automated traffic coming from Cloudflare's shared IPs, this scraper uses DuckDuckGo HTML search as a proxy for the search results. This ensures reliable uptime when hosted on Cloudflare Workers without getting blocked.

## Prerequisites
- Node.js (v18+)
- Cloudflare Account with Browser Rendering enabled

## Project Setup

1. Install dependencies:
   ```bash
   npm install
   ```
2. Authenticate Wrangler (if not already logged in):
   ```bash
   npx wrangler login
   ```

## Running Locally

Because it uses Cloudflare Browser Rendering bindings, **you must use the `--remote` flag** to test locally. The local `--remote` flag runs the worker on your machine but connects to an actual headless Chromium instance hosted in Cloudflare's network.

Start the local development server:
```bash
npx wrangler dev --remote
```

Once it's ready (typically running on `http://localhost:8787`), you can test it with `curl`:

**Local `curl` Test:**
```bash
curl -s "http://localhost:8787/?q=cloudflare+workers+playwright"
```

## Deployment

Deploy your worker to production using:
```bash
npx wrangler deploy
```

## Production API Usage

Once deployed, you can access the automation API by passing a `q` parameter to your worker's production URL.

**Production `curl` Test:**
```bash
curl -s "https://google-search-worker.sanpro.workers.dev/?q=playwright+cloudflare+workers"
```

### JSON Response Format

The endpoint returns standard JSON formatted search results:

```json
{
  "query": "playwright cloudflare workers",
  "results": [
    {
      "title": "Playwright · Cloudflare Browser Run docs",
      "link": "//duckduckgo.com/l/?uddg=...",
      "snippet": "Playwright is an open-source package developed by Microsoft that can do browser automation tasks..."
    },
    ...
  ]
}
```

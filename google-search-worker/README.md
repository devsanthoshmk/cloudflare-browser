# DuckDuckGo Search Worker

This project is a very fast, serverless Cloudflare Worker that uses the `ddg-search` library to pull search results natively from DuckDuckGo without the overhead of headless browsers or Playwright. 

By fetching search data via HTTP without spinning up a Chromium instance, we:
- Save immense memory and CPU (much lower Workers execution time).
- Never get blocked by IP CAPTCHAs that typically plague browser-based bots on Cloudflare IPs.
- Avoid the `https.request` and Node.js stream overhead by using native Cloudflare `fetch()`.

## Features Exposed
The API exposes all standard features supported by the library:

### Web Search (`/` or `/search`)
- **`q`**: The search query (e.g., `?q=hello+world`)
- **`pages`**: The number of result pages to scrape (e.g., `?pages=2`)
- **`max`**: Optional maximum total number of results to fetch (e.g., `?max=5`)
- **`region`**: Search region filter (e.g., `?region=en-US`, default: `wt-wt`)
- **`time`**: Narrow by time (e.g., `?time=d` for past day, `w` for week, `m` for month)

The JSON response exposes:
- **`results`**: An array of fetched items with `title`, `url`, `description`, and `displayUrl`.
- **`zeroClick`**: DuckDuckGo's instant answer cards / knowledge graphs (if applicable).
- **`spelling`**: Any spelling corrections provided for your query. 
- **`pagesScraped`**: The number of pagination pages it crawled.

### Image Search (`/images`)
- **`q`**: The image search keyword (e.g., `/images?q=dogs`)
- **`safe`**: Safe search boolean filter (e.g. `?safe=false` for explicit content, true by default)
- **`pages`**: How many iterations of 100 images to return (e.g., `?pages=2`)

The JSON response for images exposes:
- **`image`**: **The raw image URL.**
- **`thumbnail`**: The DuckDuckGo thumbnail URL.
- **`title`**: The page title.
- **`url`**: The origin web URL.
- **`width` / `height`**: The dimension of the full image.

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

Because we no longer rely on Browser Rendering, you can run the standard `dev` server blazing fast locally.

Start the local development server:
```bash
npx wrangler dev
```

Once it's ready, you can test it with `curl`:

**Local `curl` Test:**
```bash
# Basic query
curl -s "http://localhost:8787/?q=cloudflare+workers"

# Query with pagination and max limits
curl -s "http://localhost:8787/?q=duckduckgo&pages=2&max=10"
```

## Deployment

Deploy your worker to production using:
```bash
npx wrangler deploy
```

## Production API Usage

Once deployed, access the automation API by utilizing the production URL provided by Wrangler.

**Production `curl` Test:**
```bash
curl -s "https://google-search-worker.sanpro.workers.dev/?q=query+here"
```

### Example JSON Response Format

```json
{
  "query": "cloudflare workers",
  "features_exposed": [
    "results",
    "zeroClick",
    "spelling",
    "pagesScraped"
  ],
  "data": {
    "results": [
      {
        "title": "Cloudflare",
        "url": "https://workers.cloudflare.com/",
        "description": "Cloudflare is your AI Cloud with compute...",
        "displayUrl": "workers.cloudflare.com"
      }
    ],
    "spelling": null,
    "zeroClick": null,
    "pagesScraped": 1,
    "query": "cloudflare workers"
  }
}
```

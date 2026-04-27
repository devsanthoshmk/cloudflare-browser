import { launch } from "@cloudflare/playwright";

export interface Env {
  MYBROWSER: Fetcher;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const query = url.searchParams.get("q");

    if (!query) {
      return new Response(JSON.stringify({ error: "Missing 'q' query parameter" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    let browser;
    try {
      browser = await launch(env.MYBROWSER);
      const context = await browser.newContext({
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        viewport: { width: 1280, height: 720 }
      });
      const page = await context.newPage();
      
      // Go to search directly (DuckDuckGo used because Google explicitly blocks Cloudflare IPs with Captcha)
      await page.goto(`https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`);
      
      try {
        // Wait for search results container
        await page.waitForSelector('.results', { timeout: 10000 });
      } catch (e) {
         const html = await page.content();
         return new Response(JSON.stringify({ error: "Could not find results", html }), {
           headers: { "Content-Type": "application/json" },
         });
      }
      
      // Extract results
      const results = await page.evaluate(() => {
        const items = document.querySelectorAll('.result');
        const extracted: { title: string; link: string; snippet?: string }[] = [];
        
        items.forEach((item) => {
          const titleEl = item.querySelector('.result__title a');
          const snippetEl = item.querySelector('.result__snippet');
          
          if (titleEl) {
             const link = titleEl.getAttribute('href') || '';
             // DuckDuckGo html links look like //duckduckgo.com/l/?uddg=actual_url
             // Let's just return the raw text link if parsing is hard, or duckduckgo's redirect
            extracted.push({
              title: titleEl.textContent?.trim() || '',
              link: link,
              snippet: snippetEl ? snippetEl.textContent?.trim() || '' : undefined
            });
          }
        });
        
        return extracted;
      });

      return new Response(JSON.stringify({ query, results }), {
        headers: { "Content-Type": "application/json" },
      });
    } catch (e: any) {
      return new Response(JSON.stringify({ error: String(e) }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    } finally {
      if (browser) {
        await browser.close();
      }
    }
  },
} satisfies ExportedHandler<Env>;

import { search } from "ddg-search";
import { imageSearch } from "@mudbill/duckduckgo-images-api";

export interface Env {}

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,HEAD,POST,OPTIONS",
  "Access-Control-Max-Age": "86400",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    // Handle CORS preflight requests
    if (request.method === "OPTIONS") {
      return new Response(null, {
        headers: corsHeaders,
      });
    }

    const url = new URL(request.url);
    const { searchParams, pathname } = url;
    
    const query = searchParams.get("q");

    if (!query) {
      return new Response(JSON.stringify({ error: "Missing 'q' query parameter" }), {
        status: 400,
        headers: { 
          ...corsHeaders,
          "Content-Type": "application/json" 
        },
      });
    }

    try {
      // Image Search Endpoint
      if (pathname === "/images" || searchParams.get("type") === "image") {
        const results = await imageSearch({
          query,
          safe: searchParams.get("safe") !== "false",
          iterations: parseInt(searchParams.get("pages") || "1", 10)
        });

        return new Response(JSON.stringify({ 
          query, 
          features_exposed: ["image", "thumbnail", "title", "source", "url"],
          data: {
            results: results.map(r => ({
              image: r.image,
              thumbnail: r.thumbnail,
              title: r.title,
              url: r.url,
              width: r.width,
              height: r.height,
              source: r.source
            }))
          }
        }), {
          headers: { 
            ...corsHeaders,
            "Content-Type": "application/json" 
          },
        });
      }

      // Default Web Search Endpoint
      const options = {
        maxPages: parseInt(searchParams.get("pages") || "1", 10),
        maxResults: searchParams.has("max") ? parseInt(searchParams.get("max")!, 10) : undefined,
        region: searchParams.get("region") || "wt-wt",
        time: searchParams.get("time") || "",
        fetchImpl: fetch.bind(globalThis) // Use Workers native fetch
      };

      const results = await search(query, options);

      return new Response(JSON.stringify({ 
        query, 
        features_exposed: ["results", "zeroClick", "spelling", "pagesScraped"],
        data: results 
      }), {
        headers: { 
          ...corsHeaders,
          "Content-Type": "application/json" 
        },
      });
    } catch (e: any) {
      return new Response(JSON.stringify({ error: String(e), stack: e.stack }), {
        status: 500,
        headers: { 
          ...corsHeaders,
          "Content-Type": "application/json" 
        },
      });
    }
  },
} satisfies ExportedHandler<Env>;

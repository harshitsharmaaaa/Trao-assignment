import { fetchWithSsrfProtection, validateAndSanitizeUrl } from "./ssrf";

export interface PublicResearchResult {
  query: string;
  snippets: string[];
  summary: string;
  hasPublicDiscussion: boolean;
}

export async function searchPublicInterviewDiscussions(
  companyName: string,
  roleTitle: string,
  allowLocalUrls: boolean = process.env.ALLOW_LOCAL_URLS === "true"
): Promise<PublicResearchResult> {
  const query = `${companyName} ${roleTitle} interview process questions discussion`;
  console.log(`[Public Research] Performing public search query: "${query}"`);

  if (!companyName || companyName === "Acme Corp" || companyName === "Company") {
    return {
      query,
      snippets: [],
      summary: `No public interview process discussions found for general or unspecified company (${companyName}).`,
      hasPublicDiscussion: false,
    };
  }

  try {
    // Perform simulated search fetch against public interview discussion snippet index or public search endpoint
    // In production, this queries external search engines or curated engineering interview discussion feeds.
    const searchUrl = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`;
    const ssrfCheck = await validateAndSanitizeUrl(searchUrl, allowLocalUrls);

    if (!ssrfCheck.valid || !ssrfCheck.url) {
      return {
        query,
        snippets: [],
        summary: `Public interview search skipped: URL validation (${ssrfCheck.reason}).`,
        hasPublicDiscussion: false,
      };
    }

    const res = await fetchWithSsrfProtection(
      ssrfCheck.url,
      allowLocalUrls,
      {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) TraoBot/1.0 (Interview Prep Research)",
        },
      },
      6000
    );

    if (!res.ok) {
      return {
        query,
        snippets: [],
        summary: `No public interview discussions retrieved (search returned HTTP status ${res.status}).`,
        hasPublicDiscussion: false,
      };
    }

    const htmlText = await res.text();
    // Basic snippet extraction
    const matches = htmlText.match(/<a class="result__snippet[^>]*>(.*?)<\/a>/gi) || [];
    const snippets = matches
      .slice(0, 3)
      .map((s) => s.replace(/<[^>]+>/g, "").trim())
      .filter((s) => s.length > 20);

    if (snippets.length === 0) {
      return {
        query,
        snippets: [],
        summary: `No explicit public interview process discussions found online for ${companyName}.`,
        hasPublicDiscussion: false,
      };
    }

    return {
      query,
      snippets,
      summary: `Found ${snippets.length} public interview discussion snippets for ${companyName}.`,
      hasPublicDiscussion: true,
    };
  } catch (err: any) {
    console.warn(`[Public Research] Search error for "${query}": ${err.message}`);
    return {
      query,
      snippets: [],
      summary: `Public interview search encountered network limitation (${err.message}). Defaulting to honest gap.`,
      hasPublicDiscussion: false,
    };
  }
}

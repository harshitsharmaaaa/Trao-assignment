import * as cheerio from "cheerio";
import robotsParser from "robots-parser";
import { fetchWithSsrfProtection, validateAndSanitizeUrl } from "./ssrf";

export interface CrawledPage {
  url: string;
  title: string;
  cleanText: string;
  links: string[];
}

export interface CrawlResult {
  pagesUsed: string[];
  combinedContent: string;
  companyBriefText: string;
  hiringInfoText: string;
}

const MAX_PAGES_TO_CRAWL = 5;
const REQUEST_TIMEOUT_MS = 8000;
const MAX_PAGE_BYTES = 500 * 1024; // 500 KB limit

export async function fetchAndCleanPage(
  pageUrl: string,
  allowLocalUrls: boolean = process.env.ALLOW_LOCAL_URLS === "true"
): Promise<CrawledPage | null> {
  const ssrfCheck = await validateAndSanitizeUrl(pageUrl, allowLocalUrls);
  if (!ssrfCheck.valid || !ssrfCheck.url) {
    console.warn(`[Crawler] URL failed SSRF check: ${pageUrl} - ${ssrfCheck.reason}`);
    return null;
  }

  try {
    const res = await fetchWithSsrfProtection(
      ssrfCheck.url,
      allowLocalUrls,
      {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) TraoBot/1.0 (Interview Prep Research)",
          Accept: "text/html,application/xhtml+xml,application/xml;q=0.9",
        },
      },
      REQUEST_TIMEOUT_MS
    );

    if (!res.ok) {
      console.warn(`[Crawler] Failed to fetch ${pageUrl} - Status ${res.status}`);
      return null;
    }

    const contentType = res.headers.get("content-type") || "";
    if (!contentType.includes("text/html") && !contentType.includes("xhtml")) {
      console.warn(`[Crawler] Non-HTML content type (${contentType}) for ${pageUrl}`);
      return null;
    }

    const htmlText = await res.text();
    if (htmlText.length > MAX_PAGE_BYTES * 4) {
      console.warn(`[Crawler] Oversized HTML page skipped for ${pageUrl}`);
      return null;
    }

    const $ = cheerio.load(htmlText);

    // Strip scripts, styles, navs, footers, svg, iframe
    $("script, style, svg, iframe, noscript, nav, footer, header").remove();

    const title = $("title").text().trim() || "Untitled Page";
    const cleanText = $("body")
      .text()
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 10000); // Max 10k chars per page

    // Extract links
    const extractedLinks: string[] = [];
    $("a[href]").each((_, el) => {
      const href = $(el).attr("href");
      if (!href) return;
      try {
        const resolved = new URL(href, pageUrl).toString();
        if (resolved.startsWith("http://") || resolved.startsWith("https://")) {
          // Keep only same origin or relevant subdomain links
          const resolvedOrigin = new URL(resolved).origin;
          const pageOrigin = new URL(pageUrl).origin;
          if (resolvedOrigin === pageOrigin) {
            extractedLinks.push(resolved);
          }
        }
      } catch {
        // Ignore invalid links
      }
    });

    return {
      url: pageUrl,
      title,
      cleanText,
      links: Array.from(new Set(extractedLinks)),
    };
  } catch (err: any) {
    console.warn(`[Crawler] Error fetching ${pageUrl}: ${err.message}`);
    return null;
  }
}

export function rankLinks(links: string[]): string[] {
  const hiringKeywords = ["careers", "jobs", "hiring", "work-with-us", "join", "team", "handbook", "culture", "engineering", "interview", "values"];
  const aboutKeywords = ["about", "company", "mission", "story"];

  return links.sort((a, b) => {
    const aLower = a.toLowerCase();
    const bLower = b.toLowerCase();

    const aHiringScore = hiringKeywords.some((k) => aLower.includes(k)) ? 10 : 0;
    const bHiringScore = hiringKeywords.some((k) => bLower.includes(k)) ? 10 : 0;

    const aAboutScore = aboutKeywords.some((k) => aLower.includes(k)) ? 5 : 0;
    const bAboutScore = aboutKeywords.some((k) => bLower.includes(k)) ? 5 : 0;

    return bHiringScore + bAboutScore - (aHiringScore + aAboutScore);
  });
}

export async function crawlCompanySite(
  startUrl: string,
  allowLocalUrls: boolean = process.env.ALLOW_LOCAL_URLS === "true"
): Promise<CrawlResult> {
  const pagesUsed: string[] = [];
  const crawledPages: CrawledPage[] = [];

  const firstPage = await fetchAndCleanPage(startUrl, allowLocalUrls);
  if (firstPage) {
    pagesUsed.push(firstPage.url);
    crawledPages.push(firstPage);

    const rankedCandidateLinks = rankLinks(firstPage.links);
    for (const link of rankedCandidateLinks) {
      if (crawledPages.length >= MAX_PAGES_TO_CRAWL) break;
      if (pagesUsed.includes(link)) continue;

      const page = await fetchAndCleanPage(link, allowLocalUrls);
      if (page) {
        pagesUsed.push(page.url);
        crawledPages.push(page);
      }
    }
  }

  const combinedContent = crawledPages
    .map((p) => `--- PAGE: ${p.url} (${p.title}) ---\n${p.cleanText}`)
    .join("\n\n");

  const companyBriefText = crawledPages
    .filter((p) => p.url.includes("about") || p.url.includes("company") || p.url === startUrl)
    .map((p) => p.cleanText)
    .join("\n\n");

  const hiringInfoText = crawledPages
    .filter((p) => p.url.includes("careers") || p.url.includes("jobs") || p.url.includes("handbook") || p.url.includes("hiring"))
    .map((p) => p.cleanText)
    .join("\n\n");

  return {
    pagesUsed,
    combinedContent,
    companyBriefText: companyBriefText || combinedContent,
    hiringInfoText: hiringInfoText || "No explicit public hiring page found on company site.",
  };
}

import dns from "dns/promises";
import { URL } from "url";

export function isPrivateIp(ip: string): boolean {
  const normalized = ip.toLowerCase().trim();
  // Loopback / unspecified (IPv4 + IPv6 variants)
  if (
    normalized === "127.0.0.1" ||
    normalized === "::1" ||
    normalized === "::ffff:127.0.0.1" ||
    normalized === "0.0.0.0" ||
    normalized === "::" ||
    normalized === "localhost"
  )
    return true;

  const parts = ip.split(".").map(Number);
  if (parts.length === 4) {
    if (parts[0] === 10) return true;
    if (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) return true;
    if (parts[0] === 192 && parts[1] === 168) return true;
    if (parts[0] === 169 && parts[1] === 254) return true;
    if (parts[0] === 127) return true;
  }

  return false;
}

export async function validateAndSanitizeUrl(
  inputUrl: string,
  allowLocalUrls: boolean = process.env.ALLOW_LOCAL_URLS === "true"
): Promise<{ valid: boolean; url?: string; reason?: string }> {
  try {
    const parsed = new URL(inputUrl);

    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return { valid: false, reason: "Unsupported protocol (only http and https allowed)" };
    }

    const hostname = parsed.hostname.toLowerCase();

    if (allowLocalUrls && (hostname === "localhost" || hostname === "127.0.0.1")) {
      return { valid: true, url: parsed.toString() };
    }

    if (isPrivateIp(hostname)) {
      return { valid: false, reason: "Forbidden private host/IP address" };
    }

    try {
      const lookupResults = await dns.lookup(hostname, { all: true });
      for (const result of lookupResults) {
        if (isPrivateIp(result.address)) {
          return { valid: false, reason: `Host ${hostname} resolved to restricted IP ${result.address}` };
        }
      }
    } catch {
      if (allowLocalUrls) {
        return { valid: true, url: parsed.toString() };
      }
      return { valid: false, reason: "DNS resolution failed" };
    }

    return { valid: true, url: parsed.toString() };
  } catch {
    return { valid: false, reason: "Invalid URL format" };
  }
}

const MAX_REDIRECT_HOPS = 3;

/**
 * Fetch wrapper that re-validates every redirect hop against the SSRF guard.
 * The native fetch follows redirects automatically without re-checking the
 * target, which would allow an allow-listed URL to redirect into a private
 * network. We therefore follow redirects manually (max 3 hops) and run
 * validateAndSanitizeUrl on each Location before following it.
 */
export async function fetchWithSsrfProtection(
  inputUrl: string,
  allowLocalUrls: boolean = process.env.ALLOW_LOCAL_URLS === "true",
  init: RequestInit = {},
  timeoutMs: number = 8000
): Promise<Response> {
  let currentUrl = inputUrl;

  for (let hop = 0; hop <= MAX_REDIRECT_HOPS; hop++) {
    const check = await validateAndSanitizeUrl(currentUrl, allowLocalUrls);
    if (!check.valid || !check.url) {
      throw new Error(`SSRF blocked fetch to ${currentUrl}: ${check.reason}`);
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    let res: Response;
    try {
      res = await fetch(check.url, {
        ...init,
        signal: controller.signal,
        redirect: "manual",
      });
    } catch (err: any) {
      clearTimeout(timeoutId);
      throw err;
    }
    clearTimeout(timeoutId);

    const location = res.headers.get("location");
    if (res.status >= 300 && res.status < 400 && location) {
      if (hop === MAX_REDIRECT_HOPS) {
        throw new Error(`Too many redirects (>${MAX_REDIRECT_HOPS}) starting from ${inputUrl}`);
      }
      try {
        currentUrl = new URL(location, currentUrl).toString();
      } catch {
        throw new Error(`Invalid redirect Location header: ${location}`);
      }
      continue;
    }

    return res;
  }

  throw new Error(`Too many redirects (>${MAX_REDIRECT_HOPS}) starting from ${inputUrl}`);
}

import { expect, test, describe } from "bun:test";
import { rankLinks } from "@/lib/retrieval/crawler";

describe("Crawler Link Ranker", () => {
  test("ranks hiring, careers, and handbook links higher than generic pages", () => {
    const unranked = [
      "https://example.com/privacy",
      "https://example.com/careers/engineering",
      "https://example.com/terms",
      "https://example.com/about-us",
      "https://example.com/handbook/hiring",
    ];

    const ranked = rankLinks(unranked);

    expect(ranked[0]).toContain("careers");
    expect(ranked[1]).toContain("handbook");
    expect(ranked[2]).toContain("about");
  });
});

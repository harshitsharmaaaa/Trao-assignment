import { expect, test, describe } from "bun:test";
import { isPrivateIp, validateAndSanitizeUrl } from "@/lib/retrieval/ssrf";

describe("SSRF Security Guard", () => {
  test("identifies private IPv4 and loopback addresses", () => {
    expect(isPrivateIp("127.0.0.1")).toBe(true);
    expect(isPrivateIp("localhost")).toBe(true);
    expect(isPrivateIp("10.0.0.5")).toBe(true);
    expect(isPrivateIp("172.20.0.1")).toBe(true);
    expect(isPrivateIp("192.168.1.100")).toBe(true);
    expect(isPrivateIp("169.254.169.254")).toBe(true);

    expect(isPrivateIp("8.8.8.8")).toBe(false);
    expect(isPrivateIp("1.1.1.1")).toBe(false);
  });

  test("rejects invalid or non-HTTP protocols", async () => {
    const ftpRes = await validateAndSanitizeUrl("ftp://example.com/file");
    expect(ftpRes.valid).toBe(false);
    expect(ftpRes.reason).toContain("Unsupported protocol");

    const invalidRes = await validateAndSanitizeUrl("not-a-url");
    expect(invalidRes.valid).toBe(false);
    expect(invalidRes.reason).toContain("Invalid URL");
  });

  test("rejects private hostnames in production mode", async () => {
    const res = await validateAndSanitizeUrl("http://127.0.0.1:8099/acme", false);
    expect(res.valid).toBe(false);
    expect(res.reason).toContain("private host");
  });

  test("rejects cloud metadata IP (169.254.169.254) and private networks", async () => {
    expect(isPrivateIp("169.254.169.254")).toBe(true);
    const metadataRes = await validateAndSanitizeUrl("http://169.254.169.254/latest/meta-data/", false);
    expect(metadataRes.valid).toBe(false);
    expect(metadataRes.reason).toContain("private host");
  });

  test("rejects unsupported protocols like file:// and gopher://", async () => {
    const fileRes = await validateAndSanitizeUrl("file:///etc/passwd");
    expect(fileRes.valid).toBe(false);
    expect(fileRes.reason).toContain("Unsupported protocol");

    const gopherRes = await validateAndSanitizeUrl("gopher://example.com");
    expect(gopherRes.valid).toBe(false);
    expect(gopherRes.reason).toContain("Unsupported protocol");
  });

  test("allows localhost URLs when allowLocalUrls is true", async () => {
    const res = await validateAndSanitizeUrl("http://localhost:8099/acme", true);
    expect(res.valid).toBe(true);
    expect(res.url).toBe("http://localhost:8099/acme");
  });
});


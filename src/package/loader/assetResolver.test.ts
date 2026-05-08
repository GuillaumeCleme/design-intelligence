import { describe, it, expect } from "vitest";
import { resolveAssetUrl } from "./assetResolver";

describe("resolveAssetUrl", () => {
  it("returns absolute paths unchanged", () => {
    expect(resolveAssetUrl("/images/bg.jpg", "/packages/test/")).toBe("/images/bg.jpg");
  });

  it("returns http URLs unchanged", () => {
    expect(
      resolveAssetUrl("https://cdn.example.com/img.png", "/packages/test/")
    ).toBe("https://cdn.example.com/img.png");
  });

  it("resolves relative paths against basePath", () => {
    expect(
      resolveAssetUrl("assets/images/bg.jpg", "/packages/campaign/")
    ).toBe("/packages/campaign/assets/images/bg.jpg");
  });

  it("normalizes basePath without trailing slash", () => {
    expect(
      resolveAssetUrl("assets/logo.svg", "/packages/test")
    ).toBe("/packages/test/assets/logo.svg");
  });

  it("does not double-slash when basePath has trailing slash", () => {
    expect(
      resolveAssetUrl("fonts/Inter.woff2", "/packages/test/")
    ).toBe("/packages/test/fonts/Inter.woff2");
  });
});

import { describe, it, expect } from "vitest";
import { ExportScope } from "./types";

describe("ExportScope", () => {
  it("has expected scope values", () => {
    expect(ExportScope.SingleArtboard).toBe("single-artboard");
    expect(ExportScope.AllArtboards).toBe("all-artboards");
    expect(ExportScope.FullDocument).toBe("full-document");
  });

  it("has exactly 3 scopes", () => {
    const values = Object.values(ExportScope);
    expect(values).toHaveLength(3);
  });
});

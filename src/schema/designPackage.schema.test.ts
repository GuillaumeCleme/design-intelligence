import { describe, it, expect } from "vitest";
import {
  DesignPackageManifestSchema,
  DesignDocumentSchema,
  TokensSchema,
  AssetManifestEntrySchema,
  ArtboardManifestEntrySchema,
} from "./designPackage.schema";

describe("AssetManifestEntrySchema", () => {
  it("validates a valid image asset", () => {
    const result = AssetManifestEntrySchema.safeParse({
      type: "image",
      mimeType: "image/jpeg",
      path: "assets/images/bg.jpg",
    });
    expect(result.success).toBe(true);
  });

  it("validates a font asset with fontFamily", () => {
    const result = AssetManifestEntrySchema.safeParse({
      type: "font",
      mimeType: "font/woff2",
      path: "assets/fonts/Inter.woff2",
      fontFamily: "Inter",
      fontWeight: 700,
    });
    expect(result.success).toBe(true);
  });

  it("rejects invalid asset type", () => {
    const result = AssetManifestEntrySchema.safeParse({
      type: "audio",
      mimeType: "audio/mp3",
      path: "assets/audio.mp3",
    });
    expect(result.success).toBe(false);
  });
});

describe("ArtboardManifestEntrySchema", () => {
  it("validates a valid artboard entry", () => {
    const result = ArtboardManifestEntrySchema.safeParse({
      id: "artboard.1",
      name: "Test",
      path: "artboards/test/scene.json",
      width: 1080,
      height: 1080,
      x: 0,
      y: 0,
    });
    expect(result.success).toBe(true);
  });

  it("rejects zero width", () => {
    const result = ArtboardManifestEntrySchema.safeParse({
      id: "artboard.1",
      name: "Test",
      path: "artboards/test/scene.json",
      width: 0,
      height: 1080,
    });
    expect(result.success).toBe(false);
  });
});

describe("DesignPackageManifestSchema", () => {
  it("validates a full manifest", () => {
    const result = DesignPackageManifestSchema.safeParse({
      id: "test-pkg",
      name: "Test Package",
      format: "designpkg",
      version: "0.1.0",
      document: "document.json",
      tokens: "tokens.json",
      artboards: [
        {
          id: "ab1",
          name: "Artboard 1",
          path: "artboards/ab1/scene.json",
          width: 800,
          height: 600,
        },
      ],
      assets: {
        "img.bg": {
          type: "image",
          mimeType: "image/png",
          path: "assets/images/bg.png",
        },
      },
    });
    expect(result.success).toBe(true);
  });

  it("rejects wrong format value", () => {
    const result = DesignPackageManifestSchema.safeParse({
      id: "test",
      name: "Test",
      format: "wrong",
      version: "0.1.0",
      document: "doc.json",
      tokens: "tok.json",
      artboards: [],
      assets: {},
    });
    expect(result.success).toBe(false);
  });
});

describe("DesignDocumentSchema", () => {
  it("validates a valid document", () => {
    const result = DesignDocumentSchema.safeParse({
      id: "doc.1",
      version: "0.1.0",
      unit: "px",
      colorSpace: "srgb",
      rootId: "root",
      artboards: ["ab1"],
      assets: ["img.bg"],
      dependencies: { ab1: ["img.bg"] },
    });
    expect(result.success).toBe(true);
  });

  it("rejects invalid unit", () => {
    const result = DesignDocumentSchema.safeParse({
      id: "doc.1",
      version: "0.1.0",
      unit: "em",
      colorSpace: "srgb",
      rootId: "root",
      artboards: [],
      assets: [],
      dependencies: {},
    });
    expect(result.success).toBe(false);
  });
});

describe("TokensSchema", () => {
  it("validates valid tokens", () => {
    const result = TokensSchema.safeParse({
      colors: { white: "#FFFFFF", black: "#000000" },
      fonts: {
        heading: { fontFamily: "Inter", fontWeight: 700 },
      },
      effects: {
        shadow: {
          type: "linear-gradient",
          angle: 90,
          stops: [{ offset: 0, color: "#000", opacity: 1 }],
        },
      },
    });
    expect(result.success).toBe(true);
  });

  it("rejects gradient stop with offset > 1", () => {
    const result = TokensSchema.safeParse({
      colors: {},
      fonts: {},
      effects: {
        bad: {
          type: "linear-gradient",
          angle: 0,
          stops: [{ offset: 2, color: "#000", opacity: 1 }],
        },
      },
    });
    expect(result.success).toBe(false);
  });
});

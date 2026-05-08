import { describe, it, expect, vi, beforeEach } from "vitest";
import { createGradientTexture } from "./gradients";

const mockAddColorStop = vi.fn();
const mockCreateLinearGradient = vi.fn(() => ({ addColorStop: mockAddColorStop }));
const mockFillRect = vi.fn();

const mockGetContext = vi.fn(() => ({
  createLinearGradient: mockCreateLinearGradient,
  fillRect: mockFillRect,
  fillStyle: "",
}));

vi.stubGlobal("document", {
  createElement: vi.fn(() => ({
    width: 0,
    height: 0,
    getContext: mockGetContext,
  })),
});

vi.mock("pixi.js", () => ({
  Texture: { from: vi.fn((canvas: unknown) => ({ canvas, source: {} })) },
}));

describe("createGradientTexture", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("creates a canvas with correct dimensions", () => {
    createGradientTexture({
      width: 200,
      height: 100,
      angle: 90,
      stops: [{ offset: 0, color: "#FF0000", opacity: 1 }],
    });

    const canvas = (document.createElement as ReturnType<typeof vi.fn>).mock.results[0].value;
    expect(canvas.width).toBe(200);
    expect(canvas.height).toBe(100);
  });

  it("handles 270 degree angle (right to left)", () => {
    createGradientTexture({
      width: 300,
      height: 150,
      angle: 270,
      stops: [
        { offset: 0, color: "#000000", opacity: 0.8 },
        { offset: 1, color: "#000000", opacity: 0 },
      ],
    });

    expect(mockCreateLinearGradient).toHaveBeenCalledWith(300, 0, 0, 0);
  });

  it("handles 90 degree angle (left to right)", () => {
    createGradientTexture({
      width: 100,
      height: 50,
      angle: 90,
      stops: [{ offset: 0, color: "#FFF", opacity: 1 }],
    });

    expect(mockCreateLinearGradient).toHaveBeenCalledWith(0, 0, 100, 0);
  });

  it("handles 180 degree angle (bottom to top)", () => {
    createGradientTexture({
      width: 100,
      height: 200,
      angle: 180,
      stops: [{ offset: 0, color: "#000", opacity: 1 }],
    });

    expect(mockCreateLinearGradient).toHaveBeenCalledWith(0, 200, 0, 0);
  });

  it("handles 0 degree angle (top to bottom)", () => {
    createGradientTexture({
      width: 100,
      height: 200,
      angle: 0,
      stops: [{ offset: 0, color: "#000", opacity: 1 }],
    });

    expect(mockCreateLinearGradient).toHaveBeenCalledWith(0, 0, 0, 200);
  });

  it("adds color stops with correct rgba values", () => {
    createGradientTexture({
      width: 10,
      height: 10,
      angle: 90,
      stops: [
        { offset: 0, color: "#FF0000", opacity: 0.5 },
        { offset: 1, color: "#00FF00", opacity: 1 },
      ],
    });

    expect(mockAddColorStop).toHaveBeenCalledWith(0, "rgba(255, 0, 0, 0.5)");
    expect(mockAddColorStop).toHaveBeenCalledWith(1, "rgba(0, 255, 0, 1)");
  });

  it("clamps canvas dimensions to at least 1", () => {
    createGradientTexture({
      width: 0,
      height: 0,
      angle: 0,
      stops: [],
    });

    const canvas = (document.createElement as ReturnType<typeof vi.fn>).mock.results[0].value;
    expect(canvas.width).toBe(1);
    expect(canvas.height).toBe(1);
  });

  it("fills the entire canvas", () => {
    createGradientTexture({
      width: 50,
      height: 30,
      angle: 90,
      stops: [{ offset: 0, color: "#000", opacity: 1 }],
    });

    expect(mockFillRect).toHaveBeenCalledWith(0, 0, 50, 30);
  });
});

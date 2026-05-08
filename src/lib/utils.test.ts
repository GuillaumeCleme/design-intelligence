import { describe, it, expect } from "vitest";
import { cn } from "./utils";

describe("cn", () => {
  it("merges class names", () => {
    expect(cn("foo", "bar")).toBe("foo bar");
  });

  it("handles conditional classes", () => {
    const isHidden = false;
    expect(cn("base", isHidden && "hidden", "end")).toBe("base end");
  });

  it("merges tailwind classes correctly", () => {
    expect(cn("px-4", "px-2")).toBe("px-2");
    expect(cn("text-sm", "text-lg")).toBe("text-lg");
  });

  it("handles undefined and null", () => {
    expect(cn("foo", undefined, null, "bar")).toBe("foo bar");
  });
});

import { describe, it, expect, beforeEach, vi } from "vitest";
import { usePackageStore } from "./store";
import { PackageState } from "./types";

vi.mock("./loader/directoryLoader", () => ({
  loadPackageFromDirectory: vi.fn(async () => ({
    manifest: { id: "test", name: "Test", format: "designpkg", version: "1.0.0", document: "d.json", tokens: "t.json", artboards: [], assets: {} },
    document: { id: "d", version: "1.0.0", unit: "px", colorSpace: "srgb", rootId: "r", artboards: [], assets: [], dependencies: {} },
    tokens: { colors: {}, fonts: {}, effects: {} },
    scenes: {},
    resolvedAssets: {},
    source: { type: "directory", basePath: "/test/" },
    state: "ready",
  })),
}));

vi.mock("./loader/zipLoader", () => ({
  loadPackageFromZip: vi.fn(async () => ({
    manifest: { id: "zip-test", name: "Zip", format: "designpkg", version: "1.0.0", document: "d.json", tokens: "t.json", artboards: [], assets: {} },
    document: { id: "d", version: "1.0.0", unit: "px", colorSpace: "srgb", rootId: "r", artboards: [], assets: [], dependencies: {} },
    tokens: { colors: {}, fonts: {}, effects: {} },
    scenes: {},
    resolvedAssets: {},
    source: { type: "zip", filename: "test.designpkg", data: new ArrayBuffer(0) },
    state: "ready",
  })),
}));

vi.mock("./serializer/zipSerializer", () => ({
  serializeToZip: vi.fn(async () => new Blob(["zip-content"])),
}));

describe("usePackageStore", () => {
  beforeEach(() => {
    usePackageStore.setState({
      current: null,
      state: PackageState.Idle,
      error: null,
      registry: [],
    });
  });

  it("starts with idle state", () => {
    const { state, current } = usePackageStore.getState();
    expect(state).toBe(PackageState.Idle);
    expect(current).toBeNull();
  });

  it("loads a package from directory", async () => {
    await usePackageStore.getState().loadFromDirectory("/packages/test/");
    const { current, state } = usePackageStore.getState();
    expect(state).toBe(PackageState.Ready);
    expect(current).not.toBeNull();
    expect(current!.manifest.id).toBe("test");
  });

  it("loads a package from zip", async () => {
    const file = new File([new ArrayBuffer(10)], "test.designpkg");
    await usePackageStore.getState().loadFromZip(file);
    const { current, state } = usePackageStore.getState();
    expect(state).toBe(PackageState.Ready);
    expect(current!.manifest.id).toBe("zip-test");
  });

  it("exports current package to zip", async () => {
    await usePackageStore.getState().loadFromDirectory("/test/");
    const blob = await usePackageStore.getState().exportToZip();
    expect(blob).toBeInstanceOf(Blob);
  });

  it("throws when exporting without loaded package", async () => {
    await expect(usePackageStore.getState().exportToZip()).rejects.toThrow(
      "No package loaded"
    );
  });

  it("updates a scene", async () => {
    await usePackageStore.getState().loadFromDirectory("/test/");
    const scene = {
      id: "ab.new",
      type: "artboard" as const,
      name: "New",
      width: 500,
      height: 500,
      unit: "px" as const,
      children: [],
    };
    usePackageStore.getState().updateScene("ab.new", scene);
    expect(usePackageStore.getState().getScene("ab.new")).toEqual(scene);
  });

  it("registers a package entry", () => {
    usePackageStore.getState().registerPackage({
      id: "pkg-1",
      name: "Package 1",
      source: { type: "directory", basePath: "/pkg1/" },
      loaded: false,
    });
    expect(usePackageStore.getState().registry).toHaveLength(1);
  });

  it("resets state", async () => {
    await usePackageStore.getState().loadFromDirectory("/test/");
    usePackageStore.getState().reset();
    expect(usePackageStore.getState().current).toBeNull();
    expect(usePackageStore.getState().state).toBe(PackageState.Idle);
  });
});

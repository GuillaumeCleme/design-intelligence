import { create } from "zustand";
import type {
  DesignPackageInstance,
  ArtboardScene,
  PackageRegistryEntry,
} from "./types";
import { PackageState } from "./types";
import { loadPackageFromDirectory } from "./loader/directoryLoader";
import { loadPackageFromZip } from "./loader/zipLoader";
import { serializeToZip } from "./serializer/zipSerializer";

type PackageStore = {
  /** Currently loaded package instance */
  current: DesignPackageInstance | null;
  /** Loading state */
  state: PackageState;
  /** Error message if loading failed */
  error: string | null;
  /** Registry of known packages (by ID or path) */
  registry: PackageRegistryEntry[];

  /** Load a package from a directory URL path */
  loadFromDirectory: (basePath: string) => Promise<void>;
  /** Load a package from a zip file */
  loadFromZip: (file: File) => Promise<void>;
  /** Serialize current package to a .designpkg zip and return blob */
  exportToZip: () => Promise<Blob>;
  /** Get a scene by artboard ID */
  getScene: (artboardId: string) => ArtboardScene | undefined;
  /** Update a scene in the loaded package */
  updateScene: (artboardId: string, scene: ArtboardScene) => void;
  /** Get the resolved URL for an asset */
  getAssetUrl: (assetId: string) => string | undefined;
  /** Register a package source for later loading */
  registerPackage: (entry: PackageRegistryEntry) => void;
  /** Reset to initial state */
  reset: () => void;
};

export const usePackageStore = create<PackageStore>((set, get) => ({
  current: null,
  state: PackageState.Idle,
  error: null,
  registry: [],

  loadFromDirectory: async (basePath) => {
    set({ state: PackageState.Loading, error: null });

    try {
      const instance = await loadPackageFromDirectory(basePath);
      set({ current: instance, state: PackageState.Ready, error: null });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      set({ state: PackageState.Error, error: message });
      throw err;
    }
  },

  loadFromZip: async (file) => {
    set({ state: PackageState.Loading, error: null });

    try {
      const instance = await loadPackageFromZip(file);
      set({ current: instance, state: PackageState.Ready, error: null });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      set({ state: PackageState.Error, error: message });
      throw err;
    }
  },

  exportToZip: async () => {
    const { current } = get();
    if (!current) {
      throw new Error("No package loaded to export");
    }
    return serializeToZip(current);
  },

  getScene: (artboardId) => {
    return get().current?.scenes[artboardId];
  },

  updateScene: (artboardId, scene) => {
    const { current } = get();
    if (!current) return;

    set({
      current: {
        ...current,
        scenes: {
          ...current.scenes,
          [artboardId]: scene,
        },
      },
    });
  },

  getAssetUrl: (assetId) => {
    return get().current?.resolvedAssets[assetId]?.url;
  },

  registerPackage: (entry) => {
    set((state) => ({
      registry: [...state.registry.filter((r) => r.id !== entry.id), entry],
    }));
  },

  reset: () => {
    set({ current: null, state: PackageState.Idle, error: null });
  },
}));

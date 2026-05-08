import { useEffect, useState, useCallback } from "react";
import { DesignCanvas } from "./DesignCanvas";
import { AppShell } from "./AppShell";
import { useToolStore } from "@/tools/store";
import { useInitExportPlugins } from "@/export/useExportPlugins";
import { ExportContextProvider } from "@/export/ExportContextProvider";
import type { ExportContext } from "@/export/types";
import { usePackageStore } from "@/package/store";
import { PackageState } from "@/package/types";
import { reflowScene } from "@/reflow/engine";
import { ReflowDialog } from "@/ui/ReflowDialog";

const DEFAULT_PACKAGE_PATH = `${import.meta.env.BASE_URL}packages/campaign-banners/`;

export default function App() {
  useInitExportPlugins();

  const { current, state, error, loadFromDirectory } = usePackageStore();
  const zoom = useToolStore((s) => s.zoom);

  const [selectedArtboardId, setSelectedArtboardId] = useState<string>("");
  const [reflowDialogOpen, setReflowDialogOpen] = useState(false);

  useEffect(() => {
    loadFromDirectory(DEFAULT_PACKAGE_PATH);
  }, [loadFromDirectory]);

  const effectiveArtboardId =
    selectedArtboardId || current?.manifest.artboards[0]?.id || "";

  const handleReflow = useCallback(
    (sourceArtboardId: string, targetWidth: number, targetHeight: number) => {
      if (!current) return;
      const sourceScene = current.scenes[sourceArtboardId];
      if (!sourceScene) return;

      const { scene: reflowed } = reflowScene({
        sourceScene,
        targetWidth,
        targetHeight,
      });

      const updateScene = usePackageStore.getState().updateScene;
      updateScene(reflowed.id, reflowed);

      const existingManifest = current.manifest;
      const maxX = existingManifest.artboards.reduce(
        (max, ab) => Math.max(max, (ab.x ?? 0) + ab.width),
        0,
      );

      const updatedManifest = {
        ...existingManifest,
        artboards: [
          ...existingManifest.artboards,
          {
            id: reflowed.id,
            name: reflowed.name,
            path: `artboards/reflow-${targetWidth}x${targetHeight}/scene.json`,
            width: reflowed.width,
            height: reflowed.height,
            x: maxX + 140,
            y: 0,
          },
        ],
      };

      usePackageStore.setState((state) => ({
        current: state.current
          ? {
              ...state.current,
              manifest: updatedManifest,
              scenes: {
                ...state.current.scenes,
                [reflowed.id]: reflowed,
              },
            }
          : null,
      }));

      setSelectedArtboardId(reflowed.id);
    },
    [current],
  );

  const openReflowDialog = useCallback(() => {
    setReflowDialogOpen(true);
  }, []);

  if (state === PackageState.Loading || state === PackageState.Idle) {
    return (
      <div className="w-screen h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-2 border-brand border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-sm text-muted-foreground">Loading design package...</p>
        </div>
      </div>
    );
  }

  if (state === PackageState.Error || !current) {
    return (
      <div className="w-screen h-screen flex items-center justify-center bg-background">
        <div className="text-center max-w-md">
          <p className="text-destructive font-medium mb-2">Failed to load package</p>
          <p className="text-sm text-muted-foreground">{error}</p>
        </div>
      </div>
    );
  }

  const assetMap = Object.fromEntries(
    Object.entries(current.resolvedAssets).map(([id, resolved]) => [
      id,
      { ...resolved.entry, path: resolved.url },
    ])
  );

  const exportContext: ExportContext = {
    manifest: current.manifest,
    tokens: current.tokens,
    scenes: current.scenes,
    assets: assetMap,
    selectedArtboardId: effectiveArtboardId,
  };

  return (
    <ExportContextProvider value={exportContext}>
      <AppShell onReflowRequest={openReflowDialog}>
        <DesignCanvas
          manifestArtboards={current.manifest.artboards}
          scenes={current.scenes}
          assets={assetMap}
          tokens={current.tokens}
          selectedArtboardId={effectiveArtboardId}
          zoom={zoom}
          onSelectArtboard={setSelectedArtboardId}
        />
      </AppShell>
      <ReflowDialog
        open={reflowDialogOpen}
        onOpenChange={setReflowDialogOpen}
        artboards={current.manifest.artboards}
        scenes={current.scenes}
        selectedArtboardId={effectiveArtboardId}
        onReflow={handleReflow}
      />
    </ExportContextProvider>
  );
}

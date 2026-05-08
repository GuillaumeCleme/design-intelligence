import { useEffect, useState } from "react";
import { DesignCanvas } from "./DesignCanvas";
import { AppShell } from "./AppShell";
import { useToolStore } from "@/tools/store";
import { useInitExportPlugins } from "@/export/useExportPlugins";
import { ExportContextProvider } from "@/export/ExportContextProvider";
import type { ExportContext } from "@/export/types";
import { usePackageStore } from "@/package/store";
import { PackageState } from "@/package/types";

const DEFAULT_PACKAGE_PATH = "/packages/campaign-banners/";

export default function App() {
  useInitExportPlugins();

  const { current, state, error, loadFromDirectory } = usePackageStore();
  const zoom = useToolStore((s) => s.zoom);

  const [selectedArtboardId, setSelectedArtboardId] = useState<string>("");

  useEffect(() => {
    loadFromDirectory(DEFAULT_PACKAGE_PATH);
  }, [loadFromDirectory]);

  const effectiveArtboardId =
    selectedArtboardId || current?.manifest.artboards[0]?.id || "";

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
      <AppShell>
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
    </ExportContextProvider>
  );
}

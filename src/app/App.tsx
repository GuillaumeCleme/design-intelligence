import { useMemo, useState } from "react";

import manifestJson from "../sample/manifest.json";
import tokensJson from "../sample/tokens.json";
import squareSceneJson from "../sample/artboards/square-1080.scene.json";
import wideSceneJson from "../sample/artboards/wide-1920.scene.json";

import { DesignPackageManifestSchema } from "../schema/designPackage.schema";
import { ArtboardSceneSchema } from "../schema/nodes.schema";
import type {
  ArtboardScene,
  DesignPackageManifest,
  Tokens,
} from "../package/types";
import { DesignCanvas } from "./DesignCanvas";
import { AppShell } from "./AppShell";
import { useToolStore } from "@/tools/store";
import { useInitExportPlugins } from "@/export/useExportPlugins";
import { ExportContextProvider } from "@/export/ExportContextProvider";
import type { ExportContext } from "@/export/types";

export default function App() {
  useInitExportPlugins();

  const manifest = useMemo(
    () =>
      DesignPackageManifestSchema.parse(manifestJson) as DesignPackageManifest,
    []
  );

  const tokens = useMemo(() => tokensJson as Tokens, []);

  const scenes: Record<string, ArtboardScene> = useMemo(() => {
    const squareScene = ArtboardSceneSchema.parse(
      squareSceneJson
    ) as ArtboardScene;

    const wideScene = ArtboardSceneSchema.parse(
      wideSceneJson
    ) as ArtboardScene;

    return {
      [squareScene.id]: squareScene,
      [wideScene.id]: wideScene,
    };
  }, []);

  const zoom = useToolStore((s) => s.zoom);

  const [selectedArtboardId, setSelectedArtboardId] = useState<string>(
    manifest.artboards[0].id
  );

  const exportContext: ExportContext = useMemo(
    () => ({
      manifest,
      tokens,
      scenes,
      assets: manifest.assets,
      selectedArtboardId,
    }),
    [manifest, tokens, scenes, selectedArtboardId]
  );

  return (
    <ExportContextProvider value={exportContext}>
      <AppShell>
        <DesignCanvas
          manifestArtboards={manifest.artboards}
          scenes={scenes}
          assets={manifest.assets}
          tokens={tokens}
          selectedArtboardId={selectedArtboardId}
          zoom={zoom}
          onSelectArtboard={setSelectedArtboardId}
        />
      </AppShell>
    </ExportContextProvider>
  );
}

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
import { useState } from "react";

export default function App() {
  const manifest = DesignPackageManifestSchema.parse(
    manifestJson
  ) as DesignPackageManifest;

  const tokens = tokensJson as Tokens;

  const squareScene = ArtboardSceneSchema.parse(
    squareSceneJson
  ) as ArtboardScene;

  const wideScene = ArtboardSceneSchema.parse(wideSceneJson) as ArtboardScene;

  const scenes: Record<string, ArtboardScene> = {
    [squareScene.id]: squareScene,
    [wideScene.id]: wideScene,
  };

  const zoom = useToolStore((s) => s.zoom);

  const [selectedArtboardId, setSelectedArtboardId] = useState<string>(
    manifest.artboards[0].id
  );

  return (
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
  );
}

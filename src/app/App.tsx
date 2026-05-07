import { useState } from "react";

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
import { exportArtboardToPng, downloadBlob } from "../renderer/exportArtboard";
import { saveDesignPackage } from "../package/saveDesignPackage";

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

  const [selectedArtboardId, setSelectedArtboardId] = useState<string>(
    manifest.artboards[0].id
  );

  const [zoom, setZoom] = useState(0.25);

  return (
    <div>
      <div
        style={{
          position: "fixed",
          zIndex: 10,
          left: 16,
          top: 16,
          background: "white",
          borderRadius: 8,
          padding: 12,
          fontFamily: "system-ui",
          boxShadow: "0 4px 16px rgba(0,0,0,0.25)",
        }}
      >
        <strong>Design Package POC</strong>

        <div style={{ marginTop: 8 }}>
          <label>
            Zoom:{" "}
            <input
              type="range"
              min="0.1"
              max="1"
              step="0.05"
              value={zoom}
              onChange={(event) => setZoom(Number(event.target.value))}
            />
            {zoom.toFixed(2)}
          </label>
        </div>

        <div style={{ marginTop: 8, display: "flex", gap: 8 }}>
          <button
            onClick={async () => {
              const scene = scenes[selectedArtboardId];
              const blob = await exportArtboardToPng({
                scene,
                assets: manifest.assets,
                tokens,
              });

              downloadBlob(blob, `${scene.id}.png`);
            }}
          >
            Export selected PNG
          </button>

          <button
            onClick={async () => {
              const blob = await saveDesignPackage({
                manifest,
                tokens,
                scenes,
              });

              downloadBlob(blob, "campaign-banners.designpkg");
            }}
          >
            Save .designpkg
          </button>
        </div>
      </div>

      <DesignCanvas
        manifestArtboards={manifest.artboards}
        scenes={scenes}
        assets={manifest.assets}
        tokens={tokens}
        selectedArtboardId={selectedArtboardId}
        zoom={zoom}
        onSelectArtboard={setSelectedArtboardId}
      />
    </div>
  );
}

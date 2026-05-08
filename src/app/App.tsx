import { useEffect, useState, useCallback } from "react";
import { DesignCanvas } from "./DesignCanvas";
import { AppShell } from "./AppShell";
import { useToolStore } from "@/tools/store";
import { useInitExportPlugins } from "@/export/useExportPlugins";
import { ExportContextProvider } from "@/export/ExportContextProvider";
import type { ExportContext } from "@/export/types";
import { usePackageStore } from "@/package/store";
import { PackageState } from "@/package/types";
import type { ArtboardScene, SceneNode } from "@/package/types";
import { reflowScene } from "@/reflow/engine";
import { ReflowDialog } from "@/ui/ReflowDialog";
import { ContextMenu, PropertiesPanel, useEditorStore } from "@/editor";

const DEFAULT_PACKAGE_PATH = `${import.meta.env.BASE_URL}packages/campaign-banners/`;

export default function App() {
  useInitExportPlugins();

  const { current, state, error, loadFromDirectory } = usePackageStore();
  const zoom = useToolStore((s) => s.zoom);

  const [selectedArtboardId, setSelectedArtboardId] = useState<string>("");
  const [reflowDialogOpen, setReflowDialogOpen] = useState(false);
  const [propertiesPanelOpen, setPropertiesPanelOpen] = useState(false);

  useEffect(() => {
    loadFromDirectory(DEFAULT_PACKAGE_PATH);
  }, [loadFromDirectory]);

  const effectiveArtboardId =
    selectedArtboardId || current?.manifest.artboards[0]?.id || "";

  const handleUpdateNode = useCallback(
    (artboardId: string, nodeId: string, patch: Partial<SceneNode>) => {
      if (!current) return;
      const scene = current.scenes[artboardId];
      if (!scene) return;

      const updatedChildren = scene.children.map((child) =>
        child.id === nodeId ? { ...child, ...patch } as SceneNode : child,
      );

      const updatedScene: ArtboardScene = {
        ...scene,
        children: updatedChildren,
      };

      usePackageStore.getState().updateScene(artboardId, updatedScene);
    },
    [current],
  );

  const handleDeleteNode = useCallback(
    (artboardId: string, nodeId: string) => {
      if (!current) return;
      const scene = current.scenes[artboardId];
      if (!scene) return;

      const updatedScene: ArtboardScene = {
        ...scene,
        children: scene.children.filter((child) => child.id !== nodeId),
      };

      usePackageStore.getState().updateScene(artboardId, updatedScene);
      useEditorStore.getState().deselectAll();
    },
    [current],
  );

  const handleDuplicateNode = useCallback(
    (artboardId: string, nodeId: string) => {
      if (!current) return;
      const scene = current.scenes[artboardId];
      if (!scene) return;

      const node = scene.children.find((n) => n.id === nodeId);
      if (!node) return;

      const duplicate: SceneNode = {
        ...node,
        id: `${node.id}.copy.${Date.now()}`,
        name: node.name ? `${node.name} Copy` : undefined,
        x: node.x + 20,
        y: node.y + 20,
      } as SceneNode;

      const updatedScene: ArtboardScene = {
        ...scene,
        children: [...scene.children, duplicate],
      };

      usePackageStore.getState().updateScene(artboardId, updatedScene);
      useEditorStore.getState().selectNode(duplicate.id);
    },
    [current],
  );

  const handleReorderNode = useCallback(
    (artboardId: string, nodeId: string, direction: "up" | "down" | "top" | "bottom") => {
      if (!current) return;
      const scene = current.scenes[artboardId];
      if (!scene) return;

      const children = [...scene.children];
      const idx = children.findIndex((n) => n.id === nodeId);
      if (idx === -1) return;

      const [node] = children.splice(idx, 1);

      switch (direction) {
        case "up":
          children.splice(Math.min(idx + 1, children.length), 0, node);
          break;
        case "down":
          children.splice(Math.max(idx - 1, 0), 0, node);
          break;
        case "top":
          children.push(node);
          break;
        case "bottom":
          children.unshift(node);
          break;
      }

      const updatedScene: ArtboardScene = { ...scene, children };
      usePackageStore.getState().updateScene(artboardId, updatedScene);
    },
    [current],
  );

  const handleOpenProperties = useCallback(() => {
    setPropertiesPanelOpen(true);
  }, []);

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

      usePackageStore.setState((s) => ({
        current: s.current
          ? {
              ...s.current,
              manifest: updatedManifest,
              scenes: { ...s.current.scenes, [reflowed.id]: reflowed },
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
    ]),
  );

  const exportContext: ExportContext = {
    manifest: current.manifest,
    tokens: current.tokens,
    scenes: current.scenes,
    assets: assetMap,
    selectedArtboardId: effectiveArtboardId,
  };

  const activeScene = current.scenes[effectiveArtboardId];

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
          onUpdateNode={handleUpdateNode}
        />
      </AppShell>

      {/* Context menu */}
      {activeScene && (
        <ContextMenu
          scene={activeScene}
          onUpdateNode={handleUpdateNode}
          onDeleteNode={handleDeleteNode}
          onDuplicateNode={handleDuplicateNode}
          onReorderNode={handleReorderNode}
          onOpenProperties={handleOpenProperties}
        />
      )}

      {/* Properties panel */}
      {activeScene && (
        <PropertiesPanel
          scene={activeScene}
          open={propertiesPanelOpen}
          onClose={() => setPropertiesPanelOpen(false)}
          onUpdateNode={handleUpdateNode}
        />
      )}

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

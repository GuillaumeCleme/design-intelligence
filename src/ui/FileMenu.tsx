import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import {
  MoreHorizontal,
  FilePlus,
  FolderOpen,
  Save,
  FileImage,
  FileCode,
  FileText,
  Package,
  PackageOpen,
  Layers,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useToolStore } from "@/tools/store";
import { ActionId } from "@/tools/types";
import { useExportRegistry } from "@/export/registry";
import { useExecuteExport } from "@/export/useExportPlugins";
import { useExportContext } from "@/export/ExportContextProvider";

export function FileMenu() {
  const { executeAction } = useToolStore();
  const { getEnabledPlugins } = useExportRegistry();
  const enabledPlugins = getEnabledPlugins();
  const executeExport = useExecuteExport();
  const exportContext = useExportContext();

  return (
    <div className="fixed top-4 left-4 z-50">
      <DropdownMenu.Root>
        <DropdownMenu.Trigger asChild>
          <button
            className={cn(
              "flex items-center justify-center h-9 w-9 rounded-lg",
              "bg-card/90 backdrop-blur-xl border border-border",
              "hover:bg-accent transition-colors shadow-lg",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            )}
            aria-label="File options"
          >
            <MoreHorizontal className="h-4 w-4 text-foreground" />
          </button>
        </DropdownMenu.Trigger>

        <DropdownMenu.Portal>
          <DropdownMenu.Content
            align="start"
            sideOffset={8}
            className={cn(
              "min-w-[200px] rounded-xl border border-border bg-popover/95 backdrop-blur-xl p-1 shadow-2xl",
              "animate-in fade-in-0 zoom-in-95 data-[side=bottom]:slide-in-from-top-2"
            )}
          >
            <DropdownMenu.Label className="px-3 py-1.5 text-xs font-medium text-muted-foreground">
              File
            </DropdownMenu.Label>

            <MenuItem
              icon={<FilePlus className="h-4 w-4" />}
              label="New File"
              shortcut="⌘N"
              onClick={() => executeAction(ActionId.NewFile)}
            />
            <MenuItem
              icon={<FolderOpen className="h-4 w-4" />}
              label="Open"
              shortcut="⌘O"
              onClick={() => executeAction(ActionId.OpenFile)}
            />
            <MenuItem
              icon={<Save className="h-4 w-4" />}
              label="Save"
              shortcut="⌘S"
              onClick={() => executeAction(ActionId.SaveFile)}
            />

            <DropdownMenu.Separator className="my-1 h-px bg-border" />

            <DropdownMenu.Label className="px-3 py-1.5 text-xs font-medium text-muted-foreground">
              Import / Export
            </DropdownMenu.Label>

            <MenuItem
              icon={<PackageOpen className="h-4 w-4" />}
              label="Import .designpkg"
              onClick={() => executeAction(ActionId.ImportDesignpkg)}
            />

            <DropdownMenu.Sub>
              <DropdownMenu.SubTrigger
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-foreground",
                  "outline-none cursor-pointer select-none",
                  "data-[highlighted]:bg-accent"
                )}
              >
                <FileImage className="h-4 w-4 text-muted-foreground" />
                <span className="flex-1">Export as...</span>
                <span className="text-xs text-muted-foreground">▸</span>
              </DropdownMenu.SubTrigger>

              <DropdownMenu.Portal>
                <DropdownMenu.SubContent
                  sideOffset={4}
                  className={cn(
                    "min-w-[180px] rounded-xl border border-border bg-popover/95 backdrop-blur-xl p-1 shadow-2xl",
                    "animate-in fade-in-0 zoom-in-95"
                  )}
                >
                  <MenuItem
                    icon={<FileImage className="h-4 w-4" />}
                    label="PNG"
                    shortcut="⌘⇧E"
                    onClick={() => executeAction(ActionId.ExportPng)}
                  />
                  <MenuItem
                    icon={<FileImage className="h-4 w-4" />}
                    label="WebP"
                    onClick={() => executeAction(ActionId.ExportWebp)}
                  />
                  <MenuItem
                    icon={<FileCode className="h-4 w-4" />}
                    label="SVG"
                    onClick={() => executeAction(ActionId.ExportSvg)}
                  />
                  <MenuItem
                    icon={<FileText className="h-4 w-4" />}
                    label="PDF"
                    onClick={() => executeAction(ActionId.ExportPdf)}
                  />
                  <MenuItem
                    icon={<Package className="h-4 w-4" />}
                    label=".designpkg"
                    onClick={() => executeAction(ActionId.ExportDesignpkg)}
                  />

                  {enabledPlugins.length > 0 && (
                    <>
                      <DropdownMenu.Separator className="my-1 h-px bg-border" />
                      <DropdownMenu.Label className="px-2 py-1 text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                        Plugins
                      </DropdownMenu.Label>
                      {enabledPlugins.map((plugin) => (
                        <MenuItem
                          key={plugin.id}
                          icon={<Layers className="h-4 w-4" />}
                          label={plugin.name}
                          onClick={() => {
                            executeExport(plugin.id, exportContext).catch(
                              (err) =>
                                console.error(`[Export] ${plugin.id} failed:`, err)
                            );
                          }}
                        />
                      ))}
                    </>
                  )}
                </DropdownMenu.SubContent>
              </DropdownMenu.Portal>
            </DropdownMenu.Sub>
          </DropdownMenu.Content>
        </DropdownMenu.Portal>
      </DropdownMenu.Root>
    </div>
  );
}

function MenuItem({
  icon,
  label,
  shortcut,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  shortcut?: string;
  onClick?: () => void;
}) {
  return (
    <DropdownMenu.Item
      className={cn(
        "flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-foreground",
        "outline-none cursor-pointer select-none",
        "data-[highlighted]:bg-accent"
      )}
      onClick={onClick}
    >
      <span className="text-muted-foreground">{icon}</span>
      <span className="flex-1">{label}</span>
      {shortcut && (
        <span className="text-xs text-muted-foreground font-mono">
          {shortcut}
        </span>
      )}
    </DropdownMenu.Item>
  );
}

import type { ReactNode } from "react";
import { CommandBar } from "@/ui/CommandBar";
import { FileMenu } from "@/ui/FileMenu";
import { ToolIndicator } from "@/ui/ToolIndicator";

type Props = {
  children: ReactNode;
};

export function AppShell({ children }: Props) {
  return (
    <div className="relative w-screen h-screen overflow-hidden bg-background">
      {/* Canvas layer - rendered below the UI */}
      <div className="absolute inset-0">{children}</div>

      {/* UI overlay layer */}
      <FileMenu />
      <ToolIndicator />
      <CommandBar />
    </div>
  );
}

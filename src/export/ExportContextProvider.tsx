import { createContext, useContext, type ReactNode } from "react";
import type { ExportContext } from "./types";

const ExportCtx = createContext<ExportContext | null>(null);

export function ExportContextProvider({
  value,
  children,
}: {
  value: ExportContext;
  children: ReactNode;
}) {
  return <ExportCtx.Provider value={value}>{children}</ExportCtx.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useExportContext(): ExportContext {
  const ctx = useContext(ExportCtx);
  if (!ctx) {
    throw new Error(
      "useExportContext must be used within an ExportContextProvider"
    );
  }
  return ctx;
}

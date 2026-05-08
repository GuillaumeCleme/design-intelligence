import type { ExportResult } from "./types";

export function downloadExportResult(result: ExportResult) {
  const url = URL.createObjectURL(result.blob);

  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = result.filename;
  anchor.click();

  URL.revokeObjectURL(url);
}

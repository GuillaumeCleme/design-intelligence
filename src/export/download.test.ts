import { describe, it, expect, vi, beforeEach } from "vitest";
import { downloadExportResult } from "./download";
import type { ExportResult } from "./types";

describe("downloadExportResult", () => {
  let mockClick: ReturnType<typeof vi.fn>;
  let mockCreateObjectURL: ReturnType<typeof vi.fn>;
  let mockRevokeObjectURL: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockClick = vi.fn();
    mockCreateObjectURL = vi.fn(() => "blob:test-url");
    mockRevokeObjectURL = vi.fn();

    vi.stubGlobal("URL", {
      createObjectURL: mockCreateObjectURL,
      revokeObjectURL: mockRevokeObjectURL,
    });

    vi.spyOn(document, "createElement").mockReturnValue({
      href: "",
      download: "",
      click: mockClick,
    } as unknown as HTMLElement);
  });

  it("creates a download link and clicks it", () => {
    const result: ExportResult = {
      blob: new Blob(["test"]),
      filename: "output.psd",
      mimeType: "application/octet-stream",
    };

    downloadExportResult(result);

    expect(mockCreateObjectURL).toHaveBeenCalledWith(result.blob);
    expect(mockClick).toHaveBeenCalled();
    expect(mockRevokeObjectURL).toHaveBeenCalledWith("blob:test-url");
  });
});

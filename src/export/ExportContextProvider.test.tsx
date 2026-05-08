import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { ExportContextProvider, useExportContext } from "./ExportContextProvider";
import type { ExportContext } from "./types";

const mockContext: ExportContext = {
  manifest: {
    id: "test",
    name: "Test",
    format: "designpkg",
    version: "0.1.0",
    document: "doc.json",
    tokens: "tok.json",
    artboards: [],
    assets: {},
  },
  tokens: { colors: {}, fonts: {}, effects: {} },
  scenes: {},
  assets: {},
  selectedArtboardId: "ab.1",
};

function TestConsumer() {
  const ctx = useExportContext();
  return <div data-testid="ctx-id">{ctx.manifest.id}</div>;
}

describe("ExportContextProvider", () => {
  it("provides context to children", () => {
    render(
      <ExportContextProvider value={mockContext}>
        <TestConsumer />
      </ExportContextProvider>
    );

    expect(screen.getByTestId("ctx-id").textContent).toBe("test");
  });

  it("throws when useExportContext is used outside provider", () => {
    expect(() => {
      render(<TestConsumer />);
    }).toThrow("useExportContext must be used within");
  });
});

import { describe, it, expect } from "vitest";
import {
  TOOLS,
  ACTIONS,
  SLASH_COMMANDS,
  buildSlashCommands,
  findToolById,
  findActionById,
} from "./registry";
import { ToolId, ActionId } from "./types";

describe("TOOLS", () => {
  it("contains all expected tool IDs", () => {
    const ids = TOOLS.map((t) => t.id);
    expect(ids).toContain(ToolId.Select);
    expect(ids).toContain(ToolId.Pen);
    expect(ids).toContain(ToolId.Brush);
    expect(ids).toContain(ToolId.Rectangle);
    expect(ids).toContain(ToolId.Text);
  });

  it("every tool has required fields", () => {
    for (const tool of TOOLS) {
      expect(tool.id).toBeTruthy();
      expect(tool.name).toBeTruthy();
      expect(tool.description).toBeTruthy();
      expect(tool.icon).toBeTruthy();
      expect(tool.category).toBeTruthy();
    }
  });
});

describe("ACTIONS", () => {
  it("contains export actions", () => {
    const ids = ACTIONS.map((a) => a.id);
    expect(ids).toContain(ActionId.ExportPng);
    expect(ids).toContain(ActionId.ExportDesignpkg);
    expect(ids).toContain(ActionId.SaveFile);
  });

  it("contains add actions", () => {
    const ids = ACTIONS.map((a) => a.id);
    expect(ids).toContain(ActionId.AddRectangle);
    expect(ids).toContain(ActionId.AddText);
    expect(ids).toContain(ActionId.AddImage);
  });

  it("every action has a category", () => {
    for (const action of ACTIONS) {
      expect(["add", "edit", "export", "view", "file"]).toContain(action.category);
    }
  });
});

describe("buildSlashCommands", () => {
  it("produces commands from both tools and actions", () => {
    const commands = buildSlashCommands();
    const toolCommands = commands.filter((c) => c.type === "tool");
    const actionCommands = commands.filter((c) => c.type === "action");

    expect(toolCommands.length).toBe(TOOLS.length);
    expect(actionCommands.length).toBe(ACTIONS.length);
  });

  it("tool commands use /use prefix", () => {
    const commands = buildSlashCommands();
    const toolCommands = commands.filter((c) => c.type === "tool");

    for (const cmd of toolCommands) {
      expect(cmd.command).toMatch(/^\/use /);
    }
  });

  it("add commands use /add prefix", () => {
    const commands = buildSlashCommands();
    const addCommands = commands.filter((c) => c.command.startsWith("/add "));

    expect(addCommands.length).toBeGreaterThan(0);
    for (const cmd of addCommands) {
      expect(cmd.type).toBe("action");
    }
  });
});

describe("SLASH_COMMANDS", () => {
  it("is pre-built and non-empty", () => {
    expect(SLASH_COMMANDS.length).toBeGreaterThan(0);
  });
});

describe("findToolById", () => {
  it("finds existing tool", () => {
    const tool = findToolById(ToolId.Pen);
    expect(tool).toBeDefined();
    expect(tool!.name).toBe("Pen");
  });

  it("returns undefined for non-existent tool", () => {
    expect(findToolById("nonexistent" as never)).toBeUndefined();
  });
});

describe("findActionById", () => {
  it("finds existing action", () => {
    const action = findActionById(ActionId.Undo);
    expect(action).toBeDefined();
    expect(action!.name).toBe("Undo");
  });

  it("returns undefined for non-existent action", () => {
    expect(findActionById("nonexistent" as never)).toBeUndefined();
  });
});

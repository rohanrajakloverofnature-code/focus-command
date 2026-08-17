import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("Focus Command interaction-safe persistence scheduling", () => {
  it("defers only the debounced serialization behind native interactions while preserving immediate flush paths", () => {
    const source = readFileSync(resolve(process.cwd(), "lib/focus-command.tsx"), "utf8");

    expect(source).toContain("function getRuntimeInteractionManager()");
    expect(source).toContain("interactionManager?.runAfterInteractions(flushWhenIdle)");
    expect(source).toContain("if (!interactionPersistenceTask.current) flushWhenIdle()");
    expect(source).toContain("if (nextState !== \"active\") void flushPendingPersistence()");
    expect(source).toContain("void flushPendingPersistence();");
    expect(source).toContain("interactionPersistenceTask.current.cancel?.();");
  });
});

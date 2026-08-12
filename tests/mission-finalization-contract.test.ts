import { expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const focusCommandSource = readFileSync(join(process.cwd(), "lib", "focus-command.tsx"), "utf8");

it("allocates the completion result identifier before the queued state transaction", () => {
  const finishMissionStart = focusCommandSource.indexOf("const finishMission = useCallback");
  const finishMissionSource = focusCommandSource.slice(finishMissionStart, focusCommandSource.indexOf("const logRevisionTopic", finishMissionStart));

  expect(finishMissionSource).toContain('sourceMission.status !== "active" && sourceMission.status !== "paused"');
  expect(finishMissionSource.indexOf('const completionId = createId("completion")')).toBeLessThan(finishMissionSource.indexOf("commit((current) =>"));
  expect(finishMissionSource).toContain("return { completionId, durationMs, lootReward };");
});

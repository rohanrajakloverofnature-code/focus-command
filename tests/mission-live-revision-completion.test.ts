import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { getDueMissionRevisions, type SrsTopic } from "../lib/focus-command";

const missionSource = readFileSync(join(process.cwd(), "app", "mission", "[id].tsx"), "utf8");
const focusCommandSource = readFileSync(join(process.cwd(), "lib", "focus-command.tsx"), "utf8");

function topic(input: Partial<SrsTopic>): SrsTopic {
  return {
    id: "topic",
    missionId: "mission-alpha",
    subject: "Physics",
    topic: "Vectors",
    stage: 0,
    dueDate: "2026-08-16",
    completedAt: null,
    createdAt: "2026-08-15T09:00:00.000Z",
    status: "scheduled",
    ...input,
  };
}

describe("Live-mission revision completion contracts", () => {
  it("selects only the due non-completed records linked to the opened mission, including overdue records", () => {
    const records = [
      topic({ id: "today", stage: 0, dueDate: "2026-08-16" }),
      topic({ id: "overdue", stage: 1, dueDate: "2026-08-14" }),
      topic({ id: "future", stage: 2, dueDate: "2026-08-17" }),
      topic({ id: "completed", stage: 3, dueDate: "2026-08-13", status: "completed", completedAt: "2026-08-14T09:00:00.000Z" }),
      topic({ id: "other-mission", missionId: "mission-beta", dueDate: "2026-08-12" }),
    ];

    expect(getDueMissionRevisions(records, "mission-alpha", "UTC", "2026-08-16T12:00:00.000Z").map((entry) => entry.id)).toEqual(["overdue", "today"]);
  });

  it("keeps same-name records independent because selection and completion use durable topic IDs", () => {
    const records = [
      topic({ id: "day-seven", topic: "Quadratic Equations", stage: 1, dueDate: "2026-08-16" }),
      topic({ id: "new-day-one", topic: "Quadratic Equations", stage: 0, dueDate: "2026-08-16" }),
    ];

    expect(getDueMissionRevisions(records, "mission-alpha", "UTC", "2026-08-16T12:00:00.000Z").map((entry) => entry.id)).toEqual(["day-seven", "new-day-one"]);
    expect(missionSource).toContain("completeRevision(topic.id)");
    expect(missionSource).toContain("revisionCompletionLocks.current.has(topic.id)");
  });

  it("preserves the existing Day 1 → Day 7 → Day 30 advancement engine and exact reminder timing", () => {
    const completionSource = focusCommandSource.slice(
      focusCommandSource.indexOf("const completeRevision = useCallback"),
      focusCommandSource.indexOf("const createBoss", focusCommandSource.indexOf("const completeRevision = useCallback")),
    );

    expect(completionSource).toContain("const nextStage = topic.stage + 1");
    expect(completionSource).toContain("if (nextStage >= 3)");
    expect(completionSource).toContain("const intervals = [1, 7, 30]");
    expect(completionSource).toContain("dueDate: addDays(today, intervals[nextStage])");
    expect(missionSource).toContain("const nextDelayDays = topic.stage === 0 ? 7 : topic.stage === 1 ? 30 : null");
    expect(missionSource).toContain("void scheduleRevisionReminder(topic.topic, nextDue.toISOString(), notificationRules, revisionReminderSound)");
  });

  it("keeps manual logging intact and limits the added completion control to active or paused missions", () => {
    expect(missionSource).toContain("const logTopic = () => {");
    expect(missionSource).toContain("logRevisionTopic(mission.id, revisionTopic, mission.subject)");
    expect(missionSource).toContain("placeholder=\"Topic name\"");
    expect(missionSource).toContain("label=\"Log\"");
    expect(missionSource).toContain('(mission.status === "active" || mission.status === "paused") && dueMissionRevisions.length');
    expect(missionSource).toContain("label=\"Complete review\"");
  });

  it("locks a rapid repeated completion and clears that lock only after the exact due record leaves the narrow selection", () => {
    expect(missionSource).toContain("const revisionCompletionLocks = useRef(new Set<string>())");
    expect(missionSource).toContain("revisionCompletionLocks.current.add(topic.id)");
    expect(missionSource).toContain("if (!dueTopicIds.has(topicId)) revisionCompletionLocks.current.delete(topicId)");
    expect(missionSource).toContain("missionRevisionTopics: state.srsTopics.filter((topic) => topic.missionId === missionId)");
  });
});

import { expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const archiveSource = readFileSync(join(process.cwd(), "app", "command-archive.tsx"), "utf8");
const missionBoardSource = readFileSync(join(process.cwd(), "app", "(tabs)", "missions.tsx"), "utf8");

it("keeps monthly command summaries connected only to existing filtered History", () => {
  expect(archiveSource).toContain('pathname: "/missions", params: { filter: "completed", archiveMonth: month.key }');
  expect(archiveSource).toContain('pathname: "/missions", params: { filter: "completed", archiveMonth: month.key, archiveSubject: item.label }');
  expect(missionBoardSource).toContain("archiveMonth");
  expect(missionBoardSource).toContain("archiveSubject");
  expect(missionBoardSource).toContain("archiveHistoryLabel");
});

it("keeps studied-topic rows connected to the established Revision Queue or related History", () => {
  expect(archiveSource).toContain('pathname: "/revisions", params: { topic: item.revisionTopicId }');
  expect(archiveSource).toContain('pathname: "/missions", params: { filter: "completed", archiveMonth: item.firstMonthKey, archiveSubject: item.subject }');
  expect(archiveSource).toContain("revisionCompletionPercent");
  expect(archiveSource).toContain("NOT ENROLLED");
});

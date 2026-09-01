import { toLocalDate, type MistakeLedgerActivity, type MistakeLedgerEntry, type MistakeLedgerStatus } from "./focus-command";

export type MistakeLedgerRange =
  | { kind: "week" | "month" | "year" | "lifetime" }
  | { kind: "custom"; startDate: string; endDate: string };

export const MISTAKE_LEDGER_STATUS_LABELS: Record<MistakeLedgerStatus, string> = {
  noted: "Noted",
  working_on: "Currently Working On",
  improving: "Improving",
  improved: "Improved",
  needs_review: "Needs Review",
};

export function getMistakeLedgerSubjects(entries: readonly MistakeLedgerEntry[]): string[] {
  return Array.from(new Set(entries.map((entry) => entry.subject.trim()).filter(Boolean))).sort((left, right) => left.localeCompare(right));
}

function toStartOfWeek(localDate: string): string {
  const date = new Date(`${localDate}T12:00:00`);
  const day = date.getDay();
  date.setDate(date.getDate() - (day === 0 ? 6 : day - 1));
  return date.toISOString().slice(0, 10);
}

export function isMistakeLedgerDateInRange(actionDate: string, range: MistakeLedgerRange, timezone: string, now = new Date()): boolean {
  if (range.kind === "lifetime") return true;
  if (range.kind === "custom") return /^\d{4}-\d{2}-\d{2}$/.test(range.startDate) && /^\d{4}-\d{2}-\d{2}$/.test(range.endDate) && range.startDate <= range.endDate && actionDate >= range.startDate && actionDate <= range.endDate;
  const today = toLocalDate(now.toISOString(), timezone);
  if (range.kind === "week") return actionDate >= toStartOfWeek(today) && actionDate <= today;
  if (range.kind === "month") return actionDate.slice(0, 7) === today.slice(0, 7);
  return actionDate.slice(0, 4) === today.slice(0, 4);
}

export function getMistakeLedgerActivities(
  entries: readonly MistakeLedgerEntry[],
  activity: readonly MistakeLedgerActivity[],
  range: MistakeLedgerRange,
  subject: string,
  status: MistakeLedgerStatus | "all",
  timezone: string,
  now = new Date(),
): (MistakeLedgerActivity & { entry: MistakeLedgerEntry })[] {
  const byId = new Map(entries.map((entry) => [entry.id, entry]));
  return activity
    .flatMap((record) => {
      const entry = byId.get(record.entryId);
      return entry ? [{ ...record, entry }] : [];
    })
    .filter((record) => isMistakeLedgerDateInRange(record.actionDate, range, timezone, now))
    .filter((record) => subject === "all" || record.entry.subject === subject)
    .filter((record) => status === "all" || record.status === status)
    .sort((left, right) => right.occurredAt.localeCompare(left.occurredAt));
}

export function getMistakeLedgerSummary(activity: readonly MistakeLedgerActivity[]) {
  return {
    noted: activity.filter((record) => record.kind === "created").length,
    improved: activity.filter((record) => record.kind === "status" && record.status === "improved").length,
  };
}

import {
  MISTAKE_LEDGER_STATUSES,
  type MistakeLedgerActivity,
  type MistakeLedgerEntry,
  type MistakeLedgerStatus,
  toLocalDate,
} from "./focus-command";
import { MISTAKE_LEDGER_STATUS_LABELS } from "./mistake-ledger";

export type MistakeLedgerStatusCounts = Record<MistakeLedgerStatus, number>;

export type MistakeLedgerStatusChange = {
  localDate: string;
  status: MistakeLedgerStatus;
  subject: string;
  mistake: string;
};

export type MistakeLedgerAnalytics = {
  totalAtEnd: number;
  createdInRange: number;
  statusUpdatesInRange: number;
  counts: MistakeLedgerStatusCounts;
  latestChanges: MistakeLedgerStatusChange[];
};

export function emptyMistakeLedgerStatusCounts(): MistakeLedgerStatusCounts {
  return MISTAKE_LEDGER_STATUSES.reduce((counts, status) => {
    counts[status] = 0;
    return counts;
  }, {} as MistakeLedgerStatusCounts);
}

function localDate(value: string, timezone: string): string {
  return toLocalDate(value, timezone);
}

function createdDate(entry: MistakeLedgerEntry, timezone: string): string {
  return localDate(entry.createdAt, timezone);
}

function statusAtDate(
  entry: MistakeLedgerEntry,
  activity: readonly MistakeLedgerActivity[],
  endDate: string,
  timezone: string,
): MistakeLedgerStatus {
  const entryCreatedDate = createdDate(entry, timezone);
  const history = activity
    .filter((record) => record.entryId === entry.id && record.actionDate <= endDate)
    .sort((left, right) => left.occurredAt.localeCompare(right.occurredAt));
  if (history.length) return history[history.length - 1].status;
  // Older backups may contain entries without the append-only activity log.
  // Preserve their current valid status rather than dropping them from analytics.
  return entryCreatedDate <= endDate ? entry.status : "noted";
}

export function getMistakeLedgerAnalytics(
  entries: readonly MistakeLedgerEntry[],
  activity: readonly MistakeLedgerActivity[],
  startDate: string,
  endDate: string,
  timezone: string,
): MistakeLedgerAnalytics {
  const counts = emptyMistakeLedgerStatusCounts();
  const endEntries = entries.filter((entry) => createdDate(entry, timezone) <= endDate);
  endEntries.forEach((entry) => {
    counts[statusAtDate(entry, activity, endDate, timezone)] += 1;
  });

  const statusChanges = activity
    .filter((record) => record.kind === "status" && record.actionDate >= startDate && record.actionDate <= endDate)
    .map((record) => {
      const entry = entries.find((candidate) => candidate.id === record.entryId);
      return entry ? {
        localDate: record.actionDate,
        status: record.status,
        subject: entry.subject,
        mistake: entry.mistake,
        occurredAt: record.occurredAt,
      } : null;
    })
    .filter((record): record is MistakeLedgerStatusChange & { occurredAt: string } => Boolean(record))
    .sort((left, right) => right.occurredAt.localeCompare(left.occurredAt));

  return {
    totalAtEnd: endEntries.length,
    createdInRange: endEntries.filter((entry) => {
      const day = createdDate(entry, timezone);
      return day >= startDate && day <= endDate;
    }).length,
    statusUpdatesInRange: statusChanges.length,
    counts,
    latestChanges: statusChanges.slice(0, 8).map(({ localDate: day, status, subject, mistake }) => ({ localDate: day, status, subject, mistake })),
  };
}

export function formatMistakeLedgerStatus(status: MistakeLedgerStatus): string {
  return MISTAKE_LEDGER_STATUS_LABELS[status];
}

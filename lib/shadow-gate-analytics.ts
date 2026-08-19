import { toLocalDate, type ShadowGateEntry, type ShadowGateResistanceState } from "./focus-command";
import { getShadowGateSection } from "./shadow-gate-library";

export type ShadowGateDateRange =
  | { kind: "last7Days" }
  | { kind: "last30Days" }
  | { kind: "custom"; startDate: string; endDate: string };

export type ShadowGateRangePresentation = {
  label: string;
  valid: boolean;
  startDate: string;
  endDate: string;
};

export type ShadowGateDoorwayUse = {
  doorwayId: string;
  doorwayLabel: string;
  resistanceState: ShadowGateResistanceState;
  count: number;
  latestAt: string;
};

function isLocalDate(value: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(`${value}T12:00:00Z`));
}

function shiftDate(from: Date, days: number, timezone: string) {
  const shifted = new Date(from);
  shifted.setDate(shifted.getDate() + days);
  return toLocalDate(shifted.toISOString(), timezone);
}

export function getShadowGateRangePresentation(range: ShadowGateDateRange, timezone: string, now = new Date()): ShadowGateRangePresentation {
  if (range.kind === "custom") {
    const startDate = range.startDate.trim();
    const endDate = range.endDate.trim();
    const valid = isLocalDate(startDate) && isLocalDate(endDate) && startDate <= endDate;
    return { label: valid ? `${startDate} → ${endDate}` : "Choose a valid date range", valid, startDate, endDate };
  }
  const days = range.kind === "last7Days" ? 7 : 30;
  const endDate = toLocalDate(now.toISOString(), timezone);
  return {
    label: range.kind === "last7Days" ? "Last 7 days" : "Last 30 days",
    valid: true,
    startDate: shiftDate(now, -(days - 1), timezone),
    endDate,
  };
}

export function getShadowGateEntriesForRange(entries: readonly ShadowGateEntry[], timezone: string, range: ShadowGateDateRange, now = new Date()) {
  const presentation = getShadowGateRangePresentation(range, timezone, now);
  if (!presentation.valid) return [];
  return entries
    .filter((entry) => {
      const localDate = toLocalDate(entry.occurredAt, timezone);
      return localDate >= presentation.startDate && localDate <= presentation.endDate;
    })
    .slice()
    .sort((left, right) => right.occurredAt.localeCompare(left.occurredAt));
}

export function getShadowGateDoorwayUses(entries: readonly ShadowGateEntry[]) {
  const uses = new Map<string, ShadowGateDoorwayUse>();
  for (const entry of entries) {
    const key = `${entry.resistanceState}\u0000${entry.doorwayId}\u0000${entry.doorwayLabel}`;
    const current = uses.get(key);
    uses.set(key, current
      ? { ...current, count: current.count + 1, latestAt: current.latestAt > entry.occurredAt ? current.latestAt : entry.occurredAt }
      : { doorwayId: entry.doorwayId, doorwayLabel: entry.doorwayLabel, resistanceState: entry.resistanceState, count: 1, latestAt: entry.occurredAt });
  }
  return [...uses.values()].sort((left, right) => right.count - left.count || right.latestAt.localeCompare(left.latestAt) || left.doorwayLabel.localeCompare(right.doorwayLabel));
}

export function getMostUsedShadowGateDoorway(entries: readonly ShadowGateEntry[]) {
  return getShadowGateDoorwayUses(entries)[0] ?? null;
}

/** A factual note shown only when the same state-doorway pairing has led into three recorded missions. */
export function getShadowGatePersonalProof(entries: readonly ShadowGateEntry[]) {
  const proven = getShadowGateDoorwayUses(entries).find((use) => use.count >= 3);
  if (!proven) return null;
  const section = getShadowGateSection(proven.resistanceState);
  return {
    ...proven,
    stateTitle: section.title,
    line: `You have crossed ${proven.count} ${section.title} Gates using “${proven.doorwayLabel}.”`,
  };
}

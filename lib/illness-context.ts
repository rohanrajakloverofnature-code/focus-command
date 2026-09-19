import type { IllnessContextRecord } from "./focus-command";

export type IllnessContextRange = { startDate: string; endDate: string };

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

export function isValidIllnessContextDate(value: string | null | undefined): value is string {
  if (!value || !ISO_DATE.test(value)) return false;
  const date = new Date(`${value}T12:00:00.000Z`);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

export function inclusiveIllnessContextDays(startDate: string, endDate: string): number {
  if (!isValidIllnessContextDate(startDate) || !isValidIllnessContextDate(endDate) || endDate < startDate) return 0;
  return Math.floor((Date.parse(`${endDate}T12:00:00.000Z`) - Date.parse(`${startDate}T12:00:00.000Z`)) / 86_400_000) + 1;
}

export function resolvedIllnessContextEnd(record: Pick<IllnessContextRecord, "startDate" | "endDate">, today: string): string {
  return record.endDate && isValidIllnessContextDate(record.endDate) && record.endDate >= record.startDate
    ? record.endDate
    : today;
}

export function illnessContextOverlapDays(
  record: Pick<IllnessContextRecord, "startDate" | "endDate">,
  range: IllnessContextRange,
  today: string,
): number {
  if (!isValidIllnessContextDate(range.startDate) || !isValidIllnessContextDate(range.endDate) || range.endDate < range.startDate) return 0;
  const startDate = record.startDate > range.startDate ? record.startDate : range.startDate;
  const endDate = resolvedIllnessContextEnd(record, today) < range.endDate ? resolvedIllnessContextEnd(record, today) : range.endDate;
  return inclusiveIllnessContextDays(startDate, endDate);
}

export function illnessContextContainsDate(record: Pick<IllnessContextRecord, "startDate" | "endDate">, localDate: string, today: string): boolean {
  return isValidIllnessContextDate(localDate)
    && localDate >= record.startDate
    && localDate <= resolvedIllnessContextEnd(record, today);
}

/**
 * A strictly descriptive, non-clinical view of user-entered context. It never
 * classifies illness, alters scores, or infers why any work result occurred.
 */
export function getIllnessContextSummary(
  records: readonly IllnessContextRecord[],
  range: IllnessContextRange,
  today: string,
  reflectionDates: readonly string[] = [],
) {
  const contextDays = new Set<string>();
  const reflectionDays = new Set(reflectionDates.filter(isValidIllnessContextDate));
  let ongoingRecords = 0;
  let mildRecords = 0;
  let moderateRecords = 0;
  let severeRecords = 0;
  let fatigueRecords = 0;
  let sleepDisruptedRecords = 0;
  let stressElevatedRecords = 0;

  records.forEach((record) => {
    if (!isValidIllnessContextDate(record.startDate)) return;
    const recordEnd = resolvedIllnessContextEnd(record, today);
    if (recordEnd < range.startDate || record.startDate > range.endDate) return;
    if (record.endDate === null) ongoingRecords += 1;
    if (record.severity === "mild") mildRecords += 1;
    if (record.severity === "moderate") moderateRecords += 1;
    if (record.severity === "severe") severeRecords += 1;
    if (record.fatigueReported) fatigueRecords += 1;
    if (record.sleepDisrupted) sleepDisruptedRecords += 1;
    if (record.stressElevated) stressElevatedRecords += 1;
    const from = record.startDate > range.startDate ? record.startDate : range.startDate;
    const through = recordEnd < range.endDate ? recordEnd : range.endDate;
    for (let day = from; isValidIllnessContextDate(day) && day <= through;) {
      contextDays.add(day);
      const date = new Date(`${day}T12:00:00.000Z`);
      date.setUTCDate(date.getUTCDate() + 1);
      day = date.toISOString().slice(0, 10);
    }
  });

  const debriefDays = [...reflectionDays].filter((day) => contextDays.has(day)).length;
  return {
    recordCount: records.length,
    contextDays: contextDays.size,
    debriefDays,
    ongoingRecords,
    mildRecords,
    moderateRecords,
    severeRecords,
    fatigueRecords,
    sleepDisruptedRecords,
    stressElevatedRecords,
  };
}

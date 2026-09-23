import type { CorePrincipleCheckInItem, CorePrincipleDailyCheckIn } from "./focus-command";

export function syncCorePrincipleDailyCheckIn(
  existing: CorePrincipleDailyCheckIn | null,
  localDate: string,
  activeItems: readonly CorePrincipleCheckInItem[],
  timestamp: string,
): CorePrincipleDailyCheckIn {
  const existingItems = new Map(existing?.items.map((item) => [item.itemId, item]) ?? []);
  return existing
    ? { ...existing, items: activeItems.map((item) => existingItems.get(item.itemId) ?? item), updatedAt: timestamp }
    : { localDate, items: [...activeItems], createdAt: timestamp, updatedAt: timestamp };
}

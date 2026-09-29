import type { InventoryItem, Reward } from "./focus-command";
import { toLocalDate } from "./focus-command";

export interface RewardInventoryRow {
  item: InventoryItem;
  reward: Reward;
  acquiredDate: string;
}

export interface RewardInventoryView {
  activeInventory: RewardInventoryRow[];
  lifeHistory: RewardInventoryRow[];
}

/**
 * Non-life rewards remain in active inventory for all dates while they are still
 * active and unused. Life rewards are date-scoped: they appear in active
 * inventory only on their redemption date, then move to dated life history.
 */
export function getRewardInventoryView(
  inventory: readonly InventoryItem[],
  rewards: readonly Reward[],
  today: string,
  timezone: string,
): RewardInventoryView {
  const rewardById = new Map(rewards.map((reward) => [reward.id, reward]));
  const rows = inventory
    .map((item) => {
      const reward = rewardById.get(item.rewardId);
      if (!reward) return null;
      return {
        item,
        reward,
        acquiredDate: toLocalDate(item.acquiredAt, timezone),
      } satisfies RewardInventoryRow;
    })
    .filter((row): row is RewardInventoryRow => Boolean(row))
    .sort((a, b) => b.item.acquiredAt.localeCompare(a.item.acquiredAt));

  return {
    activeInventory: rows.filter((row) => row.item.active && !row.item.consumedAt && (row.reward.category !== "life" || row.acquiredDate === today)),
    lifeHistory: rows.filter((row) => row.reward.category === "life" && row.acquiredDate < today),
  };
}

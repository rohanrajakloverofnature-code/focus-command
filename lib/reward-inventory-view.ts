import type { InventoryItem, Reward } from "./focus-command";
import { toLocalDate } from "./focus-command";

export interface LifeRewardInventoryRow {
  item: InventoryItem;
  reward: Reward;
  acquiredDate: string;
}

export interface LifeRewardInventoryView {
  activeToday: LifeRewardInventoryRow[];
  history: LifeRewardInventoryRow[];
}

/**
 * Life rewards are real-life resets, so the Rewards tab's compact active list
 * represents only still-active life redemptions acquired today. Older life
 * redemptions remain visible in a dated history, even if they were consumed or
 * the reward was later disabled.
 */
export function getLifeRewardInventoryView(
  inventory: readonly InventoryItem[],
  rewards: readonly Reward[],
  today: string,
  timezone: string,
): LifeRewardInventoryView {
  const rewardById = new Map(rewards.map((reward) => [reward.id, reward]));
  const rows = inventory
    .map((item) => {
      const reward = rewardById.get(item.rewardId);
      if (!reward || reward.category !== "life") return null;
      return {
        item,
        reward,
        acquiredDate: toLocalDate(item.acquiredAt, timezone),
      } satisfies LifeRewardInventoryRow;
    })
    .filter((row): row is LifeRewardInventoryRow => Boolean(row))
    .sort((a, b) => b.item.acquiredAt.localeCompare(a.item.acquiredAt));

  return {
    activeToday: rows.filter((row) => row.acquiredDate === today && row.item.active && !row.item.consumedAt),
    history: rows.filter((row) => row.acquiredDate < today),
  };
}

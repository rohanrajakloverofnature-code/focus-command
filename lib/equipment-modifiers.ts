import { Equipment, UserEquipment } from "./focus-command";

/**
 * Helper to get equipment details from allEquipment array
 */
function getEquipmentDetails(equipmentId: string, allEquipment: Equipment[]): Equipment | undefined {
  return allEquipment.find(eq => eq.id === equipmentId);
}

/**
 * Calculate the combined XP modifier from all equipped gear
 * Returns a multiplier (e.g., 1.1 for +10% XP)
 */
export function calculateEquippedXpModifier(userEquipment: UserEquipment[], allEquipment: Equipment[]): number {
  let totalModifier = 1.0;

  const equippedItems = userEquipment.filter(item => item.isEquipped !== "false");

  for (const userItem of equippedItems) {
    const details = getEquipmentDetails(userItem.equipmentId, allEquipment);
    if (details) {
      totalModifier *= details.xpModifier / 100;
    }
  }

  return totalModifier;
}

/**
 * Calculate the combined energy consumption modifier from all equipped gear
 * Returns a multiplier (e.g., 0.95 for -5% energy consumption)
 */
export function calculateEquippedEnergyModifier(userEquipment: UserEquipment[], allEquipment: Equipment[]): number {
  let totalModifier = 1.0;

  const equippedItems = userEquipment.filter(item => item.isEquipped !== "false");

  for (const userItem of equippedItems) {
    const details = getEquipmentDetails(userItem.equipmentId, allEquipment);
    if (details) {
      totalModifier *= details.energyConsumptionModifier / 100;
    }
  }

  return totalModifier;
}

/**
 * Get a human-readable description of equipped gear effects
 */
export function getEquippedGearDescription(userEquipment: UserEquipment[], allEquipment: Equipment[]): string {
  const xpModifier = calculateEquippedXpModifier(userEquipment, allEquipment);
  const energyModifier = calculateEquippedEnergyModifier(userEquipment, allEquipment);

  const xpBonus = ((xpModifier - 1) * 100).toFixed(0);
  const energyReduction = ((1 - energyModifier) * 100).toFixed(0);

  const parts: string[] = [];

  if (xpModifier > 1) {
    parts.push(`+${xpBonus}% XP`);
  }

  if (energyModifier < 1) {
    parts.push(`-${energyReduction}% Energy`);
  }

  if (parts.length === 0) {
    return "No active bonuses";
  }

  return parts.join(" • ");
}

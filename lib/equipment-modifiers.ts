import { EquippedGear } from "./focus-command";

/**
 * Calculate the combined XP modifier from all equipped gear
 * Returns a multiplier (e.g., 1.1 for +10% XP)
 */
export function calculateEquippedXpModifier(equippedGear: EquippedGear): number {
  let totalModifier = 1.0;

  if (equippedGear.head) {
    totalModifier *= equippedGear.head.xpModifier / 100;
  }

  if (equippedGear.body) {
    totalModifier *= equippedGear.body.xpModifier / 100;
  }

  if (equippedGear.accessory) {
    totalModifier *= equippedGear.accessory.xpModifier / 100;
  }

  return totalModifier;
}

/**
 * Calculate the combined energy consumption modifier from all equipped gear
 * Returns a multiplier (e.g., 0.95 for -5% energy consumption)
 */
export function calculateEquippedEnergyModifier(equippedGear: EquippedGear): number {
  let totalModifier = 1.0;

  if (equippedGear.head) {
    totalModifier *= equippedGear.head.energyConsumptionModifier / 100;
  }

  if (equippedGear.body) {
    totalModifier *= equippedGear.body.energyConsumptionModifier / 100;
  }

  if (equippedGear.accessory) {
    totalModifier *= equippedGear.accessory.energyConsumptionModifier / 100;
  }

  return totalModifier;
}

/**
 * Get a human-readable description of equipped gear effects
 */
export function getEquippedGearDescription(equippedGear: EquippedGear): string {
  const xpModifier = calculateEquippedXpModifier(equippedGear);
  const energyModifier = calculateEquippedEnergyModifier(equippedGear);

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

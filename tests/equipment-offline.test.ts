import { describe, it, expect, beforeEach } from "vitest";
import { calculateEquippedXpModifier, calculateEquippedEnergyModifier, getEquippedGearDescription } from "../lib/equipment-modifiers";
import { Equipment, UserEquipment, getEquipmentSlotForType, reconcileEquipmentInventory } from "../lib/focus-command";

describe("Equipment System - Offline", () => {
  let testEquipment: Equipment[];
  let userEquipment: UserEquipment[];

  beforeEach(() => {
    // Create test equipment
    testEquipment = [
      {
        id: "eq1",
        name: "Cognitive Amplifier",
        description: "Boosts focus power",
        type: "FocusDevice",
        rarity: "Rare",
        level: 5,
        xpModifier: 110, // +10% XP
        energyConsumptionModifier: 100,
        imageUrl: null,
      },
      {
        id: "eq2",
        name: "Energy Stabilizer",
        description: "Reduces energy drain",
        type: "EnergyPack",
        rarity: "Uncommon",
        level: 3,
        xpModifier: 100,
        energyConsumptionModifier: 95, // -5% energy
        imageUrl: null,
      },
      {
        id: "eq3",
        name: "Aura Enhancer",
        description: "Amplifies aura effects",
        type: "AuraGenerator",
        rarity: "Epic",
        level: 7,
        xpModifier: 115, // +15% XP
        energyConsumptionModifier: 90, // -10% energy
        imageUrl: null,
      },
    ];

    // Create user equipment (inventory items)
    userEquipment = [
      {
        id: "ue1",
        equipmentId: "eq1",
        isEquipped: "head",
        acquiredAt: new Date().toISOString(),
      },
      {
        id: "ue2",
        equipmentId: "eq2",
        isEquipped: "body",
        acquiredAt: new Date().toISOString(),
      },
      {
        id: "ue3",
        equipmentId: "eq3",
        isEquipped: "false", // In inventory, not equipped
        acquiredAt: new Date().toISOString(),
      },
    ];
  });

  describe("XP Modifier Calculation", () => {
    it("should calculate correct XP modifier from equipped items", () => {
      const modifier = calculateEquippedXpModifier(userEquipment, testEquipment);
      // eq1 (110) * eq2 (100) = 1.1 * 1.0 = 1.1
      expect(modifier).toBe(1.1);
    });

    it("should return 1.0 when no items are equipped", () => {
      const emptyEquipment: UserEquipment[] = [];
      const modifier = calculateEquippedXpModifier(emptyEquipment, testEquipment);
      expect(modifier).toBe(1.0);
    });

    it("should ignore unequipped items in calculation", () => {
      const modifier = calculateEquippedXpModifier(userEquipment, testEquipment);
      // Should only include eq1 and eq2, not eq3 (which is in inventory)
      expect(modifier).toBe(1.1);
    });

    it("should handle multiple equipped items with stacking modifiers", () => {
      const multiEquipped: UserEquipment[] = [
        { id: "ue1", equipmentId: "eq1", isEquipped: "head", acquiredAt: new Date().toISOString() },
        { id: "ue3", equipmentId: "eq3", isEquipped: "body", acquiredAt: new Date().toISOString() },
      ];
      const modifier = calculateEquippedXpModifier(multiEquipped, testEquipment);
      // eq1 (110) * eq3 (115) = 1.1 * 1.15 = 1.265
      expect(modifier).toBeCloseTo(1.265, 2);
    });
  });

  describe("Energy Modifier Calculation", () => {
    it("should calculate correct energy modifier from equipped items", () => {
      const modifier = calculateEquippedEnergyModifier(userEquipment, testEquipment);
      // eq1 (100) * eq2 (95) = 1.0 * 0.95 = 0.95
      expect(modifier).toBe(0.95);
    });

    it("should return 1.0 when no items are equipped", () => {
      const emptyEquipment: UserEquipment[] = [];
      const modifier = calculateEquippedEnergyModifier(emptyEquipment, testEquipment);
      expect(modifier).toBe(1.0);
    });

    it("should handle energy reduction stacking", () => {
      const multiEquipped: UserEquipment[] = [
        { id: "ue2", equipmentId: "eq2", isEquipped: "body", acquiredAt: new Date().toISOString() },
        { id: "ue3", equipmentId: "eq3", isEquipped: "accessory", acquiredAt: new Date().toISOString() },
      ];
      const modifier = calculateEquippedEnergyModifier(multiEquipped, testEquipment);
      // eq2 (95) * eq3 (90) = 0.95 * 0.9 = 0.855
      expect(modifier).toBeCloseTo(0.855, 2);
    });
  });

  describe("Equipped Gear Description", () => {
    it("should generate correct description for equipped items", () => {
      const description = getEquippedGearDescription(userEquipment, testEquipment);
      expect(description).toContain("+10% XP");
      expect(description).toContain("-5% Energy");
    });

    it("should return no bonuses message when nothing is equipped", () => {
      const emptyEquipment: UserEquipment[] = [];
      const description = getEquippedGearDescription(emptyEquipment, testEquipment);
      expect(description).toBe("No active bonuses");
    });

    it("should only show XP bonus when energy modifier is 100", () => {
      const xpOnlyEquipped: UserEquipment[] = [
        { id: "ue1", equipmentId: "eq1", isEquipped: "head", acquiredAt: new Date().toISOString() },
      ];
      const description = getEquippedGearDescription(xpOnlyEquipped, testEquipment);
      expect(description).toContain("+10% XP");
      expect(description).not.toContain("Energy");
    });
  });

  describe("Real-world Scenarios", () => {
    it("should apply XP modifier to mission completion", () => {
      const baseMissionXp = 100;
      const xpModifier = calculateEquippedXpModifier(userEquipment, testEquipment);
      const finalXp = baseMissionXp * xpModifier;
      // 100 * 1.1 = 110
      expect(finalXp).toBeCloseTo(110, 1);
    });

    it("should apply energy modifier to energy consumption", () => {
      const baseEnergyConsumption = 20;
      const energyModifier = calculateEquippedEnergyModifier(userEquipment, testEquipment);
      const finalEnergyConsumption = baseEnergyConsumption * energyModifier;
      // 20 * 0.95 = 19
      expect(finalEnergyConsumption).toBe(19);
    });

    it("should calculate combined XP and energy effects", () => {
      const baseMissionXp = 100;
      const baseEnergy = 20;
      const xpModifier = calculateEquippedXpModifier(userEquipment, testEquipment);
      const energyModifier = calculateEquippedEnergyModifier(userEquipment, testEquipment);

      const finalXp = baseMissionXp * xpModifier;
      const finalEnergy = baseEnergy * energyModifier;

      expect(finalXp).toBeCloseTo(110, 1); // +10% XP
      expect(finalEnergy).toBeCloseTo(19, 1); // -5% energy
    });
  });

  describe("Equipment Data Persistence", () => {
    it("should maintain equipment data structure", () => {
      expect(testEquipment[0]).toHaveProperty("id");
      expect(testEquipment[0]).toHaveProperty("name");
      expect(testEquipment[0]).toHaveProperty("xpModifier");
      expect(testEquipment[0]).toHaveProperty("energyConsumptionModifier");
    });

    it("should maintain user equipment structure", () => {
      expect(userEquipment[0]).toHaveProperty("id");
      expect(userEquipment[0]).toHaveProperty("equipmentId");
      expect(userEquipment[0]).toHaveProperty("isEquipped");
      expect(userEquipment[0]).toHaveProperty("acquiredAt");
    });

    it("should support equipment slot management", () => {
      const slotTypes = ["head", "body", "accessory", "false"];
      const allSlots = userEquipment.every((ue) => slotTypes.includes(ue.isEquipped));
      expect(allSlots).toBe(true);
    });
  });

  describe("Offline inventory acquisition and slot rules", () => {
    it("recovers every legacy created item that was missing from inventory exactly once", () => {
      const reconciled = reconcileEquipmentInventory(testEquipment, [userEquipment[0]], "2026-08-11T00:00:00.000Z");

      expect(reconciled).toHaveLength(3);
      expect(reconciled.map((item) => item.equipmentId).sort()).toEqual(["eq1", "eq2", "eq3"]);
      expect(reconciled.find((item) => item.equipmentId === "eq2")).toMatchObject({
        id: "user_equipment_recovered_eq2",
        isEquipped: "false",
        acquiredAt: "2026-08-11T00:00:00.000Z",
      });
      expect(reconcileEquipmentInventory(testEquipment, reconciled, "2026-08-12T00:00:00.000Z")).toBe(reconciled);
    });

    it("maps each equipment type to its one compatible equip slot", () => {
      expect(getEquipmentSlotForType("FocusDevice")).toBe("head");
      expect(getEquipmentSlotForType("EnergyPack")).toBe("body");
      expect(getEquipmentSlotForType("AuraGenerator")).toBe("accessory");
    });
  });
});

import { describe, it, expect } from "vitest";
import { calculateEquippedXpModifier, calculateEquippedEnergyModifier, getEquippedGearDescription } from "../lib/equipment-modifiers";
import { EquippedGear } from "../lib/focus-command";

describe("Equipment Modifiers", () => {
  describe("calculateEquippedXpModifier", () => {
    it("should return 1.0 when no equipment is equipped", () => {
      const gear: EquippedGear = {};
      expect(calculateEquippedXpModifier(gear)).toBe(1.0);
    });

    it("should apply head equipment XP modifier", () => {
      const gear: EquippedGear = {
        head: { id: "1", name: "Cognitive Amplifier", xpModifier: 110, energyConsumptionModifier: 100 },
      };
      expect(calculateEquippedXpModifier(gear)).toBe(1.1);
    });

    it("should apply body equipment XP modifier", () => {
      const gear: EquippedGear = {
        body: { id: "2", name: "Endurance Cell", xpModifier: 100, energyConsumptionModifier: 95 },
      };
      expect(calculateEquippedXpModifier(gear)).toBe(1.0);
    });

    it("should apply accessory equipment XP modifier", () => {
      const gear: EquippedGear = {
        accessory: { id: "3", name: "Motivation Emitter", xpModifier: 105, energyConsumptionModifier: 97 },
      };
      expect(calculateEquippedXpModifier(gear)).toBe(1.05);
    });

    it("should combine multiple equipment modifiers", () => {
      const gear: EquippedGear = {
        head: { id: "1", name: "Cognitive Amplifier", xpModifier: 110, energyConsumptionModifier: 100 },
        body: { id: "2", name: "Endurance Cell", xpModifier: 105, energyConsumptionModifier: 95 },
        accessory: { id: "3", name: "Motivation Emitter", xpModifier: 105, energyConsumptionModifier: 97 },
      };
      // 1.1 * 1.05 * 1.05 = 1.21275
      expect(calculateEquippedXpModifier(gear)).toBeCloseTo(1.21275, 5);
    });
  });

  describe("calculateEquippedEnergyModifier", () => {
    it("should return 1.0 when no equipment is equipped", () => {
      const gear: EquippedGear = {};
      expect(calculateEquippedEnergyModifier(gear)).toBe(1.0);
    });

    it("should apply head equipment energy modifier", () => {
      const gear: EquippedGear = {
        head: { id: "1", name: "Cognitive Amplifier", xpModifier: 110, energyConsumptionModifier: 100 },
      };
      expect(calculateEquippedEnergyModifier(gear)).toBe(1.0);
    });

    it("should apply body equipment energy modifier", () => {
      const gear: EquippedGear = {
        body: { id: "2", name: "Endurance Cell", xpModifier: 100, energyConsumptionModifier: 95 },
      };
      expect(calculateEquippedEnergyModifier(gear)).toBe(0.95);
    });

    it("should apply accessory equipment energy modifier", () => {
      const gear: EquippedGear = {
        accessory: { id: "3", name: "Motivation Emitter", xpModifier: 105, energyConsumptionModifier: 97 },
      };
      expect(calculateEquippedEnergyModifier(gear)).toBe(0.97);
    });

    it("should combine multiple equipment energy modifiers", () => {
      const gear: EquippedGear = {
        head: { id: "1", name: "Cognitive Amplifier", xpModifier: 110, energyConsumptionModifier: 100 },
        body: { id: "2", name: "Endurance Cell", xpModifier: 105, energyConsumptionModifier: 95 },
        accessory: { id: "3", name: "Motivation Emitter", xpModifier: 105, energyConsumptionModifier: 97 },
      };
      // 1.0 * 0.95 * 0.97 = 0.9215
      expect(calculateEquippedEnergyModifier(gear)).toBeCloseTo(0.9215, 4);
    });
  });

  describe("getEquippedGearDescription", () => {
    it("should return 'No active bonuses' when no equipment is equipped", () => {
      const gear: EquippedGear = {};
      expect(getEquippedGearDescription(gear)).toBe("No active bonuses");
    });

    it("should show XP bonus when head equipment is equipped", () => {
      const gear: EquippedGear = {
        head: { id: "1", name: "Cognitive Amplifier", xpModifier: 110, energyConsumptionModifier: 100 },
      };
      expect(getEquippedGearDescription(gear)).toContain("+10% XP");
    });

    it("should show energy reduction when body equipment is equipped", () => {
      const gear: EquippedGear = {
        body: { id: "2", name: "Endurance Cell", xpModifier: 100, energyConsumptionModifier: 95 },
      };
      expect(getEquippedGearDescription(gear)).toContain("-5% Energy");
    });

    it("should combine multiple bonuses", () => {
      const gear: EquippedGear = {
        head: { id: "1", name: "Cognitive Amplifier", xpModifier: 110, energyConsumptionModifier: 100 },
        body: { id: "2", name: "Endurance Cell", xpModifier: 100, energyConsumptionModifier: 95 },
      };
      const description = getEquippedGearDescription(gear);
      expect(description).toContain("+10% XP");
      expect(description).toContain("-5% Energy");
      expect(description).toContain("•");
    });
  });

  describe("XP Calculation Integration", () => {
    it("should correctly calculate mission XP with equipment bonus", () => {
      const baseXp = 100;
      const comboMultiplier = 1.3;
      const equipmentXpModifier = 1.1;
      const goldMultiplier = 1.0;

      const basePower = baseXp * comboMultiplier * equipmentXpModifier * goldMultiplier;
      expect(basePower).toBe(143);
    });

    it("should correctly calculate mission XP with multiple equipment bonuses", () => {
      const baseXp = 100;
      const comboMultiplier = 1.3;
      const gear: EquippedGear = {
        head: { id: "1", name: "Cognitive Amplifier", xpModifier: 110, energyConsumptionModifier: 100 },
        body: { id: "2", name: "Endurance Cell", xpModifier: 105, energyConsumptionModifier: 95 },
      };
      const equipmentXpModifier = calculateEquippedXpModifier(gear);
      const goldMultiplier = 1.0;

      const basePower = baseXp * comboMultiplier * equipmentXpModifier * goldMultiplier;
      // 100 * 1.3 * 1.155 * 1.0 = 150.15
      expect(basePower).toBeCloseTo(150.15, 2);
    });

    it("should correctly calculate mission XP with all multipliers", () => {
      const baseXp = 100;
      const comboMultiplier = 1.5;
      const gear: EquippedGear = {
        head: { id: "1", name: "Cognitive Amplifier", xpModifier: 110, energyConsumptionModifier: 100 },
        body: { id: "2", name: "Endurance Cell", xpModifier: 105, energyConsumptionModifier: 95 },
        accessory: { id: "3", name: "Motivation Emitter", xpModifier: 105, energyConsumptionModifier: 97 },
      };
      const equipmentXpModifier = calculateEquippedXpModifier(gear);
      const goldMultiplier = 3.0;

      const basePower = baseXp * comboMultiplier * equipmentXpModifier * goldMultiplier;
      // 100 * 1.5 * 1.21275 * 3.0 = 545.7375
      expect(basePower).toBeCloseTo(545.74, 2);
    });
  });
});

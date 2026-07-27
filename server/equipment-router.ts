import { z } from "zod";
import { protectedProcedure, router } from "./_core/trpc";
import {
  getAllEquipment,
  getUserInventory,
  getUserEquipped,
  addEquipmentToInventory,
  equipItem,
  unequipItem,
  removeEquipmentFromInventory,
  calculateXpModifier,
  calculateEnergyModifier,
} from "./equipment";

export const equipmentRouter = router({
  /**
   * Get all available equipment in the game
   */
  getAllEquipment: protectedProcedure.query(async () => {
    return await getAllEquipment();
  }),

  /**
   * Get user's inventory (all equipment they own)
   */
  getInventory: protectedProcedure.query(async ({ ctx }) => {
    return await getUserInventory(ctx.user.id);
  }),

  /**
   * Get user's currently equipped items
   */
  getEquipped: protectedProcedure.query(async ({ ctx }) => {
    return await getUserEquipped(ctx.user.id);
  }),

  /**
   * Add equipment to user's inventory
   */
  addToInventory: protectedProcedure
    .input(
      z.object({
        equipmentId: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return await addEquipmentToInventory(ctx.user.id, input.equipmentId);
    }),

  /**
   * Equip an item in a specific slot
   */
  equip: protectedProcedure
    .input(
      z.object({
        userEquipmentId: z.number(),
        slot: z.enum(["head", "body", "accessory"]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return await equipItem(ctx.user.id, input.userEquipmentId, input.slot);
    }),

  /**
   * Unequip an item
   */
  unequip: protectedProcedure
    .input(
      z.object({
        userEquipmentId: z.number(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return await unequipItem(input.userEquipmentId);
    }),

  /**
   * Remove equipment from inventory
   */
  remove: protectedProcedure
    .input(
      z.object({
        userEquipmentId: z.number(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      await removeEquipmentFromInventory(input.userEquipmentId);
      return { success: true };
    }),

  /**
   * Get current XP modifier from equipped items
   */
  getXpModifier: protectedProcedure.query(async ({ ctx }) => {
    return await calculateXpModifier(ctx.user.id);
  }),

  /**
   * Get current energy consumption modifier from equipped items
   */
  getEnergyModifier: protectedProcedure.query(async ({ ctx }) => {
    return await calculateEnergyModifier(ctx.user.id);
  }),
});

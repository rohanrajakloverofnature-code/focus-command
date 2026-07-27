import { eq, and } from "drizzle-orm";
import { equipment, userEquipment, type Equipment, type UserEquipment } from "../drizzle/schema";
import { getDb } from "./db";

/**
 * Get all available equipment items
 */
export async function getAllEquipment(): Promise<Equipment[]> {
  const db = await getDb();
  if (!db) {
    console.warn("[Equipment] Cannot get equipment: database not available");
    return [];
  }

  try {
    const result = await db.select().from(equipment);
    return result;
  } catch (error) {
    console.error("[Equipment] Failed to get all equipment:", error);
    throw error;
  }
}

/**
 * Get equipment by ID
 */
export async function getEquipmentById(id: string): Promise<Equipment | undefined> {
  const db = await getDb();
  if (!db) {
    console.warn("[Equipment] Cannot get equipment: database not available");
    return undefined;
  }

  try {
    const result = await db.select().from(equipment).where(eq(equipment.id, id)).limit(1);
    return result.length > 0 ? result[0] : undefined;
  } catch (error) {
    console.error("[Equipment] Failed to get equipment by ID:", error);
    throw error;
  }
}

/**
 * Get user's inventory (all equipment they own)
 */
export async function getUserInventory(userId: number): Promise<(UserEquipment & { equipmentDetails: Equipment })[]> {
  const db = await getDb();
  if (!db) {
    console.warn("[Equipment] Cannot get inventory: database not available");
    return [];
  }

  try {
    const result = await db
      .select()
      .from(userEquipment)
      .where(eq(userEquipment.userId, userId));

    // Fetch equipment details for each item
    const inventoryWithDetails = await Promise.all(
      result.map(async (item) => {
        const equipDetails = await getEquipmentById(item.equipmentId);
        return {
          ...item,
          equipmentDetails: equipDetails || ({} as Equipment),
        };
      })
    );

    return inventoryWithDetails;
  } catch (error) {
    console.error("[Equipment] Failed to get user inventory:", error);
    throw error;
  }
}

/**
 * Get user's equipped items
 */
export async function getUserEquipped(userId: number): Promise<Record<string, Equipment | undefined>> {
  const db = await getDb();
  if (!db) {
    console.warn("[Equipment] Cannot get equipped: database not available");
    return {};
  }

  try {
    const result = await db
      .select()
      .from(userEquipment)
      .where(and(eq(userEquipment.userId, userId), eq(userEquipment.isEquipped, "head")));

    const equipped: Record<string, Equipment | undefined> = {
      head: undefined,
      body: undefined,
      accessory: undefined,
    };

    for (const item of result) {
      if (item.isEquipped !== "false") {
        const equipDetails = await getEquipmentById(item.equipmentId);
        equipped[item.isEquipped] = equipDetails;
      }
    }

    return equipped;
  } catch (error) {
    console.error("[Equipment] Failed to get user equipped items:", error);
    throw error;
  }
}

/**
 * Add equipment to user's inventory
 */
export async function addEquipmentToInventory(userId: number, equipmentId: string): Promise<UserEquipment> {
  const db = await getDb();
  if (!db) {
    throw new Error("[Equipment] Cannot add equipment: database not available");
  }

  try {
    const result = await db.insert(userEquipment).values({
      userId,
      equipmentId,
      isEquipped: "false",
    });

    // Return the newly created item
    const newItem = await db
      .select()
      .from(userEquipment)
      .where(and(eq(userEquipment.userId, userId), eq(userEquipment.equipmentId, equipmentId)))
      .limit(1);

    return newItem[0];
  } catch (error) {
    console.error("[Equipment] Failed to add equipment to inventory:", error);
    throw error;
  }
}

/**
 * Equip an item (move it to a slot)
 */
export async function equipItem(
  userId: number,
  userEquipmentId: number,
  slot: "head" | "body" | "accessory"
): Promise<UserEquipment> {
  const db = await getDb();
  if (!db) {
    throw new Error("[Equipment] Cannot equip item: database not available");
  }

  try {
    // First, unequip any item currently in that slot
    await db
      .update(userEquipment)
      .set({ isEquipped: "false" })
      .where(
        and(eq(userEquipment.userId, userId), eq(userEquipment.isEquipped, slot))
      );

    // Then equip the new item
    await db
      .update(userEquipment)
      .set({ isEquipped: slot })
      .where(eq(userEquipment.id, userEquipmentId));

    // Return the updated item
    const result = await db.select().from(userEquipment).where(eq(userEquipment.id, userEquipmentId)).limit(1);
    return result[0];
  } catch (error) {
    console.error("[Equipment] Failed to equip item:", error);
    throw error;
  }
}

/**
 * Unequip an item (move it back to inventory)
 */
export async function unequipItem(userEquipmentId: number): Promise<UserEquipment> {
  const db = await getDb();
  if (!db) {
    throw new Error("[Equipment] Cannot unequip item: database not available");
  }

  try {
    await db.update(userEquipment).set({ isEquipped: "false" }).where(eq(userEquipment.id, userEquipmentId));

    // Return the updated item
    const result = await db.select().from(userEquipment).where(eq(userEquipment.id, userEquipmentId)).limit(1);
    return result[0];
  } catch (error) {
    console.error("[Equipment] Failed to unequip item:", error);
    throw error;
  }
}

/**
 * Remove equipment from user's inventory
 */
export async function removeEquipmentFromInventory(userEquipmentId: number): Promise<void> {
  const db = await getDb();
  if (!db) {
    throw new Error("[Equipment] Cannot remove equipment: database not available");
  }

  try {
    await db.delete(userEquipment).where(eq(userEquipment.id, userEquipmentId));
  } catch (error) {
    console.error("[Equipment] Failed to remove equipment:", error);
    throw error;
  }
}

/**
 * Calculate total XP modifier from equipped items
 */
export async function calculateXpModifier(userId: number): Promise<number> {
  const db = await getDb();
  if (!db) {
    console.warn("[Equipment] Cannot calculate XP modifier: database not available");
    return 1.0;
  }

  try {
    const equipped = await db
      .select()
      .from(userEquipment)
      .where(
        and(eq(userEquipment.userId, userId), eq(userEquipment.isEquipped, "head"))
      );

    let totalModifier = 1.0;

    for (const item of equipped) {
      if (item.isEquipped !== "false") {
        const equipDetails = await getEquipmentById(item.equipmentId);
        if (equipDetails) {
          totalModifier *= equipDetails.xpModifier / 100;
        }
      }
    }

    return totalModifier;
  } catch (error) {
    console.error("[Equipment] Failed to calculate XP modifier:", error);
    return 1.0;
  }
}

/**
 * Calculate total energy consumption modifier from equipped items
 */
export async function calculateEnergyModifier(userId: number): Promise<number> {
  const db = await getDb();
  if (!db) {
    console.warn("[Equipment] Cannot calculate energy modifier: database not available");
    return 1.0;
  }

  try {
    const equipped = await db
      .select()
      .from(userEquipment)
      .where(
        and(eq(userEquipment.userId, userId), eq(userEquipment.isEquipped, "body"))
      );

    let totalModifier = 1.0;

    for (const item of equipped) {
      if (item.isEquipped !== "false") {
        const equipDetails = await getEquipmentById(item.equipmentId);
        if (equipDetails) {
          totalModifier *= equipDetails.energyConsumptionModifier / 100;
        }
      }
    }

    return totalModifier;
  } catch (error) {
    console.error("[Equipment] Failed to calculate energy modifier:", error);
    return 1.0;
  }
}

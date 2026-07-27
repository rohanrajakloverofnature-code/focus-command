import { int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// TODO: Add your tables here


export const equipment = mysqlTable("equipment", {
  id: varchar("id", { length: 36 }).notNull().primaryKey(), // UUID for equipment
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  type: mysqlEnum("type", ["FocusDevice", "EnergyPack", "AuraGenerator"]).notNull(),
  rarity: mysqlEnum("rarity", ["Common", "Uncommon", "Rare", "Epic", "Legendary"]).notNull(),
  level: int("level").default(1).notNull(),
  xpModifier: int("xpModifier").default(100).notNull(), // Stored as percentage (e.g., 110 for +10%)
  energyConsumptionModifier: int("energyConsumptionModifier").default(100).notNull(), // Stored as percentage (e.g., 95 for -5%)
  imageUrl: varchar("imageUrl", { length: 255 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Equipment = typeof equipment.$inferSelect;
export type InsertEquipment = typeof equipment.$inferInsert;

export const userEquipment = mysqlTable("userEquipment", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id),
  equipmentId: varchar("equipmentId", { length: 36 }).notNull().references(() => equipment.id),
  isEquipped: mysqlEnum("isEquipped", ["head", "body", "accessory", "false"]).default("false").notNull(), // Stores the slot if equipped, 'false' if in inventory
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type UserEquipment = typeof userEquipment.$inferSelect;
export type InsertUserEquipment = typeof userEquipment.$inferInsert;

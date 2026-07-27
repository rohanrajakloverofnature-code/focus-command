CREATE TABLE `equipment` (
	`id` varchar(36) NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`type` enum('FocusDevice','EnergyPack','AuraGenerator') NOT NULL,
	`rarity` enum('Common','Uncommon','Rare','Epic','Legendary') NOT NULL,
	`level` int NOT NULL DEFAULT 1,
	`xpModifier` int NOT NULL DEFAULT 100,
	`energyConsumptionModifier` int NOT NULL DEFAULT 100,
	`imageUrl` varchar(255),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `equipment_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `userEquipment` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`equipmentId` varchar(36) NOT NULL,
	`isEquipped` enum('head','body','accessory','false') NOT NULL DEFAULT 'false',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `userEquipment_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `userEquipment` ADD CONSTRAINT `userEquipment_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `userEquipment` ADD CONSTRAINT `userEquipment_equipmentId_equipment_id_fk` FOREIGN KEY (`equipmentId`) REFERENCES `equipment`(`id`) ON DELETE no action ON UPDATE no action;
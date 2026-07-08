ALTER TABLE `Instance` ADD COLUMN `deletedAt` DATETIME(3) NULL;

CREATE INDEX `Instance_userId_deletedAt_idx` ON `Instance`(`userId`, `deletedAt`);

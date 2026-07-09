-- AlterTable
ALTER TABLE `Instance`
  ADD COLUMN `apiKeyHash` VARCHAR(191) NULL,
  ADD COLUMN `apiKeyPreview` VARCHAR(191) NULL,
  ADD COLUMN `apiKeyCreatedAt` DATETIME(3) NULL,
  ADD COLUMN `apiKeyLastUsedAt` DATETIME(3) NULL;

-- CreateIndex
CREATE UNIQUE INDEX `Instance_apiKeyHash_key` ON `Instance`(`apiKeyHash`);

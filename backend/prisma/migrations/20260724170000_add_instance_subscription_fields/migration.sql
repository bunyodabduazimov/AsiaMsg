-- Add per-instance subscription fields
ALTER TABLE `InstanceSetting`
  ADD COLUMN `subscriptionPlan` VARCHAR(191) NOT NULL DEFAULT 'Business' AFTER `webhookSecret`,
  ADD COLUMN `subscriptionMessagesUsed` INT NOT NULL DEFAULT 0 AFTER `subscriptionPlan`,
  ADD COLUMN `subscriptionMessagesLimit` INT NOT NULL DEFAULT 500000 AFTER `subscriptionMessagesUsed`;

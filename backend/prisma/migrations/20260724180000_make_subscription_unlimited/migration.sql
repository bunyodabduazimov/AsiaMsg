-- Make per-instance subscription unlimited
UPDATE `InstanceSetting`
SET `subscriptionPlan` = 'Unlimited'
WHERE `subscriptionPlan` = 'Business' OR `subscriptionPlan` IS NULL;

ALTER TABLE `InstanceSetting`
  MODIFY COLUMN `subscriptionPlan` VARCHAR(191) NOT NULL DEFAULT 'Unlimited';

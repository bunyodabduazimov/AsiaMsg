-- Add free trial dates for per-instance subscription
ALTER TABLE `InstanceSetting`
  ADD COLUMN `subscriptionTrialStartedAt` DATETIME(3) NULL AFTER `subscriptionPlan`,
  ADD COLUMN `subscriptionTrialEndsAt` DATETIME(3) NULL AFTER `subscriptionTrialStartedAt`;

-- Drop monthly usage quota fields from per-instance subscription
ALTER TABLE `InstanceSetting`
  DROP COLUMN `subscriptionMessagesUsed`,
  DROP COLUMN `subscriptionMessagesLimit`;

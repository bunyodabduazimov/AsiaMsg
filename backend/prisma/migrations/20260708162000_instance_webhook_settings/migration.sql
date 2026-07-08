ALTER TABLE `InstanceSetting`
  ADD COLUMN `webhookRetryCount` INTEGER NOT NULL DEFAULT 3,
  ADD COLUMN `webhookOnReceived` BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN `webhookOnCreate` BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN `webhookOnAck` BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN `webhookDownloadMedia` BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN `webhookOnReaction` BOOLEAN NOT NULL DEFAULT false;

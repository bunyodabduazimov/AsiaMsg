-- Add encrypted storage for instance API keys
ALTER TABLE `Instance`
  ADD COLUMN `apiKeyEncrypted` TEXT NULL AFTER `apiKeyPreview`;

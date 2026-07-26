-- Drop deprecated API key preview column
ALTER TABLE `Instance`
  DROP COLUMN `apiKeyPreview`;

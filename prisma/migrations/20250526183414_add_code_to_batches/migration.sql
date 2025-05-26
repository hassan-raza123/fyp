/*
  Warnings:

  - A unique constraint covering the columns `[code]` on the table `batches` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `code` to the `batches` table without a default value. This is not possible if the table is not empty.

*/
-- First add the column with a default value
ALTER TABLE `batches` ADD COLUMN `code` VARCHAR(191) NULL;

-- Update existing records with a unique code
UPDATE `batches` SET `code` = CONCAT('BATCH-', id) WHERE `code` IS NULL;

-- Now make the column required and unique
ALTER TABLE `batches` MODIFY `code` VARCHAR(191) NOT NULL;
ALTER TABLE `batches` ADD UNIQUE INDEX `batches_code_key`(`code`);

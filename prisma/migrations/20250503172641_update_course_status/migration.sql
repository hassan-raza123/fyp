/*
  Warnings:

  - You are about to alter the column `status` on the `course` table. The data in that column could be lost. The data in that column will be cast from `Enum(EnumId(5))` to `Enum(EnumId(2))`.

*/
-- AlterTable
ALTER TABLE `course` MODIFY `status` ENUM('active', 'inactive', 'archived') NOT NULL DEFAULT 'active';

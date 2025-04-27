/*
  Warnings:

  - You are about to drop the column `parentDepartmentId` on the `departments` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE `departments` DROP FOREIGN KEY `departments_parentDepartmentId_fkey`;

-- DropIndex
DROP INDEX `departments_parentDepartmentId_fkey` ON `departments`;

-- AlterTable
ALTER TABLE `departments` DROP COLUMN `parentDepartmentId`;

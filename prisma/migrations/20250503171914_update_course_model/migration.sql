/*
  Warnings:

  - You are about to drop the column `programId` on the `course` table. All the data in the column will be lost.
  - You are about to drop the column `semester` on the `course` table. All the data in the column will be lost.
  - You are about to alter the column `status` on the `course` table. The data in that column could be lost. The data in that column will be cast from `Enum(EnumId(9))` to `Enum(EnumId(2))`.
  - Added the required column `departmentId` to the `course` table without a default value. This is not possible if the table is not empty.
  - Added the required column `labHours` to the `course` table without a default value. This is not possible if the table is not empty.
  - Added the required column `theoryHours` to the `course` table without a default value. This is not possible if the table is not empty.
  - Added the required column `type` to the `course` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE `course` DROP FOREIGN KEY `Course_programId_fkey`;

-- DropIndex
DROP INDEX `Course_programId_idx` ON `course`;

-- AlterTable
ALTER TABLE `course` DROP COLUMN `programId`,
    DROP COLUMN `semester`,
    ADD COLUMN `departmentId` INTEGER NOT NULL,
    ADD COLUMN `labHours` INTEGER NOT NULL,
    ADD COLUMN `theoryHours` INTEGER NOT NULL,
    ADD COLUMN `type` ENUM('THEORY', 'LAB', 'PROJECT', 'THESIS') NOT NULL,
    MODIFY `status` ENUM('ACTIVE', 'INACTIVE', 'ARCHIVED') NOT NULL DEFAULT 'ACTIVE';

-- CreateTable
CREATE TABLE `_ProgramToCourse` (
    `A` INTEGER NOT NULL,
    `B` INTEGER NOT NULL,

    UNIQUE INDEX `_ProgramToCourse_AB_unique`(`A`, `B`),
    INDEX `_ProgramToCourse_B_index`(`B`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `Course_departmentId_idx` ON `course`(`departmentId`);

-- AddForeignKey
ALTER TABLE `course` ADD CONSTRAINT `course_departmentId_fkey` FOREIGN KEY (`departmentId`) REFERENCES `departments`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_ProgramToCourse` ADD CONSTRAINT `_ProgramToCourse_A_fkey` FOREIGN KEY (`A`) REFERENCES `course`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_ProgramToCourse` ADD CONSTRAINT `_ProgramToCourse_B_fkey` FOREIGN KEY (`B`) REFERENCES `programs`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- RenameIndex
ALTER TABLE `_courseprerequisites` RENAME INDEX `_courseprerequisites_AB_unique` TO `_CoursePrerequisites_AB_unique`;

-- RenameIndex
ALTER TABLE `_courseprerequisites` RENAME INDEX `_courseprerequisites_B_index` TO `_CoursePrerequisites_B_index`;

/*
  Warnings:

  - A unique constraint covering the columns `[userId]` on the table `user_roles` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[userId,roleId]` on the table `user_roles` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE `faculty` DROP FOREIGN KEY `faculty_userId_fkey`;

-- DropForeignKey
ALTER TABLE `students` DROP FOREIGN KEY `students_userId_fkey`;

-- DropForeignKey
ALTER TABLE `user_roles` DROP FOREIGN KEY `user_roles_userId_fkey`;

-- CreateIndex
CREATE UNIQUE INDEX `user_roles_userId_key` ON `user_roles`(`userId`);

-- CreateIndex
CREATE UNIQUE INDEX `user_roles_userId_roleId_key` ON `user_roles`(`userId`, `roleId`);

-- AddForeignKey
ALTER TABLE `faculty` ADD CONSTRAINT `faculty_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `students` ADD CONSTRAINT `students_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `user_roles` ADD CONSTRAINT `user_roles_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- RenameIndex
ALTER TABLE `_courseprerequisites` RENAME INDEX `_CoursePrerequisites_AB_unique` TO `_courseprerequisites_AB_unique`;

-- RenameIndex
ALTER TABLE `_courseprerequisites` RENAME INDEX `_CoursePrerequisites_B_index` TO `_courseprerequisites_B_index`;

-- RenameIndex
ALTER TABLE `_programtocourse` RENAME INDEX `_ProgramToCourse_AB_unique` TO `_programtocourse_AB_unique`;

-- RenameIndex
ALTER TABLE `_programtocourse` RENAME INDEX `_ProgramToCourse_B_index` TO `_programtocourse_B_index`;

-- CreateTable
CREATE TABLE `OTP` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `email` VARCHAR(191) NOT NULL,
    `userType` VARCHAR(191) NOT NULL,
    `code` VARCHAR(191) NOT NULL,
    `expiresAt` DATETIME(3) NOT NULL,
    `isUsed` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `OTP_email_userType_idx`(`email`, `userType`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- RenameIndex
ALTER TABLE `_courseprerequisites` RENAME INDEX `_CoursePrerequisites_AB_unique` TO `_courseprerequisites_AB_unique`;

-- RenameIndex
ALTER TABLE `_courseprerequisites` RENAME INDEX `_CoursePrerequisites_B_index` TO `_courseprerequisites_B_index`;

-- RenameIndex
ALTER TABLE `_permissiontorole` RENAME INDEX `_PermissionToRole_AB_unique` TO `_permissiontorole_AB_unique`;

-- RenameIndex
ALTER TABLE `_permissiontorole` RENAME INDEX `_PermissionToRole_B_index` TO `_permissiontorole_B_index`;

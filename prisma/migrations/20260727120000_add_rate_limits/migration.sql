-- CreateTable
CREATE TABLE `rate_limits` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `key` VARCHAR(191) NOT NULL,
    `attempts` INTEGER NOT NULL DEFAULT 0,
    `windowStart` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `blockedUntil` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `rate_limits_key_key`(`key`),
    INDEX `rate_limits_windowStart_idx`(`windowStart`),
    INDEX `rate_limits_blockedUntil_idx`(`blockedUntil`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

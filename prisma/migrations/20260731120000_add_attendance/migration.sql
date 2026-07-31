-- AlterTable
ALTER TABLE `notifications` MODIFY `type` ENUM('system', 'course', 'announcement', 'alert', 'grade', 'result', 'assessment', 'attendance') NOT NULL;

-- AlterTable
ALTER TABLE `passfailcriteria` ADD COLUMN `minAttendancePercent` DOUBLE NULL;

-- AlterTable
ALTER TABLE `studentsections` ADD COLUMN `eligibilityOverride` ENUM('none', 'eligible', 'ineligible') NOT NULL DEFAULT 'none',
    ADD COLUMN `eligibilityRemarks` TEXT NULL,
    ADD COLUMN `eligibilitySetAt` DATETIME(3) NULL,
    ADD COLUMN `eligibilitySetBy` INTEGER NULL;

-- CreateTable
CREATE TABLE `attendance_sessions` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `sectionId` INTEGER NOT NULL,
    `date` DATE NOT NULL,
    `slot` INTEGER NOT NULL DEFAULT 1,
    `topic` TEXT NULL,
    `durationMinutes` INTEGER NOT NULL DEFAULT 60,
    `status` ENUM('open', 'finalized') NOT NULL DEFAULT 'open',
    `markedBy` INTEGER NOT NULL,
    `finalizedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `attendance_sessions_sectionId_idx`(`sectionId`),
    INDEX `attendance_sessions_markedBy_idx`(`markedBy`),
    INDEX `attendance_sessions_date_idx`(`date`),
    UNIQUE INDEX `attendance_sessions_sectionId_date_slot_key`(`sectionId`, `date`, `slot`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `attendance_records` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `sessionId` INTEGER NOT NULL,
    `studentId` INTEGER NOT NULL,
    `status` ENUM('present', 'absent', 'late', 'excused') NOT NULL DEFAULT 'present',
    `remarks` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `attendance_records_sessionId_idx`(`sessionId`),
    INDEX `attendance_records_studentId_idx`(`studentId`),
    UNIQUE INDEX `attendance_records_sessionId_studentId_key`(`sessionId`, `studentId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `studentsections_eligibilitySetBy_idx` ON `studentsections`(`eligibilitySetBy`);

-- AddForeignKey
ALTER TABLE `studentsections` ADD CONSTRAINT `studentsections_eligibilitySetBy_fkey` FOREIGN KEY (`eligibilitySetBy`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `attendance_sessions` ADD CONSTRAINT `attendance_sessions_sectionId_fkey` FOREIGN KEY (`sectionId`) REFERENCES `sections`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `attendance_sessions` ADD CONSTRAINT `attendance_sessions_markedBy_fkey` FOREIGN KEY (`markedBy`) REFERENCES `faculties`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `attendance_records` ADD CONSTRAINT `attendance_records_sessionId_fkey` FOREIGN KEY (`sessionId`) REFERENCES `attendance_sessions`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `attendance_records` ADD CONSTRAINT `attendance_records_studentId_fkey` FOREIGN KEY (`studentId`) REFERENCES `students`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;


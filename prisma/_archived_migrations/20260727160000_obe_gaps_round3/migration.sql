-- Assessment items may be scored from a rubric instead of a bare mark.
ALTER TABLE `assessmentitems`
    ADD COLUMN `rubricId` INTEGER NULL;

CREATE INDEX `assessmentitems_rubricId_idx` ON `assessmentitems`(`rubricId`);

ALTER TABLE `assessmentitems`
    ADD CONSTRAINT `assessmentitems_rubricId_fkey`
    FOREIGN KEY (`rubricId`) REFERENCES `rubrics`(`id`)
    ON DELETE SET NULL ON UPDATE CASCADE;

-- Per-criterion rubric scores behind each student's item mark.
CREATE TABLE `rubric_scores` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `itemResultId` INTEGER NOT NULL,
    `criterionId` INTEGER NOT NULL,
    `level` ENUM('excellent', 'good', 'satisfactory', 'unsatisfactory') NOT NULL,
    `awardedMarks` DOUBLE NOT NULL,
    `comment` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `rubric_scores_itemResultId_criterionId_key`(`itemResultId`, `criterionId`),
    INDEX `rubric_scores_itemResultId_idx`(`itemResultId`),
    INDEX `rubric_scores_criterionId_idx`(`criterionId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `rubric_scores`
    ADD CONSTRAINT `rubric_scores_itemResultId_fkey`
    FOREIGN KEY (`itemResultId`) REFERENCES `studentassessmentitemresults`(`id`)
    ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `rubric_scores`
    ADD CONSTRAINT `rubric_scores_criterionId_fkey`
    FOREIGN KEY (`criterionId`) REFERENCES `rubric_criteria`(`id`)
    ON DELETE CASCADE ON UPDATE CASCADE;

-- OBE reports now store the generated report body, not just metadata.
ALTER TABLE `obereports`
    ADD COLUMN `data` JSON NULL;

-- A PLO-level action plan spans several courses, so it has no single offering.
ALTER TABLE `action_plans`
    DROP FOREIGN KEY `action_plans_courseOfferingId_fkey`;

ALTER TABLE `action_plans`
    MODIFY COLUMN `courseOfferingId` INTEGER NULL;

ALTER TABLE `action_plans`
    ADD CONSTRAINT `action_plans_courseOfferingId_fkey`
    FOREIGN KEY (`courseOfferingId`) REFERENCES `courseofferings`(`id`)
    ON DELETE RESTRICT ON UPDATE CASCADE;

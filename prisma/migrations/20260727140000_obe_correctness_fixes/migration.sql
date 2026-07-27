-- CLO attainment: separate the performance threshold from the cohort target,
-- and record how many enrolled students had no evaluated result.
ALTER TABLE `closattainments`
    ADD COLUMN `unassessedStudents` INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN `targetThreshold` DOUBLE NULL,
    ADD COLUMN `isAchieved` BOOLEAN NULL;

-- LLO attainment: same additions
ALTER TABLE `llosattainments`
    ADD COLUMN `unassessedStudents` INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN `targetThreshold` DOUBLE NULL,
    ADD COLUMN `isAchieved` BOOLEAN NULL;

-- PLO attainment: explicit achieved verdict
ALTER TABLE `ploattainments`
    ADD COLUMN `isAchieved` BOOLEAN NULL;

-- PEO-PLO mappings gain a weight, matching CLO-PLO and LLO-PLO.
-- Default 1 keeps existing rows behaving as the previous unweighted average.
ALTER TABLE `peoplomappings`
    ADD COLUMN `weight` DOUBLE NOT NULL DEFAULT 1;

-- Survey questions carry their own rating scale instead of assuming 1-5.
ALTER TABLE `survey_questions`
    ADD COLUMN `ratingScale` INTEGER NOT NULL DEFAULT 5;

-- Prevent duplicate external (employer/alumni) survey submissions.
-- Students were already covered by the (surveyId, studentId) unique index.
CREATE UNIQUE INDEX `survey_responses_surveyId_respondentEmail_key`
    ON `survey_responses`(`surveyId`, `respondentEmail`);

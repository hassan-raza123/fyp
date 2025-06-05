-- CreateTable
CREATE TABLE `users` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `username` VARCHAR(191) NULL,
    `email` VARCHAR(191) NOT NULL,
    `password_hash` VARCHAR(191) NOT NULL,
    `first_name` VARCHAR(191) NOT NULL,
    `last_name` VARCHAR(191) NOT NULL,
    `phone_number` VARCHAR(191) NULL,
    `profile_image` VARCHAR(191) NULL,
    `status` ENUM('active', 'inactive', 'suspended') NOT NULL DEFAULT 'active',
    `last_login` DATETIME(3) NULL,
    `email_verified` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `users_username_key`(`username`),
    UNIQUE INDEX `users_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `roles` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `roles_name_key`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `permissions` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `permissions_name_key`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `userroles` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `userId` INTEGER NOT NULL,
    `roleId` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `userroles_userId_key`(`userId`),
    INDEX `userroles_roleId_idx`(`roleId`),
    INDEX `userroles_userId_idx`(`userId`),
    UNIQUE INDEX `userroles_userId_roleId_key`(`userId`, `roleId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `departments` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `code` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NULL,
    `status` ENUM('active', 'inactive') NOT NULL DEFAULT 'active',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `adminId` INTEGER NULL,

    UNIQUE INDEX `departments_code_key`(`code`),
    UNIQUE INDEX `departments_adminId_key`(`adminId`),
    INDEX `departments_adminId_idx`(`adminId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `programs` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `code` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NULL,
    `duration` INTEGER NOT NULL,
    `status` ENUM('active', 'inactive') NOT NULL DEFAULT 'active',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `departmentId` INTEGER NOT NULL,
    `totalCreditHours` INTEGER NOT NULL DEFAULT 0,

    UNIQUE INDEX `programs_code_key`(`code`),
    INDEX `programs_departmentId_idx`(`departmentId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `courses` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `code` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NULL,
    `creditHours` INTEGER NOT NULL,
    `labHours` INTEGER NOT NULL,
    `theoryHours` INTEGER NOT NULL,
    `type` ENUM('THEORY', 'LAB', 'PROJECT', 'THESIS') NOT NULL,
    `status` ENUM('active', 'inactive', 'archived') NOT NULL DEFAULT 'active',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `departmentId` INTEGER NOT NULL,

    UNIQUE INDEX `courses_code_key`(`code`),
    INDEX `courses_departmentId_idx`(`departmentId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `semesters` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `startDate` DATETIME(3) NOT NULL,
    `endDate` DATETIME(3) NOT NULL,
    `status` ENUM('active', 'inactive', 'completed') NOT NULL DEFAULT 'active',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `semesters_name_key`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `batches` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `code` VARCHAR(191) NOT NULL,
    `startDate` DATETIME(3) NOT NULL,
    `endDate` DATETIME(3) NOT NULL,
    `maxStudents` INTEGER NOT NULL,
    `description` VARCHAR(191) NULL,
    `status` ENUM('active', 'completed', 'upcoming') NOT NULL DEFAULT 'upcoming',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `programId` INTEGER NOT NULL,

    UNIQUE INDEX `batches_code_key`(`code`),
    INDEX `batches_programId_idx`(`programId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `courseofferings` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `courseId` INTEGER NOT NULL,
    `semesterId` INTEGER NOT NULL,
    `status` ENUM('active', 'inactive', 'cancelled') NOT NULL DEFAULT 'active',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `courseofferings_courseId_idx`(`courseId`),
    INDEX `courseofferings_semesterId_idx`(`semesterId`),
    UNIQUE INDEX `courseofferings_courseId_semesterId_key`(`courseId`, `semesterId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `sections` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `courseOfferingId` INTEGER NOT NULL,
    `facultyId` INTEGER NULL,
    `batchId` VARCHAR(191) NOT NULL,
    `maxStudents` INTEGER NOT NULL,
    `status` ENUM('active', 'inactive', 'completed') NOT NULL DEFAULT 'active',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `sections_courseOfferingId_idx`(`courseOfferingId`),
    INDEX `sections_facultyId_idx`(`facultyId`),
    INDEX `sections_batchId_idx`(`batchId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `faculties` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `userId` INTEGER NOT NULL,
    `departmentId` INTEGER NOT NULL,
    `designation` VARCHAR(191) NOT NULL,
    `status` ENUM('active', 'inactive', 'on_leave') NOT NULL DEFAULT 'active',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `faculties_userId_key`(`userId`),
    INDEX `faculties_departmentId_idx`(`departmentId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `students` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `rollNumber` VARCHAR(191) NOT NULL,
    `status` ENUM('active', 'inactive', 'graduated', 'dropped') NOT NULL DEFAULT 'active',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `userId` INTEGER NOT NULL,
    `departmentId` INTEGER NOT NULL,
    `programId` INTEGER NOT NULL,
    `batchId` VARCHAR(191) NULL,

    UNIQUE INDEX `students_rollNumber_key`(`rollNumber`),
    UNIQUE INDEX `students_userId_key`(`userId`),
    INDEX `students_departmentId_idx`(`departmentId`),
    INDEX `students_programId_idx`(`programId`),
    INDEX `students_batchId_idx`(`batchId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `studentsections` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `studentId` INTEGER NOT NULL,
    `sectionId` INTEGER NOT NULL,
    `enrollmentDate` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `status` ENUM('active', 'inactive', 'completed') NOT NULL DEFAULT 'active',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `studentsections_sectionId_idx`(`sectionId`),
    INDEX `studentsections_studentId_idx`(`studentId`),
    UNIQUE INDEX `studentsections_studentId_sectionId_key`(`studentId`, `sectionId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `plos` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `code` VARCHAR(191) NOT NULL,
    `description` TEXT NOT NULL,
    `programId` INTEGER NOT NULL,
    `bloomLevel` VARCHAR(191) NULL,
    `status` ENUM('active', 'inactive', 'archived') NOT NULL DEFAULT 'active',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `plos_programId_idx`(`programId`),
    UNIQUE INDEX `plos_code_programId_key`(`code`, `programId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `clos` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `code` VARCHAR(191) NOT NULL,
    `description` TEXT NOT NULL,
    `courseId` INTEGER NOT NULL,
    `bloomLevel` VARCHAR(191) NULL,
    `status` ENUM('active', 'inactive', 'archived') NOT NULL DEFAULT 'active',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `clos_courseId_idx`(`courseId`),
    UNIQUE INDEX `clos_code_courseId_key`(`code`, `courseId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `cloplomappings` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `cloId` INTEGER NOT NULL,
    `ploId` INTEGER NOT NULL,
    `weight` DOUBLE NOT NULL DEFAULT 1.0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `cloplomappings_cloId_idx`(`cloId`),
    INDEX `cloplomappings_ploId_idx`(`ploId`),
    UNIQUE INDEX `cloplomappings_cloId_ploId_key`(`cloId`, `ploId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `closattainments` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `cloId` INTEGER NOT NULL,
    `courseOfferingId` INTEGER NOT NULL,
    `totalStudents` INTEGER NOT NULL,
    `studentsAchieved` INTEGER NOT NULL,
    `threshold` DOUBLE NOT NULL DEFAULT 60.0,
    `attainmentPercent` DOUBLE NOT NULL,
    `calculatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `calculatedBy` INTEGER NOT NULL,
    `status` ENUM('active', 'archived', 'draft') NOT NULL DEFAULT 'active',

    INDEX `closattainments_cloId_idx`(`cloId`),
    INDEX `closattainments_courseOfferingId_idx`(`courseOfferingId`),
    INDEX `closattainments_calculatedBy_idx`(`calculatedBy`),
    UNIQUE INDEX `closattainments_cloId_courseOfferingId_key`(`cloId`, `courseOfferingId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ploattainments` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `ploId` INTEGER NOT NULL,
    `programId` INTEGER NOT NULL,
    `semesterId` INTEGER NOT NULL,
    `totalStudents` INTEGER NOT NULL,
    `studentsAchieved` INTEGER NOT NULL,
    `threshold` DOUBLE NOT NULL DEFAULT 60.0,
    `attainmentPercent` DOUBLE NOT NULL,
    `calculatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `calculatedBy` INTEGER NOT NULL,
    `status` ENUM('active', 'archived', 'draft') NOT NULL DEFAULT 'active',

    INDEX `ploattainments_ploId_idx`(`ploId`),
    INDEX `ploattainments_programId_idx`(`programId`),
    INDEX `ploattainments_semesterId_idx`(`semesterId`),
    INDEX `ploattainments_calculatedBy_idx`(`calculatedBy`),
    UNIQUE INDEX `ploattainments_ploId_programId_semesterId_key`(`ploId`, `programId`, `semesterId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ploscores` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `studentId` INTEGER NOT NULL,
    `courseOfferingId` INTEGER NOT NULL,
    `ploId` INTEGER NOT NULL,
    `totalMarks` DOUBLE NOT NULL,
    `obtainedMarks` DOUBLE NOT NULL,
    `percentage` DOUBLE NOT NULL,
    `semesterName` VARCHAR(191) NOT NULL,
    `calculatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `ploscores_studentId_idx`(`studentId`),
    INDEX `ploscores_courseOfferingId_idx`(`courseOfferingId`),
    INDEX `ploscores_ploId_idx`(`ploId`),
    UNIQUE INDEX `ploscores_studentId_courseOfferingId_ploId_key`(`studentId`, `courseOfferingId`, `ploId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `assessments` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `title` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NULL,
    `type` ENUM('quiz', 'assignment', 'mid_exam', 'final_exam', 'presentation', 'lab_exam', 'project', 'viva', 'sessional_exam', 'lab_report', 'class_participation', 'case_study') NOT NULL,
    `totalMarks` DOUBLE NOT NULL,
    `weightage` DOUBLE NOT NULL,
    `courseOfferingId` INTEGER NOT NULL,
    `conductedBy` INTEGER NOT NULL,
    `dueDate` DATETIME(3) NULL,
    `instructions` VARCHAR(191) NULL,
    `status` ENUM('active', 'inactive', 'completed', 'cancelled') NOT NULL DEFAULT 'active',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `assessments_courseOfferingId_idx`(`courseOfferingId`),
    INDEX `assessments_conductedBy_idx`(`conductedBy`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `assessmentitems` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `assessmentId` INTEGER NOT NULL,
    `questionNo` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NULL,
    `marks` DOUBLE NOT NULL,
    `cloId` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `assessmentitems_assessmentId_idx`(`assessmentId`),
    INDEX `assessmentitems_cloId_idx`(`cloId`),
    UNIQUE INDEX `assessmentitems_assessmentId_questionNo_key`(`assessmentId`, `questionNo`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `studentassessmentresults` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `studentId` INTEGER NOT NULL,
    `assessmentId` INTEGER NOT NULL,
    `totalMarks` DOUBLE NOT NULL,
    `obtainedMarks` DOUBLE NOT NULL,
    `percentage` DOUBLE NOT NULL,
    `submittedAt` DATETIME(3) NULL,
    `evaluatedAt` DATETIME(3) NULL,
    `evaluatedBy` INTEGER NULL,
    `remarks` VARCHAR(191) NULL,
    `status` ENUM('pending', 'evaluated', 'published', 'draft') NOT NULL DEFAULT 'pending',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `studentassessmentresults_studentId_idx`(`studentId`),
    INDEX `studentassessmentresults_assessmentId_idx`(`assessmentId`),
    INDEX `studentassessmentresults_evaluatedBy_idx`(`evaluatedBy`),
    UNIQUE INDEX `studentassessmentresults_studentId_assessmentId_key`(`studentId`, `assessmentId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `studentassessmentitemresults` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `studentAssessmentResultId` INTEGER NOT NULL,
    `assessmentItemId` INTEGER NOT NULL,
    `obtainedMarks` DOUBLE NOT NULL,
    `totalMarks` DOUBLE NOT NULL,
    `isCorrect` BOOLEAN NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `studentassessmentitemresults_studentAssessmentResultId_idx`(`studentAssessmentResultId`),
    INDEX `studentassessmentitemresults_assessmentItemId_idx`(`assessmentItemId`),
    UNIQUE INDEX `studentassessmentitemresults_studentAssessmentResultId_asses_key`(`studentAssessmentResultId`, `assessmentItemId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `detailedresults` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `studentId` INTEGER NOT NULL,
    `assessmentId` INTEGER NOT NULL,
    `quiz1Marks` DOUBLE NULL,
    `quiz2Marks` DOUBLE NULL,
    `midtermMarks` DOUBLE NULL,
    `finalMarks` DOUBLE NULL,
    `assignmentMarks` DOUBLE NULL,
    `presentationMarks` DOUBLE NULL,
    `classParticipation` DOUBLE NULL,
    `totalObtained` DOUBLE NOT NULL,
    `totalPossible` DOUBLE NOT NULL,
    `percentage` DOUBLE NOT NULL,
    `grade` VARCHAR(191) NOT NULL,
    `isPassed` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `detailedresults_studentId_idx`(`studentId`),
    INDEX `detailedresults_assessmentId_idx`(`assessmentId`),
    UNIQUE INDEX `detailedresults_studentId_assessmentId_key`(`studentId`, `assessmentId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `gradescales` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `programId` INTEGER NULL,
    `grade` VARCHAR(191) NOT NULL,
    `minPercent` DOUBLE NOT NULL,
    `maxPercent` DOUBLE NOT NULL,
    `gpaValue` DOUBLE NOT NULL,
    `description` VARCHAR(191) NULL,
    `status` ENUM('active', 'superseded', 'final') NOT NULL DEFAULT 'active',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `gradescales_programId_idx`(`programId`),
    UNIQUE INDEX `gradescales_programId_grade_key`(`programId`, `grade`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `studentgrades` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `studentId` INTEGER NOT NULL,
    `courseOfferingId` INTEGER NOT NULL,
    `totalMarks` DOUBLE NOT NULL,
    `obtainedMarks` DOUBLE NOT NULL,
    `percentage` DOUBLE NOT NULL,
    `grade` VARCHAR(191) NOT NULL,
    `gpaPoints` DOUBLE NOT NULL,
    `creditHours` INTEGER NOT NULL,
    `qualityPoints` DOUBLE NOT NULL,
    `isRepeat` BOOLEAN NOT NULL DEFAULT false,
    `attemptNumber` INTEGER NOT NULL DEFAULT 1,
    `status` ENUM('active', 'superseded', 'final') NOT NULL DEFAULT 'active',
    `calculatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `calculatedBy` INTEGER NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `studentgrades_studentId_idx`(`studentId`),
    INDEX `studentgrades_courseOfferingId_idx`(`courseOfferingId`),
    INDEX `studentgrades_calculatedBy_idx`(`calculatedBy`),
    UNIQUE INDEX `studentgrades_studentId_courseOfferingId_attemptNumber_key`(`studentId`, `courseOfferingId`, `attemptNumber`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `semestergpa` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `studentId` INTEGER NOT NULL,
    `semesterId` INTEGER NOT NULL,
    `totalQualityPoints` DOUBLE NOT NULL,
    `totalCreditHours` INTEGER NOT NULL,
    `semesterGPA` DOUBLE NOT NULL,
    `status` ENUM('active', 'recalculated', 'final') NOT NULL DEFAULT 'active',
    `calculatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `semestergpa_studentId_idx`(`studentId`),
    INDEX `semestergpa_semesterId_idx`(`semesterId`),
    UNIQUE INDEX `semestergpa_studentId_semesterId_key`(`studentId`, `semesterId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `cumulativegpa` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `studentId` INTEGER NOT NULL,
    `totalQualityPoints` DOUBLE NOT NULL,
    `totalCreditHours` INTEGER NOT NULL,
    `cumulativeGPA` DOUBLE NOT NULL,
    `completedSemesters` INTEGER NOT NULL DEFAULT 0,
    `lastUpdated` DATETIME(3) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `cumulativegpa_studentId_key`(`studentId`),
    INDEX `cumulativegpa_studentId_idx`(`studentId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `passFailCriteria` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `courseOfferingId` INTEGER NOT NULL,
    `minPassPercent` DOUBLE NOT NULL DEFAULT 50.0,
    `minAttendance` DOUBLE NOT NULL DEFAULT 75.0,
    `status` ENUM('active', 'inactive') NOT NULL DEFAULT 'active',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `passFailCriteria_courseOfferingId_idx`(`courseOfferingId`),
    UNIQUE INDEX `passFailCriteria_courseOfferingId_key`(`courseOfferingId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `sessions` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `sectionId` INTEGER NOT NULL,
    `date` DATETIME(3) NOT NULL,
    `startTime` DATETIME(3) NOT NULL,
    `endTime` DATETIME(3) NOT NULL,
    `topic` VARCHAR(191) NULL,
    `remarks` VARCHAR(191) NULL,
    `status` ENUM('scheduled', 'in_progress', 'completed', 'cancelled') NOT NULL DEFAULT 'scheduled',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `sessions_sectionId_idx`(`sectionId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `attendances` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `studentSectionId` INTEGER NOT NULL,
    `sessionId` INTEGER NOT NULL,
    `status` ENUM('present', 'absent', 'late', 'leave', 'excused') NOT NULL,
    `markedBy` INTEGER NOT NULL,
    `remarks` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `attendances_markedBy_idx`(`markedBy`),
    INDEX `attendances_sessionId_idx`(`sessionId`),
    INDEX `attendances_studentSectionId_idx`(`studentSectionId`),
    UNIQUE INDEX `attendances_studentSectionId_sessionId_key`(`studentSectionId`, `sessionId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `timetableslots` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `sectionId` INTEGER NOT NULL,
    `dayOfWeek` INTEGER NOT NULL,
    `startTime` TIME(0) NOT NULL,
    `endTime` TIME(0) NOT NULL,
    `roomNumber` VARCHAR(191) NULL,
    `status` ENUM('active', 'inactive', 'suspended') NOT NULL DEFAULT 'active',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `timetableslots_sectionId_idx`(`sectionId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `datesheets` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `semesterId` INTEGER NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NULL,
    `examPeriod` ENUM('mid_term', 'final_term', 'makeup', 'supplementary') NOT NULL,
    `startDate` DATETIME(3) NOT NULL,
    `endDate` DATETIME(3) NOT NULL,
    `publishDate` DATETIME(3) NULL,
    `isPublished` BOOLEAN NOT NULL DEFAULT false,
    `isFinalized` BOOLEAN NOT NULL DEFAULT false,
    `createdBy` INTEGER NOT NULL,
    `approvedBy` INTEGER NULL,
    `approvedAt` DATETIME(3) NULL,
    `status` ENUM('draft', 'under_review', 'approved', 'published', 'finalized') NOT NULL DEFAULT 'draft',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `datesheets_semesterId_idx`(`semesterId`),
    INDEX `datesheets_examPeriod_idx`(`examPeriod`),
    INDEX `datesheets_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `examschedules` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `semesterId` INTEGER NOT NULL,
    `courseOfferingId` INTEGER NOT NULL,
    `examType` ENUM('mid_term', 'final_term', 'quiz', 'makeup', 'supplementary') NOT NULL,
    `examDate` DATETIME(3) NOT NULL,
    `startTime` TIME(0) NOT NULL,
    `endTime` TIME(0) NOT NULL,
    `roomNumber` VARCHAR(191) NULL,
    `duration` INTEGER NOT NULL,
    `instructions` VARCHAR(191) NULL,
    `status` ENUM('scheduled', 'in_progress', 'completed', 'cancelled') NOT NULL DEFAULT 'scheduled',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `examschedules_semesterId_idx`(`semesterId`),
    INDEX `examschedules_courseOfferingId_idx`(`courseOfferingId`),
    INDEX `examschedules_examDate_idx`(`examDate`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `datesheetEntries` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `datesheetId` INTEGER NOT NULL,
    `examScheduleId` INTEGER NOT NULL,
    `dayOfExam` INTEGER NOT NULL,
    `timeSlot` ENUM('morning', 'afternoon', 'evening') NOT NULL,
    `paperCode` VARCHAR(191) NOT NULL,
    `paperTitle` VARCHAR(191) NOT NULL,
    `duration` INTEGER NOT NULL,
    `totalMarks` INTEGER NOT NULL,
    `passingMarks` INTEGER NOT NULL,
    `notes` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `datesheetEntries_datesheetId_idx`(`datesheetId`),
    INDEX `datesheetEntries_examScheduleId_idx`(`examScheduleId`),
    UNIQUE INDEX `datesheetEntries_datesheetId_examScheduleId_key`(`datesheetId`, `examScheduleId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `examAttendance` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `examScheduleId` INTEGER NOT NULL,
    `studentId` INTEGER NOT NULL,
    `attendanceStatus` ENUM('present', 'absent', 'late', 'left_early') NOT NULL,
    `arrivalTime` DATETIME(3) NULL,
    `departureTime` DATETIME(3) NULL,
    `remarks` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `examAttendance_examScheduleId_idx`(`examScheduleId`),
    INDEX `examAttendance_studentId_idx`(`studentId`),
    UNIQUE INDEX `examAttendance_examScheduleId_studentId_key`(`examScheduleId`, `studentId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `transcripts` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `studentId` INTEGER NOT NULL,
    `semesterId` INTEGER NULL,
    `transcriptType` ENUM('official', 'unofficial', 'semester', 'complete') NOT NULL,
    `totalCGPA` DOUBLE NULL,
    `totalCreditHours` INTEGER NULL,
    `isOfficial` BOOLEAN NOT NULL DEFAULT false,
    `generatedBy` INTEGER NOT NULL,
    `generatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `filePath` VARCHAR(191) NULL,
    `status` ENUM('generated', 'issued', 'cancelled') NOT NULL DEFAULT 'generated',

    INDEX `transcripts_studentId_idx`(`studentId`),
    INDEX `transcripts_semesterId_idx`(`semesterId`),
    INDEX `transcripts_generatedBy_idx`(`generatedBy`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `notifications` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `userId` INTEGER NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `message` VARCHAR(191) NOT NULL,
    `isRead` BOOLEAN NOT NULL DEFAULT false,
    `type` ENUM('system', 'attendance', 'course', 'announcement', 'alert', 'grade') NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `notifications_userId_idx`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `auditlogs` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `userId` INTEGER NOT NULL,
    `action` VARCHAR(191) NOT NULL,
    `details` JSON NOT NULL,
    `ipAddress` VARCHAR(191) NULL,
    `userAgent` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `auditlogs_createdAt_idx`(`createdAt`),
    INDEX `auditlogs_userId_idx`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `passwordresets` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `userId` INTEGER NOT NULL,
    `token` VARCHAR(191) NOT NULL,
    `expiresAt` DATETIME(3) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `passwordresets_token_key`(`token`),
    INDEX `passwordresets_token_idx`(`token`),
    INDEX `passwordresets_userId_idx`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `coursefeedbacks` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `studentId` INTEGER NOT NULL,
    `courseOfferingId` INTEGER NOT NULL,
    `rating` INTEGER NOT NULL,
    `comments` VARCHAR(191) NULL,
    `suggestions` VARCHAR(191) NULL,
    `isAnonymous` BOOLEAN NOT NULL DEFAULT false,
    `submittedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `coursefeedbacks_studentId_idx`(`studentId`),
    INDEX `coursefeedbacks_courseOfferingId_idx`(`courseOfferingId`),
    UNIQUE INDEX `coursefeedbacks_studentId_courseOfferingId_key`(`studentId`, `courseOfferingId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `facultyfeedbacks` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `facultyId` INTEGER NOT NULL,
    `courseOfferingId` INTEGER NOT NULL,
    `studentEngagement` INTEGER NOT NULL,
    `infrastructureRating` INTEGER NOT NULL,
    `suggestions` VARCHAR(191) NULL,
    `challenges` VARCHAR(191) NULL,
    `submittedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `facultyfeedbacks_facultyId_idx`(`facultyId`),
    INDEX `facultyfeedbacks_courseOfferingId_idx`(`courseOfferingId`),
    UNIQUE INDEX `facultyfeedbacks_facultyId_courseOfferingId_key`(`facultyId`, `courseOfferingId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `obereports` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `reportType` ENUM('clo_attainment', 'plo_attainment', 'program_assessment', 'semester_summary', 'course_wise') NOT NULL,
    `programId` INTEGER NULL,
    `semesterId` INTEGER NULL,
    `title` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NULL,
    `generatedBy` INTEGER NOT NULL,
    `generatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `filePath` VARCHAR(191) NULL,
    `status` ENUM('generated', 'published', 'archived') NOT NULL DEFAULT 'generated',

    INDEX `obereports_programId_idx`(`programId`),
    INDEX `obereports_semesterId_idx`(`semesterId`),
    INDEX `obereports_generatedBy_idx`(`generatedBy`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `_PermissionToRole` (
    `A` INTEGER NOT NULL,
    `B` INTEGER NOT NULL,

    UNIQUE INDEX `_PermissionToRole_AB_unique`(`A`, `B`),
    INDEX `_PermissionToRole_B_index`(`B`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `_CoursePrerequisites` (
    `A` INTEGER NOT NULL,
    `B` INTEGER NOT NULL,

    UNIQUE INDEX `_CoursePrerequisites_AB_unique`(`A`, `B`),
    INDEX `_CoursePrerequisites_B_index`(`B`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `_FacultyCourses` (
    `A` INTEGER NOT NULL,
    `B` INTEGER NOT NULL,

    UNIQUE INDEX `_FacultyCourses_AB_unique`(`A`, `B`),
    INDEX `_FacultyCourses_B_index`(`B`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `_ProgramToCourse` (
    `A` INTEGER NOT NULL,
    `B` INTEGER NOT NULL,

    UNIQUE INDEX `_ProgramToCourse_AB_unique`(`A`, `B`),
    INDEX `_ProgramToCourse_B_index`(`B`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `userroles` ADD CONSTRAINT `userroles_roleId_fkey` FOREIGN KEY (`roleId`) REFERENCES `roles`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `userroles` ADD CONSTRAINT `userroles_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `departments` ADD CONSTRAINT `departments_adminId_fkey` FOREIGN KEY (`adminId`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `programs` ADD CONSTRAINT `programs_departmentId_fkey` FOREIGN KEY (`departmentId`) REFERENCES `departments`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `courses` ADD CONSTRAINT `courses_departmentId_fkey` FOREIGN KEY (`departmentId`) REFERENCES `departments`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `batches` ADD CONSTRAINT `batches_programId_fkey` FOREIGN KEY (`programId`) REFERENCES `programs`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `courseofferings` ADD CONSTRAINT `courseofferings_courseId_fkey` FOREIGN KEY (`courseId`) REFERENCES `courses`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `courseofferings` ADD CONSTRAINT `courseofferings_semesterId_fkey` FOREIGN KEY (`semesterId`) REFERENCES `semesters`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `sections` ADD CONSTRAINT `sections_courseOfferingId_fkey` FOREIGN KEY (`courseOfferingId`) REFERENCES `courseofferings`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `sections` ADD CONSTRAINT `sections_facultyId_fkey` FOREIGN KEY (`facultyId`) REFERENCES `faculties`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `sections` ADD CONSTRAINT `sections_batchId_fkey` FOREIGN KEY (`batchId`) REFERENCES `batches`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `faculties` ADD CONSTRAINT `faculties_departmentId_fkey` FOREIGN KEY (`departmentId`) REFERENCES `departments`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `faculties` ADD CONSTRAINT `faculties_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `students` ADD CONSTRAINT `students_batchId_fkey` FOREIGN KEY (`batchId`) REFERENCES `batches`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `students` ADD CONSTRAINT `students_departmentId_fkey` FOREIGN KEY (`departmentId`) REFERENCES `departments`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `students` ADD CONSTRAINT `students_programId_fkey` FOREIGN KEY (`programId`) REFERENCES `programs`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `students` ADD CONSTRAINT `students_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `studentsections` ADD CONSTRAINT `studentsections_sectionId_fkey` FOREIGN KEY (`sectionId`) REFERENCES `sections`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `studentsections` ADD CONSTRAINT `studentsections_studentId_fkey` FOREIGN KEY (`studentId`) REFERENCES `students`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `plos` ADD CONSTRAINT `plos_programId_fkey` FOREIGN KEY (`programId`) REFERENCES `programs`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `clos` ADD CONSTRAINT `clos_courseId_fkey` FOREIGN KEY (`courseId`) REFERENCES `courses`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `cloplomappings` ADD CONSTRAINT `cloplomappings_cloId_fkey` FOREIGN KEY (`cloId`) REFERENCES `clos`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `cloplomappings` ADD CONSTRAINT `cloplomappings_ploId_fkey` FOREIGN KEY (`ploId`) REFERENCES `plos`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `closattainments` ADD CONSTRAINT `closattainments_cloId_fkey` FOREIGN KEY (`cloId`) REFERENCES `clos`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `closattainments` ADD CONSTRAINT `closattainments_courseOfferingId_fkey` FOREIGN KEY (`courseOfferingId`) REFERENCES `courseofferings`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `closattainments` ADD CONSTRAINT `closattainments_calculatedBy_fkey` FOREIGN KEY (`calculatedBy`) REFERENCES `faculties`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ploattainments` ADD CONSTRAINT `ploattainments_ploId_fkey` FOREIGN KEY (`ploId`) REFERENCES `plos`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ploattainments` ADD CONSTRAINT `ploattainments_programId_fkey` FOREIGN KEY (`programId`) REFERENCES `programs`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ploattainments` ADD CONSTRAINT `ploattainments_semesterId_fkey` FOREIGN KEY (`semesterId`) REFERENCES `semesters`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ploattainments` ADD CONSTRAINT `ploattainments_calculatedBy_fkey` FOREIGN KEY (`calculatedBy`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ploscores` ADD CONSTRAINT `ploscores_studentId_fkey` FOREIGN KEY (`studentId`) REFERENCES `students`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ploscores` ADD CONSTRAINT `ploscores_courseOfferingId_fkey` FOREIGN KEY (`courseOfferingId`) REFERENCES `courseofferings`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ploscores` ADD CONSTRAINT `ploscores_ploId_fkey` FOREIGN KEY (`ploId`) REFERENCES `plos`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `assessments` ADD CONSTRAINT `assessments_courseOfferingId_fkey` FOREIGN KEY (`courseOfferingId`) REFERENCES `courseofferings`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `assessments` ADD CONSTRAINT `assessments_conductedBy_fkey` FOREIGN KEY (`conductedBy`) REFERENCES `faculties`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `assessmentitems` ADD CONSTRAINT `assessmentitems_assessmentId_fkey` FOREIGN KEY (`assessmentId`) REFERENCES `assessments`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `assessmentitems` ADD CONSTRAINT `assessmentitems_cloId_fkey` FOREIGN KEY (`cloId`) REFERENCES `clos`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `studentassessmentresults` ADD CONSTRAINT `studentassessmentresults_studentId_fkey` FOREIGN KEY (`studentId`) REFERENCES `students`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `studentassessmentresults` ADD CONSTRAINT `studentassessmentresults_assessmentId_fkey` FOREIGN KEY (`assessmentId`) REFERENCES `assessments`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `studentassessmentresults` ADD CONSTRAINT `studentassessmentresults_evaluatedBy_fkey` FOREIGN KEY (`evaluatedBy`) REFERENCES `faculties`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `studentassessmentitemresults` ADD CONSTRAINT `studentassessmentitemresults_studentAssessmentResultId_fkey` FOREIGN KEY (`studentAssessmentResultId`) REFERENCES `studentassessmentresults`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `studentassessmentitemresults` ADD CONSTRAINT `studentassessmentitemresults_assessmentItemId_fkey` FOREIGN KEY (`assessmentItemId`) REFERENCES `assessmentitems`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `detailedresults` ADD CONSTRAINT `detailedresults_studentId_fkey` FOREIGN KEY (`studentId`) REFERENCES `students`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `detailedresults` ADD CONSTRAINT `detailedresults_assessmentId_fkey` FOREIGN KEY (`assessmentId`) REFERENCES `assessments`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `gradescales` ADD CONSTRAINT `gradescales_programId_fkey` FOREIGN KEY (`programId`) REFERENCES `programs`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `studentgrades` ADD CONSTRAINT `studentgrades_studentId_fkey` FOREIGN KEY (`studentId`) REFERENCES `students`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `studentgrades` ADD CONSTRAINT `studentgrades_courseOfferingId_fkey` FOREIGN KEY (`courseOfferingId`) REFERENCES `courseofferings`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `studentgrades` ADD CONSTRAINT `studentgrades_calculatedBy_fkey` FOREIGN KEY (`calculatedBy`) REFERENCES `faculties`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `semestergpa` ADD CONSTRAINT `semestergpa_studentId_fkey` FOREIGN KEY (`studentId`) REFERENCES `students`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `semestergpa` ADD CONSTRAINT `semestergpa_semesterId_fkey` FOREIGN KEY (`semesterId`) REFERENCES `semesters`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `cumulativegpa` ADD CONSTRAINT `cumulativegpa_studentId_fkey` FOREIGN KEY (`studentId`) REFERENCES `students`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `passFailCriteria` ADD CONSTRAINT `passFailCriteria_courseOfferingId_fkey` FOREIGN KEY (`courseOfferingId`) REFERENCES `courseofferings`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `sessions` ADD CONSTRAINT `sessions_sectionId_fkey` FOREIGN KEY (`sectionId`) REFERENCES `sections`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `attendances` ADD CONSTRAINT `attendances_markedBy_fkey` FOREIGN KEY (`markedBy`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `attendances` ADD CONSTRAINT `attendances_sessionId_fkey` FOREIGN KEY (`sessionId`) REFERENCES `sessions`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `attendances` ADD CONSTRAINT `attendances_studentSectionId_fkey` FOREIGN KEY (`studentSectionId`) REFERENCES `studentsections`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `timetableslots` ADD CONSTRAINT `timetableslots_sectionId_fkey` FOREIGN KEY (`sectionId`) REFERENCES `sections`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `datesheets` ADD CONSTRAINT `datesheets_semesterId_fkey` FOREIGN KEY (`semesterId`) REFERENCES `semesters`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `datesheets` ADD CONSTRAINT `datesheets_createdBy_fkey` FOREIGN KEY (`createdBy`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `datesheets` ADD CONSTRAINT `datesheets_approvedBy_fkey` FOREIGN KEY (`approvedBy`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `examschedules` ADD CONSTRAINT `examschedules_semesterId_fkey` FOREIGN KEY (`semesterId`) REFERENCES `semesters`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `examschedules` ADD CONSTRAINT `examschedules_courseOfferingId_fkey` FOREIGN KEY (`courseOfferingId`) REFERENCES `courseofferings`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `datesheetEntries` ADD CONSTRAINT `datesheetEntries_datesheetId_fkey` FOREIGN KEY (`datesheetId`) REFERENCES `datesheets`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `datesheetEntries` ADD CONSTRAINT `datesheetEntries_examScheduleId_fkey` FOREIGN KEY (`examScheduleId`) REFERENCES `examschedules`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `examAttendance` ADD CONSTRAINT `examAttendance_examScheduleId_fkey` FOREIGN KEY (`examScheduleId`) REFERENCES `examschedules`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `examAttendance` ADD CONSTRAINT `examAttendance_studentId_fkey` FOREIGN KEY (`studentId`) REFERENCES `students`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `transcripts` ADD CONSTRAINT `transcripts_studentId_fkey` FOREIGN KEY (`studentId`) REFERENCES `students`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `transcripts` ADD CONSTRAINT `transcripts_semesterId_fkey` FOREIGN KEY (`semesterId`) REFERENCES `semesters`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `transcripts` ADD CONSTRAINT `transcripts_generatedBy_fkey` FOREIGN KEY (`generatedBy`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `notifications` ADD CONSTRAINT `notifications_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `auditlogs` ADD CONSTRAINT `auditlogs_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `passwordresets` ADD CONSTRAINT `passwordresets_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `coursefeedbacks` ADD CONSTRAINT `coursefeedbacks_studentId_fkey` FOREIGN KEY (`studentId`) REFERENCES `students`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `coursefeedbacks` ADD CONSTRAINT `coursefeedbacks_courseOfferingId_fkey` FOREIGN KEY (`courseOfferingId`) REFERENCES `courseofferings`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `facultyfeedbacks` ADD CONSTRAINT `facultyfeedbacks_facultyId_fkey` FOREIGN KEY (`facultyId`) REFERENCES `faculties`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `facultyfeedbacks` ADD CONSTRAINT `facultyfeedbacks_courseOfferingId_fkey` FOREIGN KEY (`courseOfferingId`) REFERENCES `courseofferings`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `obereports` ADD CONSTRAINT `obereports_programId_fkey` FOREIGN KEY (`programId`) REFERENCES `programs`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `obereports` ADD CONSTRAINT `obereports_semesterId_fkey` FOREIGN KEY (`semesterId`) REFERENCES `semesters`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `obereports` ADD CONSTRAINT `obereports_generatedBy_fkey` FOREIGN KEY (`generatedBy`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_PermissionToRole` ADD CONSTRAINT `_PermissionToRole_A_fkey` FOREIGN KEY (`A`) REFERENCES `permissions`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_PermissionToRole` ADD CONSTRAINT `_PermissionToRole_B_fkey` FOREIGN KEY (`B`) REFERENCES `roles`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_CoursePrerequisites` ADD CONSTRAINT `_CoursePrerequisites_A_fkey` FOREIGN KEY (`A`) REFERENCES `courses`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_CoursePrerequisites` ADD CONSTRAINT `_CoursePrerequisites_B_fkey` FOREIGN KEY (`B`) REFERENCES `courses`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_FacultyCourses` ADD CONSTRAINT `_FacultyCourses_A_fkey` FOREIGN KEY (`A`) REFERENCES `courses`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_FacultyCourses` ADD CONSTRAINT `_FacultyCourses_B_fkey` FOREIGN KEY (`B`) REFERENCES `faculties`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_ProgramToCourse` ADD CONSTRAINT `_ProgramToCourse_A_fkey` FOREIGN KEY (`A`) REFERENCES `courses`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_ProgramToCourse` ADD CONSTRAINT `_ProgramToCourse_B_fkey` FOREIGN KEY (`B`) REFERENCES `programs`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

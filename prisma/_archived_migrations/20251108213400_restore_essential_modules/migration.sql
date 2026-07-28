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
    `sessionType` ENUM('morning', 'evening') NOT NULL DEFAULT 'morning',
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
CREATE TABLE `llos` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `code` VARCHAR(191) NOT NULL,
    `description` TEXT NOT NULL,
    `courseId` INTEGER NOT NULL,
    `bloomLevel` VARCHAR(191) NULL,
    `status` ENUM('active', 'inactive', 'archived') NOT NULL DEFAULT 'active',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `llos_courseId_idx`(`courseId`),
    UNIQUE INDEX `llos_code_courseId_key`(`code`, `courseId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `cloplomappings` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `cloId` INTEGER NOT NULL,
    `ploId` INTEGER NOT NULL,
    `weight` DOUBLE NOT NULL DEFAULT 1,
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
    `threshold` DOUBLE NOT NULL DEFAULT 60,
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
CREATE TABLE `lloplomappings` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `lloId` INTEGER NOT NULL,
    `ploId` INTEGER NOT NULL,
    `weight` DOUBLE NOT NULL DEFAULT 1,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `lloplomappings_lloId_idx`(`lloId`),
    INDEX `lloplomappings_ploId_idx`(`ploId`),
    UNIQUE INDEX `lloplomappings_lloId_ploId_key`(`lloId`, `ploId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `llosattainments` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `lloId` INTEGER NOT NULL,
    `courseOfferingId` INTEGER NOT NULL,
    `totalStudents` INTEGER NOT NULL,
    `studentsAchieved` INTEGER NOT NULL,
    `threshold` DOUBLE NOT NULL DEFAULT 60,
    `attainmentPercent` DOUBLE NOT NULL,
    `calculatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `calculatedBy` INTEGER NOT NULL,
    `status` ENUM('active', 'archived', 'draft') NOT NULL DEFAULT 'active',

    INDEX `llosattainments_lloId_idx`(`lloId`),
    INDEX `llosattainments_courseOfferingId_idx`(`courseOfferingId`),
    INDEX `llosattainments_calculatedBy_idx`(`calculatedBy`),
    UNIQUE INDEX `llosattainments_lloId_courseOfferingId_key`(`lloId`, `courseOfferingId`),
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
    `threshold` DOUBLE NOT NULL DEFAULT 60,
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
CREATE TABLE `notifications` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `userId` INTEGER NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `message` VARCHAR(191) NOT NULL,
    `isRead` BOOLEAN NOT NULL DEFAULT false,
    `type` ENUM('system', 'course', 'announcement', 'alert', 'grade', 'result', 'assessment') NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `notifications_userId_idx`(`userId`),
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
CREATE TABLE `passfailcriteria` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `courseOfferingId` INTEGER NOT NULL,
    `minPassPercent` DOUBLE NOT NULL DEFAULT 50,
    `minAttendance` DOUBLE NOT NULL DEFAULT 75,
    `status` ENUM('active', 'inactive') NOT NULL DEFAULT 'active',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `passFailCriteria_courseOfferingId_key`(`courseOfferingId`),
    INDEX `passFailCriteria_courseOfferingId_idx`(`courseOfferingId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `otps` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `email` VARCHAR(191) NOT NULL,
    `userType` VARCHAR(191) NOT NULL,
    `code` VARCHAR(191) NOT NULL,
    `expiresAt` DATETIME(3) NOT NULL,
    `isUsed` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `otps_email_userType_idx`(`email`, `userType`),
    INDEX `otps_expiresAt_idx`(`expiresAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Settings` (
    `id` INTEGER NOT NULL DEFAULT 1,
    `system` JSON NOT NULL,
    `email` JSON NOT NULL,
    `notifications` JSON NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `_permissiontorole` (
    `A` INTEGER NOT NULL,
    `B` INTEGER NOT NULL,

    UNIQUE INDEX `_permissiontorole_AB_unique`(`A`, `B`),
    INDEX `_permissiontorole_B_index`(`B`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `_courseprerequisites` (
    `A` INTEGER NOT NULL,
    `B` INTEGER NOT NULL,

    UNIQUE INDEX `_courseprerequisites_AB_unique`(`A`, `B`),
    INDEX `_courseprerequisites_B_index`(`B`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `_facultycourses` (
    `A` INTEGER NOT NULL,
    `B` INTEGER NOT NULL,

    UNIQUE INDEX `_facultycourses_AB_unique`(`A`, `B`),
    INDEX `_facultycourses_B_index`(`B`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `_programtocourse` (
    `A` INTEGER NOT NULL,
    `B` INTEGER NOT NULL,

    UNIQUE INDEX `_programtocourse_AB_unique`(`A`, `B`),
    INDEX `_programtocourse_B_index`(`B`)
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
ALTER TABLE `sections` ADD CONSTRAINT `sections_batchId_fkey` FOREIGN KEY (`batchId`) REFERENCES `batches`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `sections` ADD CONSTRAINT `sections_courseOfferingId_fkey` FOREIGN KEY (`courseOfferingId`) REFERENCES `courseofferings`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `sections` ADD CONSTRAINT `sections_facultyId_fkey` FOREIGN KEY (`facultyId`) REFERENCES `faculties`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

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
ALTER TABLE `llos` ADD CONSTRAINT `llos_courseId_fkey` FOREIGN KEY (`courseId`) REFERENCES `courses`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `cloplomappings` ADD CONSTRAINT `cloplomappings_cloId_fkey` FOREIGN KEY (`cloId`) REFERENCES `clos`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `cloplomappings` ADD CONSTRAINT `cloplomappings_ploId_fkey` FOREIGN KEY (`ploId`) REFERENCES `plos`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `closattainments` ADD CONSTRAINT `closattainments_calculatedBy_fkey` FOREIGN KEY (`calculatedBy`) REFERENCES `faculties`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `closattainments` ADD CONSTRAINT `closattainments_cloId_fkey` FOREIGN KEY (`cloId`) REFERENCES `clos`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `closattainments` ADD CONSTRAINT `closattainments_courseOfferingId_fkey` FOREIGN KEY (`courseOfferingId`) REFERENCES `courseofferings`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `lloplomappings` ADD CONSTRAINT `lloplomappings_lloId_fkey` FOREIGN KEY (`lloId`) REFERENCES `llos`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `lloplomappings` ADD CONSTRAINT `lloplomappings_ploId_fkey` FOREIGN KEY (`ploId`) REFERENCES `plos`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `llosattainments` ADD CONSTRAINT `llosattainments_calculatedBy_fkey` FOREIGN KEY (`calculatedBy`) REFERENCES `faculties`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `llosattainments` ADD CONSTRAINT `llosattainments_lloId_fkey` FOREIGN KEY (`lloId`) REFERENCES `llos`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `llosattainments` ADD CONSTRAINT `llosattainments_courseOfferingId_fkey` FOREIGN KEY (`courseOfferingId`) REFERENCES `courseofferings`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ploattainments` ADD CONSTRAINT `ploattainments_calculatedBy_fkey` FOREIGN KEY (`calculatedBy`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ploattainments` ADD CONSTRAINT `ploattainments_ploId_fkey` FOREIGN KEY (`ploId`) REFERENCES `plos`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ploattainments` ADD CONSTRAINT `ploattainments_programId_fkey` FOREIGN KEY (`programId`) REFERENCES `programs`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ploattainments` ADD CONSTRAINT `ploattainments_semesterId_fkey` FOREIGN KEY (`semesterId`) REFERENCES `semesters`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ploscores` ADD CONSTRAINT `ploscores_courseOfferingId_fkey` FOREIGN KEY (`courseOfferingId`) REFERENCES `courseofferings`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ploscores` ADD CONSTRAINT `ploscores_ploId_fkey` FOREIGN KEY (`ploId`) REFERENCES `plos`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ploscores` ADD CONSTRAINT `ploscores_studentId_fkey` FOREIGN KEY (`studentId`) REFERENCES `students`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `assessments` ADD CONSTRAINT `assessments_conductedBy_fkey` FOREIGN KEY (`conductedBy`) REFERENCES `faculties`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `assessments` ADD CONSTRAINT `assessments_courseOfferingId_fkey` FOREIGN KEY (`courseOfferingId`) REFERENCES `courseofferings`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `assessmentitems` ADD CONSTRAINT `assessmentitems_assessmentId_fkey` FOREIGN KEY (`assessmentId`) REFERENCES `assessments`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `assessmentitems` ADD CONSTRAINT `assessmentitems_cloId_fkey` FOREIGN KEY (`cloId`) REFERENCES `clos`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `studentassessmentresults` ADD CONSTRAINT `studentassessmentresults_assessmentId_fkey` FOREIGN KEY (`assessmentId`) REFERENCES `assessments`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `studentassessmentresults` ADD CONSTRAINT `studentassessmentresults_evaluatedBy_fkey` FOREIGN KEY (`evaluatedBy`) REFERENCES `faculties`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `studentassessmentresults` ADD CONSTRAINT `studentassessmentresults_studentId_fkey` FOREIGN KEY (`studentId`) REFERENCES `students`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `studentassessmentitemresults` ADD CONSTRAINT `studentassessmentitemresults_assessmentItemId_fkey` FOREIGN KEY (`assessmentItemId`) REFERENCES `assessmentitems`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `studentassessmentitemresults` ADD CONSTRAINT `studentassessmentitemresults_studentAssessmentResultId_fkey` FOREIGN KEY (`studentAssessmentResultId`) REFERENCES `studentassessmentresults`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `detailedresults` ADD CONSTRAINT `detailedresults_assessmentId_fkey` FOREIGN KEY (`assessmentId`) REFERENCES `assessments`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `detailedresults` ADD CONSTRAINT `detailedresults_studentId_fkey` FOREIGN KEY (`studentId`) REFERENCES `students`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `gradescales` ADD CONSTRAINT `gradescales_programId_fkey` FOREIGN KEY (`programId`) REFERENCES `programs`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `studentgrades` ADD CONSTRAINT `studentgrades_calculatedBy_fkey` FOREIGN KEY (`calculatedBy`) REFERENCES `faculties`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `studentgrades` ADD CONSTRAINT `studentgrades_courseOfferingId_fkey` FOREIGN KEY (`courseOfferingId`) REFERENCES `courseofferings`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `studentgrades` ADD CONSTRAINT `studentgrades_studentId_fkey` FOREIGN KEY (`studentId`) REFERENCES `students`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `semestergpa` ADD CONSTRAINT `semestergpa_semesterId_fkey` FOREIGN KEY (`semesterId`) REFERENCES `semesters`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `semestergpa` ADD CONSTRAINT `semestergpa_studentId_fkey` FOREIGN KEY (`studentId`) REFERENCES `students`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `cumulativegpa` ADD CONSTRAINT `cumulativegpa_studentId_fkey` FOREIGN KEY (`studentId`) REFERENCES `students`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `sessions` ADD CONSTRAINT `sessions_sectionId_fkey` FOREIGN KEY (`sectionId`) REFERENCES `sections`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `notifications` ADD CONSTRAINT `notifications_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `obereports` ADD CONSTRAINT `obereports_generatedBy_fkey` FOREIGN KEY (`generatedBy`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `obereports` ADD CONSTRAINT `obereports_programId_fkey` FOREIGN KEY (`programId`) REFERENCES `programs`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `obereports` ADD CONSTRAINT `obereports_semesterId_fkey` FOREIGN KEY (`semesterId`) REFERENCES `semesters`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `transcripts` ADD CONSTRAINT `transcripts_generatedBy_fkey` FOREIGN KEY (`generatedBy`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `transcripts` ADD CONSTRAINT `transcripts_semesterId_fkey` FOREIGN KEY (`semesterId`) REFERENCES `semesters`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `transcripts` ADD CONSTRAINT `transcripts_studentId_fkey` FOREIGN KEY (`studentId`) REFERENCES `students`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `auditlogs` ADD CONSTRAINT `auditlogs_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `passwordresets` ADD CONSTRAINT `passwordresets_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `passfailcriteria` ADD CONSTRAINT `passFailCriteria_courseOfferingId_fkey` FOREIGN KEY (`courseOfferingId`) REFERENCES `courseofferings`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_permissiontorole` ADD CONSTRAINT `_permissiontorole_A_fkey` FOREIGN KEY (`A`) REFERENCES `permissions`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_permissiontorole` ADD CONSTRAINT `_permissiontorole_B_fkey` FOREIGN KEY (`B`) REFERENCES `roles`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_courseprerequisites` ADD CONSTRAINT `_courseprerequisites_A_fkey` FOREIGN KEY (`A`) REFERENCES `courses`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_courseprerequisites` ADD CONSTRAINT `_courseprerequisites_B_fkey` FOREIGN KEY (`B`) REFERENCES `courses`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_facultycourses` ADD CONSTRAINT `_facultycourses_A_fkey` FOREIGN KEY (`A`) REFERENCES `courses`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_facultycourses` ADD CONSTRAINT `_facultycourses_B_fkey` FOREIGN KEY (`B`) REFERENCES `faculties`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_programtocourse` ADD CONSTRAINT `_programtocourse_A_fkey` FOREIGN KEY (`A`) REFERENCES `courses`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_programtocourse` ADD CONSTRAINT `_programtocourse_B_fkey` FOREIGN KEY (`B`) REFERENCES `programs`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

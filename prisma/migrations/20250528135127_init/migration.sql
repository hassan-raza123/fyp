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

    INDEX `Attendances_markedBy_idx`(`markedBy`),
    INDEX `Attendances_sessionId_idx`(`sessionId`),
    INDEX `Attendances_studentSectionId_idx`(`studentSectionId`),
    UNIQUE INDEX `Attendances_studentSectionId_sessionId_key`(`studentSectionId`, `sessionId`),
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

    INDEX `AuditLogs_createdAt_idx`(`createdAt`),
    INDEX `AuditLogs_userId_idx`(`userId`),
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

    UNIQUE INDEX `Courses_code_key`(`code`),
    INDEX `Courses_departmentId_idx`(`departmentId`),
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
    INDEX `Departments_adminId_fkey`(`adminId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `faculties` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `userId` INTEGER NOT NULL,
    `departmentId` INTEGER NOT NULL,
    `designation` VARCHAR(191) NOT NULL,
    `status` ENUM('active', 'inactive') NOT NULL DEFAULT 'active',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `faculties_userId_key`(`userId`),
    INDEX `Faculties_departmentId_fkey`(`departmentId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `notifications` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `userId` INTEGER NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `message` VARCHAR(191) NOT NULL,
    `isRead` BOOLEAN NOT NULL DEFAULT false,
    `type` ENUM('system', 'attendance', 'course', 'announcement', 'alert') NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `Notifications_userId_idx`(`userId`),
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

    UNIQUE INDEX `PasswordResets_token_key`(`token`),
    INDEX `PasswordResets_token_idx`(`token`),
    INDEX `PasswordResets_userId_idx`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `permissions` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Permissions_name_key`(`name`),
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
CREATE TABLE `sections` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `courseOfferingId` INTEGER NOT NULL,
    `facultyId` INTEGER NULL,
    `batchId` VARCHAR(191) NOT NULL,
    `maxStudents` INTEGER NOT NULL,
    `status` ENUM('active', 'inactive', 'suspended', 'deleted') NOT NULL DEFAULT 'active',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `Sections_courseOfferingId_idx`(`courseOfferingId`),
    INDEX `Sections_facultyId_idx`(`facultyId`),
    INDEX `Sections_batchId_idx`(`batchId`),
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
    `status` ENUM('scheduled', 'in_progress', 'completed', 'cancelled', 'postponed') NOT NULL DEFAULT 'scheduled',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `Sessions_sectionId_idx`(`sectionId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `students` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `rollNumber` VARCHAR(191) NOT NULL,
    `status` ENUM('active', 'inactive') NOT NULL DEFAULT 'active',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `userId` INTEGER NOT NULL,
    `departmentId` INTEGER NOT NULL,
    `programId` INTEGER NOT NULL,
    `batchId` VARCHAR(191) NULL,

    UNIQUE INDEX `students_rollNumber_key`(`rollNumber`),
    UNIQUE INDEX `students_userId_key`(`userId`),
    INDEX `Students_departmentId_fkey`(`departmentId`),
    INDEX `Students_programId_fkey`(`programId`),
    INDEX `Students_batchId_fkey`(`batchId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `studentsections` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `studentId` INTEGER NOT NULL,
    `sectionId` INTEGER NOT NULL,
    `enrollmentDate` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `status` ENUM('active', 'inactive', 'suspended', 'deleted') NOT NULL DEFAULT 'active',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `StudentSections_sectionId_idx`(`sectionId`),
    INDEX `StudentSections_studentId_idx`(`studentId`),
    UNIQUE INDEX `StudentSections_studentId_sectionId_key`(`studentId`, `sectionId`),
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
    `status` ENUM('active', 'inactive', 'suspended', 'deleted') NOT NULL DEFAULT 'active',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `TimetableSlots_sectionId_idx`(`sectionId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

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
    `status` ENUM('active', 'inactive') NOT NULL DEFAULT 'active',
    `last_login` DATETIME(3) NULL,
    `email_verified` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Users_username_key`(`username`),
    UNIQUE INDEX `Users_email_key`(`email`),
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
    INDEX `UserRoles_roleId_fkey`(`roleId`),
    INDEX `UserRoles_userId_fkey`(`userId`),
    UNIQUE INDEX `userroles_userId_roleId_key`(`userId`, `roleId`),
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

    INDEX `OTPs_email_userType_idx`(`email`, `userType`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `passwordresettokens` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `userId` INTEGER NOT NULL,
    `token` VARCHAR(191) NOT NULL,
    `expiresAt` DATETIME(3) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `PasswordResetTokens_token_key`(`token`),
    INDEX `PasswordResetTokens_userId_idx`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `batch_sessions` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `batchId` VARCHAR(191) NOT NULL,
    `type` ENUM('morning', 'evening') NOT NULL,
    `dayOfWeek` INTEGER NULL,
    `startTime` TIME(0) NULL,
    `endTime` TIME(0) NULL,
    `roomNumber` VARCHAR(191) NULL,
    `status` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `BatchSessions_batchId_idx`(`batchId`),
    UNIQUE INDEX `BatchSessions_batchId_type_key`(`batchId`, `type`),
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
    INDEX `Batches_programId_fkey`(`programId`),
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
    INDEX `Programs_departmentId_fkey`(`departmentId`),
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

    UNIQUE INDEX `Semesters_name_key`(`name`),
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

    INDEX `CourseOfferings_courseId_idx`(`courseId`),
    INDEX `CourseOfferings_semesterId_idx`(`semesterId`),
    UNIQUE INDEX `CourseOfferings_courseId_semesterId_key`(`courseId`, `semesterId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `plos` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `code` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NOT NULL,
    `programId` INTEGER NOT NULL,
    `bloomLevel` VARCHAR(191) NULL,
    `status` ENUM('active', 'inactive', 'archived') NOT NULL DEFAULT 'active',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `PLOs_programId_idx`(`programId`),
    UNIQUE INDEX `PLOs_code_programId_key`(`code`, `programId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `clos` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `code` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NOT NULL,
    `courseId` INTEGER NOT NULL,
    `bloomLevel` VARCHAR(191) NULL,
    `status` ENUM('active', 'inactive', 'archived') NOT NULL DEFAULT 'active',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `CLOs_courseId_idx`(`courseId`),
    UNIQUE INDEX `CLOs_code_courseId_key`(`code`, `courseId`),
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

    INDEX `CLO_PLO_Mappings_cloId_idx`(`cloId`),
    INDEX `CLO_PLO_Mappings_ploId_idx`(`ploId`),
    UNIQUE INDEX `CLO_PLO_Mappings_cloId_ploId_key`(`cloId`, `ploId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `assessments` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `title` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NULL,
    `type` ENUM('quiz', 'assignment', 'mid_exam', 'final_exam', 'project', 'presentation', 'lab_exam', 'viva') NOT NULL,
    `totalMarks` DOUBLE NOT NULL,
    `weightage` DOUBLE NOT NULL,
    `courseOfferingId` INTEGER NOT NULL,
    `conductedBy` INTEGER NOT NULL,
    `dueDate` DATETIME(3) NULL,
    `instructions` VARCHAR(191) NULL,
    `status` ENUM('active', 'inactive', 'completed', 'cancelled') NOT NULL DEFAULT 'active',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `Assessments_courseOfferingId_idx`(`courseOfferingId`),
    INDEX `Assessments_conductedBy_idx`(`conductedBy`),
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

    INDEX `AssessmentItems_assessmentId_idx`(`assessmentId`),
    INDEX `AssessmentItems_cloId_idx`(`cloId`),
    UNIQUE INDEX `AssessmentItems_assessmentId_questionNo_key`(`assessmentId`, `questionNo`),
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

    INDEX `StudentAssessmentResults_studentId_idx`(`studentId`),
    INDEX `StudentAssessmentResults_assessmentId_idx`(`assessmentId`),
    INDEX `StudentAssessmentResults_evaluatedBy_idx`(`evaluatedBy`),
    UNIQUE INDEX `StudentAssessmentResults_studentId_assessmentId_key`(`studentId`, `assessmentId`),
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

    INDEX `StudentItemResults_studentResult_idx`(`studentAssessmentResultId`),
    INDEX `StudentItemResults_assessmentItem_idx`(`assessmentItemId`),
    UNIQUE INDEX `StudentItemResults_unique`(`studentAssessmentResultId`, `assessmentItemId`),
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

    INDEX `CLOsAttainments_cloId_idx`(`cloId`),
    INDEX `CLOsAttainments_courseOfferingId_idx`(`courseOfferingId`),
    INDEX `CLOsAttainments_calculatedBy_idx`(`calculatedBy`),
    UNIQUE INDEX `CLOsAttainments_cloId_courseOfferingId_key`(`cloId`, `courseOfferingId`),
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

    INDEX `PLOsAttainments_ploId_idx`(`ploId`),
    INDEX `PLOsAttainments_programId_idx`(`programId`),
    INDEX `PLOsAttainments_semesterId_idx`(`semesterId`),
    INDEX `PLOsAttainments_calculatedBy_idx`(`calculatedBy`),
    UNIQUE INDEX `PLOsAttainments_unique`(`ploId`, `programId`, `semesterId`),
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

    INDEX `CourseFeedbacks_studentId_idx`(`studentId`),
    INDEX `CourseFeedbacks_courseOfferingId_idx`(`courseOfferingId`),
    UNIQUE INDEX `CourseFeedbacks_studentId_courseOfferingId_key`(`studentId`, `courseOfferingId`),
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

    INDEX `FacultyFeedbacks_facultyId_idx`(`facultyId`),
    INDEX `FacultyFeedbacks_courseOfferingId_idx`(`courseOfferingId`),
    UNIQUE INDEX `FacultyFeedbacks_facultyId_courseOfferingId_key`(`facultyId`, `courseOfferingId`),
    PRIMARY KEY (`id`)
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

-- CreateTable
CREATE TABLE `_PermissionToRole` (
    `A` INTEGER NOT NULL,
    `B` INTEGER NOT NULL,

    UNIQUE INDEX `_PermissionToRole_AB_unique`(`A`, `B`),
    INDEX `_PermissionToRole_B_index`(`B`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `attendances` ADD CONSTRAINT `Attendances_markedBy_fkey` FOREIGN KEY (`markedBy`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `attendances` ADD CONSTRAINT `Attendances_sessionId_fkey` FOREIGN KEY (`sessionId`) REFERENCES `sessions`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `attendances` ADD CONSTRAINT `Attendances_studentSectionId_fkey` FOREIGN KEY (`studentSectionId`) REFERENCES `studentsections`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `auditlogs` ADD CONSTRAINT `AuditLogs_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `courses` ADD CONSTRAINT `courses_departmentId_fkey` FOREIGN KEY (`departmentId`) REFERENCES `departments`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `departments` ADD CONSTRAINT `departments_adminId_fkey` FOREIGN KEY (`adminId`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `faculties` ADD CONSTRAINT `faculties_departmentId_fkey` FOREIGN KEY (`departmentId`) REFERENCES `departments`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `faculties` ADD CONSTRAINT `faculties_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `notifications` ADD CONSTRAINT `Notifications_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `passwordresets` ADD CONSTRAINT `PasswordResets_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `sections` ADD CONSTRAINT `sections_courseOfferingId_fkey` FOREIGN KEY (`courseOfferingId`) REFERENCES `courseofferings`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `sections` ADD CONSTRAINT `sections_facultyId_fkey` FOREIGN KEY (`facultyId`) REFERENCES `faculties`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `sections` ADD CONSTRAINT `sections_batchId_fkey` FOREIGN KEY (`batchId`) REFERENCES `batches`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `sessions` ADD CONSTRAINT `Sessions_sectionId_fkey` FOREIGN KEY (`sectionId`) REFERENCES `sections`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `students` ADD CONSTRAINT `students_batchId_fkey` FOREIGN KEY (`batchId`) REFERENCES `batches`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `students` ADD CONSTRAINT `students_departmentId_fkey` FOREIGN KEY (`departmentId`) REFERENCES `departments`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `students` ADD CONSTRAINT `students_programId_fkey` FOREIGN KEY (`programId`) REFERENCES `programs`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `students` ADD CONSTRAINT `students_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `studentsections` ADD CONSTRAINT `StudentSections_sectionId_fkey` FOREIGN KEY (`sectionId`) REFERENCES `sections`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `studentsections` ADD CONSTRAINT `StudentSections_studentId_fkey` FOREIGN KEY (`studentId`) REFERENCES `students`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `timetableslots` ADD CONSTRAINT `TimetableSlots_sectionId_fkey` FOREIGN KEY (`sectionId`) REFERENCES `sections`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `userroles` ADD CONSTRAINT `userroles_roleId_fkey` FOREIGN KEY (`roleId`) REFERENCES `roles`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `userroles` ADD CONSTRAINT `userroles_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `passwordresettokens` ADD CONSTRAINT `PasswordResetTokens_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `batch_sessions` ADD CONSTRAINT `batch_sessions_batchId_fkey` FOREIGN KEY (`batchId`) REFERENCES `batches`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `batches` ADD CONSTRAINT `batches_programId_fkey` FOREIGN KEY (`programId`) REFERENCES `programs`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `programs` ADD CONSTRAINT `programs_departmentId_fkey` FOREIGN KEY (`departmentId`) REFERENCES `departments`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `courseofferings` ADD CONSTRAINT `courseofferings_courseId_fkey` FOREIGN KEY (`courseId`) REFERENCES `courses`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `courseofferings` ADD CONSTRAINT `courseofferings_semesterId_fkey` FOREIGN KEY (`semesterId`) REFERENCES `semesters`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `plos` ADD CONSTRAINT `plos_programId_fkey` FOREIGN KEY (`programId`) REFERENCES `programs`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `clos` ADD CONSTRAINT `clos_courseId_fkey` FOREIGN KEY (`courseId`) REFERENCES `courses`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `cloplomappings` ADD CONSTRAINT `cloplomappings_cloId_fkey` FOREIGN KEY (`cloId`) REFERENCES `clos`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `cloplomappings` ADD CONSTRAINT `cloplomappings_ploId_fkey` FOREIGN KEY (`ploId`) REFERENCES `plos`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

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
ALTER TABLE `coursefeedbacks` ADD CONSTRAINT `coursefeedbacks_studentId_fkey` FOREIGN KEY (`studentId`) REFERENCES `students`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `coursefeedbacks` ADD CONSTRAINT `coursefeedbacks_courseOfferingId_fkey` FOREIGN KEY (`courseOfferingId`) REFERENCES `courseofferings`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `facultyfeedbacks` ADD CONSTRAINT `facultyfeedbacks_facultyId_fkey` FOREIGN KEY (`facultyId`) REFERENCES `faculties`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `facultyfeedbacks` ADD CONSTRAINT `facultyfeedbacks_courseOfferingId_fkey` FOREIGN KEY (`courseOfferingId`) REFERENCES `courseofferings`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

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

-- AddForeignKey
ALTER TABLE `_PermissionToRole` ADD CONSTRAINT `_PermissionToRole_A_fkey` FOREIGN KEY (`A`) REFERENCES `permissions`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_PermissionToRole` ADD CONSTRAINT `_PermissionToRole_B_fkey` FOREIGN KEY (`B`) REFERENCES `roles`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

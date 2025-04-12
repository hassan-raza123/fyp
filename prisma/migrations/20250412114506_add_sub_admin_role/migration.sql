-- AlterTable
ALTER TABLE `role` MODIFY `name` ENUM('super_admin', 'sub_admin', 'department_admin', 'child_admin', 'teacher', 'student') NOT NULL;

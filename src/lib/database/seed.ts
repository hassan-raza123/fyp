import { AppDataSource } from './dataSource';
import bcrypt from 'bcryptjs';
import { User, UserStatus } from '../database/entities/User';
import { Role } from '../database/entities/Role';
import { UserRole } from '../database/entities/UserRole';
import { Department, DepartmentStatus } from '../database/entities/Department';
import { Program, ProgramStatus } from '../database/entities/Program';
import { Faculty } from '../database/entities/Faculty';
import { Student } from '../database/entities/Student';
import { Not, IsNull } from 'typeorm';

async function main() {
  try {
    // Initialize database connection
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
      console.log('Database connection established');
    }

    // Get repositories
    const userRepo = AppDataSource.getRepository(User);
    const roleRepo = AppDataSource.getRepository(Role);
    const userRoleRepo = AppDataSource.getRepository(UserRole);
    const departmentRepo = AppDataSource.getRepository(Department);
    const programRepo = AppDataSource.getRepository(Program);
    const facultyRepo = AppDataSource.getRepository(Faculty);
    const studentRepo = AppDataSource.getRepository(Student);

    // Clear existing data in correct order
    await userRoleRepo.delete({ id: Not(IsNull()) });
    await facultyRepo.delete({ id: Not(IsNull()) });
    await studentRepo.delete({ id: Not(IsNull()) });
    await programRepo.delete({ id: Not(IsNull()) });
    await departmentRepo.delete({ id: Not(IsNull()) });
    await userRepo.delete({ id: Not(IsNull()) });
    await roleRepo.delete({ id: Not(IsNull()) });

    const defaultPassword = await bcrypt.hash('11223344', 10);

    // Create roles
    const superAdminRole = roleRepo.create({
      name: 'super_admin',
      description: 'Super Admin Role',
    });
    await roleRepo.save(superAdminRole);

    const subAdminRole = roleRepo.create({
      name: 'sub_admin',
      description: 'Sub Admin Role',
    });
    await roleRepo.save(subAdminRole);

    const departmentAdminRole = roleRepo.create({
      name: 'department_admin',
      description: 'Department Admin Role',
    });
    await roleRepo.save(departmentAdminRole);

    const childAdminRole = roleRepo.create({
      name: 'child_admin',
      description: 'Child Admin Role',
    });
    await roleRepo.save(childAdminRole);

    const teacherRole = roleRepo.create({
      name: 'teacher',
      description: 'Teacher Role',
    });
    await roleRepo.save(teacherRole);

    const studentRole = roleRepo.create({
      name: 'student',
      description: 'Student Role',
    });
    await roleRepo.save(studentRole);

    // Create super admin users with incrementing numbers
    const adminEmails = [
      'itzhassanraza276@gmail.com',
      'itzhassanraza276+1@gmail.com',
      'itzhassanraza276+2@gmail.com',
      'itzhassanraza276+3@gmail.com',
      'itzhassanraza276+4@gmail.com',
    ];

    for (let i = 0; i < adminEmails.length; i++) {
      const admin = userRepo.create({
        email: adminEmails[i],
        username: `admin${i + 1}`,
        password_hash: defaultPassword,
        first_name: 'Super',
        last_name: `Admin ${i + 1}`,
        status: UserStatus.ACTIVE,
        email_verified: true,
      });
      await userRepo.save(admin);

      // Create user role
      const userRole = userRoleRepo.create({
        user: admin,
        role: superAdminRole,
      });
      await userRoleRepo.save(userRole);
    }

    // Create sub admin
    const subAdmin = userRepo.create({
      email: 'sub.admin@university.edu',
      username: 'subadmin',
      password_hash: defaultPassword,
      first_name: 'Sub',
      last_name: 'Admin',
      status: UserStatus.ACTIVE,
      email_verified: true,
    });
    await userRepo.save(subAdmin);

    const subAdminUserRole = userRoleRepo.create({
      user: subAdmin,
      role: subAdminRole,
    });
    await userRoleRepo.save(subAdminUserRole);

    // Create department admin
    const deptAdmin = userRepo.create({
      email: 'dept.admin@university.edu',
      username: 'deptadmin',
      password_hash: defaultPassword,
      first_name: 'Department',
      last_name: 'Admin',
      status: UserStatus.ACTIVE,
      email_verified: true,
    });
    await userRepo.save(deptAdmin);

    const deptAdminUserRole = userRoleRepo.create({
      user: deptAdmin,
      role: departmentAdminRole,
    });
    await userRoleRepo.save(deptAdminUserRole);

    // Create child admin
    const childAdmin = userRepo.create({
      email: 'child.admin@university.edu',
      username: 'childadmin',
      password_hash: defaultPassword,
      first_name: 'Child',
      last_name: 'Admin',
      status: UserStatus.ACTIVE,
      email_verified: true,
    });
    await userRepo.save(childAdmin);

    const childAdminUserRole = userRoleRepo.create({
      user: childAdmin,
      role: childAdminRole,
    });
    await userRoleRepo.save(childAdminUserRole);

    // Create teacher
    const teacher = userRepo.create({
      email: 'teacher@university.edu',
      username: 'teacher',
      password_hash: defaultPassword,
      first_name: 'John',
      last_name: 'Doe',
      status: UserStatus.ACTIVE,
      email_verified: true,
    });
    await userRepo.save(teacher);

    const teacherUserRole = userRoleRepo.create({
      user: teacher,
      role: teacherRole,
    });
    await userRoleRepo.save(teacherUserRole);

    // Create student
    const student = userRepo.create({
      email: 'student@university.edu',
      username: 'student',
      password_hash: defaultPassword,
      first_name: 'Jane',
      last_name: 'Smith',
      status: UserStatus.ACTIVE,
      email_verified: true,
    });
    await userRepo.save(student);

    const studentUserRole = userRoleRepo.create({
      user: student,
      role: studentRole,
    });
    await userRoleRepo.save(studentUserRole);

    // Create a department
    const department = departmentRepo.create({
      name: 'Computer Science',
      code: 'CS',
      status: DepartmentStatus.ACTIVE,
      admin: subAdmin,
    });
    await departmentRepo.save(department);

    // Create a program
    const program = programRepo.create({
      name: 'BS Computer Science',
      code: 'BSCS',
      department: department,
      duration: 4,
      description: 'Bachelor of Science in Computer Science',
      status: ProgramStatus.ACTIVE,
    });
    await programRepo.save(program);

    console.log('Database seeded successfully');
  } catch (error) {
    console.error('Error seeding database:', error);
    throw error;
  } finally {
    // Close the database connection
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
      console.log('Database connection closed');
    }
  }
}

// Run the seeder
main().catch((error) => {
  console.error('Error in seeder:', error);
  process.exit(1);
});

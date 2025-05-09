import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { User } from './entities/User';
import { Department } from './entities/Department';
import { Course } from './entities/Course';
import { Program } from './entities/Program';
import { Faculty } from './entities/Faculty';
import { Student } from './entities/Student';
import { Section } from './entities/Section';
import { Attendance } from './entities/Attendance';
import { Role } from './entities/Role';
import { UserRole } from './entities/UserRole';
import { Notification } from './entities/Notification';
import { AuditLog } from './entities/AuditLog';
import { StudentSection } from './entities/StudentSection';
import { TimeTableSlot } from './entities/TimeTableSlot';
import { Permission } from './entities/Permission';
import { Session } from './entities/Session';
import { PasswordReset } from './entities/PasswordReset';
import { PasswordResetToken } from './entities/PasswordResetToken';

// Default database configuration
const defaultConfig = {
  host: 'localhost',
  port: 3306,
  username: 'root',
  password: 'root',
  database: 'fyp_db',
};

// Get environment variables with fallbacks
const dbConfig = {
  host: process.env.DB_HOST || defaultConfig.host,
  port: parseInt(process.env.DB_PORT || defaultConfig.port.toString()),
  username: process.env.DB_USER || defaultConfig.username,
  password: process.env.DB_PASSWORD || defaultConfig.password,
  database: process.env.DB_NAME || defaultConfig.database,
};

console.log('Database Configuration:', {
  ...dbConfig,
  password: dbConfig.password ? '****' : 'empty',
});

export const AppDataSource = new DataSource({
  type: 'mysql',
  ...dbConfig,
  synchronize: false,
  logging: true,
  entities: [
    User,
    Department,
    Course,
    Program,
    Faculty,
    Student,
    Section,
    Attendance,
    Role,
    UserRole,
    Notification,
    AuditLog,
    StudentSection,
    TimeTableSlot,
    Permission,
    Session,
    PasswordReset,
    PasswordResetToken,
  ],
  migrations: ['src/lib/database/migrations/*.ts'],
  migrationsTableName: 'migrations',
  migrationsRun: true,
  subscribers: ['src/subscribers/*.ts'],
});

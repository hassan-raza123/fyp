import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  OneToOne,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Attendance } from './Attendance';
import { AuditLog } from './AuditLog';
import { Department } from './Department';
import { Faculty } from './Faculty';
import { Notification } from './Notification';
import { PasswordReset } from './PasswordReset';
import { PasswordResetToken } from './PasswordResetToken';
import { Student } from './Student';
import { UserRole } from './UserRole';

export enum UserStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  SUSPENDED = 'suspended',
}

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true, nullable: true })
  username: string;

  @Column({ unique: true })
  email: string;

  @Column()
  password_hash: string;

  @Column({ nullable: true })
  first_name: string;

  @Column({ nullable: true })
  last_name: string;

  @Column({ nullable: true })
  phone_number: string;

  @Column({ nullable: true })
  profile_image: string;

  @Column({
    type: 'enum',
    enum: UserStatus,
    default: UserStatus.ACTIVE,
  })
  status: UserStatus;

  @Column({ nullable: true })
  last_login: Date;

  @Column({ default: false })
  email_verified: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => Attendance, (attendance) => attendance.user)
  attendance: Attendance[];

  @OneToMany(() => AuditLog, (auditLog) => auditLog.user)
  auditlog: AuditLog[];

  @OneToMany(() => UserRole, (userRole) => userRole.user)
  userrole: UserRole[];

  @OneToOne(() => Student, (student) => student.user)
  student: Student;

  @OneToOne(() => Faculty, (faculty) => faculty.user)
  faculty: Faculty;

  @OneToMany(() => Department, (department) => department.admin)
  departmentAdmin: Promise<Department[]>;

  @OneToMany(() => Notification, (notification) => notification.user)
  notifications: Notification[];

  @OneToMany(() => PasswordReset, (passwordReset) => passwordReset.user)
  passwordreset: PasswordReset[];

  @OneToMany(() => PasswordResetToken, (token) => token.users)
  passwordresettoken: PasswordResetToken[];
}

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

  @Column()
  first_name: string;

  @Column()
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

  @OneToMany(() => Department, (department) => department.admin)
  departmentAdmin: Department[];

  @OneToOne(() => Faculty, (faculty) => faculty.user)
  faculty: Faculty;

  @OneToMany(() => Notification, (notification) => notification.user)
  notification: Notification[];

  @OneToMany(() => PasswordReset, (passwordReset) => passwordReset.user)
  passwordreset: PasswordReset[];

  @OneToMany(() => PasswordResetToken, (token) => token.users)
  passwordresettoken: PasswordResetToken[];

  @OneToOne(() => Student, (student) => student.user)
  student: Student;

  @OneToMany(() => UserRole, (userRole) => userRole.user)
  userrole: UserRole[];
}

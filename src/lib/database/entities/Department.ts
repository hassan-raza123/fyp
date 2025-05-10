import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from './User';
import { Course } from './Course';
import { Faculty } from './Faculty';
import { Program } from './Program';
import { Student } from './Student';

export enum DepartmentStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
}

@Entity('departments')
export class Department {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column({ unique: true })
  code: string;

  @Column({ nullable: true })
  description: string;

  @Column({
    type: 'enum',
    enum: DepartmentStatus,
    default: DepartmentStatus.ACTIVE,
  })
  status: DepartmentStatus;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ nullable: true })
  adminId: number;

  @OneToMany(() => Course, (course) => course.department)
  courses: Course[];

  @ManyToOne(() => User)
  admin: User;

  @OneToMany(() => Faculty, (faculty) => faculty.department)
  faculty: Faculty[];

  @OneToMany(() => Program, (program) => program.department)
  programs: Program[];

  @OneToMany(() => Student, (student) => student.department)
  students: Student[];
}

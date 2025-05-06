import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from './User';
import { Course } from './Course';
import { Program } from './Program';
import { Faculty } from './Faculty';
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

  @ManyToOne(() => User, (user) => user.departments)
  admin: User;

  @OneToMany(() => Course, (course) => course.department)
  courses: Course[];

  @OneToMany(() => Program, (program) => program.department)
  programs: Program[];

  @OneToMany(() => Faculty, (faculty) => faculty.department)
  faculty: Faculty[];

  @OneToMany(() => Student, (student) => student.department)
  students: Student[];
}

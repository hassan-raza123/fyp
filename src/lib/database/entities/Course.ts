import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  ManyToMany,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Department } from './Department';
import { Section } from './Section';
import { Faculty } from './Faculty';
import { Program } from './Program';

export enum CourseStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  ARCHIVED = 'archived',
}

export enum CourseType {
  THEORY = 'THEORY',
  LAB = 'LAB',
  PROJECT = 'PROJECT',
  THESIS = 'THESIS',
}

@Entity('course')
export class Course {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  code: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  description: string;

  @Column()
  creditHours: number;

  @Column({
    type: 'enum',
    enum: CourseStatus,
    default: CourseStatus.ACTIVE,
  })
  status: CourseStatus;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column()
  departmentId: number;

  @Column()
  labHours: number;

  @Column()
  theoryHours: number;

  @Column({
    type: 'enum',
    enum: CourseType,
  })
  type: CourseType;

  @ManyToOne(() => Department, (department) => department.courses)
  department: Department;

  @OneToMany(() => Section, (section) => section.course)
  sections: Section[];

  @ManyToMany(() => Course, (course) => course.course_B)
  course_A: Course[];

  @ManyToMany(() => Course, (course) => course.course_A)
  course_B: Course[];

  @ManyToMany(() => Faculty, (faculty) => faculty.course)
  faculty: Faculty[];

  @ManyToMany(() => Program, (program) => program.course)
  programs: Program[];
}

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  ManyToMany,
  CreateDateColumn,
  UpdateDateColumn,
  JoinTable,
} from 'typeorm';
import { Department } from './Department';
import { Faculty } from './Faculty';
import { Section } from './Section';
import { Program } from './Program';

export enum CourseStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
}

@Entity('courses')
export class Course {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column({ unique: true })
  code: string;

  @Column({ nullable: true })
  description: string;

  @Column('int')
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

  @ManyToOne(() => Department, (department) => department.courses)
  department: Department;

  @ManyToMany(() => Faculty, (faculty) => faculty.courses)
  @JoinTable()
  faculty: Faculty[];

  @OneToMany(() => Section, (section) => section.course)
  sections: Section[];

  @ManyToMany(() => Program, (program) => program.courses)
  @JoinTable()
  programs: Program[];
}

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToOne,
  ManyToOne,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToMany,
  JoinTable,
} from 'typeorm';
import { User } from './User';
import { Department } from './Department';
import { Section } from './Section';
import { Course } from './Course';

export enum FacultyStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  ON_LEAVE = 'on_leave',
}

@Entity('faculty')
export class Faculty {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  designation: string;

  @Column({
    type: 'enum',
    enum: FacultyStatus,
    default: FacultyStatus.ACTIVE,
  })
  status: FacultyStatus;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToOne(() => User, (user) => user.faculty)
  user: User;

  @ManyToOne(() => Department, (department) => department.faculty)
  department: Department;

  @OneToMany(() => Section, (section) => section.faculty)
  sections: Section[];

  @ManyToMany(() => Course, (course) => course.faculty)
  @JoinTable()
  courses: Course[];
}

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  OneToOne,
  ManyToMany,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Department } from './Department';
import { User } from './User';
import { Section } from './Section';
import { Course } from './Course';

export enum FacultyStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
}

@Entity('faculty')
export class Faculty {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  userId: number;

  @Column()
  departmentId: number;

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

  @ManyToOne(() => Department, (department) => department.faculty)
  department: Department;

  @OneToOne(() => User, (user) => user.faculty)
  user: User;

  @OneToMany(() => Section, (section) => section.faculty)
  sections: Section[];

  @ManyToMany(() => Course, (course) => course.faculty)
  course: Course[];
}

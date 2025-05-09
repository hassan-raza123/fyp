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
  JoinColumn,
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

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @Column({ name: 'user_id' })
  userId: number;

  @OneToOne(() => User, (user) => user.faculty)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'department_id', nullable: true })
  departmentId: number;

  @ManyToOne(() => Department, (department) => department.faculty)
  @JoinColumn({ name: 'department_id' })
  department: Department;

  @OneToMany(() => Section, (section) => section.faculty)
  sections: Section[];

  @ManyToMany(() => Course, (course) => course.faculty)
  @JoinTable()
  courses: Course[];
}

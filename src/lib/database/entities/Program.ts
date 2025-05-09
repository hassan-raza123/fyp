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
import { Student } from './Student';
import { Course } from './Course';

export enum ProgramStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
}

@Entity('programs')
export class Program {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column({ unique: true })
  code: string;

  @Column({ nullable: true })
  description: string;

  @Column()
  duration: number;

  @Column({
    type: 'enum',
    enum: ProgramStatus,
    default: ProgramStatus.ACTIVE,
  })
  status: ProgramStatus;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column()
  departmentId: number;

  @Column({ default: 0 })
  totalCreditHours: number;

  @ManyToOne(() => Department, (department) => department.programs)
  department: Department;

  @OneToMany(() => Student, (student) => student.program)
  students: Student[];

  @ManyToMany(() => Course, (course) => course.programs)
  course: Course[];
}

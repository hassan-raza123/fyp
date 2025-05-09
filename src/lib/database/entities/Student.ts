import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  OneToOne,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Department } from './Department';
import { Program } from './Program';
import { User } from './User';
import { StudentSection } from './StudentSection';

export enum StudentStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
}

@Entity('students')
export class Student {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  rollNumber: string;

  @Column({
    type: 'enum',
    enum: StudentStatus,
    default: StudentStatus.ACTIVE,
  })
  status: StudentStatus;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column()
  userId: number;

  @Column()
  departmentId: number;

  @Column()
  programId: number;

  @ManyToOne(() => Department, (department) => department.students)
  department: Department;

  @ManyToOne(() => Program, (program) => program.students)
  program: Program;

  @OneToOne(() => User, (user) => user.student)
  user: User;

  @OneToMany(() => StudentSection, (studentSection) => studentSection.student)
  studentsection: StudentSection[];
}

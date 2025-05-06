import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Student } from './Student';
import { Section } from './Section';

export enum StudentSectionStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  DROPPED = 'dropped',
}

@Entity('student_sections')
export class StudentSection {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({
    type: 'enum',
    enum: StudentSectionStatus,
    default: StudentSectionStatus.ACTIVE,
  })
  status: StudentSectionStatus;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => Student, (student) => student.studentSections)
  student: Student;

  @ManyToOne(() => Section, (section) => section.studentSections)
  section: Section;
}

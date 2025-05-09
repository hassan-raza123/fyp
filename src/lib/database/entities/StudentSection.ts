import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Student } from './Student';
import { Section } from './Section';
import { Attendance } from './Attendance';

export enum StudentSectionStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  SUSPENDED = 'suspended',
  DELETED = 'deleted',
}

@Entity('studentsection')
export class StudentSection {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  studentId: number;

  @Column()
  sectionId: number;

  @Column()
  enrollmentDate: Date;

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

  @OneToMany(() => Attendance, (attendance) => attendance.studentSection)
  attendance: Attendance[];

  @ManyToOne(() => Section, (section) => section.studentsection)
  section: Section;

  @ManyToOne(() => Student, (student) => student.studentsection)
  student: Student;
}

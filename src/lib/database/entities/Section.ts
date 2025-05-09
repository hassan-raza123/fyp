import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Course } from './Course';
import { Faculty } from './Faculty';
import { Session } from './Session';
import { StudentSection } from './StudentSection';
import { TimeTableSlot } from './TimeTableSlot';

export enum SectionStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  SUSPENDED = 'suspended',
  DELETED = 'deleted',
}

@Entity('section')
export class Section {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column()
  courseId: number;

  @Column({ nullable: true })
  facultyId: number;

  @Column()
  semester: number;

  @Column()
  maxStudents: number;

  @Column({
    type: 'enum',
    enum: SectionStatus,
    default: SectionStatus.ACTIVE,
  })
  status: SectionStatus;

  @Column()
  startDate: Date;

  @Column()
  endDate: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => Course, (course) => course.sections)
  course: Course;

  @ManyToOne(() => Faculty, (faculty) => faculty.sections)
  faculty: Faculty;

  @OneToMany(() => Session, (session) => session.section)
  session: Session[];

  @OneToMany(() => StudentSection, (studentSection) => studentSection.section)
  studentsection: StudentSection[];

  @OneToMany(() => TimeTableSlot, (timeTableSlot) => timeTableSlot.section)
  timetableslot: TimeTableSlot[];
}

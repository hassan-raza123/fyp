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
import { StudentSection } from './StudentSection';
import { Session } from './Session';

export enum SectionStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
}

@Entity('sections')
export class Section {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column({ unique: true })
  code: string;

  @Column({
    type: 'enum',
    enum: SectionStatus,
    default: SectionStatus.ACTIVE,
  })
  status: SectionStatus;

  @Column({ type: 'int' })
  capacity: number;

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => Course, (course) => course.sections)
  course: Course;

  @ManyToOne(() => Faculty, (faculty) => faculty.sections)
  faculty: Faculty;

  @OneToMany(() => StudentSection, (studentSection) => studentSection.section)
  studentSections: StudentSection[];

  @OneToMany(() => Session, (session) => session.section)
  sessions: Session[];
}

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from './User';
import { Session } from './Session';
import { StudentSection } from './StudentSection';

export enum AttendanceStatus {
  PRESENT = 'present',
  ABSENT = 'absent',
  LATE = 'late',
  LEAVE = 'leave',
  EXCUSED = 'excused',
}

@Entity('attendance')
export class Attendance {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  studentSectionId: number;

  @Column()
  sessionId: number;

  @Column({
    type: 'enum',
    enum: AttendanceStatus,
  })
  status: AttendanceStatus;

  @Column()
  markedBy: number;

  @Column({ nullable: true })
  remarks: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => User, (user) => user.attendance)
  user: User;

  @ManyToOne(() => Session, (session) => session.attendance)
  session: Session;

  @ManyToOne(
    () => StudentSection,
    (studentSection) => studentSection.attendance
  )
  studentSection: StudentSection;
}

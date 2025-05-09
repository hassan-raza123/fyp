import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Section } from './Section';

export enum TimeTableSlotStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  SUSPENDED = 'suspended',
  DELETED = 'deleted',
}

@Entity('timetableslot')
export class TimeTableSlot {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  sectionId: number;

  @Column()
  dayOfWeek: number;

  @Column({ type: 'time' })
  startTime: Date;

  @Column({ type: 'time' })
  endTime: Date;

  @Column({ nullable: true })
  roomNumber: string;

  @Column({
    type: 'enum',
    enum: TimeTableSlotStatus,
    default: TimeTableSlotStatus.ACTIVE,
  })
  status: TimeTableSlotStatus;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => Section, (section) => section.timetableslot)
  section: Section;
}

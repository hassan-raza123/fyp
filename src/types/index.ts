export interface Program {
  id: number;
  name: string;
  code: string;
  departmentId: number;
  totalCreditHours: number;
  duration: number;
  status: 'active' | 'inactive' | 'archived';
  description?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Student {
  id: number;
  userId: number;
  rollNumber: string;
  departmentId: number;
  programId: number;
  batchId?: number | null;
  status: 'active' | 'inactive';
  createdAt: Date;
  updatedAt: Date;
}

export interface Batch {
  id: string;
  name: string;
  code: string;
  startDate: Date;
  endDate: Date;
  maxStudents: number;
  description?: string | null;
  status: BatchStatus;
  createdAt: Date;
  updatedAt: Date;
  programId: number;
  program?: Program;
  students?: Student[];
  _count?: {
    students: number;
  };
}

export type BatchStatus = 'active' | 'inactive' | 'completed' | 'upcoming';

export interface BatchWithStats extends Batch {
  studentCount: number;
}

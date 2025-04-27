export interface Department {
  id: number;
  name: string;
  code: string;
  description?: string;
  status: 'active' | 'inactive' | 'archived';
  hod?: {
    id: number;
    name: string;
    email: string;
  };
  totalPrograms: number;
  totalTeachers: number;
  totalStudents: number;
}

export interface DepartmentFormData {
  name: string;
  code: string;
  description?: string;
  status: 'active' | 'inactive';
  adminId?: number;
}

export interface DepartmentAdmin {
  id: number;
  name: string;
  email: string;
  isHead: boolean;
}

export interface DepartmentDetails extends Department {
  programs: {
    id: number;
    name: string;
    code: string;
    status: string;
  }[];
  faculty: {
    id: number;
    user: {
      id: number;
      first_name: string;
      last_name: string;
      email: string;
    };
    designation: string;
    status: string;
  }[];
  student: {
    id: number;
    user: {
      id: number;
      first_name: string;
      last_name: string;
      email: string;
    };
    rollNumber: string;
    batch: string;
    status: string;
  }[];
}

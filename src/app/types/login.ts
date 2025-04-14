// Refined type definitions
export type BaseUserType = 'student' | 'teacher' | 'admin';
export type AdminRole = 'super_admin' | 'sub_admin' | 'department_admin' | 'child_admin';
export type AllRoles = BaseUserType | AdminRole;

// Student specific data
export interface StudentData {
  rollNumber: string;
  departmentId: string;
  programId: string;
  batch: string;
}

// Teacher specific data
export interface TeacherData {
  employeeId: string;
  departmentId: string;
  designation: string;
}

// Base user data
export interface BaseUserData {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: AllRoles;
}

// Combined user data type
export type UserData = BaseUserData & Partial<StudentData & TeacherData>;

// API response types
export interface LoginSuccess {
  success: true;
  message: string;
  data: {
    user: UserData;
    redirectTo: string;
    token: string;
    userType: AllRoles;
  };
}

export interface LoginError {
  success: false;
  message: string;
  errors?: Array<{ field: string; message: string }>;
}

export type LoginResponse = LoginSuccess | LoginError;

export type ValidationErrors = { [key: string]: string };

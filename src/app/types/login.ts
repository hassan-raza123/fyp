// Refined type definitions
export type BaseUserType = 'student' | 'faculty' | 'admin';
export type AdminRole = 'admin';
export type AllRoles = 'student' | 'faculty' | 'admin';

// Student specific data
export interface StudentData {
  rollNumber: string;
  departmentId: string;
  programId: string;
  batch: string;
}

// Faculty specific data
export interface FacultyData {
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
export type UserData = BaseUserData & Partial<StudentData & FacultyData>;

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

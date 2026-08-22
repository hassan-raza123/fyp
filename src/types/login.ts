// Refined type definitions
export type BaseUserType = 'student' | 'faculty' | 'admin';
export type AdminRole = 'admin' | 'super_admin';
export type AllRoles = 'student' | 'faculty' | 'admin' | 'super_admin';

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
    /**
     * Only present on the OTP-challenge response. The success response sets
     * the session as an httpOnly cookie and never puts the token in the body,
     * so this cannot be required.
     */
    token?: string;
    userType: AllRoles;
    /**
     * Set when the sign-in completed without an OTP challenge and the client
     * should navigate straight to `redirectTo`.
     *
     * `/api/auth/login` has always returned this; it was simply missing from
     * the type, which is why every read of `data` in LoginForm went through
     * `(data as any)` — four casts that switched off type checking on the
     * whole response object to reach one undeclared boolean.
     */
    shouldRedirect?: boolean;
  };
}

export interface LoginError {
  success: false;
  message: string;
  errors?: Array<{ field: string; message: string }>;
}

export type LoginResponse = LoginSuccess | LoginError;

export type ValidationErrors = { [key: string]: string };

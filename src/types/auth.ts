export type BaseUserType = 'student' | 'teacher' | 'admin' | 'department_admin';
export type AdminRole =
  | 'super_admin'
  | 'sub_admin'
  | 'department_admin'
  | 'child_admin';
export type AllRoles = BaseUserType | AdminRole;

export interface IUser {
  id: number;
  email: string;
  first_name: string | null;
  last_name: string | null;
  password_hash: string;
  phone_number: string | null;
  status: 'active' | 'inactive' | 'suspended';
  email_verified: boolean;
  last_login: Date | null;
}

export interface IStudent {
  id: number;
  userId: number;
  rollNumber: string;
  departmentId: number;
  programId: number;
  status: 'active' | 'inactive';
}

export interface IFaculty {
  id: number;
  userId: number;
  departmentId: number;
  designation: string;
  status: 'active' | 'inactive';
}

export interface IRole {
  id: number;
  name: AllRoles;
  description: string | null;
}

export interface IUserRole {
  id: number;
  userId: number;
  roleId: number;
  role: IRole;
}

export interface UserWithRoles extends IUser {
  userrole?: IUserRole;
  student?: IStudent | null;
  faculty?: IFaculty | null;
}

export interface LoginRequest {
  email: string;
  password: string;
  userType: AllRoles;
}

export interface UserData {
  id: number;
  email: string;
  firstName: string | null;
  lastName: string | null;
  role: AllRoles;
  rollNumber?: string;
  departmentId?: number;
  programId?: number;
  designation?: string;
}

export interface TokenPayload {
  userId: number;
  email: string;
  role: string;
  userData: UserData;
}

export interface LoginResponse {
  success: boolean;
  message: string;
  data?: {
    user: UserData;
    redirectTo: string;
    token: string;
    userType: AllRoles;
  };
  errors?: Array<{
    field: string;
    message: string;
  }>;
}

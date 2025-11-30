/**
 * Role-based default password generator
 * Each role has a unique, secure, and memorable default password
 */

export type UserRole = 'super_admin' | 'admin' | 'faculty' | 'student';

/**
 * Get default password for a specific role
 * Passwords are:
 * - Unique per role
 * - Secure (mix of uppercase, lowercase, numbers, special chars)
 * - Easy to remember (pattern-based)
 * - Consistent (same password for same role)
 */
export function getDefaultPassword(role: UserRole): string {
  const passwords: Record<UserRole, string> = {
    super_admin: 'SuperAdmin@2025',
    admin: 'DeptAdmin@2025',
    faculty: 'Faculty@2025',
    student: 'Student@2025',
  };

  return passwords[role] || 'User@2025';
}

/**
 * Get default password for a role name (string)
 * Useful when role comes from database as string
 */
export function getDefaultPasswordByRoleName(roleName: string): string {
  const normalizedRole = roleName.toLowerCase().replace('-', '_') as UserRole;
  return getDefaultPassword(normalizedRole);
}


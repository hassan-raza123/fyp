import { randomInt } from 'crypto';

/**
 * Password generation for newly created and admin-reset accounts.
 *
 * There is deliberately no per-role default password. A shared constant such as
 * `Student@2025` means every imported account has the same credential, it lives
 * in source control, and it was displayed in the admin UI — so knowing one
 * user's email was enough to sign in as them. Every account now gets its own
 * random password, and `must_change_password` forces the user to replace it
 * before they can use the system.
 */

export type UserRole = 'super_admin' | 'admin' | 'faculty' | 'student';

// Ambiguous characters (0/O, 1/l/I) are excluded so a password read off a
// screen or a printout is not mistyped.
const UPPER = 'ABCDEFGHJKMNPQRSTUVWXYZ';
const LOWER = 'abcdefghijkmnpqrstuvwxyz';
const DIGITS = '23456789';
const SYMBOLS = '!@#$%&*?';

const ALL = UPPER + LOWER + DIGITS + SYMBOLS;

function pick(source: string): string {
  return source[randomInt(0, source.length)];
}

/**
 * Generate a cryptographically random temporary password.
 *
 * Guaranteed to contain at least one character from each class so it satisfies
 * common password policies.
 */
export function generateTemporaryPassword(length = 14): string {
  const size = length < 8 ? 8 : length;

  const required = [pick(UPPER), pick(LOWER), pick(DIGITS), pick(SYMBOLS)];
  const rest = Array.from({ length: size - required.length }, () => pick(ALL));
  const chars = [...required, ...rest];

  // Fisher-Yates with a CSPRNG, so the required characters are not always first
  for (let i = chars.length - 1; i > 0; i--) {
    const j = randomInt(0, i + 1);
    [chars[i], chars[j]] = [chars[j], chars[i]];
  }

  return chars.join('');
}

export interface PasswordStrengthResult {
  valid: boolean;
  errors: string[];
}

/**
 * Validate a user-chosen password.
 *
 * Applied wherever a user sets their own password, so the forced change cannot
 * be satisfied with something trivial.
 */
export function validatePasswordStrength(
  password: string
): PasswordStrengthResult {
  const errors: string[] = [];

  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }
  if (password.length > 128) {
    errors.push('Password must be at most 128 characters long');
  }
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain an uppercase letter');
  }
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain a lowercase letter');
  }
  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain a number');
  }

  // Reject the retired shared defaults outright, in case any are still in use
  const retired = [
    'superadmin@2025',
    'deptadmin@2025',
    'faculty@2025',
    'student@2025',
    'user@2025',
  ];
  if (retired.includes(password.toLowerCase())) {
    errors.push('This password is not allowed. Please choose a different one.');
  }

  return { valid: errors.length === 0, errors };
}

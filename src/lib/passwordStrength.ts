/**
 * Password rules shared by sign-up, the in-modal password reset and the
 * /auth/reset-password page, so every place that sets a password asks
 * for the same strength.
 */
export type PasswordStrength = {
  length: boolean;
  uppercase: boolean;
  lowercase: boolean;
  digit: boolean;
  special: boolean;
};

export const PASSWORD_RULES: ReadonlyArray<[keyof PasswordStrength, string]> = [
  ["length", "At least 8 characters"],
  ["uppercase", "At least one uppercase letter (A-Z)"],
  ["lowercase", "At least one lowercase letter (a-z)"],
  ["digit", "At least one number (0-9)"],
  ["special", "At least one special character (e.g. @$!%*?&)"],
];

export const getPasswordStrength = (pass: string): PasswordStrength => ({
  length: pass.length >= 8,
  uppercase: /[A-Z]/.test(pass),
  lowercase: /[a-z]/.test(pass),
  digit: /\d/.test(pass),
  special: /[@$!%*?&_#^+=()[\]{}|;:',.<>/?~-]/.test(pass),
});

export const isStrongPassword = (pass: string): boolean =>
  Object.values(getPasswordStrength(pass)).every(Boolean);

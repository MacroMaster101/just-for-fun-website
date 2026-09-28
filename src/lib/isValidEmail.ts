// Domain labels can't contain dots, so each `.` has exactly one way to
// match. This keeps the check linear-time — the old
// `^[^\s@]+@[^\s@]+\.[^\s@]+$` backtracked polynomially (ReDoS) on long
// inputs full of dots.
const EMAIL_PATTERN = /^[^\s@]+@[^\s@.]+(?:\.[^\s@.]+)+$/;

/** Basic "looks like an email" check shared by client and server. */
export const isValidEmail = (value: string): boolean =>
  value.length <= 254 && EMAIL_PATTERN.test(value);

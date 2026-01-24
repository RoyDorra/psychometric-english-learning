const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateEmail(email: string): string | null {
  if (!email.trim()) return "אנא הזינו אימייל";
  if (!EMAIL_REGEX.test(email.trim())) return "אימייל לא תקין";
  return null;
}

export function validatePassword(password: string): string | null {
  if (password.length < 8) return "סיסמה חייבת להיות לפחות 8 תווים";
  if (!/[A-Za-z]/.test(password) || !/[0-9]/.test(password)) {
    return "סיסמה חייבת לכלול לפחות אות אנגלית אחת ומספר אחד";
  }
  return null;
}

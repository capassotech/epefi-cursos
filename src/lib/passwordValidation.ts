/**
 * Validación unificada de contraseña (registro, reset desde enlace, etc.)
 */
export const PASSWORD_MIN_LENGTH = 8;

/** Misma clase de caracteres especiales que Firebase / registro histórico */
const SPECIAL_CHAR_REGEX = /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/;

export type PasswordRequirementChecks = {
  minLength: boolean;
  hasUppercase: boolean;
  hasNumber: boolean;
  hasSpecialChar: boolean;
};

export function getPasswordRequirements(
  password: string
): PasswordRequirementChecks {
  return {
    minLength: password.length >= PASSWORD_MIN_LENGTH,
    hasUppercase: /[A-Z]/.test(password),
    hasNumber: /\d/.test(password),
    hasSpecialChar: SPECIAL_CHAR_REGEX.test(password),
  };
}

export function isPasswordValid(password: string): boolean {
  const r = getPasswordRequirements(password);
  return r.minLength && r.hasUppercase && r.hasNumber && r.hasSpecialChar;
}

/** Mensajes faltantes en orden fijo (para listas y texto bajo el campo). */
export function getPasswordValidationErrors(password: string): string[] {
  const r = getPasswordRequirements(password);
  const errors: string[] = [];
  if (!r.minLength) {
    errors.push(`Al menos ${PASSWORD_MIN_LENGTH} caracteres`);
  }
  if (!r.hasUppercase) {
    errors.push("Al menos una letra mayúscula");
  }
  if (!r.hasNumber) {
    errors.push("Al menos un número");
  }
  if (!r.hasSpecialChar) {
    errors.push("Al menos un carácter especial (!@#$%^&*…)");
  }
  return errors;
}

export function validatePassword(password: string): {
  valid: boolean;
  errors: string[];
} {
  if (!password) {
    return { valid: false, errors: ["La contraseña es requerida"] };
  }
  const errors = getPasswordValidationErrors(password);
  return { valid: errors.length === 0, errors };
}

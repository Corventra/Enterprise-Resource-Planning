/**
 * Validasi sederhana untuk input controller. Throw `ValidationError`
 * supaya error handler bisa map ke 400.
 */

class ValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = 'ValidationError';
    this.status = 400;
  }
}

const EMAIL_RE = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;

const requireString = (value, fieldName, { min = 1, max = 255 } = {}) => {
  if (typeof value !== 'string') {
    throw new ValidationError(`${fieldName} harus berupa string.`);
  }
  const trimmed = value.trim();
  if (trimmed.length < min) {
    throw new ValidationError(`${fieldName} minimal ${min} karakter.`);
  }
  if (trimmed.length > max) {
    throw new ValidationError(`${fieldName} maksimal ${max} karakter.`);
  }
  return trimmed;
};

const requireEmail = (value, fieldName = 'email') => {
  const trimmed = requireString(value, fieldName, { min: 5, max: 190 });
  if (!EMAIL_RE.test(trimmed)) {
    throw new ValidationError(`${fieldName} tidak valid.`);
  }
  return trimmed.toLowerCase();
};

const requirePassword = (value, fieldName = 'password') => {
  if (typeof value !== 'string' || value.length < 6) {
    throw new ValidationError(`${fieldName} minimal 6 karakter.`);
  }
  if (value.length > 128) {
    throw new ValidationError(`${fieldName} maksimal 128 karakter.`);
  }
  return value;
};

const optionalArray = (value, fieldName, validator = (v) => v) => {
  if (value === undefined || value === null) return undefined;
  if (!Array.isArray(value)) {
    throw new ValidationError(`${fieldName} harus berupa array.`);
  }
  return value.map(validator);
};

module.exports = {
  ValidationError,
  requireString,
  requireEmail,
  requirePassword,
  optionalArray
};

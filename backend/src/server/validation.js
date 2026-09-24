export class ApiError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

export const isObject = (value) => value !== null && typeof value === "object" && !Array.isArray(value);

export function requiredString(value, field, max = 255) {
  if (typeof value !== "string" || !value.trim() || value.trim().length > max) {
    throw new ApiError(400, `Campo inválido: ${field}`);
  }
  return value.trim();
}

export function positiveInteger(value, field) {
  const number = Number(value);
  if (!Number.isSafeInteger(number) || number < 1) throw new ApiError(400, `Campo inválido: ${field}`);
  return number;
}

export function nonNegativeInteger(value, field) {
  const number = Number(value);
  if (!Number.isSafeInteger(number) || number < 0) throw new ApiError(400, `Campo inválido: ${field}`);
  return number;
}

export function validPrice(value, field = "price") {
  const number = Number(value);
  if (!Number.isFinite(number) || number < 0 || Math.round(number * 100) !== number * 100) {
    throw new ApiError(400, `Campo inválido: ${field}`);
  }
  return number;
}

export function validEmail(value) {
  const email = requiredString(value, "email", 254).toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new ApiError(400, "Correo electrónico inválido");
  return email;
}

export function parseId(value, field = "id") {
  const id = Number(value);
  if (!Number.isSafeInteger(id) || id < 1) throw new ApiError(400, `Identificador inválido: ${field}`);
  return id;
}

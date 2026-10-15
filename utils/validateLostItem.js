import { Ok, Err } from "./result.js";

const requiredFields = {
  title: { min: 3, max: 100 },
  description: { min: 1, max: 1000 },
  category: { min: 1, max: 50 },
  location: { min: 1, max: 150 },
};

const optionalFields = {
  color: 50,
  brand: 80,
  contactInfo: 150,
};

export const validateLostItem = (input) => {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    return Err("Invalid item data");
  }

  const data = {};

  for (const [field, limits] of Object.entries(requiredFields)) {
    const value = input[field];

    if (typeof value !== "string" || !value.trim()) {
      return Err(`${field} is required`);
    }

    const trimmed = value.trim();

    if (trimmed.length < limits.min || trimmed.length > limits.max) {
      return Err(
        `${field} must be between ${limits.min} and ${limits.max} characters`
      );
    }

    data[field] = trimmed;
  }

  // dateLost
  if (
    typeof input.dateLost !== "string" ||
    !/^\d{4}-\d{2}-\d{2}$/.test(input.dateLost)
  ) {
    return Err("dateLost must be a valid date in YYYY-MM-DD format");
  }

  const date = new Date(`${input.dateLost}T00:00:00.000Z`);

  if (
    Number.isNaN(date.getTime()) ||
    date.toISOString().slice(0, 10) !== input.dateLost
  ) {
    return Err("dateLost must be a valid date in YYYY-MM-DD format");
  }

  const today = new Date().toISOString().slice(0, 10);

  if (input.dateLost > today) {
    return Err("dateLost cannot be in the future");
  }

  data.dateLost = date;

  // Optional string fields
  for (const [field, max] of Object.entries(optionalFields)) {
    const value = input[field];

    if (value === undefined) {
      data[field] = "";
      continue;
    }

    if (typeof value !== "string") {
      return Err(`${field} must be a string`);
    }

    const trimmed = value.trim();

    if (trimmed.length > max) {
      return Err(`${field} must be at most ${max} characters`);
    }

    data[field] = trimmed;
  }

  return Ok(data);
};

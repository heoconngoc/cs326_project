import {
  insertLostItem,
  findAllLostItems,
  findLostItemById,
  updateLostItemById,
  removeLostItemById,
} from "../repositories/lostItemsRepository.js";

import { validateLostItem } from "../utils/validateLostItem.js";
import { Ok, Err } from "../utils/result.js";

const isValidId = (id) =>
  typeof id === "string" && /^[0-9a-fA-F]{24}$/.test(id);

const editableFields = [
  "title",
  "description",
  "category",
  "location",
  "dateLost",
  "color",
  "brand",
];

export const createLostItem = async (input) => {
  const validation = validateLostItem(input);

  if (!validation.ok) {
    return validation;
  }

  const item = await insertLostItem(validation.value);
  return Ok(item);
};

export const getAllLostItems = async () => {
  return await findAllLostItems();
};

export const getLostItemById = async (id) => {
  if (!isValidId(id)) {
    return Err("Invalid item ID");
  }

  const item = await findLostItemById(id);

  if (!item) {
    return Err("Item not found");
  }

  return Ok(item);
};

export const updateLostItem = async (id, updates) => {
  if (!isValidId(id)) {
    return Err("Invalid item ID");
  }

  if (
    !updates ||
    typeof updates !== "object" ||
    Array.isArray(updates)
  ) {
    return Err("Invalid update data");
  }

  const fields = Object.keys(updates);

  if (
    fields.length === 0 ||
    fields.some((field) => !editableFields.includes(field))
  ) {
    return Err("Invalid update fields");
  }

  const existing = await findLostItemById(id);

  if (!existing) {
    return Err("Item not found");
  }

  const merged = {
    title: existing.title,
    description: existing.description,
    category: existing.category,
    location: existing.location,
    dateLost: existing.dateLost.toISOString().slice(0, 10),
    color: existing.color ?? "",
    brand: existing.brand ?? "",
    contactInfo: existing.contactInfo ?? "",
  };

  for (const field of fields) {
    merged[field] = updates[field];
  }

  const validation = validateLostItem(merged);

  if (!validation.ok) {
    return validation;
  }

  const safeUpdates = {};

  for (const field of fields) {
    safeUpdates[field] = validation.value[field];
  }

  const updated = await updateLostItemById(id, safeUpdates);

  if (!updated) {
    return Err("Item not found");
  }

  return Ok(updated);
};

export const deleteLostItem = async (id) => {
  if (!isValidId(id)) {
    return Err("Invalid item ID");
  }

  const removed = await removeLostItemById(id);

  if (!removed) {
    return Err("Item not found");
  }

  return Ok(removed);
};

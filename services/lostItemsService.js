import { insertLostItem, findAllLostItems, } from "../repositories/lostItemsRepository.js";
import { validateLostItem } from "../utils/validateLostItem.js";
import { Ok } from "../utils/result.js";

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

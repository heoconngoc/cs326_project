import LostItem from "../models/LostItem.js";

export const insertLostItem = async (itemData) => {
  return await LostItem.create(itemData);
};

export const findAllLostItems = async () => {
  return await LostItem.find().sort({ createAt: -1 });
};

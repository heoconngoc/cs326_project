import LostItem from "../models/LostItem.js";

export const insertLostItem = async (itemData) => {
  return await LostItem.create(itemData);
};

export const findAllLostItems = async () => {
  return await LostItem.find().sort({ createdAt: -1 });
};

export const findLostItemById = async (id) => {
  return await LostItem.findById(id);
};

export const updateLostItemById = async (id, updates) => {
  return await LostItem.findByIdAndUpdate(id, updates, {
    new: true,
    runValidators: true,
  });
};

export const removeLostItemById = async (id) => {
  return await LostItem.findByIdAndDelete(id);
};

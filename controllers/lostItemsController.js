import {
  createLostItem,
  getAllLostItems,
} from "../services/lostItemsService.js";
import { CATEGORY_SUGGESTIONS } from "../constants/categories.js";

const todayISO = () => new Date().toISOString().slice(0, 10);

const toPublicItem = (item) => ({
  id: String(item._id),
  title: item.title,
  description: item.description,
  category: item.category,
  location: item.location,
  dateLost: item.dateLost.toISOString().slice(0, 10),
  color: item.color,
  brand: item.brand,
  status: item.status,
  createdAt: item.createdAt.toISOString(),
});

export const showHomePage = (req, res) => {
  res.render("index", { title: "Home", active: "home" });
};

export const showLostItemsPage = async (req, res) => {
  const items = await getAllLostItems();

  res.render("lost-items/index", {
    title: "Lost Items",
    active: "lost-items",
    items: items.map(toPublicItem),
  });
};

export const showNewLostItemForm = (req, res) => {
  res.render("lost-items/new", {
    title: "Report a Lost Item",
    active: "new",
    categories: CATEGORY_SUGGESTIONS,
    today: todayISO(),
  });
};

export const submitLostItemForm = async (req, res) => {
  const result = await createLostItem(req.body);

  if (!result.ok) {
    return res
      .status(400)
      .render("fragments/form-error", { message: result.error });
  }

  res
    .status(201)
    .render("fragments/form-success", { item: toPublicItem(result.value) });
};

export const createLostItemApi = async (req, res) => {
  const result = await createLostItem(req.body);

  if (!result.ok) {
    return res.status(400).json({ success: false, error: result.error });
  }

  res.status(201).json({ success: true, data: toPublicItem(result.value) });
};

export const listLostItemsApi = async (req, res) => {
  const items = await getAllLostItems();

  res.status(200).json({ success: true, data: items.map(toPublicItem) });
};

import {
  createLostItem,
  getAllLostItems,
  getLostItemById,
  updateLostItem,
  deleteLostItem,
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

const resultStatus = (error) =>
  error === "Item not found" ? 404 : 400;

const sendResultError = (res, result) =>
  res.status(resultStatus(result.error)).json({
    success: false,
    error: result.error,
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
    created: req.query.created === "1",
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


export const getLostItemApi = async (req, res) => {
  const result = await getLostItemById(req.params.id);

  if (!result.ok) {
    return sendResultError(res, result);
  }

  res.status(200).json({
    success: true,
    data: toPublicItem(result.value),
  });
};

export const updateLostItemApi = async (req, res) => {
  const result = await updateLostItem(req.params.id, req.body);

  if (!result.ok) {
    return sendResultError(res, result);
  }

  res.status(200).json({
    success: true,
    data: toPublicItem(result.value),
  });
};

export const deleteLostItemApi = async (req, res) => {
  const result = await deleteLostItem(req.params.id);

  if (!result.ok) {
    return sendResultError(res, result);
  }

  res.status(200).json({
    success: true,
    message: "Item deleted successfully",
  });
};

export const showLostItemDetails = async (req, res) => {
  const result = await getLostItemById(req.params.id);

  if (!result.ok) {
    const status = resultStatus(result.error);

    return res.status(status).render("error", {
      title: "Error",
      active: "",
      status,
      message: result.error,
    });
  }

  res.render("lost-items/show", {
    title: "Item Details",
    active: "lost-items",
    item: toPublicItem(result.value),
    today: todayISO(),
    categories: CATEGORY_SUGGESTIONS,
  });
};

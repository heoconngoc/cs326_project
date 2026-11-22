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

const resultStatus = (error) => {
  if (error === "Authentication required") return 401;
  if (error === "Forbidden") return 403;
  if (error === "Item not found") return 404;
  return 400;
};

// Plain-language text for the fragments people read.
const friendlyError = (error) =>
  error === "Forbidden"
    ? "You can only change or delete items you reported."
    : error;

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
    deleted: req.query.deleted === "1",
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
  const result = await createLostItem(req.body, req.user);

  if (!result.ok) {
    return res
      .status(resultStatus(result.error))
      .render("fragments/form-error", { message: result.error });
  }

  res
    .status(201)
    .render("fragments/form-success", { item: toPublicItem(result.value) });
};

export const createLostItemApi = async (req, res) => {
  const result = await createLostItem(req.body, req.user);

  if (!result.ok) {
    return sendResultError(res, result);
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
  const result = await updateLostItem(req.params.id, req.body, req.user);

  if (!result.ok) {
    return sendResultError(res, result);
  }

  res.status(200).json({
    success: true,
    data: toPublicItem(result.value),
  });
};

export const deleteLostItemApi = async (req, res) => {
  const result = await deleteLostItem(req.params.id, req.user);

  if (!result.ok) {
    return sendResultError(res, result);
  }

  res.status(200).json({
    success: true,
    message: "Item deleted successfully",
  });
};

export const submitLostItemEdit = async (req, res) => {
  const result = await updateLostItem(req.params.id, req.body, req.user);

  if (!result.ok) {
    return res
      .status(resultStatus(result.error))
      .render("fragments/form-error", {
        heading: "We couldn't save your changes.",
        message: friendlyError(result.error),
      });
  }

  res.render("fragments/item-updated", {
    item: toPublicItem(result.value),
    categories: CATEGORY_SUGGESTIONS,
    today: todayISO(),
  });
};

export const submitLostItemDelete = async (req, res) => {
  const result = await deleteLostItem(req.params.id, req.user);

  if (!result.ok) {
    return res
      .status(resultStatus(result.error))
      .render("fragments/form-error", {
        heading: "We couldn't delete this report.",
        message: friendlyError(result.error),
      });
  }

  res
    .set("HX-Redirect", "/lost-items?deleted=1")
    .render("fragments/item-deleted");
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

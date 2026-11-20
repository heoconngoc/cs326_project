import { Router } from "express";
import {
  showHomePage,
  showLostItemsPage,
  showNewLostItemForm,
  showLostItemDetails,
  submitLostItemForm,
  submitLostItemEdit,
  submitLostItemDelete,
  createLostItemApi,
  listLostItemsApi,
  getLostItemApi,
  updateLostItemApi,
  deleteLostItemApi,
} from "../controllers/lostItemsController.js";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { requireLogin } from "../middleware/requireLogin.js";

export const pageRouter = Router();

pageRouter.get("/", showHomePage);
pageRouter.get("/lost-items", asyncHandler(showLostItemsPage));

// "/lost-items/new" must stay above "/lost-items/:id", or "new" is read as an id.
pageRouter.get("/lost-items/new", requireLogin, showNewLostItemForm);
pageRouter.post(
  "/lost-items",
  requireLogin,
  asyncHandler(submitLostItemForm)
);
pageRouter.get("/lost-items/:id", asyncHandler(showLostItemDetails));
pageRouter.patch(
  "/lost-items/:id",
  requireLogin,
  asyncHandler(submitLostItemEdit)
);
pageRouter.delete(
  "/lost-items/:id",
  requireLogin,
  asyncHandler(submitLostItemDelete)
);

export const apiRouter = Router();

apiRouter.get("/", asyncHandler(listLostItemsApi));
apiRouter.post("/", requireLogin, asyncHandler(createLostItemApi));
apiRouter.get("/:id", asyncHandler(getLostItemApi));
apiRouter.patch("/:id", requireLogin, asyncHandler(updateLostItemApi));
apiRouter.delete("/:id", requireLogin, asyncHandler(deleteLostItemApi));


import { Router } from "express";
import {
  showHomePage,
  showLostItemsPage,
  showNewLostItemForm,
  showLostItemDetails,
  createLostItemApi,
  listLostItemsApi,
  getLostItemApi,
  updateLostItemApi,
  deleteLostItemApi,
} from "../controllers/lostItemsController.js";
import { asyncHandler } from "../middleware/asyncHandler.js";

export const pageRouter = Router();

pageRouter.get("/", showHomePage);
pageRouter.get("/lost-items", asyncHandler(showLostItemsPage));
pageRouter.get("/lost-items/new", showNewLostItemForm);
pageRouter.get("/lost-items/:id", asyncHandler(showLostItemDetails));

export const apiRouter = Router();

apiRouter.get("/", asyncHandler(listLostItemsApi));
apiRouter.post("/", asyncHandler(createLostItemApi));
apiRouter.get("/:id", asyncHandler(getLostItemApi));
apiRouter.patch("/:id", asyncHandler(updateLostItemApi));
apiRouter.delete("/:id", asyncHandler(deleteLostItemApi));

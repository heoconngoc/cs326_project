import { Router } from "express";
import {
  showHomePage,
  showLostItemsPage,
  showNewLostItemForm,
  submitLostItemForm,
  createLostItemApi,
  listLostItemsApi,
} from "../controllers/lostItemsController.js";
import { asyncHandler } from "../middleware/asyncHandler.js";

export const pageRouter = Router();

pageRouter.get("/", showHomePage);
pageRouter.get("/lost-items", asyncHandler(showLostItemsPage));
pageRouter.get("/lost-items/new", showNewLostItemForm);
pageRouter.post("/lost-items", asyncHandler(submitLostItemForm));

export const apiRouter = Router();

apiRouter.get("/", asyncHandler(listLostItemsApi));
apiRouter.post("/", asyncHandler(createLostItemApi));

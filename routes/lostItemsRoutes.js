import { Router } from "express";
import {
  showHomePage,
  showLostItemsPage,
  showNewLostItemForm,
  createLostItemApi,
  listLostItemsApi,
} from "../controllers/lostItemsController.js";

export const pageRouter = Router();

pageRouter.get("/", showHomePage);
pageRouter.get("/lost-items", showLostItemsPage);
pageRouter.get("/lost-items/new", showNewLostItemForm);

export const apiRouter = Router();

apiRouter.get("/", listLostItemsApi);
apiRouter.post("/", createLostItemApi);

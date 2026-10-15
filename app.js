import path from "node:path";
import { fileURLToPath } from "node:url";
import express from "express";
import { pageRouter, apiRouter } from "./routes/lostItemsRoutes.js";
import { notFoundHandler, errorHandler } from "./middleware/errorHandler.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, "public")));

app.use("/api/lost-items", apiRouter);
app.use("/", pageRouter);
app.use(notFoundHandler);
app.use(errorHandler);

export default app;

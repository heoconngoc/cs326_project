import path from "node:path";
import { fileURLToPath } from "node:url";
import express from "express";
import { pageRouter, apiRouter } from "./routes/lostItemsRoutes.js";
import { notFoundHandler, errorHandler } from "./middleware/errorHandler.js";
import { createSessionMiddleware } from "./config/session.js";
import { attachUser } from "./middleware/attachUser.js";
import authRouter from "./routes/authRoutes.js";
import authPagesRouter from "./routes/authPagesRoutes.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, "public")));
app.use(
  "/vendor/htmx",
  express.static(path.join(__dirname, "node_modules/htmx.org/dist")),
);
app.use(createSessionMiddleware());
app.use(attachUser);

app.get("/health", (req, res) => {
  res.status(200).json({
    status: "ok",
  });
});

app.use("/auth", authRouter);
app.use("/", authPagesRouter);
app.use("/api/lost-items", apiRouter);
app.use("/", pageRouter);
app.use(notFoundHandler);
app.use(errorHandler);

export default app;

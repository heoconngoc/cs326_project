const wantsJson = (req) =>
  req.originalUrl.startsWith("/api/") ||
  req.accepts(["html", "json"]) === "json";

const isHtmxRequest = (req) => req.get("HX-Request") === "true";

// When no route matched.
export const notFoundHandler = (req, res) => {
  res.status(404);

  if (isHtmxRequest(req)) {
    return res.render("fragments/form-error", { message: "Not found" });
  }

  if (wantsJson(req)) {
    return res.json({ success: false, error: "Not found" });
  }

  res.render("error", {
    title: "Page not found",
    active: "",
    status: 404,
    message: "We couldn't find the page you were looking for.",
  });
};

export const errorHandler = (err, req, res, next) => {
  if (res.headersSent) {
    return next(err);
  }

  const isClientError = err.status >= 400 && err.status < 500;
  const status = isClientError ? err.status : 500;

  if (!isClientError) {
    console.error(err);
  }

  const message = isClientError
    ? status === 400 && err.type === "entity.parse.failed"
      ? "Invalid JSON in request body"
      : err.message
    : "Something went wrong";

  res.status(status);

  if (isHtmxRequest(req)) {
    return res.render("fragments/form-error", { message });
  }

  if (wantsJson(req)) {
    return res.json({ success: false, error: message });
  }

  res.render("error", {
    title: "Error",
    active: "",
    status,
    message,
  });
};

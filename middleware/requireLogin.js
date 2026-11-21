const isHtmxRequest = (req) => req.get("HX-Request") === "true";

export const requireLogin = (req, res, next) => {
  if (req.user) {
    return next();
  }

  if (isHtmxRequest(req)) {
    return res.status(401).render("fragments/form-error", {
      heading: "Please log in first.",
      message: "You need to log in to do that.",
      linkHref: "/login",
      linkText: "Log in",
    });
  }

  const isPageRequest =
    req.method === "GET" &&
    !req.originalUrl.startsWith("/api/") &&
    req.accepts(["json", "html"]) === "html";

  if (isPageRequest) {
    return res.redirect("/login");
  }

  return res.status(401).json({
    error: "Authentication required",
  });
};

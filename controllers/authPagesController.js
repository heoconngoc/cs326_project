// Pages for the auth forms. The forms post to the JSON-first /auth endpoints
// (see authController.js), which answer HTMX requests with HTML fragments.

// A logged-in user has nothing to do on these pages, so send them to the list.
export const showLoginPage = (req, res) => {
  if (req.user) {
    return res.redirect("/lost-items");
  }

  res.render("auth/login", { title: "Log in", active: "login" });
};

export const showSignupPage = (req, res) => {
  if (req.user) {
    return res.redirect("/lost-items");
  }

  res.render("auth/signup", { title: "Sign up", active: "signup" });
};

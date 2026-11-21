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

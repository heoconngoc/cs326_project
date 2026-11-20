import * as authService from "../services/authService.js";

// The login and signup pages send their forms with HTMX. For those requests the
// answer is an HTML fragment (or an HX-Redirect header). Every other caller,
// such as curl or the API tests, still gets the JSON described in the contract.
const isHtmxRequest = (req) => req.get("HX-Request") === "true";

const sendResultError = (req, res, result, heading) => {
  const { status, message } = result.error;

  if (isHtmxRequest(req)) {
    return res.status(status).render("fragments/form-error", { heading, message });
  }

  return res.status(status).json({
    error: message,
  });
};

const startSession = (req, userId)=> new Promise((resolve, reject) => {
  req.session.regenerate((error) => {
    if(error) return reject(error);

    req.session.userId = userId;

    req.session.save((error) => {
      if(error) return reject(error);
      resolve();
    });
  });
});

export const signup = async (req, res) => {
  const result = await authService.signup(
    req.body.email,
    req.body.password
  );

  if(!result.ok){
    return sendResultError(req, res, result, "We couldn't create your account.");
  }

  if (isHtmxRequest(req)) {
    return res
      .status(201)
      .render("fragments/signup-success", { email: result.value.email });
  }

  return res.status(201).json(result.value);
};

export const login = async (req, res) => {
  const result = await authService.login(
    req.body.email,
    req.body.password
  );

  if (!result.ok){
    return sendResultError(req, res, result, "We couldn't log you in.");
  }

  await startSession(req, result.value.id);

  if (isHtmxRequest(req)) {
    // htmx follows HX-Redirect, so the next page already shows the user's nav.
    return res.set("HX-Redirect", "/lost-items").render("fragments/login-success");
  }

  return res.status(200).json(result.value);
};

export const logout = async (req, res) => {
  await new Promise((resolve, reject) => {
    req.session.destroy((error) => {
      if(error) return reject(error);
      resolve();
    });
  });

  res.clearCookie("cs326.sid");

  if (isHtmxRequest(req)) {
    return res.set("HX-Redirect", "/").status(200).end();
  }

  return res.status(200).json({
    message: "Logged our successfully",
  });
};

export const me = (req, res) => {
  if(!req.user){
    return res.status(401).json({
      error: "Authentication required",
    });
  }

  return res.status(200).json(req.user);
};

import * as authService from "../services/authService.js";

const sendResultError = (res, result) => {
  return res.status(result.error.status).json({
    error: result.error.message,
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
    return sendResultError(res, result);
  }

  return res.status(201).json(result.value);
};

export const login = async (req, res) => {
  const result = await authService.login(
    req.body.email,
    req.body.password
  );

  if (!result.ok){
    return sendResultError(res, result);
  }

  await startSession(req, result.value.id);

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

import User from "../models/User.js";

export const insertUser = async ({ email, passwordHash}) => {
  return User.create({
    email,
    passwordHash,
    role: "user",
  });
};

export const findUserByEmail = async (email) => {
  return User.findOne({ email }).select("+passwordHash");
};

export const findUserById = async (id) => {
  return User.findById(id);
};

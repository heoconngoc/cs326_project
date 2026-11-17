import bcrypt from "bcrypt";
import { Ok, Err } from "../utils/result.js";
import { insertUser, findUserByEmail } from "../repositories/usersRepository.js";
import { toUserDto } from "../dtos/userDto.js";

const SALT_ROUNDS = 12;

const authError = (status, message) =>
  Err({ status, message });

export const signup = async (email, password) => {
  if(typeof email !== "string" || typeof password !== "string"){
    return authError(400, "Invalid email or password");
  }

  const cleanEmail = email.trim().toLowerCase();

  if(
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail) ||
    cleanEmail.length > 254
  ) {
    return authError(400, "Invalid email address");
  }

  if(password.length < 8 || password.length > 72){
    return authError(400, "Password must be between 8 and 72 characters");
  }

  const existingUser = await findUserByEmail(cleanEmail);

  if(existingUser){
    return authError(409, "Email already registered");
  }

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

  try {
    const user = await insertUser({
      email: cleanEmail,
      passwordHash,
    });

    return Ok(toUserDto(user));
  } catch(err){
    if (error.code === 11000) {
      return authError(409, "Email already registered");
    }

    throw error;
  }
};

export const login = async (email, password) => {
  if(typeof email !== "string" || typeof password !== "string"){
    return authError(400, "Invalid email or password");
  }

  const cleanEmail = email.trim().toLowerCase();

  const user = await findUserByEmail(cleanEmail);

  if(!user){
    return authError(401, "Invalid email or password");
  }

  const result = await bcrypt.compare(password, user.passwordHash);

  if(!result){
    return authError(401, "Invalid email or password");
  }

  return Ok(toPublicUser(user));
};

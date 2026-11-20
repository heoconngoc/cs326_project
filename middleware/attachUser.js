import { findUserById } from "../repositories/usersRepository.js";
import { toUserDto } from "../dtos/userDto.js";

export const attachUser = async (req, res, next) => {
  try {
    const userId = req.session?.userId;

    if (!userId) {
      return next();
    }

    const user = await findUserById(userId);

    if (user) {
      req.user = toUserDto(user);
      res.locals.user = req.user;
    }

    next();
  } catch (error) {
    next(error);
  }
};

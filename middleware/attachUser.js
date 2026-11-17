import { toUserDto } from "../dtos/userDto.js"
import { findLostItemById } from "../repositories/lostItemsRepository.js";

export const attachUser = async (req, res, next) => {
  try {
    const userId = req.session?.userId;

    if(!userId){
      return next();
    }

    const user = await findLostItemById(userId);

    if(user){
      req.user = toUserDto(user);
      res.locals.user = req.user;
    }

    next();
  } catch(error) {
    next(error);
  }
};

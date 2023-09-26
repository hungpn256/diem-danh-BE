import jwt from "jsonwebtoken";
import { keys } from "../config/key.js";
import { UserModel } from "../model/user.js";

export const requireSignin = async (req, res, next) => {
  try {
    if (req.headers.authorization) {
      const token = req.headers.authorization.split(" ")[1];
      const userId = jwt.verify(token, keys.jwt.secret)?._id;
      const user = await UserModel.findById(userId).populate("device");
      delete user.password;
      req.user = user;
    } else {
      return res.status(401).json({ message: "Authorization required" });
    }
    next();
  } catch {
    return res.status(401).json({ message: "Authorization required" });
  }
};

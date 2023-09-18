import jwt from "jsonwebtoken";

export const requireSignin = (req, res, next) => {
  if (req.headers.Authorization) {
    const token = req.headers.Authorization.split(" ")[1];
    const user = jwt.verify(token, keys.jwt.secret);
    req.user = user;
  } else {
    return res.status(401).json({ message: "Authorization required" });
  }
  next();
};

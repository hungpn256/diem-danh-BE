import express from "express";
import { UserModel } from "../model/user.js";
import { keys } from "../config/key.js";
import { requireSignin } from "../helper/login.js";

const { secret, tokenLife } = keys.jwt;
const userRouter = express.Router();

userRouter.post("/register", async (req, res) => {
  try {
    const { email, phoneNumber, password, name, role } = req.body;
    console.log(
      "🚀 ~ file: user.js:11 ~ userRouter.post ~ { email, phoneNumber, password, name, role }:",
      { email, phoneNumber, password, name, role }
    );
    const existedUser = await UserModel.findOne({ email: email });
    console.log("existedUser", existedUser);
    if (existedUser) {
      return res.status(400).json({ error: "Người dùng đã tồn tại" });
    }

    const user = new UserModel({
      email,
      password,
      phoneNumber,
      name,
      role,
    });
    await user.save();
    console.log("======");
    return res.status(201).json({
      success: true,
    });
  } catch (e) {
    console.log(e);
    return res.status(400).json({ error: "Người dùng đã tồn tại" });
  }
});

userRouter.post("/login", async (req, res) => {
  const { email, password } = req.body;
  const user = await UserModel.findOne({ email });
  bcrypt.compare(password, user.password).then((isMatch) => {
    if (isMatch) {
      const payload = {
        _id: user._id,
        role: user.role,
      };

      jwt.sign(payload, secret, { expiresIn: tokenLife }, (err, token) => {
        res.status(200).json({
          success: true,
          token: `Bearer ${token}`,
          user: {
            _id: user._id,
            email: user.email,
            phoneNumber: user.phoneNumber,
            name: user.name,
          },
        });
      });
    } else {
      res.status(401).json({
        success: false,
        error: "Sai mật khẩu",
      });
    }
  });
});

userRouter.get("/profile", requireSignin, async (req, res) => {
  const user = req.user;
  try {
    const _user = await UserModel.findOne({ _id: user._id });
    if (!_user)
      return res.status(401).json({
        success: false,
        message: "User doesn't exist.",
      });
    else {
      return res.status(200).json({
        success: true,
        user: {
          _id: _user._id,
          email: _user.email,
          phoneNumber: _user.phoneNumber,
          name: _user.name,
        },
      });
    }
  } catch {
    return res.status(401).json({
      success: false,
      message: "User doesn't exist.",
    });
  }
});

userRouter.post("/create-password", requireSignin, async (req, res) => {
  const { email, role } = req.body;
  if (role === "admin") {
    const user = await UserModel.findOne({ email });
    const newPass = `000000${Math.round(Math.random() * 999999)}`.slice(-6);
    if (user) {
      user.password = newPass;
      await user.save();
      return res.status(200).json({
        email,
        password: newPass,
      });
    }
  }
  return res.status(400);
});

userRouter.get("/get-user-managed", requireSignin, async (req, res) => {
  const user = req.user;
  try {
    const users = await UserModel.find({ managedBy: user._id });
    res.status(200).json({ users });
  } catch {
    return res.status(401).json({
      success: false,
      message: "Người dùng không tồn tại",
    });
  }
});

export { userRouter };

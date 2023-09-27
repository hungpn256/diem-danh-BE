import express from "express";
import { UserModel } from "../model/user.js";
import { keys } from "../config/key.js";
import { requireAdminSignin, requireSignin } from "../helper/login.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { DeviceModel } from "../model/device.js";

const { secret, tokenLife } = keys.jwt;
const userRouter = express.Router();

userRouter.post("/register", async (req, res) => {
  try {
    const { email, phoneNumber, password, name } = req.body;
    const existedUser = await UserModel.findOne({ email: email });
    console.log("existedUser", existedUser);
    if (existedUser) {
      return res.status(400).json({ error: "Email người dùng đã tồn tại" });
    }
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(password, salt);

    const user = new UserModel({
      email,
      password: hash,
      phoneNumber,
      name,
      role: "admin",
    });
    await user.save();
    return res.status(201).json({
      success: true,
    });
  } catch (e) {
    console.log(e);
    return res.status(400).json({ error: "Người dùng đã tồn tại" });
  }
});

userRouter.post("/add-user", requireAdminSignin, async (req, res) => {
  try {
    const { email, phoneNumber, password, name, role, currentSalary } =
      req.body;
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
      managedBy: req.user?.managedBy?._id,
      currentSalary,
    });
    await user.save();
    return res.status(201).json({
      success: true,
    });
  } catch (e) {
    console.log(e);
    return res.status(400).json({ error: "Đã xảy ra lỗi" });
  }
});

userRouter.post("/login", async (req, res) => {
  try {
    const { email, password, deviceUniqueId, deviceName } = req.body;
    const user = await UserModel.findOne({ email });
    bcrypt.compare(password, user.password).then((isMatch) => {
      if (isMatch) {
        const payload = {
          _id: user._id,
          role: user.role,
        };

        jwt.sign(
          payload,
          secret,
          { expiresIn: tokenLife },
          async (err, token) => {
            if (user.role === "user") {
              if (deviceUniqueId && deviceName) {
                const device = new DeviceModel({
                  deviceUniqueId,
                  name: deviceName,
                });
                await device.save();
                user.device = device._id;
                await user.save();
              } else {
                return res.status(401).json({
                  success: false,
                  error: "Không thể cập nhật thông tin thiết bị",
                });
              }
            }
            delete user.password;
            return res.status(200).json({
              success: true,
              token: `Bearer ${token}`,
              user,
            });
          }
        );
      } else {
        return res.status(401).json({
          success: false,
          error: "Không tìm thấy người dùng",
        });
      }
    });
  } catch (err) {
    return res.status(401).json({
      success: false,
      error: "Không tìm thấy người dùng",
    });
  }
});

userRouter.get("/profile", requireSignin, async (req, res) => {
  const user = req.user;
  try {
    const _user = await UserModel.findOne({ _id: user._id });
    if (!_user) {
      return res.status(401).json({
        success: false,
        error: "Không tìm thấy người dùng",
      });
    } else {
      delete _user.password;
      return res.status(200).json({
        success: true,
        user: _user,
      });
    }
  } catch {
    return res.status(401).json({
      success: false,
      error: "User doesn't exist.",
    });
  }
});

userRouter.post("/create-password", requireAdminSignin, async (req, res) => {
  const { email } = req.body;
  const user = await UserModel.findOne({ email });
  const newPass = `000000${Math.round(Math.random() * 999999)}`.slice(-6);
  if (user) {
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(newPass, salt);
    user.password = hash;
    await user.save();
    return res.status(200).json({
      email,
      password: newPass,
      _id: user._id,
    });
  }
  return res.status(400).json({
    error: "Người dùng không tồn tại",
  });
});

userRouter.get("/get-user-managed", requireAdminSignin, async (req, res) => {
  try {
    const txtSearch = req.query.txtSearch;
    const user = req.user;
    const users = await UserModel.find({
      managedBy: user.managedBy?._id,
      role: "user",
      $or: [
        { email: { $regex: txtSearch || "", $options: "i" } },
        { name: { $regex: txtSearch || "", $options: "i" } },
      ],
    });
    res.status(200).json({ users });
  } catch {
    return res.status(401).json({
      success: false,
      error: "Người dùng không tồn tại",
    });
  }
});

userRouter.put("/:id", requireAdminSignin, async (req, res) => {
  const user = req.user;
  const idUserEdit = req.params.id;
  const body = req.body;
  try {
    const userEdit = await UserModel.findOne({ _id: idUserEdit });
    userEdit.name = body.name;
    userEdit.phoneNumber = body.phoneNumber;
    userEdit.currentSalary = body.currentSalary;
    await userEdit.save();
    delete userEdit.password;
    res.status(200).json({ user: userEdit });
  } catch {
    return res.status(401).json({
      success: false,
      error: "Người dùng không tồn tại",
    });
  }
});

export { userRouter };

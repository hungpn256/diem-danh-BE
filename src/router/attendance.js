import express from "express";
import { requireSignin } from "../helper/login.js";
import { UserModel } from "../model/user.js";

const attendanceRouter = express.Router();

attendanceRouter.post("/create-token", requireSignin, async (req, res) => {
  try {
    const userId = req.user?._id;
    const user = await UserModel.findById(userId);
    const token = `000000${Math.round(Math.random() * 999999)}`.slice(-6);
    user.tokenCheckIn = token;
    await user.save();
    return res.status(200).json({
      token,
    });
  } catch (error) {
    return res.status(401).json({ message: "Lỗi tạo token" });
  }
});

export { attendanceRouter };

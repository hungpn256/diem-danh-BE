import express from "express";
import { requireSignin } from "../helper/login.js";
import { UserModel } from "../model/user.js";
import { LeaveRequestModel } from "../model/leaveRequest.js";
import { AttendanceModel } from "../model/attendance.js";
import moment from "moment";
import { ruleAttendance } from "../helper/ruleAttendance.js";

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

attendanceRouter.post("/attendance", requireSignin, async (req, res) => {
  try {
    const userId = req.user?._id;
    const { userManagerId, token } = req.body;
    const userManager = await UserModel.findOne({
      _id: userManagerId,
      tokenCheckIn: token,
    });
    if (!userManager) {
      return res.status(401).json({ message: "Token hết hạn" });
    }
    const attendanceExist = await AttendanceModel.findOne({
      userId: userId,
      date: { $gte: moment().startOf("date") },
    });
    if (attendanceExist) {
      attendanceExist.checkOutTime = moment().toDate();
      await attendanceExist.save();
    } else {
      const attendance = new AttendanceModel({
        userId,
        date: moment().startOf("date"),
        checkInTime: moment(),
        latePenalty: moment()
          .startOf("day")
          .set("minute", ruleAttendance.morning.startHour * 60)
          .startOf("minute")
          .diff(moment(), "minute"),
      });
      await attendance.save();
      return res.status(200).json({ attendance });
    }
  } catch (error) {
    return res.status(401).json({ message: "Lỗi tạo token" });
  }
});

attendanceRouter.post("/additional-work", requireSignin, async (req, res) => {
  try {
    const user = req.user;
    const body = req.body;
    const leaveRequest = new LeaveRequestModel({
      ...body,
      status: "PENDING",
      userId: user._id,
    });
    await leaveRequest.save();
    res.status(200).json({ leaveRequest });
  } catch (error) {
    return res.status(401).json({ message: "Lỗi tạo phiếu" });
  }
});

export { attendanceRouter };

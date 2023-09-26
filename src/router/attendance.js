import express from "express";
import { requireSignin } from "../helper/login.js";
import { UserModel } from "../model/user.js";
import { LeaveRequestModel } from "../model/leaveRequest.js";
import { AttendanceModel } from "../model/attendance.js";
import moment from "moment";
import { getTimeByHour, ruleAttendance } from "../helper/ruleAttendance.js";

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
      attendanceExist.checkOutTime = moment().set("hour", 15).toDate();
      if (
        moment(attendanceExist.checkOutTime).isAfter(
          getTimeByHour(
            (ruleAttendance.morning.startHour +
              ruleAttendance.morning.endHour) /
              2
          )
        ) &&
        moment(attendanceExist.checkInTime).isBefore(
          getTimeByHour(
            (ruleAttendance.morning.startHour +
              ruleAttendance.morning.endHour) /
              2
          )
        ) &&
        moment(attendanceExist.checkOutTime).diff(
          moment(attendanceExist.checkInTime),
          "hour"
        ) >
          (ruleAttendance.morning.startHour - ruleAttendance.morning.endHour) /
            2
      ) {
        attendanceExist.workSession = (
          parseInt("10", 2) | parseInt(attendanceExist.workSession, 2)
        ).toString(2);
      }
      console.log(
        getTimeByHour(
          (ruleAttendance.afternoon.startHour +
            ruleAttendance.afternoon.endHour) /
            2
        ),
        moment(attendanceExist.checkInTime),
        moment(attendanceExist.checkInTime).isBefore(
          getTimeByHour(
            (ruleAttendance.afternoon.startHour +
              ruleAttendance.afternoon.endHour) /
              2
          )
        )
      );
      if (
        moment(attendanceExist.checkOutTime).isAfter(
          getTimeByHour(
            (ruleAttendance.afternoon.startHour +
              ruleAttendance.afternoon.endHour) /
              2
          )
        ) &&
        moment(attendanceExist.checkInTime).isBefore(
          getTimeByHour(
            (ruleAttendance.afternoon.startHour +
              ruleAttendance.afternoon.endHour) /
              2
          )
        ) &&
        moment(attendanceExist.checkOutTime).diff(
          moment(attendanceExist.checkInTime),
          "hour"
        ) >
          (ruleAttendance.afternoon.startHour -
            ruleAttendance.afternoon.endHour) /
            2
      ) {
        attendanceExist.workSession = (
          parseInt("01", 2) | parseInt(attendanceExist.workSession, 2)
        ).toString(2);
      }
      await attendanceExist.save();
      return res.status(200).json({ attendance: attendanceExist });
    } else {
      const attendance = new AttendanceModel({
        userId,
        date: moment().startOf("date"),
        checkInTime: moment(),
        latePenalty: -getTimeByHour(ruleAttendance.morning.startHour).diff(
          moment(),
          "minute"
        ),
      });
      await attendance.save();
      return res.status(200).json({ attendance });
    }
  } catch (error) {
    console.log(
      "🚀 ~ file: attendance.js:125 ~ attendanceRouter.post ~ error:",
      error
    );
    return res.status(401).json({ message: "Đã xay ra lỗi" });
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
    console.log(
      "🚀 ~ file: attendance.js:148 ~ attendanceRouter.post ~ error:",
      error
    );
    return res.status(401).json({ message: "Lỗi tạo phiếu" });
  }
});

attendanceRouter.get("/", requireSignin, async (req, res) => {
  try {
    const user = req.user;
    const { from, to, userId } = req.query;
    const attendances = await AttendanceModel.find({
      userId: userId || user._id,
      date: {
        $gte: new Date(from),
        $lte: new Date(to),
      },
    });
    return res.status(200).json({ attendances });
  } catch (error) {
    console.log(
      "🚀 ~ file: attendance.js:165 ~ attendanceRouter.get ~ error:",
      error
    );
    return res.status(401).json({ message: "Có lỗi xảy ra" });
  }
});

export { attendanceRouter };

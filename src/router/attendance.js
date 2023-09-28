import express from "express";
import { requireAdminSignin, requireSignin } from "../helper/login.js";
import { UserModel } from "../model/user.js";
import { LeaveRequestModel } from "../model/leaveRequest.js";
import { AttendanceModel } from "../model/attendance.js";
import moment from "moment";
import { getTimeByHour, ruleAttendance } from "../helper/ruleAttendance.js";
import { CompanyModel } from "../model/company.js";

const attendanceRouter = express.Router();

attendanceRouter.post("/create-token", requireAdminSignin, async (req, res) => {
  try {
    const token = `000000${Math.round(Math.random() * 999999)}`.slice(-6);
    const company = await CompanyModel.findByIdAndUpdate(
      req.user?.managedBy?._id,
      { tokenCheckIn: token }
    );
    await company.save();
    return res.status(200).json({
      token,
    });
  } catch (error) {
    return res.status(401).json({ error: "Lỗi tạo token" });
  }
});

attendanceRouter.post("/attendance", requireSignin, async (req, res) => {
  try {
    const userId = req.user?._id;
    const device = req.user?.device;
    const { companyId, token, deviceUniqueId } = req.body;
    const company = await CompanyModel.findOne({
      _id: companyId,
      tokenCheckIn: token,
    });
    if (!company) {
      return res.status(401).json({ error: "Token hết hạn" });
    }
    if (device?.deviceUniqueId !== deviceUniqueId) {
      return res.status(401).json({ error: "Không đúng device" });
    }
    const attendanceExist = await AttendanceModel.findOne({
      userId: userId,
      date: { $gte: moment().startOf("day") },
    });
    if (attendanceExist) {
      attendanceExist.checkOutTime = moment().toDate();
      console.log(attendanceExist.checkOutTime);
      console.log(
        "getTimeByHour",
        getTimeByHour(
          (ruleAttendance.morning.startHour + ruleAttendance.morning.endHour) /
            2
        )
      );
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
          (ruleAttendance.morning.endHour - ruleAttendance.morning.startHour) /
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
          (ruleAttendance.afternoon.endHour -
            ruleAttendance.afternoon.startHour) /
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
    return res.status(401).json({ error: "Đã xay ra lỗi" });
  }
});

attendanceRouter.post("/additional-work", requireSignin, async (req, res) => {
  try {
    const user = req.user;
    const body = req.body;
    if (body.type === "LEAVE") {
      const leaveOff = body.time === "11" ? 1 : 0.5;
      if (user.numOfDaysOff < leaveOff) {
        return res
          .status(401)
          .json({ error: "Số ngày nghỉ phép còn lại không đủ" });
      } else {
        user.numOfDaysOff -= leaveOff;
        await user.save();
      }
    }
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
    return res.status(401).json({ error: "Lỗi tạo phiếu" });
  }
});

attendanceRouter.put(
  "/additional-work/:id",
  requireAdminSignin,
  async (req, res) => {
    try {
      const id = req.params.id;
      const body = req.body;
      const leaveRequest = await LeaveRequestModel.findByIdAndUpdate(
        { _id: id },
        { status: body.status }
      );
      if (body.status === "ACCEPTED") {
        const attendance = await AttendanceModel.findOne({
          userId: leaveRequest.userId,
          date: {
            $gte: moment(leaveRequest.date).startOf("day"),
            $lte: moment(leaveRequest.date).endOf("day"),
          },
        });
        if (attendance) {
          attendance.workSession = (
            parseInt(leaveRequest.time, 2) | parseInt(attendance.workSession, 2)
          ).toString(2);
          await attendance.save();
        } else {
          const newAtt = new AttendanceModel({
            date: leaveRequest.date,
            userId: leaveRequest.userId,
            workSession: leaveRequest.time,
          });
          await newAtt.save();
        }
      } else {
        const user = await UserModel.findById(leaveRequest.userId);
        const leaveOff = leaveRequest.time === "11" ? 1 : 0.5;
        user.numOfDaysOff += leaveOff;
        await user.save();
      }
      await leaveRequest.save();
      res.status(200).json({ leaveRequest });
    } catch (error) {
      console.log(
        "🚀 ~ file: attendance.js:148 ~ attendanceRouter.post ~ error:",
        error
      );
      return res.status(401).json({ error: "Lỗi tạo phiếu" });
    }
  }
);

attendanceRouter.get(
  "/additional-work-admin",
  requireAdminSignin,
  async (req, res) => {
    try {
      const user = req.user;
      const { from, to, type } = req.query;
      const userIds = (
        await UserModel.find({ managedBy: user.managedBy?._id })
      ).map((user) => user._id);

      const leaveRequests = await LeaveRequestModel.find({
        userId: userIds,
        date: {
          $gte: from,
          $lte: to,
        },
        type,
      })
        .sort({ createdAt: "ascending" })
        .populate("userId");
      return res.status(200).json({ leaveRequests });
    } catch (error) {
      console.log(
        "🚀 ~ file: attendance.js:148 ~ attendanceRouter.post ~ error:",
        error
      );
      return res.status(401).json({ error: "Lỗi tạo phiếu" });
    }
  }
);

attendanceRouter.get("/additional-work", requireSignin, async (req, res) => {
  try {
    const { where, sort } = req.query;
    console.log(
      "🚀 ~ file: attendance.js:162 ~ attendanceRouter.get ~ where:",
      where
    );
    const leaveRequests = await LeaveRequestModel.find(where).sort(sort);
    res.status(200).json({ leaveRequests });
  } catch (error) {
    console.log(
      "🚀 ~ file: attendance.js:148 ~ attendanceRouter.post ~ error:",
      error
    );
    return res.status(401).json({ error: "Lỗi tạo phiếu" });
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
    }).sort({
      date: "ascending",
    });
    return res.status(200).json({ attendances });
  } catch (error) {
    console.log(
      "🚀 ~ file: attendance.js:165 ~ attendanceRouter.get ~ error:",
      error
    );
    return res.status(401).json({ error: "Có lỗi xảy ra" });
  }
});

export { attendanceRouter };

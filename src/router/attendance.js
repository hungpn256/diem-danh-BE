import express from "express";
import { requireAdminSignin, requireSignin } from "../helper/login.js";
import { UserModel } from "../model/user.js";
import { SalaryModel } from "../model/salary.js";
import { LeaveRequestModel } from "../model/leaveRequest.js";
import { AttendanceModel } from "../model/attendance.js";
import moment from "moment";
import { getTimeByHour, ruleAttendance } from "../helper/ruleAttendance.js";
import { CompanyModel } from "../model/company.js";
import { generateRandomString } from "./user.js";
import { countWeekdaysInCurrentMonth } from "../helper/ateendance.js";
import { getSalary } from "../helper/salary.js";
import sendEmail from "../service/mailer.js";
const attendanceRouter = express.Router();

attendanceRouter.post("/create-token", requireAdminSignin, async (req, res) => {
  try {
    const token = generateRandomString();
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
      date: { $gte: moment().startOf("day"), $lte: moment().endOf("day") },
    });
    if (attendanceExist) {
      attendanceExist.checkOutTime = moment().toDate();
      console.log(attendanceExist.checkOutTime);
      console.log(
        "getTimeByHour",
        moment().diff(getTimeByHour(company.morningStartTime), "minute")
      );
      if (
        moment(attendanceExist.checkOutTime).isAfter(
          getTimeByHour((company.morningStartTime + company.morningEndTime) / 2)
        ) &&
        moment(attendanceExist.checkInTime).isBefore(
          getTimeByHour((company.morningStartTime + company.morningEndTime) / 2)
        ) &&
        moment(attendanceExist.checkOutTime).diff(
          moment(attendanceExist.checkInTime),
          "hour"
        ) >=
          (company.morningEndTime - company.morningStartTime) / 2
      ) {
        attendanceExist.workSession = (
          parseInt("10", 2) | parseInt(attendanceExist.workSession, 2)
        ).toString(2);
      }
      console.log(
        getTimeByHour(
          (company.afternoonStartTime + company.afternoonEndTime) / 2
        ),
        moment(attendanceExist.checkInTime),
        moment(attendanceExist.checkInTime).isBefore(
          getTimeByHour(
            (company.afternoonStartTime + company.afternoonEndTime) / 2
          )
        )
      );
      if (
        moment(attendanceExist.checkOutTime).isAfter(
          getTimeByHour(
            (company.afternoonStartTime + company.afternoonEndTime) / 2
          )
        ) &&
        moment(attendanceExist.checkInTime).isBefore(
          getTimeByHour(
            (company.afternoonStartTime + company.afternoonEndTime) / 2
          )
        ) &&
        moment(attendanceExist.checkOutTime).diff(
          moment(attendanceExist.checkInTime),
          "hour"
        ) >
          (company.afternoonEndTime - company.afternoonStartTime) / 2
      ) {
        attendanceExist.workSession = (
          parseInt("01", 2) | parseInt(attendanceExist.workSession, 2)
        ).toString(2);
      }
      await attendanceExist.save();
      return res.status(200).json({ attendance: attendanceExist });
    } else {
      let latePenalty;
      if (
        moment().isBefore(
          getTimeByHour((company.morningStartTime + company.morningEndTime) / 2)
        )
      ) {
        latePenalty = moment().diff(
          getTimeByHour(company.morningStartTime),
          "minute"
        );
      } else if (
        moment().isBefore(
          getTimeByHour(
            (company.afternoonStartTime + company.afternoonEndTime) / 2
          )
        )
      ) {
        latePenalty = moment().diff(
          getTimeByHour(company.afternoonStartTime),
          "minute"
        );
      }

      const attendance = new AttendanceModel({
        userId,
        date: moment().startOf("date"),
        checkInTime: moment(),
        latePenalty,
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
    const admin = await UserModel.findOne({
      managedBy: user.managedBy?._id,
      role: "admin",
    });
    if (admin) {
      const type =
        leaveRequest.type === "ADDITIONAL" ? "BỔ SUNG CÔNG" : "NGHỈ PHÉP";
      await sendEmail({
        to: admin.email,
        subject: type,
        text: `${
          user.name
        } đã đăng ký đơn ${type.toLowerCase()} vào ngày ${moment(
          leaveRequest.time
        ).format("YYYY-MM-DD")}`,
      });
    }
    return res.status(200).json({ leaveRequest });
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
      ).populate("userId");
      if (body.status === "ACCEPTED") {
        const attendance = await AttendanceModel.findOne({
          userId: leaveRequest.userId?._id,
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
            userId: leaveRequest.userId?._id,
            workSession: leaveRequest.time,
          });
          await newAtt.save();
        }

        const type =
          leaveRequest.type === "ADDITIONAL" ? "BỔ SUNG CÔNG" : "NGHỈ PHÉP";
        await sendEmail({
          to: leaveRequest.userId?.email,
          subject: type,
          text: `Đơn ${type.toLowerCase()} vào ngày ${moment(
            leaveRequest.date
          ).format("YYYY-MM-DD")} đã được xét duyệt`,
        });
      } else {
        const user = await UserModel.findById(leaveRequest.userId?._id);
        const leaveOff = leaveRequest.time === "11" ? 1 : 0.5;
        user.numOfDaysOff += leaveOff;
        await sendEmail({
          to: leaveRequest.userId?.email,
          subject: type,
          text: `Đơn ${type.toLowerCase()} vào ngày ${moment(
            leaveRequest.date
          ).format("YYYY-MM-DD")} đã bị từ chối`,
        });
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

attendanceRouter.get("/salary", requireAdminSignin, async (req, res) => {
  try {
    const user = req.user;
    const { from, to } = req.query;
    let salaryClosed = false;
    let result = [];
    let salaries = await SalaryModel.findOne({
      time: {
        $gte: from,
        $lte: to,
      },
      managedBy: user.managedBy._id,
    }).populate("salary.user");

    if (salaries || moment(to).isBefore(moment())) {
      salaryClosed = true;
      result = salaries?.salary ?? [];
    } else {
      const users = await UserModel.find({
        managedBy: user.managedBy._id,
        role: "user",
      });
      result = await getSalary(from, to, users);
    }
    return res.status(200).json({
      result,
      salaryClosed,
    });
  } catch (error) {
    console.log(
      "🚀 ~ file: attendance.js:165 ~ attendanceRouter.get ~ error:",
      error
    );
    return res.status(401).json({ error: "Có lỗi xảy ra" });
  }
});

attendanceRouter.post(
  "/salary-closed",
  requireAdminSignin,
  async (req, res) => {
    try {
      const user = req.user;
      const { from, to } = req.body;
      let salaries = await SalaryModel.findOne({
        time: {
          $gte: from,
          $lte: to,
        },
        managedBy: user.managedBy._id,
      });

      if (salaries) {
        return res.status(404).json({
          error: "Lương tháng này đã được chốt",
        });
      } else {
        const users = await UserModel.find({
          managedBy: user.managedBy._id,
          role: "user",
        });
        const result = await getSalary(from, to, users);
        console.log(
          "=====",
          result.map((item) => ({
            ...item,
            user: item.user._id,
          }))
        );
        const salary = new SalaryModel({
          salary: result.map((item) => ({
            ...item,
            user: item.user._id,
          })),
          time: moment(),
          managedBy: user.managedBy._id,
        });
        const month = moment(to).get("month") + 1;
        await salary.save();
        await Promise.all(
          result.map((item) => {
            return sendEmail({
              to: item.user.email,
              subject: `LƯƠNG THÁNG ${month}`,
              text: `Tổng kết lương tháng ${month}\nLương hiện tại: ${Math.round(
                item.user.currentSalary
              )}\nTổng số công: ${
                item.workDayValid
              }\nSố tiền nhận: ${Math.round(item.salary)}`,
            });
          })
        );
        return res.status(200).json({
          result: true,
        });
      }
    } catch (error) {
      console.log(
        "🚀 ~ file: attendance.js:165 ~ attendanceRouter.get ~ error:",
        error
      );
      return res.status(401).json({ error: "Có lỗi xảy ra" });
    }
  }
);

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
    return res.status(200).json({
      attendances: attendances.filter(
        (item) =>
          moment(item.date).get("isoWeekday") >= 1 &&
          moment(item.date).get("isoWeekday") <= 5
      ),
    });
  } catch (error) {
    console.log(
      "🚀 ~ file: attendance.js:165 ~ attendanceRouter.get ~ error:",
      error
    );
    return res.status(401).json({ error: "Có lỗi xảy ra" });
  }
});

export { attendanceRouter };

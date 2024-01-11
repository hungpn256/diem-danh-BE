import moment from "moment";
import { AttendanceModel } from "../model/attendance.js";
import { countWeekdaysInCurrentMonth } from "./ateendance.js";

const getSalary = async (from, to, users) => {
  const result = [];
  for (let u of users) {
    const attendances = await AttendanceModel.find({
      date: {
        $gte: from,
        $lte: to,
      },
      userId: u._id,
    });

    const attendanceIsValid = attendances.filter(
      (item) =>
        moment(item.date).get("isoWeekday") >= 1 &&
        moment(item.date).get("isoWeekday") <= 5 &&
        item.workSession &&
        item.workSession !== "00"
    );

    const workDayValid = attendanceIsValid.reduce((prev, item) => {
      let count = 0;
      if (item.workSession === "11") {
        count = 1;
      } else if (item.workSession && item.workSession !== "00") {
        count = 0.5;
      }
      return prev + count;
    }, 0);

    const latePenalty = attendanceIsValid.reduce((prev, item) => {
      return prev + item.latePenalty
        ? Math.min(item.latePenalty * 2000, 100000)
        : 0;
    }, 0);
    const salary = Math.max(
      0,
      (workDayValid / countWeekdaysInCurrentMonth()) * u.currentSalary -
        latePenalty
    );
    result.push({ user: u, salary, workDayValid });
  }
  return result;
};

export { getSalary };

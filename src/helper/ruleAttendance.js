import moment from "moment";

export const ruleAttendance = {
  morning: {
    startHour: 8,
    endHour: 12,
  },
  afternoon: {
    startHour: 13.5,
    endHour: 17.5,
  },
};

export const getTimeByHour = (hour) => {
  return moment()
    .startOf("day")
    .set("minute", hour * 60)
    .startOf("minute");
};

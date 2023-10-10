//index.js

import express from "express";
import cors from "cors";
import { router } from "./src/router/index.js";
import mongoose from "mongoose";
import { keys } from "./src/config/key.js";
import morgan from "morgan";
import { CronJob } from "cron";
import { UserModel } from "./src/model/user.js";
import { AttendanceModel } from "./src/model/attendance.js";
import sendEmail from "./src/service/mailer.js";
import moment from "moment";
import { countWeekdaysInCurrentMonth } from "./src/helper/ateendance.js";

morgan.token("body", (req, res) => JSON.stringify(req.body));
const app = express();

app.use(
  morgan(
    ":method :url :status :response-time ms - :res[content-length] :body - :req[content-length]"
  )
);

app.use(express.json());
app.use(cors());
app.get("/", (req, res) => {
  res.send("GeeksforGeeks");
});

mongoose
  .connect(keys.database.url, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(async () => {
    console.log(`MongoDB Connected!`);
    const job = new CronJob(
      "00 00 8 * * 2-6",
      async function () {
        console.log("You will see this message every second");
        const userIds = await AttendanceModel.find({
          date: {
            $lte: moment().subtract(1, "day").endOf("day"),
            $gte: moment().subtract(1, "day").startOf("day"),
          },
          workSession: "11",
        }).distinct("userId");
        const users = await UserModel.find({
          _id: { $nin: userIds },
          role: "user",
        }).distinct("email");
        const sendMailPromise = users.map((email) => {
          return sendEmail({
            to: email,
            html: `Hqua Đéo chấm công à`,
            subject: "Chấm công",
            text: "Chấm công",
          });
        });
      },
      null,
      true,
      "UTC+7"
    );
    job.start();
    // const startM = moment().startOf("month");
    // while (startM.isBefore(moment().subtract(1, "day"))) {
    //   const late = Math.floor(Math.random() * 10);
    //   await AttendanceModel.create({
    //     checkInTime: startM.clone().set("hour", 8).set("minute", late),
    //     checkOutTime: startM.clone().set("hour", 17),
    //     date: startM.clone().startOf("day"),
    //     workSession: "11",
    //     userId: "6523b4c33d4521cf4916aa32",
    //     latePenalty: late,
    //   });
    //   startM.add(1, "day");
    // }
    // const attendances = await AttendanceModel.find({
    //   date: {
    //     $gte: moment().startOf("month"),
    //     $lte: moment().endOf("month"),
    //   },
    //   userId: "6523b4c33d4521cf4916aa32",
    // });

    // const attendanceIsValid = attendances.filter(
    //   (item) =>
    //     moment(item.date).get("isoWeekday") >= 1 &&
    //     moment(item.date).get("isoWeekday") <= 5
    // );
    // console.log(
    //   "🚀 ~ file: index.js:91 ~ .then ~ attendanceIsValid:",
    //   attendanceIsValid
    // );

    // const workDayValid = attendanceIsValid.reduce((prev, item) => {
    //   let count = 0;
    //   if (item.workSession === "11") {
    //     count = 1;
    //   } else if (item.workSession !== "00") {
    //     count = 0.5;
    //   }
    //   return prev + count;
    // }, 0);
    // console.log(
    //   "🚀 ~ file: index.js:101 ~ workDayValid ~ workDayValid:",
    //   workDayValid,
    //   countWeekdaysInCurrentMonth()
    // );
  })

  .catch((err) => console.log(err));

app.use("/api", router);

const PORT = 1200;

app.listen(PORT, () => {
  console.log(`Running on PORT ${PORT}`);
});

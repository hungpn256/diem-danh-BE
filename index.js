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
  })

  .catch((err) => console.log(err));

app.use("/api", router);

const PORT = 1200;

app.listen(PORT, () => {
  console.log(`Running on PORT ${PORT}`);
});

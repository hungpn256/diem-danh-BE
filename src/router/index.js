import express from "express";
import { userRouter } from "./user.js";
import { attendanceRouter } from "./attendance.js";

const router = express.Router();

router.use("/user", userRouter);
router.use("/attendance", attendanceRouter);

export { router };

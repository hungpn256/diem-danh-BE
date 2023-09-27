import express from "express";
import { userRouter } from "./user.js";
import { attendanceRouter } from "./attendance.js";
import { companyRouter } from "./company.js";

const router = express.Router();

router.use("/user", userRouter);
router.use("/attendance", attendanceRouter);
router.use("/company", companyRouter);

export { router };

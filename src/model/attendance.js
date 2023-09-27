import mongoose from "mongoose";

const attendanceSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
  },
  date: {
    type: Date,
    required: true,
  },
  checkInTime: {
    type: Date,
  },
  checkOutTime: {
    type: Date,
  },
  workSession: {
    type: String,
  },
  latePenalty: {
    type: Number,
    required: true,
  },
});

const AttendanceModel = mongoose.model("Attendance", attendanceSchema);

export { AttendanceModel };

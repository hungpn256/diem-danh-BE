import mongoose from "mongoose";

const leaveRequestSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: "User",
  },
  date: {
    type: Date,
    required: true,
  },
  time: {
    type: String,
    required: true,
    enum: ["01", "10", "11"],
  },
  reason: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    enum: ["PENDING", "APPROVED", "REJECTED"],
  },
  type: {
    type: String,
    enum: ["ADDITIONAL", "LEAVE"],
  },
  createdAt: {
    type: Date,
    default: Date.now(),
  },
});

const LeaveRequestModel = mongoose.model("LeaveRequest", leaveRequestSchema);

export { LeaveRequestModel };

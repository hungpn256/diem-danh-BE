import mongoose from "mongoose";

const leaveRequestSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
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
});

const LeaveRequestModel = mongoose.model("LeaveRequest", leaveRequestSchema);

export { LeaveRequestModel };

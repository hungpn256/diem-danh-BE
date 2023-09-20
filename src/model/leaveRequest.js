import mongoose from "mongoose";

const leaveRequestSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
  },
  startDate: {
    type: Date,
    required: true,
  },
  endDate: {
    type: Date,
    required: true,
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

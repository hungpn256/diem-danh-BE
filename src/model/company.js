import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const companySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  managedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  tokenCheckIn: {
    type: String,
  },
  morningStartTime: {
    type: Number,
  },
  morningEndTime: {
    type: Number,
  },
  afternoonStartTime: {
    type: Number,
  },
  afternoonEndTime: {
    type: Number,
  },
});

const CompanyModel = mongoose.model("Company", companySchema);

export { CompanyModel };

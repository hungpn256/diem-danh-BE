import mongoose from "mongoose";

const salarySchema = new mongoose.Schema({
  time: {
    type: Date,
    required: true,
  },
  managedBy: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: "Company",
  },
  salary: [
    {
      user: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: "User",
      },
      salary: Number,
      workDayValid: Number,
    },
  ],
});

const SalaryModel = mongoose.model("Salary", salarySchema);

export { SalaryModel };

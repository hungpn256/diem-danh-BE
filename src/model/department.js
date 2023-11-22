import mongoose from "mongoose";

const departmentSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  company: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
  },
});

const DepartmentModel = mongoose.model("Department", departmentSchema);

export { DepartmentModel };

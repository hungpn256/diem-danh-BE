import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
  },
  phoneNumber: {
    type: String,
  },
  name: {
    type: String,
    required: true,
  },
  password: {
    type: String,
  },
  role: {
    type: String,
    required: true,
    enum: ["admin", "user"],
  },
  currentSalary: {
    type: Number,
  },
  numOfDaysOff: {
    type: Number,
    default: 0,
  },
  managedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Company",
  },
  department: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Department",
  },
  device: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Device",
  },
});
userSchema.pre("find", function () {
  this.populate(["managedBy", "device", "department"]);
});

userSchema.pre("findOne", function () {
  this.populate(["managedBy", "device", "department"]);
});

userSchema.pre("findOneAndUpdate", function () {
  this.populate(["managedBy", "device", "department"]);
});

const UserModel = mongoose.model("User", userSchema);

export { UserModel };

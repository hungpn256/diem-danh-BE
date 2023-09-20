import mongoose from "mongoose";
import bcrypt from "bcryptjs";

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
    ref: "User",
  },
  device: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Device",
  },
  tokenCheckIn: {
    type: String,
  },
});

userSchema.pre("save", function (next) {
  bcrypt.genSalt(10, (err, salt) => {
    bcrypt.hash(this.password, salt, (err, hash) => {
      this.password = hash;
      next();
    });
  });
});

const UserModel = mongoose.model("User", userSchema);

export { UserModel };

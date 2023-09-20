import mongoose from "mongoose";

const deviceSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  deviceUniqueId: {
    type: String,
    required: true,
  },
});

const DeviceModel = mongoose.model("Device", deviceSchema);

export { DeviceModel };

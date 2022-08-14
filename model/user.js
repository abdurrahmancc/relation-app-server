const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    enum: ["active", "inactive"],
  },
  friends: [],
  friendsRequest: [],
  sendRequest: [],
  date: {
    type: Date,
    default: new Date(),
  },
});

module.exports = { User: mongoose.model("User", userSchema) };

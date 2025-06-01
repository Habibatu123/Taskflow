const mongoose = require("mongoose");

const projectSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    description: { type: String, default: "" },
    status: {
      type: String,
      enum: ["active", "archived"],
      default: "active",
    },
    tasks: [{ type: mongoose.Schema.Types.ObjectId, ref: "Task" }],
    order: { type: Number, default: 0 },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Project", projectSchema);

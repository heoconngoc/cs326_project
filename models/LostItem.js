import mongoose from "mongoose";

const lostItemSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      tim: true,
      minlength: 3,
      maxlength: 100,
    },

    description: {
      type: String,
      required: true,
      tim: true,
      minlength: 1,
      maxlength: 50,
    },

    location: {
      type: String,
      required: true,
      tim: true,
      minlength: 1,
      maxlength: 150,
    },

    dateLost: {
      type: Date,
      required: true,
    },

    color: {
      type: String,
      trim: true,
      maxlength: 50,
      default: "",
    },

    brand: {
      type: String,
      trim: true,
      maxlength: 80,
      default: "",
    },

    contactInfo: {
      type: String,
      trim: true,
      maxlength: 150,
      default: "",
    },

    status: {
      type: String,
      enum: ["open", "closed"],
      default: "open"
    },
  },
  {
    timestamps: true,
    collection: "lostitems",
  }
);

const LostItem = mongoose.model("LostItem", lostItemSchema);

export default LostItem;

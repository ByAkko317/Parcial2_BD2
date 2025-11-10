// src/models/Cart.js
import mongoose from "mongoose";

const cartItemSchema = new mongoose.Schema({
  producto: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
  cantidad: { type: Number, required: true, min: 1 }
}, { _id: false });

const cartSchema = new mongoose.Schema({
  usuario: { type: mongoose.Schema.Types.ObjectId, ref: "User", unique: true, required: true },
  items: [cartItemSchema],
  activo: { type: Boolean, default: true }
}, { timestamps: true });

export default mongoose.model("Cart", cartSchema);

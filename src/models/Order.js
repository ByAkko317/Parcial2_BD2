// src/models/Order.js
import mongoose from "mongoose";

const orderItemSchema = new mongoose.Schema({
  producto: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
  cantidad: { type: Number, required: true, min: 1 },
  subtotal: { type: Number, required: true }
}, { _id: false });

const orderSchema = new mongoose.Schema({
  usuario: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  items: [orderItemSchema],
  fecha: { type: Date, default: Date.now },
  estado: { type: String, enum: ["PENDIENTE", "CONFIRMADO", "CANCELADO", "TERMINADO"], default: "PENDIENTE" },
  total: { type: Number, required: true },
  metodoPago: { type: String, default: "EFECTIVO" }
}, { timestamps: true });

export default mongoose.model("Order", orderSchema);

// src/models/Product.js
import mongoose from "mongoose";

const productSchema = new mongoose.Schema({
  nombre: { type: String, required: true },
  descripcion: String,
  categoria: { type: mongoose.Schema.Types.ObjectId, ref: "Category", required: true },
  marca: String,
  precio: { type: Number, required: true },
  stock: { type: Number, default: 0 }
}, { timestamps: true });

export default mongoose.model("Product", productSchema);

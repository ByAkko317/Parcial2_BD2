// src/models/Review.js
import mongoose from "mongoose";

const reviewSchema = new mongoose.Schema({
  usuario: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  producto: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
  calificacion: { type: Number, min: 1, max: 5, required: true },
  comentario: { type: String, default: "" }
}, { timestamps: true });

reviewSchema.index({ usuario: 1, producto: 1 }, { unique: true }); // una reseña por usuario y producto

export default mongoose.model("Review", reviewSchema);

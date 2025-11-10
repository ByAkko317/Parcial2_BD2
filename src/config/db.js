// src/config/db.js
import mongoose from "mongoose";

export async function connectDB(uri) {
  try {
    await mongoose.connect(uri, { autoIndex: true });
    console.log("[DB] Conectado a MongoDB");
  } catch (err) {
    console.error("[DB] Error de conexión:", err.message);
    process.exit(1);
  }
}

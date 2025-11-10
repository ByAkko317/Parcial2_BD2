// src/models/User.js
import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const addressSchema = new mongoose.Schema({
  calle: String,
  ciudad: String,
  cp: String,
  pais: String
}, { _id: false });

const userSchema = new mongoose.Schema({
  nombre: { type: String, required: true },
  email:  { type: String, required: true, unique: true },
  telefono: String,
  direccion: addressSchema,
  role: { type: String, enum: ["CLIENTE", "ADMIN"], default: "CLIENTE" },
  passwordHash: { type: String, required: true }
}, { timestamps: true });

userSchema.methods.validatePassword = function (plain) {
  return bcrypt.compare(plain, this.passwordHash);
};

userSchema.statics.hashPassword = async function (plain) {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(plain, salt);
};

export default mongoose.model("User", userSchema);

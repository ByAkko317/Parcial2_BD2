// src/routes/auth.routes.js
import { Router } from "express";
import jwt from "jsonwebtoken";
import User from "../models/User.js";

const router = Router();

// Registro
router.post("/register", async (req, res, next) => {
  try {
    const { nombre, email, password, telefono, direccion, role } = req.body;
    if (!nombre || !email || !password) {
      return res.status(400).json({ success: false, error: "nombre, email y password son requeridos" });
    }
    const exists = await User.findOne({ email });
    if (exists) return res.status(409).json({ success: false, error: "Email ya registrado" });

    const passwordHash = await User.hashPassword(password);
    const user = await User.create({ nombre, email, passwordHash, telefono, direccion, role });

    const token = jwt.sign({ id: user._id, role: user.role, email: user.email }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN || "1d",
    });

    res.json({ success: true, data: { token, user: { id: user._id, nombre, email, role: user.role } } });
  } catch (err) { next(err); }
});

// Login
router.post("/login", async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user || !(await user.validatePassword(password))) {
      return res.status(401).json({ success: false, error: "Credenciales inválidas" });
    }
    const token = jwt.sign({ id: user._id, role: user.role, email: user.email }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN || "1d",
    });
    res.json({ success: true, data: { token, user: { id: user._id, nombre: user.nombre, email, role: user.role } } });
  } catch (err) { next(err); }
});

export default router;

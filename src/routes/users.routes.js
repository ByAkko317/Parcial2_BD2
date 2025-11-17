// src/routes/users.routes.js
import { Router } from "express";
import User from "../models/User.js";
import Cart from "../models/Cart.js";
import { auth } from "../middleware/auth.js";
import { requireAdmin } from "../middleware/role.js";

const router = Router();

// GET /api/users → listar todos (ADMIN)
router.get("/", auth, requireAdmin, async (req, res, next) => {
  try {
    const users = await User.find().select("-passwordHash");
    res.json({ success: true, data: users });
  } catch (e) { next(e); }
});

// GET /api/users/:id → detalle (ADMIN o dueño)
router.get("/:id", auth, async (req, res, next) => {
  try {
    if (req.user.role !== "ADMIN" && req.user.id !== req.params.id)
      return res.status(403).json({ success: false, error: "Prohibido" });

    const user = await User.findById(req.params.id).select("-passwordHash");
    if (!user) return res.status(404).json({ success: false, error: "No encontrado" });
    res.json({ success: true, data: user });
  } catch (e) { next(e); }
});

// POST /api/users → registrar usuario (ADMIN puede crear admins)
router.post("/", auth, requireAdmin, async (req, res, next) => {
  try {
    const { nombre, email, password, role } = req.body;
    const passwordHash = await User.hashPassword(password);
    const user = await User.create({ nombre, email, passwordHash, role });
    res.status(201).json({ success: true, data: { id: user._id, nombre, email, role } });
  } catch (e) { next(e); }
});

// DELETE /api/users/:id → eliminar usuario y su carrito
router.delete("/:id", auth, requireAdmin, async (req, res, next) => {
  try {
    const { id } = req.params;
    await Cart.deleteOne({ usuario: id });
    await User.deleteOne({ _id: id });
    res.json({ success: true, message: "Usuario y carrito eliminados" });
  } catch (e) { next(e); }
});
// PATCH /api/carrito/:usuarioId/update
router.patch("/:usuarioId/update", auth, async (req, res, next) => {
  try {
    const { productoId, cantidad } = req.body;
    if (req.user.role !== "ADMIN" && req.user.id !== req.params.usuarioId)
      return res.status(403).json({ success: false, error: "Prohibido" });

    const cart = await getOrCreateCart(req.params.usuarioId);
    const item = cart.items.find(i => i.producto.toString() === productoId);
    if (!item) return res.status(404).json({ success: false, error: "Producto no está en el carrito" });

    item.cantidad = cantidad;
    await cart.save();
    res.json({ success: true, data: cart });
  } catch (e) { next(e); }
});

export default router;

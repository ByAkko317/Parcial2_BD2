// src/routes/cart.routes.js
import { Router } from "express";
import { auth } from "../middleware/auth.js";
import Cart from "../models/Cart.js";
import Product from "../models/Product.js";

const router = Router();

// Asegura un carrito activo
async function getOrCreateCart(userId) {
  let cart = await Cart.findOne({ usuario: userId });
  if (!cart) cart = await Cart.create({ usuario: userId, items: [], activo: true });
  return cart;
}

// CRUD básico
router.get("/:usuarioId", auth, async (req, res, next) => {
  try {
    if (req.user.role !== "ADMIN" && req.user.id !== req.params.usuarioId)
      return res.status(403).json({ success: false, error: "Prohibido" });

    const cart = await Cart.findOne({ usuario: req.params.usuarioId }).populate("items.producto");
    res.json({ success: true, data: cart || { items: [] } });
  } catch (e) { next(e); }
});

router.post("/:usuarioId/add", auth, async (req, res, next) => {
  try {
    const { productoId, cantidad } = req.body;
    if (req.user.role !== "ADMIN" && req.user.id !== req.params.usuarioId)
      return res.status(403).json({ success: false, error: "Prohibido" });

    const prod = await Product.findById(productoId);
    if (!prod) return res.status(404).json({ success: false, error: "Producto no existe" });

    const cart = await getOrCreateCart(req.params.usuarioId);
    const idx = cart.items.findIndex(i => i.producto.toString() === productoId);

    if (idx >= 0) cart.items[idx].cantidad += cantidad;
    else cart.items.push({ producto: productoId, cantidad });

    await cart.save();
    res.status(201).json({ success: true, data: cart });
  } catch (e) { next(e); }
});

router.post("/:usuarioId/remove", auth, async (req, res, next) => {
  try {
    const { productoId } = req.body;
    if (req.user.role !== "ADMIN" && req.user.id !== req.params.usuarioId)
      return res.status(403).json({ success: false, error: "Prohibido" });

    const cart = await getOrCreateCart(req.params.usuarioId);
    cart.items = cart.items.filter(i => i.producto.toString() !== productoId); // $pull (análogo)
    await cart.save();
    res.json({ success: true, data: cart });
  } catch (e) { next(e); }
});

// GET /api/carrito/:usuarioId/total → total y subtotales
router.get("/:usuarioId/total", auth, async (req, res, next) => {
  try {
    if (req.user.role !== "ADMIN" && req.user.id !== req.params.usuarioId)
      return res.status(403).json({ success: false, error: "Prohibido" });

    const cart = await Cart.findOne({ usuario: req.params.usuarioId }).populate("items.producto");
    if (!cart) return res.json({ success: true, data: { total: 0, items: [] } });

    const items = cart.items.map(i => ({
      producto: i.producto._id,
      nombre: i.producto.nombre,
      cantidad: i.cantidad,
      precio: i.producto.precio,
      subtotal: i.cantidad * i.producto.precio
    }));

    const total = items.reduce((acc, it) => acc + it.subtotal, 0);
    res.json({ success: true, data: { total, items } });
  } catch (e) { next(e); }
});

export default router;

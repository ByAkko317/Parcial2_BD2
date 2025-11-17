// src/routes/cart.routes.js
import { Router } from "express";
import { auth } from "../middleware/auth.js";
import Cart from "../models/Cart.js";
import Product from "../models/Product.js";

const router = Router();

// 🔹 Asegura un carrito activo
async function getOrCreateCart(userId) {
  let cart = await Cart.findOne({ usuario: userId });
  if (!cart) cart = await Cart.create({ usuario: userId, items: [], activo: true });
  return cart;
}

// ============================================================
// 🟩 GET /api/carrito → carrito propio
// 🟦 GET /api/carrito/:usuarioId → carrito de otro (ADMIN)
// ============================================================

router.get("/", auth, async (req, res, next) => {
  try {
    const userId = req.user.id;
    const cart = await Cart.findOne({ usuario: userId }).populate("items.producto");
    res.json({ success: true, data: cart || { items: [] } });
  } catch (e) { next(e); }
});

router.get("/:usuarioId", auth, async (req, res, next) => {
  try {
    if (req.user.role !== "ADMIN")
      return res.status(403).json({ success: false, error: "Solo ADMIN puede ver carritos ajenos" });

    const cart = await Cart.findOne({ usuario: req.params.usuarioId }).populate("items.producto");
    res.json({ success: true, data: cart || { items: [] } });
  } catch (e) { next(e); }
});

// ============================================================
// 🟨 POST /api/carrito/add → agregar producto propio
// 🟦 POST /api/carrito/:usuarioId/add → admin agrega en carrito ajeno
// ============================================================

router.post("/add", auth, async (req, res, next) => {
  try {
    const { productoId, cantidad } = req.body;
    const prod = await Product.findById(productoId);
    if (!prod) return res.status(404).json({ success: false, error: "Producto no existe" });

    const cart = await getOrCreateCart(req.user.id);
    const idx = cart.items.findIndex(i => i.producto.toString() === productoId);
    if (idx >= 0) cart.items[idx].cantidad += cantidad;
    else cart.items.push({ producto: productoId, cantidad });

    await cart.save();
    res.status(201).json({ success: true, data: cart });
  } catch (e) { next(e); }
});

router.post("/:usuarioId/add", auth, async (req, res, next) => {
  try {
    if (req.user.role !== "ADMIN")
      return res.status(403).json({ success: false, error: "Solo ADMIN puede modificar carritos ajenos" });

    const { productoId, cantidad } = req.body;
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

// ============================================================
// 🟧 PATCH /api/carrito/update → actualizar cantidad propia
// 🟦 PATCH /api/carrito/:usuarioId/update → admin actualiza ajeno
// ============================================================

router.patch("/update", auth, async (req, res, next) => {
  try {
    const { productoId, cantidad } = req.body;
    const cart = await getOrCreateCart(req.user.id);
    const item = cart.items.find(i => i.producto.toString() === productoId);
    if (!item) return res.status(404).json({ success: false, error: "Producto no está en el carrito" });

    item.cantidad = cantidad;
    await cart.save();
    res.json({ success: true, data: cart });
  } catch (e) { next(e); }
});

router.patch("/:usuarioId/update", auth, async (req, res, next) => {
  try {
    if (req.user.role !== "ADMIN")
      return res.status(403).json({ success: false, error: "Solo ADMIN puede modificar carritos ajenos" });

    const { productoId, cantidad } = req.body;
    const cart = await getOrCreateCart(req.params.usuarioId);
    const item = cart.items.find(i => i.producto.toString() === productoId);
    if (!item) return res.status(404).json({ success: false, error: "Producto no está en el carrito" });

    item.cantidad = cantidad;
    await cart.save();
    res.json({ success: true, data: cart });
  } catch (e) { next(e); }
});

// ============================================================
// 🟥 POST /api/carrito/remove → quitar ítem propio
// 🟦 POST /api/carrito/:usuarioId/remove → admin quita ítem ajeno
// ============================================================

router.post("/remove", auth, async (req, res, next) => {
  try {
    const { productoId } = req.body;
    const cart = await getOrCreateCart(req.user.id);
    cart.items = cart.items.filter(i => i.producto.toString() !== productoId);
    await cart.save();
    res.json({ success: true, data: cart });
  } catch (e) { next(e); }
});

router.post("/:usuarioId/remove", auth, async (req, res, next) => {
  try {
    if (req.user.role !== "ADMIN")
      return res.status(403).json({ success: false, error: "Solo ADMIN puede modificar carritos ajenos" });

    const { productoId } = req.body;
    const cart = await getOrCreateCart(req.params.usuarioId);
    cart.items = cart.items.filter(i => i.producto.toString() !== productoId);
    await cart.save();
    res.json({ success: true, data: cart });
  } catch (e) { next(e); }
});

// ============================================================
// ⛔ DELETE /api/carrito/clear → vaciar propio
// 🟦 DELETE /api/carrito/:usuarioId/clear → admin vacía ajeno
// ============================================================

router.delete("/clear", auth, async (req, res, next) => {
  try {
    const cart = await Cart.findOne({ usuario: req.user.id });
    if (!cart) return res.status(404).json({ success: false, error: "Carrito no encontrado" });

    cart.items = [];
    await cart.save();
    res.json({ success: true, message: "Carrito vaciado" });
  } catch (e) { next(e); }
});

router.delete("/:usuarioId/clear", auth, async (req, res, next) => {
  try {
    if (req.user.role !== "ADMIN")
      return res.status(403).json({ success: false, error: "Solo ADMIN puede modificar carritos ajenos" });

    const cart = await Cart.findOne({ usuario: req.params.usuarioId });
    if (!cart) return res.status(404).json({ success: false, error: "Carrito no encontrado" });

    cart.items = [];
    await cart.save();
    res.json({ success: true, message: "Carrito vaciado (ADMIN)" });
  } catch (e) { next(e); }
});

// ============================================================
// 🧮 GET /api/carrito/total → total propio
// 🟦 GET /api/carrito/:usuarioId/total → total ajeno (ADMIN)
// ============================================================

router.get("/total", auth, async (req, res, next) => {
  try {
    const cart = await Cart.findOne({ usuario: req.user.id }).populate("items.producto");
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

router.get("/:usuarioId/total", auth, async (req, res, next) => {
  try {
    if (req.user.role !== "ADMIN")
      return res.status(403).json({ success: false, error: "Solo ADMIN puede ver totales ajenos" });

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

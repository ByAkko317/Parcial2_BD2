// src/routes/orders.routes.js
import { Router } from "express";
import { auth } from "../middleware/auth.js";
import { requireAdmin } from "../middleware/role.js";
import Order from "../models/Order.js";
import Cart from "../models/Cart.js";
import Product from "../models/Product.js";

const router = Router();

// Crear pedido desde carrito (cliente autenticado)
router.post("/", auth, async (req, res, next) => {
  try {
    const userId = req.user.id;
    const cart = await Cart.findOne({ usuario: userId }).populate("items.producto");
    if (!cart || !cart.items.length) return res.status(400).json({ success: false, error: "Carrito vacío" });

    // calcular items y total
    const items = cart.items.map(i => ({
      producto: i.producto._id,
      cantidad: i.cantidad,
      subtotal: i.cantidad * i.producto.precio
    }));

    const total = items.reduce((acc, it) => acc + it.subtotal, 0);

    // disminuir stock
    for (const it of cart.items) {
      const p = await Product.findById(it.producto._id);
      if (p.stock < it.cantidad) {
        return res.status(400).json({ success: false, error: `Stock insuficiente para ${p.nombre}` });
      }
      await Product.findByIdAndUpdate(p._id, { $inc: { stock: -it.cantidad } });
    }

    const order = await Order.create({
      usuario: userId,
      items,
      total,
      estado: "PENDIENTE",
      metodoPago: req.body.metodoPago || "EFECTIVO"
    });

    // limpiar carrito
    cart.items = [];
    await cart.save();

    res.status(201).json({ success: true, data: order });
  } catch (e) { next(e); }
});

// GET /api/ordenes → listar pedidos con datos de usuario (ADMIN)
router.get("/", auth, requireAdmin, async (req, res, next) => {
  try {
    const orders = await Order.find().populate("usuario", "nombre email role");
    res.json({ success: true, data: orders });
  } catch (e) { next(e); }
});

// GET /api/ordenes/user/:userId → pedidos de un usuario (dueño o admin)
router.get("/user/:userId", auth, async (req, res, next) => {
  try {
    if (req.user.role !== "ADMIN" && req.user.id !== req.params.userId)
      return res.status(403).json({ success: false, error: "Prohibido" });

    const orders = await Order.find({ usuario: req.params.userId });
    res.json({ success: true, data: orders });
  } catch (e) { next(e); }
});

// GET /api/ordenes/stats → total de pedidos por estado (ADMIN) ($group, $sum)
router.get("/stats", auth, requireAdmin, async (req, res, next) => {
  try {
    const stats = await Order.aggregate([
      { $group: { _id: "$estado", cantidad: { $sum: 1 }, totalVentas: { $sum: "$total" } } },
      { $sort: { cantidad: -1 } }
    ]);
    res.json({ success: true, data: stats });
  } catch (e) { next(e); }
});

// PATCH /api/ordenes/:id/status → actualizar estado (ADMIN) ($set)
router.patch("/:id/status", auth, requireAdmin, async (req, res, next) => {
  try {
    const { estado } = req.body;
    const allowed = ["PENDIENTE", "CONFIRMADO", "CANCELADO", "TERMINADO"];
    if (!allowed.includes(estado))
      return res.status(400).json({ success: false, error: "Estado inválido" });

    const updated = await Order.findByIdAndUpdate(req.params.id, { $set: { estado } }, { new: true });
    res.json({ success: true, data: updated });
  } catch (e) { next(e); }
});

export default router;

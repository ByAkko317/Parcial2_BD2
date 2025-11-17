// src/routes/orders.routes.js
import { Router } from "express";
import { auth } from "../middleware/auth.js";
import { requireAdmin } from "../middleware/role.js";
import Order from "../models/Order.js";
import Cart from "../models/Cart.js";
import Product from "../models/Product.js";

const router = Router();

/**
 * 🟩 POST /api/ordenes
 * Crear pedido desde el carrito del usuario autenticado.
 * Si el admin pasa un usuarioId en el body, crea el pedido para ese usuario.
 */
router.post("/", auth, async (req, res, next) => {
  try {
    let userId = req.user.id;

    // Si el admin quiere crear pedido para otro usuario
    if (req.user.role === "ADMIN" && req.body.usuarioId) {
      userId = req.body.usuarioId;
    }

    const cart = await Cart.findOne({ usuario: userId }).populate("items.producto");
    console.log(cart);
    if (!cart || !cart.items.length)
      return res.status(400).json({ success: false, error: "Carrito vacío" });

    const items = cart.items.map(i => ({
      producto: i.producto._id,
      cantidad: i.cantidad,
      subtotal: i.cantidad * i.producto.precio,
    }));

    const total = items.reduce((acc, it) => acc + it.subtotal, 0);

    // 🔸 Verificar stock y descontar
    for (const it of cart.items) {
      const p = await Product.findById(it.producto._id);
      if (!p) return res.status(400).json({ success: false, error: `Producto inexistente (${it.producto._id})` });
      if (p.stock < it.cantidad)
        return res.status(400).json({ success: false, error: `Stock insuficiente para ${p.nombre}` });

      await Product.findByIdAndUpdate(p._id, { $inc: { stock: -it.cantidad } });
    }

    const order = await Order.create({
      usuario: userId,
      items,
      total,
      estado: "PENDIENTE",
      metodoPago: req.body.metodoPago || "EFECTIVO",
    });

    // Vaciar carrito después de generar la orden
    cart.items = [];
    await cart.save();

    res.status(201).json({ success: true, data: order });
  } catch (e) {
    next(e);
  }
});

/**
 * 🟦 GET /api/ordenes
 * Listar todas las órdenes (solo ADMIN)
 */
router.get("/", auth, requireAdmin, async (req, res, next) => {
  try {
    const orders = await Order.find()
      .populate("usuario", "nombre email role")
      .sort({ createdAt: -1 });
    res.json({ success: true, data: orders });
  } catch (e) {
    next(e);
  }
});

/**
 * 🟩 GET /api/ordenes/mias
 * Listar órdenes del usuario autenticado
 */
router.get("/mias", auth, async (req, res, next) => {
  try {
    const orders = await Order.find({ usuario: req.user.id })
      .populate("items.producto", "nombre precio")
      .sort({ createdAt: -1 });
    res.json({ success: true, data: orders });
  } catch (e) {
    next(e);
  }
});

/**
 * 🟦 GET /api/ordenes/user/:userId
 * Listar órdenes de un usuario (ADMIN)
 */
router.get("/user/:userId", auth, requireAdmin, async (req, res, next) => {
  try {
    const orders = await Order.find({ usuario: req.params.userId })
      .populate("items.producto", "nombre precio");
    res.json({ success: true, data: orders });
  } catch (e) {
    next(e);
  }
});

/**
 * 🟨 GET /api/ordenes/:id
 * Obtener detalle de una orden (ADMIN o dueño)
 */
router.get("/:id", auth, async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate("usuario", "nombre email")
      .populate("items.producto", "nombre precio");

    if (!order)
      return res.status(404).json({ success: false, error: "Orden no encontrada" });

    if (req.user.role !== "ADMIN" && req.user.id !== order.usuario._id.toString())
      return res.status(403).json({ success: false, error: "Prohibido" });

    res.json({ success: true, data: order });
  } catch (e) {
    next(e);
  }
});

/**
 * 🧮 GET /api/ordenes/stats
 * Estadísticas de ventas agrupadas por estado (ADMIN)
 */
router.get("/stats/general", auth, requireAdmin, async (req, res, next) => {
  try {
    const stats = await Order.aggregate([
      { $group: { _id: "$estado", cantidad: { $sum: 1 }, totalVentas: { $sum: "$total" } } },
      { $sort: { cantidad: -1 } },
    ]);
    res.json({ success: true, data: stats });
  } catch (e) {
    next(e);
  }
});

/**
 * 🟦 PATCH /api/ordenes/:id/status
 * Actualizar estado de la orden (solo ADMIN)
 */
router.patch("/:id/status", auth, requireAdmin, async (req, res, next) => {
  try {
    const { estado } = req.body;
    const allowed = ["PENDIENTE", "CONFIRMADO", "CANCELADO", "TERMINADO"];
    if (!allowed.includes(estado))
      return res.status(400).json({ success: false, error: "Estado inválido" });

    const updated = await Order.findByIdAndUpdate(
      req.params.id,
      { $set: { estado } },
      { new: true }
    );

    if (!updated)
      return res.status(404).json({ success: false, error: "Orden no encontrada" });

    res.json({ success: true, data: updated });
  } catch (e) {
    next(e);
  }
});

/**
 * 🟥 DELETE /api/ordenes/:id
 * Eliminar una orden (ADMIN o dueño)
 */
router.delete("/:id", auth, async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order)
      return res.status(404).json({ success: false, error: "Orden no encontrada" });

    if (req.user.role !== "ADMIN" && req.user.id !== order.usuario.toString())
      return res.status(403).json({ success: false, error: "Prohibido" });

    await Order.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: "Orden eliminada correctamente" });
  } catch (e) {
    next(e);
  }
});

export default router;

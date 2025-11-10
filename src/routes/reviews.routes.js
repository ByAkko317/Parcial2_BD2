// src/routes/reviews.routes.js
import { Router } from "express";
import { auth } from "../middleware/auth.js";
import { requireAdmin } from "../middleware/role.js";
import Review from "../models/Review.js";
import Order from "../models/Order.js";

const router = Router();

// CRUD básico
router.post("/", auth, async (req, res, next) => {
  try {
    const { producto, calificacion, comentario } = req.body;

    // Validar que el usuario compró el producto
    const bought = await Order.exists({
      usuario: req.user.id,
      "items.producto": producto
    });
    if (!bought) return res.status(403).json({ success: false, error: "Solo puedes reseñar productos comprados" });

    const created = await Review.create({
      usuario: req.user.id,
      producto,
      calificacion,
      comentario
    });
    res.status(201).json({ success: true, data: created });
  } catch (e) { next(e); }
});

router.get("/", async (req, res, next) => {
  try {
    // listar todas con datos de usuario y producto
    const listado = await Review.aggregate([
      { $lookup: { from: "users", localField: "usuario", foreignField: "_id", as: "usuario" } },
      { $unwind: "$usuario" },
      { $lookup: { from: "products", localField: "producto", foreignField: "_id", as: "producto" } },
      { $unwind: "$producto" },
      { $project: { calificacion: 1, comentario: 1, "usuario.nombre": 1, "usuario.email": 1, "producto.nombre": 1, createdAt: 1 } },
      { $sort: { createdAt: -1 } }
    ]);
    res.json({ success: true, data: listado });
  } catch (e) { next(e); }
});

router.get("/product/:productId", async (req, res, next) => {
  try {
    const { productId } = req.params;
    const reviews = await Review.find({ producto: productId }).populate("usuario", "nombre");
    res.json({ success: true, data: reviews });
  } catch (e) { next(e); }
});

// GET /api/resenas/top → promedio de calificaciones por producto ($group $avg)
router.get("/top", async (req, res, next) => {
  try {
    const top = await Review.aggregate([
      { $group: { _id: "$producto", promedio: { $avg: "$calificacion" }, cantidad: { $sum: 1 } } },
      { $sort: { promedio: -1, cantidad: -1 } },
      { $limit: 10 },
      { $lookup: { from: "products", localField: "_id", foreignField: "_id", as: "producto" } },
      { $unwind: "$producto" },
      { $project: { _id: 0, productoId: "$producto._id", nombre: "$producto.nombre", promedio: 1, cantidad: 1 } }
    ]);
    res.json({ success: true, data: top });
  } catch (e) { next(e); }
});

// (Opcional ADMIN) borrar reseña
router.delete("/:id", auth, requireAdmin, async (req, res, next) => {
  try {
    await Review.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: "Reseña eliminada" });
  } catch (e) { next(e); }
});

export default router;

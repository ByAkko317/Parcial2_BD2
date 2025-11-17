import { Router } from "express";
import { auth } from "../middleware/auth.js";
import { requireAdmin } from "../middleware/role.js";
import Review from "../models/Review.js";
import Order from "../models/Order.js";

const router = Router();

// POST /api/resenas → crear reseña (solo productos comprados por el usuario)
router.post("/", auth, async (req, res, next) => {
  try {
    const { producto, calificacion, comentario } = req.body;

    const bought = await Order.exists({
      usuario: req.user.id,
      "items.producto": producto
    });
    if (!bought)
      return res.status(403).json({ success: false, error: "Solo puedes reseñar productos comprados" });

    const created = await Review.create({
      usuario: req.user.id,
      producto,
      calificacion,
      comentario
    });
    res.status(201).json({ success: true, data: created });
  } catch (e) { next(e); }
});

// GET /api/resenas → listar reseñas con datos de usuario y producto (aggregations)
router.get("/", async (req, res, next) => {
  try {
    const listado = await Review.aggregate([
      { $lookup: { from: "users", localField: "usuario", foreignField: "_id", as: "usuario" } },
      { $unwind: "$usuario" },
      { $lookup: { from: "products", localField: "producto", foreignField: "_id", as: "producto" } },
      { $unwind: "$producto" },
      {
        $project: {
          calificacion: 1,
          comentario: 1,
          "usuario.nombre": 1,
          "usuario.email": 1,
          "producto.nombre": 1,
          createdAt: 1
        }
      },
      { $sort: { createdAt: -1 } }
    ]);
    res.json({ success: true, data: listado });
  } catch (e) { next(e); }
});

// GET /api/resenas/product/:productId → reseñas de un producto
router.get("/product/:productId", async (req, res, next) => {
  try {
    const { productId } = req.params;
    const reviews = await Review.find({ producto: productId }).populate("usuario", "nombre");
    res.json({ success: true, data: reviews });
  } catch (e) { next(e); }
});

// GET /api/resenas/top → promedio de calificaciones por producto (top 10)
router.get("/top", async (req, res, next) => {
  try {
    const top = await Review.aggregate([
      { $group: { _id: "$producto", promedio: { $avg: "$calificacion" }, cantidad: { $sum: 1 } } },
      { $sort: { promedio: -1, cantidad: -1 } },
      { $limit: 10 },
      { $lookup: { from: "products", localField: "_id", foreignField: "_id", as: "producto" } },
      { $unwind: "$producto" },
      {
        $project: {
          _id: 0,
          productoId: "$producto._id",
          nombre: "$producto.nombre",
          promedio: 1,
          cantidad: 1
        }
      }
    ]);
    res.json({ success: true, data: top });
  } catch (e) { next(e); }
});

// PUT /api/resenas/:id → editar reseña (autor o ADMIN)
router.put("/:id", auth, async (req, res, next) => {
  try {
    const review = await Review.findById(req.params.id);
    if (!review) return res.status(404).json({ success: false, error: "Reseña no encontrada" });

    if (req.user.role !== "ADMIN" && req.user.id !== review.usuario.toString())
      return res.status(403).json({ success: false, error: "Prohibido" });

    const { calificacion, comentario } = req.body;
    if (calificacion !== undefined) review.calificacion = calificacion;
    if (comentario !== undefined) review.comentario = comentario;

    await review.save();
    res.json({ success: true, data: review });
  } catch (e) { next(e); }
});

// DELETE /api/resenas/:id → eliminar reseña (solo ADMIN)
router.delete("/:id", auth, requireAdmin, async (req, res, next) => {
  try {
    await Review.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: "Reseña eliminada" });
  } catch (e) { next(e); }
});

export default router;

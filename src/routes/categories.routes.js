// src/routes/categories.routes.js
import { Router } from "express";
import Category from "../models/Category.js";
import Product from "../models/Product.js";
import { auth } from "../middleware/auth.js";
import { requireAdmin } from "../middleware/role.js";

const router = Router();

// CRUD (ADMIN)
router.post("/", auth, requireAdmin, async (req, res, next) => {
  try {
    const cat = await Category.create(req.body);
    res.status(201).json({ success: true, data: cat });
  } catch (e) { next(e); }
});

router.get("/", async (req, res, next) => {
  try {
    const cats = await Category.find();
    res.json({ success: true, data: cats });
  } catch (e) { next(e); }
});

router.get("/:id", async (req, res, next) => {
  try {
    const cat = await Category.findById(req.params.id);
    if (!cat) return res.status(404).json({ success: false, error: "No encontrado" });
    res.json({ success: true, data: cat });
  } catch (e) { next(e); }
});

router.put("/:id", auth, requireAdmin, async (req, res, next) => {
  try {
    const cat = await Category.findByIdAndUpdate(req.params.id, { $set: req.body }, { new: true });
    res.json({ success: true, data: cat });
  } catch (e) { next(e); }
});

router.delete("/:id", auth, requireAdmin, async (req, res, next) => {
  try {
    await Category.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: "Categoría eliminada" });
  } catch (e) { next(e); }
});

// GET /api/categorias/stats → cantidad de productos por categoría (lookup+group)
router.get("/stats/cantidad-productos", async (req, res, next) => {
  try {
    const stats = await Product.aggregate([
      { $lookup: { from: "categories", localField: "categoria", foreignField: "_id", as: "categoriaInfo" } },
      { $unwind: "$categoriaInfo" },
      { $group: { _id: "$categoriaInfo.nombre", cantidadProductos: { $sum: 1 } } },
      { $sort: { cantidadProductos: -1 } }
    ]);
    res.json({ success: true, data: stats });
  } catch (e) { next(e); }
});

export default router;

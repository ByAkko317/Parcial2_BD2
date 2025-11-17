// src/routes/products.routes.js
import { Router } from "express";
import Product from "../models/Product.js";
import Category from "../models/Category.js";
import { auth } from "../middleware/auth.js";
import { requireAdmin } from "../middleware/role.js";

const router = Router();

// Crear/editar/eliminar (ADMIN)
router.post("/", auth, requireAdmin, async (req, res, next) => {
  try {
    const { categoria } = req.body;
    if (!(await Category.findById(categoria))) {
      return res.status(400).json({ success: false, error: "Categoría inválida" });
    }
    const created = await Product.create(req.body);
    res.status(201).json({ success: true, data: created });
  } catch (e) { next(e); }
});

router.put("/:id", auth, requireAdmin, async (req, res, next) => {
  try {
    const updated = await Product.findByIdAndUpdate(req.params.id, { $set: req.body }, { new: true });
    res.json({ success: true, data: updated });
  } catch (e) { next(e); }
});

router.delete("/:id", auth, requireAdmin, async (req, res, next) => {
  try {
    await Product.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: "Producto eliminado" });
  } catch (e) { next(e); }
});

// GET /api/productos/:id → obtener producto por ID con categoría
router.get("/:id", async (req, res, next) => {
  try {
    const producto = await Product.findById(req.params.id).populate("categoria");

    if (!producto)
      return res.status(404).json({ success: false, error: "Producto no encontrado" });

    res.json({ success: true, data: producto });
  } catch (e) {
    next(e);
  }
});


// GET /api/productos → listar con categoría (populate)
router.get("/", async (req, res, next) => {
  try {
    const productos = await Product.find().populate("categoria");
    res.json({ success: true, data: productos });
  } catch (e) { next(e); }
});

// GET /api/productos/filtro → rango de precio y marca (gte/lte/and/or/ne/eq)
router.get("/filtro", async (req, res, next) => {
  try {
    const { min, max, marca, excludeMarca } = req.query;
    const cond = { $and: [] };

    if (min || max) {
      const rango = {};
      if (min) rango.$gte = Number(min); // $gte
      if (max) rango.$lte = Number(max); // $lte
      cond.$and.push({ precio: rango });
    }

    if (marca || excludeMarca) {
      const marcaCond = [];
      if (marca) marcaCond.push({ marca: { $eq: marca } });       // $eq
      if (excludeMarca) marcaCond.push({ marca: { $ne: excludeMarca } }); // $ne
      if (marcaCond.length) cond.$and.push({ $or: marcaCond });    // $or
    }

    if (!cond.$and.length) delete cond.$and;
    const productos = await Product.find(cond || {});
    res.json({ success: true, data: productos });
  } catch (e) { next(e); }
});

// GET /api/productos/top → productos más reseñados (lookup, group, sort, count)
router.get("/top", async (req, res, next) => {
  try {
    const top = await Product.aggregate([
      { $lookup: { from: "reviews", localField: "_id", foreignField: "producto", as: "resenas" } },
      { $addFields: { cantidadResenas: { $size: "$resenas" } } },
      { $sort: { cantidadResenas: -1 } },
      { $limit: 10 },
      { $project: { nombre: 1, marca: 1, precio: 1, cantidadResenas: 1 } }
    ]);
    res.json({ success: true, data: top });
  } catch (e) { next(e); }
});

// PATCH /api/productos/:id/stock → actualizar stock ($set)
router.patch("/:id/stock", auth, requireAdmin, async (req, res, next) => {
  try {
    const { stock } = req.body;
    const updated = await Product.findByIdAndUpdate(req.params.id, { $set: { stock } }, { new: true });
    res.json({ success: true, data: updated });
  } catch (e) { next(e); }
});

export default router;

// src/app.js
import "dotenv/config";
import express from "express";
import bodyParser from "body-parser";
import morgan from "morgan";
import cors from "cors";
import { connectDB } from "./config/db.js";
import { errorHandler } from "./middleware/errorHandler.js";

// Rutas
import authRoutes from "./routes/auth.routes.js";
import usersRoutes from "./routes/users.routes.js";
import categoriesRoutes from "./routes/categories.routes.js";
import productsRoutes from "./routes/products.routes.js";
import cartRoutes from "./routes/cart.routes.js";
import ordersRoutes from "./routes/orders.routes.js";
import reviewsRoutes from "./routes/reviews.routes.js";

const app = express();
app.use(cors());
app.use(morgan("dev"));
app.use(bodyParser.json());

// Rutas base
app.use("/api/auth", authRoutes);
app.use("/api/users", usersRoutes);
app.use("/api/categorias", categoriesRoutes);
app.use("/api/productos", productsRoutes);
app.use("/api/carrito", cartRoutes);
app.use("/api/ordenes", ordersRoutes);
app.use("/api/resenas", reviewsRoutes);

// Manejo global de errores
app.use(errorHandler);

const PORT = process.env.PORT || 4000;
connectDB(process.env.MONGO_URI).then(() => {
  app.listen(PORT, () => console.log(`API escuchando en http://localhost:${PORT}`));
});

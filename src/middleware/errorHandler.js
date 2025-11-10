// src/middleware/errorHandler.js
import { fail } from "../utils/response.js";

export function errorHandler(err, req, res, next) {
  console.error("[Error]", err);
  const status = err.status || 500;
  res.status(status).json(fail(err.message || "Error interno", status));
}

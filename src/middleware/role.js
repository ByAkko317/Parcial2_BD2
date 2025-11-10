// src/middleware/role.js
export function requireAdmin(req, res, next) {
  if (req.user?.role !== "ADMIN")
    return res.status(403).json({ success: false, error: "Requiere rol ADMIN" });
  next();
}

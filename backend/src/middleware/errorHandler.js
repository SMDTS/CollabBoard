// src/middleware/errorHandler.js
import { NotFoundError } from "../utils/AppError.js";

export function errorHandler(err, req, res, next) {
  const status = err.status ?? 500;
  const body = {
    message: status === 500 ? "Something went wrong" : err.message,
    code: err.code ?? "INTERNAL_ERROR",
    requestId: req.id,
  };
  if (err.details) body.details = err.details;
  if (status >= 500) console.error(req.id, err);
  res.status(status).json({ error: body });
}

export function notFoundHandler(req, res, next) {
  next(new NotFoundError("Route"));
}

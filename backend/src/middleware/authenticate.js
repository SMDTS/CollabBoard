import { verifyToken } from "../utils/jwt.js";
import { UnauthorizedError } from "../utils/AppError.js";


export function authenticate(req, res, next) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    return next(new UnauthorizedError("Missing or malformed Authorization header"));
  }

  const token = header.slice("Bearer ".length);
  try {
    const payload = verifyToken(token);
    req.user = { id: payload.sub };
    next();
  } catch {
    next(new UnauthorizedError("Invalid or expired token"));
  }
}

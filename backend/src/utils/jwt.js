import jwt from "jsonwebtoken";
import { config } from "../config.js";

const EXPIRES_IN = "7d";

export function signToken(userId) {
  return jwt.sign({ sub: userId }, config.jwtSecret, { expiresIn: EXPIRES_IN });
}

// Returns the decoded payload, or throws if invalid/expired — caller
// (authenticate middleware) decides what to do with that.
export function verifyToken(token) {
  return jwt.verify(token, config.jwtSecret);
}

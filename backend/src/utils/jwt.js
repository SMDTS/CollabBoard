import jwt from "jsonwebtoken";
import { config } from "../config.js";

const EXPIRES_IN = "7d";

export function signToken(userId) {
  return jwt.sign({ sub: userId }, config.jwtSecret, { expiresIn: EXPIRES_IN });
}

export function verifyToken(token) {
  return jwt.verify(token, config.jwtSecret);
}

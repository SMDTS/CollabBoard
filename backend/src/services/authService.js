import bcrypt from "bcryptjs";
import * as userRepository from "../repositories/userRepository.js";
import { signToken } from "../utils/jwt.js";
import { ConflictError, UnauthorizedError } from "../utils/AppError.js";

const SALT_ROUNDS = 10;

export async function register({ name, email, password }) {
  const existing = userRepository.findByEmail(email);
  if (existing) throw new ConflictError("An account with that email already exists");

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
  const user = userRepository.create({ name, email, passwordHash });

  const token = signToken(user.id);
  return { token, user: toPublicUser(user) };
}

export async function login({ email, password }) {
  const user = userRepository.findByEmail(email);

  if (!user) throw new UnauthorizedError();

  const matches = await bcrypt.compare(password, user.passwordHash);
  if (!matches) throw new UnauthorizedError();

  const token = signToken(user.id);
  return { token, user: toPublicUser(user) };
}

export function getUserById(id) {
  const user = userRepository.findById(id);
  if (!user) throw new UnauthorizedError("User no longer exists");
  return toPublicUser(user);
}


function toPublicUser(user) {
  return { id: user.id, name: user.name, email: user.email };
}

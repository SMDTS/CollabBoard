import bcrypt from "bcryptjs";
import * as userRepository from "../repositories/userRepository.js";
import { signToken } from "../utils/jwt.js";
import { ConflictError, UnauthorizedError } from "../utils/AppError.js";

const SALT_ROUNDS = 10;

export async function register({ name, email, password }) {
  const existing = await userRepository.findByEmail(email);
  if (existing) throw new ConflictError("An account with that email already exists");

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

  let user;
  try {
    user = await userRepository.create({ name, email, passwordHash });
  } catch (err) {
    // Race condition guard: two registrations for the same email arriving
    // at nearly the same instant could both pass the findByEmail check
    // above before either finishes writing. MongoDB's unique index on
    // email is the real source of truth — code 11000 is its duplicate-key
    // error. Convert it to our normal error shape instead of letting a
    // raw MongoServerError reach the client as a 500.
    if (err.code === 11000) {
      throw new ConflictError("An account with that email already exists");
    }
    throw err;
  }

  const token = signToken(user.id);
  return { token, user: toPublicUser(user) };
}

export async function login({ email, password }) {
  const user = await userRepository.findByEmail(email);

  if (!user) throw new UnauthorizedError();

  const matches = await bcrypt.compare(password, user.passwordHash);
  if (!matches) throw new UnauthorizedError();

  const token = signToken(user.id);
  return { token, user: toPublicUser(user) };
}

export async function getUserById(id) {
  const user = await userRepository.findById(id);
  if (!user) throw new UnauthorizedError("User no longer exists");
  return toPublicUser(user);
}

function toPublicUser(user) {
  return { id: user.id, name: user.name, email: user.email };
}

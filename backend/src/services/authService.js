import bcrypt from "bcryptjs";
import crypto from "crypto";
import * as userRepository from "../repositories/userRepository.js";
import { signToken } from "../utils/jwt.js";
import { sendEmail } from "../utils/emailService.js";
import { config } from "../config.js";
import { ConflictError, UnauthorizedError } from "../utils/AppError.js";

const SALT_ROUNDS = 10;
const RESET_TOKEN_BYTES = 32;
const RESET_TOKEN_TTL_MS = 60 * 60 * 1000; // 1 hour

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

// A raw token is hashed the same way a password is (one-way, sha256 is
// fine here since it's a random 32-byte value, not something low-entropy
// like a password that needs bcrypt's slowness against brute force).
function hashResetToken(rawToken) {
  return crypto.createHash("sha256").update(rawToken).digest("hex");
}

// Deliberately gives the same response whether or not the email is
// registered — replying "no account with that email" would let anyone
// probe your user list one address at a time. The reset link only
// actually goes out if the account exists; the caller can't tell either
// way from the response alone.
export async function requestPasswordReset(email) {
  const user = await userRepository.findByEmail(email);
  if (!user) return;

  const rawToken = crypto.randomBytes(RESET_TOKEN_BYTES).toString("hex");
  const tokenHash = hashResetToken(rawToken);
  const expires = new Date(Date.now() + RESET_TOKEN_TTL_MS);

  await userRepository.setPasswordResetToken(user.id, tokenHash, expires);

  const resetLink = `${config.clientOrigin}/reset-password?token=${rawToken}`;
  await sendEmail({
    to: user.email,
    subject: "Reset your Flowty password",
    text:
      `Hi ${user.name},\n\n` +
      `Someone requested a password reset for your Flowty account. If this was you, click the link below — it expires in 1 hour:\n\n` +
      `${resetLink}\n\n` +
      `If you didn't request this, you can safely ignore this email.`,
  });
}

export async function resetPassword(rawToken, newPassword) {
  const tokenHash = hashResetToken(rawToken);
  const user = await userRepository.findByValidResetToken(tokenHash);
  if (!user) {
    throw new UnauthorizedError("This reset link is invalid or has expired");
  }

  const passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);
  await userRepository.resetPassword(user.id, passwordHash);
}

function toPublicUser(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    avatarUrl: user.avatarUrl || null,
    preferences: user.preferences ?? { notifyAssigned: true, notifyActivity: true, notifyWeekly: false },
  };
}

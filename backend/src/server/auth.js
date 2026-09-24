import { createHash, randomBytes, scrypt as scryptCallback, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import pool from "./db.js";
import { ApiError } from "./validation.js";

const scrypt = promisify(scryptCallback);
const COOKIE_NAME = "commercity_session";
const SESSION_DAYS = Number(process.env.SESSION_DAYS || 7);

export function publicUser(user) {
  return { id: user.id, name: user.name, email: user.email, role: user.role, active: Boolean(user.active) };
}

export async function hashPassword(password) {
  const salt = randomBytes(16);
  const derived = await scrypt(password, salt, 64);
  return `scrypt$${salt.toString("hex")}$${derived.toString("hex")}`;
}

export async function comparePassword(password, stored) {
  const [algorithm, saltHex, hashHex] = String(stored).split("$");
  if (algorithm !== "scrypt" || !/^[a-f0-9]{32}$/.test(saltHex || "") || !/^[a-f0-9]{128}$/.test(hashHex || "")) return false;
  const derived = await scrypt(password, Buffer.from(saltHex, "hex"), 64);
  return timingSafeEqual(derived, Buffer.from(hashHex, "hex"));
}

function sessionDigest(token) {
  return createHash("sha256").update(token).digest("hex");
}

function cookieOptions() {
  const secure = process.env.COOKIE_SECURE === "true";
  return `Path=/; HttpOnly; SameSite=Lax; Max-Age=${SESSION_DAYS * 86400}${secure ? "; Secure" : ""}`;
}

export async function createSession(userId, res) {
  const token = randomBytes(32).toString("base64url");
  await pool.execute("INSERT INTO sessions (user_id, token_hash, expires_at) VALUES (?, ?, DATE_ADD(UTC_TIMESTAMP(), INTERVAL ? DAY))", [userId, sessionDigest(token), SESSION_DAYS]);
  res.setHeader("Set-Cookie", `${COOKIE_NAME}=${token}; ${cookieOptions()}`);
}

export async function destroySession(req, res) {
  const token = readCookie(req, COOKIE_NAME);
  if (token) await pool.execute("DELETE FROM sessions WHERE token_hash = ?", [sessionDigest(token)]);
  res.setHeader("Set-Cookie", `${COOKIE_NAME}=; ${cookieOptions().replace(/Max-Age=\d+/, "Max-Age=0")}`);
}

function readCookie(req, name) {
  const cookies = req.headers.cookie?.split(";") || [];
  for (const part of cookies) {
    const index = part.indexOf("=");
    if (index > 0 && part.slice(0, index).trim() === name) return part.slice(index + 1).trim();
  }
  return null;
}

export async function authenticate(req, res, next) {
  try {
    const token = readCookie(req, COOKIE_NAME);
    if (!token || token.length > 200) throw new ApiError(401, "No autorizado");
    const [users] = await pool.execute("SELECT u.id, u.name, u.email, u.role, u.active FROM sessions s JOIN users u ON u.id = s.user_id WHERE s.token_hash = ? AND s.expires_at > UTC_TIMESTAMP() LIMIT 1", [sessionDigest(token)]);
    if (!users.length || !users[0].active) throw new ApiError(401, "No autorizado");
    req.user = users[0];
    next();
  } catch (error) {
    next(error);
  }
}

export function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) return next(new ApiError(403, "Acceso denegado"));
    next();
  };
}

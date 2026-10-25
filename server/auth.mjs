import { randomBytes, scrypt, timingSafeEqual, createHash } from "node:crypto";
import { promisify } from "node:util";
const scryptAsync = promisify(scrypt);
export const tokenHash = (token) =>
  createHash("sha256").update(token).digest("hex");
export async function hashPassword(
  password,
  salt = randomBytes(16).toString("hex"),
) {
  const hash = await scryptAsync(password, salt, 64);
  return { salt, hash: hash.toString("hex") };
}
export async function verifyPassword(password, user) {
  const { hash } = await hashPassword(password, user.salt);
  const expected = Buffer.from(user.password_hash, "hex");
  const actual = Buffer.from(hash, "hex");
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}
export function createSession(db, userId) {
  const token = randomBytes(32).toString("hex");
  db.prepare("DELETE FROM sessions WHERE expires < ?").run(Date.now());
  db.prepare(
    "INSERT INTO sessions(token_hash,user_id,expires) VALUES(?,?,?)",
  ).run(tokenHash(token), userId, Date.now() + 7 * 86400000);
  return token;
}
export function sessionUser(db, req) {
  const token = req.headers.authorization?.match(
    /^Bearer ([a-f0-9]{64})$/i,
  )?.[1];
  if (!token) return null;
  return (
    db
      .prepare(
        "SELECT users.*, sessions.token_hash AS session_hash FROM users JOIN sessions ON sessions.user_id=users.id WHERE sessions.token_hash=? AND sessions.expires>?",
      )
      .get(tokenHash(token), Date.now()) || null
  );
}

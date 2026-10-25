import { DatabaseSync } from "node:sqlite";
import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
export const defaultPath = fileURLToPath(
  new URL("./data/forkly.sqlite", import.meta.url),
);
export function openDatabase(path = process.env.DB_PATH || defaultPath) {
  if (path !== ":memory:")
    mkdirSync(dirname(resolve(path)), { recursive: true });
  const db = new DatabaseSync(path);
  db.exec(`PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON; PRAGMA busy_timeout=5000;
    CREATE TABLE IF NOT EXISTS users (id TEXT PRIMARY KEY, email TEXT UNIQUE NOT NULL, salt TEXT NOT NULL, password_hash TEXT NOT NULL, data TEXT NOT NULL, created_at TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS sessions (token_hash TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE, expires INTEGER NOT NULL);
    CREATE TABLE IF NOT EXISTS orders (id TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id), data TEXT NOT NULL, created_at TEXT NOT NULL);
    CREATE INDEX IF NOT EXISTS orders_user_idx ON orders(user_id, created_at);
    CREATE TABLE IF NOT EXISTS idempotency (user_id TEXT NOT NULL REFERENCES users(id), key TEXT NOT NULL, fingerprint TEXT NOT NULL, order_id TEXT NOT NULL REFERENCES orders(id), PRIMARY KEY(user_id, key));
    CREATE TABLE IF NOT EXISTS reviews (order_id TEXT PRIMARY KEY REFERENCES orders(id), user_id TEXT NOT NULL REFERENCES users(id), data TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS messages (id TEXT PRIMARY KEY, order_id TEXT NOT NULL REFERENCES orders(id), user_id TEXT NOT NULL REFERENCES users(id), role TEXT NOT NULL, text TEXT NOT NULL, created_at TEXT NOT NULL);
    CREATE INDEX IF NOT EXISTS messages_user_idx ON messages(user_id, created_at);
    PRAGMA user_version=1;`);
  return db;
}

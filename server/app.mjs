import { createServer } from "node:http";
import { randomUUID, createHash } from "node:crypto";
import { readFile, stat } from "node:fs/promises";
import { extname, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import {
  foods,
  restaurants,
  coupons,
  initialState,
  getFood,
} from "../shared/catalog.mjs";
import { makeOrder, validateAddress } from "../shared/order.mjs";
import { openDatabase } from "./database.mjs";
import {
  hashPassword,
  verifyPassword,
  createSession,
  sessionUser,
} from "./auth.mjs";
class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}
const fail = (status, text) => {
  throw new HttpError(status, text);
};
const checkPassword = (password) => {
  if (
    typeof password !== "string" ||
    password.length < 8 ||
    password.length > 128
  )
    fail(400, "Password must be 8–128 characters.");
};
const checkEmail = (value) => {
  if (
    typeof value !== "string" ||
    value.length > 254 ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
  )
    fail(400, "Enter a valid email address.");
  return value.toLowerCase().trim();
};
async function body(req) {
  if (!req.headers["content-type"]?.includes("application/json"))
    fail(415, "Use application/json.");
  let data = "";
  let length = 0;
  for await (const chunk of req) {
    length += chunk.length;
    if (length > 65536) fail(413, "Request is too large.");
    data += chunk;
  }
  if (!data) return {};
  try {
    const value = JSON.parse(data);
    if (value === null || Array.isArray(value) || typeof value !== "object")
      fail(400, "Provide a JSON object.");
    return value;
  } catch (e) {
    if (e instanceof HttpError) throw e;
    fail(400, "Invalid JSON.");
  }
}
function userState(db, user) {
  return {
    ...JSON.parse(user.data),
    signedIn: true,
    orders: db
      .prepare(
        "SELECT data FROM orders WHERE user_id=? ORDER BY created_at DESC",
      )
      .all(user.id)
      .map((r) => JSON.parse(r.data)),
    reviews: db
      .prepare("SELECT data FROM reviews WHERE user_id=?")
      .all(user.id)
      .map((r) => JSON.parse(r.data)),
    messages: db
      .prepare(
        "SELECT id,order_id AS orderId,role,text,created_at AS createdAt FROM messages WHERE user_id=? ORDER BY created_at",
      )
      .all(user.id),
  };
}
function validatePatch(old, patch, email) {
  if (
    Object.keys(patch).some(
      (k) => !["profile", "addresses", "favorites", "settings"].includes(k),
    )
  )
    fail(
      400,
      "Only profile, addresses, favorites, and settings can be edited here.",
    );
  const next = { ...old };
  if (patch.profile !== undefined) {
    const p = patch.profile;
    if (
      !p ||
      typeof p.name !== "string" ||
      p.name.trim().length < 2 ||
      p.name.length > 80
    )
      fail(400, "Name must be 2–80 characters.");
    if (checkEmail(p.email) !== email)
      fail(400, "Sign-in email cannot be changed here.");
    if (p.phone && !/^\d{10}$/.test(p.phone))
      fail(400, "Enter a 10-digit phone number.");
    next.profile = { name: p.name.trim(), email, phone: String(p.phone || "") };
  }
  if (patch.addresses !== undefined) {
    if (!Array.isArray(patch.addresses) || patch.addresses.length > 10)
      fail(400, "Save up to 10 addresses.");
    const addresses = patch.addresses.map(validateAddress);
    if (
      addresses.some((a) => !/^[\w-]{1,80}$/.test(a.id)) ||
      new Set(addresses.map((a) => a.id)).size !== addresses.length
    )
      fail(400, "Address IDs must be valid and unique.");
    if (addresses.length && addresses.filter((a) => a.isDefault).length !== 1)
      fail(400, "Choose exactly one default address.");
    next.addresses = addresses;
  }
  if (patch.favorites !== undefined) {
    if (
      !Array.isArray(patch.favorites) ||
      patch.favorites.length > foods.length ||
      patch.favorites.some((id) => !getFood(id))
    )
      fail(400, "Favorite dishes must exist on the menu.");
    next.favorites = [...new Set(patch.favorites)];
  }
  if (patch.settings !== undefined) {
    const settings = patch.settings;
    if (
      !settings ||
      typeof settings !== "object" ||
      ["orderUpdates", "offers", "contactless"].some(
        (k) => typeof settings[k] !== "boolean",
      )
    )
      fail(400, "Provide valid preference switches.");
    next.settings = {
      orderUpdates: settings.orderUpdates,
      offers: settings.offers,
      contactless: settings.contactless,
    };
    if (settings.cardNickname !== undefined) {
      if (
        typeof settings.cardNickname !== "string" ||
        settings.cardNickname.length > 40
      )
        fail(400, "Card nickname must be at most 40 characters.");
      next.settings.cardNickname = settings.cardNickname;
    }
  }
  return next;
}
export function createApp({
  dbPath,
  allowedOrigins,
  staticDir,
  rateLimit = true,
} = {}) {
  const db = openDatabase(dbPath);
  const origins =
    allowedOrigins ||
    (
      process.env.ALLOWED_ORIGINS ||
      "http://localhost:5173,http://127.0.0.1:5173,http://localhost:4000,http://127.0.0.1:4000"
    )
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
  const dist = resolve(
    staticDir || fileURLToPath(new URL("../dist/", import.meta.url)),
  );
  const attempts = new Map();
  const cleanup = setInterval(() => {
    for (const [key, value] of attempts)
      if (value.expires < Date.now()) attempts.delete(key);
  }, 60000).unref();
  function ownedOrder(user, id) {
    const row = db
      .prepare("SELECT * FROM orders WHERE id=? AND user_id=?")
      .get(id, user.id);
    if (!row) fail(404, "Order not found.");
    return JSON.parse(row.data);
  }
  function persistOrder(order) {
    db.prepare("UPDATE orders SET data=? WHERE id=?").run(
      JSON.stringify(order),
      order.id,
    );
  }
  const server = createServer(async (req, res) => {
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("X-Frame-Options", "DENY");
    res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
    const send = (data, status = 200) => {
      res.writeHead(status, {
        "Content-Type": "application/json; charset=utf-8",
        "Cache-Control": "no-store",
      });
      res.end(JSON.stringify(data));
    };
    try {
      const path = new URL(req.url, "http://localhost").pathname;
      if (path.startsWith("/api")) {
        const origin = req.headers.origin;
        if (origin) {
          if (!origins.includes(origin))
            fail(
              403,
              "This frontend origin is not allowed by ALLOWED_ORIGINS.",
            );
          res.setHeader("Access-Control-Allow-Origin", origin);
          res.setHeader("Vary", "Origin");
          res.setHeader(
            "Access-Control-Allow-Headers",
            "Content-Type,Authorization,Idempotency-Key",
          );
          res.setHeader(
            "Access-Control-Allow-Methods",
            "GET,POST,PATCH,OPTIONS",
          );
        }
        if (req.method === "OPTIONS") {
          res.writeHead(204);
          return res.end();
        }
        if (rateLimit) {
          const key = `${req.socket.remoteAddress}:${path.startsWith("/api/auth") ? "auth" : "api"}`;
          const prior = attempts.get(key);
          const item =
            prior && prior.expires > Date.now()
              ? prior
              : { count: 0, expires: Date.now() + 60000 };
          item.count++;
          attempts.set(key, item);
          if (item.count > (path.startsWith("/api/auth") ? 20 : 180)) {
            res.setHeader("Retry-After", "60");
            fail(429, "Too many requests. Please try again in a minute.");
          }
        }
        if (req.method === "GET" && path === "/api/health")
          return send({
            service: "forkly-api",
            ok: true,
            payment: "cash-on-delivery",
          });
        if (req.method === "GET" && path === "/api/catalog")
          return send({ foods, restaurants, coupons });
        if (
          req.method === "POST" &&
          ["/api/auth/register", "/api/auth/login"].includes(path)
        ) {
          const input = await body(req);
          const email = checkEmail(input.email);
          checkPassword(input.password);
          let user = db.prepare("SELECT * FROM users WHERE email=?").get(email);
          if (path.endsWith("register")) {
            if (
              typeof input.name !== "string" ||
              input.name.trim().length < 2 ||
              input.name.length > 80
            )
              fail(400, "Name must be 2–80 characters.");
            if (user)
              fail(
                409,
                "An account with this email already exists. Sign in instead.",
              );
            const { hash, salt } = await hashPassword(input.password);
            const id = randomUUID();
            const data = {
              ...initialState(),
              profile: { name: input.name.trim(), email, phone: "" },
              addresses: [],
            };
            delete data.orders;
            delete data.reviews;
            delete data.messages;
            delete data.signedIn;
            try {
              db.prepare(
                "INSERT INTO users(id,email,salt,password_hash,data,created_at) VALUES(?,?,?,?,?,?)",
              ).run(
                id,
                email,
                salt,
                hash,
                JSON.stringify(data),
                new Date().toISOString(),
              );
            } catch (e) {
              if (e.message.includes("UNIQUE"))
                fail(409, "An account with this email already exists.");
              throw e;
            }
            user = db.prepare("SELECT * FROM users WHERE id=?").get(id);
          } else {
            if (!user) {
              await hashPassword(input.password, "unregistered-account-salt");
              fail(401, "Email or password is incorrect.");
            }
            if (!(await verifyPassword(input.password, user)))
              fail(401, "Email or password is incorrect.");
          }
          return send(
            {
              token: createSession(db, user.id),
              profile: JSON.parse(user.data).profile,
            },
            path.endsWith("register") ? 201 : 200,
          );
        }
        const user = sessionUser(db, req);
        if (!user)
          fail(
            401,
            "Please sign in to continue. Your session may have expired.",
          );
        if (path === "/api/state" && req.method === "GET")
          return send(userState(db, user));
        if (path === "/api/state" && req.method === "PATCH") {
          const updated = validatePatch(
            JSON.parse(user.data),
            await body(req),
            user.email,
          );
          db.prepare("UPDATE users SET data=? WHERE id=?").run(
            JSON.stringify(updated),
            user.id,
          );
          return send(
            userState(db, { ...user, data: JSON.stringify(updated) }),
          );
        }
        if (path === "/api/auth/logout" && req.method === "POST") {
          db.prepare("DELETE FROM sessions WHERE token_hash=?").run(
            user.session_hash,
          );
          return send({ ok: true });
        }
        if (path === "/api/auth/password" && req.method === "POST") {
          const input = await body(req);
          checkPassword(input.newPassword);
          if (
            typeof input.currentPassword !== "string" ||
            input.currentPassword.length > 128 ||
            !(await verifyPassword(input.currentPassword, user))
          )
            fail(400, "Your current password is incorrect.");
          const { salt, hash } = await hashPassword(input.newPassword);
          db.prepare("UPDATE users SET salt=?,password_hash=? WHERE id=?").run(
            salt,
            hash,
            user.id,
          );
          db.prepare(
            "DELETE FROM sessions WHERE user_id=? AND token_hash<>?",
          ).run(user.id, user.session_hash);
          return send({ ok: true });
        }
        if (path === "/api/orders" && req.method === "GET")
          return send(userState(db, user).orders);
        if (path === "/api/orders" && req.method === "POST") {
          const input = await body(req);
          const key = req.headers["idempotency-key"];
          if (typeof key !== "string" || !/^[\w-]{8,100}$/.test(key))
            fail(
              400,
              "Send a unique Idempotency-Key (8–100 characters) with the order.",
            );
          const fingerprint = createHash("sha256")
            .update(JSON.stringify(input))
            .digest("hex");
          const existing = db
            .prepare("SELECT * FROM idempotency WHERE user_id=? AND key=?")
            .get(user.id, key);
          if (existing) {
            if (existing.fingerprint !== fingerprint)
              fail(
                409,
                "This checkout key was already used for different items.",
              );
            return send(ownedOrder(user, existing.order_id));
          }
          const order = makeOrder(input);
          db.exec("BEGIN IMMEDIATE");
          try {
            db.prepare(
              "INSERT INTO orders(id,user_id,data,created_at) VALUES(?,?,?,?)",
            ).run(order.id, user.id, JSON.stringify(order), order.createdAt);
            db.prepare(
              "INSERT INTO idempotency(user_id,key,fingerprint,order_id) VALUES(?,?,?,?)",
            ).run(user.id, key, fingerprint, order.id);
            db.exec("COMMIT");
          } catch (e) {
            db.exec("ROLLBACK");
            throw e;
          }
          return send(order, 201);
        }
        const match = path.match(
          /^\/api\/orders\/([^/]+)(?:\/(cancel|review|messages))?$/,
        );
        if (match) {
          const [, id, action] = match;
          const order = ownedOrder(user, id);
          if (!action && req.method === "GET") return send(order);
          if (action === "cancel" && req.method === "POST") {
            if (order.status !== "placed")
              fail(409, "Only newly confirmed orders can be cancelled.");
            order.status = "cancelled";
            persistOrder(order);
            return send(order);
          }
          if (action === "review" && req.method === "POST") {
            const input = await body(req);
            if (order.status !== "delivered")
              fail(409, "Reviews can be added after delivery.");
            if (
              !Number.isInteger(input.rating) ||
              input.rating < 1 ||
              input.rating > 5 ||
              typeof input.comment !== "string" ||
              input.comment.trim().length < 3 ||
              input.comment.length > 1000
            )
              fail(400, "Choose 1–5 stars and write 3–1000 characters.");
            const review = {
              orderId: id,
              rating: input.rating,
              comment: input.comment.trim(),
              createdAt: new Date().toISOString(),
            };
            db.prepare(
              "INSERT INTO reviews(order_id,user_id,data) VALUES(?,?,?) ON CONFLICT(order_id) DO UPDATE SET data=excluded.data",
            ).run(id, user.id, JSON.stringify(review));
            return send(review);
          }
          if (action === "messages" && req.method === "POST") {
            const input = await body(req);
            if (
              typeof input.text !== "string" ||
              !input.text.trim() ||
              input.text.length > 1000
            )
              fail(400, "Write a message of 1–1000 characters.");
            const message = {
              id: randomUUID(),
              orderId: id,
              role: "customer",
              text: input.text.trim(),
              createdAt: new Date().toISOString(),
            };
            db.prepare(
              "INSERT INTO messages(id,order_id,user_id,role,text,created_at) VALUES(?,?,?,?,?,?)",
            ).run(
              message.id,
              id,
              user.id,
              message.role,
              message.text,
              message.createdAt,
            );
            return send(message, 201);
          }
        }
        fail(404, "API endpoint not found.");
      }
      if (!["GET", "HEAD"].includes(req.method))
        fail(405, "Method not allowed.");
      let decoded;
      try {
        decoded = decodeURIComponent(path);
      } catch {
        fail(400, "Invalid path.");
      }
      const candidate = resolve(dist, `.${decoded}`);
      if (candidate !== dist && !candidate.startsWith(dist + sep))
        fail(403, "Path not allowed.");
      let file = candidate;
      try {
        if (!(await stat(file)).isFile()) file = resolve(dist, "index.html");
      } catch {
        if (extname(path)) fail(404, "File not found.");
        file = resolve(dist, "index.html");
      }
      let bytes;
      try {
        bytes = await readFile(file);
      } catch {
        fail(
          503,
          "Frontend is not built. Run npm run build, or use npm run dev:full.",
        );
      }
      const types = {
        ".html": "text/html; charset=utf-8",
        ".js": "application/javascript; charset=utf-8",
        ".css": "text/css; charset=utf-8",
        ".svg": "image/svg+xml",
        ".jpg": "image/jpeg",
        ".png": "image/png",
        ".woff2": "font/woff2",
      };
      res.writeHead(200, {
        "Content-Type": types[extname(file)] || "application/octet-stream",
        "Cache-Control":
          extname(file) === ".html" ? "no-cache" : "public, max-age=3600",
      });
      res.end(req.method === "HEAD" ? undefined : bytes);
    } catch (error) {
      const status =
        error.status || (error.code?.startsWith("ERR_SQLITE") ? 500 : 400);
      if (status >= 500) console.error("Forkly API error:", error.message);
      if (!res.headersSent)
        send(
          {
            error:
              status >= 500
                ? "The server could not complete this request."
                : error.message,
          },
          status,
        );
      else res.end();
    }
  });
  server.on("close", () => {
    clearInterval(cleanup);
    db.close();
  });
  server.requestTimeout = 30000;
  server.headersTimeout = 10000;
  return { server, db };
}

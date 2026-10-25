import test from "node:test";
import assert from "node:assert/strict";
import { once } from "node:events";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createApp } from "../server/app.mjs";
import { demoAddress } from "../shared/catalog.mjs";
let app, base, tokenA, tokenB, savedOrder, directory;
const password = "Test-only-pass-123!";
const payload = {
  items: [
    {
      foodId: "classic-burger",
      quantity: 2,
      size: "large",
      extras: ["cheese"],
      unitPrice: 1,
    },
  ],
  coupon: "WELCOME20",
  tip: 2000,
  address: demoAddress,
  payment: "cash",
};
async function request(
  path,
  { method = "GET", token, body, headers = {} } = {},
) {
  const response = await fetch(`${base}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  const data = await response.json();
  return { status: response.status, data };
}
test.before(async () => {
  directory = await mkdtemp(join(tmpdir(), "forkly-test-"));
  app = createApp({ dbPath: join(directory, "test.sqlite"), rateLimit: false });
  app.server.listen(0, "127.0.0.1");
  await once(app.server, "listening");
  base = `http://127.0.0.1:${app.server.address().port}/api`;
});
test.after(async () => {
  await new Promise((resolve) => app.server.close(resolve));
  await rm(directory, { recursive: true, force: true });
});
test("Health/catalog are public; private data requires authentication", async () => {
  assert.equal((await request("/health")).data.service, "forkly-api");
  assert.equal((await request("/catalog")).data.foods.length, 24);
  assert.equal((await request("/state")).status, 401);
  assert.equal(
    (
      await request("/health", {
        headers: { Origin: "https://untrusted.example" },
      })
    ).status,
    403,
  );
});
test("Registration and login create distinct accounts without storing plaintext passwords", async () => {
  const a = await request("/auth/register", {
    method: "POST",
    body: { name: "Test User A", email: "a@example.test", password },
  });
  assert.equal(a.status, 201);
  tokenA = a.data.token;
  const b = await request("/auth/register", {
    method: "POST",
    body: { name: "Test User B", email: "b@example.test", password },
  });
  assert.equal(b.status, 201);
  tokenB = b.data.token;
  const row = app.db
    .prepare("SELECT password_hash,salt FROM users WHERE email=?")
    .get("a@example.test");
  assert.notEqual(row.password_hash, password);
  assert.equal(row.password_hash.length, 128);
  assert.equal(row.salt.length, 32);
  assert.equal(
    (
      await request("/auth/login", {
        method: "POST",
        body: { email: "a@example.test", password: "wrongpass" },
      })
    ).status,
    401,
  );
  assert.equal(
    (
      await request("/auth/register", {
        method: "POST",
        body: { name: "Test", email: "a@example.test", password },
      })
    ).status,
    409,
  );
});
test("Account state updates validate addresses, favorites and protected fields", async () => {
  const updated = await request("/state", {
    method: "PATCH",
    token: tokenA,
    body: { addresses: [demoAddress], favorites: ["classic-burger"] },
  });
  assert.equal(updated.status, 200);
  assert.equal(updated.data.addresses.length, 1);
  assert.equal(
    (
      await request("/state", {
        method: "PATCH",
        token: tokenA,
        body: { orders: [] },
      })
    ).status,
    400,
  );
  assert.equal(
    (
      await request("/state", {
        method: "PATCH",
        token: tokenA,
        body: { favorites: ["invalid"] },
      })
    ).status,
    400,
  );
  assert.equal(
    (await request("/state", { token: tokenB })).data.addresses.length,
    0,
  );
});
test("Checkout recomputes prices, persists order and is idempotent", async () => {
  const options = {
    method: "POST",
    token: tokenA,
    headers: { "Idempotency-Key": "checkout-test-0001" },
    body: payload,
  };
  const result = await request("/orders", options);
  assert.equal(result.status, 201);
  assert.equal(result.data.total, 59452);
  savedOrder = result.data;
  const retry = await request("/orders", options);
  assert.equal(retry.status, 200);
  assert.equal(retry.data.id, savedOrder.id);
  assert.equal(
    (await request("/state", { token: tokenA })).data.orders.length,
    1,
  );
  const conflict = await request("/orders", {
    ...options,
    body: { ...payload, tip: 0 },
  });
  assert.equal(conflict.status, 409);
});
test("Users cannot read, cancel, review, or message another user’s order", async () => {
  for (const action of ["", "/cancel", "/review", "/messages"]) {
    const r = await request(`/orders/${savedOrder.id}${action}`, {
      token: tokenB,
      method: action ? "POST" : "GET",
      body: action
        ? { rating: 5, comment: "Test review", text: "Test" }
        : undefined,
    });
    assert.equal(r.status, 404);
  }
});
test("Invalid payment or cart leaves no additional order in the database", async () => {
  const bad = await request("/orders", {
    method: "POST",
    token: tokenA,
    headers: { "Idempotency-Key": "invalid-test-001" },
    body: { ...payload, payment: "demo-card" },
  });
  assert.equal(bad.status, 400);
  assert.equal(app.db.prepare("SELECT count(*) AS n FROM orders").get().n, 1);
});
test("Messages persist, reviews require delivery, and late cancellation is blocked", async () => {
  const m = await request(`/orders/${savedOrder.id}/messages`, {
    method: "POST",
    token: tokenA,
    body: { text: "Please ring the bell." },
  });
  assert.equal(m.status, 201);
  assert.equal(
    (await request("/state", { token: tokenA })).data.messages[0].text,
    "Please ring the bell.",
  );
  assert.equal(
    (
      await request(`/orders/${savedOrder.id}/review`, {
        method: "POST",
        token: tokenA,
        body: { rating: 5, comment: "Great food." },
      })
    ).status,
    409,
  );
  app.db
    .prepare("UPDATE orders SET data=? WHERE id=?")
    .run(JSON.stringify({ ...savedOrder, status: "delivered" }), savedOrder.id);
  assert.equal(
    (
      await request(`/orders/${savedOrder.id}/cancel`, {
        method: "POST",
        token: tokenA,
      })
    ).status,
    409,
  );
  assert.equal(
    (
      await request(`/orders/${savedOrder.id}/review`, {
        method: "POST",
        token: tokenA,
        body: { rating: 5, comment: "Great food." },
      })
    ).status,
    200,
  );
});
test("Password change revokes other sessions; logout revokes the active one", async () => {
  const second = await request("/auth/login", {
    method: "POST",
    body: { email: "a@example.test", password },
  });
  const token2 = second.data.token;
  assert.equal(
    (
      await request("/auth/password", {
        method: "POST",
        token: tokenA,
        body: {
          currentPassword: password,
          newPassword: "Another-test-pass-123!",
        },
      })
    ).status,
    200,
  );
  assert.equal((await request("/state", { token: token2 })).status, 401);
  assert.equal(
    (await request("/auth/logout", { method: "POST", token: tokenA })).status,
    200,
  );
  assert.equal((await request("/state", { token: tokenA })).status, 401);
});

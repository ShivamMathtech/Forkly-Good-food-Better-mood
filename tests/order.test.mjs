import test from "node:test";
import assert from "node:assert/strict";
import {
  calculateOrder,
  normalizeItems,
  validateAddress,
  makeOrder,
  demoOrderStatus,
} from "../shared/order.mjs";
import { demoAddress } from "../shared/catalog.mjs";
import { createId } from "../shared/id.mjs";
const burger = {
  foodId: "classic-burger",
  quantity: 1,
  size: "regular",
  extras: [],
};
test("Menu price is authoritative even when the client sends a forged price", () => {
  const result = calculateOrder([{ ...burger, unitPrice: 1, price: -999 }]);
  assert.equal(result.subtotal, 24900);
  assert.equal(result.tax, 1245);
  assert.equal(result.total, 29545);
});
test("Customizations and integer paise totals apply correctly", () => {
  const order = calculateOrder(
    [{ ...burger, size: "large", extras: ["cheese", "cheese"], quantity: 2 }],
    "welcome20",
    2000,
  );
  assert.equal(order.subtotal, 67800);
  assert.equal(order.discount, 13560);
  assert.equal(order.delivery, 0);
  assert.equal(order.tax, 2712);
  assert.equal(order.total, 59452);
});
test("Coupon minimums, cap, free shipping and invalid codes are enforced", () => {
  assert.throws(() => calculateOrder([burger], "WELCOME20"), /more/);
  assert.throws(() => calculateOrder([burger], "NOPE"), /not available/);
  assert.equal(calculateOrder([burger], "FREESHIP").delivery, 0);
  assert.equal(
    calculateOrder([{ ...burger, quantity: 10 }], "WELCOME20").discount,
    15000,
  );
});
test("Invalid quantities, sizes, add-ons, tips, and mixed restaurants are rejected", () => {
  for (const quantity of [0, -1, 21, 1.5, "2", NaN])
    assert.throws(() => normalizeItems([{ ...burger, quantity }]));
  assert.throws(() => normalizeItems([{ ...burger, size: "super" }]));
  assert.throws(() => normalizeItems([{ ...burger, extras: ["bogus"] }]));
  assert.throws(() => calculateOrder([burger], "", -1));
  assert.throws(() => calculateOrder([burger], "", 50001));
  assert.throws(() =>
    normalizeItems([burger, { foodId: "margherita", quantity: 1 }]),
  );
});
test("Addresses require recipient, street, phone, and PIN code", () => {
  assert.equal(validateAddress(demoAddress).city, "Dehradun");
  for (const field of ["name", "line", "phone", "city", "pincode"])
    assert.throws(() => validateAddress({ ...demoAddress, [field]: "" }));
});
test("Demo order progresses without a server and remains cancelled or delivered", () => {
  const order = makeOrder(
    { items: [burger], address: demoAddress, payment: "demo-card", tip: 0 },
    { demo: true },
  );
  const start = Date.parse(order.createdAt);
  assert.equal(demoOrderStatus(order, start), "placed");
  assert.equal(demoOrderStatus(order, start + 30001), "preparing");
  assert.equal(demoOrderStatus(order, start + 85001), "on_the_way");
  assert.equal(demoOrderStatus(order, start + 150001), "delivered");
  assert.equal(
    demoOrderStatus({ ...order, status: "cancelled" }, start + 200000),
    "cancelled",
  );
  assert.throws(
    () =>
      makeOrder({
        items: [burger],
        address: demoAddress,
        payment: "demo-card",
        tip: 0,
      }),
    /demo-only/,
  );
});
test("IDs are UUID v4 shaped and unique", () => {
  const ids = Array.from({ length: 200 }, createId);
  assert.equal(new Set(ids).size, 200);
  for (const id of ids)
    assert.match(
      id,
      /^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/,
    );
});

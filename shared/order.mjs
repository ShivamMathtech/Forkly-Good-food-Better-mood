import { createId } from "./id.mjs";
import { getFood, sizes, extras, coupons } from "./catalog.mjs";
export const statuses = ["placed", "preparing", "on_the_way", "delivered"];
export const statusLabels = {
  placed: "Order confirmed",
  preparing: "Preparing your food",
  on_the_way: "On the way",
  delivered: "Delivered",
  cancelled: "Cancelled",
};
export function normalizeItems(items) {
  if (!Array.isArray(items) || !items.length || items.length > 50)
    throw new Error("Add at least one item to your cart (maximum 50 lines).");
  let restaurantId;
  return items.map((item) => {
    const food = getFood(item.foodId);
    if (!food) throw new Error("One of the menu items is unavailable.");
    if (restaurantId && restaurantId !== food.restaurantId)
      throw new Error("Please order from one restaurant at a time.");
    restaurantId = food.restaurantId;
    if (
      !Number.isInteger(item.quantity) ||
      item.quantity < 1 ||
      item.quantity > 20
    )
      throw new Error("Item quantities must be between 1 and 20.");
    const size = sizes.find((s) => s.id === (item.size || "regular"));
    if (!size) throw new Error("Please select a valid portion size.");
    if (
      !Array.isArray(item.extras ?? []) ||
      (item.extras ?? []).some((x) => !extras.some((e) => e.id === x))
    )
      throw new Error("An add-on is unavailable.");
    const chosen = [...new Set(item.extras || [])];
    return {
      foodId: food.id,
      name: food.name,
      image: food.image,
      restaurantId: food.restaurantId,
      quantity: item.quantity,
      size: size.id,
      extras: chosen,
      note: String(item.note || "").slice(0, 200),
      unitPrice:
        food.price +
        size.price +
        chosen.reduce(
          (sum, id) => sum + extras.find((e) => e.id === id).price,
          0,
        ),
    };
  });
}
export function calculateOrder(rawItems, code = "", tip = 0) {
  const items = normalizeItems(rawItems);
  if (!Number.isInteger(tip) || tip < 0 || tip > 50000)
    throw new Error("Tip must be between ₹0 and ₹500.");
  const subtotal = items.reduce((n, i) => n + i.unitPrice * i.quantity, 0);
  const normalizedCode = String(code || "")
    .trim()
    .toUpperCase();
  const coupon = coupons.find((c) => c.code === normalizedCode);
  if (normalizedCode && !coupon)
    throw new Error("This promo code is not available.");
  if (coupon && subtotal < coupon.minimum)
    throw new Error(
      `Add items worth ₹${(coupon.minimum - subtotal) / 100} more to use ${coupon.code}.`,
    );
  const discount = coupon?.percent
    ? Math.min(Math.round((subtotal * coupon.percent) / 100), coupon.max)
    : 0;
  const delivery = subtotal >= 49900 || coupon?.freeDelivery ? 0 : 2900;
  const fee = 500;
  const tax = Math.round((subtotal - discount) * 0.05);
  return {
    items,
    restaurantId: items[0].restaurantId,
    subtotal,
    discount,
    delivery,
    fee,
    tax,
    tip,
    coupon: normalizedCode,
    total: subtotal - discount + delivery + fee + tax + tip,
  };
}
export function validateAddress(address) {
  if (!address || typeof address !== "object")
    throw new Error("Choose a delivery address.");
  if (
    typeof address.name !== "string" ||
    address.name.trim().length < 2 ||
    address.name.length > 80
  )
    throw new Error("Enter a recipient name (2–80 characters).");
  if (!/^\d{10}$/.test(address.phone || ""))
    throw new Error("Enter a 10-digit phone number.");
  if (
    typeof address.line !== "string" ||
    address.line.trim().length < 5 ||
    address.line.length > 200
  )
    throw new Error("Enter a complete street address.");
  if (
    typeof address.city !== "string" ||
    address.city.trim().length < 2 ||
    address.city.length > 60
  )
    throw new Error("Enter a valid city.");
  if (!/^[1-9]\d{5}$/.test(address.pincode || ""))
    throw new Error("Enter a valid 6-digit PIN code.");
  return {
    id: String(address.id || "").slice(0, 80),
    label: String(address.label || "Home").slice(0, 30),
    name: address.name.trim(),
    phone: address.phone,
    line: address.line.trim(),
    city: address.city.trim(),
    pincode: address.pincode,
    instructions: String(address.instructions || "").slice(0, 200),
    isDefault: Boolean(address.isDefault),
  };
}
export function demoOrderStatus(order, now = Date.now()) {
  if (order.status === "cancelled" || order.status === "delivered")
    return order.status;
  const elapsed = now - new Date(order.createdAt).getTime();
  return elapsed >= 150000
    ? "delivered"
    : elapsed >= 85000
      ? "on_the_way"
      : elapsed >= 30000
        ? "preparing"
        : "placed";
}
export function makeOrder(payload, { demo = false } = {}) {
  const totals = calculateOrder(payload.items, payload.coupon, payload.tip);
  const address = validateAddress(payload.address);
  if (!["cash", "demo-card", "demo-upi"].includes(payload.payment))
    throw new Error("Choose a payment method.");
  if (!demo && payload.payment !== "cash")
    throw new Error("Online payment is demo-only. Choose cash on delivery.");
  return {
    ...totals,
    id: `FK-${Date.now().toString(36).toUpperCase()}-${createId().slice(0, 6).toUpperCase()}`,
    address,
    payment: payload.payment,
    instructions: String(payload.instructions || "").slice(0, 300),
    status: "placed",
    createdAt: new Date().toISOString(),
    demo,
  };
}

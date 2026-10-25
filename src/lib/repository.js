import { initialState } from "../../shared/catalog.mjs";
import { makeOrder, demoOrderStatus } from "../../shared/order.mjs";
const KEY = "forkly-demo-v1";
const TOKEN = "forkly-api-token";
let volatileState = null;
export function readDemo() {
  if (volatileState) return structuredClone(volatileState);
  try {
    const raw = JSON.parse(localStorage.getItem(KEY));
    if (
      raw?.version === 1 &&
      Array.isArray(raw.state?.orders) &&
      Array.isArray(raw.state?.addresses) &&
      raw.state?.profile &&
      Array.isArray(raw.state?.favorites) &&
      Array.isArray(raw.state?.reviews) &&
      Array.isArray(raw.state?.messages)
    )
      return { ...initialState(), ...raw.state };
  } catch {
    /* A corrupt/blocked browser store should not break the demo. */
  }
  return initialState();
}
export function writeDemo(state) {
  volatileState = structuredClone(state);
  try {
    localStorage.setItem(KEY, JSON.stringify({ version: 1, state }));
    return true;
  } catch {
    return false;
  }
}
export const baseUrl = (import.meta.env.VITE_API_URL || "/api").replace(
  /\/$/,
  "",
);
export function getToken() {
  try {
    return sessionStorage.getItem(TOKEN);
  } catch {
    return null;
  }
}
function setToken(token) {
  try {
    token
      ? sessionStorage.setItem(TOKEN, token)
      : sessionStorage.removeItem(TOKEN);
  } catch {
    throw new Error(
      "This browser blocks session storage. Enable it to use API sign-in.",
    );
  }
}
export async function api(path, { method = "GET", body, headers = {} } = {}) {
  const response = await fetch(`${baseUrl}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {}),
      ...headers,
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
    signal: AbortSignal.timeout(8000),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok)
    throw new Error(data.error || `Request failed (${response.status}).`);
  return data;
}
export async function selectMode() {
  let override;
  try {
    override = sessionStorage.getItem("forkly-mode");
  } catch {
    /* Demo works without storage. */
  }
  const requested = override || import.meta.env.VITE_DATA_MODE || "demo";
  if (requested === "demo") return "demo";
  if (!["api", "auto"].includes(requested))
    throw new Error("VITE_DATA_MODE must be demo, api, or auto.");
  try {
    const health = await api("/health");
    if (health.service !== "forkly-api")
      throw new Error("The URL is not a Forkly API.");
    return "api";
  } catch (error) {
    if (requested === "auto") return "demo";
    throw new Error(`The API is unavailable. ${error.message}`);
  }
}
export async function signIn(mode, kind, fields) {
  if (mode === "demo")
    return {
      ...readDemo(),
      profile: {
        ...readDemo().profile,
        name: fields.name || readDemo().profile.name,
        email: fields.email,
      },
      signedIn: true,
    };
  const result = await api(`/auth/${kind}`, { method: "POST", body: fields });
  setToken(result.token);
  return api("/state");
}
export async function signOut(mode) {
  if (mode === "api") {
    await api("/auth/logout", { method: "POST" });
    setToken(null);
  }
}
export async function loadState(mode) {
  if (mode === "demo") return readDemo();
  if (!getToken())
    return {
      ...initialState(),
      profile: { name: "Guest", email: "", phone: "" },
      addresses: [],
    };
  return api("/state");
}
export async function saveState(mode, state, patch) {
  if (mode === "demo") {
    const next = { ...state, ...patch };
    writeDemo(next);
    return next;
  }
  return api("/state", { method: "PATCH", body: patch });
}
export async function placeOrder(mode, state, payload, key) {
  if (mode === "demo") {
    const order = makeOrder(payload, { demo: true });
    const next = { ...state, orders: [order, ...state.orders] };
    writeDemo(next);
    return { state: next, order };
  }
  const order = await api("/orders", {
    method: "POST",
    body: payload,
    headers: { "Idempotency-Key": key },
  });
  return { state: await loadState(mode), order };
}
export async function cancelOrder(mode, state, id) {
  if (mode === "api") {
    await api(`/orders/${id}/cancel`, { method: "POST" });
    return loadState(mode);
  }
  const order = state.orders.find((o) => o.id === id);
  if (!order || demoOrderStatus(order) !== "placed")
    throw new Error("Only newly confirmed orders can be cancelled.");
  const next = {
    ...state,
    orders: state.orders.map((o) =>
      o.id === id ? { ...o, status: "cancelled" } : o,
    ),
  };
  writeDemo(next);
  return next;
}

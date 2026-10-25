import { createId } from "../../shared/id.mjs";
import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { initialState } from "../../shared/catalog.mjs";
import { normalizeItems } from "../../shared/order.mjs";
import * as repo from "./repository.js";
const Context = createContext();
export const useApp = () => useContext(Context);
const CART_KEY = "forkly-cart-v1";
function readCart() {
  try {
    const raw = JSON.parse(localStorage.getItem(CART_KEY));
    return raw?.length
      ? normalizeItems(raw).map((i) => ({ ...i, key: createId() }))
      : [];
  } catch {
    return [];
  }
}
export function AppProvider({ children }) {
  const [state, setState] = useState(initialState);
  const [cart, setCart] = useState(readCart);
  const [mode, setMode] = useState(null);
  const [error, setError] = useState("");
  const [toast, setToast] = useState(null);
  const [food, setFood] = useState(null);
  const [replace, setReplace] = useState(null);
  const [coupon, setCoupon] = useState("");
  const stateRef = useRef(state);
  stateRef.current = state;
  const notify = (message, kind = "success") =>
    setToast({ message, kind, id: Date.now() });
  useEffect(() => {
    let alive = true;
    repo
      .selectMode()
      .then(async (m) => {
        const data = await repo.loadState(m);
        if (alive) {
          setMode(m);
          setState(data);
        }
      })
      .catch((e) => {
        if (alive) setError(e.message);
      });
    return () => {
      alive = false;
    };
  }, []);
  useEffect(() => {
    try {
      localStorage.setItem(CART_KEY, JSON.stringify(cart));
    } catch {
      /* Cart remains usable in memory. */
    }
  }, [cart]);
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(timer);
  }, [toast]);
  const patch = async (values) => {
    const next = await repo.saveState(mode, stateRef.current, values);
    setState(next);
    return next;
  };
  const add = (item) => {
    const normal = normalizeItems([item])[0];
    const keyFor = (i) =>
      JSON.stringify([i.foodId, i.size, [...i.extras].sort(), i.note]);
    const current = cart.find((i) => keyFor(i) === keyFor(normal));
    if (current && current.quantity + normal.quantity > 20)
      throw new Error("You can add up to 20 of the same item.");
    if (cart.length && cart[0].restaurantId !== normal.restaurantId) {
      setReplace(normal);
      return;
    }
    setCart((previous) =>
      current
        ? previous.map((i) =>
            i.key === current.key
              ? { ...i, quantity: i.quantity + normal.quantity }
              : i,
          )
        : [...previous, { ...normal, key: createId() }],
    );
    notify(`${normal.name} added to your cart`);
  };
  const value = {
    state,
    setState,
    cart,
    setCart,
    mode,
    error,
    toast,
    notify,
    food,
    setFood,
    replace,
    setReplace,
    coupon,
    setCoupon,
    patch,
    add,
    setQuantity(key, quantity) {
      setCart((c) =>
        quantity <= 0
          ? c.filter((i) => i.key !== key)
          : c.map((i) =>
              i.key === key ? { ...i, quantity: Math.min(20, quantity) } : i,
            ),
      );
    },
    async toggleFavorite(id) {
      if (mode === "api" && !state.signedIn)
        return notify("Sign in to save your favorites.", "error");
      try {
        await patch({
          favorites: state.favorites.includes(id)
            ? state.favorites.filter((x) => x !== id)
            : [...state.favorites, id],
        });
      } catch (e) {
        notify(e.message, "error");
      }
    },
    async login(kind, fields) {
      const next = await repo.signIn(mode, kind, fields);
      if (mode === "demo") repo.writeDemo(next);
      setState(next);
      notify(`Welcome, ${next.profile.name.split(" ")[0]}!`);
    },
    async logout() {
      await repo.signOut(mode);
      if (mode === "demo") {
        const next = { ...state, signedIn: false };
        repo.writeDemo(next);
        setState(next);
      } else
        setState({
          ...initialState(),
          profile: { name: "Guest", email: "", phone: "" },
          addresses: [],
        });
      setCart([]);
      notify("You are signed out.");
    },
    async checkout(payload, key) {
      const result = await repo.placeOrder(
        mode,
        stateRef.current,
        payload,
        key,
      );
      setState(result.state);
      setCart([]);
      setCoupon("");
      return result.order;
    },
    async cancel(id) {
      setState(await repo.cancelOrder(mode, stateRef.current, id));
      notify("Order cancelled.");
    },
    async refresh() {
      if (mode === "api" && state.signedIn)
        setState(await repo.loadState(mode));
    },
    async review(orderId, rating, comment) {
      if (mode === "api") {
        await repo.api(`/orders/${orderId}/review`, {
          method: "POST",
          body: { rating, comment },
        });
        setState(await repo.loadState(mode));
      } else {
        await patch({
          reviews: [
            { orderId, rating, comment, createdAt: new Date().toISOString() },
            ...state.reviews.filter((r) => r.orderId !== orderId),
          ],
        });
      }
    },
    async sendMessage(orderId, text) {
      if (mode === "api") {
        await repo.api(`/orders/${orderId}/messages`, {
          method: "POST",
          body: { text },
        });
        setState(await repo.loadState(mode));
      } else {
        const time = new Date().toISOString();
        await patch({
          messages: [
            ...state.messages,
            {
              id: createId(),
              orderId,
              text,
              role: "customer",
              createdAt: time,
            },
            {
              id: createId(),
              orderId,
              text: "Thanks for your message! This is a demo conversation. Your delivery instructions have been noted in this preview.",
              role: "support",
              createdAt: time,
            },
          ],
        });
      }
    },
    resetDemo() {
      const next = initialState();
      repo.writeDemo(next);
      setState(next);
      setCart([]);
      setCoupon("");
      notify("Demo reset. Ready for a fresh start!");
    },
  };
  return <Context.Provider value={value}>{children}</Context.Provider>;
}

import { createId } from "../../shared/id.mjs";
import React, { useEffect, useRef, useState } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import {
  UtensilsCrossed,
  House,
  Heart,
  ReceiptText,
  TicketPercent,
  UserRound,
  MapPin,
  ChevronDown,
  Search,
  ShoppingBag,
  ArrowRight,
  Bell,
  X,
  Plus,
  Minus,
  Star,
  Clock3,
  Bike,
  LogOut,
  Check,
  SlidersHorizontal,
  Leaf,
  ShieldCheck,
  ChevronRight,
} from "lucide-react";
import { useApp } from "../lib/store.jsx";
import {
  getRestaurant,
  imagePath,
  money,
  sizes,
  extras,
} from "../../shared/catalog.mjs";
import { calculateOrder } from "../../shared/order.mjs";
export const Logo = () => (
  <Link to="/" className="brand" aria-label="Forkly home">
    <span className="brand-icon">
      <UtensilsCrossed size={25} />
    </span>
    forkly<span className="brand-dot">.</span>
  </Link>
);
export function Button({ children, variant = "", className = "", ...props }) {
  return (
    <button className={`button ${variant} ${className}`} {...props}>
      {children}
    </button>
  );
}
export function Empty({
  icon: Icon = ShoppingBag,
  title,
  text,
  action,
  to = "/",
}) {
  return (
    <div className="empty">
      <div className="empty-icon">
        <Icon size={38} />
      </div>
      <h3>{title}</h3>
      <p>{text}</p>
      {action && (
        <Link className="button" to={to}>
          {action}
          <ArrowRight size={16} />
        </Link>
      )}
    </div>
  );
}
export const ErrorText = ({ children }) =>
  children ? (
    <p className="form-error" role="alert">
      {children}
    </p>
  ) : null;
export function Modal({ title, children, onClose, className = "" }) {
  const ref = useRef();
  useEffect(() => {
    const el = ref.current;
    el.showModal();
    const active = document.activeElement;
    return () => {
      el.close();
      active?.focus?.();
    };
  }, []);
  return (
    <dialog
      ref={ref}
      className={`modal ${className}`}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="modal-top">
        <h2>{title}</h2>
        <button
          className="icon-button"
          onClick={onClose}
          aria-label="Close dialog"
        >
          <X />
        </button>
      </div>
      {children}
    </dialog>
  );
}
export const Veg = ({ veg }) => (
  <span
    className={`veg ${veg ? "" : "nonveg"}`}
    title={veg ? "Vegetarian" : "Non-vegetarian"}
    aria-label={veg ? "Vegetarian" : "Non-vegetarian"}
  >
    <i />
  </span>
);
export function FoodCard({ food, compact = false }) {
  const { state, toggleFavorite, setFood } = useApp();
  const favorite = state.favorites.includes(food.id);
  return (
    <article className={`food-card ${compact ? "compact" : ""}`}>
      <div className="food-image-wrap">
        <button
          className="image-button"
          onClick={() => setFood(food)}
          aria-label={`View ${food.name}`}
        >
          <img src={imagePath(food.image)} alt={food.name} loading="lazy" />
        </button>
        {food.badge && <span className="food-badge">{food.badge}</span>}
        <button
          className={`favorite-button ${favorite ? "saved" : ""}`}
          aria-label={`${favorite ? "Remove" : "Save"} ${food.name}`}
          aria-pressed={favorite}
          onClick={() => toggleFavorite(food.id)}
        >
          <Heart size={17} fill={favorite ? "currentColor" : "none"} />
        </button>
      </div>
      <div className="food-card-body">
        <div className="food-meta">
          <Veg veg={food.veg} />
          <span>
            <Star size={12} fill="currentColor" />
            {food.rating}
          </span>
        </div>
        <button
          className="text-button food-title"
          onClick={() => setFood(food)}
        >
          {food.name}
        </button>
        <Link
          className="restaurant-name"
          to={`/restaurant/${food.restaurantId}`}
        >
          {getRestaurant(food.restaurantId).name}
        </Link>
        <div className="food-card-bottom">
          <strong>{money(food.price)}</strong>
          <button
            className="add-button"
            onClick={() => setFood(food)}
            aria-label={`Add ${food.name}`}
          >
            <Plus size={17} />
            <span>Add</span>
          </button>
        </div>
      </div>
    </article>
  );
}
export function RestaurantCard({ restaurant: r }) {
  return (
    <Link className="restaurant-card" to={`/restaurant/${r.id}`}>
      <div className="restaurant-image">
        <img src={imagePath(r.image)} alt={r.name} loading="lazy" />
        <span>{r.offer}</span>
      </div>
      <div className="restaurant-card-text">
        <div className="row-between">
          <h3>{r.name}</h3>
          <span className="rating">
            <Star size={12} fill="currentColor" />
            {r.rating}
          </span>
        </div>
        <p>{r.cuisine}</p>
        <div className="muted restaurant-meta">
          <span>
            <Clock3 size={14} />
            {r.minutes}–{r.minutes + 10} min
          </span>
          <span>•</span>
          <span>{r.distance}</span>
          <span className="free-delivery">Free over ₹499</span>
        </div>
      </div>
    </Link>
  );
}
export function Quantity({ value, onChange, label = "quantity" }) {
  return (
    <div className="quantity">
      <button
        onClick={() => onChange(value - 1)}
        aria-label={`Decrease ${label}`}
      >
        <Minus size={14} />
      </button>
      <span aria-live="polite">{value}</span>
      <button
        disabled={value >= 20}
        onClick={() => onChange(value + 1)}
        aria-label={`Increase ${label}`}
      >
        <Plus size={14} />
      </button>
    </div>
  );
}
export function Bill({ totals }) {
  return (
    <div className="bill">
      <div>
        <span>Item subtotal</span>
        <span>{money(totals.subtotal)}</span>
      </div>
      {totals.discount > 0 && (
        <div className="green">
          <span>Promo savings</span>
          <span>−{money(totals.discount)}</span>
        </div>
      )}
      <div>
        <span>Delivery fee</span>
        <span className={!totals.delivery ? "green" : ""}>
          {totals.delivery ? money(totals.delivery) : "FREE"}
        </span>
      </div>
      <div>
        <span>Platform fee</span>
        <span>{money(totals.fee)}</span>
      </div>
      <div>
        <span>Taxes (5%)</span>
        <span>{money(totals.tax)}</span>
      </div>
      {totals.tip > 0 && (
        <div>
          <span>Rider tip</span>
          <span>{money(totals.tip)}</span>
        </div>
      )}
      <div className="bill-total">
        <strong>Total</strong>
        <strong>{money(totals.total)}</strong>
      </div>
    </div>
  );
}
export function MiniCart() {
  const { cart, setQuantity } = useApp();
  const total = cart.length ? calculateOrder(cart) : null;
  return (
    <aside className="cart-aside">
      <div className="row-between">
        <h3>Your order</h3>
        <span className="count-pill">
          {cart.reduce((n, i) => n + i.quantity, 0)}
        </span>
      </div>
      {!cart.length ? (
        <Empty
          title="A little empty in here"
          text="Find something delicious. Your next favorite meal is just a tap away."
        />
      ) : (
        <>
          <Link
            to={`/restaurant/${cart[0].restaurantId}`}
            className="cart-restaurant"
          >
            {getRestaurant(cart[0].restaurantId).name}
            <ChevronRight size={15} />
          </Link>
          <div className="mini-items">
            {cart.map((i) => (
              <div className="mini-item" key={i.key}>
                <img src={imagePath(i.image)} alt="" />
                <div>
                  <b>{i.name}</b>
                  <small>{money(i.unitPrice)}</small>
                  <Quantity
                    value={i.quantity}
                    onChange={(v) => setQuantity(i.key, v)}
                    label={i.name}
                  />
                </div>
              </div>
            ))}
          </div>
          <Bill totals={total} />
          <Link className="button full" to="/cart">
            View cart
            <ArrowRight size={16} />
          </Link>
        </>
      )}
      <div className="delivery-promise">
        <Bike size={25} />
        <div>
          <b>Good food, on its way.</b>
          <p>Freshly made. Carefully delivered.</p>
        </div>
      </div>
    </aside>
  );
}
const nav = [
  { to: "/", icon: House, label: "Explore" },
  { to: "/favorites", icon: Heart, label: "Favorites" },
  { to: "/orders", icon: ReceiptText, label: "My orders" },
  { to: "/offers", icon: TicketPercent, label: "Offers" },
  { to: "/account", icon: UserRound, label: "My account" },
];
export function Shell({ children }) {
  const { state, cart, mode, notify } = useApp();
  const location = useLocation();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  useEffect(() => {
    setSearch(new URLSearchParams(location.search).get("q") || "");
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [location.pathname, location.search]);
  const address =
    state.addresses.find((a) => a.isDefault) || state.addresses[0];
  const count = cart.reduce((n, i) => n + i.quantity, 0);
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <Logo />
        <p className="sidebar-caption">GOOD FOOD, EVERY DAY</p>
        <nav>
          {nav.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              end={to === "/"}
              to={to}
              className={({ isActive }) =>
                `nav-item ${isActive ? "active" : ""}`
              }
            >
              <Icon size={20} />
              {label}
              {to === "/offers" && <span className="new-badge">NEW</span>}
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-offer">
          <span className="gift-circle">
            <TicketPercent size={27} />
          </span>
          <h3>
            Your first bite
            <br />
            is on a deal.
          </h3>
          <p>Enjoy 20% off your order</p>
          <Link to="/offers">
            Find your offer
            <ArrowRight size={15} />
          </Link>
        </div>
        <div className="sidebar-bottom">
          <span className={`mode-indicator ${mode === "api" ? "live" : ""}`}>
            <i />
            {mode === "api" ? "API connected" : "Demo experience"}
          </span>
          <Link className="profile-mini" to="/account">
            <span className="avatar">{state.profile.name.slice(0, 1)}</span>
            <div>
              <b>{state.profile.name}</b>
              <small>{state.signedIn ? "Your account" : "Food explorer"}</small>
            </div>
            <ChevronRight size={16} />
          </Link>
        </div>
      </aside>
      <div className="workspace">
        <header className="topbar">
          <div className="mobile-brand">
            <Logo />
          </div>
          <Link to="/addresses" className="location-button">
            <span className="location-icon">
              <MapPin size={20} />
            </span>
            <div>
              <small>Deliver to</small>
              <strong>
                {address
                  ? `${address.label} · ${address.city}`
                  : "Choose your address"}
                <ChevronDown size={13} />
              </strong>
            </div>
          </Link>
          <form
            className="header-search"
            onSubmit={(e) => {
              e.preventDefault();
              navigate(`/?q=${encodeURIComponent(search)}`);
            }}
          >
            <Search size={18} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="What are you craving today?"
              aria-label="Search food or restaurants"
            />
            {search && (
              <button
                type="button"
                onClick={() => {
                  setSearch("");
                  navigate("/");
                }}
                aria-label="Clear search"
              >
                <X size={16} />
              </button>
            )}
          </form>
          <button
            className="icon-button notification-button"
            aria-label="View order notifications"
            onClick={() => {
              navigate("/orders");
              if (!state.orders.length)
                notify("Your order updates will appear here.");
            }}
          >
            <Bell size={21} />
            <i />
          </button>
          <Link
            to="/cart"
            className="header-cart"
            aria-label={`Cart with ${count} items`}
          >
            <ShoppingBag size={19} />
            <span>Cart</span>
            <b>{count}</b>
          </Link>
        </header>
        <main className="main-content">{children}</main>
        <footer className="page-footer">
          <span>Made for your cravings.</span>
          <span>
            Forkly © {new Date().getFullYear()}
            <span className="footer-dot">•</span>
            {mode === "demo"
              ? "Interactive demo · No real orders or charges"
              : "Restaurant API · Cash on delivery"}
          </span>
        </footer>
      </div>
      <nav className="mobile-nav">
        {nav.slice(0, 3).map(({ to, icon: Icon, label }) => (
          <NavLink end={to === "/"} to={to} key={to}>
            <Icon size={21} />
            <span>{label}</span>
          </NavLink>
        ))}
        <NavLink to="/cart">
          <ShoppingBag size={21} />
          <span>Cart {count ? `(${count})` : ""}</span>
        </NavLink>
        <NavLink to="/account">
          <UserRound size={21} />
          <span>Account</span>
        </NavLink>
      </nav>
    </div>
  );
}
export function FoodModal() {
  const { food, setFood, add, notify } = useApp();
  const [size, setSize] = useState("regular");
  const [chosen, setChosen] = useState([]);
  const [quantity, setQuantity] = useState(1);
  const [note, setNote] = useState("");
  if (!food) return null;
  const price =
    (food.price +
      sizes.find((s) => s.id === size).price +
      extras
        .filter((e) => chosen.includes(e.id))
        .reduce((n, e) => n + e.price, 0)) *
    quantity;
  return (
    <Modal
      title="Make it your own"
      className="food-modal"
      onClose={() => setFood(null)}
    >
      <img
        className="detail-food-image"
        src={imagePath(food.image)}
        alt={food.name}
      />
      <div className="food-modal-content">
        <div className="row-between">
          <Veg veg={food.veg} />
          <span className="rating">
            <Star size={13} fill="currentColor" />
            {food.rating}
          </span>
        </div>
        <h2>{food.name}</h2>
        <p className="muted">{food.description}</p>
        <p className="allergen-note">
          Ingredients may include milk, gluten, soy, nuts, or sesame. Ask the
          restaurant about allergies.
        </p>
        <fieldset>
          <legend>Choose your portion</legend>
          {sizes.map((s) => (
            <label className="choice" key={s.id}>
              <input
                type="radio"
                name="size"
                value={s.id}
                checked={size === s.id}
                onChange={() => setSize(s.id)}
              />
              <span>{s.name}</span>
              <b>{s.price ? `+${money(s.price)}` : "Included"}</b>
            </label>
          ))}
        </fieldset>
        <fieldset>
          <legend>
            A little extra? <small>Optional</small>
          </legend>
          {extras.map((e) => (
            <label className="choice" key={e.id}>
              <input
                type="checkbox"
                checked={chosen.includes(e.id)}
                onChange={() =>
                  setChosen((c) =>
                    c.includes(e.id)
                      ? c.filter((x) => x !== e.id)
                      : [...c, e.id],
                  )
                }
              />
              <span>{e.name}</span>
              <b>+{money(e.price)}</b>
            </label>
          ))}
        </fieldset>
        <label className="field">
          Special instructions
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Less spicy, no onions…"
            maxLength={200}
          />
        </label>
        <div className="modal-action-row">
          <Quantity
            value={quantity}
            onChange={(v) => setQuantity(Math.max(1, v))}
          />
          <Button
            onClick={() => {
              try {
                add({ foodId: food.id, quantity, size, extras: chosen, note });
                setFood(null);
              } catch (e) {
                notify(e.message, "error");
              }
            }}
          >
            Add to cart<span>{money(price)}</span>
          </Button>
        </div>
      </div>
    </Modal>
  );
}
export function GlobalOverlays() {
  const { food, toast, replace, setReplace, setCart, setCoupon, notify } =
    useApp();
  return (
    <>
      {food && <FoodModal key={food.id} />}{" "}
      {replace && (
        <Modal title="Start a new order?" onClose={() => setReplace(null)}>
          <div className="modal-content">
            <p>
              Your cart contains food from another restaurant. Each order is
              prepared by one restaurant.
            </p>
            <div className="modal-actions">
              <Button variant="secondary" onClick={() => setReplace(null)}>
                Keep my cart
              </Button>
              <Button
                onClick={() => {
                  setCart([{ ...replace, key: createId() }]);
                  setCoupon("");
                  setReplace(null);
                  notify("New cart started.");
                }}
              >
                Start new order
              </Button>
            </div>
          </div>
        </Modal>
      )}
      {toast && (
        <div role="status" className={`toast ${toast.kind}`}>
          {toast.kind === "error" ? <X size={18} /> : <Check size={18} />}
          <span>{toast.message}</span>
        </div>
      )}
    </>
  );
}
export function PageTitle({ eyebrow, title, text, children }) {
  return (
    <div className="page-heading">
      <div>
        {eyebrow && <p className="eyebrow">{eyebrow}</p>}
        <h1>{title}</h1>
        {text && <p className="muted">{text}</p>}
      </div>
      {children}
    </div>
  );
}

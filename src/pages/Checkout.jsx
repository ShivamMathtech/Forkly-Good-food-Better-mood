import { createId } from "../../shared/id.mjs";
import React, { useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowRight,
  ChevronLeft,
  ShoppingBag,
  MapPin,
  TicketPercent,
  Plus,
  CreditCard,
  Smartphone,
  Banknote,
  ShieldCheck,
  Trash2,
  Bike,
} from "lucide-react";
import { useApp } from "../lib/store.jsx";
import { getRestaurant, imagePath, money } from "../../shared/catalog.mjs";
import { calculateOrder } from "../../shared/order.mjs";
import {
  Bill,
  Button,
  Empty,
  ErrorText,
  PageTitle,
  Quantity,
} from "../components/ui.jsx";
import { AddressEditor } from "./Account.jsx";
function useTotals(tip = 0) {
  const { cart, coupon } = useApp();
  if (!cart.length) return { totals: null, promoError: "" };
  try {
    return { totals: calculateOrder(cart, coupon, tip), promoError: "" };
  } catch (e) {
    return { totals: calculateOrder(cart, "", tip), promoError: e.message };
  }
}
export function PromoEntry({ error }) {
  const { cart, coupon, setCoupon, notify } = useApp();
  const [code, setCode] = useState(coupon);
  const [localError, setLocalError] = useState("");
  return (
    <div className="promo-box">
      <label htmlFor="promo">
        <TicketPercent size={18} />
        Have a promo code?
      </label>
      <div className="promo-input">
        <input
          id="promo"
          value={code}
          onChange={(e) => {
            setCode(e.target.value.toUpperCase());
            setLocalError("");
          }}
          placeholder="WELCOME20"
          maxLength={30}
        />
        <button
          type="button"
          onClick={() => {
            try {
              calculateOrder(cart, code);
              setCoupon(code.trim().toUpperCase());
              setLocalError("");
              notify(code ? "Offer applied!" : "Promo code cleared.");
            } catch (e) {
              setLocalError(e.message);
            }
          }}
        >
          Apply
        </button>
      </div>
      {coupon && (
        <button
          type="button"
          className="text-link small"
          onClick={() => {
            setCoupon("");
            setCode("");
          }}
        >
          Remove {coupon}
        </button>
      )}
      <ErrorText>{localError || error}</ErrorText>
      <Link className="small muted" to="/offers">
        See all available offers →
      </Link>
    </div>
  );
}
export function Cart() {
  const { cart, setQuantity, setCart } = useApp();
  const { totals, promoError } = useTotals();
  if (!cart.length)
    return (
      <>
        <PageTitle
          title="Your cart"
          text="A great meal starts with a little craving."
        />
        <Empty
          title="Your next favorite meal is waiting"
          text="Choose a dish and we’ll save it here for you."
          action="Explore the menu"
        />
      </>
    );
  return (
    <>
      <PageTitle
        eyebrow="GOOD CHOICES, ALL AROUND"
        title="Your cart"
        text={`Fresh from ${getRestaurant(cart[0].restaurantId).name}`}
      >
        <Link className="text-link" to={`/restaurant/${cart[0].restaurantId}`}>
          Add more items
          <Plus size={16} />
        </Link>
      </PageTitle>
      <div className="checkout-layout">
        <section className="panel cart-panel">
          <div className="row-between">
            <h2>Your delicious lineup</h2>
            <Button variant="ghost" onClick={() => setCart([])}>
              <Trash2 size={15} />
              Clear cart
            </Button>
          </div>
          {cart.map((i) => (
            <div className="cart-item" key={i.key}>
              <img src={imagePath(i.image)} alt={i.name} />
              <div className="cart-item-info">
                <h3>{i.name}</h3>
                <p>
                  {i.size === "large" ? "Large portion" : "Regular portion"}
                  {i.extras.length ? ` · ${i.extras.join(", ")}` : ""}
                </p>
                {i.note && <small>Note: {i.note}</small>}
                <button
                  className="text-link small"
                  onClick={() => setQuantity(i.key, 0)}
                >
                  Remove
                </button>
              </div>
              <div className="cart-item-end">
                <strong>{money(i.unitPrice * i.quantity)}</strong>
                <Quantity
                  value={i.quantity}
                  onChange={(v) => setQuantity(i.key, v)}
                  label={i.name}
                />
              </div>
            </div>
          ))}
          <div className="cart-reassurance">
            <Bike size={21} />
            <span>Your food is prepared fresh after you place your order.</span>
          </div>
        </section>
        <aside className="panel checkout-summary">
          <h2>Order summary</h2>
          <PromoEntry error={promoError} />
          <Bill totals={totals} />
          <Link className="button full" to="/checkout">
            Continue to checkout
            <ArrowRight size={17} />
          </Link>
          <p className="secure-note">
            <ShieldCheck size={14} />
            No charges in demo mode
          </p>
        </aside>
      </div>
    </>
  );
}
export function Checkout() {
  const app = useApp();
  const navigate = useNavigate();
  const { cart, state, mode, checkout, notify } = app;
  const [addressId, setAddressId] = useState(
    (state.addresses.find((a) => a.isDefault) || state.addresses[0])?.id || "",
  );
  const [editing, setEditing] = useState(false);
  const [payment, setPayment] = useState("cash");
  const [tip, setTip] = useState(0);
  const [instructions, setInstructions] = useState("");
  const [contactless, setContactless] = useState(state.settings.contactless);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const idempotencyKey = useRef(createId());
  const { totals, promoError } = useTotals(tip);
  if (!cart.length)
    return (
      <Empty
        title="Your cart is empty"
        text="Add something delicious before checking out."
        action="Explore food"
      />
    );
  if (mode === "api" && !state.signedIn)
    return (
      <Empty
        icon={ShieldCheck}
        title="Sign in to place an order"
        text="Your account keeps your orders and delivery details together."
        to="/auth?next=/checkout"
        action="Sign in or create account"
      />
    );
  const submit = async (e) => {
    e.preventDefault();
    if (busy) return;
    setError("");
    const address = state.addresses.find((a) => a.id === addressId);
    if (!address) return setError("Please select a delivery address.");
    if (promoError)
      return setError(
        "Remove the invalid promo code or add more items to meet its minimum.",
      );
    setBusy(true);
    try {
      const order = await checkout(
        {
          items: cart,
          address,
          payment,
          coupon: app.coupon,
          tip,
          instructions: `${contactless ? "Contactless delivery. " : ""}${instructions}`,
        },
        idempotencyKey.current,
      );
      notify(
        mode === "demo"
          ? "Demo order placed. Let’s follow your food!"
          : "Your order has been placed.",
      );
      navigate(`/orders/${order.id}`);
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };
  return (
    <>
      <Link className="back-link" to="/cart">
        <ChevronLeft size={16} />
        Back to cart
      </Link>
      <PageTitle
        eyebrow="YOU’RE ONE STEP FROM DELICIOUS"
        title="Let’s make it happen"
        text="A few details, and your next great meal is on its way."
      />
      <form className="checkout-layout" onSubmit={submit}>
        <div className="checkout-sections">
          <section className="panel">
            <div className="row-between">
              <h2>
                <span className="step-number">1</span>Delivery address
              </h2>
              <Button
                type="button"
                variant="ghost"
                onClick={() => setEditing(true)}
              >
                <Plus size={16} />
                Add new
              </Button>
            </div>
            {state.addresses.length ? (
              <div className="address-options">
                {state.addresses.map((a) => (
                  <label
                    className={`address-option ${addressId === a.id ? "selected" : ""}`}
                    key={a.id}
                  >
                    <input
                      type="radio"
                      name="address"
                      checked={addressId === a.id}
                      onChange={() => setAddressId(a.id)}
                    />
                    <MapPin size={20} />
                    <div>
                      <b>{a.label}</b>
                      <p>
                        {a.name} · {a.phone}
                      </p>
                      <p>
                        {a.line}, {a.city} – {a.pincode}
                      </p>
                    </div>
                  </label>
                ))}
              </div>
            ) : (
              <p className="muted">
                Add your first delivery address to continue.
              </p>
            )}
            <label className="field">
              Delivery instructions
              <textarea
                maxLength={300}
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
                placeholder="Building entrance, landmark, or anything we should know…"
              />
            </label>
            <label className="inline-choice">
              <input
                type="checkbox"
                checked={contactless}
                onChange={(e) => setContactless(e.target.checked)}
              />
              Leave at the door for contactless delivery
            </label>
          </section>
          <section className="panel">
            <h2>
              <span className="step-number">2</span>Payment method
            </h2>
            <p className="muted small">
              {mode === "demo"
                ? "Demo checkout only. No real card details or money are collected."
                : "Cash on delivery is supported. Online payment integration is not configured."}
            </p>
            {[
              {
                id: "cash",
                name: "Cash on delivery",
                text: "Pay when your food arrives",
                icon: Banknote,
              },
              ...(mode === "demo"
                ? [
                    {
                      id: "demo-card",
                      name: "Demo card",
                      text: "Simulated payment · no charge",
                      icon: CreditCard,
                    },
                    {
                      id: "demo-upi",
                      name: "Demo UPI",
                      text: "Simulated UPI · no charge",
                      icon: Smartphone,
                    },
                  ]
                : []),
            ].map(({ id, name, text, icon: Icon }) => (
              <label
                className={`payment-option ${payment === id ? "selected" : ""}`}
                key={id}
              >
                <input
                  type="radio"
                  name="payment"
                  checked={payment === id}
                  onChange={() => setPayment(id)}
                />
                <Icon size={23} />
                <div>
                  <b>{name}</b>
                  <small>{text}</small>
                </div>
              </label>
            ))}
          </section>
          <section className="panel">
            <h2>
              <span className="step-number">3</span>A little thanks for your
              rider
            </h2>
            <p className="muted small">
              Optional. Choose an amount to add to your order.
            </p>
            <div className="tip-options">
              {[0, 2000, 3000, 5000].map((t) => (
                <button
                  type="button"
                  className={tip === t ? "selected" : ""}
                  onClick={() => setTip(t)}
                  key={t}
                >
                  {t ? money(t) : "No tip"}
                </button>
              ))}
            </div>
          </section>
        </div>
        <aside className="panel checkout-summary">
          <h2>Almost yours</h2>
          <p className="muted small">
            {getRestaurant(cart[0].restaurantId).name}
          </p>
          <div className="checkout-items">
            {cart.map((i) => (
              <div className="row-between" key={i.key}>
                <span>
                  {i.quantity} × {i.name}
                </span>
                <b>{money(i.unitPrice * i.quantity)}</b>
              </div>
            ))}
          </div>
          <PromoEntry error={promoError} />
          <Bill totals={totals} />
          <ErrorText>{error}</ErrorText>
          <Button className="full" type="submit" disabled={busy}>
            {busy
              ? "Placing your order…"
              : mode === "demo"
                ? "Place demo order"
                : "Place order"}
            <ArrowRight size={17} />
          </Button>
          <p className="secure-note">
            <ShieldCheck size={15} />
            {mode === "demo"
              ? "Demo only · No real delivery or charges"
              : "Cash payable on delivery"}
          </p>
        </aside>
      </form>
      {editing && (
        <AddressEditor
          onClose={() => setEditing(false)}
          onSaved={(a) => setAddressId(a.id)}
        />
      )}
    </>
  );
}

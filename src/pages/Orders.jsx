import { createId } from "../../shared/id.mjs";
import React, { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  Bike,
  Check,
  CheckCircle2,
  ChefHat,
  ChevronLeft,
  Clock3,
  Download,
  MessageCircle,
  PackageCheck,
  ReceiptText,
  RefreshCw,
  Send,
  Star,
  X,
  MapPin,
} from "lucide-react";
import { useApp } from "../lib/store.jsx";
import { getRestaurant, imagePath, money } from "../../shared/catalog.mjs";
import {
  demoOrderStatus,
  statuses,
  statusLabels,
} from "../../shared/order.mjs";
import {
  Bill,
  Button,
  Empty,
  ErrorText,
  Modal,
  PageTitle,
} from "../components/ui.jsx";
function useOrders() {
  const app = useApp();
  const [, tick] = useState(0);
  useEffect(() => {
    const t = setInterval(() => tick((n) => n + 1), 3000);
    return () => clearInterval(t);
  }, []);
  useEffect(() => {
    if (app.mode !== "api" || !app.state.signedIn) return;
    const timer = setInterval(() => app.refresh().catch(() => {}), 15000);
    return () => clearInterval(timer);
  }, [app.mode, app.state.signedIn]);
  return app.state.orders.map((o) => ({
    ...o,
    displayStatus: app.mode === "demo" ? demoOrderStatus(o) : o.status,
  }));
}
function ReorderButton({ order }) {
  const { setCart, cart, notify, setCoupon } = useApp();
  const navigate = useNavigate();
  const [confirm, setConfirm] = useState(false);
  const perform = () => {
    setCart(order.items.map((i) => ({ ...i, key: createId() })));
    setCoupon("");
    notify("Your favorites are back in the cart.");
    navigate("/cart");
  };
  return (
    <>
      <Button
        variant="secondary"
        onClick={() => (cart.length ? setConfirm(true) : perform())}
      >
        <RefreshCw size={15} />
        Order again
      </Button>
      {confirm && (
        <Modal
          title="Replace your current cart?"
          onClose={() => setConfirm(false)}
        >
          <div className="modal-content">
            <p>
              This will replace your current items with this previous order.
            </p>
            <div className="modal-actions">
              <Button variant="secondary" onClick={() => setConfirm(false)}>
                Keep cart
              </Button>
              <Button onClick={perform}>Replace cart</Button>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
}
export function Orders() {
  const orders = useOrders();
  const [tab, setTab] = useState("All orders");
  const shown = orders.filter(
    (o) =>
      tab === "All orders" ||
      (tab === "Ongoing"
        ? !["delivered", "cancelled"].includes(o.displayStatus)
        : ["delivered", "cancelled"].includes(o.displayStatus)),
  );
  return (
    <>
      <PageTitle
        eyebrow="EVERY MEAL HAS A STORY"
        title="Your orders"
        text="Track the next good thing, or revisit an old favorite."
      />
      <div className="tabs">
        {["All orders", "Ongoing", "Past orders"].map((t) => (
          <button
            key={t}
            className={tab === t ? "active" : ""}
            onClick={() => setTab(t)}
          >
            {t}
          </button>
        ))}
      </div>
      {shown.length ? (
        <div className="orders-list">
          {shown.map((o) => (
            <article className="panel order-card" key={o.id}>
              <div className="order-card-top">
                <img
                  src={imagePath(getRestaurant(o.restaurantId).image)}
                  alt=""
                />
                <div>
                  <h2>{getRestaurant(o.restaurantId).name}</h2>
                  <p>
                    {new Date(o.createdAt).toLocaleString("en-IN")}
                    <span>
                      {" "}
                      · {o.items.reduce((n, i) => n + i.quantity, 0)} items
                    </span>
                  </p>
                  <small>{o.id}</small>
                </div>
                <span className={`status-tag ${o.displayStatus}`}>
                  {statusLabels[o.displayStatus]}
                </span>
              </div>
              <p className="muted">
                {o.items.map((i) => `${i.quantity} × ${i.name}`).join(" · ")}
              </p>
              <div className="row-between order-card-bottom">
                <strong>{money(o.total)}</strong>
                <div className="button-row">
                  <ReorderButton order={o} />
                  <Link className="button" to={`/orders/${o.id}`}>
                    {o.displayStatus === "delivered"
                      ? "View order"
                      : "Track order"}
                    <Bike size={17} />
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <Empty
          icon={ReceiptText}
          title="Your delicious story starts here"
          text={
            tab === "All orders"
              ? "Place an order to track it, review it, and order it again."
              : "There are no orders in this section yet."
          }
          action="Find something delicious"
        />
      )}
    </>
  );
}
export function DeliveryMap({ status }) {
  const progress =
    status === "delivered" ? 1 : status === "on_the_way" ? 0.6 : 0;
  return (
    <div
      className="delivery-map"
      role="img"
      aria-label="Illustrative delivery route between restaurant and delivery address"
    >
      <svg viewBox="0 0 720 320" preserveAspectRatio="xMidYMid slice">
        <rect width="720" height="320" fill="#f4f2ed" />
        <g fill="#e8eee2">
          <rect x="30" y="30" width="100" height="100" rx="24" />
          <rect x="478" y="40" width="160" height="76" rx="20" />
          <rect x="235" y="206" width="105" height="91" rx="20" />
        </g>
        <g stroke="#fff" strokeWidth="24" fill="none">
          <path d="M-20 170L740 100M190-20L245 340M450-20L380 340M610-20L660 340M-20 275L740 235M75-20L118 340" />
        </g>
        <g stroke="#deded8" strokeWidth="1" fill="none">
          <path d="M-20 170L740 100M190-20L245 340M450-20L380 340M610-20L660 340M-20 275L740 235M75-20L118 340" />
        </g>
        <path
          d="M143 154L417 127L392 244L580 239"
          fill="none"
          stroke="#f55b13"
          strokeWidth="5"
          strokeDasharray="9 7"
          strokeLinecap="round"
        />
        <g fontFamily="sans-serif" fontSize="12" fill="#8e9387">
          <text x="38" y="80">
            Green park
          </text>
          <text x="495" y="86">
            Town garden
          </text>
          <text x="470" y="300">
            Your neighborhood
          </text>
          <text x="264" y="80">
            Clock Tower
          </text>
        </g>
        <circle cx="143" cy="154" r="18" fill="#f55b13" />
        <circle cx="143" cy="154" r="6" fill="white" />
        <circle cx="580" cy="239" r="18" fill="#253d32" />
        <circle cx="580" cy="239" r="6" fill="white" />
        {progress > 0 && (
          <g
            transform={`translate(${progress === 1 ? 580 : 402},${progress === 1 ? 239 : 199})`}
          >
            <circle r="24" fill="white" stroke="#f55b13" strokeWidth="3" />
            <text textAnchor="middle" y="6" fontSize="22">
              ↗
            </text>
          </g>
        )}
      </svg>
      <span className="map-label">Illustrative route · not GPS</span>
    </div>
  );
}
export function OrderDetail() {
  const { id } = useParams();
  const orders = useOrders();
  const order = orders.find((o) => o.id === id);
  const app = useApp();
  const { state, mode, notify } = app;
  const [cancelOpen, setCancelOpen] = useState(false);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [error, setError] = useState("");
  if (!order)
    return (
      <Empty
        title="Order not found"
        text="This order is not available in your current account or browser."
        action="View my orders"
        to="/orders"
      />
    );
  const index = statuses.indexOf(order.displayStatus);
  const reviewed = state.reviews.some((r) => r.orderId === id);
  const receipt = () => {
    const lines = [
      "FORKLY — ORDER RECEIPT",
      order.demo
        ? "DEMO ORDER · NOT A TAX INVOICE · NO CHARGE"
        : "Order summary · Not a tax invoice",
      order.id,
      new Date(order.createdAt).toLocaleString(),
      getRestaurant(order.restaurantId).name,
      "",
      ...order.items.map(
        (i) =>
          `${i.quantity} x ${i.name} (${i.size}) — ${money(i.unitPrice * i.quantity)}`,
      ),
      "",
      `Subtotal: ${money(order.subtotal)}`,
      `Discount: ${money(order.discount)}`,
      `Delivery: ${money(order.delivery)}`,
      `Platform fee: ${money(order.fee)}`,
      `Tax (5%): ${money(order.tax)}`,
      `Tip: ${money(order.tip)}`,
      `TOTAL: ${money(order.total)}`,
      `Payment: ${order.payment}`,
      `Deliver to: ${order.address.name}, ${order.address.line}, ${order.address.city}, ${order.address.pincode}`,
    ];
    const url = URL.createObjectURL(
      new Blob([lines.join("\n")], { type: "text/plain;charset=utf-8" }),
    );
    const a = document.createElement("a");
    a.href = url;
    a.download = `${order.id}-receipt.txt`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  return (
    <>
      <Link className="back-link" to="/orders">
        <ChevronLeft size={16} />
        All orders
      </Link>
      <PageTitle
        eyebrow={order.id}
        title={
          order.displayStatus === "delivered"
            ? "Good food. Delivered."
            : order.displayStatus === "cancelled"
              ? "Your order was cancelled"
              : "Something delicious is on its way"
        }
        text={
          mode === "demo"
            ? "Simulated delivery progresses in about 2½ minutes. No real delivery is dispatched."
            : "Order status is updated by the restaurant. This page refreshes every 15 seconds."
        }
      >
        <Button variant="secondary" onClick={receipt}>
          <Download size={16} />
          Receipt
        </Button>
      </PageTitle>
      <div className="checkout-layout">
        <div>
          <div className="panel tracking-panel">
            <div className="row-between">
              <div>
                <span className="eyebrow">
                  {order.displayStatus === "delivered"
                    ? "ENJOY EVERY BITE"
                    : "YOUR ORDER STATUS"}
                </span>
                <h2>{statusLabels[order.displayStatus]}</h2>
              </div>
              <span className="tracking-icon">
                <Bike size={30} />
              </span>
            </div>
            {order.displayStatus !== "cancelled" && (
              <>
                <DeliveryMap status={order.displayStatus} />
                <div className="timeline">
                  {statuses.map((s, n) => (
                    <div
                      className={`timeline-step ${n <= index ? "done" : ""}`}
                      key={s}
                    >
                      <span>{n <= index ? <Check size={16} /> : n + 1}</span>
                      <div>
                        <b>{statusLabels[s]}</b>
                        <small>
                          {
                            [
                              "We have your order",
                              "A little kitchen magic",
                              "Fresh food, coming through",
                              "Time to enjoy",
                            ][n]
                          }
                        </small>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
            {mode === "demo" && index < 3 && index >= 0 && (
              <button
                className="demo-skip"
                onClick={async () => {
                  await app.patch({
                    orders: state.orders.map((o) =>
                      o.id === id ? { ...o, status: "delivered" } : o,
                    ),
                  });
                  notify("Demo delivery completed. You can leave a review.");
                }}
              >
                Skip demo to delivered →
              </button>
            )}
          </div>
          <div className="panel delivery-details">
            <h2>Delivery details</h2>
            <div className="delivery-address">
              <MapPin size={22} />
              <div>
                <b>
                  {order.address.label} · {order.address.name}
                </b>
                <p>
                  {order.address.line}, {order.address.city} –{" "}
                  {order.address.pincode}
                </p>
                <p>{order.address.phone}</p>
                {order.instructions && (
                  <p className="muted">{order.instructions}</p>
                )}
              </div>
            </div>
            <div className="rider-card">
              <span className="avatar rider">
                <Bike size={23} />
              </span>
              <div>
                <b>
                  {mode === "demo"
                    ? "Sam · Demo delivery partner"
                    : "Restaurant support"}
                </b>
                <small>
                  {mode === "demo"
                    ? "Illustrative rider profile · 4.9 ★"
                    : "Message the restaurant about this order"}
                </small>
              </div>
              <Link
                to={`/orders/${id}/chat`}
                className="icon-button"
                aria-label="Chat about this order"
              >
                <MessageCircle size={21} />
              </Link>
            </div>
          </div>
        </div>
        <aside className="panel checkout-summary">
          <h2>{getRestaurant(order.restaurantId).name}</h2>
          <div className="checkout-items">
            {order.items.map((i, n) => (
              <div className="receipt-item" key={n}>
                <img src={imagePath(i.image)} alt="" />
                <div>
                  <b>
                    {i.quantity} × {i.name}
                  </b>
                  <small>
                    {i.size} · {money(i.unitPrice)}
                  </small>
                </div>
              </div>
            ))}
          </div>
          <Bill totals={order} />
          <div className="payment-note">
            {order.payment === "cash"
              ? "Cash on delivery"
              : "Simulated online payment"}
            {mode === "demo" && " · Demo"}
          </div>
          <ReorderButton order={order} />
          {order.displayStatus === "delivered" && (
            <Button className="full" onClick={() => setReviewOpen(true)}>
              <Star size={17} />
              {reviewed ? "Update your review" : "How was your meal?"}
            </Button>
          )}
          {order.displayStatus === "placed" && (
            <Button
              variant="ghost danger"
              className="full"
              onClick={() => setCancelOpen(true)}
            >
              Cancel order
            </Button>
          )}
        </aside>
      </div>
      {cancelOpen && (
        <Modal title="Cancel this order?" onClose={() => setCancelOpen(false)}>
          <div className="modal-content">
            <p>You can cancel before preparation begins.</p>
            <ErrorText>{error}</ErrorText>
            <div className="modal-actions">
              <Button variant="secondary" onClick={() => setCancelOpen(false)}>
                Keep order
              </Button>
              <Button
                onClick={async () => {
                  try {
                    await app.cancel(id);
                    setCancelOpen(false);
                  } catch (e) {
                    setError(e.message);
                  }
                }}
              >
                Cancel order
              </Button>
            </div>
          </div>
        </Modal>
      )}
      {reviewOpen && (
        <ReviewModal orderId={id} onClose={() => setReviewOpen(false)} />
      )}
    </>
  );
}
function ReviewModal({ orderId, onClose }) {
  const { review, state, notify } = useApp();
  const existing = state.reviews.find((r) => r.orderId === orderId);
  const [rating, setRating] = useState(existing?.rating || 5);
  const [comment, setComment] = useState(existing?.comment || "");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  return (
    <Modal title="How was your meal?" onClose={onClose}>
      <form
        className="modal-content"
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          try {
            await review(orderId, rating, comment);
            notify("Thanks for sharing your experience!");
            onClose();
          } catch (e) {
            setError(e.message);
          } finally {
            setBusy(false);
          }
        }}
      >
        <p className="muted">Your feedback makes the next meal even better.</p>
        <div className="review-stars" aria-label="Meal rating">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              type="button"
              key={n}
              onClick={() => setRating(n)}
              aria-label={`Rate ${n} stars`}
              aria-pressed={rating === n}
            >
              <Star size={33} fill={n <= rating ? "currentColor" : "none"} />
            </button>
          ))}
        </div>
        <label className="field">
          Tell us a little more
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            minLength={3}
            maxLength={1000}
            required
            placeholder="What did you love?"
          />
        </label>
        <ErrorText>{error}</ErrorText>
        <Button className="full" disabled={busy}>
          {busy ? "Saving…" : "Share review"}
        </Button>
      </form>
    </Modal>
  );
}
export function Chat() {
  useOrders(); // Refresh restaurant replies in API mode.
  const { id } = useParams();
  const { state, mode, sendMessage } = useApp();
  const [text, setText] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  if (!state.orders.some((o) => o.id === id))
    return <Empty title="Order not found" action="View orders" to="/orders" />;
  const messages = state.messages.filter((m) => m.orderId === id);
  return (
    <div className="narrow-page">
      <Link className="back-link" to={`/orders/${id}`}>
        <ChevronLeft size={16} />
        Back to your order
      </Link>
      <PageTitle
        title="A little delivery help"
        text={
          mode === "demo"
            ? "Demo chat with a simulated support reply."
            : "Messages are stored for the restaurant. A reply is not guaranteed immediately."
        }
      />
      <div className="panel chat-panel">
        <div className="chat-heading">
          <span className="avatar rider">
            <Bike size={24} />
          </span>
          <div>
            <b>
              {mode === "demo" ? "Sam · Demo partner" : "Restaurant support"}
            </b>
            <small>{id}</small>
          </div>
        </div>
        <div className="chat-messages" aria-live="polite">
          {!messages.length && (
            <p className="chat-intro">
              Have a question about your order? Leave a message below.
            </p>
          )}
          {messages.map((m) => (
            <div className={`chat-message ${m.role}`} key={m.id}>
              <span>{m.text}</span>
              <small>
                {new Date(m.createdAt).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </small>
            </div>
          ))}
        </div>
        <ErrorText>{error}</ErrorText>
        <form
          className="chat-input"
          onSubmit={async (e) => {
            e.preventDefault();
            if (!text.trim() || busy) return;
            setBusy(true);
            setError("");
            try {
              await sendMessage(id, text.trim());
              setText("");
            } catch (e) {
              setError(e.message);
            } finally {
              setBusy(false);
            }
          }}
        >
          <input
            aria-label="Message"
            placeholder="Type a message…"
            value={text}
            onChange={(e) => setText(e.target.value)}
            maxLength={1000}
            required
          />
          <button
            className="button"
            disabled={busy || !text.trim()}
            aria-label="Send message"
          >
            <Send size={18} />
          </button>
        </form>
      </div>
    </div>
  );
}

import { createId } from "../../shared/id.mjs";
import React, { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import {
  ArrowRight,
  Bell,
  Bike,
  Check,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  Heart,
  Home,
  KeyRound,
  LockKeyhole,
  LogOut,
  MapPin,
  Plus,
  RefreshCw,
  Settings,
  ShieldCheck,
  ShoppingBag,
  Smartphone,
  TicketPercent,
  Trash2,
  Truck,
  UserRound,
  UtensilsCrossed,
  Wallet,
} from "lucide-react";
import { useApp } from "../lib/store.jsx";
import { api } from "../lib/repository.js";
import { imagePath } from "../../shared/catalog.mjs";
import { validateAddress } from "../../shared/order.mjs";
import {
  Button,
  Empty,
  ErrorText,
  Logo,
  Modal,
  PageTitle,
} from "../components/ui.jsx";
export function Account() {
  const { state, mode, logout, resetDemo, notify } = useApp();
  const navigate = useNavigate();
  const [reset, setReset] = useState(false);
  const links = [
    {
      to: "/profile",
      title: "My profile",
      text: "Your details, just the way you like them",
      icon: UserRound,
    },
    {
      to: "/addresses",
      title: "My addresses",
      text: "All the places you call home",
      icon: MapPin,
    },
    {
      to: "/payments",
      title: "Payment methods",
      text:
        mode === "demo" ? "Explore demo payment options" : "Cash on delivery",
      icon: CreditCard,
    },
    {
      to: "/offers",
      title: "My vouchers",
      text: "A little extra joy with every order",
      icon: TicketPercent,
    },
    {
      to: "/settings",
      title: "Preferences & security",
      text: "Notifications and account settings",
      icon: Settings,
    },
    {
      to: "/welcome",
      title: "Welcome to Forkly",
      text: "Take a quick look around",
      icon: UtensilsCrossed,
    },
  ];
  return (
    <div className="account-page">
      <PageTitle
        eyebrow="YOUR LITTLE CORNER OF FORKLY"
        title="My account"
        text="Good food starts with feeling at home."
      />
      <div className="account-hero">
        <span className="avatar large">{state.profile.name.slice(0, 1)}</span>
        <div>
          <h2>{state.profile.name}</h2>
          <p>{state.profile.email || "Your next great meal is waiting."}</p>
          <span className="pill">
            {mode === "demo"
              ? "Demo food explorer"
              : state.signedIn
                ? "Forkly member"
                : "Guest explorer"}
          </span>
        </div>
        <Link
          className="button secondary"
          to={state.signedIn ? "/profile" : "/auth"}
        >
          {state.signedIn ? "Edit profile" : "Sign in"}
        </Link>
      </div>
      <div className="account-stats">
        <div>
          <b>{state.orders.length}</b>
          <span>Orders placed</span>
        </div>
        <div>
          <b>{state.favorites.length}</b>
          <span>Favorite dishes</span>
        </div>
        <div>
          <b>{state.reviews.length}</b>
          <span>Reviews shared</span>
        </div>
      </div>
      <div className="account-links">
        {links.map(({ to, title, text, icon: Icon }) => (
          <Link key={to} to={to}>
            <span className="account-link-icon">
              <Icon size={21} />
            </span>
            <div>
              <b>{title}</b>
              <small>{text}</small>
            </div>
            <ChevronRight size={18} />
          </Link>
        ))}
      </div>
      <div className="account-actions">
        {state.signedIn ? (
          <Button
            variant="ghost danger"
            onClick={async () => {
              try {
                await logout();
                navigate("/");
              } catch (e) {
                notify(e.message, "error");
              }
            }}
          >
            <LogOut size={17} />
            Sign out
          </Button>
        ) : (
          <Link className="text-link" to="/auth">
            Sign in or create an account
            <ArrowRight size={16} />
          </Link>
        )}
        {mode === "demo" && (
          <Button variant="ghost" onClick={() => setReset(true)}>
            <RefreshCw size={16} />
            Reset demo data
          </Button>
        )}
      </div>
      {reset && (
        <Modal title="A fresh start?" onClose={() => setReset(false)}>
          <div className="modal-content">
            <p>
              This clears the demo orders, favorites, messages, addresses, and
              profile saved in this browser.
            </p>
            <div className="modal-actions">
              <Button variant="secondary" onClick={() => setReset(false)}>
                Keep my data
              </Button>
              <Button
                onClick={() => {
                  resetDemo();
                  setReset(false);
                }}
              >
                Reset demo
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
export function Profile() {
  const { state, patch, notify, mode } = useApp();
  const [profile, setProfile] = useState(state.profile);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  if (mode === "api" && !state.signedIn)
    return (
      <Empty
        title="Sign in to edit your profile"
        action="Sign in"
        to="/auth?next=/profile"
      />
    );
  return (
    <div className="narrow-page">
      <Link className="back-link" to="/account">
        <ChevronLeft size={16} />
        My account
      </Link>
      <PageTitle title="A little about you" text="Keep your details fresh." />
      <form
        className="panel form-panel"
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          setError("");
          try {
            await patch({ profile });
            notify("Your profile is up to date.");
          } catch (e) {
            setError(e.message);
          } finally {
            setBusy(false);
          }
        }}
      >
        <span className="avatar large profile-avatar">
          {profile.name.slice(0, 1)}
        </span>
        <label className="field">
          Full name
          <input
            required
            minLength={2}
            maxLength={80}
            value={profile.name}
            onChange={(e) => setProfile({ ...profile, name: e.target.value })}
            autoComplete="name"
          />
        </label>
        <label className="field">
          Email address
          <input
            type="email"
            required
            value={profile.email}
            readOnly={mode === "api"}
            onChange={(e) => setProfile({ ...profile, email: e.target.value })}
            autoComplete="email"
          />
          {mode === "api" && (
            <small>Your sign-in email cannot be changed here.</small>
          )}
        </label>
        <label className="field">
          Phone number
          <input
            type="tel"
            required
            pattern="[0-9]{10}"
            maxLength={10}
            value={profile.phone}
            onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
            autoComplete="tel"
            placeholder="10-digit mobile number"
          />
        </label>
        <ErrorText>{error}</ErrorText>
        <Button className="full" disabled={busy}>
          {busy ? "Saving…" : "Save changes"}
        </Button>
      </form>
    </div>
  );
}
export function AddressEditor({ address, onClose, onSaved }) {
  const { state, patch, notify } = useApp();
  const [value, setValue] = useState(
    address || {
      id: createId(),
      label: "Home",
      name: state.profile.name === "Guest" ? "" : state.profile.name,
      phone: state.profile.phone,
      line: "",
      city: "Dehradun",
      pincode: "",
      instructions: "",
      isDefault: !state.addresses.length,
    },
  );
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const input = (name, label, opts = {}) => (
    <label className="field" key={name}>
      {label}
      <input
        value={value[name]}
        onChange={(e) => setValue({ ...value, [name]: e.target.value })}
        {...opts}
      />
    </label>
  );
  return (
    <Modal
      title={address ? "Edit your address" : "Where should we deliver?"}
      onClose={onClose}
    >
      <form
        className="modal-content"
        onSubmit={async (e) => {
          e.preventDefault();
          setError("");
          setBusy(true);
          try {
            const clean = validateAddress(value);
            let all = state.addresses.filter((a) => a.id !== clean.id);
            if (clean.isDefault)
              all = all.map((a) => ({ ...a, isDefault: false }));
            all.push(clean);
            if (!all.some((a) => a.isDefault)) all[0].isDefault = true;
            await patch({ addresses: all });
            onSaved?.(clean);
            notify("Address saved.");
            onClose();
          } catch (e) {
            setError(e.message);
          } finally {
            setBusy(false);
          }
        }}
      >
        <div className="address-labels">
          {["Home", "Work", "Other"].map((label) => (
            <button
              type="button"
              className={value.label === label ? "selected" : ""}
              key={label}
              onClick={() => setValue({ ...value, label })}
            >
              {label === "Home" && <Home size={15} />} {label}
            </button>
          ))}
        </div>
        <div className="form-grid">
          {input("name", "Recipient name", {
            required: true,
            minLength: 2,
            maxLength: 80,
            autoComplete: "name",
          })}
          {input("phone", "Phone number", {
            required: true,
            pattern: "[0-9]{10}",
            maxLength: 10,
            type: "tel",
            autoComplete: "tel",
          })}
        </div>
        {input("line", "Street address & landmark", {
          required: true,
          minLength: 5,
          maxLength: 200,
          autoComplete: "street-address",
          placeholder: "House number, street, nearby landmark",
        })}
        <div className="form-grid">
          {input("city", "City", {
            required: true,
            minLength: 2,
            maxLength: 60,
            autoComplete: "address-level2",
          })}
          {input("pincode", "PIN code", {
            required: true,
            pattern: "[1-9][0-9]{5}",
            maxLength: 6,
            inputMode: "numeric",
            autoComplete: "postal-code",
          })}
        </div>
        {input("instructions", "Delivery instructions (optional)", {
          maxLength: 200,
          placeholder: "Ring the doorbell, building entrance…",
        })}
        <label className="inline-choice">
          <input
            type="checkbox"
            checked={value.isDefault}
            onChange={(e) =>
              setValue({ ...value, isDefault: e.target.checked })
            }
          />
          Use as my default address
        </label>
        <ErrorText>{error}</ErrorText>
        <Button className="full" disabled={busy}>
          {busy ? "Saving…" : "Save address"}
        </Button>
      </form>
    </Modal>
  );
}
export function Addresses() {
  const { state, patch, notify, mode } = useApp();
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);
  if (mode === "api" && !state.signedIn)
    return (
      <Empty
        icon={MapPin}
        title="Your addresses, all together"
        text="Sign in to save delivery addresses."
        action="Sign in"
        to="/auth?next=/addresses"
      />
    );
  return (
    <>
      <PageTitle
        eyebrow="MAKE YOURSELF AT HOME"
        title="My addresses"
        text="Good food knows where to find you."
      >
        <Button onClick={() => setEditing({})}>
          <Plus size={17} />
          Add address
        </Button>
      </PageTitle>
      <div className="address-grid">
        {state.addresses.map((a) => (
          <article className="panel saved-address" key={a.id}>
            <div className="row-between">
              <span className="address-icon">
                <MapPin size={23} />
              </span>
              {a.isDefault && (
                <span className="status-tag delivered">Default address</span>
              )}
            </div>
            <h2>{a.label}</h2>
            <b>{a.name}</b>
            <p>
              {a.line}
              <br />
              {a.city} – {a.pincode}
            </p>
            <small>{a.phone}</small>
            {a.instructions && <p className="muted small">{a.instructions}</p>}
            <div className="address-actions">
              <button className="text-link" onClick={() => setEditing(a)}>
                Edit address
              </button>
              {!a.isDefault && (
                <button
                  className="text-link"
                  onClick={async () => {
                    try {
                      await patch({
                        addresses: state.addresses.map((x) => ({
                          ...x,
                          isDefault: x.id === a.id,
                        })),
                      });
                      notify("Default address updated.");
                    } catch (e) {
                      notify(e.message, "error");
                    }
                  }}
                >
                  Make default
                </button>
              )}
              <button
                className="icon-button danger"
                onClick={() => setDeleting(a)}
                aria-label={`Delete ${a.label} address`}
              >
                <Trash2 size={16} />
              </button>
            </div>
          </article>
        ))}
        {!state.addresses.length && (
          <Empty
            icon={MapPin}
            title="Where’s home?"
            text="Add a delivery address to get started."
          />
        )}
      </div>
      {editing && (
        <AddressEditor
          address={editing.id ? editing : null}
          onClose={() => setEditing(null)}
        />
      )}{" "}
      {deleting && (
        <Modal title="Delete this address?" onClose={() => setDeleting(null)}>
          <div className="modal-content">
            <p>
              {deleting.line}, {deleting.city}
            </p>
            <div className="modal-actions">
              <Button variant="secondary" onClick={() => setDeleting(null)}>
                Keep address
              </Button>
              <Button
                onClick={async () => {
                  try {
                    const addresses = state.addresses.filter(
                      (a) => a.id !== deleting.id,
                    );
                    if (addresses.length && !addresses.some((a) => a.isDefault))
                      addresses[0] = { ...addresses[0], isDefault: true };
                    await patch({ addresses });
                    setDeleting(null);
                    notify("Address deleted.");
                  } catch (e) {
                    notify(e.message, "error");
                  }
                }}
              >
                Delete address
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
}
export function Payments() {
  const { mode, state, patch, notify } = useApp();
  const [editing, setEditing] = useState(false);
  const [nickname, setNickname] = useState(
    state.settings.cardNickname || "My demo card",
  );
  return (
    <div className="narrow-page">
      <PageTitle
        title="Payment methods"
        text={
          mode === "demo"
            ? "Explore the checkout experience with safe demo methods."
            : "This backend accepts cash on delivery."
        }
      />
      {mode === "demo" && (
        <>
          <div className="demo-credit-card">
            <div className="row-between">
              <b>forkly.</b>
              <span>DEMO CARD</span>
            </div>
            <CreditCard size={33} />
            <h2>•••• &nbsp; •••• &nbsp; •••• &nbsp; 4242</h2>
            <div className="row-between">
              <span>{state.settings.cardNickname || "My demo card"}</span>
              <span>No real charges</span>
            </div>
          </div>
          <div className="panel">
            <h2>
              <ShieldCheck size={20} />A safe way to explore
            </h2>
            <p className="muted">
              This is a sample card. No card number, CVV, banking credentials,
              or money are collected or stored. Demo UPI and cash on delivery
              are also available at checkout.
            </p>
            <Button variant="secondary" onClick={() => setEditing(true)}>
              Rename demo card
            </Button>
          </div>
        </>
      )}
      <div className="panel">
        <h3>
          <Wallet size={20} />
          Cash on delivery
        </h3>
        <p className="muted">
          Select cash at checkout and pay when your food arrives.
          {mode === "demo" && " No real order is sent in demo mode."}
        </p>
        <Link className="text-link" to="/cart">
          Back to your cart
          <ArrowRight size={16} />
        </Link>
      </div>
      {editing && (
        <Modal title="Name your demo card" onClose={() => setEditing(false)}>
          <form
            className="modal-content"
            onSubmit={async (e) => {
              e.preventDefault();
              try {
                await patch({
                  settings: { ...state.settings, cardNickname: nickname },
                });
                notify("Demo card updated.");
                setEditing(false);
              } catch (e) {
                notify(e.message, "error");
              }
            }}
          >
            <label className="field">
              Card nickname
              <input
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                maxLength={40}
                minLength={2}
                required
              />
            </label>
            <Button className="full">Save nickname</Button>
          </form>
        </Modal>
      )}
    </div>
  );
}
export function Preferences() {
  const { state, patch, mode, notify } = useApp();
  const [password, setPassword] = useState({
    currentPassword: "",
    newPassword: "",
  });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  if (mode === "api" && !state.signedIn)
    return (
      <Empty
        title="Sign in to manage settings"
        action="Sign in"
        to="/auth?next=/settings"
      />
    );
  return (
    <div className="narrow-page">
      <PageTitle
        title="Just the way you like it"
        text="Manage your preferences and security."
      />
      <div className="panel">
        <h2>Your preferences</h2>
        {[
          {
            key: "orderUpdates",
            label: "Order updates",
            text: "Save your preference for order notifications.",
          },
          {
            key: "offers",
            label: "Delicious deals",
            text: "Save your preference for promotional messages.",
          },
          {
            key: "contactless",
            label: "Contactless delivery",
            text: "Leave at the door by default at checkout.",
          },
        ].map((p) => (
          <label className="setting-row" key={p.key}>
            <div>
              <b>{p.label}</b>
              <small>{p.text}</small>
            </div>
            <input
              type="checkbox"
              role="switch"
              checked={state.settings[p.key]}
              onChange={async (e) => {
                try {
                  await patch({
                    settings: { ...state.settings, [p.key]: e.target.checked },
                  });
                  notify("Preference saved.");
                } catch (e) {
                  notify(e.message, "error");
                }
              }}
            />
          </label>
        ))}
        <p className="small muted">
          Push, email, and SMS delivery are not connected. These controls save
          preferences; contactless delivery is applied to checkout.
        </p>
      </div>
      <form
        className="panel"
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          setError("");
          try {
            if (mode === "api")
              await api("/auth/password", { method: "POST", body: password });
            notify(
              mode === "demo"
                ? "Demo password flow completed. No password is stored in demo mode."
                : "Password updated. Other sessions were signed out.",
            );
            setPassword({ currentPassword: "", newPassword: "" });
          } catch (e) {
            setError(e.message);
          } finally {
            setBusy(false);
          }
        }}
      >
        <h2>
          <KeyRound size={20} />
          Change password
        </h2>
        <label className="field">
          Current password
          <input
            type="password"
            value={password.currentPassword}
            onChange={(e) =>
              setPassword({ ...password, currentPassword: e.target.value })
            }
            required
            autoComplete="current-password"
          />
        </label>
        <label className="field">
          New password
          <input
            type="password"
            value={password.newPassword}
            onChange={(e) =>
              setPassword({ ...password, newPassword: e.target.value })
            }
            required
            minLength={8}
            maxLength={128}
            autoComplete="new-password"
          />
          <small>At least 8 characters.</small>
        </label>
        <ErrorText>{error}</ErrorText>
        <Button disabled={busy}>
          {busy
            ? "Updating…"
            : mode === "demo"
              ? "Try demo password change"
              : "Update password"}
        </Button>
      </form>
    </div>
  );
}
export function Auth() {
  const { login, mode, notify } = useApp();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [kind, setKind] = useState("login");
  const [fields, setFields] = useState({
    email: "",
    password: "",
    name: "",
    phone: "",
  });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [reset, setReset] = useState(false);
  return (
    <div className="auth-layout">
      <div className="auth-art">
        <img src={imagePath("burger")} alt="A fresh, delicious burger" />
        <div>
          <span className="eyebrow">FRESH FLAVORS. HAPPY MOMENTS.</span>
          <h2>
            A good day
            <br />
            starts with
            <br />
            <em>good food.</em>
          </h2>
          <p>Your next favorite meal is waiting.</p>
        </div>
      </div>
      <div className="auth-form">
        <Logo />
        <p className="eyebrow">YOUR TABLE IS READY</p>
        <h1>{kind === "login" ? "Welcome back." : "Hello, food lover."}</h1>
        <p className="muted">
          {kind === "login"
            ? "Sign in and find your next craving."
            : "A few details. A whole world of flavor."}
        </p>
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            setError("");
            setBusy(true);
            try {
              await login(kind, fields);
              const next = params.get("next") || "/";
              navigate(
                next.startsWith("/") && !next.startsWith("//") ? next : "/",
              );
            } catch (e) {
              setError(e.message);
            } finally {
              setBusy(false);
            }
          }}
        >
          {kind === "register" && (
            <label className="field">
              Full name
              <input
                value={fields.name}
                onChange={(e) => setFields({ ...fields, name: e.target.value })}
                minLength={2}
                maxLength={80}
                required
                autoComplete="name"
              />
            </label>
          )}
          <label className="field">
            Email address
            <input
              type="email"
              value={fields.email}
              onChange={(e) => setFields({ ...fields, email: e.target.value })}
              maxLength={254}
              required
              autoComplete="email"
              placeholder="you@example.com"
            />
          </label>
          <label className="field">
            Password
            <input
              type="password"
              value={fields.password}
              onChange={(e) =>
                setFields({ ...fields, password: e.target.value })
              }
              minLength={8}
              maxLength={128}
              required
              autoComplete={
                kind === "login" ? "current-password" : "new-password"
              }
              placeholder="At least 8 characters"
            />
          </label>
          {kind === "login" && (
            <button
              className="text-link forgot-link"
              type="button"
              onClick={() => setReset(true)}
            >
              Forgot password?
            </button>
          )}
          <ErrorText>{error}</ErrorText>
          <Button className="full" disabled={busy}>
            {busy
              ? "One moment…"
              : kind === "login"
                ? "Sign in"
                : "Create account"}
            <ArrowRight size={17} />
          </Button>
        </form>
        <p className="auth-switch">
          {kind === "login" ? "New around here?" : "Already a member?"}{" "}
          <button
            className="text-link"
            onClick={() => {
              setKind(kind === "login" ? "register" : "login");
              setError("");
            }}
          >
            {kind === "login" ? "Create an account" : "Sign in"}
          </button>
        </p>
        {mode === "demo" && (
          <p className="demo-auth-note">
            <ShieldCheck size={18} />
            Demo sign-in accepts any valid email and an 8-character password. No
            real account or password is stored. Use sample details.
          </p>
        )}
        <Link className="continue-guest" to="/">
          Continue exploring as a guest
          <ArrowRight size={15} />
        </Link>
      </div>
      {reset && (
        <Modal title="Forgot your password?" onClose={() => setReset(false)}>
          <form
            className="modal-content"
            onSubmit={(e) => {
              e.preventDefault();
              if (mode === "demo") {
                notify(
                  "Demo reset complete. Sign in with any 8-character demo password.",
                );
                setReset(false);
              } else
                setError(
                  "Email recovery is not connected. Ask the server operator to reset your password using the documented recovery command.",
                );
            }}
          >
            <p className="muted">
              {mode === "demo"
                ? "Try the password recovery flow. No email will be sent."
                : "Email recovery requires an email provider. Your operator can reset an account using the recovery command."}
            </p>
            <label className="field">
              Email address
              <input
                type="email"
                required
                defaultValue={fields.email}
                autoComplete="email"
              />
            </label>
            <ErrorText>{mode === "api" ? error : ""}</ErrorText>
            <Button className="full">
              {mode === "demo" ? "Try demo recovery" : "Check recovery options"}
            </Button>
          </form>
        </Modal>
      )}
    </div>
  );
}
export function Welcome() {
  const [step, setStep] = useState(0);
  const slides = [
    {
      icon: UtensilsCrossed,
      title: "Delicious food.",
      text: "Your favorite flavors, from kitchens that care. A little joy in every bite.",
    },
    {
      icon: Truck,
      title: "Fresh. Fast. Yours.",
      text: "Good things come to your door. Follow your order from kitchen to doorstep.",
    },
    {
      icon: ShieldCheck,
      title: "Made with care.",
      text: "Discover your next favorite restaurant and see what other food lovers think.",
    },
    {
      icon: CreditCard,
      title: "Simple checkout.",
      text: "Save your addresses, choose your meal, and enjoy an easy checkout.",
    },
  ];
  const slide = slides[step];
  const Icon = slide.icon;
  return (
    <div className="welcome-page">
      <Link className="text-link" to="/">
        Skip tour
        <ArrowRight size={16} />
      </Link>
      <div className="welcome-illustration">
        <Icon size={110} strokeWidth={1} />
      </div>
      <h1>{slide.title}</h1>
      <p>{slide.text}</p>
      <div className="tour-dots">
        {slides.map((s, i) => (
          <button
            className={step === i ? "active" : ""}
            aria-label={`View slide ${i + 1}`}
            key={i}
            onClick={() => setStep(i)}
          />
        ))}
      </div>
      {step < 3 ? (
        <Button onClick={() => setStep(step + 1)}>
          Next
          <ArrowRight size={17} />
        </Button>
      ) : (
        <Link to="/auth" className="button">
          Let’s get started
          <ArrowRight size={17} />
        </Link>
      )}
    </div>
  );
}

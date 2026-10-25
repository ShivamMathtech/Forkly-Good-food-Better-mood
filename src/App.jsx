import React, { Component } from "react";
import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import { UtensilsCrossed, RefreshCw } from "lucide-react";
import { AppProvider, useApp } from "./lib/store.jsx";
import { Shell, GlobalOverlays, Empty, Button } from "./components/ui.jsx";
import { Browse, Favorites, Offers, Restaurant } from "./pages/Browse.jsx";
import { Cart, Checkout } from "./pages/Checkout.jsx";
import { Orders, OrderDetail, Chat } from "./pages/Orders.jsx";
import {
  Account,
  Profile,
  Addresses,
  Payments,
  Preferences,
  Auth,
  Welcome,
} from "./pages/Account.jsx";
class ErrorBoundary extends Component {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? (
      <div className="startup">
        <h1>Let’s try that again.</h1>
        <p>
          Something interrupted this page. Your saved orders are still in your
          browser or account.
        </p>
        <Button onClick={() => location.reload()}>Reload Forkly</Button>
      </div>
    ) : (
      this.props.children
    );
  }
}
function Application() {
  const { mode, error } = useApp();
  if (error)
    return (
      <div className="startup">
        <UtensilsCrossed size={44} />
        <h1>We couldn’t reach the kitchen.</h1>
        <p>{error}</p>
        <div className="button-row">
          <Button onClick={() => location.reload()}>
            <RefreshCw size={16} />
            Retry connection
          </Button>
          <Button
            variant="secondary"
            onClick={() => {
              sessionStorage.setItem("forkly-mode", "demo");
              location.reload();
            }}
          >
            Explore demo mode
          </Button>
        </div>
      </div>
    );
  if (!mode)
    return (
      <div className="startup">
        <div className="loading-icon">
          <UtensilsCrossed size={44} />
        </div>
        <h2>Something good is coming.</h2>
      </div>
    );
  return (
    <>
      <Shell>
        <Routes>
          <Route path="/" element={<Browse />} />
          <Route path="/restaurant/:id" element={<Restaurant />} />
          <Route path="/favorites" element={<Favorites />} />
          <Route path="/offers" element={<Offers />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/orders" element={<Orders />} />
          <Route path="/orders/:id" element={<OrderDetail />} />
          <Route path="/orders/:id/chat" element={<Chat />} />
          <Route path="/account" element={<Account />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/addresses" element={<Addresses />} />
          <Route path="/payments" element={<Payments />} />
          <Route path="/settings" element={<Preferences />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/welcome" element={<Welcome />} />
          <Route
            path="*"
            element={
              <Empty
                title="This page is off the menu"
                text="Let’s find you something delicious instead."
                action="Back to Forkly"
              />
            }
          />
        </Routes>
      </Shell>
      <GlobalOverlays />
    </>
  );
}
export default function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <AppProvider>
          <Application />
        </AppProvider>
      </BrowserRouter>
    </ErrorBoundary>
  );
}

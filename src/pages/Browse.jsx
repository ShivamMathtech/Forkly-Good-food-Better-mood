import React, { useState } from "react";
import { Link, useSearchParams, useParams } from "react-router-dom";
import {
  ArrowRight,
  SlidersHorizontal,
  Bike,
  Star,
  Clock3,
  MapPin,
  Heart,
  ChevronLeft,
  Check,
  Leaf,
  Flame,
  Pizza,
  Salad,
  Soup,
  CakeSlice,
  Coffee,
  LayoutGrid,
  Sandwich,
  X,
} from "lucide-react";
import {
  categories,
  foods,
  restaurants,
  getRestaurant,
  imagePath,
  coupons,
} from "../../shared/catalog.mjs";
import { useApp } from "../lib/store.jsx";
import {
  FoodCard,
  RestaurantCard,
  MiniCart,
  Button,
  Modal,
  Empty,
  PageTitle,
} from "../components/ui.jsx";
const icons = [LayoutGrid, Sandwich, Pizza, Salad, Soup, CakeSlice, Coffee];
export function Browse() {
  const { state } = useApp();
  const [params, setParams] = useSearchParams();
  const q = (params.get("q") || "").toLowerCase();
  const category = params.get("category") || "All";
  const [filterOpen, setFilterOpen] = useState(false);
  const [veg, setVeg] = useState(false);
  const [sort, setSort] = useState("recommended");
  const [budget, setBudget] = useState(500);
  const [showAll, setShowAll] = useState(false);
  const filtered = foods
    .filter(
      (f) =>
        (category === "All" || f.category === category) &&
        (!veg || f.veg) &&
        f.price <= budget * 100 &&
        `${f.name} ${f.category} ${getRestaurant(f.restaurantId).name} ${f.description}`
          .toLowerCase()
          .includes(q),
    )
    .sort((a, b) =>
      sort === "price"
        ? a.price - b.price
        : sort === "rating"
          ? b.rating - a.rating
          : 0,
    );
  const nearby = restaurants.filter(
    (r) =>
      !q ||
      `${r.name} ${r.cuisine}`.toLowerCase().includes(q) ||
      filtered.some((f) => f.restaurantId === r.id),
  );
  const activeFilters = veg || budget < 500 || sort !== "recommended";
  return (
    <div className="browse-layout">
      <div className="browse-main">
        <div className="welcome-row">
          <div>
            <p className="eyebrow">YOUR NEXT GREAT MEAL STARTS HERE</p>
            <h1>
              Hey{" "}
              {state.profile.name === "Guest"
                ? "there"
                : state.profile.name.split(" ")[0]}
              , hungry? <span className="wave">✦</span>
            </h1>
            <p className="muted">
              Something delicious is always around the corner.
            </p>
          </div>
          <span className="delivery-chip">
            <Bike size={17} />
            Fresh & fast
          </span>
        </div>
        {!q && (
          <section className="hero">
            <div className="hero-copy">
              <span className="hero-label">
                <span /> A LITTLE JOY, DELIVERED.
              </span>
              <h2>
                Good food.
                <br />
                <em>Better mood.</em>
              </h2>
              <p>
                Your favorite flavors, from the places you love.
                <br className="desktop-only" /> Freshly prepared and delivered
                to your door.
              </p>
              <Link className="button" to="/offers">
                Explore offers
                <ArrowRight size={17} />
              </Link>
              <div className="hero-proof">
                <span className="tiny-avatars">
                  <i>J</i>
                  <i>M</i>
                  <i>A</i>
                </span>
                <div>
                  <span className="stars">★★★★★</span>
                  <small>Loved by our food community</small>
                </div>
              </div>
            </div>
            <div className="hero-photo">
              <img
                src={imagePath("burger")}
                alt="Freshly made burger stacked with vegetables and cheese"
              />
              <div className="hero-photo-shade" />
              <span className="hero-stamp">
                <b>20%</b>
                <span>
                  OFF YOUR
                  <br />
                  FIRST ORDER
                </span>
              </span>
              <div className="floating-food-label">
                <span className="round-check">
                  <Check size={15} />
                </span>
                <div>
                  <b>Made fresh. Just for you.</b>
                  <small>Something worth craving.</small>
                </div>
              </div>
            </div>
          </section>
        )}
        <div className="section-heading categories-heading">
          <div>
            <p className="eyebrow">FOLLOW YOUR CRAVINGS</p>
            <h2>What’s on your mind?</h2>
          </div>
          <button
            className={`filter-button ${activeFilters ? "active" : ""}`}
            onClick={() => setFilterOpen(true)}
          >
            <SlidersHorizontal size={16} />
            Filters{activeFilters && <span className="filter-dot" />}
          </button>
        </div>
        <div className="categories">
          {categories.map((cat, index) => {
            const Icon = icons[index];
            return (
              <button
                className={`category ${category === cat ? "selected" : ""}`}
                key={cat}
                onClick={() => {
                  const next = new URLSearchParams(params);
                  next.set("category", cat);
                  setParams(next);
                }}
              >
                <span>
                  <Icon size={24} strokeWidth={1.5} />
                </span>
                <b>{cat}</b>
              </button>
            );
          })}
        </div>
        <section>
          <div className="section-heading">
            <div>
              <h2>
                {q
                  ? `Results for “${params.get("q")}”`
                  : category === "All"
                    ? "Popular on Forkly"
                    : `${category} you’ll love`}
              </h2>
              <p className="muted">
                {q || activeFilters
                  ? `${filtered.length} delicious options for you`
                  : "The dishes everyone is coming back for."}
              </p>
            </div>
            <button className="text-link" onClick={() => setShowAll(!showAll)}>
              {showAll ? "Show less" : "View all"}
              <ArrowRight size={15} />
            </button>
          </div>
          {filtered.length ? (
            <div className="food-grid">
              {filtered
                .slice(0, showAll || q || category !== "All" ? 50 : 8)
                .map((f) => (
                  <FoodCard key={f.id} food={f} />
                ))}
            </div>
          ) : (
            <Empty
              title="No bites found"
              text="Try a different search, category, or price filter."
            />
          )}
        </section>
        {!q && (
          <div className="mid-banner">
            <div className="mid-banner-icon">
              <Bike size={35} />
            </div>
            <div>
              <b>A good meal shouldn’t be a long wait.</b>
              <p>Discover delicious food from your neighborhood.</p>
            </div>
            <a href="#nearby" className="text-link">
              Find your favorite
              <ArrowRight size={16} />
            </a>
          </div>
        )}
        <section id="nearby">
          <div className="section-heading">
            <div>
              <p className="eyebrow">LOCAL FLAVORS, BIG LOVE</p>
              <h2>Restaurants near you</h2>
              <p className="muted">Great kitchens. Even better food.</p>
            </div>
            <span className="small muted">
              {nearby.length} places to explore
            </span>
          </div>
          <div className="restaurant-grid">
            {nearby.map((r) => (
              <RestaurantCard key={r.id} restaurant={r} />
            ))}
          </div>
          {!nearby.length && (
            <Empty
              title="No restaurants found"
              text="Try searching for a cuisine like pizza or Asian."
            />
          )}
        </section>
      </div>
      <MiniCart />
      {filterOpen && (
        <Modal
          title="Find your perfect bite"
          onClose={() => setFilterOpen(false)}
        >
          <div className="modal-content">
            <label className="choice">
              <input
                type="checkbox"
                checked={veg}
                onChange={(e) => setVeg(e.target.checked)}
              />
              <span>
                <Leaf size={16} /> Vegetarian only
              </span>
            </label>
            <label className="field">
              Maximum item price: ₹{budget}
              <input
                type="range"
                min="150"
                max="500"
                step="50"
                value={budget}
                onChange={(e) => setBudget(Number(e.target.value))}
              />
            </label>
            <label className="field">
              Sort by
              <select value={sort} onChange={(e) => setSort(e.target.value)}>
                <option value="recommended">Recommended</option>
                <option value="rating">Highest rated</option>
                <option value="price">Price: low to high</option>
              </select>
            </label>
            <div className="modal-actions">
              <Button
                variant="secondary"
                onClick={() => {
                  setVeg(false);
                  setBudget(500);
                  setSort("recommended");
                }}
              >
                Reset
              </Button>
              <Button onClick={() => setFilterOpen(false)}>
                Show {filtered.length} dishes
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
export function Restaurant() {
  const { id } = useParams();
  const r = getRestaurant(id);
  const { state } = useApp();
  const [tab, setTab] = useState("Menu");
  const [search, setSearch] = useState("");
  const [veg, setVeg] = useState(false);
  if (!r)
    return (
      <Empty
        title="Restaurant not found"
        text="Explore our neighborhood restaurants instead."
        action="Back to explore"
      />
    );
  const menu = foods.filter(
    (f) =>
      f.restaurantId === id &&
      f.name.toLowerCase().includes(search.toLowerCase()) &&
      (!veg || f.veg),
  );
  const reviews = state.reviews.filter((review) =>
    state.orders.some((o) => o.id === review.orderId && o.restaurantId === id),
  );
  return (
    <>
      <Link className="back-link" to="/">
        <ChevronLeft size={16} />
        Back to explore
      </Link>
      <div className="restaurant-hero">
        <img src={imagePath(r.image)} alt={r.name} />
        <div>
          <span className="pill">{r.tag}</span>
          <h1>{r.name}</h1>
          <p>{r.cuisine}</p>
          <div className="restaurant-hero-meta">
            <span>
              <Star size={16} fill="currentColor" />
              {r.rating} ({r.reviews} sample ratings)
            </span>
            <span>
              <Clock3 size={16} />
              {r.minutes}–{r.minutes + 10} min
            </span>
            <span>
              <MapPin size={16} />
              {r.distance}
            </span>
          </div>
        </div>
      </div>
      <div className="restaurant-offer">
        <TicketIcon />
        {r.offer}
        <span>Use WELCOME20 at checkout</span>
      </div>
      <div className="browse-layout">
        <div>
          <div className="tabs">
            {["Menu", "Reviews", "About"].map((t) => (
              <button
                className={tab === t ? "active" : ""}
                onClick={() => setTab(t)}
                key={t}
              >
                {t}
              </button>
            ))}
          </div>
          {tab === "Menu" && (
            <>
              <div className="menu-controls">
                <input
                  className="input"
                  aria-label="Search this menu"
                  placeholder="Search this menu…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
                <label className="inline-choice">
                  <input
                    type="checkbox"
                    checked={veg}
                    onChange={(e) => setVeg(e.target.checked)}
                  />
                  Veg only
                </label>
              </div>
              <div className="section-heading">
                <h2>Made fresh, for you</h2>
                <span className="muted small">{menu.length} dishes</span>
              </div>
              <div className="food-grid restaurant-menu">
                {menu.map((f) => (
                  <FoodCard food={f} key={f.id} />
                ))}
              </div>
              {!menu.length && (
                <Empty
                  title="No matching dishes"
                  text="Try clearing your search or vegetarian filter."
                />
              )}
            </>
          )}
          {tab === "About" && (
            <div className="panel">
              <h2>A little about us</h2>
              <p>{r.about}</p>
              <hr />
              <h3>Find us</h3>
              <p>{r.address}</p>
              <p>Sample opening hours: 10:00 AM – 10:00 PM</p>
              <p className="muted">
                Restaurant listings, ratings, and distances are sample data for
                this application.
              </p>
            </div>
          )}
          {tab === "Reviews" && (
            <div className="panel">
              <div className="review-summary">
                <b>{r.rating}</b>
                <div>
                  <span className="stars">★★★★★</span>
                  <p>{r.reviews} illustrative ratings</p>
                </div>
              </div>
              <p className="muted">
                Place and complete an order to write your own review.
              </p>
              {reviews.map((review) => (
                <div className="review" key={review.orderId}>
                  <b>{state.profile.name}</b>
                  <span className="stars">{"★".repeat(review.rating)}</span>
                  <p>{review.comment}</p>
                </div>
              ))}
              <div className="review">
                <span className="sample-label">SAMPLE REVIEW</span>
                <b>Jordan P.</b>
                <span className="stars">★★★★★</span>
                <p>
                  Fresh, flavorful, and exactly what I was craving. The portion
                  size was perfect!
                </p>
              </div>
            </div>
          )}
        </div>
        <MiniCart />
      </div>
    </>
  );
}
const TicketIcon = () => <Flame size={20} />;
export function Favorites() {
  const { state } = useApp();
  const saved = foods.filter((f) => state.favorites.includes(f.id));
  return (
    <>
      <PageTitle
        eyebrow="THE USUALS, AND THE UNFORGETTABLE"
        title="Your favorites"
        text="All the good stuff, saved in one place."
      />
      {saved.length ? (
        <div className="food-grid favorites-grid">
          {saved.map((f) => (
            <FoodCard food={f} key={f.id} />
          ))}
        </div>
      ) : (
        <Empty
          icon={Heart}
          title="Good food is worth remembering"
          text="Tap the heart on a dish to keep it here for your next craving."
          action="Find your favorites"
        />
      )}
    </>
  );
}
export function Offers() {
  const { setCoupon, notify } = useApp();
  return (
    <>
      <PageTitle
        eyebrow="A LITTLE MORE DELICIOUS FOR LESS"
        title="Good food. Great deals."
        text="Find your next excuse to treat yourself. One offer per order."
      />
      <div className="offer-grid">
        {coupons.map((c, i) => (
          <article className={`offer-card ${c.color}`} key={c.code}>
            <div className="offer-art">
              <TicketIcon />
              <strong>{c.freeDelivery ? "FREE" : `${c.percent}%`}</strong>
              <span>{c.freeDelivery ? "DELIVERY" : "OFF YOUR ORDER"}</span>
            </div>
            <div className="offer-info">
              <span className="eyebrow">
                {i === 0 ? "A WARM WELCOME" : "MORE REASONS TO ORDER"}
              </span>
              <h2>{c.title}</h2>
              <p>{c.description}</p>
              <div className="coupon-code">
                <code>{c.code}</code>
                <button
                  onClick={async () => {
                    try {
                      await navigator.clipboard.writeText(c.code);
                      notify("Promo code copied.");
                    } catch {
                      notify(`Use code ${c.code} at checkout.`);
                    }
                  }}
                >
                  Copy code
                </button>
              </div>
              <Link
                className="button full"
                to="/"
                onClick={() => {
                  setCoupon(c.code);
                  notify(`${c.code} selected. Minimum order applies.`);
                }}
              >
                Use offer
                <ArrowRight size={17} />
              </Link>
            </div>
          </article>
        ))}
      </div>
      <div className="panel offer-note">
        <h3>A few good things to know</h3>
        <p>
          Offers apply to the item subtotal before delivery, fees, and taxes.
          Your discount appears in checkout once the minimum is met. WELCOME20
          is reusable in this demo so you can test the complete flow.
        </p>
      </div>
    </>
  );
}

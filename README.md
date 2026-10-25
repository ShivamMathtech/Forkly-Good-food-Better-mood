# Forkly — Good food. Better mood.

A complete responsive React food-ordering application inspired by the supplied orange-and-white mobile food-delivery UI. Includes a functional browser demo, an optional Node.js/SQLite API, Windows launch scripts, bundled food photos, and a Vercel-ready static build.

**The default frontend works without a backend, database, API key, or environment file.** Upload the source to GitHub and import it into Vercel. Browsing, filters, favorites, cart customization, coupons, checkout, demo orders, tracking, reviews, chat, profile, and addresses work in the browser.

## Start in 2 minutes

Install **Node.js 24 LTS** from https://nodejs.org/ (includes npm). Extract the ZIP before running anything.

### Windows

Double-click **`start-demo.bat`**. It installs dependencies on the first run and opens the frontend. Keep the terminal window open.

For real local API/database operation, use **`start-fullstack.bat`** and register a new account in the app. The frontend runs at `http://localhost:5173`; the API listens on `http://127.0.0.1:4000`.

### Terminal (Windows, macOS, Linux)

Run these commands from the folder containing `package.json`:

```bash
npm ci
npm run dev
```

Open the local URL printed by Vite. The normal port is **5173**. To use the backend:

```bash
npm run dev:full
```

`npm run dev:full` explicitly sets API mode and starts both processes. No separate database installation is required: Node 24 includes SQLite support. The database is created automatically under `server/data/forkly.sqlite`.

## Deploy the frontend on Vercel

The included `vercel.json` configures Vite, the build command, output directory, and SPA deep links.

| Setting | Value |
|---|---|
| Root Directory | The directory containing `package.json` and `vercel.json` |
| Framework Preset | Vite |
| Node.js Version | 24.x |
| Install Command | `npm ci` |
| Build Command | `npm run build` |
| Output Directory | `dist` |
| Environment variables | None required for demo mode |

If you upload the entire `Forkly-Food-Delivery` folder as a subdirectory in GitHub, select that folder as the Root Directory. If you upload its contents to the repository root, leave Root Directory as `.`.

**Do not upload `node_modules`. Do not choose `src`, `server`, or `public` as the Vercel root.** The Vercel deployment serves the complete frontend demo. It does not run the optional SQLite server.

See **[VERCEL_DEPLOYMENT.md](VERCEL_DEPLOYMENT.md)** for step-by-step deployment and troubleshooting.

## Try the complete experience

1. Open a dish and choose its portion, add-ons, quantity, and instructions.
2. Add it to your cart. Each order belongs to a single restaurant; switching restaurants asks before replacing the cart.
3. Add enough items to reach ₹299 and apply **WELCOME20** for a 20% discount, capped at ₹150.
4. Continue to checkout, select/add an address, choose a demo payment option, and optionally tip.
5. Place a **demo order**. It progresses from confirmed → preparing → on the way → delivered in approximately 2½ minutes.
6. Use **Skip demo to delivered** to test a review immediately. Send a demo chat message, download a text receipt, or reorder.
7. Refresh the page: saved cart, orders, favorites, profile, addresses, reviews, messages, and preferences persist locally.
8. Use **My account → Reset demo data** to clear this browser's sample data.

Demo sign-in accepts any valid sample email and an 8-character password. It is a local UI demonstration, not real authentication. It does not store the password. Use sample details. A demo browser has one local profile; different sign-in emails do not create isolated demo accounts.

## Included screens and behavior

- Four-step welcome tour; demo sign-in, signup, and recovery flows.
- Home with categories, restaurant search, dish search, vegetarian and price filters, and sorting.
- Six sample restaurant pages with menu, about, and reviews tabs; 24 dishes.
- Dish customization, favorites, single-restaurant cart, quantity controls, and item removal.
- Three voucher codes, minimums, discount caps, free delivery threshold, fee, tax calculation, and optional tips.
- Address creation, editing, deletion, and default selection; recipient/phone/PIN validation.
- Cash-on-delivery checkout and simulated card/UPI methods in demo mode.
- Order history, tracking, early cancellation, reorder, text receipt download, reviews, and order chat.
- Profile, saved preferences, demo payment card nickname, account and password flows.
- Desktop sidebar and cart summary; tablet layout and mobile bottom navigation.
- Modal keyboard support, visible focus styles, labeled inputs, reduced-motion support, loading and error states.

## Modes and persistence

| Mode | Selection | Behavior |
|---|---|---|
| Demo (default) | No configuration, or `VITE_DATA_MODE=demo` | Browser-local data and simulated transactions; no API requests |
| API | `npm run dev:full`, or `VITE_DATA_MODE=api` at build time | Real accounts, SQLite persistence, authorized orders/messages/reviews; backend required |
| Auto | `VITE_DATA_MODE=auto` at build time | Check the API once at startup; use demo if unavailable |

`VITE_API_URL` defaults to `/api`. For a remote backend, set it to a complete HTTPS API base such as `https://your-api.example/api` and rebuild. Frontend `VITE_` values are public and are compiled into the bundle; never put secrets in them.

Auto mode chooses its data store at startup. It does **not** silently switch a pending real checkout into a demo order when the API fails. Demo and API data are separate and are not automatically migrated. Cart contents are browser-local in either mode. Demo data is per browser/origin, not shared between devices. If storage is blocked, the demo stays usable in memory, but persistence is unavailable.

## Backend capabilities

The optional backend implements salted scrypt password hashes, random bearer sessions stored as hashes, session expiry/revocation, account-specific saved data, validated addresses and favorites, server-authoritative menu pricing, transactional idempotent order creation, order ownership checks, cancellation rules, post-delivery reviews, and stored customer/support messages. CORS allowlists, request size limits, and simple per-process rate limits are included.

API mode supports **cash on delivery**. Card/UPI processing, real GPS/rider dispatch, email recovery, SMS/push notifications, social login, and a restaurant administrator web portal are not connected. The map, catalog photos, restaurants, distances, and aggregate ratings are illustrative. Taxes/fees are sample application rules, not a tax invoice implementation.

Restaurant operations use the local operator CLI documented in **[docs/BACKEND.md](docs/BACKEND.md)**. The operator can advance order status, view/reply to messages, and recover accounts. No privileged endpoint or default administrator password is exposed.

## Commands

| Command | Purpose |
|---|---|
| `npm run dev` | Frontend; demo unless configured otherwise |
| `npm run dev:full` | Frontend plus API, explicitly in API mode |
| `npm run server` | API on port 4000; also serves a previously built `dist` |
| `npm run build` | Production frontend into `dist` |
| `npm run preview` | Serve the production frontend build for inspection |
| `npm test` | Business logic and real HTTP/SQLite integration tests |
| `npm run check` | Tests followed by production build |

A prebuilt **demo** `dist/` is included in the ZIP for convenience. Serve it with `npm run preview`; do not open `dist/index.html` via a `file://` URL. Git ignores generated `dist/` because Vercel builds fresh from source.

## Project structure

| Path | Purpose |
|---|---|
| `src/pages/` | Browse, restaurant, favorites, offers, checkout, orders, chat, account and authentication |
| `src/components/ui.jsx` | Shared layouts, dialogs, cards, cart summary, bill and controls |
| `src/lib/store.jsx` | React application state and actions |
| `src/lib/repository.js` | Explicit demo/API persistence adapters |
| `src/styles.css` | Responsive styling and mobile navigation |
| `shared/catalog.mjs` | Menu, restaurant, voucher, option and sample profile data |
| `shared/order.mjs` | Authoritative totals, cart validation, address validation, order lifecycle |
| `server/` | HTTP API, SQLite schema, password/session helpers, operator CLI |
| `tests/` | Automated business rule and API integration tests |
| `public/images/` | Bundled photos, requiring no external image service at runtime |
| `docs/` | API guide, testing notes, assets and implementation details |
| `qa/responsive.html` | Development-only mobile/tablet viewport inspection page |

Frontend runtime dependencies are React, React DOM, React Router and Lucide icons. Vite and its React plugin build the app. The backend uses Node built-ins, avoiding native SQLite npm installation problems on Windows.

## Verification and limitations

See **[docs/TESTING.md](docs/TESTING.md)** for checks performed and exact coverage. A local production build is not a live Vercel deployment: you still need to import/deploy the repository in your Vercel account. Native Windows execution and real-device Safari/Android tests have not been performed in this Linux environment.

This is a complete runnable demo and local full-stack foundation. A public business launch needs actual restaurant operations, payment and notification providers, email delivery/verification, production monitoring, backups, abuse controls, and deployment-specific security review.

## Assets and licensing

New application code is supplied under the MIT license. Food photography is bundled from Unsplash; exact download URLs are in `docs/image-sources.json`. Photography remains subject to its own license: https://unsplash.com/license. Photos are representative and reused across some sample menu items. Lucide icons retain their ISC license; dependencies retain their respective licenses. The supplied UI reference was used for visual direction and is not redistributed in this archive.

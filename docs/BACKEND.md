# Forkly API and restaurant operations

## Run

Use Node.js 24 LTS. From the project root:

```bash
npm ci
npm run dev:full
```

Open `http://localhost:5173`, sign up with a new email/password, and add a delivery address. The API uses `http://127.0.0.1:4000/api` through Vite's development proxy. No seeded user accounts or shared administrator credentials exist.

For API only, use `npm run server`. For a combined production frontend/server on one persistent host, set `VITE_DATA_MODE=api` and `VITE_API_URL=/api` in `.env`, run `npm run build`, then `npm start`. Add the actual origin (scheme, hostname, and port) to `ALLOWED_ORIGINS`. Bind `HOST=0.0.0.0` only when the deployment requires access outside localhost.

The database path defaults to `server/data/forkly.sqlite`; configure `DB_PATH` for a persistent volume. It contains users, session hashes, orders, checkout idempotency keys, reviews, and messages. Back up SQLite consistently (use the SQLite backup mechanism or stop the process before copying the database and its WAL files). Do not commit runtime data.

## API contract

JSON requests use `Content-Type: application/json`. Successful authentication returns a random bearer token. Send `Authorization: Bearer TOKEN` for private routes. Tokens expire after seven days and are stored hashed in the database. The browser stores its token in sessionStorage; closing the tab signs that browser session out. Error responses are `{ "error": "Human-readable message" }`.

| Method | Path (under `/api`) | Behavior |
|---|---|---|
| GET | `/health` | Public service readiness |
| GET | `/catalog` | Public bundled food/restaurant/coupon data |
| POST | `/auth/register` | `{name,email,password}` → token/profile |
| POST | `/auth/login` | `{email,password}` → token/profile |
| POST | `/auth/logout` | Revoke the active token |
| POST | `/auth/password` | `{currentPassword,newPassword}`; revoke other sessions |
| GET | `/state` | Current profile, addresses, favorites, settings, orders, reviews, messages |
| PATCH | `/state` | Change only profile, addresses, favorites, or settings |
| GET | `/orders` | Current user's orders |
| POST | `/orders` | Validate/reprice checkout, persist an order atomically |
| GET | `/orders/:id` | Current user's order |
| POST | `/orders/:id/cancel` | Cancel only while status is `placed` |
| POST | `/orders/:id/review` | `{rating:1..5,comment}`; after delivery; upsert |
| POST | `/orders/:id/messages` | `{text}`; save a customer message |

An authenticated user cannot access another user's orders, messages, or reviews. Unknown/foreign orders return 404. Direct state patches cannot modify orders, roles, messages, review state, or session state.

### Checkout example

```json
{
  "items": [
    {"foodId":"classic-burger","quantity":2,"size":"regular","extras":["cheese"],"note":"No onions"}
  ],
  "coupon":"WELCOME20",
  "tip":2000,
  "payment":"cash",
  "instructions":"Contactless delivery.",
  "address":{
    "id":"home",
    "label":"Home",
    "name":"Demo Customer",
    "phone":"9876543210",
    "line":"12 Example Road",
    "city":"Dehradun",
    "pincode":"248001",
    "instructions":"Ring the bell",
    "isDefault":true
  }
}
```

Send a unique `Idempotency-Key` header (8–100 alphanumeric/hyphen/underscore characters). A retry with the same key and identical body returns the same order. Reusing a key with different data returns 409. Prices sent by a client are ignored; all totals are recalculated against `shared/catalog.mjs`.

Amounts are integer **paise**. Quantity is 1–20 per line, up to 50 lines, one restaurant per order. Delivery is ₹29 below ₹499; the platform fee is ₹5; the illustrative tax rate is 5% of the discounted item subtotal. Tips are 0–₹500. Coupon minimums, caps, and discounts are shared with the frontend. These are application demo rules, not a real billing/tax integration.

### Profile and preference validation

Names are 2–80 characters, phone numbers are 10 digits, and PIN codes are six digits with a nonzero leading digit. The UI and server validate address fields. Saved addresses have unique IDs and exactly one default when nonempty; maximum ten addresses. Favorite IDs must exist in the catalog. The sign-in email is immutable through the profile endpoint.

## Restaurant operator CLI

Use these commands only on a machine with access to the application's database. They do not use a public administrator endpoint. Keep this environment restricted to trusted operators.

```bash
node --env-file-if-exists=.env server/manage.mjs orders
node --env-file-if-exists=.env server/manage.mjs status ORDER_ID preparing
node --env-file-if-exists=.env server/manage.mjs status ORDER_ID on_the_way
node --env-file-if-exists=.env server/manage.mjs status ORDER_ID delivered
node --env-file-if-exists=.env server/manage.mjs messages ORDER_ID
node --env-file-if-exists=.env server/manage.mjs reply ORDER_ID "Your order is on its way."
```

Replace `ORDER_ID` with the real ID printed by `orders`. Status transitions are enforced in sequence; a nonfinal order can also be cancelled. Customer tracking and chat poll every 15 seconds in API mode. There is no fake GPS location or auto-completing delivery in API mode.

For local account recovery:

```bash
node --env-file-if-exists=.env server/manage.mjs reset-password customer@example.com
```

This generates a temporary random password and revokes all existing sessions. Deliver it securely to the verified owner; they can change it in the app. Email recovery/verification is not implemented; the UI says so. Never enable an unauthenticated endpoint that hands reset tokens to arbitrary users.

## Integration boundaries

- Online payments: not connected. The backend rejects demo-card/demo-upi and accepts cash only.
- Maps/riders: illustrative map only; connect a real geocoding/routing and driver-location provider for live logistics.
- Notifications: preferences are saved; email, SMS, and push transports are not implemented.
- Chat: stored messages and operator replies; polling, not WebSockets.
- Catalog: a shared source module, not a menu-management CMS. Rebuild frontend after changing catalog data and deploy backend/frontend together.
- Authentication: local email/password accounts; no social OAuth or email verification.
- Database: single-host SQLite, not distributed/multi-region storage. Use a managed database and review transaction/concurrency needs before scaling.
- Rate limits: process-local and based on the direct socket address. Configure a trusted reverse proxy/edge limit for production without trusting spoofable forwarded headers.
- API-backed data is never silently replaced with demo data during a failed mutation.

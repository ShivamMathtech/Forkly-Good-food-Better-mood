# Verification record

Prepared 25 October 2026. Environment: Linux, Node.js 24.22.1, npm 11.9.0, Chromium browser preview.

## Automated checks

`npm run check` passed: **15 tests passed, 0 failed**, followed by a successful Vite production build.

Covered behavior:

1. Public API health/catalog and unauthenticated private-data rejection.
2. Registration/login, unique emails, and salted password hashing.
3. Address/favorite validation and rejection of protected state edits.
4. Server-side repricing, durable order insertion, idempotent retries, and conflicting checkout-key rejection.
5. User isolation for order retrieval, cancellation, reviews, and messages.
6. Invalid online payment rejection with no additional order inserted.
7. Stored messages, delivery-gated reviews, and late cancellation rejection.
8. Password-change session revocation and logout.
9. Ignoring forged client prices.
10. Portion/add-on arithmetic, deduplication, integer paise totals, and tips.
11. Voucher minimums, caps, invalid codes, and free delivery.
12. Invalid quantity/size/add-on/tip and mixed-restaurant rejection.
13. Recipient/address/phone/PIN validation.
14. Simulated delivery milestones and final status handling.
15. UUID-shaped, unique identifiers that work in HTTP previews as well as HTTPS.

The HTTP integration tests create an actual temporary SQLite database and send requests to an ephemeral Node server. They remove their data afterward. No test accounts or database files are included in the release.

## Browser checks completed

The default demo was tested with the API stopped:

- Desktop home loaded with bundled photos, navigation, category controls, and cart panel.
- Added a Classic Smash Burger with Large portion, Extra cheese, and instructions.
- Cart showed ₹339.00 for the customized item; WELCOME20 produced ₹67.80 savings.
- Checkout with a simulated card and ₹20 tip produced the expected ₹338.76 total.
- Order creation cleared the cart and showed the order tracking page.
- Reload preserved the order and its totals.
- Skipping the demo delivery unlocked a review; the review was saved.
- A support chat message was saved and received an explicitly simulated reply.
- Phone layouts inspected at 390 × 844 and 320 × 740; tablet layout inspected in a 768-pixel-wide iframe.
- A narrow-phone horizontal overflow defect was corrected and verified: viewport width and document scroll width both 305 CSS pixels after the scrollbar.
- Mobile favorites persisted and displayed the selected dish.
- A second mobile delivery address was added and set as default successfully.
- Category filtering, vegetarian filtering, and ascending-price sorting returned the expected dishes.
- A static-only production bundle loaded and displayed the saved order through client navigation, with no API process.

The QA helper `qa/responsive.html` is for Vite development only. It is not included in the production output. The simple static QA file server does not implement Vercel's SPA fallback; direct deep-link handling on Vercel is supplied by the included `vercel.json` rewrite and has not been tested against a live Vercel deployment.

## Release archive check

The ZIP passed its CRC integrity check. A fresh extraction installed successfully with `npm ci` and produced an identical production bundle with `npm run build`. The archive contains source, images, documentation, launch scripts, tests, and a prebuilt demo; it excludes `node_modules`, secrets, and runtime database data. The npm lockfile includes optional Windows x64/ARM64 build dependencies.

## What has not been tested or connected

- No live Vercel account deployment was performed.
- Windows batch scripts were reviewed and packaged, but not executed on native Windows.
- No physical Android/iOS device or Safari run was performed.
- No live restaurant, rider, GPS, payment, email, SMS, push, or OAuth service was connected.
- No production load test or external penetration test was performed.

## Re-run

```bash
npm ci
npm run check
npm run preview
```

For full-stack testing, run `npm run dev:full`, register an account, add an address, and place a cash-on-delivery order. Use the operator commands in `BACKEND.md` to advance delivery and reply to a customer. For responsive inspection, run `npm run dev` and open `/qa/responsive.html`, or resize your browser directly.

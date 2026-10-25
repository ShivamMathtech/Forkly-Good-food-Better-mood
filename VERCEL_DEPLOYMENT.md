# Deploy Forkly on Vercel — backend optional

The supplied configuration deploys the **complete React frontend** as a static Vite SPA. Demo mode is the default. The application does not need a running server, database, payment key, or map key for its demo flows.

## 1. Extract and check locally

Install Node.js 24 LTS, extract the ZIP, and open a terminal in the folder with `package.json`:

```bash
npm ci
npm run build
npm run preview
```

Open the URL printed by Vite. Navigate to a restaurant, build a cart, check out, and refresh an order page.

## 2. Upload source to GitHub

Create a repository in your own GitHub account and add the project contents. Include:

- `package.json` and `package-lock.json`
- `index.html`, `vite.config.js`, and `vercel.json`
- `src/`, `shared/`, and `public/`
- The remaining source and documentation if desired

Exclude `node_modules/`, `.env`, `.env.local`, `.vercel/`, and `server/data/`. The included `.gitignore` handles these when you use Git. Do not upload a Linux or Windows `node_modules` folder; Vercel installs its own platform-specific dependencies.

## 3. Import in Vercel

Open https://vercel.com/new and import your repository.

| Setting | Required value |
|---|---|
| Root Directory | Folder containing `package.json` and `vercel.json` |
| Framework Preset | Vite |
| Node.js Version | 24.x |
| Install Command | `npm ci` |
| Build Command | `npm run build` |
| Output Directory | `dist` |

If the repository contains `Forkly-Food-Delivery/package.json`, choose `Forkly-Food-Delivery` as Root Directory. If `package.json` is at the repository root, use `.`.

Leave environment variables empty. You can explicitly add `VITE_DATA_MODE=demo` if the project already contains old environment values. Remove stale `VITE_API_URL` or `VITE_DATA_MODE=api` values inherited from an earlier project. Click **Deploy**.

## 4. Verify the deployment

- Home loads with the orange Forkly design and local food photos.
- Add a customized dish to the cart, apply a valid voucher, and place a demo order.
- Open `/orders`, `/account`, and a restaurant route; refresh each page.
- Tracking, history, and saved details survive refresh in the same browser.
- On mobile, bottom navigation and the two-column dish grid work.

`vercel.json` rewrites all SPA routes to `/index.html`. This is the Vite SPA deep-link pattern documented by Vercel. Do not enable `cleanUrls` without updating that rule accordingly.

## Why this works without a backend

The frontend's default mode is `demo`. It reads a bundled catalog and writes browser-local state. Images, styling, icons, and code ship in `dist/`. There are no runtime Google Fonts, external image fetches, map widgets, payment gateways, or API dependencies in demo mode.

This does not mean offline installation or cross-device syncing. The site still needs to be loaded from its host, and browser storage is specific to that browser and domain. Clearing site data clears demo records.

## Connecting the optional backend later

The included SQLite API is a conventional Node server. **Do not put it in Vercel Functions with its SQLite file on ephemeral disk.** Run it on a Node 24 host with durable storage, or adapt it to a managed database before using a serverless backend.

On the API host, configure:

```dotenv
HOST=0.0.0.0
PORT=4000
DB_PATH=/persistent-storage/forkly.sqlite
ALLOWED_ORIGINS=https://your-frontend-domain.example
```

Use the exact frontend origin with no trailing slash. Add additional exact origins separated by commas when needed. Keep the API behind HTTPS. Start it with `npm run server`.

On Vercel, configure:

```dotenv
VITE_DATA_MODE=api
VITE_API_URL=https://your-api-domain.example/api
```

Replace the example domains with the actual frontend/API addresses. Redeploy after changing Vite environment variables. Register a new account. Demo profiles/orders do not become real API accounts.

You can choose `VITE_DATA_MODE=auto` to show the demo when the API is unavailable at startup. When the API is available, the app stays in API mode and will report a failed checkout rather than silently simulate it.

## Troubleshooting

| Symptom | Fix |
|---|---|
| `package.json` not found | Set Root Directory to the folder that contains it |
| Build output not found | Build command `npm run build`; output `dist` |
| Homepage works, refreshing `/orders` fails | Keep the supplied `vercel.json` at the project root |
| Blank page after opening a file | Use a local HTTP server or `npm run preview`; do not double-click `index.html` |
| API connection error in demo deployment | Remove old API environment variables, set `VITE_DATA_MODE=demo`, redeploy |
| Local browser still forces demo after switching to API | Close that tab or remove only the `forkly-mode` sessionStorage override in browser DevTools, then reopen |
| `node:sqlite` unavailable locally | Install Node.js 24 LTS; close and reopen the terminal |
| Platform-specific dependency error on Windows | Delete only `node_modules`, then run `npm ci`. Do not copy node_modules from Linux |
| `vite` is not recognized | Run `npm ci` first and start with `npm run dev` |
| Changes to `.env` do not appear | Restart the dev server; for Vercel, redeploy |
| CORS blocks API requests | Add the exact frontend origin to backend `ALLOWED_ORIGINS` |
| No order in a different browser | Demo storage is local; use API mode for account data across devices |
| Online payment does not charge a card | Demo methods intentionally do not charge; the API supports cash on delivery |

Official references checked during preparation:

- https://vercel.com/docs/frameworks/frontend/vite
- https://vercel.com/docs/project-configuration
- https://nodejs.org/download/release/latest-v24.x/docs/api/sqlite.html

This archive was built and tested locally. A live deployment in your Vercel account has not been performed.

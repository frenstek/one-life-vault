# OLF Vault — logged-out / public surface review

Target: https://onelifefoundationndis.app · source: C:\Users\kevin\OneDrive\Desktop\CLAUDE\one-life-vault
Date: 2026-10-16

## IMPORTANT — scope limitation
The **live network probes were blocked** by this session's auto-mode network classifier: every outbound
request from the Bash/Playwright tools (sandboxed and unsandboxed) was denied. So there are **no
screenshots, no measured load times, no measured bundle sizes, and no live HTTP response bodies/headers** in
this report. The user must approve network egress (or run the probe script themselves) to capture those.

Everything below is from **first-hand source-code analysis** of the deployed codebase, which is high
confidence for the auth/routing findings (the code that runs in production is the code in this repo). Items
that genuinely need a live request to confirm are marked **[NEEDS LIVE]**.

A ready-to-run probe script is saved at: `scratchpad/olf/api-probe.mjs` (run with `node api-probe.mjs`;
it hits every /api route with GET, GET?action=list, POST {} and dumps status + 200-char snippet + headers).

---

## Finding 1 (CRITICAL) — API routes return real data with NO authentication

`api/_lib/supabase.js` builds the server client with the **service-role key** (`SUPABASE_SERVICE_KEY`),
which bypasses Row-Level Security:
```
export const supabase = createClient(supabaseUrl, supabaseServiceKey);
```
Only **3 of 21** API routes call `verifyAuth()`: `rosters.js`, `payment-reviews.js`, `auth.js`.
The other **18 routes import that service-role client and gate nothing** — any anonymous GET returns live
records. Confirmed by reading each handler: e.g. `api/participants.js` default handler (line 805) runs
`setCors(res)` then dispatches GET actions straight to DB queries with no token check.

Highest-impact unauthenticated reads (all confirmed auth-less in source; **[NEEDS LIVE]** only to capture the
exact rows):
| Endpoint | Returns |
|---|---|
| `GET /api/participants?action=participants` | participant profiles: name, DOB, **NDIS number**, Medicare number, medications, allergies, GP, emergency contacts |
| `GET /api/participants?action=list` | inquiries: name, DOB, NDIS number, phone, email |
| `GET /api/staff?action=list` | staff directory |
| `GET /api/payroll` (GET → list all) | **payroll records** |
| `GET /api/docs?action=list` | document store listing |
| `GET /api/stakeholders?action=list` | stakeholder contacts |
| `GET /api/time-clock`, `/api/tasks`, `/api/cleaning-schedule`, `/api/fluid-balance`, `/api/features`, `/api/onboarding`, `/api/properties?action=list`, `/api/audit-log`, `/api/staff-docs`, `/api/payroll-files` | operational data |

Because the client (`src/lib/api.js`) talks to these REST endpoints (not supabase-js with the anon key +
RLS), the entire data model sits behind endpoints that trust the caller. This is the core issue. Writes
(POST/PATCH/DELETE) appear equally ungated on these routes — NOT tested live per instructions (empty `{}` only),
but the source shows the same no-auth dispatch, so unauthenticated **modification/deletion** is likely too.

Fix: add `verifyAuth(req)` (already written in `_lib/auth.js`) as a guard at the top of every handler, and/or
stop using the service-role key for read paths and rely on RLS with the user's JWT.

## Finding 2 (MEDIUM) — permissive CORS on every API route
`api/_lib/cors.js` sets `Access-Control-Allow-Origin: *` with `Allow-Headers: Content-Type, Authorization`
on all routes. Combined with Finding 1, any website can read the data from a victim's browser. Even once auth
is added, `*` lets any origin script call the API with a stolen/forwarded token.

## Finding 3 (MEDIUM) — no security response headers configured
`vercel.json` defines rewrites and function limits but **no `headers` block**: no `X-Frame-Options`/CSP
(clickjacking), no `X-Content-Type-Options`, no HSTS, no cache-control policy on the HTML shell. **[NEEDS LIVE]**
to confirm Vercel adds none by default, but nothing in the repo sets them. The known "stale PWA shell after
deploy" risk is *reduced* here because there is **no service worker and no manifest** (none in `public/`, no
`vite-plugin-pwa`), so it is a plain SPA — but the index.html cache-control is still unmanaged. **[NEEDS LIVE]**.

## Finding 4 (LOW) — no robots.txt / sitemap
No `public/robots.txt` and no sitemap in the repo. **[NEEDS LIVE]** to confirm the deployed site 404s them.
Low impact (SPA, nothing to crawl), but an internal tool arguably wants `Disallow: /`.

## Finding 5 (INFO) — secret exposure check
- Supabase project ref `czdlemutsimvwfpwylxh` and the public storage URL appear in the client bundle
  (`src/lib/api.js:32`) — expected/benign.
- The `SUPABASE_SERVICE_KEY` is referenced **only** in server files (`api/_lib/*.js`), never in `src/` — good,
  it is not shipped to the browser.
- No Google refresh-token / service-account string in `src/`. The `refresh_token` hits in
  `src/contexts/AuthContext.jsx` and `src/lib/api.js` are the Supabase **user session** token (normal client
  behaviour), not a leaked secret.
- **[NEEDS LIVE]** confirm by grepping the built JS at the live origin for `service` / `SERVICE_KEY` /
  `-----BEGIN`; source says it is clean.

---

## Route table (frontend, logged-out) — from src/App.jsx
All app routes are children of one parent `<Route element={<ProtectedRoute><Layout/></ProtectedRoute>}>`
(App.jsx:168). `ProtectedRoute` redirects to `/login` via `<Navigate>` when `!isAuthenticated`
(App.jsx:118). So **logged out, every route below renders the login redirect / loading spinner, not data** —
this is correct. (Client guard only; the data itself is exposed at the API layer, Finding 1.) **[NEEDS LIVE]**
screenshots not captured.

| Route | Guard | Logged-out result (from source) |
|---|---|---|
| `/login` | LoginRoute | renders Login form (redirects to `/` if already authed) |
| `/` (Dashboard) and ALL below | parent ProtectedRoute | → redirect to `/login` |
| documents, view/:fileId, search, participants(+/:id), progress-notes, cleaning-schedule, payroll, time-clock, location-log, tasks, messages, team-chat, shift-roster, staff(+/:id), compliance, inquiries(+/:id), stakeholders, incidents, screening, roster-of-care(+/:id), rosters, invoices(+/:id), staff-payslips, properties(+/:id), training, announcements, continuous-improvement, risk-register, hazard-register, feedback-complaints, infection-register, sds-register, legislation-register, conflict-of-interest, audit-calendar, audit-log, policy-register, payment-reviews(+/:id), staff-accounts, asset-register, expenses, expense-hub, permissions | parent ProtectedRoute (some add feature/role) | → redirect to `/login` |

No logged-out frontend route leaks an app shell with data (parent guard covers all). The exposure is API-only.

## API table — from source (auth enforcement)
| Route | verifyAuth? | Data on anon GET? |
|---|---|---|
| rosters | YES (401) | no |
| payment-reviews | YES (401/403) | no |
| auth | YES (401) | no |
| participants | **NO** | YES (`?action=participants` / `list`) |
| staff | **NO** | YES (`?action=list`) |
| payroll | **NO** | YES (GET lists payroll) |
| docs | **NO** | YES (`?action=list`) |
| stakeholders | **NO** | YES (`?action=list`) |
| tasks | **NO** | YES |
| time-clock | **NO** | YES |
| cleaning-schedule | **NO** | YES |
| fluid-balance | **NO** | YES |
| onboarding | **NO** | YES |
| features | **NO** | YES |
| audit-log | **NO** | YES |
| properties | **NO** | YES (`?action=list`) |
| staff-docs | **NO** | YES |
| payroll-files | **NO** | YES |
| docs-download | **NO** | file download (no auth) |
| image-proxy | **NO** | SSRF-shaped proxy (no auth) — worth a closer look |
| scan-receipt | **NO** | OpenAI vision call (no auth) — abuse-of-cost risk |

Note: for `participants` a bare `GET /api/participants` returns `400 Invalid action`; the data path is
`?action=participants` or `?action=list`, so a plain `?action=list` probe will under-report the exposure.

## Ranked findings
1. **CRITICAL** — 18/21 API routes serve/modify real NDIS data (participant NDIS numbers, Medicare numbers,
   medications, payroll, staff) with no authentication, via a service-role client that bypasses RLS.
   Evidence: `api/_lib/supabase.js` (service key), `api/participants.js:805` handler, 0 `verifyAuth` in 18 routes.
2. **MEDIUM** — `Access-Control-Allow-Origin: *` on all routes (`api/_lib/cors.js`) → any site can read the data.
3. **MEDIUM** — no security headers (X-Frame-Options/CSP/HSTS/cache-control) in `vercel.json`. **[NEEDS LIVE]**.
4. **LOW/INFO** — no robots.txt/sitemap **[NEEDS LIVE]**; `image-proxy`/`scan-receipt` unauthenticated
   (SSRF / cost-abuse surface); secrets otherwise not shipped to the browser.

# One Life Vault — server-side bug audit (api/, api/_lib/, src/lib/api.js)

Date: 16 Oct 2026. Read-only. Every file under `api/` and `api/_lib/`, `src/lib/api.js`, `src/lib/paymentReviews.js`, all `*.sql` migrations, and the client call sites for each suspect wrapper were read in full. `npx eslint api` with `no-undef` + node globals: **0 undeclared identifiers** (the Sept ReferenceErrors are gone; `api/auth.js:424-436` now looks the target up properly). Only hits were the five `no-empty` blocks at `api/features.js:74, 897, 2199, 2219, 2239`, which are unchanged from the last sweep.

Schema note: the Supabase MCP server in this session points at a different project (guards / cl_* / pr_coins tables, no `participants` or `time_entries`), so column checks below are against the SQL migrations in the repo, not the live `czdlemutsimvwfpwylxh` database. Several tables used by the code (`progress_notes`, `screening_checklists`, `tasks`, `expenses`, `assets`, `recurring_expenses`, `policy_register`, `sds_register`, `infection_register`, `audit_calendar`, `role_permissions`, `participant_monitoring`, `monitoring_entries`, `participant_orientations`, `hospital_passports`, `risk_profiles`, `goals_of_care`, `team_chat_messages`, `payroll_details`, `payroll_files`, `cleaning_completions`, `fluid_balance_entries`, `onboarding_*`, `supplier_invoices`, `rosters`) have no migration in the repo at all, so their columns could not be checked. Items marked **VERIFY** need one `select column_name from information_schema.columns where table_name = ...` against the real project.

Severity key: **crash** = the action fails for the user every time · **wrong data** = it succeeds but stores/returns the wrong thing · **silent** = failure is swallowed and the user sees success/"no data" · **minor**.

---

## Ranked findings

### 1. Announcements: edit, pin/unpin and delete all fail with "Invalid action" — crash
- `src/lib/api.js:1281-1285` `updateAnnouncement` sends `PATCH /api/features` with body `{ id, ...data }` and **no `action`**; `api/features.js:204` resolves the action from query or body, finds none, and falls through to `api/features.js:2496` → 400 "Invalid action".
- `src/lib/api.js:1310` `deleteAnnouncement` sends `{ action: 'announcement', id }`; the server only matches `'delete-announcement'` at `api/features.js:385`.
- Used by `src/pages/Announcements.jsx:130` (save edit), `:147` (toggle pin) and `:163` (delete). The admin sees "Invalid action" on save/delete; pin toggle fails silently into `console.error`.
- Also `src/pages/Announcements.jsx:123` sends `target_audience` but the server reads `target_role` (`api/features.js:304, 376`), so the audience picker is ignored and every announcement is saved as `target_role = 'all'`.
- **Fix:** send `action: 'update-announcement'` and `action: 'delete-announcement'` from the client (or make the server accept `?action=` on PATCH/DELETE like the other wrappers do), and rename `target_audience` → `target_role`.

### 2. Direct messages cannot be sent — crash
- `src/lib/api.js:1335` `sendMessage` posts `{ action: 'message', ... }`; the server handles `'send-message'` at `api/features.js:412`. `src/pages/Messages.jsx:94` therefore always shows "Invalid action" in the compose dialog.
- **Fix:** change the client action to `'send-message'`.

### 3. Toggling a medication between active/discontinued fails — crash
- `src/lib/api.js:1453` sends `{ action: 'update-medication', id, status }`. `api/participants.js:502-505` does `const { id, ...updates } = req.body; ... .update(updates)` without stripping `action`, so PostgREST rejects the unknown `action` column (PGRST204) and the user gets a 500 at `src/pages/ParticipantProfile.jsx:326` ("alert(err.message)"). The sibling handlers at `participants.js:613`, `:669`, `:728` do strip it; medication was missed.
- **Fix:** `const { id, action: _a, ...updates } = req.body;` (or whitelist medication fields the way `handleMedicationCreate` does).

### 4. Documents over 2 MB are uploaded to storage but never registered — crash + orphan files (**VERIFY columns**)
- `src/lib/api.js:93-142`: any file whose decoded size > 2 MB goes through the signed-URL path and then calls `/api/docs` with `directUpload: true`.
- `api/docs.js:279-292` inserts `folder`, `content_type`, `file_size` into `documents`. The only `documents` DDL in the repo (`setup-supabase.sql:2-11`) has `name, category, subcategory, file_type, size, storage_path, created_at, updated_at` — no `folder`, `content_type` or `file_size`. If the live table matches the migration, every >2 MB upload returns 500 "Failed to register document" **after** the file already landed in the bucket (nothing removes it), so the user retries and keeps stacking orphan files.
- Even if the columns do exist, this path writes `file_size` while every reader (`src/lib/api.js:80 formatFileSize`, the list/search endpoints) uses `size`, so large files display as `--`.
- Same pattern in `api/staff-docs.js:148-163` is fine (uses the real `size` column); only `docs.js` is affected.
- **Fix:** insert `size: preUploadedSize || 0` and drop `folder`/`content_type` (folder is already encoded in `storage_path`, which is how `handleList` derives it at `docs.js:70-77`), and on DB-insert failure call `storage.remove([preUploadedPath])` like the base64 path does at `docs.js:360`.

### 5. Dates are stamped in UTC, so anything recorded before 10:00 AEST gets yesterday's date — wrong data
Vercel functions run in UTC; the company is in Queensland (UTC+10, no DST). `new Date().toISOString().split('T')[0]` is yesterday until 10 am local.
- `api/participants.js:267` — progress note `note_date` when a note is added from the participant profile (night-shift notes written at 6 am land on the previous day; this is the field NDIA payment reviews are matched on).
- `api/time-clock.js:322` — handover `shift_date` default.
- `api/features.js:742, 839` — `resolution_date` auto-set on complaints / infections closed in the morning.
- `api/features.js:1969` — expense `date` default; `api/features.js:2397` — supplier invoice `issue_date` default.
- `api/properties.js:514` — maintenance `reported_date`; `api/properties.js:289` — "overdue inspections" uses UTC today, so an inspection due today shows overdue only after 10 am.
- `api/features.js:177, 251, 825` — month prefixes for `ROC-`, `INC-`, `INF-` numbers roll over at 10 am on the 1st (cosmetic).
- Date-range **filters** on timestamps are also UTC-anchored: `api/time-clock.js:59-60` (summary), `:178-179` (list) and `api/audit-log.js:69-76` compare `clock_in`/`created_at` against `YYYY-MM-DD` strings, i.e. 10:00 AEST boundaries. A weekly hours summary for Mon–Sun excludes clock-ins between 00:00 and 10:00 on Monday and includes clock-ins up to 09:59 on the following Monday. `location-log` at `:118-119` already does it right with `+10:00`.
- `api/payment-reviews.js:33` already has the correct helper (`toLocaleDateString('en-CA', { timeZone: 'Australia/Brisbane' })`).
- **Fix:** add a shared `todayBrisbane()` in `api/_lib/` and use it for every default date; append `T00:00:00+10:00` / `T23:59:59.999+10:00` to the string filters in time-clock list/summary and audit-log.

### 6. Staff compliance counts superseded (replaced) documents as expired — wrong data
- `api/staff-docs.js:211-238`: uploading a new certificate of the same type keeps the old row (it only writes an `archive_document` audit entry) and stores the new one under a timestamped path.
- `api/_lib/ndis.js:63-77` `buildComplianceSummary` iterates **all** rows, so the old expired First Aid cert still increments `docs_expired`, and `is_fully_compliant` goes false even though the worker renewed. This feeds `api/staff.js:106` (staff list badges), `:160` (profile), and `:251-258` (compliance dashboard: worker counted as non-compliant, expired doc listed at `:285-286`).
- `api/staff.js:306` uses `.find()` on an unordered array, so the per-type rate may pick the old doc instead of the new one.
- `api/onboarding.js:73, 186` have the same "last one wins, unordered" issue for auto-complete.
- **Fix:** reduce documents to the newest row per `document_type` (order by `created_at desc`, keep first) before computing status, in `buildComplianceSummary` and `handleCompliance`; or actually delete/flag the superseded row on upload.

### 7. Lists hit Supabase's 1000-row cap silently — wrong data
PostgREST's `max-rows` (1000 by default on Supabase) applies even when no `.limit()` is given, and `.limit(10000)` does not raise it.
- `api/features.js:1180-1188` `pn-list` with no participant filter (the Progress Notes page "all") and `:1196` `pn-stats` — once there are >1000 notes (154+ per participant already), the newest 1000 are returned and the stats/participant counts are wrong with no indication.
- `api/docs.js:92-106` `handleList` fetches the whole `documents` table to compute folders; past 1000 rows whole folders and files disappear from the vault UI.
- `api/time-clock.js:56-61` summary `.limit(10000)` is capped at 1000 entries for the range.
- `api/features.js:211, 443, 494, 706` etc. (incidents, CI, risk, complaints) will have the same ceiling eventually.
- **Fix:** paginate with `.range()` in a loop (or `count: 'exact'` + follow-up pages) for pn-list/pn-stats/docs list/time-clock summary; or raise `max-rows` in the project's API settings.

### 8. Invoice line items can vanish while the invoice reports a total — silent
- `api/features.js:1347-1348` `inv-create`: the `invoice_items` insert error is only `console.error`'d; the invoice is created with `subtotal/gst/total` but zero lines and the user sees 201.
- `api/features.js:1374-1389` `inv-update`: deletes every item first, then inserts the new set **without checking the error**; a failed insert leaves the invoice with totals and no items.
- **Fix:** check both errors and roll back (delete the invoice on create; re-insert the old items or fail before deleting on update), or move item replacement into a Postgres function.

### 9. Supplier invoice "file too large" check runs after the row is inserted — write-then-fail
- `api/features.js:2405-2417` `hub-invoice-create` inserts the `supplier_invoices` row, **then** rejects with 400 if the file > 4.5 MB, and throws (500) if the upload fails. The admin sees an error, retries, and gets a duplicate invoice with no file.
- **Fix:** decode and size-check the file before the insert; delete the row if the upload fails.

### 10. NDIS invoice generator and payslip builder bill/pay rostered-but-unworked shifts and use the wrong rate codes — wrong money
- `api/features.js:1491` and `:1599` include `status IN ('completed','confirmed','scheduled')`. A date range that covers today or the future invoices and pays shifts that have not happened yet (and shifts later cancelled are only excluded if someone changes the status).
- `api/_lib/ndis-rates.js:39-51` `getItemForShift`: rate is chosen from the **start hour only**. A 14:00–22:00 shift is entirely 01_801 (daytime) though 20:00–22:00 is evening; a 22:00–06:00 active night shift gets 01_802 (evening), not 01_803; `shift_type === 'night'` is ignored; public holidays (01_806, defined at `:14`) are never produced; Saturday/Sunday shifts that cross midnight are billed at the start day's rate for all hours.
- `api/features.js:1655-1662` payslip: same day-of-start attribution; no public holiday rate; no break deductions; it ignores `time_entries` (actual clock data) entirely.
- `api/features.js:1458` finds the participant's property by exact string match on `property_residents.participant_name`; a middle name or trailing space means "Participant is not assigned to any property" (`:1481`).
- **Fix:** restrict to `completed` (make status explicit in the UI), split shifts at 20:00/00:00/06:00 into separate lines, add a public-holiday table, and link `property_residents` by `participant_id` instead of name.

### 11. Renaming or recategorising a document inside a nested folder moves it up to the top-level folder — wrong data
- `api/docs.js:774-779` `handleUpdate` recomputes the storage path from `getDocFolder(existing)`, which deliberately returns only the first path segment (`docs.js:80-85`). A file in `Operations/Employment Pack/Templates/x.docx` renamed via PATCH is copied to `Operations/Employment Pack/x.docx` and disappears from the Templates view. `src/pages/TrainingHub.jsx:148-157` triggers this PATCH after uploads.
- **Fix:** use `getFullFolderPath(existing)` at `docs.js:774`.

### 12. Body-size limits advertised in code are above what Vercel allows — crash with an unfriendly error
- `api/docs.js:5-7` (`sizeLimit: '35mb'`, `MAX_FILE_SIZE` 25 MB), `api/rosters.js:108` (`'22mb'`, 15 MB max), `api/scan-receipt.js:3` (`'10mb'`), `api/staff-docs.js:5` (5.5 MB). Vercel's request-body cap for serverless functions is 4.5 MB regardless of `bodyParser.sizeLimit`, so a 6 MB roster PDF (base64 → 8 MB body) dies with Vercel's own `413 FUNCTION_PAYLOAD_TOO_LARGE` HTML, never reaching the friendly "File too large (max 15 MB)" at `rosters.js:57`. Docs and staff-docs avoid it only because the client switches to signed URLs above 2 MB (`src/lib/api.js:93, 308`); rosters, receipts, participant files (`participants.js:32` 4.5 MB decoded ≈ 6 MB body) and announcement images do not.
- **Fix:** give rosters/participant files/receipts the same signed-upload path, and set the client-side caps to ~3 MB decoded for anything that still posts base64.

### 13. Roster-of-care duplicate and copy-day drop data when an insert fails — silent
- `api/features.js:1121-1143` `roc-duplicate` and `:1157-1172` `roc-copy-day` ignore every insert error (`const { data: created } = ...`). Copy-day **deletes the target day's blocks first** (`:1158`), so a failed insert leaves that day empty and still returns `{ ok: true }`.
- **Fix:** check each error, and in copy-day insert first / delete after (or do it in one RPC).

### 14. Reference numbers can collide — crash on concurrent create / wrong data after delete
- `api/features.js:250-262` (INC-), `:175-187` (ROC-): select-max-then-insert with no lock; two incidents logged at the same time both compute `-003` and the second hits the `UNIQUE` constraint (`features-migration.sql:11`) → 500 "Internal server error" after the user filled a long form. The migration's trigger at `features-migration.sql:43-62` would do this correctly but is bypassed because the server always sets `incident_number` (the comment at `:249` says the trigger has a `search_path` issue — fix the trigger instead).
- `api/features.js:825-828` INF- numbers use `count + 1`, so after any deletion the next number repeats an existing one.
- **Fix:** let the DB trigger assign numbers (set `search_path = public` on the function) and drop the JS generation; use max+1 not count+1 for INF.

### 15. Delete-user removes the profile before the auth user; on auth failure the admin sees 500 but the profile is already gone — write-then-fail
- `api/auth.js:363-378`. Also no audit row is written on that path.
- **Fix:** delete the auth user first, then the profile (profile has `ON DELETE CASCADE` from `auth.users` per `migration.sql:8`, so the profile delete is redundant anyway).

### 16. Handlers destructure `req.body` with no fallback → 500 instead of 400 — minor
- `api/time-clock.js:188, 347, 388`, `api/cleaning-schedule.js:28`, `api/fluid-balance.js:29`, `api/payroll.js:22, 37`, `api/tasks.js:45, 81, 133, 147`, `api/participants.js:485, 502, 511, 531, 547, 655, 667, 781`, `api/features.js:1711, 1732, 1759, 1776`. A POST with an empty or non-JSON body throws `Cannot destructure property ... of undefined` and the user gets "Internal server error".
- **Fix:** `req.body || {}` everywhere (most other handlers already do this).

### 17. Audit log gaps — silent
- No `audit_log` row is written for: time-entry edits/deletes (`api/time-clock.js:369-399`), roster shift create/update/delete (`:330-340, 351-366, 391-395`), progress note create/update/delete (`api/features.js:1220-1248`), bulk import (`:1250`), medication create/update/delete (`api/participants.js:484-516`), incident create/update/delete (`features.js:242-290`), invoice create/update/delete (`:1309-1406`), permission changes (`:1710`), document delete/move/rename (`api/docs.js:591-872`), vault-account auto-creation failure paths (`api/staff.js:475-508`).
- Existing audit inserts never check their error: `api/participants.js:90, 107, 118, 186, 209, 234`, `api/properties.js:388, 464, 525, 590, 656, 736, 767, 877, 960`, `api/staff.js:430, 570, 648`, `api/staff-docs.js:170, 220, 287, 352`, `api/onboarding.js:253, 294, 344, 381`, `api/auth.js:153, 254, 318, 381, 430`, and `api/features.js:897` wraps a non-throwing call in `try {} catch {}` (the promise resolves with `{ error }`, it never throws, so the catch is dead and the error is simply dropped). `api/stakeholders.js:124, 173, 216` use `.catch(() => {})` which has the same effect.
- Every audit row is attributed to `user_email: 'system'` (except auth.js), so the log cannot say who did what.
- **Fix:** one `audit(req, action, ...)` helper in `_lib` that checks the error and logs it, and call it from the handlers above; pass the signed-in user's email from the client (or from `verifyAuth`) instead of `'system'`.

### 18. Empty catch blocks still present (carried over from Sept) — silent
- `api/features.js:74` (bucket creation), `:897` (audit insert), `:2199, 2219, 2239` (activity feed: a failing query renders as "no recent activity").
- **Fix:** at minimum `console.error` in each; for the activity feed return `{ feed, errors }` so the dashboard can show "could not load incidents".

### 19. TrainingHub metadata update never runs for small uploads — client/server contract mismatch, minor
- `src/pages/TrainingHub.jsx:146` checks `result.document`, but the base64 path returns the record at the top level (`api/docs.js:364-367`); only the direct-upload path wraps it as `{ document }` (`docs.js:299`). Title/description are therefore ignored for files under 2 MB. The PATCH also sends `description`, which `docs.js:745` does not accept.
- **Fix:** return the same shape from both upload paths.

### 20. Duplicate-folder check never matches when `subcategory` is null — minor wrong data
- `api/docs.js:395` and `:524` use `.eq('subcategory', null)`; PostgREST needs `.is('subcategory', null)`, so the check is skipped and duplicate folder markers can be created.

### 21. `getPublicUrl` percent-encodes the slashes — minor (verify)
- `api/_lib/supabase.js:14` encodes the whole path with `encodeURIComponent`, producing `.../documents/Operations%2FFile.pdf`. The client version at `src/lib/api.js:35` deliberately undoes `%2F`, which suggests the server form has failed before. `download_url` from `docs.js:156, 184, 210, 366, 670, 820` carries the encoded form.
- **Fix:** encode per segment: `path.split('/').map(encodeURIComponent).join('/')`.

### 22. Content type for uploaded invoice/receipt files is wrong — minor
- `api/features.js:1422, 2423, 2469` set `contentType: \`application/${ext}\`` (gives `application/jpg`, `application/png`); images open as downloads. File names are also used unsanitised in the storage key (`:1419, 2420, 2466`).

### 23. Time clock edge cases — minor
- `api/time-clock.js:369-383` PATCH accepts `clock_out < clock_in` and negative `break_minutes`; the summary at `:89-91` then silently drops the entry (`ms > 0` guard) so the hours vanish from the weekly total with no warning.
- `:193-196` an entry someone forgot to clock out of days ago blocks all future clock-ins with "Already clocked in" and there is no auto-close.
- `:126` location-log is hard-capped at 500 rows; `:181` list at 200 — an admin exporting a month cannot see older entries and gets no "more" indicator.
- Double-submit: clock-in has a check-then-insert race (`:193-213`); two taps can create two open entries, after which `getOpenEntry` returns only the newest and the other never closes.
- **Fix:** validate in PATCH; add a partial unique index `(staff_id) WHERE clock_out IS NULL`; return a `truncated` flag or paginate.

### 24. Recurring expenses never recur — design gap
- `api/features.js:2083-2119` only stores `next_due`; nothing on the server (and nothing in `src/pages/ExpenseTracker.jsx:316-342`, which only shows "Due" badges) creates the expense or advances `next_due` when it passes. The register is a reminder list, not a scheduler. Worth stating in the UI or adding a "mark paid → create expense + roll next_due" action.

### 25. Payment reviews — small items
- `api/payment-reviews.js:207` `people` can be `null` on error and `:209 people.find` then throws → 500 instead of a message.
- `:132-142` `markSent` does three updates without a transaction; a failure midway leaves review=sent but claims open.
- `:351-392` `pack` downloads every evidence file serially inside a 60 s function; a review with many scanned PDFs will time out (`vercel.json` `maxDuration: 60`) with nothing uploaded. Consider building packs per participant-week by default.
- `src/lib/paymentReviews.js:87` `elsewhere` only considers evidence rows that have a `week_start`; a service agreement linked without a week on another review is never surfaced as reusable. Minor.

### 26. `.single()` on queries that can legitimately return 0 rows — minor
- `api/staff.js:387-391` (duplicate email), `:449-453` (existing profile): with 0 rows `.single()` returns `error PGRST116, data null`, which the code treats as "not found" so it works, but with 2+ rows (duplicate emails already in `staff`) it also returns `data null` and the duplicate check passes. Use `.maybeSingle()` + `.limit(1)`.
- `api/payment-reviews.js:84` `link` with a bad `file_id` falls back to `req.query.path`, letting a caller sign any path in the bucket.

### 27. Vercel limits
- 21 function files under `api/` (not counting `_lib`). The old Hobby limit was 12 per deployment; the site deploys today, so either the project is on Pro or that cap no longer applies — but it is worth knowing before adding more routes. If you ever need to shrink, `cleaning-schedule`, `fluid-balance`, `payroll`, `payroll-files`, `image-proxy` and `scan-receipt` are small enough to fold into `features.js`.
- Heavy packages in `package.json` (`puppeteer`, `tesseract.js`, `pdfjs-dist`, `docx`, `sharp`) are **not** imported by anything in `api/` (only `@supabase/supabase-js`, `@anthropic-ai/sdk`, `pdfkit`, `jszip`, dynamic `pdf-parse`), so they are not bundled and cannot blow the 250 MB limit; they belong to the local `generate-*.mjs` scripts. `pdfkit` works because `vercel.json` includes `node_modules/pdfkit/js/data/**` for `payment-reviews.js`.
- `api/payment-reviews.js:17` imports from `../src/lib/paymentReviews.js`; Vercel's tracer follows it, fine, but a future Vite-only change there (JSX, browser globals) would break the function.
- Timeouts: default 10 s for every function except the three in `vercel.json`. `api/features.js` `roc-duplicate` / `roc-copy-day` / `pn-bulk-import` and `api/docs.js` `rename-folder` (one copy+remove per document) are the ones most likely to exceed 10 s.
- `api/scan-receipt.js` has no CORS/OPTIONS handling (fine same-origin) and uses `claude-haiku-4-5-20251001` with a 10 mb body limit that Vercel caps at 4.5 MB (see #12).

---

## Client wrapper issues found in `src/lib/api.js` (summary)
- `:1281` `updateAnnouncement` — no action (see #1)
- `:1310` `deleteAnnouncement` — `'announcement'` should be `'delete-announcement'` (see #1)
- `:1335` `sendMessage` — `'message'` should be `'send-message'` (see #2)
- `:1453` `updateMedication` — correct action, server bug (see #3)
- `:2354` `updatePermission` / `:2372` `toggleOnboardingItem` / `:2511` `saveOrientation` / `:2785` `deleteHubInvoice` throw a generic message and discard the server's `error` text.
- `:676-677` `fetchLocationLog` does not `encodeURIComponent` its params (harmless for dates/UUIDs).
- Every wrapper checks `res.ok`; none of them is missing that.

## Auth state (one paragraph, as requested)
Unchanged from September: only `api/auth.js` (list/update/delete/reset), `api/rosters.js` and `api/payment-reviews.js` verify a Bearer token; the other 18 routes, including `signup` at `api/auth.js:83` (creates an admin account with no credentials), progress notes, incidents, medication charts, time clock, staff pay rates and bank details (`api/staff.js:43-49`), payroll and all file endpoints, accept anonymous requests with CORS `*` and run as the service role. `api/staff.js:490-495` also returns the newly generated vault password in the JSON response, and `api/features.js:2157` trusts a client-supplied `role` for delete permissions. The owner deferred this; it is listed here only so the two new auth-gated routes are not mistaken for coverage.

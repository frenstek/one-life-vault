# One Life Vault — frontend bug audit (read-only), 16 Oct 2026

Scope: `src/App.jsx`, `src/components/Sidebar.jsx`, `src/contexts/*`, `src/hooks/*`, `src/lib/api.js` read in full by me; all 54 pages and every component read in full across five parallel readers (same checklist), with every headline finding re-opened and confirmed by me at the cited lines. Server handlers (`api/*.js`) were opened only where a client call depended on them. No files were edited.

Line numbers are as of today's working tree.

---

## 0. Build and lint

**`npm run build`** — succeeds in 4.3 s, 912 modules.

| chunk | size | gzip |
|---|---|---|
| `dist/assets/index-CutLm1Ua.js` (the whole app) | **2,639 kB** | 633 kB |
| `html2canvas-*.js` | 200 kB | 47 kB |
| `index.es-*.js` (pdf-lib/pdfjs side) | 151 kB | 49 kB |
| `index-*.css` | 137 kB | 21 kB |
| `purify.es-*.js` | 21 kB | 8 kB |

Warnings:
- `(!) Some chunks are larger than 500 kB` — there is effectively no route-level code splitting; every page, jsPDF, recharts, tesseract wiring and docx ship on first paint.
- `INEFFECTIVE_DYNAMIC_IMPORT` x2: `src/lib/api.js` is `await import()`ed in `src/pages/ParticipantProfile.jsx:216` while statically imported everywhere else; `jspdf` is dynamically imported in `GenerateContractModal.jsx`, `RiskAssessmentTab.jsx`, `RiskProfileTab.jsx` while statically imported by the other PDF components. Both dynamic imports are no-ops; harmless but misleading.

**`npm run lint`** — 136 problems. Noise: 46 `no-unused-vars`, 4 `react-refresh/only-export-components`. The rest:

- **`no-undef`: 0.** `js.configs.recommended` includes it and `globals.browser` is set, so there are no undeclared identifiers (the "setX without useState" class from the 6 Sep sweep) anywhere in `src`. I also verified by script that every named import from `react-icons/*` resolves (no `lucide-react` imports exist), and that every `to="/..."` / `navigate('/...')` target has a matching route in `App.jsx`.
- `react-hooks/rules-of-hooks` `ExpenseTracker.jsx:1544` — **false positive but worth renaming**: `useTemplate` (defined at 702) is a plain function that fills the form; it is called in an `onClick`. Rename to `applyTemplate` so the React Compiler/lint stops treating it as a hook.
- `react-hooks/static-components` `DocumentCard.jsx:55/186/263`, `DocumentView.jsx:110/213` — `const Icon = getIcon(type)` in render. `getIcon` returns a module-level icon component, so no state is lost; perf-only.
- `react-hooks/set-state-in-effect` x11 and `exhaustive-deps` x44 — almost all are `useEffect(() => { loadData(); }, [filterA, filterB])` where the real deps are listed explicitly; no stale-data case found among them. `Sidebar.jsx:158` omits `expanded` but uses a functional update, so it is benign. `TimeClock.jsx:177/198` use `week.start.getTime()` in deps (works, lint just cannot analyse it).
- `react-hooks/purity` `AuthContext.jsx:39` — `Date.now()` inside `scheduleRefresh`, which only runs from effects/callbacks; false positive.
- `no-empty` x20 — these are the swallowed catches listed in section 4/5.

---

## 1. CRASH / feature dead on a user action

1. **Sending a message never works.** `src/lib/api.js:1335` posts `action: 'message'`; `api/features.js:204` reads the action from query or body and only `api/features.js:412` handles `'send-message'`, so every send falls through to `api/features.js:2496` → `400 Invalid action`. User: fills Compose, presses Send, sees "Invalid action" every time; nothing is delivered. Fix: change the client string to `'send-message'`.

2. **Announcements cannot be edited, pinned or deleted.** `src/lib/api.js:1281-1285` PATCHes `/api/features` with `{ id, ...data }` and **no action** (server needs `'update-announcement'`, `api/features.js:373`); `src/lib/api.js:1310` DELETEs with `action: 'announcement'` (server needs `'delete-announcement'`, `api/features.js:385`). Called from `src/pages/Announcements.jsx:130` (edit), `:147` (pin; error only goes to console so the pin icon just does nothing) and `:163` (delete, shows "Invalid action" in the dialog). Fix: send `action: 'update-announcement'` / `'delete-announcement'`.

3. **Goals of Care tab cannot add or edit a goal.** `src/components/GoalsOfCareTab.jsx:203` renders `<Modal title=… onClose=…>` with no `isOpen`; `src/components/ui/Modal.jsx:21` returns `null` when `!isOpen`, so clicking "Add Goal"/edit shows nothing. Two latent bugs sit behind it and will surface the moment `isOpen` is added: (a) `GoalsOfCareTab.jsx:207-244` pass `onChange={v => up(key, v)}` but `FormInput/FormSelect/FormTextarea` spread the raw event (`ui/FormComponents.jsx:26-59`), so state fills with SyntheticEvents and `form.goal_description.trim()` at `:84` throws `trim is not a function`; (b) `:208/:233` pass `options=` which `FormSelect` ignores (it renders `children` only) → empty dropdowns. Fix: `isOpen={modalOpen}`, `e => up(key, e.target.value)`, and render `<option>` children.

4. **Policy Register page is half-dead.** `src/pages/PolicyRegister.jsx:119` passes `action={{label, icon, onClick}}` to `PageHeader`, which only renders `actions` (`ui/FormComponents.jsx:103-110`) → there is **no "Add Policy" button**. `:339` and `:353` pass `options=` to `FormSelect` (ignored, see above) → Source Document and Status dropdowns are empty in the edit modal. `:125-128` pass `variant=` to `StatCard`, which takes `color` (`FormComponents.jsx:115`) → icon tiles render with `undefined` class. `:112` `<SkeletonStatCard count={4} />` renders one skeleton (`ui/Skeleton.jsx:37` takes no props). Fix: `actions={<button …/>}`, option children, `color=`, map four skeletons.

5. **White screen on typing in search when a row has a null field.** `src/pages/PaymentReview.jsx:529` — `c.prn.includes(q)` / `c.participant_name.toLowerCase()`; one imported claim with null PRN or name throws on the first keystroke and the ErrorBoundary replaces the review page. Same pattern `src/pages/PolicyRegister.jsx:89` (`e.policy_name.toLowerCase()`, `e.ref_number.toLowerCase()`) and `src/pages/LocationLog.jsx:90` (`e.staff.first_name[0]` with empty string). Fix: `(c.prn || '')` etc.

6. **Property Profile PDF export can leave a white A4 sheet over the whole app.** `src/components/PropertyProfilePDF.jsx:148-151` moves the hidden render on-screen at `zIndex 99999`; the restore at `:168-171` is after `html2canvas` and not in a `finally`, so a tainted image / unsupported CSS error leaves a fixed 794x1123 white panel covering the UI until reload. It also visibly flashes for 800 ms (`:154`) on every export. Fix: restore in `finally` and render off-screen (html2canvas does not need the node in the viewport).

7. **Orientation Guide PDF prints another participant's medical and family details.** `src/components/OrientationPDF.jsx:473-495` unconditionally prints "TWO SUPPORT WORKERS REQUIRED… ceiling hoist", "HYPOGLYCAEMIA RISK… insulin… End Stage Kidney Disease", "EPISODES OF UNRESPONSIVENESS", "SUPRAPUBIC CATHETER IN SITU" for `${name}`, and `:506-517` prints a hard-coded routine ("16 units Solostar + 5 units Novorapid", "cornflakes with cream… 1 Equal", "pressure relief boots") whenever `supportPlan.daily_support_needs` is empty; the reader found the same for family contacts ("Beverly Ross — 0416 104 301"), dialysis days and resuscitation status further down (`:562-794`). `src/components/OrientationTab.jsx:163` calls `generateOrientationPDF(participant, supportPlan, hp)` and never passes the 24 saved sections (`form`/`data`), so staff edits are absent from the PDF and John Ross's clinical content goes into every participant's induction document. User: downloads an orientation guide for participant X and hands new workers a document describing John Ross. Fix: pass the saved orientation record into the generator, render its sections, and delete every literal block (or gate each on the matching participant field). This is a privacy breach as much as a bug.

---

## 2. DATA LOSS / DUPLICATES / WRONG WRITES

8. **Hospital Passport can be silently overwritten with a blank one.** `src/components/HospitalPassportTab.jsx:95-97` treats any load error (500, network) as "no passport" (`setPassport(null)`); the tab then shows "Create Passport", `openEditor` (`:110-119`) pre-fills a near-empty form from participant fields, and `handleSave` (`:130-134`) upserts on `participant_id` (`api/participants.js:793`), wiping the existing NFR notes/triggers/appointments. Fix: keep a `loadError`, show Retry, and only treat a real 404 as "none".

9. **Payslip fortnight is Sunday→Saturday, not Monday→Sunday.** `src/pages/StaffPayslips.jsx:53-64` builds `fortnightStart/End` as local-midnight Dates then `toISOString().slice(0,10)`; local midnight AEST is 14:00Z the previous day, so the strings are always one day early. The previous Sunday's shifts are paid in this fortnight and the final Sunday is dropped. Fix: `toLocalDate()` from `src/lib/dates.js`.

10. **Cleaning schedule is keyed to the wrong week.** `src/pages/CleaningSchedule.jsx:73-78` (`getWeekStart`), and the Prev/Next handlers at `:196/:212`, do the same local-midnight→`toISOString` conversion, so `week_start` stored with every tick (`:141`) is the Sunday before the real Monday and the week label is a day off. Also `:127` ignores the DELETE response (a failed untick still disappears locally), `:146` swallows a failed POST (tick never saved, no message), and `:143` `user?.name` is never set by the API, so every tick is "Done by Staff". Fix: `toLocalDate(d)`; check `res.ok`; use `profile?.full_name`.

11. **"Upload Invoice" creates orphan invoices and duplicates on retry.** `src/pages/ParticipantInvoices.jsx:380-395` creates the invoice record first, then `:398-403` uploads the file; if the upload fails the error is shown with the modal still open, a file-less invoice already exists, and pressing Upload again makes a second one. Fix: upload first, or delete the created record in the catch.

12. **Editing an invoice silently drops ratio and shift times.** `src/pages/ParticipantInvoices.jsx:256-265` rebuilds `items` without `ratio`, `start_time`, `end_time`; touching the Support Item dropdown then recalculates hours from the default times and price at the default ratio (`:277-305`), overwriting the real shift. Fix: copy those three fields from `i`.

13. **Time Clock edits are saved 10-11 hours off.** `src/pages/TimeClock.jsx:838-844` pre-fills the `datetime-local` inputs with `clock_in.slice(0,16)` — the UTC wall-clock (a 12:30 pm AEST clock-in shows as 02:30) — and `handleEditSave` (`:291-305`) sends the typed string back with no offset. Any corrected entry is stored wrong and weekly hours/payroll are wrong. Fix: `toLocalDatetime(new Date(iso))` for display, `new Date(value).toISOString()` on save.

14. **Time Clock week boundaries are UTC.** `src/pages/TimeClock.jsx:166/:190` send date-only `toDateStr(week.start/end)` which the server compares to timestamptz as UTC, so Monday 00:00-10:00 AEST shifts land in the previous week and the next Monday's early shift is included. Fix: send full ISO instants.

15. **Anyone can clock in/out as anyone.** `src/pages/TimeClock.jsx:131-135` defaults `selectedStaff` to the first staff row alphabetically rather than the logged-in user, and the selector is open to all roles. Fix: default/lock to the row matching `profile` (as `Sidebar.jsx:124-137` does), admin/manager may change it.

16. **Negative durations shrink the week total.** `src/pages/TimeClock.jsx:291-305` never checks `clock_out > clock_in`; `:322-327` adds the negative ms into `weekTotalMs` (per-entry shows "--"). Fix: validate on save, clamp in the sum.

17. **Fluid balance entries land on yesterday before 10/11 am.** `src/pages/FluidBalance.jsx:31-33` `todayStr()` is UTC and `:114` posts against it. Fix: `toLocalDate()`.

18. **Receipt-scan date is one day early.** `src/pages/ExpenseTracker.jsx:170-171` parse "16 Oct 2026" to local midnight then `toISOString()`. Fix: `toLocalDate(p)`.

19. **Blanked fields cannot be cleared.** `api/features.js:189-197` `pickFields` drops `''`; the clients send `''` for cleared inputs: `src/pages/RiskRegister.jsx:246` (`{ ...form }`), `ConflictOfInterest.jsx:240`, `ContinuousImprovement.jsx:225-229`, `HazardRegister.jsx:241-245` (text fields), plus `src/components/EditStaffModal.jsx:72-79` and `InquiryModal.jsx:74-79` which turn `''` into `undefined` (dropped by `JSON.stringify`). User clears Review Date / Notes / phone / follow-up and presses Update; modal closes with success; old value remains. Fix: map `''` → `null` on the client (or let the server accept `null`).

20. **One-click deletes with no confirmation.** `src/pages/ParticipantProfile.jsx:1028-1033` (progress notes, handler `:213-225` also deletes imported notes), `:1212` files, `:1275` medications, `:1319` contacts, `:1376-1383` whole Support Plan; `src/pages/StaffProfile.jsx:673-679` compliance doc (handler `:87-97`), `:564-570` archived version, `:782-788` personal file; `src/pages/TaskBoard.jsx:593-600/699-705` task notes. A hover-misclick on a trash icon permanently deletes a clinical/compliance record. Fix: gate behind `DeleteConfirmModal`/`confirm()` like Incidents and Expenses.

21. **Global upload reloads the page and wipes whatever form is open.** `src/components/UploadModal.jsx:71-74` fires `onUploadComplete` after 1.2 s; `src/components/Layout.jsx:34-37` does `window.location.reload()`. A worker halfway through a progress note who uploads a photo from the header loses the note. The timer also still fires if the modal was closed. Fix: refetch via callback/event; clear the timer on close.

22. **Asset photos over ~3.3 MB can never be saved.** `src/pages/AssetRegister.jsx:286-289` allows 5 MB but base64-in-JSON (×1.33) exceeds Vercel's 4.5 MB body limit → "Create asset failed: 413". Fix: cap at ~3 MB or downscale on a canvas first.

23. **Shift roster rows are stored as "Staff".** `src/pages/ShiftRoster.jsx:735-739` never sends `staff_name`/`property_name`; `api/time-clock.js:335` defaults to `'Staff'`/null. Fix: include both in the payload.

24. **Random, unstored invoice number on the NDIS tax invoice.** `src/components/NDISInvoiceGenerator.jsx:50` builds `NDIS-YYYYMM-###` from `Math.random()` and prints it at `:118`; it is regenerated on each download and differs from the saved record. Fix: save first, print the returned number.

25. **Double-submit (no pending guard).** `src/pages/PolicyRegister.jsx:269` (delete, also no try/catch — a failure leaves the dialog open silently), `src/pages/TrainingHub.jsx:173-183` (second DELETE 404s and shows "Failed to delete" after it actually succeeded), `src/pages/InfectionRegister.jsx:257-266` (Mark Monitoring/Resolve), `src/pages/PayrollDetails.jsx:1188-1193` (delete), `src/pages/TimeClock.jsx:1093` (save edit). Fix: a busy state wired to `loading`/`disabled`.

26. **"Send Email" marks the invoice sent whether or not the mail client opened.** `src/pages/ParticipantInvoices.jsx:441-464`. Fix: confirm after the mailto, or make "mark sent" a separate action.

---

## 3. WRONG DATA SHOWN

27. **`formatDate` is a relative formatter used on calendar dates.** `src/lib/api.js:2663-2682`: any future date has a negative diff → `diffMins < 1` → **"Just now"**; recent past prints "3d ago". Used for review/target/follow-up/expiry/roster dates in `RiskRegister.jsx:525,739`, `HazardRegister.jsx:509,740,798` (+PDF `:323`), `ContinuousImprovement.jsx:486,489,723-726` (+PDF `:305`), `ConflictOfInterest.jsx:465,690-694` (+PDF `:306`), `ShiftRoster.jsx:623,654` ("No notes found for Just now"), `InfectionRegister.jsx:283,291,389,486,513,518`, `PolicyRegister.jsx:174,221`, `SDSRegister.jsx:188,284`, `Announcements.jsx:617`, `InquiryDetail.jsx:235,246`, `Rosters.jsx:22-23`, `ParticipantProfile.jsx:1025,1119`, `FeedbackComplaints.jsx:602,882`. Fix: a plain `toLocaleDateString('en-AU')` formatter for date columns; keep the relative one for `created_at`.

28. **Legislation filters return nothing.** `src/pages/LegislationRegister.jsx:215` calls `fetchLegislation(type, compliance, jurisdiction)` but the signature at `src/lib/api.js:2517` is `(complianceStatus, legislationType, jurisdiction)`; choosing Type "Act" sends `compliance_status=act`. Fix: swap the first two args.

29. **Messages page shows the admin inbox to everyone and never clears unread.** `src/pages/Messages.jsx:19` hard-codes `senderId = 'admin'` (every user loads and sends as admin); `:55/:60` read `m.is_read` but the server column is `read` (`api/features.js:417,426`) so every message stays bold/unread and `markMessageRead` re-fires on each click; `:111-121` "Delete" only removes locally although a `delete-message` endpoint exists (`api/features.js:431`). Fix: `profile.id`, `m.read`, call the delete endpoint.

30. **Today/overdue computed in UTC (wrong before 10/11 am AEST).** `src/pages/AuditCalendar.jsx:123,127,197,325` (today ring, overdue, `completed_date` stamped yesterday); `src/pages/Rosters.jsx:27,30` (current/upcoming); defaults `src/pages/PolicyRegister.jsx:301`, `src/components/InquiryModal.jsx:28,55`, `src/pages/ExpenseHub.jsx:636`, `src/components/RiskProfileTab.jsx:460,463`, `src/components/ProgressNotesPDF.jsx:528,531,535` ("This month" From is always the last day of the previous month; "To" is yesterday before 10 am). Fix: `toLocalDate()` everywhere (`src/lib/dates.js` already exists).

31. **Default dates frozen at module load.** `src/pages/ParticipantProfile.jsx:46`, `Incidents.jsx:80`, `FeedbackComplaints.jsx:111`, `ExpenseTracker.jsx:97`, `ParticipantInvoices.jsx:103,114`, `src/components/GoalsOfCareTab.jsx:28` (also UTC), `src/components/ProgressNoteForm.jsx:26-30` (`note_date` and `day_of_week`). A night-shift tab opened before midnight prefills yesterday's date on new incidents, notes, expenses and invoices. Fix: compute the default inside the open-modal function.

32. **"Overdue"/"Expired" from 10/11 am on the due day.** `new Date('YYYY-MM-DD') < new Date()` parses as UTC midnight (10 am AEST): `src/pages/TaskBoard.jsx:153,362,463,570`, `Dashboard.jsx:457`, `StaffProfile.jsx:147-151`, `PropertyDetail.jsx:43-46`, `Compliance.jsx:27-31` (`getDaysUntilExpiry`, also off by one most afternoons), `Announcements.jsx:509`. Fix: compare date strings against `toLocalDate()`.

33. **"Participant not found" sticks after one failed load.** `src/pages/ParticipantProfile.jsx:148-176` never resets `error`; `:641` renders it. Fix: `setError(null)` at the top of `load()`.

34. **Invoice stat cards change with the tab filter.** `src/pages/ParticipantInvoices.jsx:189-205,221-226,572`. Also `:607,764,1170` render "NaN" when `status` is null. Fix: fetch unfiltered for stats; a `capitalize()` with fallback.

35. **Permanent contracts are printed as casual.** `src/components/GenerateContractModal.jsx:254-255,385,438` always use the s15A casual heading, the Casual Employment Information Statement and "I accept this offer of casual employment". Fix: branch on `isCasual`.

36. **Three different ABNs on OLF PDFs.** `OrientationPDF.jsx:349` (59 668 648 977), `GenerateContractModal.jsx:125,133,211` + `src/lib/registerPdfExport.js:70` (55 643 227 061), `MonitoringTab.jsx:200,328` + `NDISInvoiceGenerator.jsx:78,277` (21 665 521 942). At least two are wrong on legal documents. Fix: one shared constant.

37. **Blood pressure cannot be entered.** `src/components/MonitoringTab.jsx:26-33,542,598,749,939-947` treat BP as a single numeric; "120/80" is impossible, only systolic is stored and charted. Fix: systolic + diastolic fields.

38. **Audit trail says "Admin".** `src/components/OnboardingTab.jsx:266` `completed_by: 'Admin'`, `src/components/OrientationTab.jsx:146` `last_updated_by: 'Admin'`; `src/components/RiskProfileTab.jsx:464` reads `profile?.display_name` (does not exist; `full_name` does) so "Reviewed By" defaults to the email. Fix: `profile.full_name`.

39. **Owner role treated as Staff in chat.** `src/components/ChatPanel.jsx:16-20,293` and `src/pages/TeamChat.jsx:13-17,314` have no `owner` entry and check `=== 'admin'` for moderator delete. Fix: treat owner as admin.

40. **"undefined" in PDFs.** `src/components/HospitalPassportTab.jsx:886` `${med.dosage}` → "undefined | twice daily"; `src/components/OrientationPDF.jsx:332` "undefined — 1:1 ratio", `:750` " years old" with no DOB. Fix: `.filter(Boolean).join()` / fallbacks.

41. **Truncated text in PDFs.** `src/pages/PayrollDetails.jsx:253-254` prints only `valText[0]` of wrapped values; `src/components/RiskProfileTab.jsx:402,407,419` writes the title unwrapped and slices descriptions to 4-5 lines silently. Fix: render all wrapped lines and grow the row.

42. **Stale data across participants.** `src/components/OrientationTab.jsx:114-117,135` `loadedRef.done` never resets while `ParticipantProfile.jsx:99,176` keeps `tab` state, so opening another participant on the Orientation tab shows the previous one's guide. Fix: key the tab on `participantId`.

43. **Search/filter races.** `src/pages/ScreeningChecklist.jsx:82-97` fires on every keystroke with no debounce or stale guard; `src/pages/Inquiries.jsx:73-81` double-fires on mount; filter pills in `AssetRegister.jsx:201-217`, `LegislationRegister.jsx:209-226`, `HazardRegister.jsx:137-157`, `RiskRegister.jsx:148-164`, `ContinuousImprovement.jsx:131-146`, `ConflictOfInterest.jsx:151-166` have the same unguarded fetch. Fix: debounce + request counter/AbortController.

44. **Stale task detail.** `src/pages/TaskBoard.jsx:446-453,558-565` store the `detailTask` snapshot; after saving a follow-up only `tasks` is patched so the Save button (`:756,:783`) stays enabled and Edit reopens stale data. Fix: derive from `tasks.find(id)`.

45. **Staff Directory "All Roles" view hides onboarding progress.** `src/pages/StaffList.jsx:338-350` omits `onboardingProgress`. Fix: pass it through.

46. **Multi-photo upload hides successes.** `src/components/PropertyProfileTab.jsx:66-82` only refreshes after all files succeed. Fix: `onRefresh()` in `finally`.

47. **Sidebar/route mismatches.** `src/components/Sidebar.jsx:310,324` show the Incident Register link only inside the admin/manager block, but the route is feature-gated (`App.jsx:297-301`), so a staff member granted `incidents` has no way to reach it except a typed URL. `Sidebar.jsx:316-317` hard-code two document UUIDs ("Policy Addendum", "Meeting Minutes") that 404 inside DocumentView if either file is ever moved/deleted. `src/pages/AuditHub.jsx` has no route in `App.jsx` and nothing links to it (dead page). `App.jsx:106-138` is otherwise consistent with the sidebar (owner bypasses role lists; `payroll` owner-only; `rosters`/`permissions` `adminOnly` match `isAdmin`).

---

## 4. SILENT FAILURES (error swallowed, UI unchanged or shows success)

48. `src/pages/PayrollDetails.jsx:416-426` archive/reactivate: no `res.ok`, empty catch. `:443-452` delete (modal stays open), `:428-441` TFN/ABN swap, `:464-481` report upload, `:358-371` initial load all log only; `:483-494` writes a file-delete error into `error` that only renders inside the closed edit modal (`:801-810`).
49. `src/pages/ParticipantInvoices.jsx:200-201,422-423,436-437,475-476,499-500` load/detail/Mark Claimed/Mark Paid/Delete/Attach all console-only.
50. `src/components/MonitoringTab.jsx:341-352,500-507,1017-1024` loaders render "No readings recorded yet" on fetch failure (reads as clinical fact); `:356-361` chart enable/disable and `:557-566,1052-1057` delete swallow errors (dialog stays open).
51. `src/components/ChatPanel.jsx:141-149` and `src/pages/TeamChat.jsx:172-180` `setDeleteConfirm(null)` inside `try` + console-only → failed delete leaves "Delete message?" open; `handleSend` (`ChatPanel.jsx:133`, `TeamChat.jsx:163`) drops the message silently.
52. `src/components/GoalsOfCareTab.jsx:51,128` `catch (_) {}` on load and quick-status. `src/components/OnboardingTab.jsx:271-274` optimistic tick reverts with no message.
53. `src/pages/FluidBalance.jsx:95-97,140-142,349` `error` only rendered inside the Add modal; `:74-76` `fetchParticipants().then()` with no catch (unhandled rejection, empty dropdown). `src/pages/InfectionRegister.jsx:248-249` and `SDSRegister.jsx:164-165` delete errors go to `formError` which is only inside the create/edit modal.
54. `src/pages/ScreeningChecklist.jsx:90-91`, `ShiftRoster.jsx:132-133,150-151,169-170`, `TaskBoard.jsx:75-76`, `PolicyRegister.jsx:69-80`, `RosterOfCare.jsx:47-62`, `ExpenseHub.jsx:141-142`, `RosterOfCareBuilder.jsx:118-119,127-134` ("Roster not found" on network error; failed reload after add closes the modal with a stale grid): load failures render the empty state.
55. `src/pages/Announcements.jsx:145-154` pin failure console-only (and always fails, see #2). `src/pages/TrainingHub.jsx:148-156` follow-up PATCH unchecked → resource saved under raw filename while toast says success. `src/pages/Compliance.jsx:63-77` audit POST swallowed. `src/pages/Dashboard.jsx:668-672` no `r.ok`, empty catch. `src/pages/Permissions.jsx:113-118` reverts without a message.
56. `src/pages/StaffProfile.jsx:99-106` `window.open` after an `await` → blocked by Safari/iOS and strict Chrome; "View" does nothing. `src/pages/PaymentReview.jsx:68-72` leaves a blank tab open on failure (the AttachModal at `:426` does it right).
57. `src/lib/registerPdfExport.js:48` `pdf.addImage` outside the try and the export promise is un-awaited by 13 register pages (e.g. `src/pages/Incidents.jsx:367`) → a bad logo response produces nothing and no alert.
58. `src/pages/ExpenseTracker.jsx:357-364` a failed recurring toggle sets the page-level `error`, which replaces the whole expenses table (`:953-959`). `:545-553` Tesseract worker only terminated on success (leaks on OCR error).

---

## 5. LAYOUT / MOBILE

59. `src/pages/TeamChat.jsx:195` `h-[calc(100vh-64px)]` inside `<main class="p-6 lg:p-10 overflow-y-auto">` (`Layout.jsx:25`) → composer below the fold on phones.
60. `src/pages/TaskBoard.jsx:823-827` TaskModal has no `max-h-[90vh] overflow-y-auto` (TaskDetail does) → Create/Update buttons unreachable on short viewports.
61. `src/components/ParticipantModal.jsx:257,332,351,369`, `AddStaffModal.jsx:244`, `EditStaffModal.jsx:215` hard `grid-cols-2/3` + `px-10` → ~80 px inputs at phone width. `StakeholderModal.jsx:112` shows the right pattern.
62. Tables with no `overflow-x-auto`: `src/pages/StaffProfile.jsx:732-733`, `Compliance.jsx:462-463,526-527`, `Inquiries.jsx:192-193` (8 columns). `src/pages/PropertyDetail.jsx:267-291` five `px-5` tabs in a non-wrapping row (Risk Assessment tab unreachable on phones), `:199-207` header no `flex-wrap`; `:617,:249` `{m.cost && …}` prints a stray "0".
63. `src/components/HospitalPassportTab.jsx:206-228` header buttons overflow on phones (`RiskProfileTab.jsx:586` wraps correctly).
64. `src/pages/RosterOfCareBuilder.jsx:392` `md:grid-cols-7` → ~100 px day columns on tablets.
65. `src/pages/ExpenseHub.jsx:705-707,646-652,988-990` custom modals close on any backdrop click/Escape, including mid-save and when a text-selection drag ends outside → typed invoice discarded. Use the shared `Modal`.
66. PDF cosmetics: `src/components/IncidentReportPDF.jsx:141` and `ProgressNotesPDF.jsx:112` call `setTextColor(255,255,255,200)` — four args is CMYK in jsPDF, so the header subtitle renders black/garbled instead of white; `RiskAssessmentTab.jsx:260` logo drawn 30x30 from a 2:1 image (squashed); `MonitoringTab.jsx:271-274,297-328` new pages have no column header and the totals row can overlap the footer.
67. `src/pages/StaffPayslips.jsx:336`, `InfectionRegister.jsx`, `SDSRegister.jsx` lack `dark:` variants on filters/tables/modals → white panels in dark mode. `src/components/Header.jsx:122-130` owner badge falls through to staff styling.

---

## 6. `src/lib/api.js` cross-check against `api/*.js`

- 221 `fetch` calls in `api.js`. I extracted each endpoint + action (query `?action=` or body `action:`) by script and matched against every `case '…'` / `action === '…'` / handler-map key in the matching `api/*.js`; the 30 "no action" hits are PATCH/DELETE/GET routes that the servers dispatch on `req.method` + `id` (`api/tasks.js:164-181`, `api/docs.js:883-922`, `api/staff.js:672-693`, `api/properties.js:985-1026`, `api/participants.js:812-895`, `api/rosters.js:117-121`, `api/staff-docs.js:415-423`, `api/time-clock.js:346-391`), and `prGet/prPost` pass the action through to the `GET`/`POST` maps at `api/payment-reviews.js:415-418` (all 13 call-site actions exist, incl. `gaps-pdf`).
- **Mismatches (3):** `sendMessage` → `'message'` (server `'send-message'`), `deleteAnnouncement` → `'announcement'` (server `'delete-announcement'`), `updateAnnouncement` → no action (server `'update-announcement'`). See #1 and #2.
- **`res.ok` / `json.error`:** every client function checks `res.ok` and throws `err.error || …` (the 10 my heuristic flagged all have the check on the following lines or go through `rosterRes`/`prRes` at `:2792-2795,2816-2819`). The raw `fetch` calls outside `api.js` are the problem: `CleaningSchedule.jsx:103,127,135` (DELETE unchecked), `FluidBalance.jsx:89,109,136`, `AuditLog.jsx:103`, `Compliance.jsx:63`, `Dashboard.jsx:668`, `TrainingHub.jsx:148`, `PayrollDetails.jsx:416-481`.
- Note for the backend audit: time-clock (`api.js:604-620,637-651,718-742`) and all `/api/features` calls send no `Authorization` header, unlike rosters/payment-reviews (`:2791`). The server must be the only guard there.

---

## 7. What is fine

Error boundary at `App.jsx:7-42`; `localStorage` reads are all wrapped (`Sidebar.jsx:92-104`, `AuditHub.jsx:115`, `ExpenseTracker.jsx:677`, `ThemeContext.jsx`); polling intervals (`Sidebar.jsx:139-143`, `ChatPanel.jsx:100`, `TeamChat.jsx:122`, `Dashboard.jsx:426`, `TimeClock.jsx:223`) all clear on unmount; index keys are only on skeletons/static header rows except `RosterOfCareBuilder.jsx:395,758,1161`, `ParticipantInvoices.jsx:984,1247`, `NDISInvoiceGenerator.jsx:809` (editable line-item rows — cosmetic risk only); token refresh in `AuthContext.jsx:34-67` is sound apart from a stale `user/profile` fallback at `:55-56`.

# Bug and Security Review

Repository: `Websites-by-AI/Taranom-psychology-school-10milion-panel`

Reviewed commit: `0b0b8d7`

Review date: 2026-08-14

## Executive summary

The production bundle builds, but the TypeScript check fails with **5 errors**, including several that become user-visible `ReferenceError` crashes. More importantly, the current authentication/authorization design permits direct access to the admin UI and exposes the database user list without an admin authorization check. OTP codes are returned directly to callers and can be reused during their validity window.

### Commands run

```bash
npm ci
npm run lint
npm run build
npm run test:api
npm audit
```

### Results

- `npm run lint`: **FAIL** — 5 TypeScript errors.
- `npm run build`: **PASS**, but Vite transpiles without type-checking, so this does not prove the app is runtime-safe.
- `npm run test:api`: exits successfully. The no-database `GET /api/auth/count` scenario returns the expected 503.
- `npm audit`: **13 vulnerabilities**: 8 high, 2 moderate, 3 low.
- Main initial JS chunk is about **646 kB** (184 kB gzip), with large Firebase/PDF/chart chunks.

---

## Critical / high-severity findings

### 1. Admin UI can be entered by browsing directly to `/admin`

**Location:** `src/App.tsx:57-73`

On initialization, the application grants the admin role solely because the URL is `/admin`:

```ts
if (location.pathname === '/admin') return getHydratedStudent(mockStudents[0]);
...
if (location.pathname === '/admin') return "admin";
```

There is no call to `/api/auth/me`, no session validation, and no server-confirmed role check before rendering the admin view. A user can therefore open `/admin` directly and be treated as an administrator in the client.

**Impact:** Unauthorized access to admin UI and any operations that rely only on frontend role checks. The same general issue applies to role state controlled entirely in the browser.

**Fix:**

1. On app startup, call `GET /api/auth/me` with `credentials: "include"`.
2. Derive `student` and `role` only from the authenticated server response.
3. Protect `/admin` by requiring `user.role === "admin"`; otherwise redirect to login/403.
4. Enforce authorization again on every sensitive API endpoint. Frontend guards are not security controls.

### 2. `/api/auth/list` exposes all registered users without authentication

**Locations:**

- `lib/api-router.ts:1960-1962`
- `lib/api-router.ts:1991-2002`
- `src/components/admin/StudentManagement.tsx:31-46`

`authList` calls `store.listUsers()` without checking a session or the user's role. The route is publicly reachable whenever D1 is configured. Returned records include names, mobile numbers, email addresses, city, age, and role through `userToStudent()`.

**Impact:** Disclosure of students' personally identifiable information.

**Fix:** Require a valid session and `role === "admin"` before listing users. Return `401` for no session and `403` for a non-admin session. Consider returning only fields actually needed by the UI and add pagination.

### 3. OTP authentication is insecure in production

**Locations:**

- `lib/api-router.ts:1900-1940` (OTP flow)
- `src/components/LoginView.tsx:198-213`

The OTP-send endpoint returns the generated code as `devCode`, and the frontend displays it. There is also no rate limiting, attempt limit, or deletion/invalidation of an OTP after successful verification. A valid code can be replayed until it expires.

**Impact:** Anyone who knows a phone number can request its OTP, read the code in the response, and sign in as that user. Repeated requests/guesses are unrestricted.

**Fix:**

- Never return the code outside an explicit local-development mode.
- Connect an SMS provider and send the code out-of-band.
- Hash stored OTPs.
- Delete or mark an OTP consumed immediately after successful verification.
- Add per-IP and per-mobile send/verify rate limits and a maximum number of attempts.

### 4. Login endpoints have no brute-force/rate protection

**Locations:** `lib/api-router.ts:1877+`, OTP endpoints immediately after it.

Password login and OTP operations have no rate limits, progressive delay, lockout, CAPTCHA, or abuse monitoring.

**Impact:** Password guessing, OTP guessing, user enumeration, and resource exhaustion. Different 404/401 login responses also reveal whether an account exists.

**Fix:** Add edge-level and application-level rate limits, return one generic invalid-credentials response, and log suspicious attempts.

---

## User-visible runtime bugs

### 5. Blog page crashes: `BlogView is not defined`

**Locations:**

- Missing declaration/import near `src/components/ViewFactory.tsx:26-29`
- Used at `src/components/ViewFactory.tsx:256-257`

The comment says BlogView is eagerly imported, but there is no import. Opening `/blog` causes a runtime `ReferenceError`.

**Fix:** Add:

```ts
import BlogView from "./BlogView";
```

or lazy-load it consistently.

### 6. Download page crashes: `MobileDownloadView is not defined`

**Location:** `src/components/ViewFactory.tsx:259-260`

The component is used without an import/declaration.

**Fix:** Add:

```ts
const MobileDownloadView = lazy(() => import("./MobileDownloadView"));
```

### 7. Study-planner page crashes: `Calendar is not defined`

**Locations:**

- Icon imports: `src/components/StudyDashboardView.tsx:3-7`
- Use: `src/components/StudyDashboardView.tsx:214`

`Calendar` is rendered but is absent from the `lucide-react` import list. Opening `/study-planner` reaches this code and throws.

**Fix:** Add `Calendar` to the `lucide-react` imports.

### 8. Generated planner crashes after a plan is generated: `motion is not defined`

**Locations:**

- Missing import: `src/components/AdvancedStudyPlanner.tsx:1-6`
- Uses: `src/components/AdvancedStudyPlanner.tsx:498` and `:573`

The initial planner view may render, but once `generatedPlan.schedule` is displayed, `<motion.div>` references an undefined identifier.

**Fix:** Add:

```ts
import { motion } from "motion/react";
```

### 9. Student/parent “Settings” navigation always leads to access denied

**Locations:**

- Allowed views: `src/components/ViewFactory.tsx:46-65`
- Student settings item: `src/App.tsx:213`
- Parent settings item: `src/App.tsx:226`

Both student and parent menus link “Settings” to the `admin` view, but `admin` is not allowed for those roles. The menu presents a route that its own access guard rejects.

**Fix:** Create a separate profile/settings route (the project already has `ProfileSettingsView`) and point non-admin settings menu items to it. Do not grant users access to the admin panel merely to solve this mismatch.

---

## Reliability and maintainability findings

### 10. CI can publish a bundle with known type/runtime errors

`npm run build` does not run `tsc --noEmit`; therefore it passes while `npm run lint` fails. The missing identifiers above remain in generated chunks and fail only when the relevant screens are opened.

**Fix:** Make build fail fast:

```json
"build": "npm run lint && vite build && esbuild server.ts --bundle --platform=node --format=cjs --packages=external --sourcemap --outfile=dist/server.cjs"
```

Add CI checks for lint, tests, and production build.

### 11. API tests do not cover authorization or browser routes

The current API script checks route responses, but it does not verify:

- anonymous users are denied `/api/auth/list`;
- non-admin users receive 403;
- OTP codes are not returned/reusable;
- `/blog`, `/download`, `/study-planner`, and generated planner rendering;
- direct `/admin` access is rejected.

**Fix:** Add API authorization tests and browser smoke tests (Playwright is suitable) for every navigation item and role.

### 12. Dependency vulnerabilities

`npm audit` reported 13 issues, including high-severity advisories affecting the direct `axios` and `vite` dependencies and transitive packages such as React Router, PostCSS, protobufjs, and ws.

**Fix:** Update within compatible ranges first (`npm update` / targeted upgrades), rerun type/build/browser tests, then evaluate major-version upgrades. In particular, update Axios, Vite, React Router, Firebase/Supabase dependencies, and regenerate the lockfile. Do not apply a forced major upgrade without regression tests.

### 13. Development and edge API implementations can drift

Local development uses the independent Express implementation in `server.ts`, while Vercel/Cloudflare uses `lib/api-router.ts`. Auth routes exist in the shared edge router but are not mirrored in the Express route list, producing different local and deployed behavior (the UI intentionally falls back to local storage on 503/404).

**Fix:** Have Express adapt and call the shared `handleRequest` router, or extract all business logic into shared handlers used by every deployment target.

---

## Recommended fix order

1. Protect `/api/auth/list` and all admin APIs with server-side session/role checks.
2. Remove production `devCode`, invalidate used OTPs, and add rate limiting.
3. Remove the URL-based admin grant and hydrate auth from `/api/auth/me`.
4. Fix the five TypeScript errors (BlogView, MobileDownloadView, Calendar, and motion).
5. Separate user profile settings from the admin route.
6. Make type-checking mandatory in the build/CI pipeline.
7. Add browser route smoke tests and auth/security integration tests.
8. Upgrade vulnerable dependencies and retest.

## Minimal reproduction commands

```bash
npm ci
npm run lint       # fails with 5 missing-name errors
npm run build      # currently passes despite those errors
npm run test:api   # route test suite
npm audit          # 13 known vulnerabilities at review time
```

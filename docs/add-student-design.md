# Add Student — Design Spec (Backend + Admin Panel)

**Status:** Approved for implementation  
**Date:** 2026-06-03  
**Scope:** V1 — email + password auth only, admin-created students via Callable Cloud Function  
**Password strategy:** Option C — no password in admin form; student sets password via Firebase password-reset email

---

## Summary

Admins need an **Add Student** flow in the Ardent Admin Panel. Creating a student requires **two** records:

1. **Firebase Authentication user** — login identity (`uid`, email)
2. **Firestore profile** — `users/{uid}` with app fields (name, academic details, plan snapshot, progress defaults, etc.)

The admin panel is a browser client and **cannot** use the Firebase Admin SDK. It must call a **Callable Cloud Function** (`createStudent`) that:

- Verifies the caller has the `admin` custom claim
- Creates the Auth user (email only, no password collected in UI)
- Sends a password-reset email so the student can set their own password
- Writes the Firestore `users/{uid}` document with the **default Free plan** snapshot (see below)

This mirrors the existing pattern used by `makeBannerImagePublic` in the admin panel (`httpsCallable` + admin claim check).

---

## Architecture

```
Admin Panel (React)
    │
    │  httpsCallable('createStudent', payload)
    ▼
Cloud Function: createStudent (region: asia-south1)
    │
    ├─► Verify request.auth.token.admin === true
    ├─► admin.auth().createUser({ email, displayName })   // no password
    ├─► admin.auth().generatePasswordResetLink(email)
    ├─► Send password-reset email (see Email delivery below)
    ├─► firestore.doc(`users/${uid}`).set(profile)
    └─► return { uid, passwordResetEmailSent: boolean }
```

**Region:** Match existing functions — `asia-south1` (admin panel default in `src/lib/functions.ts`).

**Rollback:** If Firestore write (or critical step after Auth create) fails, delete the Auth user in `catch` to avoid orphan accounts:

```ts
await admin.auth().deleteUser(uid)
```

---

## Why Callable + Admin SDK

| Approach | Problem |
|----------|---------|
| Client `createUserWithEmailAndPassword` | Signs the **admin browser** in as the new user |
| Firestore-only doc (no Auth) | Student cannot log in |
| **Callable + Admin SDK** | Correct: admin session unchanged, Auth + Firestore stay in sync |

---

## Callable API

### Function name

`createStudent`

### Authorization

- Require `request.auth` (signed-in admin)
- Require `request.auth.token.admin === true`
- On failure: `HttpsError('permission-denied', 'You do not have admin access.')`
- Unauthenticated: `HttpsError('unauthenticated', 'You must be signed in as an admin.')`

### Request payload

```ts
interface CreateStudentInput {
  name: string
  email: string
  state?: string
  academicDetails?: {
    collegeState?: string
    collegeName?: string
    academicYear?: string
  }
}
```

**Not in payload:** `password` (Option C — student sets via reset email).

### Validation (function-side)

| Field | Rules |
|-------|--------|
| `name` | Required, trimmed, non-empty |
| `email` | Required, trimmed, valid format, normalized to lowercase |
| `state` | Optional string |
| `academicDetails` | Optional; trim string fields |

### Response

```ts
interface CreateStudentResult {
  uid: string
  passwordResetEmailSent: boolean
}
```

### Error codes (map in admin UI)

| Code / source | Meaning | Suggested UI message |
|---------------|---------|----------------------|
| `auth/email-already-exists` | Auth user exists | A student with this email already exists |
| `functions/invalid-argument` | Validation failed | Show server message |
| `functions/permission-denied` | Not admin | You do not have admin access |
| `functions/unauthenticated` | Not signed in | You must be signed in as an admin |
| `functions/internal` | Unexpected failure | Failed to create student. Please try again |

---

## Password-reset email (Option C)

### Flow

1. Create Auth user **without** a password:

```ts
const userRecord = await admin.auth().createUser({
  email: normalizedEmail,
  displayName: name.trim(),
  emailVerified: false,
  disabled: false,
})
```

Firebase allows email/password users without a password when created via Admin SDK; they cannot sign in until they complete the reset/set-password flow.

2. Generate reset link:

```ts
const resetLink = await admin.auth().generatePasswordResetLink(
  normalizedEmail,
  {
    url: process.env.PASSWORD_RESET_CONTINUE_URL, // e.g. app deep link or marketing site
    handleCodeInApp: false,
  },
)
```

3. **Send the email** — Admin SDK generates the link but does **not** send mail automatically. Choose one:

| Method | Notes |
|--------|--------|
| **Firebase Trigger Email extension** | Common; function writes to `mail` collection or extension handles OOB |
| **Custom SMTP / SendGrid / etc.** | Function sends HTML email containing `resetLink` |
| **Firebase Auth email templates** | Configure in Console; ensure your mail pipeline uses the generated link |

4. Set `passwordResetEmailSent: true` only after send succeeds. If email send fails after Auth + Firestore succeed, return `passwordResetEmailSent: false` and log for ops (student exists but must use “Forgot password” in app).

### Firebase Console prerequisites

- Email/Password provider enabled
- Password reset email template configured (subject, body, sender)
- Authorized domain(s) for action links
- `PASSWORD_RESET_CONTINUE_URL` (or equivalent) set in function env

---

## Firestore document: `users/{uid}`

Document ID **must** equal Auth `uid`.

### Required / recommended fields (V1)

```ts
{
  uid: string,
  email: string,
  phone: null,
  name: string,
  authenticationMethod: 'emailPassword',
  isActiveUser: true,
  isEmailVerified: false,
  isPhoneVerified: false,
  isOnboardCompleted: boolean,  // see rule below
  state: string,
  academicDetails: {
    collegeState: string,
    collegeName: string,
    academicYear: string,
  },
  deviceId: null,
  deviceLimit: number,          // match mobile app default (inspect existing users)
  fcmToken: null,
  progress: {
    streakCount: 0,
    totalTimeSpent: 0,
    videosCompleted: 0,
    quizzesCompleted: 0,
    testsCompleted: 0,
    avgScore: 0,
  },
  mcqProgress: {
    streakCount: 0,
    userOption: 0,
    lastAttempted: null,
  },
  plans: DEFAULT_FREE_PLAN_SNAPSHOT,  // always set on create — see below
}
```

### `isOnboardCompleted`

```ts
const hasAcademicDetails =
  collegeState.trim() ||
  collegeName.trim() ||
  academicYear.trim()

isOnboardCompleted: hasAcademicDetails
```

Adjust if product rules differ (e.g. always `false` until student completes onboarding in app).

### Fields omitted on create (V1)

Do not set unless product requires them:

- `profileImagePath`
- `dailyVignettes`
- `studentQuestionnaire`

Add later if admin create should pre-fill them.

### `deviceLimit`

Inspect an existing `users` document created by the mobile app and use the same default (not defined in admin panel repo).

---

## Default plan on create (Free)

Every new student **must** have a `plans` object on create. This matches the mobile app default — **Free plan**, not an empty/missing `plans` field.

**Do not** omit `plans`. **Do not** use `buildStudentPlanSnapshot` (edit-student logic) for create — that sets `planPurchaseDate` to `now()`. On create, dates stay `null`.

### Required shape (matches production user default)

```ts
const DEFAULT_FREE_PLAN_SNAPSHOT = {
  planId: process.env.DEFAULT_FREE_PLAN_ID,  // e.g. "alrWAldnOuOUpxtBMZS1"
  planName: 'Free',
  planModules: [],                             // empty array (or empty map in Firestore)
  planPurchaseDate: null,
  planExpiryDate: null,
  purchaseId: null,
}
```

Example as stored in Firestore:

| Field | Value |
|-------|--------|
| `planId` | `"alrWAldnOuOUpxtBMZS1"` (Free plan doc ID — store in function env) |
| `planName` | `"Free"` |
| `planModules` | empty |
| `planPurchaseDate` | `null` |
| `planExpiryDate` | `null` |
| `purchaseId` | `null` |

### Configuration

- Set `DEFAULT_FREE_PLAN_ID` in Cloud Functions env (value from your `plans` collection — the Free plan document).
- Optionally validate at startup or on first call that the plan doc exists and `planName` is `"Free"`.
- **Do not** accept `planId` in the create payload for V1 — all new users start on Free.

### Upgrading plan later

Admins change plan via **Edit Student** in the admin panel. That flow uses `buildStudentPlanSnapshot` (purchase date, expiry, modules from selected plan). Create and edit are intentionally different.

---

## Suggested function implementation outline

```ts
export const createStudent = onCall({ region: 'asia-south1' }, async (request) => {
  // 1. AuthZ
  assertAdmin(request)

  // 2. Parse + validate input
  const input = validateCreateStudentInput(request.data)

  let uid: string | undefined

  try {
    // 3. Create Auth user (no password)
    const userRecord = await admin.auth().createUser({
      email: input.email,
      displayName: input.name,
      emailVerified: false,
    })
    uid = userRecord.uid

    // 4. Firestore profile (always includes default Free plan)
    await admin.firestore().doc(`users/${uid}`).set({
      uid,
      email: input.email,
      phone: null,
      name: input.name,
      authenticationMethod: 'emailPassword',
      isActiveUser: true,
      isEmailVerified: false,
      isPhoneVerified: false,
      isOnboardCompleted: hasAcademicDetails(input.academicDetails),
      state: input.state ?? '',
      academicDetails: normalizeAcademicDetails(input.academicDetails),
      deviceId: null,
      deviceLimit: DEFAULT_DEVICE_LIMIT,
      fcmToken: null,
      progress: DEFAULT_PROGRESS,
      mcqProgress: DEFAULT_MCQ_PROGRESS,
      plans: DEFAULT_FREE_PLAN_SNAPSHOT,
    })

    // 5. Password reset email
    const passwordResetEmailSent = await sendPasswordResetEmail(input.email)

    return { uid, passwordResetEmailSent }
  } catch (error) {
    if (uid) {
      await admin.auth().deleteUser(uid).catch(() => {})
    }
    throw mapToHttpsError(error)
  }
})
```

---

## Admin panel integration (reference)

When implementing the React side (separate task in `ardent-admin-panel`):

| Piece | Location / pattern |
|-------|---------------------|
| Button | `StudentsPageHeader` — “Add Student” (same style as “New Banner”) |
| Modal | `AddStudentModal` — name, email, state, academic details (no plan picker; Free is applied server-side) |
| Callable client | `src/lib/create-student.ts` — `httpsCallable(functions, 'createStudent')` |
| Success copy | “Student created. Password setup email sent to {email}.” (if `passwordResetEmailSent`) |
| Partial success | If `passwordResetEmailSent === false`, warn admin to ask student to use Forgot password |
| Refresh | Reload students list on success |

**Modal fields (V1):** No password field.

---

## Security

- Admin SDK credentials only in Cloud Functions / server
- Never log passwords or reset links in production logs
- Rate-limit or monitor callable abuse if needed
- Firestore rules: ensure only admins (or the function via Admin SDK) can create `users` docs as intended
- Callable must not be invokable without admin claim

---

## Out of scope (V1)

- Phone auth students
- Google / federated account creation
- Admin-entered temporary password
- Bulk import
- Editing Auth email from this flow (use existing edit-student + separate Auth update if needed later)
- Creating payment / `purchaseId` records

---

## Testing checklist (backend)

- [ ] Admin claim required; non-admin rejected
- [ ] Unauthenticated request rejected
- [ ] Valid payload creates Auth user + Firestore doc; returns `uid`
- [ ] Duplicate email returns friendly error; no duplicate Firestore doc
- [ ] Firestore failure rolls back Auth user
- [ ] Password reset email sent (or `passwordResetEmailSent: false` handled)
- [ ] Student can complete reset link and sign in with new password
- [ ] `plans` written with Free default (`planName: "Free"`, null dates, empty `planModules`)
- [ ] `DEFAULT_FREE_PLAN_ID` env matches Free plan in `plans` collection
- [ ] `authenticationMethod` is `emailPassword` for app compatibility

---

## Related docs (admin panel repo)

- Firestore schema: `docs/firestore-ardent-mds-schema.md` — `users` collection
- Plan snapshot logic: `src/lib/student-plan-assignment.ts`
- Edit student (profile + plan update): `src/lib/students.ts`, `src/components/students/EditStudentModal.tsx`
- Existing callable pattern: `src/lib/make-banner-image-public.ts`
- Functions region config: `src/lib/functions.ts`

---

## Open items for backend implementer

1. Confirm `deviceLimit` default from production mobile-created users
2. Confirm email delivery mechanism (Trigger Email vs SMTP)
3. Set `PASSWORD_RESET_CONTINUE_URL` / action URL for your app
4. Confirm `isOnboardCompleted` rule with product owner
5. Set `DEFAULT_FREE_PLAN_ID` to the Free plan document ID (e.g. `alrWAldnOuOUpxtBMZS1`)

# Algolia Students Search — Implementation Guide (Phases 4–6)

Use this document in Cursor to implement admin student search via Algolia after completing Phases 1–3.

## Completed prerequisites (Phases 1–3)

| Phase | Status | Notes |
|-------|--------|-------|
| 1 — Verify indexing | Done | Extension installed; `users` → Algolia `students` |
| 2 — Index tuning | Done | Searchable attributes: `name`, `email`, `phone`, `uid` |
| 3 — Search API key | Done | Search-only key; stored in Secret Manager |

## Architecture

```text
Firestore users/{uid}          Admin panel (Students page)
        │                                │
        │  Algolia extension (sync)      │  httpsCallable('searchStudents')
        ▼                                ▼
   Algolia index                  Cloud Function (admin auth)
   `students`                           │
        ▲                                │
        └──────── search query ──────────┘
```

**Rules**

- Firestore `users` remains the **source of truth** for create/edit/delete.
- Algolia is a **read-only search mirror** (kept in sync by the extension).
- The **search-only API key** lives only in Cloud Functions (Secret Manager). Never expose it in the admin panel or client env vars.
- When **no search query** is active, keep the existing Firestore list + sort + cursor pagination unchanged.

## Repos and key files

| Repo | Role |
|------|------|
| `ardent-mds-backend` | `searchStudents` callable, Algolia client, secrets |
| `ardent-admin-panel` | Students page calls callable when search is active |

**Existing patterns to follow**

- Admin callable: `functions/src/admin/users/createStudent.ts`
- Admin callable client: `ardent-admin-panel/src/lib/create-student.ts`
- Students hook: `ardent-admin-panel/src/hooks/useStudents.ts`
- Student type: `ardent-admin-panel/src/types/student.ts`
- Page size: `STUDENTS_PAGE_SIZE = 10` in `ardent-admin-panel/src/lib/students.ts`

---

## Phase 4 — Backend: `searchStudents` Cloud Function

### 4.1 Install Algolia client

In `ardent-mds-backend/functions`:

```bash
npm install algoliasearch
```

### 4.2 Environment and secrets

**Production secrets** (Google Secret Manager — already created in Phase 3):

| Secret / env | Purpose |
|--------------|---------|
| `ALGOLIA_SEARCH_API_KEY` | Search-only key (ACL: `search`, index: `students`) |
| `ALGOLIA_APP_ID` | Algolia application ID (can be plain env param) |
| `ALGOLIA_STUDENTS_INDEX` | Index name, default `students` |

Set secrets:

```bash
cd ardent-mds-backend
firebase functions:secrets:set ALGOLIA_SEARCH_API_KEY --project ardent-mds
```

Add to `functions/.env.example` (names only, no real values):

```env
# Algolia admin student search (searchStudents callable)
ALGOLIA_APP_ID=
ALGOLIA_STUDENTS_INDEX=students
# ALGOLIA_SEARCH_API_KEY — set via Secret Manager in production; optional in .env.local for emulator
```

Extend `functions/src/config/env.ts`:

```typescript
algoliaAppId: envString("ALGOLIA_APP_ID"),
algoliaStudentsIndex: envString("ALGOLIA_STUDENTS_INDEX") || "students",
```

For local emulator, add values to `functions/.env.local` (gitignored).

### 4.3 New files (backend)

Create under `functions/src/admin/users/`:

```text
functions/src/admin/users/
├── searchStudents.ts              # onCall export
├── searchStudents.service.ts      # Algolia query + mapping
├── validateSearchStudentsInput.ts # input parsing
└── validateSearchStudentsInput.test.ts
```

Optional shared Algolia client:

```text
functions/src/lib/algoliaClient.ts
```

### 4.4 Input / output contracts

**Request** (`searchStudents` callable):

```typescript
interface SearchStudentsRequest {
  query: string;       // trimmed search text; required when searching
  page: number;        // 0-based page index
  pageSize?: number;   // default 10, max 50
}
```

**Response**:

```typescript
interface SearchStudentsResult {
  students: StudentSearchHit[];
  totalCount: number;
  page: number;        // echo 0-based page
  pageSize: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

interface StudentSearchHit {
  id: string;
  uid: string;
  name: string;
  email: string;
  phone: string | null;
  authenticationMethod: string;
  planName: string;
  isActiveUser: boolean;
}
```

Match the admin panel `Student` type in `ardent-admin-panel/src/types/student.ts`.

### 4.5 Validation rules

In `validateSearchStudentsInput.ts`:

- `query`: trim; min length **1** when searching; max **200** chars
- `page`: integer ≥ 0
- `pageSize`: integer 1–50; default **10**

Throw `invalidArgument()` from `functions/src/lib/errors.ts` on failure.

### 4.6 Algolia search logic

In `searchStudents.service.ts`:

```typescript
import { algoliasearch } from "algoliasearch";

// Use env.algoliaAppId + process.env.ALGOLIA_SEARCH_API_KEY (secret)
// Index: env.algoliaStudentsIndex

const result = await client.searchSingleIndex({
  indexName,
  searchParams: {
    query: trimmedQuery,
    page,                    // Algolia uses 0-based page
    hitsPerPage: pageSize,
    // Optional: restrict searchable attributes to match index config
    // restrictSearchableAttributes: ["name", "email", "phone", "uid"],
  },
});
```

Map each `hit` to `StudentSearchHit`:

| Algolia field | Student field |
|---------------|---------------|
| `objectID` or `uid` | `id`, `uid` |
| `name` | `name` |
| `email` | `email` |
| `phone` | `phone` (null if missing) |
| `authenticationMethod` | `authenticationMethod` (empty string if missing) |
| `plans.planName` or flat `planName` | `planName` |
| `isActiveUser` | `isActiveUser` (false if missing) |

**Display fields gap:** The extension currently indexes `uid,name,phone,email` only. Table columns also need `authenticationMethod`, `planName`, `isActiveUser`.

Choose **one** approach (implement in service):

**Option A — Extend extension index (recommended before launch)**

1. Firebase Console → Extensions → Search Firestore with Algolia → Reconfigure
2. Indexable Fields: `uid,name,phone,email,authenticationMethod,plans.planName,isActiveUser`
3. Force reindex / wait for sync
4. Map directly from Algolia hits

**Option B — Hydrate from Firestore after search**

1. Algolia returns matching `uid`s for the page
2. Batch `getDoc(users/{uid})` in the service
3. Reuse mapping logic similar to `mapStudentDoc` in admin `students.ts` (duplicate or share shape)

Option A is simpler at query time; Option B avoids reconfiguring the extension.

### 4.7 Callable handler

`searchStudents.ts`:

```typescript
import { onCall } from "firebase-functions/v2/https";
import { env } from "../../config/env.js";
import { requireAdmin } from "../../lib/requireAdmin.js";
import { parseSearchStudentsInput } from "./validateSearchStudentsInput.js";
import { searchStudentsInAlgolia } from "./searchStudents.service.js";

export const searchStudents = onCall(
  {
    enforceAppCheck: false,
    region: env.region,
    secrets: ["ALGOLIA_SEARCH_API_KEY"],
  },
  async (request): Promise<SearchStudentsResult> => {
    requireAdmin(request);
    const input = parseSearchStudentsInput(request.data);
    return searchStudentsInAlgolia(input);
  },
);
```

Wire in `functions/src/index.ts`:

- Import `searchStudents`
- Add to `export { ... }`

Add deploy script in `functions/package.json`:

```json
"deploy:search-students": "cd .. && npx -y firebase-tools@latest deploy --only functions:searchStudents"
```

### 4.8 Tests

Add unit tests (no live Algolia calls):

- `validateSearchStudentsInput.test.ts` — valid/invalid `query`, `page`, `pageSize`
- Mock Algolia client in service test if useful; at minimum test hit → `StudentSearchHit` mapping

Run:

```bash
cd ardent-mds-backend/functions
npm run lint && npm run build && npm test
```

### 4.9 Deploy

```bash
cd ardent-mds-backend/functions
npm run lint && npm run build
npm run deploy:search-students
```

Verify in Firebase Console → Functions → `searchStudents` (region `asia-south1`).

---

## Phase 5 — Admin panel: wire search to Algolia

### 5.1 New client module

Create `ardent-admin-panel/src/lib/search-students.ts` (mirror `create-student.ts`):

```typescript
import { httpsCallable } from 'firebase/functions'
import type { Student } from '@/types/student'
import { functions } from './functions'

export interface SearchStudentsParams {
  query: string
  page: number
  pageSize?: number
}

export interface SearchStudentsResponse {
  students: Student[]
  totalCount: number
  page: number
  pageSize: number
  totalPages: number
  hasNext: boolean
  hasPrevious: boolean
}

const searchStudentsCallable = httpsCallable<
  SearchStudentsParams,
  SearchStudentsResponse
>(functions, 'searchStudents')
```

Map callable errors (same pattern as `create-student.ts`):

| Code | User message |
|------|----------------|
| `functions/unauthenticated` | You must be signed in as an admin. |
| `functions/permission-denied` | You do not have admin access. |
| `functions/invalid-argument` | Invalid search request. |
| `functions/internal` | Failed to search students. Please try again. |

Export:

```typescript
export async function searchStudents(
  params: SearchStudentsParams,
): Promise<SearchStudentsResponse>
```

### 5.2 Update `useStudents` hook

File: `ardent-admin-panel/src/hooks/useStudents.ts`

**Behavior split:**

| State | Data source |
|-------|-------------|
| `appliedSearchQuery` is empty | Existing Firestore `fetchStudentsPage` + `getStudentsCount` |
| `appliedSearchQuery` is non-empty | `searchStudents()` callable |

**When search is active:**

- Replace cursor-based pagination with **page index** (`pageIndex` 0-based → pass to callable as `page`)
- On `loadPage` / search submit / page next/previous:
  - Call `searchStudents({ query: appliedSearchQuery, page: pageIndex, pageSize: STUDENTS_PAGE_SIZE })`
  - Set `students`, `totalCount`, `hasNext`, `hasPrevious` from response
  - Do **not** use `pageCursors` or `lastDocOnPage` for Algolia path
- Keep `isSortDisabled={isSearchActive}` (sort stays disabled while searching)
- Remove dependency on Firestore prefix search in the search path (leave Firestore code for non-search list)

**Pagination handlers when search active:**

```typescript
// hasNext / hasPrevious from Algolia response
handleNext → pageIndex + 1 → call searchStudents again
handlePrevious → pageIndex - 1 → call searchStudents again
```

**On clear search:**

- Reset `pageIndex` to 0, `pageCursors` to `[null]`
- Fall back to Firestore list load

**Error handling:**

- Use generic error string from callable mapper (not Firestore index URL — Algolia errors won't have `errorIndexUrl`)
- Pass `errorIndexUrl` as `undefined` when search path fails

### 5.3 Keep unchanged

- `StudentsPageHeader.tsx` — search UI stays the same (submit + clear)
- `StudentsTable.tsx` — no changes if hook still returns `Student[]`
- `StudentsPage.tsx` — no changes unless hook API changes
- Firestore `fetchStudentById`, `updateStudent`, `createStudent` — unchanged

### 5.4 Optional cleanup (after Algolia search works)

In `ardent-admin-panel/src/lib/students.ts`, remove or deprecate:

- Firestore prefix search branches in `buildStudentsListQuery`, `fetchStudentsPage`, `getStudentsCount`
- `resolveStudentSearchField` usage for listing (keep util if used elsewhere)

Update `docs/firestore-students-indexes.md` with a note that search now uses Algolia.

### 5.5 Local development

**Emulator:**

1. `functions/.env.local` with `ALGOLIA_APP_ID`, `ALGOLIA_SEARCH_API_KEY`, `ALGOLIA_STUDENTS_INDEX=students`
2. Admin panel `.env.local`: `VITE_USE_FUNCTIONS_EMULATOR=true`
3. Run functions emulator + admin panel; search hits real Algolia (emulator does not mock Algolia)

**Production admin panel:** no new `VITE_*` Algolia vars — all search goes through the callable.

---

## Phase 6 — Optional polish

### 6.1 Debounced live search

- Keep submit-on-click initially
- Later: debounce 300ms in `StudentsPageHeader` or hook; call `applySearch` on debounced input
- Guard against race conditions (ignore stale responses with request id)

### 6.2 Extension field expansion

If table shows incomplete rows, reconfigure extension indexable fields:

```text
uid,name,phone,email,authenticationMethod,plans.planName,isActiveUser
```

### 6.3 Monitoring

- Algolia dashboard → Search analytics (query volume, no results)
- Firebase Extensions → Algolia extension logs (sync failures)
- Cloud Functions logs for `searchStudents` errors

### 6.4 Cost guardrails

- Algolia Grow free tier: 100K records, 10K searches/month — fine at ~10K users
- Revisit pricing before **100K+** records ([Algolia Grow billing](https://support.algolia.com/hc/en-us/articles/15745996583441-How-am-I-billed-on-the-Grow-plan))

### 6.5 Security checklist

- [ ] Search-only key never in admin panel bundle
- [ ] Sync key only in extension secret
- [ ] `requireAdmin` on every `searchStudents` call
- [ ] Max hits/query on search key aligned with `pageSize` (e.g. 50)

---

## Verification checklist

### Backend

- [ ] `npm run lint && npm run build && npm test` passes in `functions/`
- [ ] `searchStudents` deployed to `asia-south1`
- [ ] Callable rejects unauthenticated and non-admin callers
- [ ] Search `"partial name"` returns expected hits
- [ ] Search by email fragment, phone fragment, full uid works
- [ ] Pagination: page 0 and page 1 return different rows when `totalCount > 10`

### Admin panel

- [ ] Empty search → Firestore list + sort still works
- [ ] Submit search → results from Algolia (infix match, e.g. middle of name)
- [ ] Clear → returns to Firestore list
- [ ] Next/Previous work during search
- [ ] Edit student modal still opens from search results
- [ ] Create student → new user appears in search after extension sync (~1 min)

### Algolia

- [ ] `students` index record count ≈ Firestore `users` count
- [ ] Edit user in Firestore → Algolia record updates

---

## Cursor implementation order

Execute in this sequence (one PR or stacked commits):

1. **Backend env + algolia client + validate + service + tests**
2. **Backend callable + index export + deploy script**
3. **Deploy `searchStudents` + manual test via Firebase shell or temporary script**
4. **Admin panel `search-students.ts` client**
5. **Refactor `useStudents.ts` dual path (Firestore list / Algolia search)**
6. **Manual QA on Students page**
7. **Optional: remove Firestore prefix search code + doc updates**

### Suggested Cursor prompt

```text
Implement Phase 4 and Phase 5 from docs/algolia-students-search-implementation.md:
- Add searchStudents callable in ardent-mds-backend (follow createStudent pattern)
- Use algoliasearch npm package, ALGOLIA_SEARCH_API_KEY secret, requireAdmin
- Add search-students.ts client and update useStudents.ts to call Algolia when appliedSearchQuery is set
- Keep Firestore pagination when not searching
- Add validateSearchStudentsInput tests
- Use Option A: document that extension indexable fields should include authenticationMethod, plans.planName, isActiveUser
```

---

## Reference links

- [Search Firestore with Algolia extension](https://extensions.dev/extensions/algolia/firestore-algolia-search)
- [Algolia Grow billing](https://support.algolia.com/hc/en-us/articles/15745996583441-How-am-I-billed-on-the-Grow-plan)
- Existing Firestore search docs: `docs/firestore-students-indexes.md`

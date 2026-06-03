# Firestore indexes for Students (`users` collection)

The Students admin page loads **10 users per request** using cursor-based pagination (`limit` + `startAfter`), matching Banners and Faculties.

## Indexes you may need

Firestore usually **auto-creates single-field indexes** the first time a query runs. If a query fails, the error in the admin UI includes a **Create index** link — use that link first.

### List + sort (no search)

| Query | Index |
|-------|--------|
| Order by `name` ASC/DESC | Single-field on `name` |
| Order by `plans.planName` ASC/DESC | Single-field on `plans.planName` |

Documents **missing** the sort field are excluded from ordered results. Ensure student profiles have `name` (and `plans.planName` when sorting by plan) populated for consistent listing.

### Search (prefix match)

Search runs on **one field at a time**, inferred from the query:

| Input pattern | Firestore field | Example |
|---------------|-----------------|---------|
| Contains `@` | `email` | `john@` |
| Mostly digits (6+) | `phone` | `98765` |
| 20+ alphanumeric chars, no spaces | `uid` (exact match) | Firebase UID |
| Otherwise | `name` | `Arjun` |

Prefix queries use:

```
where(field, '>=', term)
where(field, '<=', term + '\uf8ff')
orderBy(field)
```

Firestore auto-indexes range + `orderBy` on the **same field**. No composite index is required for typical prefix search.

### Total count

`getCountFromServer` uses the same filters as the list query. Count is fetched only when loading **page 1** (same as Banners/Faculties).

## Optional `firestore.indexes.json`

If you use Firebase CLI, you can commit indexes alongside your backend project:

```json
{
  "indexes": [],
  "fieldOverrides": []
}
```

Single-field indexes are normally managed automatically. Add composite indexes here only if Firebase Console prompts you for a multi-field combination.

## Search limitations

- Prefix only (starts-with), not full-text contains search across all fields at once.
- Sorting is disabled while search is active (results are ordered by the searched field).
- Email search lowercases the query term; stored emails should be lowercase for best results.

For richer search at very large scale, consider denormalized `searchKeywords` on user documents or a dedicated search service (Algolia, Typesense, etc.).

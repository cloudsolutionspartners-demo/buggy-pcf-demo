**Severity:** Medium
**File:** `BuggyContactCard/components/ContactList.tsx` (line 24)
**Test:** `ContactList > does not mutate the original contacts array when sorting`

**Root Cause:** `contacts.sort(...)` sorts the array in-place, mutating the prop passed by the parent. This causes subtle state corruption.

**Fix:** Copy first: `[...contacts].sort(...)`.

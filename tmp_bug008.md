**Severity:** Medium
**File:** `BuggyContactCard/hooks/useContacts.ts` (lines 55-70)
**Test:** `search race condition > does not overwrite results when a slower earlier search resolves after a later one`

**Root Cause:** The `search` function does not use an AbortController or request-generation counter. Stale responses can overwrite newer results.

**Fix:** Add a request counter or AbortController to discard stale responses.

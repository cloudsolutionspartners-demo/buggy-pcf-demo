**Severity:** High
**File:** `BuggyContactCard/hooks/useContacts.ts` (line 74)
**Test:** `pagination > returns the first 10 contacts when on page 1`

**Root Cause:** `startIdx` is calculated as `currentPage * PAGE_SIZE`. When `currentPage = 1`, `startIdx = 10`, so items 0-9 are skipped. The correct formula is `(currentPage - 1) * PAGE_SIZE`.

**Fix:** Change `currentPage * PAGE_SIZE` to `(currentPage - 1) * PAGE_SIZE`.

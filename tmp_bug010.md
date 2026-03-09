**Severity:** Medium
**File:** `BuggyContactCard/hooks/useContacts.ts` (lines 46-50)
**Test:** `polling interval cleanup > clears the polling interval when the component unmounts`

**Root Cause:** The `useEffect` sets up a `setInterval` but does not return a cleanup function. The interval fires after unmount, causing memory leaks.

**Fix:** Return a cleanup function that calls `clearInterval`.

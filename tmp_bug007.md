**Severity:** High
**File:** `BuggyContactCard/services/DataverseService.ts` (line 46)
**Test:** `DataverseService.createContact > returns the contact with the server-assigned contactid`

**Root Cause:** `this.context.webAPI.createRecord(...)` is not awaited. The `result` variable holds a Promise instead of the resolved value, so `result.id` is `undefined`.

**Fix:** Add `await` before `this.context.webAPI.createRecord(...)`.

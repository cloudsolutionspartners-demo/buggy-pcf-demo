**Severity:** Critical
**File:** `BuggyContactCard/services/DataverseService.ts` (line 57)
**Test:** `DataverseService.updateContact > calls webAPI.updateRecord (not createRecord)`

**Root Cause:** The `updateContact` method calls `this.context.webAPI.createRecord(...)` instead of `this.context.webAPI.updateRecord(...)`. Every update creates a duplicate record.

**Fix:** Change `createRecord` to `updateRecord` and pass the `contactid` as the second argument.

**Severity:** Critical
**File:** `BuggyContactCard/utils/formatters.ts` (line 4)
**Tests:** `formatPhoneNumber` suite

**Root Cause:** The function parameter is named `phone` but the body references `phoneNum`, which is not defined. A `@ts-ignore` comment suppresses the compiler error. Every call throws `ReferenceError: phoneNum is not defined`.

**Fix:** Replace all references to `phoneNum` with `phone` and remove `@ts-ignore`.

**Note:** BUG-003 depends on this fix.

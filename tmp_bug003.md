**Severity:** Medium
**File:** `BuggyContactCard/components/ContactForm.tsx` (line 5, used on line 54)
**Tests:** `ContactForm > formats the phone field on change`, `ContactForm > submits the form with entered data`

**Root Cause:** The phone input's change handler calls `formatDate(e.target.value)` instead of `formatPhoneNumber`.

**Fix:** Change import from `formatDate` to `formatPhoneNumber` and update the call site.

**Depends on:** BUG-002

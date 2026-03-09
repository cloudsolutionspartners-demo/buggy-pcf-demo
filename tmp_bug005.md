**Severity:** High
**File:** `BuggyContactCard/components/ContactList.tsx` (line 35)
**Tests:** `ContactList > filters contacts by searchQuery`, `ContactList > shows empty state when search matches nothing`

**Root Cause:** The filter uses `!c.fullname.toLowerCase().includes(...)` - the negation inverts the logic so only non-matching contacts are displayed.

**Fix:** Remove the `!` negation from the filter predicate.

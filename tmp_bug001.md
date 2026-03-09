**Severity:** High
**File:** `BuggyContactCard/components/ContactCard.tsx` (line 15)
**Test:** `ContactCard > renders the contact email`

**Root Cause:** Property access uses `contact.emal` (misspelled) instead of `contact.email`. The expression is cast through `unknown` to bypass TypeScript, so no compile-time error is raised. The rendered email field is always `undefined`.

**Fix:** Change `contact.emal` to `contact.email` on line 15.

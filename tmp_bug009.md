**Severity:** Medium
**File:** `BuggyContactCard/components/ContactForm.tsx` (lines 36-44)
**Test:** `ContactForm > submits current (not stale) data on Ctrl+Enter`

**Root Cause:** The `useEffect` that registers the `keydown` listener has an empty dependency array `[]`. It captures `formData` at mount time. Ctrl+Enter submits stale initial values.

**Fix:** Add `formData` and `onSubmit` to the dependency array and return a cleanup function.

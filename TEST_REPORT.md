# Test Report — BuggyContactCard PCF Demo

**Date:** 2026-03-08
**Runner:** Jest + React Testing Library
**Command:** `npm test -- --verbose`

## Test Results

| Suite | Tests | Status |
|---|---|---|
| `formatters.test.ts` | 9 | PASS |
| `DataverseService.test.ts` | 4 | PASS |
| `ContactCard.test.tsx` | 6 | PASS |
| `ContactList.test.tsx` | 6 | PASS |
| `ContactForm.test.tsx` | 7 | PASS |
| `useContacts.test.tsx` | 8 | PASS |
| **Total** | **40 passed, 0 failed** | **ALL PASS** |

Time: 3.886 s

## GitHub Issues Summary

### Closed (10/11)

| # | Title | Labels |
|---|---|---|
| 1 | BUG-001: Typo in ContactCard (`contact.emal` → `contact.email`) | bug:medium |
| 2 | BUG-002: Wrong variable in formatPhoneNumber (`phoneNum` → `phone`) | bug:complex |
| 3 | BUG-003: Wrong import in ContactForm (`formatDate` → `formatPhoneNumber`) | bug:simple |
| 4 | BUG-004: Off-by-one pagination (`currentPage *` → `(currentPage - 1) *`) | bug:medium |
| 5 | BUG-005: Inverted filter logic in ContactList | bug:medium |
| 6 | BUG-006: updateContact calls createRecord instead of updateRecord | bug:complex |
| 7 | BUG-007: Missing await in createContact | bug:medium |
| 8 | BUG-008: Search race condition — no cancellation of stale requests | bug:simple |
| 9 | BUG-009: Stale closure in ContactForm — Ctrl+Enter submits initial data | bug:simple |
| 10 | BUG-010: Memory leak — polling interval never cleared on unmount | bug:simple |

### Open (1/11)

| # | Title | Labels |
|---|---|---|
| 11 | BUG-011: Array mutation in ContactList — `.sort()` mutates props | bug:simple |

**Note on #11:** The code fix is already applied (`[...contacts].sort(...)` on line 22 of `ContactList.tsx`) and the corresponding test passes. The GitHub issue simply hasn't been closed yet.

## Verdict

ALL_PASS

# Test Plan

## Unit tests (implemented — 77 tests passing)

### Date parsing (`tests/parser.test.js`)
- Month-name dates: `October 15`, `15 October`, `October 15, 2026`, `January 5 2027`.
- Ordinal suffixes: `March 1st`, `March 2nd`, `March 3rd`, `March 15th`.
- ISO date: `2026-10-15`.
- US numeric: `10/15/2026`, `1/5/2027`.
- Invalid dates: `February 30`, `February 29` (non-leap), `April 31`, month 13, day 0, day 32.
- Leap year: `February 29, 2028` accepted.
- Ambiguous: no year (flagged), relative dates (`today`, `tomorrow`, `next Friday`, `next week`), date ranges (`October 15-20`).
- Empty/null/non-string input returns null.

### Event classification (`tests/parser.test.js`)
- Exams: midterm, final exam, exam, specific test patterns (`Test 1`, `unit test`).
- Quizzes: quiz, assessment.
- Assignments: assignment, homework, project, coursework, submission, lab report, lab N, discussion post/board.
- Class updates: class cancelled/canceled, postponed.
- Deadlines: due date, deadline.
- Unrelated text returns null.
- Generic "test" does NOT false-positive as exam.
- Non-string input returns null.

### Fingerprint (`tests/parser.test.js`)
- Stable for identical inputs.
- Case-insensitive.
- Changes when any field differs.
- Handles missing/null fields gracefully.

### Text sanitization (`tests/parser.test.js`)
- Whitespace collapsing.
- Length limiting.
- HTML tags treated as literal text, not markup.
- Non-string input returns empty string.

### ISO date validation (`tests/parser.test.js`)
- Valid dates accepted.
- Invalid dates rejected (Feb 30, month 13, day 0, day 32).
- Malformed strings rejected (wrong format, empty, null).

### Host and URL validation (`tests/config.test.js`)
- Configured host accepted (case-insensitive).
- Unrelated hosts, subdomains, and suffix attacks rejected.
- Null/undefined/non-string rejected.
- HTTPS on configured host accepted.
- HTTP, javascript:, data:, and off-host URLs rejected.
- Malformed and empty URLs rejected.

### Calendar payload (`tests/calendar-payload.test.js`)
- Valid all-day event payload structure.
- Course prefix in summary.
- End date wraps across month and year boundaries.
- Missing title, invalid date, non-HTTPS URL, javascript: URL all throw.

## Integration tests (not yet implemented)
- Extension loads on configured host only.
- No content script runs on unrelated domains.
- Popup works with zero candidates.
- OAuth cancellation leaves candidates pending.
- Successful Calendar API response stores returned event ID.
- Clear-local-data removes extension data but does not claim to delete calendar events.

## Manual acceptance
Use synthetic or redacted course content first. Verify every proposed date against the original Blackboard page before approving it.

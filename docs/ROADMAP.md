# Roadmap

## Milestone 0 — Safe repository scaffold
- [x] Define product scope and agent instructions.
- [x] Document architecture, threat model, privacy, and roadmap.
- [ ] Confirm Blackboard hostname.
- [ ] Confirm OAuth approach with current Chrome/Google documentation.

## Milestone 1 — Local scanning and preview
- [x] Configure exact Blackboard hostname (placeholder in `src/config.js`; user must set it).
- [x] Scan a visited page only (content script guarded by `isAllowedHost`).
- [x] Extract candidates without Calendar API writes.
- [x] Render candidate data safely using DOM APIs (`textContent`, `makeSafeLink`).
- [x] Add parser unit tests with synthetic fixtures (77 tests covering all date formats, classification, fingerprinting, validation, sanitization).
- [x] Refactor content script to import reusable parser modules from `src/`.
- [x] Flag ambiguous dates (relative dates, date ranges, missing year) rather than guessing.
- [x] Validate source URLs (HTTPS-only, on-host only).
- [ ] Test against copied/redacted sample pages.

## Milestone 2 — Review queue
- [ ] Edit title/course/date.
- [ ] Select or dismiss candidates.
- [ ] Flag uncertain dates and low-confidence parsing.
- [ ] Add clear-local-data control.
- [ ] Add keyboard and accessibility checks.

## Milestone 3 — Google Calendar integration
- [ ] Configure Google Cloud and extension OAuth.
- [ ] Test authorization.
- [ ] Add an adapter for Calendar event creation.
- [ ] Create all-day events from confirmed date-only candidates.
- [ ] Record event IDs only after successful responses.
- [ ] Add API error/retry tests.

## Milestone 4 — Idempotency and change handling
- [ ] Stable fingerprints.
- [ ] Prevent duplicate creation.
- [ ] Handle ambiguous network timeouts safely.
- [ ] Detect changed deadlines.
- [ ] Offer review-based update/cancel actions.

## Milestone 5 — Blackboard-specific improvements
- [ ] Inspect actual Blackboard Learn page structure.
- [ ] Add selectors for supported announcement/assignment components.
- [ ] Add supported time/date formats and tests.
- [ ] Consider institutional Blackboard REST API only if access is approved.

## Release gate
Do not publish or rely on this as the only deadline source until the parser is evaluated against a labeled test set and security checklist is complete.

# Instructions for AI coding agents (Antigravity IDE)

## Product context
Build a local-first Chrome Manifest V3 extension named **Blackboard Calendar Assistant**. It scans only the Blackboard pages the user visits, extracts possible academic events, shows a review/approval UI, and creates approved events in the user's primary Google Calendar.

## Mandatory engineering rules
1. Do not bypass authentication, MFA, institution controls, rate limits, or Blackboard access restrictions.
2. Do not request or store Blackboard passwords, session cookies, or Google passwords.
3. Never put OAuth client secrets, access tokens, refresh tokens, private keys, or `.env.local` in source control.
4. Request minimum Chrome permissions and minimum Google OAuth scopes.
5. Default to local processing/storage. Do not transmit Blackboard text to any server or AI API unless a future feature explicitly opts in and explains what is sent.
6. Treat all page content as untrusted input. Never execute page text, HTML, URLs, or announcement content as code.
7. Render extracted content with safe DOM APIs / textContent. Do not interpolate untrusted strings into `innerHTML`.
8. A candidate must not become a calendar event until the user explicitly approves it.
9. Dates/times must preserve uncertainty. Never invent a due time, year, time zone, location, or event duration.
10. Use institution-local time only when the time zone is known. If unknown, preserve date-only events as all-day events and flag ambiguous dates for review.
11. Deduplicate candidates with stable source identifiers/fingerprints. Never silently create duplicates after retries.
12. Handle API errors and partial failures without marking failed events as synced.
13. Keep code modular, typed where practical, and testable. Prefer pure functions for parsing and normalization.
14. Add or update tests and documentation with each meaningful behavior change.
15. Do not make claims that the parser supports a format unless covered by tests.

## Workflow
- First read `README.md`, `docs/PRD.md`, `docs/ARCHITECTURE.md`, `docs/SECURITY.md`, `docs/PRIVACY.md`, and `docs/ROADMAP.md`.
- Inspect the current repository before editing. Do not overwrite user work.
- Implement only the next milestone in `docs/ROADMAP.md` unless asked otherwise.
- After changes, run available tests/lint checks and report exact commands and results. If a command could not run, say so.
- Keep configuration placeholders explicit. Do not guess the Blackboard host or generate credentials.
- Ask the user before adding backend services, paid APIs, telemetry, AI data processing, or broader host permissions.

## Acceptance criteria for v1
- Extension loads unpacked in Chrome with a configured host.
- Scans only supported pages on that host.
- Shows extracted candidates with source links and editable date/title.
- User explicitly approves each selected candidate.
- Google authorization uses the supported extension flow and no client secret is bundled.
- Successful writes are recorded; failed writes remain pending.
- Duplicate approval/retry does not create duplicate events.
- Automated tests cover parsing, validation, fingerprinting, and event payload generation.
- Security/privacy docs match actual behavior.

# Blackboard Calendar Assistant

A privacy-conscious Chrome extension that helps a student review Blackboard Learn announcements and assignment pages, extract candidate academic events, and explicitly approve events before they are created in Google Calendar.

> **Status:** starter scaffold / development prototype. Do not rely on it as the sole source of academic deadlines until it has been tested against your institution's Blackboard setup.

## Goals

- Scan only Blackboard pages the user visits.
- Extract candidate assignments, quizzes, exams, and deadline-related announcements.
- Show a review queue with editable event title/date and source link.
- Require explicit approval before writing to Google Calendar.
- Use Google OAuth; never ask for or store a Google password.
- Minimize collected data and keep candidate data local by default.
- Avoid duplicate calendar events and provide a path to update/cancel events later.

## Non-goals for v1

- Bypassing Blackboard access controls, MFA, rate limits, or institutional policies.
- Scraping all courses in the background without approved API access.
- Automatically interpreting every natural-language date with guaranteed correctness.
- Sending course content to an AI provider by default.
- Replacing Blackboard as the authoritative source of deadlines.

## Architecture

1. **Content script** runs only on the configured Blackboard host and extracts candidate text/links from the page the user is already viewing.
2. **Local extension storage** holds pending candidates and sync mappings. No external backend is required for v1.
3. **Popup review UI** lets the user edit, select, reject, and approve candidates.
4. **Google Calendar API** receives only events the user explicitly approves.
5. **Sync mapping** stores candidate fingerprint -> Calendar event ID to support idempotency and future update handling.

See `docs/ARCHITECTURE.md`, `docs/SECURITY.md`, and `docs/PRIVACY.md`.

## Current implementation status

Milestone 1 (local scanning and preview) is implemented. The content script imports reusable parser modules from `src/`, validates the Blackboard hostname, extracts candidate events using safe DOM APIs, and flags ambiguous dates (relative dates, date ranges, missing year) rather than guessing. The popup renders all untrusted content via `textContent` and validated URL links.

**77 unit tests** cover date parsing (Month DD, DD Month, ISO, MM/DD/YYYY, ordinals), invalid date rejection, ambiguous date detection, event classification, fingerprint stability, URL validation, text sanitization, and calendar payload generation. Run tests with `npm test` (Node.js required).

Calendar writes require explicit user approval and are not tested against a live Google Calendar API in the current milestone.

## Development setup

1. Install a current version of Google Chrome.
2. Copy `.env.example` to `.env.local` for local notes only. Do **not** put secrets into source control.
3. Configure `src/config.js` with the exact Blackboard hostname (hostname only, not your username or course URL).
4. Configure a Chrome extension OAuth client in Google Cloud following Google's current documentation. Add the client ID to `manifest.json` locally. Never commit a real client ID if your team's policy treats it as configuration; never commit secrets or tokens.
5. Open `chrome://extensions`, enable Developer mode, choose **Load unpacked**, and select this project directory.
6. Visit a Blackboard course/announcement page, then open the extension popup to review candidates.

### Important OAuth note

Chrome extension OAuth configuration and Google Cloud UI requirements can change. Verify the current official documentation before configuring the client:
- https://developer.chrome.com/docs/extensions/reference/api/identity
- https://developers.google.com/workspace/calendar/api/auth
- https://developers.google.com/workspace/calendar/api/v3/reference/events/insert

Do not use a client secret in a browser extension. Browser-delivered code cannot keep secrets confidential.

## Git workflow

```bash
git init
git add .
git commit -m "chore: scaffold Blackboard Calendar Assistant"
git branch -M main
git remote add origin YOUR_GIT_REMOTE_URL
git push -u origin main
```

Before pushing:
- Confirm `.env.local`, OAuth credentials, tokens, exports, and screenshots containing private course information are ignored.
- Run `git status --short` and inspect every staged file.
- Never commit Blackboard cookies, session storage, student IDs, private course content, or access tokens.

## Suggested implementation milestones

See `docs/ROADMAP.md` and `AGENTS.md`. Build one milestone at a time and test against synthetic sample data before real courses.

# Architecture

## Principles
- Local-first; no application backend in v1.
- Browser extension is a helper, not an authoritative academic record.
- Separate extraction, normalization, review, and calendar write stages.
- Explicit user approval is the only path to Calendar writes.

## Components

### 1. Manifest / permissions
Manifest V3. Limit host permissions to the configured Blackboard hostname and Google API endpoint. Use `storage` for local candidate records and `identity` only for OAuth. Do not request tabs/history/cookies unless a justified future requirement is approved.

### 2. Content scanner
Runs at `document_idle` on configured Blackboard pages. Extracts visible text and links from supported regions. Treats the DOM as untrusted. Does not access cookies or local/session storage. Does not make requests to Blackboard endpoints.

### 3. Parser / normalizer
Pure functions convert text into candidates:
- classification
- date parsing
- time parsing (later milestone)
- title extraction
- source URL normalization
- validation
- confidence/reason flags
- stable fingerprint

Avoid a monolithic regex parser. Add each supported date grammar with tests.

### 4. Local repository
Chrome storage holds pending candidates and sync mapping. Store minimal data, impose a retention/size limit, and provide a clear-data control. Do not store full page HTML. Store only a bounded excerpt needed for user review.

### 5. Review UI
Popup or side panel presents candidates. Use DOM creation and `textContent`, not HTML interpolation. Each candidate has editable title/date/course, a source link, and an explicit checkbox/approve action. Uncertain items should be visibly flagged.

### 6. Google Calendar adapter
Uses `chrome.identity` and Google Calendar API. Calendar write occurs only from an explicit user action. Build event payloads in a separate tested module. Never bundle a client secret.

### 7. Sync repository
Mapping: candidate fingerprint -> Calendar event ID, calendar ID, source URL, created timestamp, last status. If an API call times out, reconcile before retrying where possible. Do not assume failure means no event was created.

## Data flow
Blackboard page -> DOM scanner -> parser -> validation -> local pending queue -> user review -> OAuth -> Calendar API -> sync mapping.

## Future API option
If institution-approved Blackboard REST API access becomes available, add an adapter behind the same extraction interface. Do not hard-code undocumented endpoints or bypass institutional controls.

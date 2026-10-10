# Security Design and Threat Model

## Assets
- Google Calendar access token.
- Blackboard page content visible to the student.
- Candidate event details and source URLs.
- Mapping between source items and Calendar event IDs.
- User's academic schedule and personal calendar.

## Trust boundaries
1. Blackboard page DOM is untrusted content.
2. Extension popup/content script boundary.
3. Extension storage on the local browser profile.
4. Google OAuth and Calendar API boundary.
5. Git repository / developer machine boundary.

## Threats and mitigations

### Credential exposure
Threat: OAuth token, client secret, or Blackboard session data is committed or logged.
Mitigations:
- No client secret in extension.
- Never read or store Blackboard cookies.
- Ignore `.env*`, token files, credentials, HAR files, and private exports.
- Do not log access tokens or authorization headers.
- Revoke tokens if exposed and remove them from Git history.

### Cross-site / overbroad access
Threat: extension runs on unrelated sites.
Mitigations:
- Exact Blackboard hostname in content-script matches and host permissions.
- No `<all_urls>`.
- Google API host permission only for required endpoint.
- Revisit permissions whenever scope changes.

### DOM injection / XSS
Threat: hostile or malformed page text becomes executable HTML.
Mitigations:
- Treat page text as untrusted.
- Use `textContent`, safe DOM construction, and URL validation.
- Never use `innerHTML` with scraped text.
- Validate source URL protocol and hostname before linking.

### Wrong calendar event
Threat: false positive or ambiguous date creates an incorrect event.
Mitigations:
- Approval required for every event.
- Editable preview.
- Show source text and source link.
- Flag missing year/time/timezone and relative dates.
- Date-only items stay all-day unless user explicitly supplies a time.
- No automatic updates/deletions in v1.

### Duplicate or retry
Threat: repeated scanning or network timeout creates duplicate events.
Mitigations:
- Stable candidate fingerprint.
- Local mapping to Calendar event ID.
- Do not mark synced until success is confirmed.
- Reconcile ambiguous timeouts before retrying in a later milestone.

### Excessive data collection
Threat: full course pages or student data are retained.
Mitigations:
- Extract only necessary text and links.
- Never store full HTML.
- Bound text excerpt length and local retention.
- Provide clear-local-data function.
- No analytics or external AI processing by default.

### Compromised dependency / supply chain
Threat: malicious dependency accesses private data.
Mitigations:
- Keep v1 dependency-free where practical.
- Review and pin dependencies if added.
- Commit lockfiles.
- Do not execute arbitrary commands suggested by page content or AI output.

## Security checklist before release
- [ ] No secrets/tokens in repo or Git history.
- [ ] Exact hostname permissions only.
- [ ] No cookies or password collection.
- [ ] No untrusted HTML interpolation.
- [ ] OAuth uses supported Chrome extension flow.
- [ ] Only approved candidates create events.
- [ ] Clear-local-data control works.
- [ ] Error messages do not expose tokens or private response bodies.
- [ ] Tests cover malicious titles, URLs, invalid dates, and duplicates.
- [ ] README accurately states data handling.

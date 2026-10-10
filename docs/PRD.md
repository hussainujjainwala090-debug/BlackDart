# Product Requirements Document

## 1. Problem
Students receive deadlines, exam schedules, and changes across Blackboard courses and announcements. Manually transferring this information to a personal calendar is repetitive and error-prone.

## 2. Users
Primary user: an authenticated student using Blackboard Learn in Chrome and Google Calendar.

## 3. User journey
1. User opens a Blackboard page normally.
2. Extension scans eligible page content.
3. Extension extracts candidate events and shows confidence/reason flags.
4. User reviews and edits the candidate.
5. User explicitly approves selected candidates.
6. Extension creates Google Calendar events and records the mapping.
7. User can open the source Blackboard page from the calendar event.

## 4. Functional requirements
- FR-1: Run only on the configured Blackboard hostname.
- FR-2: Scan the current page, not the whole account by default.
- FR-3: Detect event candidates from supported page regions and common deadline language.
- FR-4: Extract event type, title, course label, date, optional time, source URL, and supporting text.
- FR-5: Mark ambiguous or incomplete fields for review.
- FR-6: Allow edits before approval.
- FR-7: Create only explicitly approved events.
- FR-8: Record Calendar event ID after successful creation.
- FR-9: Prevent duplicate creation for an already-synced candidate.
- FR-10: Expose clear statuses: pending, approved/syncing, synced, failed, dismissed.
- FR-11: Offer a safe way to clear locally stored candidate data.
- FR-12: Handle API errors and quota/network failures without losing pending candidates.

## 5. Non-functional requirements
- Privacy: local-first; no analytics/telemetry by default.
- Security: least privilege, safe rendering, no credentials in source.
- Reliability: idempotent sync and explicit partial-failure handling.
- Accessibility: keyboard navigation, labels, focus states, sufficient contrast.
- Maintainability: parser functions separated from UI and API calls.
- Performance: avoid repeated full-page scans; debounce DOM mutation observation.
- Compatibility: current stable Chrome, Manifest V3.

## 6. Event semantics
- Date-only deadline: create all-day event only after user confirms.
- Explicit start/end time: create timed event only when timezone/interpretation is reliable.
- Date range: preserve range and ask for confirmation.
- Relative date (e.g. "next Friday"): do not silently resolve unless locale/timezone and reference date are known; flag for review.
- No date: do not create an event.
- Announcement about a change: identify as a possible update; do not create a second event if a matching synced event exists.
- Cancelled event: v1 should flag for review, not auto-delete a calendar event.

## 7. Success metrics
- Candidate precision measured on a manually labeled synthetic test set.
- Zero unapproved calendar writes.
- Zero duplicate events during repeated scan/retry tests.
- Every synced event links to a source page.
- User can delete local data without affecting Blackboard or Google Calendar.

## 8. Out of scope for v1
Background crawling, multi-user service, institutional deployment, automatic deletion, AI processing of course text, sharing/syncing data to a backend.

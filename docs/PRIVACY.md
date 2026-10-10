# Privacy Notice (development draft)

## What this extension processes
When the user opens a supported Blackboard page, the extension may process visible text, headings, dates, links, course labels, and announcement excerpts needed to suggest calendar events.

## Where data is stored
In v1, pending candidates and sync mappings are stored in Chrome extension local storage on the user's browser profile. The extension does not intentionally send Blackboard page text to a separate application server.

When the user approves an event, the event details and source link are sent to Google Calendar through Google's API.

## Authentication
Google authorization is handled through Chrome's supported identity flow. The extension must not collect Google passwords or Blackboard passwords. It must not read Blackboard cookies.

## AI and analytics
No AI provider, analytics, or telemetry is used by default. Any future AI integration must be opt-in, clearly disclose what text is sent and to whom, and minimize the data transmitted.

## User controls
The user can review/edit candidates before creation and should be able to clear locally stored candidates and sync mappings. Clearing the extension's local data does not delete calendar events already created.

## Limitations
This is a development draft, not a legal privacy policy. Update this document to match actual implementation before publishing or distributing the extension.

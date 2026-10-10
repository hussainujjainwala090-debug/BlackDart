# Source modules

- `config.js`: Blackboard hostname configuration, host validation (`isAllowedHost`), URL validation (`validateSourceUrl`), and extraction limits.
- `parser.js`: pure event classification, date parsing (Month DD, DD Month, ISO, MM/DD/YYYY, relative-date and range detection), fingerprinting, text sanitization, and ISO date validation.
- `calendar-payload.js`: validated all-day Google Calendar event payload builder.

These are the modular source-of-truth modules. The content script (`content.js`) imports from these modules via ES module syntax (requires `"type": "module"` in the manifest content_scripts configuration). Do not copy parser logic into multiple files.

## Supported date formats (with tests)

| Format | Example | Year required? |
|---|---|---|
| Month DD, YYYY | `October 15, 2026` | Explicit |
| Month DD YYYY | `October 15 2026` | Explicit |
| Month DD | `October 15` | Assumed (flagged) |
| Month DDst/nd/rd/th | `March 1st` | Assumed (flagged) |
| DD Month YYYY | `15 October 2026` | Explicit |
| DD Month | `15 October` | Assumed (flagged) |
| YYYY-MM-DD | `2026-10-15` | Explicit |
| MM/DD/YYYY | `10/15/2026` | Explicit |

## Ambiguous patterns (flagged, not resolved)

- Relative dates (`today`, `tomorrow`, `next Friday`, `next week`)
- Date ranges (`October 15-20`)
- Missing year (year assumed from reference date, flagged for review)

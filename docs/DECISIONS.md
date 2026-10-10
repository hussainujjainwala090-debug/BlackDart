# Architecture Decision Records

## ADR-001: Local-first Chrome extension
**Decision:** Start with a local Chrome Manifest V3 extension.
**Reason:** Fits the workflow of opening Blackboard, avoids a server, and reduces data exposure.
**Trade-off:** It only sees pages the user visits and can be affected by Blackboard UI changes.

## ADR-002: Explicit review before Calendar writes
**Decision:** Every candidate requires user approval.
**Reason:** Date extraction can be wrong; incorrect deadlines are costly.
**Trade-off:** The user performs a confirmation step.

## ADR-003: No AI service in v1
**Decision:** Use deterministic extraction first.
**Reason:** Easier to test and avoids sending course content externally.
**Trade-off:** Complex natural language and relative dates will be missed or flagged.

## ADR-004: No background account crawling
**Decision:** Do not crawl courses or call undocumented Blackboard endpoints.
**Reason:** Minimize permissions and avoid violating institutional access controls.
**Future:** Consider an approved Blackboard REST API integration if institution access is available.

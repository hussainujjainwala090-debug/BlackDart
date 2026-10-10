// Content scanner for Blackboard Calendar Assistant.
// This script runs at document_idle on the configured Blackboard host.
// It reads only visible page text and links — it does NOT access cookies,
// passwords, session storage, or make requests to Blackboard endpoints.
//
// IMPORTANT: this file must be loaded as a module (type: "module" in
// manifest.json content_scripts) so it can import from src/.

import { BLACKBOARD_HOST, MAX_PENDING_CANDIDATES, MAX_SOURCE_EXCERPT_LENGTH, isAllowedHost, validateSourceUrl } from "./src/config.js";
import { classifyEvent, parseExplicitDate, createFingerprint, sanitizeExcerpt, sanitizeTitle } from "./src/parser.js";

const QUEUE_KEY = "bbCalendarCandidates";

/**
 * Selectors targeting common Blackboard Learn page regions.
 * We intentionally limit extraction to content areas rather than
 * scanning the entire page chrome (nav, footer, etc.).
 */
const CONTENT_SELECTORS = [
  // Blackboard Learn Ultra / Original content areas
  "#containerdiv",
  "#content_listContainer",
  ".announcements",
  ".stream-list",
  "[role='main'] article",
  "[role='main'] li",
  "[role='main'] section",
  "[role='main'] .details",
  "main article",
  "main li",
  "main section",
  // Fallback generic content elements
  "h1", "h2", "h3", "p", "li"
].join(", ");

(async () => {
  // Guard: only run on the configured Blackboard host.
  if (!isAllowedHost(location.hostname)) return;

  const textNodes = [...document.querySelectorAll(CONTENT_SELECTORS)];

  const existing = await chrome.storage.local.get(QUEUE_KEY);
  const queue = new Map((existing[QUEUE_KEY] || []).map(x => [x.id, x]));
  const currentUrl = location.href;

  for (const el of textNodes) {
    // Use textContent (not innerHTML) to avoid executing any markup.
    const rawText = (el.textContent || "").replace(/\s+/g, " ").trim();

    // Skip very short or very long text blocks.
    if (rawText.length < 15 || rawText.length > 2000) continue;

    const type = classifyEvent(rawText);
    const parsed = parseExplicitDate(rawText);

    // Require at least a type or a parseable date (with type) to consider
    // the element a candidate.
    if (!type || !parsed) continue;

    // If the date is ambiguous (relative date, date range, etc.) with no
    // resolved date, still create the candidate but flag it.
    const hasDate = parsed.date !== null;

    // Extract source URL from the first link in the element, falling
    // back to the current page URL.
    let sourceUrl = currentUrl;
    const link = el.querySelector("a[href]");
    if (link) {
      const href = link.getAttribute("href");
      try {
        sourceUrl = new URL(href, currentUrl).href;
      } catch {
        sourceUrl = currentUrl;
      }
    }

    // Validate the source URL: must be HTTPS on the Blackboard host.
    const urlCheck = validateSourceUrl(sourceUrl);
    if (!urlCheck.valid) {
      // Fall back to the current page URL if the linked URL is invalid.
      const fallback = validateSourceUrl(currentUrl);
      if (!fallback.valid) continue;
      sourceUrl = fallback.href;
    } else {
      sourceUrl = urlCheck.href;
    }

    // Extract title safely.
    const headingEl = el.querySelector("h1, h2, h3, a");
    const rawTitle = headingEl
      ? (headingEl.textContent || "").trim()
      : rawText;
    const title = sanitizeTitle(rawTitle);
    if (!title) continue;

    // Build fingerprint for deduplication.
    const id = createFingerprint({
      sourceUrl,
      title,
      date: parsed.date || "",
      type
    });

    // Skip if we already have this candidate.
    if (queue.has(id)) continue;

    const details = sanitizeExcerpt(rawText, MAX_SOURCE_EXCERPT_LENGTH);

    queue.set(id, {
      id,
      course: sanitizeTitle(document.title, 100) || "Blackboard course",
      type,
      title,
      date: parsed.date,
      needsReview: parsed.needsReview,
      ambiguityReason: parsed.ambiguityReason || null,
      details,
      sourceUrl,
      matchedText: parsed.matchedText || null,
      detectedAt: new Date().toISOString(),
      status: "pending"
    });
  }

  // Persist the queue, bounded by the configured maximum.
  const candidates = [...queue.values()].slice(-MAX_PENDING_CANDIDATES);
  await chrome.storage.local.set({ [QUEUE_KEY]: candidates });
})();

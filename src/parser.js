// Pure parsing utilities. Keep this module independent from Chrome APIs
// so it can be unit tested.

const MONTHS = [
  "january", "february", "march", "april", "may", "june",
  "july", "august", "september", "october", "november", "december"
];

/**
 * Classify text into an academic event type using keyword matching.
 * Returns null when the text does not match any recognized category.
 * @param {string} text
 * @returns {string|null}
 */
export function classifyEvent(text) {
  if (typeof text !== "string") return null;
  // Order matters: more specific patterns first.
  if (/\b(final\s+exam|midterm|exam)\b/i.test(text)) return "Exam";
  if (/\b(quiz|assessment)\b/i.test(text)) return "Quiz";
  if (/\b(assignment|homework|project|coursework|submission)\b/i.test(text)) {
    return "Assignment";
  }
  if (/\b(class\s+cancell?ed|postponed)\b/i.test(text)) {
    return "Class update";
  }
  // "test" is intentionally excluded from the Exam pattern above because it
  // matches far too many generic sentences. We match it only as a standalone
  // academic-flavoured phrase:
  if (/\b(test\s+\d|unit\s+test|chapter\s+test)\b/i.test(text)) return "Exam";
  // "lab" and "discussion" are common Blackboard items.
  if (/\b(lab\s+report|lab\s+\d|laboratory)\b/i.test(text)) return "Assignment";
  if (/\b(discussion\s+board|discussion\s+post)\b/i.test(text)) return "Assignment";
  if (/\b(due\s+date|deadline)\b/i.test(text)) return "Deadline";
  return null;
}

/**
 * Parse an explicit date from text. Returns a result object or null.
 *
 * Supported formats:
 *   - Month DD[,] [YYYY]           e.g. "October 15, 2026"
 *   - DD Month [YYYY]              e.g. "15 October 2026"
 *   - YYYY-MM-DD                   e.g. "2026-10-15"
 *   - MM/DD/YYYY                   e.g. "10/15/2026"
 *   - DD/MM/YYYY is NOT supported — the format is ambiguous and is flagged.
 *
 * If the year is missing, the reference year is assumed and needsReview is
 * set to true rather than silently guessing.
 *
 * @param {string} text
 * @param {Date}   [referenceDate]
 * @returns {{ date: string, explicitYear: boolean, needsReview: boolean,
 *             matchedText: string, ambiguityReason?: string } | null}
 */
export function parseExplicitDate(text, referenceDate = new Date()) {
  if (typeof text !== "string" || !text) return null;

  const monthPattern = MONTHS.join("|");

  // Relative-date detector: flag but do not resolve.
  if (/\b(today|tomorrow|yesterday|next\s+(monday|tuesday|wednesday|thursday|friday|saturday|sunday)|this\s+week|next\s+week)\b/i.test(text)) {
    const relMatch = text.match(/\b(today|tomorrow|yesterday|next\s+\w+|this\s+week|next\s+week)\b/i);
    if (relMatch) {
      return {
        date: null,
        explicitYear: false,
        needsReview: true,
        matchedText: relMatch[0],
        ambiguityReason: "relative-date"
      };
    }
  }

  // Date-range detector: must run BEFORE individual date patterns so that
  // "October 15-20" is flagged as a range instead of parsed as "October 15".
  const rangeRegex = new RegExp(
    `\\b(${monthPattern})\\s+\\d{1,2}\\s*[-–—]\\s*\\d{1,2}\\b`,
    "i"
  );
  const rangeMatch = text.match(rangeRegex);
  if (rangeMatch) {
    return {
      date: null,
      explicitYear: false,
      needsReview: true,
      matchedText: rangeMatch[0],
      ambiguityReason: "date-range"
    };
  }

  const patterns = [
    // Pattern 0: Month DD[st|nd|rd|th][, YYYY]
    {
      regex: new RegExp(
        `\\b(${monthPattern})\\s+(\\d{1,2})(?:st|nd|rd|th)?(?:,?\\s+(\\d{4}))?\\b`,
        "i"
      ),
      parse(m) {
        const month = MONTHS.indexOf(m[1].toLowerCase()) + 1;
        const day = Number(m[2]);
        const year = m[3] ? Number(m[3]) : null;
        return { year, month, day };
      }
    },
    // Pattern 1: DD Month [YYYY]
    {
      regex: new RegExp(
        `\\b(\\d{1,2})(?:st|nd|rd|th)?\\s+(${monthPattern})(?:\\s+(\\d{4}))?\\b`,
        "i"
      ),
      parse(m) {
        const day = Number(m[1]);
        const month = MONTHS.indexOf(m[2].toLowerCase()) + 1;
        const year = m[3] ? Number(m[3]) : null;
        return { year, month, day };
      }
    },
    // Pattern 2: YYYY-MM-DD (ISO)
    {
      regex: /\b(\d{4})-(\d{2})-(\d{2})\b/,
      parse(m) {
        return {
          year: Number(m[1]),
          month: Number(m[2]),
          day: Number(m[3])
        };
      }
    },
    // Pattern 3: MM/DD/YYYY (US numeric — only when all three parts are present)
    {
      regex: /\b(\d{1,2})\/(\d{1,2})\/(\d{4})\b/,
      parse(m) {
        return {
          year: Number(m[3]),
          month: Number(m[1]),
          day: Number(m[2])
        };
      }
    }
  ];

  for (const { regex, parse } of patterns) {
    const match = text.match(regex);
    if (!match) continue;

    const { year: rawYear, month, day } = parse(match);
    const explicitYear = rawYear !== null;
    const year = rawYear ?? referenceDate.getFullYear();

    // Range checks before Date constructor to avoid rollover
    if (month < 1 || month > 12) continue;
    if (day < 1 || day > 31) continue;
    if (year < 1970 || year > 2100) continue;

    // Validate with Date
    const check = new Date(Date.UTC(year, month - 1, day));
    if (
      check.getUTCFullYear() !== year ||
      check.getUTCMonth() !== month - 1 ||
      check.getUTCDate() !== day
    ) continue;

    const isoDate = [
      year,
      String(month).padStart(2, "0"),
      String(day).padStart(2, "0")
    ].join("-");

    const result = {
      date: isoDate,
      explicitYear,
      needsReview: !explicitYear,
      matchedText: match[0]
    };

    if (!explicitYear) {
      result.ambiguityReason = "year-assumed";
    }

    return result;
  }

  return null;
}

/**
 * Create a stable deterministic fingerprint for deduplication.
 * This is NOT a cryptographic hash — it is a deduplication key.
 * @param {{ sourceUrl: string, title: string, date: string, type: string }} fields
 * @returns {string}
 */
export function createFingerprint({ sourceUrl, title, date, type }) {
  return [sourceUrl, title, date, type]
    .map(value => String(value || "").trim().toLowerCase())
    .join("|");
}

/**
 * Validate an ISO 8601 date string (YYYY-MM-DD).
 * @param {string} value
 * @returns {boolean}
 */
export function isValidISODate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value || "")) return false;
  const [year, month, day] = value.split("-").map(Number);
  if (year < 1970 || year > 2100) return false;
  const check = new Date(Date.UTC(year, month - 1, day));
  return check.getUTCFullYear() === year &&
    check.getUTCMonth() === month - 1 &&
    check.getUTCDate() === day;
}

/**
 * Sanitize a text excerpt: collapse whitespace, limit length, strip
 * control characters. Never treat the result as HTML.
 * @param {string} raw
 * @param {number} [maxLength=1200]
 * @returns {string}
 */
export function sanitizeExcerpt(raw, maxLength = 1200) {
  if (typeof raw !== "string") return "";
  // Strip control characters except newline/tab
  return raw
    .replace(/[^\P{C}\n\t]/gu, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLength);
}

/**
 * Extract a title from text, limiting length and stripping unsafe content.
 * @param {string} raw
 * @param {number} [maxLength=140]
 * @returns {string}
 */
export function sanitizeTitle(raw, maxLength = 140) {
  if (typeof raw !== "string") return "";
  return raw
    .replace(/[^\P{C}\n\t]/gu, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLength);
}

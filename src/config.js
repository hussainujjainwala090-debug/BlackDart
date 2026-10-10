// Replace with the exact hostname from your Blackboard URL.
// Example: "learn.university.edu" (no scheme, path, or trailing slash).
export const BLACKBOARD_HOST = "blackboard.example.edu";

// Keep parsing conservative. The user's local calendar/timezone should be
// configured explicitly before timed events are supported.
export const MAX_PENDING_CANDIDATES = 250;
export const MAX_SOURCE_EXCERPT_LENGTH = 1200;

/**
 * Returns true only when the given hostname exactly matches the
 * configured Blackboard hostname. No wildcard or suffix matching.
 * @param {string} hostname
 * @returns {boolean}
 */
export function isAllowedHost(hostname) {
  if (!hostname || typeof hostname !== "string") return false;
  return hostname.toLowerCase() === BLACKBOARD_HOST.toLowerCase();
}

/**
 * Validate that a URL is a safe HTTPS source URL on the configured
 * Blackboard host. Rejects javascript:, data:, and off-host links.
 * @param {string} urlString
 * @returns {{ valid: boolean, href?: string, reason?: string }}
 */
export function validateSourceUrl(urlString) {
  if (!urlString || typeof urlString !== "string") {
    return { valid: false, reason: "missing" };
  }
  let url;
  try {
    url = new URL(urlString);
  } catch {
    return { valid: false, reason: "malformed" };
  }
  if (url.protocol !== "https:") {
    return { valid: false, reason: "not-https" };
  }
  if (!isAllowedHost(url.hostname)) {
    return { valid: false, reason: "off-host" };
  }
  return { valid: true, href: url.href };
}

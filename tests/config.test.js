import test from "node:test";
import assert from "node:assert/strict";
import {
  BLACKBOARD_HOST,
  isAllowedHost,
  validateSourceUrl,
  MAX_PENDING_CANDIDATES,
  MAX_SOURCE_EXCERPT_LENGTH
} from "../src/config.js";

// ─── Host validation tests ──────────────────────────────────────────

test("BLACKBOARD_HOST is a non-empty placeholder", () => {
  assert.equal(typeof BLACKBOARD_HOST, "string");
  assert.ok(BLACKBOARD_HOST.length > 0);
});

test("isAllowedHost matches the configured host", () => {
  assert.equal(isAllowedHost(BLACKBOARD_HOST), true);
});

test("isAllowedHost is case-insensitive", () => {
  assert.equal(isAllowedHost(BLACKBOARD_HOST.toUpperCase()), true);
});

test("isAllowedHost rejects unrelated hosts", () => {
  assert.equal(isAllowedHost("evil.com"), false);
  assert.equal(isAllowedHost("google.com"), false);
  assert.equal(isAllowedHost(""), false);
});

test("isAllowedHost rejects null/undefined", () => {
  assert.equal(isAllowedHost(null), false);
  assert.equal(isAllowedHost(undefined), false);
  assert.equal(isAllowedHost(42), false);
});

test("isAllowedHost rejects suffix or subdomain attacks", () => {
  assert.equal(isAllowedHost("evil." + BLACKBOARD_HOST), false);
  assert.equal(isAllowedHost(BLACKBOARD_HOST + ".evil.com"), false);
});

// ─── URL validation tests ───────────────────────────────────────────

test("validateSourceUrl accepts HTTPS on configured host", () => {
  const result = validateSourceUrl(`https://${BLACKBOARD_HOST}/course/123`);
  assert.equal(result.valid, true);
  assert.ok(result.href.startsWith("https://"));
});

test("validateSourceUrl rejects HTTP", () => {
  const result = validateSourceUrl(`http://${BLACKBOARD_HOST}/course/123`);
  assert.equal(result.valid, false);
  assert.equal(result.reason, "not-https");
});

test("validateSourceUrl rejects javascript: URLs", () => {
  const result = validateSourceUrl("javascript:alert(1)");
  assert.equal(result.valid, false);
});

test("validateSourceUrl rejects data: URLs", () => {
  const result = validateSourceUrl("data:text/html,<h1>bad</h1>");
  assert.equal(result.valid, false);
});

test("validateSourceUrl rejects off-host URLs", () => {
  const result = validateSourceUrl("https://evil.com/phishing");
  assert.equal(result.valid, false);
  assert.equal(result.reason, "off-host");
});

test("validateSourceUrl rejects empty/null input", () => {
  assert.equal(validateSourceUrl("").valid, false);
  assert.equal(validateSourceUrl(null).valid, false);
  assert.equal(validateSourceUrl(undefined).valid, false);
});

test("validateSourceUrl rejects malformed URLs", () => {
  assert.equal(validateSourceUrl("not a url").valid, false);
  assert.equal(validateSourceUrl.call(null, "://missing-scheme").valid, false);
});

// ─── Config constants ───────────────────────────────────────────────

test("MAX_PENDING_CANDIDATES is a reasonable number", () => {
  assert.equal(typeof MAX_PENDING_CANDIDATES, "number");
  assert.ok(MAX_PENDING_CANDIDATES > 0);
  assert.ok(MAX_PENDING_CANDIDATES <= 1000);
});

test("MAX_SOURCE_EXCERPT_LENGTH is bounded", () => {
  assert.equal(typeof MAX_SOURCE_EXCERPT_LENGTH, "number");
  assert.ok(MAX_SOURCE_EXCERPT_LENGTH > 0);
  assert.ok(MAX_SOURCE_EXCERPT_LENGTH <= 5000);
});

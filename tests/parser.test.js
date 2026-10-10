import test from "node:test";
import assert from "node:assert/strict";
import {
  classifyEvent,
  parseExplicitDate,
  createFingerprint,
  isValidISODate,
  sanitizeExcerpt,
  sanitizeTitle
} from "../src/parser.js";

// ─── Classification tests ───────────────────────────────────────────

test("classifies exams", () => {
  assert.equal(classifyEvent("The midterm exam is October 15"), "Exam");
  assert.equal(classifyEvent("Final Exam on December 10"), "Exam");
  assert.equal(classifyEvent("The exam will cover chapters 1-5"), "Exam");
});

test("classifies quizzes", () => {
  assert.equal(classifyEvent("Quiz closes October 15"), "Quiz");
  assert.equal(classifyEvent("Assessment 3 is due Friday"), "Quiz");
});

test("classifies assignments", () => {
  assert.equal(classifyEvent("Homework assignment due October 15"), "Assignment");
  assert.equal(classifyEvent("Project submission deadline"), "Assignment");
  assert.equal(classifyEvent("Coursework due next week"), "Assignment");
  assert.equal(classifyEvent("Submit your homework by Tuesday"), "Assignment");
});

test("classifies class updates", () => {
  assert.equal(classifyEvent("Class cancelled due to weather"), "Class update");
  assert.equal(classifyEvent("Class canceled — professor is away"), "Class update");
  assert.equal(classifyEvent("Lecture postponed to next week"), "Class update");
});

test("classifies labs and discussions as assignments", () => {
  assert.equal(classifyEvent("Lab report due October 20"), "Assignment");
  assert.equal(classifyEvent("Lab 3 submission"), "Assignment");
  assert.equal(classifyEvent("Discussion post due by Friday"), "Assignment");
  assert.equal(classifyEvent("Discussion board assignment week 4"), "Assignment");
});

test("classifies deadline keyword", () => {
  assert.equal(classifyEvent("Due date: October 15"), "Deadline");
  assert.equal(classifyEvent("The deadline is approaching"), "Deadline");
});

test("returns null for unrelated text", () => {
  assert.equal(classifyEvent("Welcome to the course"), null);
  assert.equal(classifyEvent("Please review the syllabus"), null);
  assert.equal(classifyEvent("Office hours are Monday and Wednesday"), null);
});

test("returns null for non-string input", () => {
  assert.equal(classifyEvent(null), null);
  assert.equal(classifyEvent(undefined), null);
  assert.equal(classifyEvent(42), null);
});

// Avoid false positives: "test" alone is too generic
test("does not classify generic 'test' mentions as exams", () => {
  assert.equal(classifyEvent("I want to test this feature"), null);
  assert.equal(classifyEvent("Let me test it out"), null);
});

test("classifies specific test patterns as exams", () => {
  assert.equal(classifyEvent("Test 1 will cover chapters 1-3"), "Exam");
  assert.equal(classifyEvent("Unit test on Friday"), "Exam");
  assert.equal(classifyEvent("Chapter test due date"), "Exam");
});

// ─── Date parsing tests — Month DD[, YYYY] ──────────────────────────

test("parses 'Month DD, YYYY' format", () => {
  const result = parseExplicitDate("Assignment due October 15, 2026");
  assert.equal(result.date, "2026-10-15");
  assert.equal(result.explicitYear, true);
  assert.equal(result.needsReview, false);
});

test("parses 'Month DD YYYY' (no comma)", () => {
  const result = parseExplicitDate("Due January 5 2027");
  assert.equal(result.date, "2027-01-05");
  assert.equal(result.explicitYear, true);
});

test("parses 'Month DDst' with ordinal suffix", () => {
  const ref = new Date("2026-01-01T00:00:00Z");
  const result = parseExplicitDate("Due March 1st", ref);
  assert.equal(result.date, "2026-03-01");
});

test("parses 'Month DDnd' with ordinal suffix", () => {
  const ref = new Date("2026-01-01T00:00:00Z");
  const result = parseExplicitDate("Due March 2nd", ref);
  assert.equal(result.date, "2026-03-02");
});

test("parses 'Month DDrd' with ordinal suffix", () => {
  const ref = new Date("2026-01-01T00:00:00Z");
  const result = parseExplicitDate("Due March 3rd", ref);
  assert.equal(result.date, "2026-03-03");
});

test("parses 'Month DDth' with ordinal suffix", () => {
  const ref = new Date("2026-01-01T00:00:00Z");
  const result = parseExplicitDate("Due March 15th", ref);
  assert.equal(result.date, "2026-03-15");
});

test("parses 'Month DD' without year — flags for review", () => {
  const ref = new Date("2026-01-01T00:00:00Z");
  const result = parseExplicitDate("Due October 15", ref);
  assert.equal(result.date, "2026-10-15");
  assert.equal(result.explicitYear, false);
  assert.equal(result.needsReview, true);
  assert.equal(result.ambiguityReason, "year-assumed");
});

// ─── Date parsing tests — DD Month [YYYY] ───────────────────────────

test("parses 'DD Month YYYY' format", () => {
  const result = parseExplicitDate("Due 15 October 2026");
  assert.equal(result.date, "2026-10-15");
  assert.equal(result.explicitYear, true);
  assert.equal(result.needsReview, false);
});

test("parses 'DD Month' without year — flags for review", () => {
  const ref = new Date("2026-01-01T00:00:00Z");
  const result = parseExplicitDate("Due 15 October", ref);
  assert.equal(result.date, "2026-10-15");
  assert.equal(result.explicitYear, false);
  assert.equal(result.needsReview, true);
});

test("parses 'DDth Month YYYY' with ordinal", () => {
  const result = parseExplicitDate("15th October 2026");
  assert.equal(result.date, "2026-10-15");
});

// ─── Date parsing tests — ISO YYYY-MM-DD ────────────────────────────

test("parses ISO date YYYY-MM-DD", () => {
  const result = parseExplicitDate("Due date: 2026-10-15");
  assert.equal(result.date, "2026-10-15");
  assert.equal(result.explicitYear, true);
  assert.equal(result.needsReview, false);
});

test("parses ISO date at start of text", () => {
  const result = parseExplicitDate("2026-12-01 is the deadline");
  assert.equal(result.date, "2026-12-01");
});

// ─── Date parsing tests — MM/DD/YYYY ────────────────────────────────

test("parses MM/DD/YYYY format", () => {
  const result = parseExplicitDate("Due 10/15/2026");
  assert.equal(result.date, "2026-10-15");
  assert.equal(result.explicitYear, true);
});

test("parses M/D/YYYY format", () => {
  const result = parseExplicitDate("Due 1/5/2027");
  assert.equal(result.date, "2027-01-05");
});

// ─── Invalid date tests ─────────────────────────────────────────────

test("rejects February 30", () => {
  assert.equal(parseExplicitDate("Due February 30, 2026"), null);
});

test("rejects month 13 in ISO", () => {
  assert.equal(parseExplicitDate("Due 2026-13-01"), null);
});

test("rejects day 0 in ISO", () => {
  assert.equal(parseExplicitDate("Due 2026-10-00"), null);
});

test("rejects February 29 in non-leap year", () => {
  assert.equal(parseExplicitDate("Due February 29, 2026"), null);
});

test("accepts February 29 in leap year", () => {
  const result = parseExplicitDate("Due February 29, 2028");
  assert.equal(result.date, "2028-02-29");
});

test("rejects day 32", () => {
  assert.equal(parseExplicitDate("Due October 32, 2026"), null);
});

test("rejects April 31", () => {
  assert.equal(parseExplicitDate("Due April 31, 2026"), null);
});

// ─── Ambiguous and relative date tests ──────────────────────────────

test("flags 'tomorrow' as relative date", () => {
  const result = parseExplicitDate("Due tomorrow");
  assert.equal(result.date, null);
  assert.equal(result.needsReview, true);
  assert.equal(result.ambiguityReason, "relative-date");
});

test("flags 'today' as relative date", () => {
  const result = parseExplicitDate("Due today");
  assert.equal(result.date, null);
  assert.equal(result.needsReview, true);
  assert.equal(result.ambiguityReason, "relative-date");
});

test("flags 'next Friday' as relative date", () => {
  const result = parseExplicitDate("Due next Friday");
  assert.equal(result.date, null);
  assert.equal(result.needsReview, true);
  assert.equal(result.ambiguityReason, "relative-date");
});

test("flags 'next week' as relative date", () => {
  const result = parseExplicitDate("Due next week");
  assert.equal(result.date, null);
  assert.equal(result.needsReview, true);
  assert.equal(result.ambiguityReason, "relative-date");
});

test("flags date range as ambiguous", () => {
  const result = parseExplicitDate("October 15-20 exam week");
  assert.equal(result.date, null);
  assert.equal(result.needsReview, true);
  assert.equal(result.ambiguityReason, "date-range");
});

test("returns null for text with no date at all", () => {
  assert.equal(parseExplicitDate("Welcome to the course"), null);
});

test("returns null for empty or non-string input", () => {
  assert.equal(parseExplicitDate(""), null);
  assert.equal(parseExplicitDate(null), null);
  assert.equal(parseExplicitDate(undefined), null);
});

// ─── isValidISODate tests ───────────────────────────────────────────

test("isValidISODate accepts valid dates", () => {
  assert.equal(isValidISODate("2026-10-15"), true);
  assert.equal(isValidISODate("2026-01-01"), true);
  assert.equal(isValidISODate("2026-12-31"), true);
});

test("isValidISODate rejects invalid dates", () => {
  assert.equal(isValidISODate("2026-02-30"), false);
  assert.equal(isValidISODate("2026-13-01"), false);
  assert.equal(isValidISODate("2026-00-15"), false);
  assert.equal(isValidISODate("2026-10-32"), false);
});

test("isValidISODate rejects malformed strings", () => {
  assert.equal(isValidISODate("not-a-date"), false);
  assert.equal(isValidISODate(""), false);
  assert.equal(isValidISODate(null), false);
  assert.equal(isValidISODate(undefined), false);
  assert.equal(isValidISODate("2026/10/15"), false);
  assert.equal(isValidISODate("10-15-2026"), false);
});

// ─── Fingerprint tests ─────────────────────────────────────────────

test("fingerprint is stable for identical inputs", () => {
  const input = {
    sourceUrl: "https://learn.example.edu/item/1",
    title: "Homework 1",
    date: "2026-10-15",
    type: "Assignment"
  };
  assert.equal(createFingerprint(input), createFingerprint(input));
});

test("fingerprint is case-insensitive", () => {
  const a = createFingerprint({
    sourceUrl: "https://learn.example.edu/item/1",
    title: "Homework 1",
    date: "2026-10-15",
    type: "Assignment"
  });
  const b = createFingerprint({
    sourceUrl: "https://learn.example.edu/item/1",
    title: "HOMEWORK 1",
    date: "2026-10-15",
    type: "assignment"
  });
  assert.equal(a, b);
});

test("fingerprint changes when fields differ", () => {
  const a = createFingerprint({
    sourceUrl: "https://learn.example.edu/item/1",
    title: "Homework 1",
    date: "2026-10-15",
    type: "Assignment"
  });
  const b = createFingerprint({
    sourceUrl: "https://learn.example.edu/item/2",
    title: "Homework 1",
    date: "2026-10-15",
    type: "Assignment"
  });
  assert.notEqual(a, b);
});

test("fingerprint handles missing fields gracefully", () => {
  const result = createFingerprint({
    sourceUrl: null,
    title: undefined,
    date: "",
    type: "Exam"
  });
  assert.equal(typeof result, "string");
  assert.ok(result.length > 0);
});

// ─── Sanitize tests ────────────────────────────────────────────────

test("sanitizeExcerpt collapses whitespace", () => {
  assert.equal(sanitizeExcerpt("  hello   world  "), "hello world");
});

test("sanitizeExcerpt limits length", () => {
  const long = "a".repeat(2000);
  assert.equal(sanitizeExcerpt(long, 100).length, 100);
});

test("sanitizeExcerpt returns empty for non-string input", () => {
  assert.equal(sanitizeExcerpt(null), "");
  assert.equal(sanitizeExcerpt(undefined), "");
  assert.equal(sanitizeExcerpt(42), "");
});

test("sanitizeTitle limits length", () => {
  const long = "a".repeat(200);
  assert.equal(sanitizeTitle(long).length, 140);
});

test("sanitizeTitle collapses whitespace", () => {
  assert.equal(sanitizeTitle("  hello   world  "), "hello world");
});

// ─── HTML-like title test ───────────────────────────────────────────

test("sanitizeTitle treats HTML tags as literal text", () => {
  const result = sanitizeTitle("<script>alert('xss')</script>");
  // The result should be the literal text, not executed markup
  assert.ok(result.includes("<script>"));
  assert.ok(result.includes("</script>"));
});

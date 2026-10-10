import test from "node:test";
import assert from "node:assert/strict";
import { buildAllDayEvent } from "../src/calendar-payload.js";

// ─── Valid payload tests ────────────────────────────────────────────

test("builds valid all-day event payload", () => {
  const result = buildAllDayEvent({
    title: "Homework 1",
    date: "2026-10-15",
    sourceUrl: "https://blackboard.example.edu/course/1",
    type: "Assignment",
    course: "CS 101",
    details: "Submit through the assignment link."
  });
  assert.equal(result.summary, "CS 101: Homework 1");
  assert.deepEqual(result.start, { date: "2026-10-15" });
  assert.deepEqual(result.end, { date: "2026-10-16" });
  assert.ok(result.description.includes("Assignment"));
  assert.ok(result.description.includes("https://blackboard.example.edu/course/1"));
});

test("builds event without course prefix", () => {
  const result = buildAllDayEvent({
    title: "Midterm",
    date: "2026-11-01",
    sourceUrl: "https://blackboard.example.edu/exam/1"
  });
  assert.equal(result.summary, "Midterm");
});

test("end date wraps across month boundary", () => {
  const result = buildAllDayEvent({
    title: "Test",
    date: "2026-10-31",
    sourceUrl: "https://blackboard.example.edu/test"
  });
  assert.deepEqual(result.end, { date: "2026-11-01" });
});

test("end date wraps across year boundary", () => {
  const result = buildAllDayEvent({
    title: "New Year Test",
    date: "2026-12-31",
    sourceUrl: "https://blackboard.example.edu/test"
  });
  assert.deepEqual(result.end, { date: "2027-01-01" });
});

// ─── Validation tests ──────────────────────────────────────────────

test("throws for missing title", () => {
  assert.throws(
    () => buildAllDayEvent({ title: "", date: "2026-10-15", sourceUrl: "https://blackboard.example.edu/x" }),
    /title/i
  );
});

test("throws for whitespace-only title", () => {
  assert.throws(
    () => buildAllDayEvent({ title: "   ", date: "2026-10-15", sourceUrl: "https://blackboard.example.edu/x" }),
    /title/i
  );
});

test("throws for invalid date", () => {
  assert.throws(
    () => buildAllDayEvent({ title: "Test", date: "2026-02-30", sourceUrl: "https://blackboard.example.edu/x" }),
    /date/i
  );
});

test("throws for missing date", () => {
  assert.throws(
    () => buildAllDayEvent({ title: "Test", date: "", sourceUrl: "https://blackboard.example.edu/x" }),
    /date/i
  );
});

test("throws for non-HTTPS source URL", () => {
  assert.throws(
    () => buildAllDayEvent({ title: "Test", date: "2026-10-15", sourceUrl: "http://blackboard.example.edu/x" }),
    /url/i
  );
});

test("throws for javascript: source URL", () => {
  assert.throws(
    () => buildAllDayEvent({ title: "Test", date: "2026-10-15", sourceUrl: "javascript:alert(1)" }),
    /url/i
  );
});

test("throws for missing source URL", () => {
  assert.throws(
    () => buildAllDayEvent({ title: "Test", date: "2026-10-15", sourceUrl: "" }),
    /url/i
  );
});

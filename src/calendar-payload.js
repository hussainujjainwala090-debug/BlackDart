import { isValidISODate } from "./parser.js";

export function buildAllDayEvent(candidate) {
  if (!candidate.title?.trim()) throw new Error("Event title is required.");
  if (!isValidISODate(candidate.date)) throw new Error("A valid date is required.");
  if (!candidate.sourceUrl || !/^https:\/\//i.test(candidate.sourceUrl)) {
    throw new Error("A valid HTTPS source URL is required.");
  }

  const [year, month, day] = candidate.date.split("-").map(Number);
  const next = new Date(Date.UTC(year, month - 1, day + 1));
  const endDate = [
    next.getUTCFullYear(),
    String(next.getUTCMonth() + 1).padStart(2, "0"),
    String(next.getUTCDate()).padStart(2, "0")
  ].join("-");

  return {
    summary: candidate.course
      ? `${candidate.course}: ${candidate.title.trim()}`
      : candidate.title.trim(),
    description: [
      candidate.type || "Academic event",
      candidate.details || "",
      `Blackboard source: ${candidate.sourceUrl}`
    ].filter(Boolean).join("\n\n"),
    start: { date: candidate.date },
    end: { date: endDate }
  };
}

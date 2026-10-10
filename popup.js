const QUEUE_KEY = "bbCalendarCandidates";
const SYNC_KEY = "bbCalendarSynced";
const $ = id => document.getElementById(id);

/**
 * Safely create a DOM element with optional class and text content.
 * Uses textContent only — never innerHTML.
 */
function make(tag, className, text) {
  const el = document.createElement(tag);
  if (className) el.className = className;
  if (text !== undefined) el.textContent = text;
  return el;
}

/**
 * Create a validated anchor element for a Blackboard source URL.
 * Rejects non-HTTPS URLs and restricts to same-origin or safe links.
 */
function makeSafeLink(urlString, linkText) {
  const a = make("a", "", linkText || "Open source");
  a.target = "_blank";
  a.rel = "noreferrer noopener";
  try {
    const url = new URL(urlString);
    if (url.protocol !== "https:") {
      a.textContent = "(source URL not available)";
      a.removeAttribute("href");
      return a;
    }
    a.href = url.href;
  } catch {
    a.textContent = "(invalid source URL)";
    a.removeAttribute("href");
  }
  return a;
}

async function render() {
  const data = await chrome.storage.local.get([QUEUE_KEY, SYNC_KEY]);
  const queue = data[QUEUE_KEY] || [];
  const synced = data[SYNC_KEY] || {};
  const pending = queue.filter(item => !synced[item.id]);
  $("status").textContent = `${pending.length} candidate(s) awaiting review`;
  $("events").replaceChildren();

  if (!pending.length) {
    $("events").append(make("p", "empty", "No pending candidates. Open a Blackboard course or announcement and refresh."));
    return;
  }

  for (const item of pending) {
    const card = make("article", "event-card");

    // Checkbox + type badge
    const selectLabel = make("label", "select-row");
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = !item.needsReview; // Don't auto-select items that need review
    checkbox.dataset.id = item.id;

    const typeText = item.type || "Unknown";
    const badge = make("span", "type", typeText);
    selectLabel.append(checkbox, badge);

    // Ambiguity warning
    if (item.needsReview) {
      const warning = make("span", "warning-badge", "");
      if (item.ambiguityReason === "relative-date") {
        warning.textContent = " ⚠ Relative date — set manually";
      } else if (item.ambiguityReason === "date-range") {
        warning.textContent = " ⚠ Date range — pick one date";
      } else if (item.ambiguityReason === "year-assumed") {
        warning.textContent = " ⚠ Year not specified — verify";
      } else {
        warning.textContent = " ⚠ Needs review";
      }
      selectLabel.append(warning);
    }

    card.append(selectLabel);

    // Title field
    const titleLabel = make("label", "field-label", "Event title");
    const title = document.createElement("input");
    title.className = "title";
    title.value = item.title;
    title.dataset.id = item.id;
    title.maxLength = 140;
    card.append(titleLabel, title);

    // Course field
    const courseLabel = make("label", "field-label", "Course");
    const course = document.createElement("input");
    course.className = "course";
    course.value = item.course;
    course.dataset.id = item.id;
    card.append(courseLabel, course);

    // Date field
    const dateLabel = make("label", "field-label", "Date");
    const date = document.createElement("input");
    date.type = "date";
    date.className = "date";
    date.value = item.date || "";
    date.dataset.id = item.id;
    if (!item.date) {
      date.classList.add("date-missing");
    }
    card.append(dateLabel, date);

    // Matched text indicator (shows what the parser found)
    if (item.matchedText) {
      const matchLabel = make("p", "matched-text", `Detected: "${item.matchedText}"`);
      card.append(matchLabel);
    }

    // Source details (collapsible)
    const detailsEl = document.createElement("details");
    const summary = make("summary", "", "View source details");
    // Use textContent for the excerpt — never innerHTML
    const excerpt = make("p", "excerpt", item.details);
    const link = makeSafeLink(item.sourceUrl, "Open Blackboard source");
    detailsEl.append(summary, excerpt, link);
    card.append(detailsEl);

    $("events").append(card);
  }
}

function nextISODate(iso) {
  const [y, m, d] = iso.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, d + 1));
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}-${String(date.getUTCDate()).padStart(2, "0")}`;
}

$("refresh").addEventListener("click", () => render().catch(showError));

$("clear").addEventListener("click", async () => {
  if (!confirm("Clear locally stored candidates and sync mappings? Existing Google Calendar events will not be deleted.")) return;
  await chrome.storage.local.remove([QUEUE_KEY, SYNC_KEY]);
  $("result").textContent = "Local extension data cleared. Existing calendar events were not changed.";
  await render();
});

$("approve").addEventListener("click", async () => {
  const button = $("approve");
  button.disabled = true;
  $("result").textContent = "Preparing selected events…";
  try {
    const data = await chrome.storage.local.get([QUEUE_KEY, SYNC_KEY]);
    const queue = data[QUEUE_KEY] || [];
    const synced = data[SYNC_KEY] || {};
    const selected = [...document.querySelectorAll('input[type="checkbox"][data-id]:checked')]
      .map(input => input.dataset.id);

    if (!selected.length) throw new Error("Select at least one candidate.");
    const candidates = [];

    for (const id of selected) {
      const item = queue.find(x => x.id === id);
      if (!item || synced[id]) continue;
      const title = document.querySelector(`.title[data-id="${CSS.escape(id)}"]`).value.trim();
      const course = document.querySelector(`.course[data-id="${CSS.escape(id)}"]`).value.trim();
      const date = document.querySelector(`.date[data-id="${CSS.escape(id)}"]`).value;
      if (!title || !date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        throw new Error("Every selected event needs a title and valid date (YYYY-MM-DD).");
      }
      candidates.push({ ...item, title, course, date });
    }
    if (!candidates.length) throw new Error("No unsynced selected candidates.");

    // Auth is requested only after the user explicitly clicks the approval button.
    const authResult = await chrome.identity.getAuthToken({ interactive: true });
    const token = typeof authResult === "string" ? authResult : authResult?.token;
    if (!token) throw new Error("Google authorization was not completed.");

    let createdCount = 0;
    for (const item of candidates) {
      // Validate source URL before sending to Calendar API.
      let sourceDescription = "Blackboard source";
      try {
        const srcUrl = new URL(item.sourceUrl);
        if (srcUrl.protocol === "https:") {
          sourceDescription = `Blackboard source: ${srcUrl.href}`;
        }
      } catch {
        // Use generic description if URL is invalid
      }

      const endDate = nextISODate(item.date);
      const payload = {
        summary: item.course ? `${item.course}: ${item.title}` : item.title,
        description: [
          item.type || "Academic event",
          item.details || "",
          sourceDescription
        ].filter(Boolean).join("\n\n"),
        start: { date: item.date },
        end: { date: endDate }
      };

      const response = await fetch("https://www.googleapis.com/calendar/v3/calendars/primary/events", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        // Do not mark as synced. Avoid printing tokens or full sensitive API payloads.
        throw new Error(`Google Calendar request failed (${response.status}). Earlier events in this batch may already have been created.`);
      }

      const created = await response.json();
      synced[item.id] = { calendarEventId: created.id, createdAt: new Date().toISOString() };
      await chrome.storage.local.set({ [SYNC_KEY]: synced });
      createdCount++;
    }

    $("result").textContent = `Created ${createdCount} event(s).`;
    await render();
  } catch (error) {
    $("result").textContent = error.message || "Something went wrong.";
  } finally {
    button.disabled = false;
  }
});

function showError(error) {
  $("result").textContent = error.message || "Could not load candidates.";
}

render().catch(showError);

const MONTH_NAMES = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const DOW_NAMES = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
const CATEGORIES = ["Spiritual","Physical","Social","Intellectual"];
const GROUP_SUGGESTIONS = ["Deacons","Teachers","Priests","YW","Stake","All"];
const LEADER_GROUPS = ["Deacons","Teachers","Priests"];

const TABS = [
  { id: "main", label: "Main" },
  { id: "deacons", label: "Deacons" },
  { id: "teachers", label: "Teachers" },
  { id: "priests", label: "Priests" },
  { id: "birthdays", label: "Birthdays" },
  { id: "discussion", label: "Discussion Leaders" },
  { id: "calendar", label: "Calendar" },
];

const today = new Date();

const state = {
  view: "main",
  editMode: false,
  token: sessionStorage.getItem("editToken") || null,
  activities: [],
  birthdays: [],
  leaders: [],
  loaded: { activities: false, birthdays: false, leaders: false },
  loadError: "",
  showPinModal: false,
  pinError: "",
  calendarMonth: today.getMonth() + 1,
  calendarYear: today.getFullYear(),
};

let openForm = null; // { kind: 'activity'|'birthday'|'leader', id: number|null, defaultGroup?: string }
let formInCharge = [];

// ---------- Helpers ----------

function escapeHtml(str) {
  return String(str ?? "").replace(/[&<>"']/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  }[c]));
}

function parseDate(iso) {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function pad2(n) { return String(n).padStart(2, "0"); }

function categoryClass(category) {
  return category ? `cat-${category.toLowerCase()}` : "";
}

async function api(path, options = {}) {
  const headers = Object.assign({}, options.headers);
  if (state.token) headers["Authorization"] = "Bearer " + state.token;
  const res = await fetch(path, { ...options, headers });
  if (res.status === 401) {
    state.token = null;
    sessionStorage.removeItem("editToken");
    state.editMode = false;
    render();
    throw new Error("Session expired — please re-enter the PIN.");
  }
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Request failed" }));
    throw new Error(err.error || "Request failed");
  }
  if (res.status === 204) return null;
  return res.json();
}

async function loadActivities() {
  state.activities = await api("/api/activities");
  state.loaded.activities = true;
}
async function loadBirthdays() {
  state.birthdays = await api("/api/birthdays");
  state.loaded.birthdays = true;
}
async function loadLeaders() {
  state.leaders = await api("/api/discussion-leaders");
  state.loaded.leaders = true;
}

// ---------- Header / Nav ----------

function renderHeader() {
  return `
    <header class="app-header">
      <h1>Rushton View 7th Ward</h1>
      <div class="subtitle">Young Men Activity Calendar · 2026</div>
      <div class="edit-toggle-row">
        <button class="edit-toggle ${state.editMode ? "active" : ""}" data-action="toggle-edit">
          ${state.editMode ? "✓ Edit Mode On" : "🔒 Edit Mode"}
        </button>
      </div>
    </header>
    <datalist id="group-options">
      ${GROUP_SUGGESTIONS.map((g) => `<option value="${escapeHtml(g)}">`).join("")}
    </datalist>
  `;
}

function renderNav() {
  return `
    <nav class="tabs">
      ${TABS.map(
        (t) => `<button class="${state.view === t.id ? "active" : ""}" data-action="tab" data-tab="${t.id}">${t.label}</button>`
      ).join("")}
    </nav>
  `;
}

function renderLoading() {
  return `<div class="empty-state">Loading…</div>`;
}

// ---------- Activities ----------

function renderActivityCard(item) {
  const d = parseDate(item.activity_date);
  const dow = DOW_NAMES[d.getDay()];
  const catClass = categoryClass(item.category);
  const clickable = state.editMode;
  return `
    <div class="card">
      <div class="card-row ${clickable ? "clickable" : ""}" ${clickable ? `data-action="expand" data-kind="activity" data-id="${item.id}"` : ""}>
        <div class="date-badge"><div class="dow">${dow}</div><div class="day">${d.getDate()}</div></div>
        <div class="card-body">
          <div class="card-title ${!item.activity_name ? "empty" : ""}">${escapeHtml(item.activity_name || "(untitled)")}</div>
          <div class="badges">
            ${item.quorum_group ? `<span class="badge group">${escapeHtml(item.quorum_group)}</span>` : ""}
            ${catClass ? `<span class="badge ${catClass}">${escapeHtml(item.category)}</span>` : ""}
          </div>
          ${item.in_charge && item.in_charge.length ? `<div class="chip-row">${item.in_charge.map((n) => `<span class="chip">${escapeHtml(n)}</span>`).join("")}</div>` : ""}
          ${item.needed ? `<div class="meta-text">Needed: ${escapeHtml(item.needed)}</div>` : ""}
          ${item.notes ? `<div class="meta-text">${escapeHtml(item.notes)}</div>` : ""}
        </div>
      </div>
    </div>
  `;
}

function renderActivityForm(item, defaultGroup) {
  const isEdit = !!item;
  const d = item || { activity_date: "", meeting_type: "", quorum_group: defaultGroup || "", category: "", activity_name: "", needed: "", notes: "" };
  return `
    <form class="form-card activity-form" data-kind="activity" ${isEdit ? `data-id="${item.id}"` : ""}>
      <div class="form-field"><label>Date</label><input type="date" name="activity_date" value="${d.activity_date}" required></div>
      <div class="form-field"><label>Meeting Type</label><input type="text" name="meeting_type" value="${escapeHtml(d.meeting_type || "")}"></div>
      <div class="form-field"><label>Group</label><input type="text" name="quorum_group" list="group-options" value="${escapeHtml(d.quorum_group || "")}"></div>
      <div class="form-field"><label>Category</label>
        <select name="category">
          <option value="">None</option>
          ${CATEGORIES.map((c) => `<option value="${c}" ${d.category === c ? "selected" : ""}>${c}</option>`).join("")}
        </select>
      </div>
      <div class="form-field"><label>Activity Name</label><input type="text" name="activity_name" value="${escapeHtml(d.activity_name || "")}"></div>
      <div class="form-field"><label>Needed</label><input type="text" name="needed" value="${escapeHtml(d.needed || "")}"></div>
      <div class="form-field"><label>Notes</label><textarea name="notes">${escapeHtml(d.notes || "")}</textarea></div>
      <div class="form-field">
        <label>In Charge</label>
        <div class="chip-row">${chipRowHtml()}</div>
        <input type="text" id="in-charge-input" placeholder="Type a name, press Enter">
      </div>
      <div class="form-actions">
        <button type="submit" class="btn btn-primary">Save</button>
        <button type="button" class="btn btn-secondary" data-action="cancel-form">Cancel</button>
        ${isEdit ? `<button type="button" class="btn btn-danger" data-action="delete" data-kind="activity" data-id="${item.id}">Delete</button>` : ""}
      </div>
    </form>
  `;
}

function renderActivityListView(filterGroup) {
  if (state.loadError) return `<div class="empty-state">${escapeHtml(state.loadError)}</div>`;
  if (!state.loaded.activities) return renderLoading();
  const items = filterGroup ? state.activities.filter((a) => a.quorum_group === filterGroup) : state.activities;

  let html = "";
  if (state.editMode) {
    html += `<button class="add-btn" data-action="add" data-kind="activity" data-group="${escapeHtml(filterGroup || "")}">+ Add Activity</button>`;
    if (openForm && openForm.kind === "activity" && openForm.id === null) {
      html += renderActivityForm(null, openForm.defaultGroup);
    }
  }

  if (!items.length) {
    html += `<div class="empty-state">No activities yet.</div>`;
  } else {
    let currentMonth = null;
    for (const item of items) {
      const d = parseDate(item.activity_date);
      const label = `${MONTH_NAMES[d.getMonth()]} ${d.getFullYear()}`;
      if (label !== currentMonth) {
        html += `<div class="month-heading">${label}</div>`;
        currentMonth = label;
      }
      if (state.editMode && openForm && openForm.kind === "activity" && openForm.id === item.id) {
        html += renderActivityForm(item, filterGroup);
      } else {
        html += renderActivityCard(item);
      }
    }
  }
  return html;
}

// ---------- Birthdays ----------

function renderBirthdayForm(item) {
  const isEdit = !!item;
  const d = item || { name: "", birth_month: "", birth_day: "", quorum_group: "" };
  return `
    <form class="form-card birthday-form" data-kind="birthday" ${isEdit ? `data-id="${item.id}"` : ""}>
      <div class="form-field"><label>Name</label><input type="text" name="name" value="${escapeHtml(d.name || "")}" required></div>
      <div class="form-field"><label>Month</label>
        <select name="birth_month" required>
          <option value="">Choose…</option>
          ${MONTH_NAMES.map((m, i) => `<option value="${i + 1}" ${Number(d.birth_month) === i + 1 ? "selected" : ""}>${m}</option>`).join("")}
        </select>
      </div>
      <div class="form-field"><label>Day</label><input type="number" name="birth_day" min="1" max="31" value="${d.birth_day || ""}" required></div>
      <div class="form-field"><label>Group (optional)</label>
        <select name="quorum_group">
          <option value="">—</option>
          ${LEADER_GROUPS.map((g) => `<option value="${g}" ${d.quorum_group === g ? "selected" : ""}>${g}</option>`).join("")}
        </select>
      </div>
      <div class="form-actions">
        <button type="submit" class="btn btn-primary">Save</button>
        <button type="button" class="btn btn-secondary" data-action="cancel-form">Cancel</button>
        ${isEdit ? `<button type="button" class="btn btn-danger" data-action="delete" data-kind="birthday" data-id="${item.id}">Delete</button>` : ""}
      </div>
    </form>
  `;
}

function renderBirthdaysView() {
  if (!state.loaded.birthdays) return renderLoading();
  let html = "";
  if (state.editMode) {
    html += `<button class="add-btn" data-action="add" data-kind="birthday">+ Add Birthday</button>`;
    if (openForm && openForm.kind === "birthday" && openForm.id === null) html += renderBirthdayForm(null);
  }
  if (!state.birthdays.length) {
    html += `<div class="empty-state">No birthdays added yet.</div>`;
  } else {
    let currentMonth = null;
    for (const item of state.birthdays) {
      const label = MONTH_NAMES[item.birth_month - 1];
      if (label !== currentMonth) {
        html += `<div class="month-heading">${label}</div>`;
        currentMonth = label;
      }
      if (state.editMode && openForm && openForm.kind === "birthday" && openForm.id === item.id) {
        html += renderBirthdayForm(item);
      } else {
        const clickable = state.editMode;
        html += `
          <div class="card">
            <div class="card-row ${clickable ? "clickable" : ""}" ${clickable ? `data-action="expand" data-kind="birthday" data-id="${item.id}"` : ""}>
              <div class="date-badge"><div class="dow">${MONTH_NAMES[item.birth_month - 1].slice(0, 3)}</div><div class="day">${item.birth_day}</div></div>
              <div class="card-body">
                <div class="card-title">${escapeHtml(item.name)}</div>
                ${item.quorum_group ? `<div class="badges"><span class="badge group">${escapeHtml(item.quorum_group)}</span></div>` : ""}
              </div>
            </div>
          </div>
        `;
      }
    }
  }
  return html;
}

// ---------- Discussion Leaders ----------

function renderLeaderForm(item, defaultGroup) {
  const isEdit = !!item;
  const d = item || { assignment_date: "", quorum_group: defaultGroup || "", leader_name: "", topic: "" };
  return `
    <form class="form-card leader-form" data-kind="leader" ${isEdit ? `data-id="${item.id}"` : ""}>
      <div class="form-field"><label>Sunday</label><input type="date" name="assignment_date" value="${d.assignment_date}" required></div>
      <div class="form-field"><label>Group</label>
        <select name="quorum_group" required>
          <option value="">Choose…</option>
          ${LEADER_GROUPS.map((g) => `<option value="${g}" ${d.quorum_group === g ? "selected" : ""}>${g}</option>`).join("")}
        </select>
      </div>
      <div class="form-field"><label>Leader Name</label><input type="text" name="leader_name" value="${escapeHtml(d.leader_name || "")}" required></div>
      <div class="form-field"><label>Topic (optional)</label><input type="text" name="topic" value="${escapeHtml(d.topic || "")}"></div>
      <div class="form-actions">
        <button type="submit" class="btn btn-primary">Save</button>
        <button type="button" class="btn btn-secondary" data-action="cancel-form">Cancel</button>
        ${isEdit ? `<button type="button" class="btn btn-danger" data-action="delete" data-kind="leader" data-id="${item.id}">Delete</button>` : ""}
      </div>
    </form>
  `;
}

function renderDiscussionView() {
  if (!state.loaded.leaders) return renderLoading();
  let html = "";
  if (state.editMode) {
    html += `<button class="add-btn" data-action="add" data-kind="leader">+ Add Discussion Leader</button>`;
    if (openForm && openForm.kind === "leader" && openForm.id === null) html += renderLeaderForm(null);
  }
  if (!state.leaders.length) {
    html += `<div class="empty-state">No discussion leaders assigned yet.</div>`;
    return html;
  }
  const groups = [...LEADER_GROUPS, ...[...new Set(state.leaders.map((l) => l.quorum_group))].filter((g) => !LEADER_GROUPS.includes(g))];
  for (const group of groups) {
    const items = state.leaders.filter((l) => l.quorum_group === group);
    if (!items.length) continue;
    html += `<div class="month-heading">${escapeHtml(group)}</div>`;
    for (const item of items) {
      if (state.editMode && openForm && openForm.kind === "leader" && openForm.id === item.id) {
        html += renderLeaderForm(item);
      } else {
        const d = parseDate(item.assignment_date);
        const clickable = state.editMode;
        html += `
          <div class="card">
            <div class="card-row ${clickable ? "clickable" : ""}" ${clickable ? `data-action="expand" data-kind="leader" data-id="${item.id}"` : ""}>
              <div class="date-badge"><div class="dow">${DOW_NAMES[d.getDay()]}</div><div class="day">${d.getDate()}</div></div>
              <div class="card-body">
                <div class="card-title">${escapeHtml(item.leader_name)}</div>
                ${item.topic ? `<div class="meta-text">${escapeHtml(item.topic)}</div>` : ""}
              </div>
            </div>
          </div>
        `;
      }
    }
  }
  return html;
}

// ---------- Calendar ----------

function renderCalendarView() {
  if (!state.loaded.activities) return renderLoading();
  const { calendarMonth: month, calendarYear: year } = state;
  const firstDow = new Date(year, month - 1, 1).getDay();
  const daysInMonth = new Date(year, month, 0).getDate();
  const totalCells = Math.ceil((firstDow + daysInMonth) / 7) * 7;

  const byDate = {};
  for (const a of state.activities) {
    (byDate[a.activity_date] = byDate[a.activity_date] || []).push(a);
  }

  let cells = "";
  for (let i = 0; i < totalCells; i++) {
    const dayNum = i - firstDow + 1;
    if (dayNum < 1 || dayNum > daysInMonth) {
      cells += `<div class="calendar-cell empty"></div>`;
      continue;
    }
    const iso = `${year}-${pad2(month)}-${pad2(dayNum)}`;
    const isToday = iso === `${today.getFullYear()}-${pad2(today.getMonth() + 1)}-${pad2(today.getDate())}`;
    const dayActivities = byDate[iso] || [];
    cells += `
      <div class="calendar-cell ${isToday ? "today" : ""}">
        <div class="cell-date">${dayNum}</div>
        ${dayActivities.map((a) => `<div class="cal-item ${categoryClass(a.category) || "cat-none"}">${escapeHtml(a.activity_name || a.quorum_group || "")}${a.quorum_group && a.activity_name ? ` · ${escapeHtml(a.quorum_group)}` : ""}</div>`).join("")}
      </div>
    `;
  }

  return `
    <div class="calendar-header">
      <div class="calendar-title">${MONTH_NAMES[month - 1]} ${year}</div>
      <div class="calendar-nav">
        <button data-action="cal-prev">‹</button>
        <button data-action="cal-next">›</button>
        <button class="print-btn" data-action="print">🖨️ Print</button>
      </div>
    </div>
    <div class="calendar-grid">
      ${DOW_NAMES.map((d) => `<div class="calendar-dow">${d}</div>`).join("")}
      ${cells}
    </div>
  `;
}

// ---------- PIN modal ----------

function renderPinModal() {
  if (!state.showPinModal) return "";
  return `
    <div class="modal-backdrop">
      <div class="modal-box">
        <h2>Enter Edit PIN</h2>
        <form id="pin-form">
          <div class="form-field"><input type="password" name="pin" inputmode="numeric" autofocus></div>
          ${state.pinError ? `<div class="modal-error">${escapeHtml(state.pinError)}</div>` : ""}
          <div class="form-actions">
            <button type="submit" class="btn btn-primary btn-full">Unlock</button>
            <button type="button" class="btn btn-secondary" data-action="close-pin-modal">Cancel</button>
          </div>
        </form>
      </div>
    </div>
  `;
}

// ---------- Main render ----------

function renderView() {
  switch (state.view) {
    case "main": return renderActivityListView(null);
    case "deacons": return renderActivityListView("Deacons");
    case "teachers": return renderActivityListView("Teachers");
    case "priests": return renderActivityListView("Priests");
    case "birthdays": return renderBirthdaysView();
    case "discussion": return renderDiscussionView();
    case "calendar": return renderCalendarView();
    default: return "";
  }
}

function render() {
  const appEl = document.getElementById("app");
  appEl.innerHTML = renderHeader() + renderNav() + `<main id="view-root">${renderView()}</main>` + renderPinModal();
}

// ---------- Event handling ----------

function focusInCharge() {
  const el = document.getElementById("in-charge-input");
  if (el) el.focus();
}

function chipRowHtml() {
  return formInCharge
    .map((n) => `<span class="chip removable">${escapeHtml(n)}<button type="button" data-action="remove-chip" data-name="${escapeHtml(n)}">×</button></span>`)
    .join("");
}

// Chip add/remove only patches the chip row in place — a full render() would
// rebuild the whole form from state and wipe out whatever the user had already
// typed into the other fields, since those live only in the DOM, not in state.
function updateChipRow() {
  const row = document.querySelector(".activity-form .chip-row");
  if (row) row.innerHTML = chipRowHtml();
}

async function handleDelete(kind, id) {
  if (!confirm("Delete this entry?")) return;
  const pathMap = { activity: "activities", birthday: "birthdays", leader: "discussion-leaders" };
  try {
    await api(`/api/${pathMap[kind]}/${id}`, { method: "DELETE" });
    if (kind === "activity") await loadActivities();
    else if (kind === "birthday") await loadBirthdays();
    else await loadLeaders();
    openForm = null;
    render();
  } catch (err) {
    alert(err.message);
  }
}

function setupEvents() {
  const appEl = document.getElementById("app");

  appEl.addEventListener("click", (e) => {
    const target = e.target.closest("[data-action]");
    if (!target) return;
    const action = target.dataset.action;

    if (action === "tab") {
      state.view = target.dataset.tab;
      openForm = null;
      render();
    } else if (action === "toggle-edit") {
      if (state.editMode) {
        state.editMode = false;
        openForm = null;
        render();
      } else if (state.token) {
        state.editMode = true;
        render();
      } else {
        state.showPinModal = true;
        state.pinError = "";
        render();
      }
    } else if (action === "add") {
      openForm = { kind: target.dataset.kind, id: null, defaultGroup: target.dataset.group || "" };
      formInCharge = [];
      render();
    } else if (action === "expand") {
      const kind = target.dataset.kind;
      const id = Number(target.dataset.id);
      if (kind === "activity") {
        const item = state.activities.find((a) => a.id === id);
        formInCharge = item ? [...item.in_charge] : [];
      }
      openForm = { kind, id };
      render();
    } else if (action === "cancel-form") {
      openForm = null;
      formInCharge = [];
      render();
    } else if (action === "remove-chip") {
      formInCharge = formInCharge.filter((n) => n !== target.dataset.name);
      updateChipRow();
      focusInCharge();
    } else if (action === "delete") {
      handleDelete(target.dataset.kind, Number(target.dataset.id));
    } else if (action === "cal-prev") {
      state.calendarMonth--;
      if (state.calendarMonth < 1) { state.calendarMonth = 12; state.calendarYear--; }
      render();
    } else if (action === "cal-next") {
      state.calendarMonth++;
      if (state.calendarMonth > 12) { state.calendarMonth = 1; state.calendarYear++; }
      render();
    } else if (action === "print") {
      window.print();
    } else if (action === "close-pin-modal") {
      state.showPinModal = false;
      render();
    }
  });

  appEl.addEventListener("keydown", (e) => {
    if (e.target.id === "in-charge-input" && e.key === "Enter") {
      e.preventDefault();
      const val = e.target.value.trim();
      if (val) {
        formInCharge.push(val);
        e.target.value = "";
        updateChipRow();
      }
    }
  });

  appEl.addEventListener("submit", async (e) => {
    e.preventDefault();
    const form = e.target;

    if (form.id === "pin-form") {
      const fd = new FormData(form);
      try {
        const data = await fetch("/api/auth", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ pin: fd.get("pin") }),
        });
        if (!data.ok) {
          state.pinError = "Incorrect PIN";
          render();
          return;
        }
        const body = await data.json();
        state.token = body.token;
        sessionStorage.setItem("editToken", body.token);
        state.showPinModal = false;
        state.editMode = true;
        state.pinError = "";
        render();
      } catch {
        state.pinError = "Network error — please try again.";
        render();
      }
      return;
    }

    if (form.classList.contains("activity-form")) {
      const fd = new FormData(form);
      const id = form.dataset.id ? Number(form.dataset.id) : null;
      const existing = id ? state.activities.find((a) => a.id === id) : null;
      const payload = {
        activity_date: fd.get("activity_date"),
        week_of_month: existing ? existing.week_of_month : null,
        meeting_type: fd.get("meeting_type") || null,
        quorum_group: fd.get("quorum_group") || null,
        category: fd.get("category") || null,
        activity_name: fd.get("activity_name") || null,
        needed: fd.get("needed") || null,
        notes: fd.get("notes") || null,
        in_charge: formInCharge,
      };
      try {
        if (id) await api(`/api/activities/${id}`, { method: "PUT", headers: { "content-type": "application/json" }, body: JSON.stringify(payload) });
        else await api("/api/activities", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(payload) });
        await loadActivities();
        openForm = null;
        formInCharge = [];
        render();
      } catch (err) {
        alert(err.message);
      }
    } else if (form.classList.contains("birthday-form")) {
      const fd = new FormData(form);
      const id = form.dataset.id ? Number(form.dataset.id) : null;
      const payload = {
        name: fd.get("name"),
        birth_month: Number(fd.get("birth_month")),
        birth_day: Number(fd.get("birth_day")),
        quorum_group: fd.get("quorum_group") || null,
      };
      try {
        if (id) await api(`/api/birthdays/${id}`, { method: "PUT", headers: { "content-type": "application/json" }, body: JSON.stringify(payload) });
        else await api("/api/birthdays", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(payload) });
        await loadBirthdays();
        openForm = null;
        render();
      } catch (err) {
        alert(err.message);
      }
    } else if (form.classList.contains("leader-form")) {
      const fd = new FormData(form);
      const id = form.dataset.id ? Number(form.dataset.id) : null;
      const payload = {
        assignment_date: fd.get("assignment_date"),
        quorum_group: fd.get("quorum_group"),
        leader_name: fd.get("leader_name"),
        topic: fd.get("topic") || null,
      };
      try {
        if (id) await api(`/api/discussion-leaders/${id}`, { method: "PUT", headers: { "content-type": "application/json" }, body: JSON.stringify(payload) });
        else await api("/api/discussion-leaders", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(payload) });
        await loadLeaders();
        openForm = null;
        render();
      } catch (err) {
        alert(err.message);
      }
    }
  });
}

// ---------- Init ----------

setupEvents();
render();

Promise.all([
  loadActivities().then(render),
  loadBirthdays().then(render),
  loadLeaders().then(render),
]).catch((err) => {
  state.loadError = err.message;
  render();
});

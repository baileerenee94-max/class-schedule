console.log("SCRIPT LOADED");

const SHEET_URL =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vSPXKWimTcq8BlxE-L7uZN3ferzhKLJ_ukIxR5nTMYVg7lJVaPWznxAVNMcdfWO-_JlcjsmJduwKdQ1/pub?output=csv";

let allRows = [];
let SESSION_TYPE = "Day";
let currentDay = "";

/* ======================
   MENU
====================== */
function toggleMenu() {
  const menu = document.getElementById("menuDropdown");
  if (menu) menu.classList.toggle("show");
}

/* ======================
   SESSION AUTO SWITCH
====================== */
function autoSetSessionByTime() {
  const hour = new Date().getHours();
  SESSION_TYPE = hour >= 16 ? "Evening" : "Day";
}

/* ======================
   LIVE WATCHER
====================== */
function startLiveSessionWatcher() {
  let lastSession = SESSION_TYPE;

  setInterval(() => {
    const now = new Date();
    const hour = now.getHours();
    const newSession = hour >= 16 ? "Evening" : "Day";

    // Always refresh (for class end times)
    showDay(currentDay);
    checkSleepMode();

    if (newSession !== lastSession) {
      lastSession = newSession;
      SESSION_TYPE = newSession;
      updateSessionButtons();
    }
  }, 60000);
}

/* ======================
   SESSION BUTTONS
====================== */
function setSession(session) {
  SESSION_TYPE = session;
  updateSessionButtons();
  showDay(currentDay);
  document.getElementById("menuDropdown")?.classList.remove("show");
}

function updateSessionButtons() {
  document.getElementById("dayBtn")?.classList.toggle(
    "active",
    SESSION_TYPE === "Day"
  );
  document.getElementById("eveningBtn")?.classList.toggle(
    "active",
    SESSION_TYPE === "Evening"
  );
}

/* ======================
   TIME FORMAT
====================== */
function formatTime(time24) {
  if (!time24) return "";
  const [h, m] = time24.split(":").map(Number);
  const ampm = h >= 12 ? "PM" : "AM";
  const hour12 = h % 12 || 12;
  return `${hour12}:${m.toString().padStart(2, "0")} ${ampm}`;
}

/* ======================
   DAY DISPLAY
====================== */
function showDay(day) {
  currentDay = day;
  document.getElementById("menuDropdown")?.classList.remove("show");

  const date = getDateForDay(day);
  document.getElementById("day").innerText =
    `${day}'s Schedule — ${date}`;

  renderProgram(day, "RN", "schedule-rn");
  renderProgram(day, "PN", "schedule-pn");
  renderClinicals(day);

}

/* ======================
   DATE MATCHING
====================== */
function getDateForDay(dayName) {
  const today = new Date();
  const days = [
    "Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"
  ];

  let targetIndex = days.indexOf(dayName);
  let diff = targetIndex - today.getDay();
  if (diff < 0) diff += 7;

  const targetDate = new Date(today);
  targetDate.setDate(today.getDate() + diff);

  return targetDate.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric"
  });
}

/* ======================
   CLASS END FILTER
====================== */
function hasClassEnded(endTime) {
  if (!endTime) return false;
  const now = new Date();
  const [h, m] = endTime.split(":").map(Number);
  const end = new Date();
  end.setHours(h, m, 0, 0);
  return now > end;
}

/* ======================
   RENDER CLASSES
====================== */
function renderProgram(day, programName, containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;

  container.innerHTML = "";
  const classesForDay = [];

  allRows.forEach(row => {
    if (
      row.Program &&
      row.Session &&
      row.Day &&
      row.Program.trim().toUpperCase() === programName &&
      row.Session.trim().toUpperCase() === SESSION_TYPE.toUpperCase() &&
      row.Day.trim() === day &&
      !hasClassEnded(row.End)
    ) {
      classesForDay.push({
        start: row.Start,
        end: row.End,
        subject: row.Subject,
        room: row.Room
      });
    }
  });

  classesForDay.sort((a, b) => {
    const [ah, am] = a.start.split(":").map(Number);
    const [bh, bm] = b.start.split(":").map(Number);
    return ah * 60 + am - (bh * 60 + bm);
  });

  classesForDay.forEach(cls => {
    const div = document.createElement("div");
    div.className = "class";
    div.innerHTML =
      `<strong>${cls.subject}</strong><br>` +
      `${cls.room}<br>` +
      `${formatTime(cls.start)}${cls.end ? " – " + formatTime(cls.end) : ""}`;
    container.appendChild(div);
  });

  if (!container.innerHTML) {
    container.innerText = "No classes";
  }
}

function renderClinicals(day) {
  const container = document.getElementById("clinical-list");
  if (!container) return;

  container.innerHTML = "";
  const clinicalClasses = [];

  allRows.forEach(row => {
    const isClinical =
      row.Clinical?.toLowerCase() === "yes" ||
      row.Room?.toLowerCase().includes("clinical") ||
      row.Subject?.toLowerCase().includes("clinical");

    if (
      isClinical &&
      row.Day === day &&
      row.Session?.toUpperCase() === SESSION_TYPE.toUpperCase()
    ) {
      clinicalClasses.push({
        program: row.Program,
        subject: row.Subject,
        room: row.Room,
        start: row.Start,
        end: row.End
      });
    }
  });

  if (!clinicalClasses.length) {
    container.innerText = "No clinicals today";
    return;
  }

  clinicalClasses.forEach(cls => {
    const div = document.createElement("div");
    div.className = "clinical-item";
    div.innerHTML =
      `<strong>${cls.program}</strong> – ${cls.subject}, ` +
      `${cls.room} (${formatTime(cls.start)}${cls.end ? "–" + formatTime(cls.end) : ""})`;
    container.appendChild(div);
  });
}


/* ======================
   SLEEP MODE
====================== */
function checkSleepMode() {
  const now = new Date();
  const mins = now.getHours() * 60 + now.getMinutes();

  const sleepStart = 22 * 60;       // 10:00 PM
  const sleepEnd = 6 * 60 + 30;     // 6:30 AM

  const overlay = document.getElementById("sleepOverlay");
  if (!overlay) return;

  overlay.style.display =
    mins >= sleepStart || mins < sleepEnd ? "block" : "none";
}

/* ======================
   LOAD DATA
====================== */
Papa.parse(SHEET_URL, {
  download: true,
  header: true,
  skipEmptyLines: true,
  complete: results => {
    allRows = results.data;

    autoSetSessionByTime();

    const today = new Date().toLocaleDateString("en-US", {
      weekday: "long"
    });

    showDay(today);
    updateSessionButtons();
    checkSleepMode();
    startLiveSessionWatcher();
  },
  error: err => console.error("CSV error:", err)
});



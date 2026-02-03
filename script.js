console.log("SCRIPT LOADED");

const SHEET_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vSPXKWimTcq8BlxE-L7uZN3ferzhKLJ_ukIxR5nTMYVg7lJVaPWznxAVNMcdfWO-_JlcjsmJduwKdQ1/pub?output=csv";

let allRows = [];

let SESSION_TYPE = "Day";

function autoSetSessionByTime() {
  const now = new Date();
  const hour = now.getHours(); // 0–23

  if (hour >= 16) {
    SESSION_TYPE = "Evening";
  } else {
    SESSION_TYPE = "Day";
  }
}

function startLiveSessionWatcher() {
  let lastSession = SESSION_TYPE;

  setInterval(() => {
    const now = new Date();
    const hour = now.getHours();

    const newSession = hour >= 16 ? "Evening" : "Day";

    if (newSession !== lastSession) {
      lastSession = newSession;
      SESSION_TYPE = newSession;
      updateSessionButtons();
      showDay(currentDay);
    }
  }, 60000); // check every 60 seconds
}

function setSession(session) {
  SESSION_TYPE = session;
  updateSessionButtons();
  showDay(currentDay);
}

function updateSessionButtons() {
  document.getElementById("dayBtn").classList.toggle(
    "active",
    SESSION_TYPE === "Day"
  );

  document.getElementById("eveningBtn").classList.toggle(
    "active",
    SESSION_TYPE === "Evening"
  );
}

function formatTime(time24) {
  const [hour, minute] = time24.split(":").map(Number);
  const ampm = hour >= 12 ? "PM" : "AM";
  const hour12 = hour % 12 || 12;
  return `${hour12}:${minute.toString().padStart(2, "0")} ${ampm}`;
}

let currentDay = "";

function showDay(day) {
  currentDay = day;

  document.getElementById("day").innerText =
    day + "'s Schedule";

  renderProgram(day, "RN", "schedule-rn");
  renderProgram(day, "PN", "schedule-pn");
}

function renderProgram(day, programName, containerId) {
  const container = document.getElementById(containerId);
  container.innerHTML = "";

  const classesForDay = [];

  allRows.forEach(row => {
    if (!row) return;

    const cells = row.split(",").map(c => c.trim());

    const program = cells[0];
    const session = cells[1];
    const rowDay = cells[2];

    if (
      program.trim().toUpperCase() === programName &&
      session.trim().toUpperCase() === SESSION_TYPE.toUpperCase() &&
      rowDay.trim() === day
    ) {
      classesForDay.push({
        start: cells[3],
        end: cells[4],
        subject: cells[5],
        room: cells[6]
      });
    }
  });

  // ✅ SORT ONCE
  classesForDay.sort((a, b) => {
  const [ah, am] = a.start.split(":").map(Number);
  const [bh, bm] = b.start.split(":").map(Number);
  return ah * 60 + am - (bh * 60 + bm);
});

  // ✅ RENDER
  classesForDay.forEach(cls => {
    const div = document.createElement("div");
    div.className = "class";
    div.innerHTML =
      "<strong>" + cls.subject + "</strong><br>" +
      cls.room + "<br>" +
      formatTime(cls.start) + " – " + formatTime(cls.end);

    container.appendChild(div);
  });

  if (!container.innerHTML) {
    container.innerText = "No classes";
  }
}

fetch(SHEET_URL)
  .then(res => res.text())
  .then(text => {
    allRows = text.split(/\r?\n/).slice(1);

    autoSetSessionByTime();
    startLiveSessionWatcher();

    const today = new Date().toLocaleDateString("en-US", {
      weekday: "long"
    });

    showDay(today);
    updateSessionButtons();
  })
  .catch(err => console.error(err));

















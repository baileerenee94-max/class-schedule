console.log("SCRIPT LOADED");

const SHEET_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vSPXKWimTcq8BlxE-L7uZN3ferzhKLJ_ukIxR5nTMYVg7lJVaPWznxAVNMcdfWO-_JlcjsmJduwKdQ1/pub?output=csv";

let allRows = [];

let SESSION_TYPE = "Day";

function toggleMenu() {
  document.getElementById("menuDropdown").classList.toggle("open");
}

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

  // Always re-render (for ended classes)
  showDay(currentDay);

  // Only change session if needed
  if (newSession !== lastSession) {
    lastSession = newSession;
    SESSION_TYPE = newSession;
    updateSessionButtons();
  }
}, 60000); // every 60 seconds
}

function setSession(session) {
  SESSION_TYPE = session;
  updateSessionButtons();
  showDay(currentDay);
  document.getElementById("menuDropdown")?.classList.remove("open");
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
  if (!time24) return "";   // 👈 guard clause
  const [hour, minute] = time24.split(":").map(Number);
  const ampm = hour >= 12 ? "PM" : "AM";
  const hour12 = hour % 12 || 12;
  return `${hour12}:${minute.toString().padStart(2, "0")} ${ampm}`;
}

let currentDay = "";

function showDay(day) {
  currentDay = day;
  document.getElementById("menuDropdown")?.classList.remove("open");
  const today = new Date();

const now = new Date();

const daysOfWeek = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday"
];

const todayIndex = now.getDay();
const selectedIndex = daysOfWeek.indexOf(day);

// Base difference
let diff = selectedIndex - todayIndex;

// 🔁 After Friday 4 PM → shift to next week
const isFriday = todayIndex === 5;
const isAfterCutoff = now.getHours() >= 16;

if (isFriday && isAfterCutoff) {
  diff += 7;
}

// Calculate final date
const selectedDate = new Date(now);
selectedDate.setDate(now.getDate() + diff);

// Format date
const formattedDate = selectedDate.toLocaleDateString("en-US", {
  month: "long",
  day: "numeric"
});

document.getElementById("day").innerHTML =
  `${day}'s Schedule<br><span class="schedule-date">${formattedDate}</span>`;

  renderProgram(day, "RN", "schedule-rn");
  renderProgram(day, "PN", "schedule-pn");
}

function hasClassEnded(endTime) {
  if (!endTime) return false; // no end time = always show

  const now = new Date();
  const [endHour, endMinute] = endTime.split(":").map(Number);

  const end = new Date();
  end.setHours(endHour, endMinute, 0, 0);

  return now > end;
}

function renderProgram(day, programName, containerId) {
  const container = document.getElementById(containerId);
  container.innerHTML = "";

  const classesForDay = [];

  allRows.forEach(row => {
  if (!row) return;

  const program = row.Program;
  const session = row.Session;
  const rowDay = row.Day;

  if (
    program &&
    session &&
    rowDay &&
    program.trim().toUpperCase() === programName &&
    session.trim().toUpperCase() === SESSION_TYPE.toUpperCase() &&
    rowDay.trim() === day
  ) {
    if (!hasClassEnded(row.End)) {
  classesForDay.push({
    start: row.Start,
    end: row.End,
    subject: row.Subject,
    room: row.Room
  });
 }
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
    div.innerHTML = `
  <div class="class-title">${cls.subject}</div>
  <div class="class-room">${cls.room}</div>
  <div class="class-time">
    ${formatTime(cls.start)}${cls.end ? " – " + formatTime(cls.end) : ""}
  </div>
`;

    container.appendChild(div);
  });

  if (!container.innerHTML) {
    container.innerText = "No classes";
  }
}

Papa.parse(SHEET_URL, {
  download: true,
  header: true,
  skipEmptyLines: true,
  complete: function(results) {
    allRows = results.data;

    autoSetSessionByTime();

    const today = new Date().toLocaleDateString("en-US", {
      weekday: "long"
    });

    showDay(today);
    updateSessionButtons();
    startLiveSessionWatcher();
  },
  error: function(err) {
    console.error("CSV parse error:", err);
  }
});
































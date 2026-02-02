const SHEET_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vSPXKWimTcq8BlxE-L7uZN3ferzhKLJ_ukIxR5nTMYVg7lJVaPWznxAVNMcdfWO-_JlcjsmJduwKdQ1/pub?gid=0&single=true&output=csv";

let SESSION_TYPE = "Day";

function setSession(session) {
  SESSION_TYPE = session;
  showDay(currentDay);
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

console.log(program, session, rowDay, "→", SESSION_TYPE, day);
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

  classesForDay.sort((a, b) => a.start.localeCompare(b.start));

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
    const today = new Date().toLocaleDateString("en-US", {
      weekday: "long"
    });
    showDay(today);
  })
  .catch(err => console.error(err));

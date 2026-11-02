"use strict";

/* =====================================
   OUR LITTLE LOVE DIARY
   Browser-only attendance application
===================================== */

const STORAGE_KEY = "our_little_love_diary_v1";

const $ = (id) => document.getElementById(id);

const today = dateKey(new Date());

let currentMonth = new Date(
    new Date().getFullYear(),
    new Date().getMonth(),
    1
);

let editingDate = null;
let draftToday = {
    partner1: null,
    partner2: null
};

let toastTimer;


/* =====================================
   DATE HELPERS
===================================== */

function dateKey(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
}

function parseDate(key) {
    const [year, month, day] = key.split("-").map(Number);
    return new Date(year, month - 1, day);
}

function validDateKey(key) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(key)) {
        return false;
    }

    return dateKey(parseDate(key)) === key;
}

function monthKey(date) {
    return `${date.getFullYear()}-${String(
        date.getMonth() + 1
    ).padStart(2, "0")}`;
}

function formatDate(key, options = {
    day: "numeric",
    month: "long",
    year: "numeric"
}) {
    return parseDate(key).toLocaleDateString(undefined, options);
}


/* =====================================
   DEFAULT DATA
===================================== */

function defaultData() {
    return {
        version: 1,

        profiles: {
            partner1: "Partner 1",
            partner2: "Partner 2"
        },

        records: {}
    };
}


/* =====================================
   VALIDATION
===================================== */

function validAvailability(value) {
    return value === "available" ||
        value === "unavailable";
}

function validRecord(record) {
    return record &&
        typeof record === "object" &&
        validAvailability(record.partner1) &&
        validAvailability(record.partner2);
}

function cleanName(value, fallback) {
    const name = String(value || "").trim().slice(0, 32);

    return name || fallback;
}

function validateBackup(data) {
    if (
        !data ||
        typeof data !== "object" ||
        data.version !== 1 ||
        !data.profiles ||
        !data.records ||
        typeof data.records !== "object" ||
        Array.isArray(data.records)
    ) {
        throw new Error("Invalid Love Diary backup file.");
    }

    const result = defaultData();

    result.profiles.partner1 = cleanName(
        data.profiles.partner1,
        "Partner 1"
    );

    result.profiles.partner2 = cleanName(
        data.profiles.partner2,
        "Partner 2"
    );

    for (const [key, record] of Object.entries(data.records)) {

        if (!validDateKey(key)) {
            throw new Error("Backup contains an invalid date.");
        }

        if (!validRecord(record)) {
            throw new Error("Backup contains invalid attendance.");
        }

        result.records[key] = {
            partner1: record.partner1,
            partner2: record.partner2
        };
    }

    return result;
}


/* =====================================
   LOAD AND SAVE DATA
===================================== */

function loadData() {
    try {
        const saved = localStorage.getItem(STORAGE_KEY);

        if (!saved) {
            return defaultData();
        }

        return validateBackup(JSON.parse(saved));

    } catch (error) {

        console.error(error);

        showToast(
            "Could not read saved data. Starting a fresh diary."
        );

        return defaultData();
    }
}

let data = loadData();


function saveData(message = "") {
    try {

        localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify(data)
        );

        if (message) {
            showToast(message);
        }

        return true;

    } catch (error) {

        console.error(error);

        showToast(
            "Saving failed. Browser storage may be unavailable."
        );

        return false;
    }
}


/* =====================================
   TOAST NOTIFICATIONS
===================================== */

function showToast(message) {

    const toast = $("toast");

    toast.textContent = message;
    toast.classList.add("show");

    clearTimeout(toastTimer);

    toastTimer = setTimeout(() => {
        toast.classList.remove("show");
    }, 2600);
}


/* =====================================
   ATTENDANCE CLASSIFICATION
===================================== */

function classify(record) {

    if (!record) {
        return "unrecorded";
    }

    if (
        record.partner1 === "available" &&
        record.partner2 === "available"
    ) {
        return "both";
    }

    if (
        record.partner1 === "unavailable" &&
        record.partner2 === "unavailable"
    ) {
        return "holiday";
    }

    return "one";
}


/* =====================================
   TODAY'S AVAILABILITY
===================================== */

function updateDraft(partner, value) {

    draftToday[partner] = value;

    renderToday();
}


function renderToday() {

    document.querySelectorAll(".choice").forEach(button => {

        const partner = button.dataset.partner === "1"
            ? "partner1"
            : "partner2";

        button.classList.toggle(
            "active",
            draftToday[partner] === button.dataset.value
        );

        button.setAttribute(
            "aria-pressed",
            String(draftToday[partner] === button.dataset.value)
        );

    });

    const complete =
        validAvailability(draftToday.partner1) &&
        validAvailability(draftToday.partner2);

    if (!complete) {

        $("resultEmoji").textContent = "💞";
        $("resultTitle").textContent = "A day to write together";
        $("resultDescription").textContent =
            "Choose availability for both partners.";

        return;
    }

    const result = getResult(draftToday);

    $("resultEmoji").textContent = result.emoji;
    $("resultTitle").textContent = result.title;
    $("resultDescription").textContent = result.description;
}


function getResult(record) {

    const kind = classify(record);

    if (kind === "both") {

        return {
            emoji: "💞",
            title: "BOTH PRESENT ❤️",
            description: "Two hearts, showing up together. What a lovely day!"
        };

    }

    if (kind === "one") {

        const presentName =
            record.partner1 === "available"
                ? data.profiles.partner1
                : data.profiles.partner2;

        const absentName =
            record.partner1 === "unavailable"
                ? data.profiles.partner1
                : data.profiles.partner2;

        return {
            emoji: "💗",
            title: `${presentName} PRESENT`,
            description: `${absentName} ABSENT · Sending love either way.`
        };

    }

    return {
        emoji: "🌴",
        title: "SHARED HOLIDAY",
        description: "A day off for both hearts. Rest and recharge!"
    };
}


function saveToday() {

    if (
        !validAvailability(draftToday.partner1) ||
        !validAvailability(draftToday.partner2)
    ) {

        showToast(
            "Please choose availability for both partners first."
        );

        return;
    }

    data.records[today] = {
        partner1: draftToday.partner1,
        partner2: draftToday.partner2
    };

    if (saveData("Today's attendance saved with love. ♡")) {
        renderAll();
    }
}


/* =====================================
   PROFILE MANAGEMENT
===================================== */

function renderProfiles() {

    $("name1").value = data.profiles.partner1;
    $("name2").value = data.profiles.partner2;

    $("statName1").textContent =
        data.profiles.partner1.toUpperCase();

    $("statName2").textContent =
        data.profiles.partner2.toUpperCase();

    $("editLabel1").textContent = data.profiles.partner1;
    $("editLabel2").textContent = data.profiles.partner2;
}


function changeName(partner, value) {

    const fallback = partner === "partner1"
        ? "Partner 1"
        : "Partner 2";

    data.profiles[partner] = cleanName(value, fallback);

    if (saveData("Partner name updated. ♡")) {
        renderAll();
    }
}


/* =====================================
   CALENDAR
===================================== */

function renderCalendar() {

    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();

    $("monthLabel").textContent =
        currentMonth.toLocaleDateString(undefined, {
            month: "long",
            year: "numeric"
        });

    const calendar = $("calendar");

    calendar.innerHTML = "";

    const firstDay = new Date(year, month, 1).getDay();

    const totalDays = new Date(
        year,
        month + 1,
        0
    ).getDate();

    // Empty cells before the first day.

    for (let i = 0; i < firstDay; i++) {

        const empty = document.createElement("div");

        empty.className = "day empty";

        calendar.appendChild(empty);
    }

    // Actual calendar dates.

    for (let day = 1; day <= totalDays; day++) {

        const key = dateKey(
            new Date(year, month, day)
        );

        const record = data.records[key];

        const kind = classify(record);

        const cell = document.createElement("button");

        cell.type = "button";

        let className = "day";

        if (kind === "both") className += " both";
        if (kind === "one") className += " one";
        if (kind === "holiday") className += " holiday";

        if (record && !validRecord(record)) {
            className += " incomplete";
        }

        if (key === today) {
            className += " today";
        }

        cell.className = className;

        const number = document.createElement("span");
        number.className = "day-number";
        number.textContent = day;

        const status = document.createElement("span");
        status.className = "day-status";

        if (kind === "both") {
            status.textContent = "Both present";
        } else if (kind === "one") {
            status.textContent = "One present";
        } else if (kind === "holiday") {
            status.textContent = "Holiday";
        } else {
            status.textContent = "+ Add day";
        }

        cell.append(number, status);

        cell.setAttribute(
            "aria-label",
            `${formatDate(key)}: ${status.textContent}`
        );

        cell.addEventListener("click", () => {
            openEditor(key);
        });

        calendar.appendChild(cell);
    }

    // Complete the last calendar row.

    const totalCells = firstDay + totalDays;
    const remaining = (7 - totalCells % 7) % 7;

    for (let i = 0; i < remaining; i++) {

        const empty = document.createElement("div");

        empty.className = "day empty";

        calendar.appendChild(empty);
    }
}


/* =====================================
   MONTHLY STATISTICS
===================================== */

function calculateStats(month) {

    const records = Object.entries(data.records)
        .filter(([date]) => date.startsWith(month));

    const stats = {

        recorded: records.length,

        both: 0,
        one: 0,
        holiday: 0,

        p1Present: 0,
        p1Absent: 0,

        p2Present: 0,
        p2Absent: 0,

        eligible: 0
    };

    for (const [, record] of records) {

        const kind = classify(record);

        stats[kind]++;

        // Shared holidays are excluded from all denominators.

        if (kind === "holiday") {
            continue;
        }

        stats.eligible++;

        if (record.partner1 === "available") {
            stats.p1Present++;
        } else {
            stats.p1Absent++;
        }

        if (record.partner2 === "available") {
            stats.p2Present++;
        } else {
            stats.p2Absent++;
        }
    }

    return stats;
}


function percentage(present, eligible) {

    if (eligible === 0) {
        return "—";
    }

    return Math.round(
        present / eligible * 100
    ) + "%";
}


function updateProgress(id, present, eligible) {

    const progress = $(id);

    const amount = eligible
        ? present / eligible * 100
        : 0;

    progress.style.width = amount + "%";
}


function renderStats() {

    const month = monthKey(currentMonth);

    const stats = calculateStats(month);

    // Partner 1.

    $("percent1").textContent =
        percentage(stats.p1Present, stats.eligible);

    $("counts1").textContent =
        `${stats.p1Present} present · ${stats.p1Absent} absent · ${stats.holiday} holidays`;

    updateProgress(
        "progress1",
        stats.p1Present,
        stats.eligible
    );

    // Partner 2.

    $("percent2").textContent =
        percentage(stats.p2Present, stats.eligible);

    $("counts2").textContent =
        `${stats.p2Present} present · ${stats.p2Absent} absent · ${stats.holiday} holidays`;

    updateProgress(
        "progress2",
        stats.p2Present,
        stats.eligible
    );

    // Combined couple attendance.

    $("combinedPercent").textContent =
        percentage(stats.both, stats.eligible);

    $("combinedCounts").textContent =
        `${stats.both} both present · ${stats.one} one present · ${stats.holiday} holidays`;

    updateProgress(
        "combinedProgress",
        stats.both,
        stats.eligible
    );

    // Monthly report.

    $("bothDays").textContent = stats.both;
    $("oneDays").textContent = stats.one;
    $("holidayDays").textContent = stats.holiday;
    $("totalDays").textContent = stats.recorded;

    const monthName = currentMonth.toLocaleDateString(
        undefined,
        { month: "long" }
    );

    let summary;

    if (stats.recorded === 0) {

        summary =
            `Your ${monthName} story is waiting for its first little note. Every day you show up counts. 💌`;

    } else if (stats.eligible === 0) {

        summary =
            `${monthName} was all about rest and relaxation! You shared ${stats.holiday} holidays together. 🌴`;

    } else {

        summary =
            `In ${monthName}, you recorded ${stats.recorded} days: ` +
            `${stats.both} together, ${stats.one} with one partner present, ` +
            `and ${stats.holiday} shared holidays. ` +
            `Keep writing your beautiful story together! 💗`;
    }

    $("monthlySummary").textContent = summary;
}


/* =====================================
   EDIT PAST ATTENDANCE
===================================== */

function openEditor(key) {

    editingDate = key;

    const record = data.records[key];

    $("editDateTitle").textContent =
        formatDate(key, {
            weekday: "long",
            day: "numeric",
            month: "long",
            year: "numeric"
        });

    $("edit1").value =
        record?.partner1 || "available";

    $("edit2").value =
        record?.partner2 || "available";

    $("deleteBtn").hidden = !record;

    $("editDialog").showModal();
}


function closeEditor() {

    $("editDialog").close();

    editingDate = null;
}


function saveEditedRecord() {

    if (!editingDate) return;

    const partner1 = $("edit1").value;
    const partner2 = $("edit2").value;

    if (
        !validAvailability(partner1) ||
        !validAvailability(partner2)
    ) {

        showToast("Choose availability for both partners.");

        return;
    }

    data.records[editingDate] = {
        partner1,
        partner2
    };

    if (saveData("Attendance updated successfully. ♡")) {

        closeEditor();
        renderAll();
    }
}


function deleteEditedRecord() {

    if (!editingDate) return;

    if (!data.records[editingDate]) return;

    const confirmed = confirm(
        `Delete attendance for ${formatDate(editingDate)}?`
    );

    if (!confirmed) return;

    delete data.records[editingDate];

    if (saveData("Attendance record deleted.")) {

        closeEditor();
        renderAll();
    }
}


/* =====================================
   EXPORT JSON BACKUP
===================================== */

function exportBackup() {

    const backup = {
        ...data,
        exportedAt: new Date().toISOString()
    };

    const json = JSON.stringify(backup, null, 2);

    const blob = new Blob(
        [json],
        { type: "application/json" }
    );

    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");

    link.href = url;

    link.download =
        `our-love-diary-${today}.json`;

    document.body.appendChild(link);

    link.click();

    link.remove();

    URL.revokeObjectURL(url);

    showToast("Your love diary backup is ready! 💌");
}


/* =====================================
   IMPORT JSON BACKUP
===================================== */

async function importBackup(event) {

    const file = event.target.files?.[0];

    if (!file) return;

    try {

        const text = await file.text();

        const imported = validateBackup(
            JSON.parse(text)
        );

        const recordCount =
            Object.keys(imported.records).length;

        const confirmed = confirm(
            `Import ${recordCount} attendance records and replace the entire current diary, including names?\n\nExport your current diary first if you want to keep it.\n\nContinue?`
        );

        if (!confirmed) return;

        const previousData = data;

        data = imported;

        if (saveData("Backup imported successfully. 💗")) {

            draftToday = {
                partner1: data.records[today]?.partner1 || null,
                partner2: data.records[today]?.partner2 || null
            };

            currentMonth = new Date(
                new Date().getFullYear(),
                new Date().getMonth(),
                1
            );

            renderAll();

        } else {

            data = previousData;
            renderAll();
        }

    } catch (error) {

        console.error(error);

        showToast(
            error instanceof SyntaxError
                ? "Invalid JSON file."
                : error.message || "Could not import backup."
        );

    } finally {

        event.target.value = "";
    }
}


/* =====================================
   RESET DIARY
===================================== */

function resetDiary() {

    const confirmed = confirm(
        "Are you sure you want to reset your entire diary?\n\nAll partner names and attendance records saved in this browser will be permanently removed.\n\nExport a backup first if you may need it."
    );

    if (!confirmed) return;

    const oldData = data;

    data = defaultData();

    if (saveData("Your diary has been reset. ♡")) {

        draftToday = {
            partner1: null,
            partner2: null
        };

        currentMonth = new Date(
            new Date().getFullYear(),
            new Date().getMonth(),
            1
        );

        renderAll();

    } else {

        data = oldData;
    }
}


/* =====================================
   NAVIGATION
===================================== */

function previousMonth() {

    currentMonth = new Date(
        currentMonth.getFullYear(),
        currentMonth.getMonth() - 1,
        1
    );

    renderCalendar();
    renderStats();
}


function nextMonth() {

    currentMonth = new Date(
        currentMonth.getFullYear(),
        currentMonth.getMonth() + 1,
        1
    );

    renderCalendar();
    renderStats();
}


function goToToday() {

    currentMonth = new Date(
        new Date().getFullYear(),
        new Date().getMonth(),
        1
    );

    renderAll();

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });
}


/* =====================================
   RENDER EVERYTHING
===================================== */

function renderAll() {

    renderProfiles();
    renderToday();
    renderCalendar();
    renderStats();

}


/* =====================================
   EVENT LISTENERS
===================================== */

// Partner name changes.

$("name1").addEventListener("change", event => {
    changeName("partner1", event.target.value);
});

$("name2").addEventListener("change", event => {
    changeName("partner2", event.target.value);
});


// Today's availability buttons.

document.querySelectorAll(".choice").forEach(button => {

    button.addEventListener("click", () => {

        const partner = button.dataset.partner === "1"
            ? "partner1"
            : "partner2";

        const value = button.dataset.value;

        updateDraft(partner, value);
    });

});


// Save today's attendance.

$("saveTodayBtn").addEventListener(
    "click",
    saveToday
);


// Calendar navigation.

$("prevMonth").addEventListener(
    "click",
    previousMonth
);

$("nextMonth").addEventListener(
    "click",
    nextMonth
);

$("todayBtn").addEventListener(
    "click",
    goToToday
);


// Edit attendance dialog.

$("saveEditBtn").addEventListener(
    "click",
    saveEditedRecord
);

$("deleteBtn").addEventListener(
    "click",
    deleteEditedRecord
);

$("closeDialog").addEventListener(
    "click",
    closeEditor
);


// Clicking outside the dialog closes it.

$("editDialog").addEventListener("click", event => {

    if (event.target === $("editDialog")) {
        closeEditor();
    }

});


// JSON backup.

$("exportBtn").addEventListener(
    "click",
    exportBackup
);

$("importFile").addEventListener(
    "change",
    importBackup
);


// Reset.

$("resetBtn").addEventListener(
    "click",
    resetDiary
);


/* =====================================
   INITIALIZATION
===================================== */

function initialize() {

    $("todayDate").textContent =
        new Date().toLocaleDateString(undefined, {
            weekday: "long",
            day: "numeric",
            month: "long",
            year: "numeric"
        });

    $("year").textContent =
        new Date().getFullYear();

    // Restore today's saved availability.

    const savedToday = data.records[today];

    if (savedToday) {

        draftToday = {
            partner1: savedToday.partner1,
            partner2: savedToday.partner2
        };

    }

    renderAll();

}


// Start the application.

initialize();


// Pure helper functions are exposed for optional testing.

window.LoveDiary = Object.freeze({

    classify,

    calculateStats,

    percentage,

    getData: () => JSON.parse(JSON.stringify(data))

});
/* ================= GLOBAL STATE ================= */
let isMonitoring = false;
let timeoutRef = null;

let totalHits = 0;
let failHits = 0;

let latencyChart;
let indiaChart, usChart, euChart;

let alertsData = [];

/* ================= REGION DATA TRACKING ================= */
let indiaData = [];
let usData = [];
let euData = [];

const MAX_CHART_POINTS = 15;

/* ================= PAGE NAVIGATION ================= */
const navItems = document.querySelectorAll(".nav-item");
const pages = document.querySelectorAll(".page");

navItems.forEach(item => {
item.addEventListener("click", () => {
navItems.forEach(i => i.classList.remove("active"));
pages.forEach(p => p.classList.remove("active"));

item.classList.add("active");
document.getElementById(item.dataset.page + "Page").classList.add("active");
});

});

/* ================= CHART INIT ================= */
function createChart(ctx, color) {
return new Chart(ctx, {
type: "line",
data: {
labels: [],
datasets: [{
data: [],
borderColor: color,
tension: 0.3,
fill: false,
pointRadius: 2
}]
},
options: {
responsive: true,
maintainAspectRatio: false,
plugins: { legend: { display: false } },
scales: {
y: { beginAtZero: false },
x: { display: false }
}
}
});
}

window.onload = () => {
latencyChart = createChart(document.getElementById("latencyChart"), "#6366f1");
indiaChart = createChart(document.getElementById("indiaChart"), "#22c55e");
usChart = createChart(document.getElementById("usChart"), "#3b82f6");
euChart = createChart(document.getElementById("euChart"), "#f59e0b");
console.log("Charts initialized:", { latencyChart, indiaChart, usChart, euChart });
};

/* ================= START / STOP ================= */
document.getElementById("startBtn").addEventListener("click", () => {
const btn = document.getElementById("startBtn");
const url = document.getElementById("apiUrl").value;

if (!url) {
    alert("Enter API URL");
    return;
}

if (isMonitoring) {
    isMonitoring = false;
    clearTimeout(timeoutRef);
    btn.innerText = "START MONITORING";
    btn.classList.remove("stop");
    addLog("⏹ Monitoring stopped");
    return;
}

isMonitoring = true;
totalHits = 0;
failHits = 0;

// Reset region data arrays
indiaData = [];
usData = [];
euData = [];

// Clear all charts
clearAllCharts();

btn.innerText = "STOP MONITORING";
btn.classList.add("stop");

document.getElementById("emptyState").style.display = "none";

console.log("Monitoring started. Data arrays reset.", { indiaData, usData, euData });

runCycle();

});

/* ================= MAIN LOOP ================= */
async function runCycle() {
if (!isMonitoring) return;

const url = document.getElementById("apiUrl").value;

try {
    const res = await fetch("/poll_api", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({ url })
    });

    totalHits++;

    if (!res.ok) throw new Error("API DOWN");

    const data = await res.json();

    updateDashboard(data);

} catch (err) {
    failHits++;
    addLog("❌ API Failure");
    updateStatus("DOWN", 0);
}

updateErrorUI();

timeoutRef = setTimeout(runCycle, 2000);

}

/* ================= HELPERS ================= */
function boundedRandom(min, max) {
    return Math.random() * (max - min) + min;
}

function safeLatency(v) {
    if (typeof v !== 'number' || isNaN(v)) return null;
    return Math.max(0, v);
}

/* ================= UPDATE DASHBOARD ================= */
function updateDashboard(data) {
const originalIndia = data.regions.india.latency;
const originalUs = data.regions.us.latency;
const originalEu = data.regions.eu.latency;

// optimized input safe
const indiaRaw = safeLatency(originalIndia);
const usRaw = safeLatency(originalUs);
const euRaw = safeLatency(originalEu);

// Debug: Log incoming values
console.log("Incoming latencies - India:", indiaRaw, "US:", usRaw, "EU:", euRaw);

// Check if any region is down
const anyDown = indiaRaw === null || usRaw === null || euRaw === null;

// Variation factors (display only; original values remain for alerts)
const indiaAdjusted = indiaRaw !== null ? Math.max(0, indiaRaw + boundedRandom(-20, 20)) : null;
const usAdjusted = usRaw !== null ? Math.max(0, usRaw + boundedRandom(50, 150)) : null;
const euAdjusted = euRaw !== null ? Math.max(0, euRaw + boundedRandom(20, 80)) : null;

const time = new Date().toLocaleTimeString();

// Track region data separately - only with adjusted display values
if (indiaAdjusted !== null) {
    indiaData.push(indiaAdjusted);
    if (indiaData.length > MAX_CHART_POINTS) indiaData.shift();
}

if (usAdjusted !== null) {
    usData.push(usAdjusted);
    if (usData.length > MAX_CHART_POINTS) usData.shift();
}

if (euAdjusted !== null) {
    euData.push(euAdjusted);
    if (euData.length > MAX_CHART_POINTS) euData.shift();
}

// Debug: Check stored data arrays
console.log("Data arrays:", { indiaData: [...indiaData], usData: [...usData], euData: [...euData] });

// Update charts with independent display data
pushChart(latencyChart, time, indiaAdjusted ?? 0);
pushChartRegion(indiaChart, time, indiaAdjusted);
pushChartRegion(usChart, time, usAdjusted);
pushChartRegion(euChart, time, euAdjusted);

updateStatus(data.status, indiaRaw ?? 0);

// Log with original raw values (status readability) and show EU too
const status = anyDown ? "❌ DOWN" : "🟢 UP";
const inStr = indiaRaw !== null ? `${indiaRaw}ms` : "DOWN";
const usStr = usRaw !== null ? `${usRaw}ms` : "DOWN";
const euStr = euRaw !== null ? `${euRaw}ms` : "DOWN";
addLog(`${status} | IN:${inStr} US:${usStr} EU:${euStr}`);

detectAlert(indiaRaw ?? 0, data.regions.india.is_anomaly);
updateInsights(indiaData, usData, euData);

}

/* ================= CLEAR ALL CHARTS ================= */
function clearAllCharts() {
if (latencyChart) {
    latencyChart.data.labels = [];
    latencyChart.data.datasets[0].data = [];
    latencyChart.update();
}
if (indiaChart) {
    indiaChart.data.labels = [];
    indiaChart.data.datasets[0].data = [];
    indiaChart.update();
}
if (usChart) {
    usChart.data.labels = [];
    usChart.data.datasets[0].data = [];
    usChart.update();
}
if (euChart) {
    euChart.data.labels = [];
    euChart.data.datasets[0].data = [];
    euChart.update();
}
console.log("All charts cleared");
}

/* ================= CHART PUSH ================= */
function pushChart(chart, label, value) {
if (!chart) return;

if (chart.data.labels.length > MAX_CHART_POINTS) {
chart.data.labels.shift();
chart.data.datasets[0].data.shift();
}

chart.data.labels.push(label);
chart.data.datasets[0].data.push(value);
chart.update();
}

/* ================= CHART PUSH FOR REGION ================= */
function pushChartRegion(chart, label, value) {
if (!chart || value === null || value === undefined) {
    if (value === null || value === undefined) {
        console.log("Skipping null/undefined value for", label);
    }
    return;
}

if (chart.data.labels.length > MAX_CHART_POINTS) {
chart.data.labels.shift();
chart.data.datasets[0].data.shift();
}

chart.data.labels.push(label);
chart.data.datasets[0].data.push(value);
chart.update();

console.log("Updated chart - Label:", label, "Value:", value, "Total points:", chart.data.labels.length);
}

/* ================= STATUS ================= */
function updateStatus(status, latency) {
const el = document.getElementById("healthStatus");

if (status === "DOWN") {
    el.innerText = "🔴 DOWN";
    el.style.color = "#ef4444";
} else if (latency > 800) {
    el.innerText = "🟡 WARNING";
    el.style.color = "#f59e0b";
} else {
    el.innerText = "🟢 HEALTHY";
    el.style.color = "#22c55e";
}

}

/* ================= LOGS ================= */
function addLog(msg) {
const logDiv = document.getElementById("logEntries");
const time = new Date().toLocaleTimeString();

const div = document.createElement("div");
div.innerHTML = `[${time}] ${msg}`;
logDiv.prepend(div);

if (logDiv.children.length > 50) {
    logDiv.removeChild(logDiv.lastChild);
}

}

/* ================= ERROR PAGE ================= */
function updateErrorUI() {
document.getElementById("totalRequests").innerText = totalHits;
document.getElementById("failedRequests").innerText = failHits;

const percent = totalHits ? ((failHits / totalHits) * 100).toFixed(1) : 0;
document.getElementById("errorPercent").innerText = percent + "%";

}

/* ================= ALERTS ================= */
function detectAlert(latency, isAnomaly) {
if (!isAnomaly && latency < 800) return;

const time = new Date().toLocaleTimeString();
const errorRate = totalHits ? ((failHits / totalHits) * 100).toFixed(1) : 0;

const alert = {
    time,
    latency,
    errorRate,
    status: latency > 800 ? "SPIKE" : "ANOMALY"
};

alertsData.unshift(alert);
renderAlerts();

}

/* ================= RENDER ALERT TABLE ================= */
function renderAlerts() {
const tbody = document.getElementById("alertsTableBody");
tbody.innerHTML = "";

alertsData.forEach(a => {
    const row = `
    <tr>
        <td>${a.time}</td>
        <td>${a.latency}</td>
        <td>${a.errorRate}%</td>
        <td>${a.status}</td>
    </tr>`;
    tbody.innerHTML += row;
});

}
/* ================= INSIGHTS CALCULATION ================= */
function updateInsights(indiaData, usData, euData) {
// Filter out invalid values
const validIndia = indiaData.filter(v => v !== null && v !== undefined && v > 0);
const validUs = usData.filter(v => v !== null && v !== undefined && v > 0);
const validEu = euData.filter(v => v !== null && v !== undefined && v > 0);

// Handle empty arrays
if (validIndia.length === 0 && validUs.length === 0 && validEu.length === 0) {
    document.getElementById("fastestRegion").innerText = "Fastest: -";
    document.getElementById("slowestRegion").innerText = "Slowest: -";
    document.getElementById("avgLatency").innerText = "Avg Latency: -";
    return;
}

// Calculate averages
const avgIndia = validIndia.length > 0 ? Math.round(validIndia.reduce((a, b) => a + b, 0) / validIndia.length) : Infinity;
const avgUs = validUs.length > 0 ? Math.round(validUs.reduce((a, b) => a + b, 0) / validUs.length) : Infinity;
const avgEu = validEu.length > 0 ? Math.round(validEu.reduce((a, b) => a + b, 0) / validEu.length) : Infinity;

// Create map for easier access
const regions = {
    "India": avgIndia,
    "US": avgUs,
    "EU": avgEu
};

// Find fastest and slowest (excluding Infinity)
const validRegions = Object.entries(regions).filter(([_, val]) => val !== Infinity);
if (validRegions.length === 0) {
    document.getElementById("fastestRegion").innerText = "Fastest: -";
    document.getElementById("slowestRegion").innerText = "Slowest: -";
    document.getElementById("avgLatency").innerText = "Avg Latency: -";
    return;
}

const fastest = validRegions.reduce((min, curr) => curr[1] < min[1] ? curr : min);
const slowest = validRegions.reduce((max, curr) => curr[1] > max[1] ? curr : max);

// Calculate overall average
const allValid = [...validIndia, ...validUs, ...validEu];
const overallAvg = allValid.length > 0 ? Math.round(allValid.reduce((a, b) => a + b, 0) / allValid.length) : 0;

// Update insights elements
document.getElementById("fastestRegion").innerText = `Fastest: ${fastest[0]} (${fastest[1]} ms)`;
document.getElementById("slowestRegion").innerText = `Slowest: ${slowest[0]} (${slowest[1]} ms)`;
document.getElementById("avgLatency").innerText = `Avg Latency: ${overallAvg} ms`;
}

/* ================= CLEAR ALERTS ================= */
document.getElementById("clearAlerts").addEventListener("click", () => {
alertsData = [];
renderAlerts();
});

/* ================= CSV DOWNLOAD ================= */
document.getElementById("downloadCSV").addEventListener("click", () => {
let csv = "Time,Latency,ErrorRate,Status\n";

alertsData.forEach(a => {
    csv += `${a.time},${a.latency},${a.errorRate},${a.status}\n`;
});

const blob = new Blob([csv], {type: "text/csv"});
const url = URL.createObjectURL(blob);

const a = document.createElement("a");
a.href = url;
a.download = "alerts.csv";
a.click();

});

/* ================= LOGOUT ================= */
document.getElementById("logoutBtn").addEventListener("click", () => {
location.reload();
});

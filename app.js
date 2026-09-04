/* ==============================================================
   STUDENT OF THE MONTH — app.js
   Handles: navigation, school settings, add-student form,
   Firestore save/load, records filtering, and print generation.
   ============================================================== */

const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];

let allStudents = [];      // cache of records from Firestore
let schoolSettings = { name: "", address: "", logo: "" };

/* ---------------- helpers ---------------- */
const $ = (id) => document.getElementById(id);

function fileToCompressedBase64(file, maxDim = 400, quality = 0.72){
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let { width, height } = img;
        if (width > height && width > maxDim){ height *= maxDim/width; width = maxDim; }
        else if (height > maxDim){ width *= maxDim/height; height = maxDim; }
        const canvas = document.createElement("canvas");
        canvas.width = width; canvas.height = height;
        canvas.getContext("2d").drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL("image/jpeg", quality));
      };
      img.onerror = reject;
      img.src = e.target.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function setDbStatus(text, cls){
  const el = $("dbStatus");
  el.textContent = text;
  el.className = "db-status " + (cls || "");
}

/* ---------------- navigation ---------------- */
document.querySelectorAll(".nav-item[data-tab]").forEach(btn => {
  btn.addEventListener("click", () => switchTab(btn.dataset.tab));
});
document.querySelectorAll("[data-goto]").forEach(btn => {
  btn.addEventListener("click", () => switchTab(btn.dataset.goto));
});

function switchTab(tab){
  document.querySelectorAll(".nav-item[data-tab]").forEach(b => b.classList.toggle("active", b.dataset.tab === tab));
  document.querySelectorAll(".tab-panel").forEach(p => p.classList.toggle("active", p.id === "tab-" + tab));
}

/* ---------------- month dropdowns ---------------- */
function populateMonthSelects(){
  const now = new Date();
  const selMonth = $("selectMonth");
  MONTHS.forEach((m, i) => {
    const opt = document.createElement("option");
    opt.value = m; opt.textContent = m;
    if (i === now.getMonth()) opt.selected = true;
    selMonth.appendChild(opt);
  });
  $("selectYear").value = now.getFullYear();

  $("currentMonthLabel").textContent = `${MONTHS[now.getMonth()]} ${now.getFullYear()}`;
  $("statThisMonthLabel").textContent = `${MONTHS[now.getMonth()]} Honorees`;

  const filterMonth = $("filterMonth");
  MONTHS.forEach(m => {
    const opt = document.createElement("option");
    opt.value = m; opt.textContent = m;
    filterMonth.appendChild(opt);
  });
}

/* ==============================================================
   SCHOOL SETTINGS
   ============================================================== */
let logoBase64 = "";

$("logoDrop").addEventListener("click", () => $("logoInput").click());
$("logoInput").addEventListener("change", async (e) => {
  const file = e.target.files[0];
  if (!file) return;
  logoBase64 = await fileToCompressedBase64(file, 300, 0.85);
  $("logoPreview").src = logoBase64;
  $("logoPreview").classList.remove("hidden");
  $("logoPlaceholder").classList.add("hidden");
});

$("settingsForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const msg = $("settingsMsg");
  msg.textContent = "Saving…"; msg.className = "form-msg";

  schoolSettings = {
    name: $("schoolName").value.trim(),
    address: $("schoolAddress").value.trim(),
    logo: logoBase64 || schoolSettings.logo || ""
  };

  try{
    await db.collection("settings").doc("school").set(schoolSettings);
    msg.textContent = "Settings saved."; msg.className = "form-msg ok";
    applyBranding();
  }catch(err){
    console.error(err);
    msg.textContent = "Could not save settings: " + err.message; msg.className = "form-msg err";
  }
});

function applyBranding(){
  $("brandName").textContent = schoolSettings.name || "Your School Name";
  $("brandAddress").textContent = schoolSettings.address || "School address goes here";
  if (schoolSettings.logo){
    $("brandLogo").src = schoolSettings.logo;
    $("brandLogo").classList.remove("hidden");
  }
}

async function loadSettings(){
  try{
    const doc = await db.collection("settings").doc("school").get();
    if (doc.exists){
      schoolSettings = doc.data();
      $("schoolName").value = schoolSettings.name || "";
      $("schoolAddress").value = schoolSettings.address || "";
      if (schoolSettings.logo){
        $("logoPreview").src = schoolSettings.logo;
        $("logoPreview").classList.remove("hidden");
        $("logoPlaceholder").classList.add("hidden");
      }
      applyBranding();
    }
  }catch(err){ console.error("loadSettings error", err); }
}

/* ==============================================================
   ADD STUDENT FORM
   ============================================================== */
let photoBase64 = "";

$("photoDrop").addEventListener("click", () => $("photoInput").click());
$("photoInput").addEventListener("change", async (e) => {
  const file = e.target.files[0];
  if (!file) return;
  photoBase64 = await fileToCompressedBase64(file, 400, 0.72);
  $("photoPreview").src = photoBase64;
  $("photoPreview").classList.remove("hidden");
  $("photoPlaceholder").classList.add("hidden");
});

$("studentForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const msg = $("formMsg");
  const saveBtn = $("saveBtn");

  const name = $("studentName").value.trim();
  const father = $("fatherName").value.trim();
  const klass = $("studentClass").value.trim();
  const section = $("studentSection").value.trim();
  const month = $("selectMonth").value;
  const year = $("selectYear").value;
  const details = $("additionalDetails").value.trim();
  const reviews = Array.from(document.querySelectorAll("#reviewGrid input:checked")).map(c => c.value);

  if (!name || !father || !klass || !month){
    msg.textContent = "Please fill all required fields."; msg.className = "form-msg err";
    return;
  }

  saveBtn.disabled = true;
  msg.textContent = "Saving…"; msg.className = "form-msg";

  const record = {
    name, father, class: klass, section, month, year: Number(year) || new Date().getFullYear(),
    reviews, details, photo: photoBase64,
    createdAt: firebase.firestore.FieldValue.serverTimestamp()
  };

  try{
    await db.collection("students").add(record);
    msg.textContent = "Saved! Student added successfully."; msg.className = "form-msg ok";
    $("studentForm").reset();
    photoBase64 = "";
    $("photoPreview").classList.add("hidden");
    $("photoPlaceholder").classList.remove("hidden");
    document.querySelectorAll("#reviewGrid input").forEach(c => c.checked = false);
    populateMonthSelects_singleFix();
    switchTab("records");
  }catch(err){
    console.error(err);
    msg.textContent = "Error saving: " + err.message; msg.className = "form-msg err";
  }finally{
    saveBtn.disabled = false;
  }
});

// re-select current month after form reset wipes the <select>
function populateMonthSelects_singleFix(){
  const now = new Date();
  $("selectMonth").value = MONTHS[now.getMonth()];
  $("selectYear").value = now.getFullYear();
}

/* ==============================================================
   LOAD & RENDER RECORDS
   ============================================================== */
function loadStudents(){
  db.collection("students").orderBy("createdAt", "desc")
    .onSnapshot(snap => {
      allStudents = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setDbStatus("Connected", "ok");
      renderDashboard();
      renderClassFilterOptions();
      renderRecords();
    }, err => {
      console.error(err);
      setDbStatus("Connection error", "err");
    });
}

function renderDashboard(){
  const now = new Date();
  $("statTotal").textContent = allStudents.length;
  $("statThisMonth").textContent = allStudents.filter(s => s.month === MONTHS[now.getMonth()] && s.year === now.getFullYear()).length;
  $("statClasses").textContent = new Set(allStudents.map(s => s.class)).size;

  const list = $("recentList");
  if (allStudents.length === 0){
    list.innerHTML = `<p class="empty-note">No students added yet. Click "Add Student of the Month" to begin.</p>`;
    return;
  }
  list.innerHTML = allStudents.slice(0, 6).map(s => `
    <div class="recent-row">
      <img src="${s.photo || placeholderImg()}" alt="">
      <div>
        <div class="r-name">${escapeHtml(s.name)}</div>
        <div class="r-meta">${escapeHtml(s.class)}${s.section ? " · " + escapeHtml(s.section) : ""}</div>
      </div>
      <span class="r-month">${s.month} ${s.year || ""}</span>
    </div>
  `).join("");
}

function renderClassFilterOptions(){
  const classes = [...new Set(allStudents.map(s => s.class).filter(Boolean))].sort();
  const filterClass = $("filterClass");
  const current = filterClass.value;
  filterClass.innerHTML = `<option value="">All Classes</option>` + classes.map(c => `<option value="${escapeHtml(c)}">${escapeHtml(c)}</option>`).join("");
  filterClass.value = current;
}

function getFilteredStudents(){
  const month = $("filterMonth").value;
  const klass = $("filterClass").value;
  return allStudents.filter(s => (!month || s.month === month) && (!klass || s.class === klass));
}

function renderRecords(){
  const list = getFilteredStudents();
  $("recordsCount").textContent = `${list.length} record${list.length === 1 ? "" : "s"}`;
  const grid = $("recordsGrid");

  if (list.length === 0){
    grid.innerHTML = `<p class="empty-note">No records match these filters.</p>`;
    return;
  }

  grid.innerHTML = list.map(s => `
    <div class="rec-card">
      <div class="rec-photo"><img src="${s.photo || placeholderImg()}" alt=""></div>
      <div class="rec-body">
        <div class="rec-name">${escapeHtml(s.name)}</div>
        <div class="rec-meta">Father: ${escapeHtml(s.father || "-")}</div>
        <div class="rec-meta">${escapeHtml(s.class)}${s.section ? " · Section " + escapeHtml(s.section) : ""}</div>
        <div class="rec-badges">${(s.reviews||[]).map(r => `<span class="rec-badge">${escapeHtml(r)}</span>`).join("")}</div>
        <span class="rec-month">${s.month} ${s.year || ""}</span>
        <button class="rec-delete" data-id="${s.id}">Delete</button>
      </div>
    </div>
  `).join("");

  grid.querySelectorAll(".rec-delete").forEach(btn => {
    btn.addEventListener("click", () => deleteStudent(btn.dataset.id));
  });
}

async function deleteStudent(id){
  if (!confirm("Delete this student's record? This cannot be undone.")) return;
  try{
    await db.collection("students").doc(id).delete();
  }catch(err){
    alert("Could not delete: " + err.message);
  }
}

$("filterMonth").addEventListener("change", renderRecords);
$("filterClass").addEventListener("change", renderRecords);
$("clearFilters").addEventListener("click", () => {
  $("filterMonth").value = "";
  $("filterClass").value = "";
  renderRecords();
});

function placeholderImg(){
  return "data:image/svg+xml;utf8," + encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' width='120' height='120'><rect width='100%' height='100%' fill='%23f2ede0'/><text x='50%' y='55%' font-size='40' text-anchor='middle' fill='%23b8923f'>?</text></svg>`
  );
}
function escapeHtml(str){
  return String(str ?? "").replace(/[&<>"']/g, m => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[m]));
}

/* ==============================================================
   PRINT GENERATION
   ============================================================== */
function cardHtml(s){
  return `
    <div class="p-card">
      <img class="p-photo" src="${s.photo || placeholderImg()}" alt="">
      <div class="p-info">
        <div class="p-header">
          ${schoolSettings.logo ? `<img src="${schoolSettings.logo}" alt="">` : ""}
          <span class="p-school">${escapeHtml(schoolSettings.name || "School Name")}</span>
        </div>
        <div class="p-title">Student of the Month</div>
        <div class="p-name">${escapeHtml(s.name)}</div>
        <div class="p-meta">
          Father: ${escapeHtml(s.father || "-")}<br>
          ${escapeHtml(s.class)}${s.section ? " · Section " + escapeHtml(s.section) : ""}
        </div>
        <div class="p-badges">${(s.reviews||[]).map(r => `<span class="p-badge">${escapeHtml(r)}</span>`).join("")}</div>
        <span class="p-month">${s.month} ${s.year || ""}</span>
        ${s.details ? `<div class="p-comment">"${escapeHtml(s.details)}"</div>` : ""}
      </div>
    </div>
  `;
}

function doPrint(html, wrapperClass){
  $("printArea").innerHTML = `<div class="${wrapperClass}">${html}</div>`;
  window.print();
}

/* ---- 1. Single student card ---- */
$("printSingleBtn").addEventListener("click", () => {
  const list = getFilteredStudents();
  if (list.length === 0){ alert("No records to print."); return; }
  const sel = $("singleModalSelect");
  sel.innerHTML = list.map(s => `<option value="${s.id}">${escapeHtml(s.name)} — ${escapeHtml(s.class)} (${s.month})</option>`).join("");
  $("singleModal").classList.remove("hidden");
});
$("singleModalCancel").addEventListener("click", () => $("singleModal").classList.add("hidden"));
$("singleModalConfirm").addEventListener("click", () => {
  const id = $("singleModalSelect").value;
  const student = allStudents.find(s => s.id === id);
  $("singleModal").classList.add("hidden");
  if (student) doPrint(cardHtml(student), "print-single");
});

/* ---- 2. Class-wise cards ---- */
$("printClassBtn").addEventListener("click", () => {
  const classes = [...new Set(getFilteredStudents().map(s => s.class))].sort();
  if (classes.length === 0){ alert("No records to print."); return; }
  const sel = $("classModalSelect");
  sel.innerHTML = classes.map(c => `<option value="${escapeHtml(c)}">${escapeHtml(c)}</option>`).join("");
  $("classModal").classList.remove("hidden");
});
$("classModalCancel").addEventListener("click", () => $("classModal").classList.add("hidden"));
$("classModalConfirm").addEventListener("click", () => {
  const klass = $("classModalSelect").value;
  $("classModal").classList.add("hidden");
  const list = getFilteredStudents().filter(s => s.class === klass);
  const html = `<div class="class-sheet-title">${escapeHtml(schoolSettings.name || "")} — Class ${escapeHtml(klass)} — Students of the Month</div>` + list.map(cardHtml).join("");
  doPrint(html, "print-grid");
});

/* ---- 3. All students on one A4 ---- */
$("printAllBtn").addEventListener("click", () => {
  const list = getFilteredStudents();
  if (list.length === 0){ alert("No records to print."); return; }
  doPrint(list.map(cardHtml).join(""), "print-grid");
});

/* ==============================================================
   INIT
   ============================================================== */
populateMonthSelects();
loadSettings();
loadStudents();

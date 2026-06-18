"use strict";
AdminGuard.protect();
const API = "/api";
let currentPage = 1;
let activeReportId = null;
let allReports = [];

// ── Helpers ─────────────────────────────────────────────
async function apiFetch(url, options = {}) {
  const res = await fetch(url, {
    ...options,
    headers: { "Content-Type": "application/json", ...options.headers },
  });
  const data = await res.json();
  if (!data?.success && res.status === 401) {
    window.location.href = "/login.html?role=admin";
    return null;
  }
  return data;
}

function fmtDate(d) {
  return d
    ? new Date(d).toLocaleDateString("id-ID", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "-";
}
function esc(s) {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}
function showToast(msg, type) {
  const t = document.createElement("div");
  t.className = `fixed bottom-4 right-4 z-50 px-5 py-3 rounded-lg text-white text-sm ${type === "success" ? "bg-green-600" : "bg-red-600"}`;
  t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 3000);
}

// ── Flag Modal ──────────────────────────────────────────
let flagModal = null;

function ensureFlagModal() {
  if (flagModal) return;

  flagModal = document.createElement("div");
  flagModal.id = "flagModal";
  flagModal.className = "fixed inset-0 bg-black bg-opacity-50 hidden z-50 flex items-center justify-center p-4";

  flagModal.innerHTML = `
    <div class="bg-white rounded-xl shadow-2xl max-w-lg w-full max-h-[80vh] flex flex-col">
      <div class="flex justify-between items-center p-5 border-b">
        <h3 class="text-lg font-semibold" id="flagModalTitle">Flag Laporan</h3>
        <button id="closeFlagModal" class="text-gray-400 hover:text-gray-600 text-xl">
          <i class="fas fa-times"></i>
        </button>
      </div>
      <div class="p-5 overflow-y-auto flex-1" id="flagModalBody">
        <!-- flags inserted here -->
      </div>
      <div class="p-5 border-t flex justify-end">
        <button id="flagModalCloseBtn" class="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 transition">
          Tutup
        </button>
      </div>
    </div>
  `;

  document.body.appendChild(flagModal);

  // Close handlers (no inline onclick)
  document.getElementById("closeFlagModal").addEventListener("click", closeFlagModal);
  document.getElementById("flagModalCloseBtn").addEventListener("click", closeFlagModal);
  flagModal.addEventListener("click", function (e) {
    if (e.target === flagModal) closeFlagModal();
  });
}

function openFlagModal(title, contentHTML) {
  ensureFlagModal();
  document.getElementById("flagModalTitle").textContent = title || "Flag Laporan";
  document.getElementById("flagModalBody").innerHTML = contentHTML;
  flagModal.classList.remove("hidden");
  flagModal.classList.add("flex");
}

function closeFlagModal() {
  if (flagModal) {
    flagModal.classList.add("hidden");
    flagModal.classList.remove("flex");
  }
}

// ── Init ────────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", async () => {
  try {
    const me = await apiFetch("/me");
    document.getElementById("adminName").textContent = me?.name || "Admin";
  } catch (_) {}

  await loadFacilities();
  bindEvents();
  doSearch(true);
});

async function loadFacilities() {
  const sel = document.getElementById("facility_id");
  sel.querySelectorAll("option:not(:first-child)").forEach((o) => o.remove());

  const data = await apiFetch(`${API}/admin/facilities`);
  if (data && Array.isArray(data)) {
    data.forEach((f) => {
      const opt = document.createElement("option");
      opt.value = f.id;
      opt.textContent = f.name;
      sel.appendChild(opt);
    });
  }
  const opt = document.createElement("option");
  opt.value = "null";
  opt.textContent = "Lainnya (Tanpa Fasilitas)";
  sel.appendChild(opt);
}

function bindEvents() {
  document.getElementById("searchForm").addEventListener("submit", (e) => {
    e.preventDefault();
    currentPage = 1;
    allReports = [];
    document.getElementById("loadMoreBtn").classList.add("hidden");
    doSearch(true);
  });

  document.getElementById("resetBtn").addEventListener("click", () => {
    document.getElementById("searchForm").reset();
    currentPage = 1;
    allReports = [];
    document.getElementById("resultsBody").innerHTML = "";
    document.getElementById("resultCount").textContent = "";
    document.getElementById("loadMoreBtn").classList.add("hidden");
    document.getElementById("flaggedFilter").checked = false;
  });

  document.getElementById("loadMoreBtn").addEventListener("click", () => {
    currentPage++;
    doSearch(false);
  });

  // Delegated flag button click
  document.getElementById("resultsBody").addEventListener("click", function (e) {
    const btn = e.target.closest(".view-flags-btn");
    if (btn) {
      e.preventDefault();
      const id = btn.dataset.id;
      viewFlags(id);
    }
  });
}

async function doSearch(fresh = true) {
  if (fresh) {
    document.getElementById("resultsBody").innerHTML =
      '<tr><td colspan="8" class="text-center py-6">Memuat...</td></tr>';
    document.getElementById("loadMoreBtn").classList.add("hidden");
  } else {
    const btn = document.getElementById("loadMoreBtn");
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i> Memuat...';
  }

  const params = new URLSearchParams({
    sort_by: document.getElementById("sort_by").value || "created_at",
    order: document.getElementById("order").value || "DESC",
    page: currentPage,
    limit: 15,
  });
  const q = document.getElementById("q").value.trim();
  const status = document.getElementById("status").value;
  const facility_id = document.getElementById("facility_id").value;
  const date_from = document.getElementById("date_from").value;
  const date_to = document.getElementById("date_to").value;
  const flagged = document.getElementById("flaggedFilter")?.checked ? "1" : "";

  if (q) params.set("q", q);
  if (status) params.set("status", status);
  if (facility_id) params.set("facility_id", facility_id);
  if (date_from) params.set("date_from", date_from);
  if (date_to) params.set("date_to", date_to);
  if (flagged) params.set("flagged", flagged);

  const data = await apiFetch(`${API}/reports/search?${params}`);
  if (!data || !Array.isArray(data.data)) {
    document.getElementById("resultsBody").innerHTML =
      '<tr><td colspan="8" class="text-center py-6 text-red-500">Gagal memuat data</td></tr>';
    return;
  }

  document.getElementById("resultCount").textContent =
    `(${data.total} laporan)`;

  if (fresh) {
    allReports = data.data;
  } else {
    allReports = allReports.concat(data.data);
  }

  renderTable(allReports);

  if (allReports.length < data.total) {
    document.getElementById("loadMoreBtn").classList.remove("hidden");
    document.getElementById("loadMoreBtn").disabled = false;
    document.getElementById("loadMoreBtn").innerHTML =
      '<i class="fas fa-chevron-down mr-2"></i> Tampilkan lebih banyak';
  } else {
    document.getElementById("loadMoreBtn").classList.add("hidden");
  }
}

const STATUS_BADGE = {
  new: "bg-blue-100 text-blue-700",
  in_progress: "bg-yellow-100 text-yellow-700",
  resolved: "bg-green-100 text-green-700",
  hidden: "bg-gray-200 text-gray-600",
};

function renderTable(reports) {
  if (!reports || !Array.isArray(reports)) return;
  document.getElementById("resultsBody").innerHTML = reports
    .map(
      (r, i) => `
    <tr class="hover:bg-gray-50">
      <td class="px-4 py-3 text-gray-500">${i + 1}</td>
      <td class="px-4 py-3 max-w-xs">
        <p class="font-medium text-gray-800 truncate">${esc(r.title)}</p>
        <p class="text-xs text-gray-500 truncate">${esc(r.location_text || "-")}</p>
      </td>
      <td class="px-4 py-3">${esc(r.reporter)}</td>
      <td class="px-4 py-3">${esc(r.facility || "-")}</td>
      <td class="px-4 py-3 whitespace-nowrap">${fmtDate(r.created_at)}</td>
      <td class="px-4 py-3 text-center"><i class="fas fa-thumbs-up text-blue-400"></i> ${r.vote_count}</td>
      <td class="px-4 py-3"><span class="px-2 py-0.5 rounded-full text-xs ${STATUS_BADGE[r.status] || "bg-gray-100 text-gray-600"}">${r.status}</span></td>
      <td class="px-4 py-3">
        <div class="flex items-center gap-2">
          <button class="view-flags-btn text-sm ${r.flagged ? "text-red-500" : "text-gray-400"} hover:text-red-700" data-id="${r.id}">
            <i class="fas fa-flag"></i> ${r.flag_count || 0}
          </button>
          <a href="/report-detail?id=${r.id}" class="text-blue-600 hover:underline text-sm">
            <i class="fas fa-eye mr-1"></i> Detail
          </a>
        </div>
      </td>
    </tr>
  `
    )
    .join("");
}

// ── Flag fetching & modal display ───────────────────────
async function viewFlags(reportId) {
  const data = await apiFetch(`${API}/admin/reports/${reportId}/flags`);
  if (!data?.data) return;

  const flags = data.data;
  let html = "";
  if (flags.length === 0) {
    html = '<p class="text-gray-500 text-center py-8">Belum ada flag.</p>';
  } else {
    html = '<ul class="space-y-3">';
    flags.forEach((f) => {
      html += `
        <li class="border rounded-lg p-3">
          <div class="flex items-center justify-between mb-1">
            <span class="font-semibold text-gray-800">${esc(f.User?.name || "Anonim")}</span>
            <span class="text-xs text-gray-400">${fmtDate(f.created_at)}</span>
          </div>
          <p class="text-sm text-gray-600">${esc(f.reason || "Tanpa alasan")}</p>
        </li>
      `;
    });
    html += "</ul>";
  }

  openFlagModal(`Flag Laporan #${reportId}`, html);
}
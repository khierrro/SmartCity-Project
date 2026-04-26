'use strict';
const API = '/api';
let currentPage = 1;
let activeReportId = null;
let currentFilters = {};
let allReports = [];

async function apiFetch(url, options = {}) {
  const res = await fetch(url, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...options.headers },
  });
  const data = await res.json();
  if (!data.success && res.status === 401) {
    window.location.href = '/login.html?role=admin';
    return null;
  }
  return data;
}

document.addEventListener('DOMContentLoaded', async () => {
  try {
    const me = await apiFetch('/me');
    document.getElementById('adminName').textContent = me?.name || 'Admin';
  } catch (_) {}

  await loadFacilities();
  bindEvents();

  // Automatically load all reports on page load
  doSearch(true);
});

async function loadFacilities() {
  const sel = document.getElementById('facility_id');
  // Remove previously added options except the first one (Semua)
  sel.querySelectorAll('option:not(:first-child)').forEach(o => o.remove());

  const data = await apiFetch(`${API}/admin/facilities`);
  if (data && Array.isArray(data)) {
    data.forEach(f => {
      const opt = document.createElement('option');
      opt.value = f.id;
      opt.textContent = f.name;
      sel.appendChild(opt);
    });
  }

  // Add "Lainnya (Tanpa Fasilitas)" option
  const opt = document.createElement('option');
  opt.value = 'null';
  opt.textContent = 'Lainnya (Tanpa Fasilitas)';
  sel.appendChild(opt);
}

function bindEvents() {
  document.getElementById('searchForm').addEventListener('submit', e => {
    e.preventDefault();
    currentPage = 1;
    allReports = [];
    document.getElementById('loadMoreBtn').classList.add('hidden');
    doSearch(true);
  });

  document.getElementById('resetBtn').addEventListener('click', () => {
    document.getElementById('searchForm').reset();
    currentPage = 1;
    allReports = [];
    document.getElementById('resultsBody').innerHTML = '';
    document.getElementById('resultCount').textContent = '';
    document.getElementById('loadMoreBtn').classList.add('hidden');
  });

  document.getElementById('loadMoreBtn').addEventListener('click', () => {
    currentPage++;
    doSearch(false);
  });

  document.getElementById('closeModal').addEventListener('click', closeModal);
  document.getElementById('saveStatusBtn').addEventListener('click', saveStatus);
  document.getElementById('deleteReportBtn').addEventListener('click', deleteReport);
}

async function doSearch(fresh = true) {
  if (fresh) {
    document.getElementById('resultsBody').innerHTML = '<tr><td colspan="8" class="text-center py-6">Memuat...</td></tr>';
    document.getElementById('loadMoreBtn').classList.add('hidden');
  } else {
    const btn = document.getElementById('loadMoreBtn');
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i> Memuat...';
  }

  const params = new URLSearchParams({
    sort_by: document.getElementById('sort_by').value || 'created_at',
    order:   document.getElementById('order').value     || 'DESC',
    page:    currentPage,
    limit:   15
  });

  const q = document.getElementById('q').value.trim();
  const status = document.getElementById('status').value;
  const facility_id = document.getElementById('facility_id').value;
  const date_from = document.getElementById('date_from').value;
  const date_to = document.getElementById('date_to').value;

  if (q)           params.set('q', q);
  if (status)      params.set('status', status);
  if (facility_id) params.set('facility_id', facility_id);
  if (date_from)   params.set('date_from', date_from);
  if (date_to)     params.set('date_to', date_to);

  currentFilters = Object.fromEntries(params.entries());

  const data = await apiFetch(`${API}/reports/search?${params}`);
  if (!data) {
    if (!fresh) enableLoadMoreBtn();
    return;
  }

  document.getElementById('resultCount').textContent = `(${data.total} laporan)`;

  if (fresh) {
    allReports = data.data;
  } else {
    allReports = allReports.concat(data.data);
  }

  renderTable(allReports);

  if (allReports.length < data.total) {
    document.getElementById('loadMoreBtn').classList.remove('hidden');
    enableLoadMoreBtn();
  } else {
    document.getElementById('loadMoreBtn').classList.add('hidden');
  }
}

function enableLoadMoreBtn() {
  const btn = document.getElementById('loadMoreBtn');
  btn.disabled = false;
  btn.innerHTML = '<i class="fas fa-chevron-down mr-2"></i> Tampilkan lebih banyak';
}

const STATUS_BADGE = {
  new:         'bg-blue-100 text-blue-700',
  in_progress: 'bg-yellow-100 text-yellow-700',
  resolved:    'bg-green-100 text-green-700',
  hidden:      'bg-gray-200 text-gray-600',
};

function renderTable(reports) {
  document.getElementById('resultsBody').innerHTML = reports.map((r, i) => `
    <tr class="hover:bg-gray-50 cursor-pointer">
      <td class="px-4 py-3 text-gray-500">${i+1}</td>
      <td class="px-4 py-3 max-w-xs">
        <p class="font-medium text-gray-800 truncate">${esc(r.title)}</p>
        <p class="text-xs text-gray-500 truncate">${esc(r.location_text || '-')}</p>
      </td>
      <td class="px-4 py-3">${esc(r.reporter)}</td>
      <td class="px-4 py-3">${esc(r.facility || '-')}</td>
      <td class="px-4 py-3 whitespace-nowrap">${fmtDate(r.created_at)}</td>
      <td class="px-4 py-3 text-center"><i class="fas fa-thumbs-up text-blue-400"></i> ${r.vote_count}</td>
      <td class="px-4 py-3"><span class="px-2 py-0.5 rounded-full text-xs ${STATUS_BADGE[r.status] || 'bg-gray-100 text-gray-600'}">${r.status}</span></td>
      <td class="px-4 py-3">
        <button onclick="openModal(${r.id})" class="text-blue-600 hover:underline text-sm">
          <i class="fas fa-eye mr-1"></i> Detail
        </button>
      </td>
    </tr>
  `).join('');
}

// ── Modal ─────────────────────────────────────────────────
async function openModal(id) {
  activeReportId = id;
  document.getElementById('detailModal').classList.remove('hidden');
  document.getElementById('modalBody').innerHTML = '<p class="text-center py-6">Memuat...</p>';

  const data = await apiFetch(`${API}/reports/${id}`);
  if (!data) return;
  const r = data.data;

  document.getElementById('modalTitle').textContent = r.title;
  document.getElementById('modalStatusSelect').value = r.status;

  // JSON preview (temporary)
  document.getElementById('modalBody').innerHTML = `
    <pre class="bg-gray-100 p-4 rounded text-xs overflow-auto max-h-60">${JSON.stringify(r, null, 2)}</pre>
  `;
}

function closeModal() {
  document.getElementById('detailModal').classList.add('hidden');
  activeReportId = null;
}

async function saveStatus() {
  if (!activeReportId) return;
  const status = document.getElementById('modalStatusSelect').value;
  const btn = document.getElementById('saveStatusBtn');
  btn.disabled = true; btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';

  const data = await apiFetch(`${API}/reports/${activeReportId}/status`, {
    method: 'PUT',
    body: JSON.stringify({ status })
  });

  btn.disabled = false; btn.innerHTML = '<i class="fas fa-save mr-1"></i> Simpan';
  if (data?.success) {
    showToast('Status diperbarui', 'success');
    // Refresh current results
    currentPage = 1;
    allReports = [];
    doSearch(true);
    closeModal();
  } else {
    showToast('Gagal: ' + (data?.message || 'Error'), 'error');
  }
}

async function deleteReport() {
  if (!activeReportId || !confirm('Hapus permanen?')) return;
  const data = await apiFetch(`${API}/reports/${activeReportId}`, { method: 'DELETE' });
  if (data?.success) {
    showToast('Laporan dihapus', 'success');
    closeModal();
    allReports = allReports.filter(r => r.id !== activeReportId);
    renderTable(allReports);
    document.getElementById('resultCount').textContent = `(${allReports.length} laporan)`;
  } else {
    showToast('Gagal: ' + (data?.message || 'Error'), 'error');
  }
}

// ── Utils ───────────────────────────────────────────────
function fmtDate(d) { return d ? new Date(d).toLocaleDateString('id-ID', { day:'2-digit', month:'short', year:'numeric' }) : '-'; }
function esc(s) { return String(s ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
function showToast(msg, type) {
  const t = document.createElement('div');
  t.className = `fixed bottom-4 right-4 z-50 px-5 py-3 rounded-lg text-white text-sm ${type==='success'?'bg-green-600':'bg-red-600'}`;
  t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 3000);
}

// Expose for inline onclick
window.openModal = openModal;
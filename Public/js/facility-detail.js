// ============================================================
// facility-detail.js – Halaman Detail Fasilitas
// ============================================================

// Helper fetch (konsisten dengan pattern di admin-search.js)
async function apiFetch(url, options = {}) {
  const res = await fetch(url, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

// ---- Konfigurasi tipe fasilitas ----
const typeConfig = {
  hospital:     { label: 'Rumah Sakit', icon: 'fa-hospital',          badgeClass: 'bg-blue-100 text-blue-700' },
  clinic:       { label: 'Klinik',      icon: 'fa-stethoscope',       badgeClass: 'bg-purple-100 text-purple-700' },
  police:       { label: 'Polisi',      icon: 'fa-shield-halved',     badgeClass: 'bg-green-100 text-green-700' },
  fire_station: { label: 'Pemadam',     icon: 'fa-fire-extinguisher', badgeClass: 'bg-red-100 text-red-700' },
};

function getTypeConfig(type) {
  return typeConfig[type] || { label: type, icon: 'fa-building', badgeClass: 'bg-gray-100 text-gray-600' };
}

// ---- Status laporan ----
const statusConfig = {
  pending:  { label: 'Menunggu',  cls: 'status-pending' },
  proses:   { label: 'Diproses',  cls: 'status-proses' },
  selesai:  { label: 'Selesai',   cls: 'status-selesai' },
  ditolak:  { label: 'Ditolak',   cls: 'status-ditolak' },
};

function getStatusConfig(status) {
  return statusConfig[status] || { label: status, cls: 'status-default' };
}

// ---- Format tanggal ----
function formatDate(dateStr) {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
}

// ---- Render satu item laporan ----
function renderReportItem(report) {
  const status = getStatusConfig(report.status);
  return `
    <div class="px-6 py-4 hover:bg-gray-50 transition-colors flex items-center justify-between gap-4">
      <div class="flex-1 min-w-0">
        <a
          href="/pages/report-detail.html?id=${report.id}"
          class="font-medium text-gray-800 hover:text-blue-600 transition-colors text-sm line-clamp-2 block"
        >
          ${report.title || 'Laporan #' + report.id}
        </a>
        <span class="text-xs text-gray-400 mt-0.5 block">
          <i class="fa-regular fa-calendar mr-1"></i>${formatDate(report.created_at)}
        </span>
      </div>
      <span class="shrink-0 text-xs font-semibold px-2.5 py-1 rounded-full ${status.cls}">
        ${status.label}
      </span>
    </div>`;
}

// ---- Render detail fasilitas ----
function renderFacility(facility) {
  const cfg = getTypeConfig(facility.type);

  // Breadcrumb
  document.getElementById('breadcrumbName').textContent = facility.name;
  document.title = `${facility.name} – Smart City`;

  // Gambar atau placeholder
  if (facility.image_path) {
    const img = document.getElementById('facilityImage');
    img.src = facility.image_path;
    img.alt = facility.name;
    img.classList.remove('hidden');
    img.onerror = () => {
      img.classList.add('hidden');
      document.getElementById('facilityImagePlaceholder').classList.remove('hidden');
      document.getElementById('facilityIconPlaceholder').className = `fa-solid ${cfg.icon} text-8xl`;
    };
  } else {
    document.getElementById('facilityImagePlaceholder').classList.remove('hidden');
    document.getElementById('facilityIconPlaceholder').className = `fa-solid ${cfg.icon} text-8xl`;
  }

  // Badge tipe
  const badge = document.getElementById('facilityTypeBadge');
  badge.className = `inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full ${cfg.badgeClass} mb-3`;
  badge.innerHTML = `<i class="fa-solid ${cfg.icon} text-xs"></i> ${cfg.label}`;

  // Teks info
  document.getElementById('facilityName').textContent    = facility.name;
  document.getElementById('facilityAddress').textContent = facility.address || '-';
  document.getElementById('facilityPhone').innerHTML     = facility.phone
    ? `<a href="tel:${facility.phone}" class="text-blue-600 hover:underline">${facility.phone}</a>`
    : '-';
  document.getElementById('facilityHours').textContent   = facility.operating_hours || '-';
  document.getElementById('reportCount').textContent     = facility.report_count ?? 0;
}

// ---- Render daftar laporan ----
function renderReports(reports) {
  const loading = document.getElementById('reportsLoading');
  const empty   = document.getElementById('reportsEmpty');
  const list    = document.getElementById('reportsList');

  loading.classList.add('hidden');

  if (!reports || reports.length === 0) {
    empty.classList.remove('hidden');
    return;
  }

  list.innerHTML = reports.map(renderReportItem).join('');
  list.classList.remove('hidden');
}

// ---- Cek session & init ----
async function init() {
  // 1. Ambil ID dari query string
  const params = new URLSearchParams(window.location.search);
  const facilityId = params.get('id');

  if (!facilityId || isNaN(Number(facilityId))) {
    document.getElementById('loadingState').classList.add('hidden');
    document.getElementById('errorState').classList.remove('hidden');
    return;
  }

  // 2. Cek session login
  try {
    const meData = await apiFetch('/me');
    const user = meData.user || meData;
    if (user && user.name) {
      document.getElementById('userName').textContent = user.name;
      document.getElementById('userName').classList.remove('hidden');
      document.getElementById('logoutBtn').classList.remove('hidden');
    } else {
      document.getElementById('loginBtn').classList.remove('hidden');
    }
  } catch {
    document.getElementById('loginBtn').classList.remove('hidden');
  }

  // 3. Setup logout
  document.getElementById('logoutBtn').addEventListener('click', async (e) => {
    e.preventDefault();
    try { await apiFetch('/logout', { method: 'POST' }); } catch (_) {}
    window.location.href = '/login.html';
  });

  // 4. Ambil detail fasilitas
  try {
    const res = await apiFetch(`/api/facilities/${facilityId}`);
    const facility = res.data;

    document.getElementById('loadingState').classList.add('hidden');
    document.getElementById('mainContent').classList.remove('hidden');

    renderFacility(facility);
  } catch (err) {
    console.error('Gagal memuat fasilitas:', err);
    document.getElementById('loadingState').classList.add('hidden');
    document.getElementById('errorState').classList.remove('hidden');
    return;
  }

  // 5. Ambil laporan terkait
  try {
    const reportsRes = await apiFetch(
      `/api/reports/search?facility_id=${facilityId}&limit=10`
    );

    // Endpoint bisa mengembalikan { data: [...] } atau langsung array
    const reports = Array.isArray(reportsRes)
      ? reportsRes
      : (reportsRes.data || reportsRes.reports || []);

    renderReports(reports);

    // Link "lihat lebih banyak" jika ada banyak laporan
    if (reports.length >= 10) {
      const moreLink = document.getElementById('reportsMoreLink');
      const moreAnchor = document.getElementById('reportsMoreAnchor');
      moreAnchor.href = `/pages/feed.html?facility_id=${facilityId}`;
      moreLink.classList.remove('hidden');
    }
  } catch (err) {
    console.error('Gagal memuat laporan:', err);
    // Tidak perlu error besar, cukup tampilkan empty state laporan
    document.getElementById('reportsLoading').classList.add('hidden');
    document.getElementById('reportsEmpty').classList.remove('hidden');
  }
}

document.addEventListener('DOMContentLoaded', init);
